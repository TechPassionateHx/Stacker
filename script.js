// Load saved data from phone/browser memory
let pending = parseInt(localStorage.getItem('stackerPending')) || 0;
let completed = parseInt(localStorage.getItem('stackerCompleted')) || 0;

function updateUI() {
    document.getElementById('pending-count').innerText = pending;
    document.getElementById('completed-count').innerText = completed;
    
    // Auto-save instantly
    localStorage.setItem('stackerPending', pending);
    localStorage.setItem('stackerCompleted', completed);
}

function setTarget() {
    let target = prompt("Enter today's total target (Number of bricks/questions):");
    if (target && !isNaN(target) && target > 0) {
        pending = parseInt(target);
        completed = 0; // Reset completed box for a fresh grind
        document.getElementById('status-msg').innerText = "Target locked. Start stacking.";
        document.getElementById('status-msg').style.color = "#888";
        updateUI();
    }
}

function processTransfer(amount) {
    if (pending <= 0) {
        alert("Target already crushed. Set a new target to keep building.");
        return;
    }

    if (amount > pending) amount = pending; // Prevents negative numbers

    pending -= amount;
    completed += amount;
    updateUI();

    if (pending === 0) {
        // Physical Task Generator
        const tasks = [
            "Do 15 pushups immediately!", 
            "Do 20 squats right now!", 
            "Hold a plank for 60 seconds!"
        ];
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        
        document.getElementById('status-msg').innerText = `TARGET DESTROYED! ${task}`;
        document.getElementById('status-msg').style.color = "#2ecc71";
        
        // Visual BOOM
        confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#f39c12', '#2ecc71', '#3498db']
        });
    } else {
        const msgs = ["Solid rep.", "Keep stacking.", "Brick by brick.", "Momentum building.", "Don't stop now."];
        document.getElementById('status-msg').innerText = `+${amount} stacked. ${msgs[Math.floor(Math.random() * msgs.length)]}`;
        document.getElementById('status-msg').style.color = "#aaaaaa";
    }
}

function transferOne() { processTransfer(1); }

function transferBulk() {
    let amount = prompt("How many bricks are you moving?");
    if (amount && !isNaN(amount) && amount > 0) {
        processTransfer(parseInt(amount));
    }
}

// Initial boot sequence
window.onload = function() {
    if (pending === 0 && completed === 0) {
        document.getElementById('status-msg').innerText = "Click 'Set Target' to begin.";
    } else {
        updateUI();
        if (pending === 0) {
            document.getElementById('status-msg').innerText = "Target completed. Awaiting new orders.";
            document.getElementById('status-msg').style.color = "#2ecc71";
        }
    }
}
