# Changelog

All notable changes to HabiTrack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.4.1] - 2026-02-19

### Added

#### Session & Idle Management
- **Universal idle timeout** — All sessions now show an "Are you still there?" warning with a live countdown timer before automatic logout (regular: 30 min, kiosk: 15 min)
- **Idle warning modal** — Full-screen countdown modal with context-aware messaging (logout for regular sessions, return to PIN screen for kiosk)
- **Session janitor** — Expired sessions are now automatically cleaned up from the database (existing `startJanitor()` was never wired into server startup)

#### Day Rollover Auto-Refresh
- **Automatic midnight refresh** — Pages now reload automatically when the day changes, ensuring chore lists, calendar events, and stats are always current
- **Dual-approach reliability** — Precise `setTimeout` targeting midnight with a 60-second fallback interval for browser timer suspension

#### Chore Deadline Reminders
- **Configurable reminder times** — Admins can set up to 4 daily check times in Settings > Notifications (e.g., 12:00 and 19:00)
- **Automatic email reminders** — When chores due today are still pending at a configured time, email notifications are sent to the assigned user and all admin users
- **In-app notifications** — Assigned users also receive in-app notifications alongside email reminders
- **Deduplication tracking** — Each chore is only reminded once per slot per day, preventing duplicate notifications
- **Database migration** — New `018_chore_deadline_reminders.sql` adds settings columns and dedup tracking table

### Changed
- **`useKioskIdleTimeout` renamed to `useIdleTimeout`** — Now supports both regular and kiosk sessions with configurable timeouts and warning durations
- **Backward-compatible export** — `useKioskIdleTimeout` remains as an alias for existing imports

---

## [1.4.0] - 2026-02-19

### Added

#### Design System Standardization
- **Reusable UI components** — New `Button`, `Input`, `Card`, `Badge`, `Alert`, `EmptyState`, `Spinner`, `PageHeader`, and `ModalFooterButtons` components with consistent theming via CSS variables
- **CSS utility layer** — Global utility classes in `index.css` for themed cards, buttons, inputs, badges, alerts, and more — replacing scattered inline styles across all pages
- **All pages refactored** to use standardized components — HomePage, ChoresPage, ShoppingPage, CalendarPage, BudgetPage, MealsPage, RecipesPage, PaidChoresPage, FamilyPage, MessagesPage, SettingsPage
- **All modals refactored** to use consistent themed styling — AddChoreModal, AddTemplateModal, AdminActionModal, CompleteChoreModal, EventFormModal, AddBudgetModal, AddEntryModal, AddIncomeModal, AddIncomeEntryModal, CategoryModal, MemberFormModal, PasswordModal, PinModal, PlanMealModal, VotingModal, ApprovalModal, BackupRestoreModal, UpdateModal, EditListItemModal, NewItemModal, StoreSelectModal, FirstLoginModal

#### Store Page Previews
- **Widget preview modals** — Click "Preview" on any widget card in the Store to see a live preview with sample data, rendered inside a sandboxed container
- **Widget card mockups** — Visual abstract mockups on widget cards showing stat bars, list lines, ranking bars, people icons, or weather based on widget type
- **Theme preview modals** — Click "Preview" on any theme card in the Store to see a full interactive preview using the theme editor's `InteractivePreview` component
- **Theme card mockups** — Mini UI layout mockups on theme cards showing sidebar, header, content cards, and color palette dots using the theme's actual colors
- **Static weather preview** — Weather widget preview uses a static mockup to avoid API calls in the Store context
- **Preview sample data system** — Centralized `previewData.ts` provides realistic mock data for all 14 widget previews

#### Widget Architecture Overhaul
- **`_built-in/` directory** — All 14 built-in widget components moved to `widgets/_built-in/` with shared types and barrel exports
- **`_registry/` directory** — Widget registry, manifests, adapters, validation, and preview infrastructure moved to `widgets/_registry/`
- **Community widget validation** — `validateManifest()` and `scanWidgetCode()` functions for future community widget support
- **Widget config schema** — New migration (`015_widget_config_schema.sql`) adding `configSchema` column to `dashboard_widgets` table

#### Theme System Enhancements
- **Store page background** — Added `store-background` as a themeable element with CSS variable `--store-page-bg`
- **Store preview page** — Added 15th preview page (Store) to the theme editor's `InteractivePreview`
- **Theme tags migration** — New migration (`016_theme_tags.sql`) for theme categorization

### Changed
- **Widget `index.ts`** reduced from ~400 lines to ~30-line barrel re-export from `_registry/`
- **`InteractivePreview`** reduced from ~600 lines to ~300 lines by extracting inline styles to CSS utility classes
- **All PreviewPages** (Home, Calendar, Chores, Shopping, Messages, Settings, Budget, Meals, Recipes, Paid Chores, Family, Modal) refactored to use CSS utility classes instead of inline `style` objects
- **Removed `styleUtils.ts`** (423 lines) — Preview pages now use global CSS classes
- **Removed `widgetValidation.ts`** (163 lines) — Replaced by `_registry/validation.ts`
- **Removed `Modal.tsx`** (115 lines) — Replaced by `ModalPortal` and `ModalFooterButtons`
- **Store page** completely rebuilt with tabbed layout, preview modals, and improved card designs
- **`WidgetConfigModal`** extracted from `HomePage.tsx` into its own file

### Fixed
- **Missing page background routes** — SidebarLayout now maps `/store`, `/family`, and `/paidchores` routes to their dedicated background CSS variables
- **Theme CSS variable prefixes** — `buildCssVariables()` now correctly prefixes Store-related element variables
- **MemoryRouter crash** — Removed `MemoryRouter` from `WidgetPreviewModal` that caused nested router errors; replaced with click-interceptor for preview links
- **"Apply to All" theme backgrounds** — Fixed to correctly iterate all page background elements including Store
- **Widget data fixes migration** — `017_widget_data_fixes.sql` corrects stale widget metadata in the database

---

## [1.3.0] - 2026-02-18

### Added

#### Income Tracking
- **Income sources** — Track multiple income sources (salary, bonus, side-income, investment, other)
- **Income entries** — Record received income with amount, date, and notes
- **Income summary** — View income vs. expenses net position overview
- **Flexible frequencies** — Monthly, bi-weekly, weekly, yearly, one-time, and irregular income support
- **Income tab** in Budget page with full CRUD management
- **API endpoints** — `GET/POST /api/income`, `GET/POST /api/income/entries`, `GET /api/income/summary`

#### Birthday & Holiday Calendar Integration
- **Automatic birthday display** — Family member birthdays appear on the calendar with cake icon
- **National holiday support** — Configure holiday countries in Settings > Household
- **Multi-country holidays** — Support for US, Canada, UK, Mexico, Australia, Germany, France, India, Japan, Brazil, Puerto Rico, and more
- **Holiday calendar bars** — Holidays display with country flag gradient swatches

#### Family Management
- **Soft delete + hard delete** — Family members can be deactivated (soft delete) or permanently removed (hard delete)
- **Birthday tracking** — Family member profiles now include birthday field

### Fixed
- **Chore color display** — Fixed chore category colors not rendering correctly
- **HouseholdTab wiring** — Connected HouseholdTab component to SettingsPage
- **pnpm-lock.yaml** — Updated for TypeScript version alignment

---

## [1.2.0] - 2026-02-18

### Added

#### Widget & Theme Store
- **Store page** (`/store`) — Browse all available widgets and themes in one place
- **Widget manifest system** — Each widget has a typed manifest with id, name, description, category, icon, size constraints, data sources, roles, and tags
- **Theme catalog** — Browse built-in system themes and user-created public themes
- **Import/Export** — Admins can import `.habi-theme` files and export existing themes from the Store
- **Request system** — Members and Kids can submit install requests; Admins review from Pending Requests section
- **Permission model** — Role-based access: Admins can import/install, Members can browse/request, Kids see filtered catalog

#### Welcome Email System
- **Welcome email** on family member creation with household information and login instructions

### Changed
- **Widget registration** moved to centralized manifest-based system
- **Theme browsing** integrated into Store page alongside widgets

---

## [1.1.3] - 2025-02-18

### Changed

#### Theme System Refactor
- **ThemeEditorAdvanced.tsx** — Reduced from 1,676 to 1,022 lines by extracting `useThemeHistory` hook, `ElementsTab`, and `PresetsTab` into separate files
- **ElementStyleEditor.tsx** — Reduced from 2,937 to 426 lines by extracting `BackgroundTab`, `TextTab`, `BorderTab`, `EffectsTab`, `ColorInput`, `SliderWithInput`, `MediaLibraryModal`, and `ImageUploadSection` into `editors/` directory
- **LoginPageEditor.tsx** — Reduced from 1,242 to 562 lines by extracting `LoginBackgroundEditor`, `LoginBrandEditor`, `LoginButtonEditor`, `LoginEffectsEditor`, and `LoginAdvancedEditor` into `editors/` directory
- **AdvancedCSSEffects.tsx** — Reduced from 921 to 305 lines by extracting CSS effect definitions into `editors/cssEffectDefinitions.ts`
- **themeCssGenerator.ts** — Reduced from 910 to 32-line barrel file by splitting into `css/utils.ts`, `css/colorVariables.ts`, `css/elementVariables.ts`, `css/animationClasses.ts`, `css/specialModes.ts`, and `css/index.ts`
- No behavior changes — pure code organization refactor

---

## [1.1.2] - 2025-02-18

### Added

#### Version Management & Rollback
- **Version picker** — Browse all GitHub releases from Settings > About > "Manage Versions"
- **Upgrade or rollback** — Switch to any tagged release (newer or older) with `git checkout <tag>`
- **Pre-update backup reminder** — Before switching versions, a backup reminder with one-click "Create Backup Now" button is shown
- **Downgrade warning** — Extra warning when rolling back about potential database migration issues

#### Database Backup & Restore
- **Create backups** — One-click database backup using `mariadb-dump`, saved as gzipped `.sql.gz` files
- **List backups** — View all existing backups with filename, size, and creation date
- **Download backups** — Download any backup file to your local machine
- **Restore from backup** — Restore database from a backup with type-to-confirm safety ("RESTORE")
- **Delete backups** — Remove old backup files
- **Persistent storage** — Backups stored in `habitrack-backups` Docker volume, surviving container rebuilds

### Changed
- **Update instructions** now reference `docker compose --profile web` to ensure the web container is also rebuilt
- **Version list endpoint** (`GET /api/updates/releases`) replaces single latest-version check for the version picker
- **Apply endpoint** (`POST /api/updates/apply`) now accepts optional `{ version: "v1.1.0" }` body for targeted version switching

### Security
- All backup and update endpoints enforce `requireAuth('admin')` middleware
- Backup filenames validated against strict regex to prevent path traversal
- Database restore requires typing "RESTORE" to confirm (destructive action)

---

## [1.1.1] - 2025-02-18

### Fixed

#### Mobile Responsiveness Overhaul
- **Fixed sidebar not collapsing on mobile** — Root cause was an inline `position: relative` style overriding Tailwind's `fixed` positioning on the mobile sidebar, causing it to permanently occupy screen space and push content to the right
- **Fixed modal sizing overflow on small screens** — All modals now properly constrain to viewport width on phones (375px+)
- **Fixed 7-column calendar grid on mobile** — Calendar and month views now horizontally scroll on small screens instead of being illegibly compressed
- **Fixed Settings page sidebar on mobile** — Converted fixed-width sidebar to horizontal scrollable tabs on screens below 768px
- **Fixed Meals page week/month grids** — Week view now uses responsive column counts (1->2->4->7 columns across breakpoints); month view scrolls horizontally
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

#### In-App Update System Fix
- **Fixed update endpoint 500 error in Docker** — The API container had no `.git` directory (baked-in copy from Dockerfile) and `git` was not installed. Added `git` to Alpine packages, bind-mount host repo at `/repo` for git operations, and auto-detect git directory at startup
- **Added detailed error responses** — Update apply endpoint now returns `detail` and `gitDir` in error responses for easier debugging

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

#### Documentation
- **Nginx Proxy Manager Setup Guide**
  - Detailed instructions for configuring NPM with HabiTrack
  - Production environment settings for HTTPS
  - Troubleshooting guide for common proxy issues

#### Database
- New `debug_settings` columns in `household_settings` table
- Migration `012_debug_settings.sql` for debug configuration storage

### Changed
- Settings > About tab now shows update status for admins
- Family member creation sets `firstLoginRequired` flag when temporary password is provided
- Refactored large page components into modular sub-components
- Consolidated 33 migrations into 11 organized files
- Split ThemeContext for better maintainability
- Added reusable ModalForm component
- Updated all pages to use `min-h-screen` for full viewport coverage
- Pages now use CSS variables consistently for theming

### Fixed
- Cookie security configuration for HTTPS via reverse proxy
- Docker health check timing and URL improvements
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
