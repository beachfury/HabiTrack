# Changelog

All notable changes to HabiTrack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.1] - 2025-02-18

### Fixed

#### Mobile Responsiveness Overhaul
- **Fixed sidebar not collapsing on mobile** — Root cause was an inline `position: relative` style overriding Tailwind's `fixed` positioning on the mobile sidebar, causing it to permanently occupy screen space and push content to the right
- **Fixed modal sizing overflow on small screens** — All modals now properly constrain to viewport width on phones (375px+)
- **Fixed 7-column calendar grid on mobile** — Calendar and month views now horizontally scroll on small screens instead of being illegibly compressed
- **Fixed Settings page sidebar on mobile** — Converted fixed-width sidebar to horizontal scrollable tabs on screens below 768px
- **Fixed Meals page week/month grids** — Week view now uses responsive column counts (1→2→4→7 columns across breakpoints); month view scrolls horizontally
- **Fixed Messages page fixed height** — Conversation area now uses viewport-relative height on mobile
- **Fixed hardcoded padding on 7 pages** — CalendarPage, SettingsPage, MealsPage, RecipesPage, FamilyPage, PaidChoresPage, BudgetPage now use responsive padding (`p-3 sm:p-4 md:p-6 lg:p-8`)
- **Fixed all modal form grids** — 2-column form layouts in AddChoreModal, AdminActionModal, AddTemplateModal, EventFormModal, CatalogBrowserModal, and others now stack to single column on mobile
- **Fixed budget category color picker** — 9-column grid reduced to 6 columns on mobile for touch-friendly sizing
- **Fixed all component grids** — NotificationsTab, AnalyticsTab, AssignmentsTab, LeaderboardView, TypographyEditor, LayoutEditor, and others now use responsive column counts
- **Fixed table overflow** — Assignments and budget entries tables now have horizontal scroll wrappers with minimum widths
- **Fixed touch targets** — Color picker swatches enlarged to 40x40px on mobile (44px recommended minimum)
- **Fixed sidebar logo size** — Logo now scales down on mobile (80px) vs desktop (176px)
- **Fixed login/setup page logos** — Logo containers scale down on mobile for better fit
- **Fixed search/filter layouts** — CatalogTab and ManageTab search+filter rows now stack vertically on mobile
- **Fixed FormRow component** — Shared form grid component now stacks to single column on mobile

---

## [1.1.0] - 2025-02-17

### Added

#### First-Time Login Flow
- **Forced Password Change for New Members**
  - When admins create new family members with a temporary password, those members are now required to change their password on first login
  - New `FirstLoginModal` component guides users through setting their permanent password
  - Backend validates the `firstLoginRequired` flag and returns HTTP 428 status when password change is needed
  - Secure onboard token flow ensures only the intended user can complete the password change

#### One-Click Update System
- **Update Checker in Settings > About**
  - Admins can check for new releases directly from the Settings page
  - Compares current version with latest GitHub release
  - Displays release notes, version comparison, and release date
  - "Update Now" button pulls the latest code from GitHub
  - Clear instructions for restarting containers to complete the update

- **Update API Endpoints**
  - `GET /api/updates/check` - Check for available updates from GitHub releases
  - `POST /api/updates/apply` - Pull latest code (admin only)
  - `GET /api/updates/status` - Get current git status and version info

#### Documentation
- **Nginx Proxy Manager Setup Guide**
  - Detailed instructions for configuring NPM with HabiTrack
  - Production environment settings for HTTPS
  - Troubleshooting guide for common proxy issues

### Changed
- Settings > About tab now shows update status for admins
- Family member creation sets `firstLoginRequired` flag when temporary password is provided

### Fixed
- Cookie security configuration for HTTPS via reverse proxy
- Docker health check timing and URL improvements

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
