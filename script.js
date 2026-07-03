// Load Data
let pending = parseInt(localStorage.getItem('stackerPending')) || 0;
let completed = parseInt(localStorage.getItem('stackerCompleted')) || 0;
let lifetime = parseInt(localStorage.getItem('stackerLifetime')) || 0;
let streak = parseInt(localStorage.getItem('stackerStreak')) || 0;
let lastDate = localStorage.getItem('stackerDate');
let dailyTotal = parseInt(localStorage.getItem('stackerDailyTotal')) || 0;

const today = new Date().toDateString();

// Hardware Audio Engine (Generates sound dynamically)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playThwompSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Creates a physical "pop/thwomp" sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

// New Day Check Logic
if (lastDate !== today) {
    if (lastDate && pending > 0) streak = 0; // Break streak if yesterday wasn't finished
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

    // Progress Bar Logic (FIXED)
    let progress = 0;
    if (dailyTotal > 0) {
        progress = (completed / dailyTotal) * 100;
    }
    // Cap it at 100% so the bar doesn't break if you do overtime
    progress = Math.min(progress, 100);
    document.getElementById('progress-bar').style.width = `${progress}%`;

    // Smart Button Logic
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
        dailyTotal += parseInt(extra); // Adjust the bar to account for new total
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
    
    playThwompSound(); // Fire audio physical feedback

    if (pending === 0) {
        streak += 1; 
        const tasks = ["Drop and give me 15 pushups!", "20 squats right now!", "Hold a 60-second plank!"];
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        
        document.getElementById('status-msg').innerText = `TARGET DESTROYED! ${task}`;
        document.getElementById('status-msg').style.color = "#2ecc71";
        
        confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 }, colors: ['#f39c12', '#2ecc71', '#e74c3c'] });
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

// Initial Boot
window.onload = function() {
    // Requires a click anywhere on the page to unlock audio context in mobile browsers
    document.body.addEventListener('click', () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }, { once: true });
    
    updateUI();
};
