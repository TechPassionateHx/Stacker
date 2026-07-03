// Load Data
let pending = parseInt(localStorage.getItem('stackerPending')) || 0;
let completed = parseInt(localStorage.getItem('stackerCompleted')) || 0;
let lifetime = parseInt(localStorage.getItem('stackerLifetime')) || 0;
let streak = parseInt(localStorage.getItem('stackerStreak')) || 0;
let lastDate = localStorage.getItem('stackerDate');
let dailyTotal = parseInt(localStorage.getItem('stackerDailyTotal')) || 0;

const today = new Date().toDateString();

// New Day Check Logic
if (lastDate !== today) {
    if (lastDate) {
        // If yesterday was completed, keep streak. Otherwise break it.
        if (pending > 0) streak = 0; 
    }
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

    // Progress Bar Logic
    let progress = 0;
    if (dailyTotal > 0) {
        progress = (completed / dailyTotal) * 100;
    }
    document.getElementById('progress-bar').style.width = `${progress}%`;

    // Smart Button Logic
    const btnSet = document.getElementById('btn-set');
    const btnOne = document.getElementById('btn-one');
    const btnBulk = document.getElementById('btn-bulk');
    const btnMore = document.getElementById('btn-more');

    if (pending === 0 && completed === 0) {
        // Start of day
        btnSet.style.display = "block";
        btnOne.style.display = "none";
        btnBulk.style.display = "none";
        btnMore.style.display = "none";
    } else if (pending > 0) {
        // Grinding
        btnSet.style.display = "none";
        btnOne.style.display = "block";
        btnBulk.style.display = "block";
        btnMore.style.display = "none";
    } else if (pending === 0 && completed > 0) {
        // Target Destroyed
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
        updateUI();
    }
}

function addMoreTarget() {
    let extra = prompt("How many overtime bricks are you adding?");
    if (extra && !isNaN(extra) && extra > 0) {
        pending += parseInt(extra);
        dailyTotal += parseInt(extra);
        document.getElementById('status-msg').innerText = "Overtime authorized. Get to work.";
        updateUI();
    }
}

function processTransfer(amount) {
    if (amount > pending) amount = pending;

    pending -= amount;
    completed += amount;
    lifetime += amount;

    if (pending === 0) {
        streak += 1; // Target hit, increase streak
        const tasks = ["Do 15 pushups!", "Do 20 squats!", "Hold a 60s plank!"];
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        
        document.getElementById('status-msg').innerText = `TARGET DESTROYED! ${task}`;
        document.getElementById('status-msg').style.color = "#2ecc71";
        
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, colors: ['#f39c12', '#2ecc71'] });
    } else {
        const msgs = ["Solid rep.", "Keep pushing.", "Momentum.", "Don't stop."];
        document.getElementById('status-msg').innerText = `+${amount} stacked. ${msgs[Math.floor(Math.random() * msgs.length)]}`;
    }
    updateUI();
}

function transferOne() { processTransfer(1); }
function transferBulk() {
    let amount = prompt("How many bricks are you moving?");
    if (amount && !isNaN(amount) && amount > 0) processTransfer(parseInt(amount));
}

window.onload = updateUI;
