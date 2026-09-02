// --- Storage Driver (IndexedDB + Storage Persistence) ---
const DB_NAME = 'StackerV2DB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
let dbInstance = null;

async function initDB() {
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist();
    }
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = (e) => {
            dbInstance = e.target.result;
            resolve();
        };
        req.onerror = () => reject(req.error);
    });
}

async function getStorage(key, fallback) {
    if (!dbInstance) return JSON.parse(localStorage.getItem(key)) ?? fallback;
    return new Promise((resolve) => {
        const tx = dbInstance.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result !== undefined ? req.result : (JSON.parse(localStorage.getItem(key)) ?? fallback));
        req.onerror = () => resolve(JSON.parse(localStorage.getItem(key)) ?? fallback);
    });
}

async function setStorage(key, val) {
    localStorage.setItem(key, JSON.stringify(val)); // Mirror to LocalStorage
    if (!dbInstance) return;
    const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(val, key);
}

// --- App State ---
let pending = 0;
let completed = 0;
let lifetime = 0;
let streak = 0;
let dailyTotal = 0;
let lastDate = null;
let historyLog = [];

let undoBuffer = null;
let undoTimeout = null;

const getISODate = (d = new Date()) => d.toISOString().split('T')[0];
const todayStr = getISODate();

// --- Hardware Synthesizer ---
let audioCtx;
function playThwomp(freq = 600) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
}

// --- Lifecycle & Date Engine ---
async function bootEngine() {
    await initDB();
    pending = await getStorage('stackerPending', 0);
    completed = await getStorage('stackerCompleted', 0);
    lifetime = await getStorage('stackerLifetime', 0);
    streak = await getStorage('stackerStreak', 0);
    dailyTotal = await getStorage('stackerDailyTotal', 0);
    lastDate = await getStorage('stackerDate', null);
    historyLog = await getStorage('stackerHistory', []);

    evaluateDateTransitions();
    calculatePresetValues();
    updateUI();
}

function evaluateDateTransitions() {
    if (!lastDate) {
        lastDate = todayStr;
        persistState();
        return;
    }

    if (lastDate !== todayStr) {
        const now = new Date();
        const isPastNoon = now.getHours() >= 12;
        
        // Show grace period banner if before noon and unresolved work exists
        if (!isPastNoon && dailyTotal > 0 && completed < dailyTotal) {
            document.getElementById('grace-banner').style.display = 'flex';
        } else {
            finalizePastDay(completed >= dailyTotal && dailyTotal > 0 ? 'completed' : 'missed');
        }
    }
}

function finalizePastDay(status, backfilledBricks = 0) {
    const finalCompleted = completed + backfilledBricks;
    if (dailyTotal > 0 || status === 'rest') {
        historyLog.unshift({
            date: lastDate,
            target: dailyTotal,
            completed: finalCompleted,
            status: status
        });
        if (status === 'completed') streak += 1;
        else if (status === 'missed') streak = 0;
        // status === 'rest' keeps streak locked
    }

    lifetime += backfilledBricks;
    pending = 0;
    completed = 0;
    dailyTotal = 0;
    lastDate = todayStr;
    document.getElementById('grace-banner').style.display = 'none';

    persistState();
    updateUI();
}

function resolveGrace(action) {
    if (action === 'backfill') {
        const amt = parseInt(prompt("Enter bricks finished yesterday:", "0")) || 0;
        finalizePastDay(amt + completed >= dailyTotal ? 'completed' : 'missed', amt);
    } else if (action === 'rest') {
        finalizePastDay('rest', 0);
    } else {
        finalizePastDay('missed', 0);
    }
}

// --- Target Presets (Rolling 7-Day Median) ---
function get7DayMedian() {
    const activeDays = historyLog
        .filter(item => item.status === 'completed' || item.status === 'missed')
        .slice(0, 7)
        .map(i => i.completed)
        .sort((a, b) => a - b);

    if (activeDays.length === 0) return 20;
    const mid = Math.floor(activeDays.length / 2);
    return activeDays.length % 2 !== 0 ? activeDays[mid] : Math.round((activeDays[mid - 1] + activeDays[mid]) / 2);
}

function calculatePresetValues() {
    const median = get7DayMedian();
    document.getElementById('preset-val-light').textContent = Math.round(median * 0.7);
    document.getElementById('preset-val-std').textContent = median;
    document.getElementById('preset-val-push').textContent = Math.round(median * 1.2);
}

function toggleTargetSelector() {
    const el = document.getElementById('target-selector-row');
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
    calculatePresetValues();
}

function applyPreset(type) {
    const median = get7DayMedian();
    let val = median;
    if (type === 'light') val = Math.round(median * 0.7);
    if (type === 'push') val = Math.round(median * 1.2);

    dailyTotal = val;
    pending = val;
    completed = 0;
    document.getElementById('target-selector-row').style.display = 'none';
    persistState();
    updateUI();
    playThwomp(700);
}

// --- Execution & Tactile Feedback ---
function transferBricks(count) {
    if (pending <= 0) return;
    const actual = Math.min(count, pending);

    // Save for undo buffer
    setUndoBuffer(actual);

    pending -= actual;
    completed += actual;
    lifetime += actual;

    playThwomp();
    persistState();
    updateUI();

    if (dailyTotal > 0 && completed >= dailyTotal && typeof confetti === 'function') {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
    }
}

function setUndoBuffer(count) {
    clearTimeout(undoTimeout);
    undoBuffer = count;
    const btn = document.getElementById('btn-undo');
    document.getElementById('undo-count').textContent = count;
    btn.style.display = 'block';

    undoTimeout = setTimeout(() => {
        undoBuffer = null;
        btn.style.display = 'none';
    }, 5000);
}

function undoLastAction() {
    if (!undoBuffer) return;
    pending += undoBuffer;
    completed -= undoBuffer;
    lifetime -= undoBuffer;
    undoBuffer = null;
    clearTimeout(undoTimeout);
    document.getElementById('btn-undo').style.display = 'none';

    persistState();
    updateUI();
    playThwomp(300);
}

function addMoreTarget() {
    const count = parseInt(prompt("Add extra overtime bricks:"));
    if (!isNaN(count) && count > 0) {
        dailyTotal += count;
        pending += count;
        persistState();
        updateUI();
        playThwomp(700);
    }
}

// --- UI Synchronization ---
function updateUI() {
    document.getElementById('pending-count').textContent = pending;
    document.getElementById('completed-count').textContent = completed;
    document.getElementById('lifetime-display').textContent = `🧱 Lifetime: ${lifetime}`;
    document.getElementById('streak-display').textContent = `🔥 Streak: ${streak}`;

    const total = dailyTotal > 0 ? dailyTotal : (pending + completed);
    const pct = total > 0 ? Math.min((completed / total) * 100, 100) : 0;
    document.getElementById('progress-bar').style.width = `${pct}%`;

    const statusMsg = document.getElementById('status-msg');
    const overtimeBtn = document.getElementById('btn-more');
    const setTargetBtn = document.getElementById('btn-set');

    if (dailyTotal > 0 && completed >= dailyTotal) {
        statusMsg.textContent = "Daily target crushed! Overtime active.";
        statusMsg.style.color = "#2ecc71";
        overtimeBtn.style.display = "block";
        setTargetBtn.style.display = "none";
    } else if (dailyTotal > 0) {
        statusMsg.textContent = `Pending operations: ${pending}`;
        statusMsg.style.color = "#888";
        overtimeBtn.style.display = "none";
        setTargetBtn.style.display = "block";
    } else {
        statusMsg.textContent = "Hardware online. Set a daily target.";
        statusMsg.style.color = "#888";
        overtimeBtn.style.display = "none";
        setTargetBtn.style.display = "block";
    }
}

// --- Diagnostics ---
function calculateAnalytics() {
    const medVal = get7DayMedian();
    document.getElementById('stat-median').textContent = medVal;

    let peak = completed;
    let successCount = (dailyTotal > 0 && completed >= dailyTotal) ? 1 : 0;
    let evalCount = dailyTotal > 0 ? 1 : 0;

    historyLog.forEach(h => {
        if (h.completed > peak) peak = h.completed;
        if (h.status === 'completed') successCount++;
        if (h.status !== 'rest') evalCount++;
    });

    document.getElementById('stat-peak').textContent = peak;
    document.getElementById('stat-eff').textContent = evalCount > 0 ? `${Math.round((successCount / evalCount) * 100)}%` : '0%';

    // Feed
    const historyBox = document.getElementById('analytics-history-log');
    historyBox.innerHTML = historyLog.length === 0 ? '<p>No records.</p>' : '';
    historyLog.slice(0, 5).forEach(e => {
        const div = document.createElement('div');
        div.textContent = `[${e.date}] ${e.status.toUpperCase()} - ${e.completed}/${e.target}`;
        historyBox.appendChild(div);
    });

    // Detailed Ledger
    const tbody = document.getElementById('ledger-table-body');
    tbody.innerHTML = '';
    historyLog.forEach(e => {
        const tr = document.createElement('tr');
        const cssClass = e.status === 'completed' ? 'ledger-success' : (e.status === 'rest' ? 'ledger-rest' : 'ledger-miss');
        tr.innerHTML = `
            <td>${e.date}</td>
            <td>${e.target}</td>
            <td>${e.completed}</td>
            <td class="${cssClass}">${e.status.toUpperCase()}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Backup & Restore Engine ---
function exportDataBackup() {
    const data = { pending, completed, lifetime, streak, dailyTotal, lastDate, historyLog };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stacker_backup_${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importDataBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            pending = data.pending || 0;
            completed = data.completed || 0;
            lifetime = data.lifetime || 0;
            streak = data.streak || 0;
            dailyTotal = data.dailyTotal || 0;
            lastDate = data.lastDate || todayStr;
            historyLog = data.historyLog || [];

            persistState();
            updateUI();
            alert("Terminal data restored successfully.");
        } catch (err) {
            alert("Invalid backup configuration file.");
        }
    };
    reader.readAsText(file);
}

// --- Modals & Utilities ---
function toggleModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
    playThwomp();
}

function toggleLedgerView(show) {
    document.getElementById('analytics-summary-view').style.display = show ? 'none' : 'block';
    document.getElementById('analytics-ledger-view').style.display = show ? 'block' : 'none';
    playThwomp();
}

function persistState() {
    setStorage('stackerPending', pending);
    setStorage('stackerCompleted', completed);
    setStorage('stackerLifetime', lifetime);
    setStorage('stackerStreak', streak);
    setStorage('stackerDailyTotal', dailyTotal);
    setStorage('stackerDate', lastDate);
    setStorage('stackerHistory', historyLog);
}

function hardResetSystem() {
    if (confirm("Execute hard factory purge? All local databases will be cleared.")) {
        localStorage.clear();
        if (dbInstance) {
            const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
        }
        location.reload();
    }
}

// Ignition
bootEngine();




