# Changelog

All notable changes to HabiTrack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

#### Advanced Per-Page Theme System
- **Expanded Page Previews in Theme Editor**
  - Added 5 new page previews: Budget, Meals, Recipes, Paid Chores, Family
  - Total of 14 previewable pages in the theme editor (Home, Chores, Calendar, Shopping, Messages, Settings, Budget, Meals, Recipes, Paid Chores, Family, Modal, Login, Kiosk)
  - Each page preview shows realistic UI elements that respond to theme changes in real-time

- **Per-Page Background Customization**
  - Every page can now have its own unique background (color, gradient, or image)
  - Independent opacity controls for background images per page
  - "Apply to All" feature to copy background settings across multiple pages at once
  - Backgrounds now extend corner-to-corner on all pages

- **Advanced CSS Effects System**
  - **Matrix Rain**: Animated digital rain effect with 4 speed options (slow, normal, fast, veryfast)
  - **Snowfall**: Gentle falling snow animation
  - **Sparkle**: Twinkling star effect
  - **Bubbles**: Rising bubble animation
  - **Embers**: Floating ember particles
  - All effects are combinable - use multiple effects on the same page
  - Effects work on any page background (Home, Calendar, Chores, Shopping, etc.)

- **Enhanced Card Styling**
  - Semi-transparent card fallbacks when using custom page backgrounds
  - Cards automatically adjust opacity to look good on gradient/image backgrounds
  - Consistent card styling across all page previews

#### Debug & Diagnostics System
- **Debug Settings Tab** in Settings page for admins
  - Toggle debug mode on/off
  - Configure log levels (Error, Warning, Info, Debug)
  - Set log retention period (1-30 days)
  - View recent logs with filtering
  - Load system information (Node version, uptime, memory usage)
  - Clear old logs functionality
- **About Tab** in Settings page
  - Display application version and build info
  - Show system requirements
  - Quick links to documentation and support
- **Frontend Error Reporting**
  - Automatic capture of JavaScript errors and unhandled promise rejections
  - Errors sent to `/api/debug/frontend-errors` endpoint
  - Error boundary component for graceful error handling
- **Comprehensive Backend Logging**
  - Added structured logging across all major routes:
    - Theme preferences (create, update)
    - Budget definitions and entries (create, update, delete)
    - Recipes (create, update, delete, approve, reject)
    - Meal planning (create, update, delete, finalize, FFY)
    - Announcements (create, delete)
    - Direct messages (send, delete)
    - Paid chores (create, update, delete, claim, complete, verify, reject)
    - Family members (create, update, delete)
    - Chores and chore instances
    - Shopping items and catalog
    - Calendar events
  - Log entries include user ID, action details, and timestamps
  - Error logging with stack traces for debugging

#### Database
- New `debug_settings` columns in `household_settings` table
- Migration `012_debug_settings.sql` for debug configuration storage

### Changed
- Refactored large page components into modular sub-components
- Consolidated 33 migrations into 11 organized files
- Split ThemeContext for better maintainability
- Added reusable ModalForm component
- Updated all pages to use `min-h-screen` for full viewport coverage
- Pages now use CSS variables consistently for theming

### Fixed
- Page backgrounds now extend from edge to edge (no visible gaps)
- Animation classes now properly apply to all pages (Budget, Meals, Recipes, Paid Chores, Family)
- "Apply to All" feature now works correctly for all page backgrounds
- Various TypeScript type improvements across the codebase

---

## Development Notes

### Log Levels
The application supports industry-standard log levels:
- **Error**: Critical failures requiring immediate attention
- **Warning**: Issues that don't stop operation but need review
- **Info**: Significant business events (default for most operations)
- **Debug**: Detailed technical information for troubleshooting

### Viewing Logs
1. Go to **Settings > Debug Settings** (admin only)
2. Enable debug mode if not already enabled
3. Set the desired log level
4. Use "Load Recent Logs" to view activity
5. Filter logs by level or search for specific content

### Frontend Error Reporting
Frontend errors are automatically captured and sent to the backend when debug mode is enabled. This includes:
- JavaScript runtime errors
- Unhandled promise rejections
- React component errors (via ErrorBoundary)
