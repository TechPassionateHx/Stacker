# Stacker V3 🧱

A lightweight, gamified progress tracker engineered to hack the dopamine reward system for deep work, exam preparation, and high-friction tasks.

## The Concept
Long-term goals (like competitive exams or massive backlogs) suffer from a lack of immediate visual feedback, leading to burnout and procrastination. **Stacker** solves this by treating study modules and tasks like physical building blocks. By manually transferring "Pending" tasks to "Completed" tasks, the user receives immediate visual and psychological momentum—turning invisible academic effort into a tangible, digital structure.

## Core Features
* **Zero-Friction Fast Logging:** Quick-tap increment buttons (+1, +5, +10, +25) allow logging in under two seconds with zero typing or prompt fatigue.
* **5-Second Undo Buffer:** Instant mistake buffer to quickly reverse accidental taps without disrupting session integrity.
* **Persistent Dual Storage:** Upgraded data layer using IndexedDB paired with `localStorage` and the Persistent Storage API to prevent accidental browser cache eviction.
* **Backup & Restore:** One-click JSON backup export and import to transfer data seamlessly between devices or restore past progress.
* **Grace Period & Rest Days:** Protects streaks by allowing yesterday's unlogged tasks to be backfilled until 12:00 PM the next day, along with an exemption for planned rest days.
* **Smart Rolling Targets:** Recommends daily targets automatically (Light, Standard, Push) derived from a rolling 7-day performance median.
* **Visual Reward System:** Incorporates UI micro-interactions, hardware sound synthesis, and digital confetti upon clearing daily targets.

## Tech Stack
* **Frontend:** HTML5, CSS3
* **Logic & Storage:** Vanilla JavaScript (ES6), IndexedDB API, Web Storage API (`localStorage`)
* **Hosting:** GitHub Pages (Optimized for mobile 'Add to Home Screen' functionality)

## Installation / Usage
1. Open the live deployment link on any mobile browser (Chrome/Safari).
2. Tap the browser menu and select **"Add to Home Screen"**.
3. Launch Stacker like a native app. Set your daily target, and start building.

## License
**CC BY-NC 4.0 (Creative Commons Attribution-NonCommercial 4.0 International)**

This project is licensed under the CC BY-NC 4.0 License. 
* **You are free to:** Share, copy, and modify the code for your own personal use.
* **Under the following terms:**
  * **Attribution:** You must give appropriate credit to the original creator.
  * **Non-Commercial:** You may **not** use the material for commercial purposes (e.g., you cannot sell this app, put ads on it, or monetize it in any way).


