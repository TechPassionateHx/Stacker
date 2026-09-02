# Changelog

All notable changes to the Stacker project will be documented in this file.

## [v3.0.0] - 2026-09-02

### Added
- **Storage Resilience:** Integrated IndexedDB API alongside `localStorage` and enabled the Persistent Storage API.
- **Data Mobility:** Added one-click JSON export and import for user-controlled backups.
- **Grace Period & Rest Engine:** Added a 12:00 PM next-day grace period prompt to backfill forgotten tasks and a streak-preserving "Rest Day" option.
- **Target Automation:** Implemented smart 7-day rolling median calculation for target generation (Light, Standard, Push presets).
- **Tactile UI Improvements:** Introduced rapid-tap increment chips (+1, +5, +10, +25) and a 5-second safety buffer (`Undo`).

### Fixed
- Addressed accidental streak loss caused by unexpected browser cache clears.
- Eliminated interaction drag caused by modal text inputs during rapid logging.

## [v2.0.0] - Prior Release
- Initial prototype iteration and basic tracking mechanics.
