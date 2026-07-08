// Load Data Elements
let pending = parseInt(localStorage.getItem('stackerPending')) || 0;
let completed = parseInt(localStorage.getItem('stackerCompleted')) || 0;
let lifetime = parseInt(localStorage.getItem('stackerLifetime')) || 0;
let streak = parseInt(localStorage.getItem('stackerStreak')) || 0;
let lastDate = localStorage.getItem('stackerDate');
let dailyTotal = parseInt(localStorage.getItem('stackerDailyTotal')) || 0;
let historyLog = JSON.parse(localStorage.getItem('stackerHistory')) || [];

const today = new Date().toDateString();

// Hardware Audio Engine
let audioCtx;

function playThwompSound() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        console.log("Audio pipeline bypass:", e);
    }
}

// Modal Toggle Mechanics
function toggleModal(id) {
    const modal = document.getElementById(id);
    if (modal.style.display === "flex") {
        modal.style.display = "none";
    } else {
        modal.style.display = "flex";
        playThwompSound();
    }
}

// Ledger Display View State Switcher
function toggleLedgerView(showLedger) {
    const summaryDiv = document.getElementById('analytics-summary-view');
    const ledgerDiv = document.getElementById('analytics-ledger-view');
    playThwompSound();
    if (showLedger) {
        summaryDiv.style.display = "none";
        ledgerDiv.style.display = "block";
    } else {
        summaryDiv.style.display = "block";
        ledgerDiv.style.display = "none";
    }
}

// Active Processing Day Transition
if (lastDate !== today) {
    if (lastDate && dailyTotal > 0) {
        historyLog.push({ date: lastDate, completed: completed, target: dailyTotal });
        localStorage.setItem('stackerHistory', JSON.stringify(historyLog));
    }
    if (lastDate && pending > 0) streak = 0; 
    
    pending = 0;
    completed = 0;
    dailyTotal = 0;
    localStorage.setItem('stackerDate', today);
    saveData();
}

function saveData() {
    localStorage.setItem('stackerPending', pending);
    localStorage.setItem('stackerCompleted', completed);
    localStorage.setItem('stackerLifetime', lifetime);
    localStorage.setItem('stackerStreak', streak);
    localStorage.setItem('stackerDailyTotal', dailyTotal);
}

function updateUI() {
    document.getElementById('pending-count').innerText = pending;
    document.getElementById('completed-count').innerText = completed;
    document.getElementById('lifetime-display').innerText = `🧱 Lifetime: ${lifetime}`;
    document.getElementById('streak-display').innerText = `🔥 Streak: ${streak}`;

    let progress = 0;
    if (dailyTotal > 0) progress = (completed / dailyTotal) * 100;
    progress = Math.min(progress, 100);
    document.getElementById('progress-bar').style.width = `${progress}%`;

    const btnSet = document.getElementById('btn-set');
    const btnOne = document.getElementById('btn-one');
    const btnBulk = document.getElementById('btn-bulk');
    const btnMore = document.getElementById('btn-more');

    if (pending === 0 && completed === 0) {
        btnSet.style.display = "block";
        btnOne.style.display = "none";
        btnBulk.style.display = "none";
        btnMore.style.display = "none";
    } else if (pending > 0) {
        btnSet.style.display = "none";
        btnOne.style.display = "block";
        btnBulk.style.display = "block";
        btnMore.style.display = "none";
    } else if (pending === 0 && completed > 0) {
        btnSet.style.display = "none";
        btnOne.style.display = "none";
        btnBulk.style.display = "none";
        btnMore.style.display = "block";
    }
    saveData();
}

// Analytics Processing Logic Engine (FIXED)
function calculateAnalytics() {
    let virtualHistory = [...historyLog];
    
    // Include current live active day tracking into analytics display
    if (dailyTotal > 0 || completed > 0) {
        virtualHistory.push({ date: today, completed: completed, target: dailyTotal });
    }

    // Target table body elements
    const summaryBox = document.getElementById('analytics-history-log');
    const tableBody = document.getElementById('ledger-table-body');

    if (virtualHistory.length === 0 || (virtualHistory.length === 1 && virtualHistory[0].target === 0)) {
        document.getElementById('stat-avg').innerText = "0.0";
        document.getElementById('stat-peak').innerText = "0";
        document.getElementById('stat-eff').innerText = "0%";
        summaryBox.innerText = "No operations executed in timeline.";
        tableBody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:#555;'>NO HISTORY LOGGED YET</td></tr>";
        return;
    }

    let totalCompleted = 0;
    let highestPeak = 0;
    let successfulDays = 0;
    let summaryHTML = "";
    let ledgerHTML = "";

    virtualHistory.forEach(entry => {
        totalCompleted += entry.completed;
        if (entry.completed > highestPeak) highestPeak = entry.completed;
        
        let isSuccess = entry.completed >= entry.target && entry.target > 0;
        if (isSuccess) successfulDays++;
        
        // Short Format Summary
        summaryHTML += `<div>• ${entry.date.substring(4, 10)}: ${entry.completed}/${entry.target} Bricks</div>`;
        
        // Full Details Tabular Ledger Format
        let shortDate = entry.date.substring(4, 10); 
        let percentage = entry.target > 0 ? Math.round((entry.completed / entry.target) * 100) : 0;
        let accClass = isSuccess ? "ledger-success" : "ledger-miss";
        
        ledgerHTML += `<tr>
            <td>${shortDate}</td>
            <td>${entry.target}</td>
            <td>${entry.completed}</td>
            <td class="${accClass}">${percentage}%</td>
        </tr>`;
    });

    let avgValue = (totalCompleted / virtualHistory.length).toFixed(1);
    let efficiencyRate = Math.round((successfulDays / virtualHistory.length) * 100);

    document.getElementById('stat-avg').innerText = avgValue;
    document.getElementById('stat-peak').innerText = highestPeak;
    document.getElementById('stat-eff').innerText = `${efficiencyRate}%`;
    summaryBox.innerHTML = summaryHTML;
    tableBody.innerHTML = ledgerHTML;
}


function setTarget() {
    let target = prompt("Set today's target (Number of bricks):");
    if (target && !isNaN(target) && target > 0) {
        pending = parseInt(target);
        dailyTotal = pending;
        document.getElementById('status-msg').innerText = "Target locked. Start stacking.";
        document.getElementById('status-msg').style.color = "#888";
        playThwompSound();
        updateUI();
    }
}

function addMoreTarget() {
    let extra = prompt("How many overtime bricks are you adding?");
    if (extra && !isNaN(extra) && extra > 0) {
        pending += parseInt(extra);
        dailyTotal += parseInt(extra);
        document.getElementById('status-msg').innerText = "Overtime authorized. Grind.";
        playThwompSound();
        updateUI();
    }
}

function processTransfer(amount) {
    if (amount > pending) amount = pending;

    pending -= amount;
    completed += amount;
    lifetime += amount;
    
    playThwompSound();

    if (pending === 0) {
        streak += 1; 
        const tasks = ["Drop and give me 15 pushups!", "20 squats right now!", "Hold a 60-second plank!"];
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        
        document.getElementById('status-msg').innerText = `TARGET DESTROYED! ${task}`;
        document.getElementById('status-msg').style.color = "#2ecc71";
        
        if (typeof confetti === 'function') {
            confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 }, colors: ['#f39c12', '#2ecc71', '#e74c3c'] });
        }
    } else {
        const msgs = ["Solid rep.", "Keep pushing.", "Momentum.", "Don't stop.", "Brick by brick."];
        document.getElementById('status-msg').innerText = `+${amount} stacked. ${msgs[Math.floor(Math.random() * msgs.length)]}`;
        document.getElementById('status-msg').style.color = "#aaaaaa";
    }
    updateUI();
}

function transferOne() { processTransfer(1); }
function transferBulk() {
    let amount = prompt("How many bricks are you moving?");
    if (amount && !isNaN(amount) && amount > 0) processTransfer(parseInt(amount));
}

function hardResetSystem() {
    if (confirm("WARNING: Permanent wipe authorized. This removes all streaks, memory arrays, and history logs. Proceed?")) {
        localStorage.clear();
        location.reload();
    }
}

window.onload = function() {
    document.body.addEventListener('click', () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }, { once: true });
    updateUI();
};





