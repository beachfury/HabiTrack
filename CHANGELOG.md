# Changelog

All notable changes to HabiTrack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.9.4] - 2026-03-07

### Fixed
- **Keyboard closes on layout switch** — Tapping 123/ABC/Shift buttons no longer causes the keyboard and form to close; input stays focused during layout changes

---

## [1.9.3] - 2026-03-07

### Fixed
- **Kiosk meal strip always visible** — Meal strip now shows even when no meals are planned (displays "No meals planned this week" fallback) with a label icon for clarity
- **Virtual keyboard key height too small** — Keys now scale height proportionally with size (S=42px, M=50px, L=58px, XL=66px, XXL=74px) with matching font sizes for comfortable touchscreen use
- **PIN modal confirm button white-on-white** — Hardcoded button to purple (#7c3aed) instead of relying on CSS variable that could resolve to a light color

---

## [1.9.2] - 2026-03-07

### Fixed
- **Leader card border too thin** — Thickened leader card border from 2px to 4px (6px on left edge) for better visibility
- **PIN modal white-on-white text** — Header text "Enter PIN to log in as..." was hard to read; split into label (purple) + name (white) on explicit dark background
- **Weather forecast too small** — Increased weather strip icons (18→28px), fonts, and card padding for better touchscreen readability

### Changed
- **7-day meal plan strip** — Now shows the full week of dinner plans instead of just today's meal
- **Virtual keyboard XL/XXL sizes** — Added two larger sizes (1250px XL, 1450px XXL) for 15" kiosk touchscreens; cycle through S/M/L/XL/XXL
- **Hidden mouse cursor on kiosk** — Cursor is invisible on the kiosk page since it's a touchscreen

---

## [1.9.1] - 2026-03-07

### Changed
- **Kiosk redesigned as always-visible action board** — The `/kiosk` page now shows all family member cards without requiring login. Tap a task to complete it (PIN verified per action). Tap an avatar to log into the full app. No separate board page — cards are always visible
- **7-day view** — Chores and events now show today + 6 days, grouped by day (Today, Tomorrow, Wednesday, etc.)
- **Points leaderboard on cards** — Each member card displays their total points. The leader gets a crown icon on their avatar and a gold border on their card
- **Live clock + 7-day weather forecast** — Header shows a live-updating clock and a 7-day forecast strip from Open-Meteo (free, no API key)
- **Today's meal banner** — Shows tonight's dinner (recipe name + image, or "Fend For Yourself" message)
- **Bigger avatars** — Member card avatars increased to 80×80px for touchscreen visibility
- **Virtual keyboard sized for 15" touchscreen** — Keyboard sizes bumped from 450/600/750px to 650/850/1050px

### Added
- **Kiosk chore completion endpoint** — `POST /api/kiosk/complete-chore` combines PIN verification + chore completion (bonus points for early completion, approval workflow support)
- **Kiosk paid chore completion endpoint** — `POST /api/kiosk/complete-paid-chore` combines PIN verification + paid chore completion (skips photo requirement, notifies admins)
- **Completion feedback toasts** — Shows points awarded, bonus points, or approval status after completing a task

### Removed
- **KioskBoardPage** — Merged into the kiosk welcome page; separate board page deleted
- **KioskProtectedRoute** — No longer needed since the kiosk page doesn't require authentication

---

## [1.9.0] - 2026-03-07

### Added
- **Kiosk daily action board** — After kiosk PIN login, users see a fullscreen grid of family member cards showing today's chores, paid chores, and events. Tap a pending item to quick-complete it (PIN verified once per session). Completed items gray out with strikethrough. Includes 30-second auto-refresh, midnight auto-reset, 5-minute idle timeout, "Full App" button to access the regular dashboard, and "Log Out" to return to the kiosk PIN screen
- **Board API endpoint** — `GET /api/kiosk/board` returns all family members with today's chores, claimed paid chores, and calendar events grouped per member
- **KioskProtectedRoute** — Lightweight route wrapper for kiosk pages (no sidebar/layout)

---

## [1.8.0] - 2026-03-06

### Fixed
- **Kid-safe themes not showing for kids** — Backend theme query excluded non-public kid-approved themes because it only checked `isPublic = 1 OR createdBy = ?`. Kids don't create themes, so they couldn't see kid-approved ones. Added dedicated kid-user query branch that filters by `isApprovedForKids = 1`
- **Paid chore completion photos broken** — Photo URLs used `/api/uploads/...` which went through NGINX's `/api` location to Express, but Express serves static files at `/uploads/...` not `/api/uploads/...`. Fixed to use `/uploads/...` paths directly
- **Kiosk accessible from external network** — Docker bridge network gave NGINX an internal IP (172.18.x.x) that passed the RFC 1918 local check. Rewrote kiosk middleware to trust X-Forwarded-For from any RFC 1918 source and added admin-configurable device IP whitelist
- **Kiosk logout redirect** — Manual logout cleared user state before redirect, losing the kiosk flag. Now saves kiosk state to sessionStorage before clearing, and ProtectedRoute checks the flag to redirect to `/kiosk` instead of `/login`
- **Animated background speed inconsistency** — Sidebar CSS animations restarted when navigating between pages because React remounted the sidebar DOM. Added stable `key="desktop-sidebar"` to prevent remounting
- **Avatar too small** — Increased all avatar sizes globally: xs 24→32px, sm 32→40px, md 40→48px, lg 48→56px, xl 64→80px
- **Direct messages don't show without refresh** — Added 5-second polling for active conversations and 15-second polling for conversation list to show new messages without page refresh

### Added
- **Kiosk on-screen keyboard** — Virtual QWERTY keyboard for touchscreen kiosk devices using `react-simple-keyboard`. Features: draggable, resizable (S/M/L), emoji picker with categorized emojis, dark theme, auto-shows on text input focus for kiosk sessions only
- **Kiosk device IP management** — Admin settings section to configure allowed kiosk device IPs. When IPs are configured, only those devices can access the kiosk PIN login. Falls back to RFC 1918 check when no IPs are set
- **Delete All for notifications & announcements** — "Delete All" buttons on Messages page Notifications tab (all users) and Announcements tab (admin only) with confirmation prompts
- **Multi-image support for regular chores** — Regular chore completion now supports multiple photo uploads, matching the paid chores feature. Includes upload endpoint, photo preview grid, and JSON storage in `photoUrl` column
- **Regular chore image upload endpoint** — `POST /api/chores/upload-image` with Sharp processing (auto-rotate, resize, JPEG)
- **Migration 024** — `kioskAllowedIps` column on settings table, `chore_instances.photoUrl` expanded from VARCHAR(500) to TEXT for JSON arrays

---

## [1.7.1] - 2026-02-28

### Fixed
- **Paid chore photo upload** — The complete chore modal had no photo upload UI despite the backend supporting it. Added multi-image upload with preview, remove, and progress indicator
- **Admin edit claimed chores** — Admins can now edit paid chore details (title, description, amount, etc.) even after a chore has been claimed, not just when available
- **Admin complete on behalf** — Admins can now mark a claimed chore as complete on behalf of the claimer. The reward goes to the claimer, not the admin
- **Admin skip photo requirement** — When an admin completes a chore on behalf of a user, the photo requirement is waived
- **Completion photo display** — Chore cards now display uploaded completion photos for admin review on the Pending Review tab

### Added
- **Paid chore image upload endpoint** — `POST /api/paid-chores/upload-image` with Sharp processing (auto-rotate, resize to 1200×1600, 72 DPI, JPEG)
- **Migration 023** — `completionPhotoUrl` column expanded from VARCHAR(500) to TEXT to support multiple photos stored as JSON array

---

## [1.7.0] - 2026-02-28

### Added

#### Admin: Reassign Paid Chores
- **Reassign endpoint** — New `POST /api/paid-chores/:id/reassign` admin-only endpoint to move a claimed paid chore from one household member to another
- **Reassign UI** — Admin sees a reassign button on any claimed chore card; opens a modal with household member picker to select the new assignee
- **Notifications** — Both the old claimer (removed) and the new claimer (assigned) receive in-app notifications and email updates
- **"All Claimed" admin tab** — New admin-only tab on the Paid Chores page showing all currently claimed chores across all household members, giving admins visibility into who has grabbed what

---

## [1.6.2] - 2026-02-27

### Fixed
- **$NaN on Budget Categories tab** — Budget category totals displayed `$NaN` when a category contained more than one budget. Added `Number()` coercion to the `.reduce()` aggregation in `CategoriesTab.tsx` (same MariaDB DECIMAL-as-string issue fixed in v1.5.5, missed spot)

---

## [1.6.1] - 2026-02-25

### Added

#### Catalog Image Auto-Resize
- **Client-side pre-resize** — Shopping catalog images are now automatically resized to fit within 1000×1333px before upload using the Canvas API, reducing upload time and bandwidth
- **Server-side Sharp processing** — Backend processes all shopping images through Sharp: auto-rotates from EXIF data, resizes to fit within 1000×1333px, sets 72 DPI metadata, and converts to JPEG at 85% quality
- **No upscale** — Small images that already fit within bounds are not upscaled on either client or server
- **Consistent output** — All shopping images now save as `.jpg` regardless of input format (PNG, GIF, WebP all convert to JPEG)

---

## [1.6.0] - 2026-02-25

### Added

#### Catalog Item Visibility System
- **Three-tier visibility** — Catalog items now have three visibility states: **Active** (normal), **Archived** (hidden from browse but findable via search), and **Hidden** (completely removed from view, restorable from Manage)
- **Archive toggle in Catalog tab** — Admins see a "Show Archived Items" checkbox that reveals archived items with reduced opacity and an "Archived" badge
- **Per-item visibility controls in Manage tab** — Each catalog item row now has Archive (📦) and Hide (👁‍🗨) buttons instead of just a delete button. Archived items show an Eye icon to restore them to active
- **Bulk selection mode** — "Select Items" toggle in Manage → Catalog enables checkboxes on every item. Select multiple items then bulk Archive or Hide them in one click
- **Category-level select all** — When in bulk select mode, clicking the checkbox on a category header selects/deselects all items in that category
- **Hidden Items section** — Collapsible "Hidden Items" panel at the bottom of Manage → Catalog lazy-loads all hidden items with a "Restore" button to bring them back to active
- **Archived items in search** — When searching from the "Add Item to List" modal, archived items are included in results (with badge) so seasonal items remain findable
- **Hide confirmation modal** — Hiding an item shows a confirmation dialog explaining it can be restored later, replacing the old "delete" language

### Changed
- **Delete is now Hide** — The old "delete catalog item" action now sets visibility to `hidden` instead of just setting `active = 0`. Items are never permanently deleted
- **Manage tab fetches active + archived** — The Manage → Catalog sub-tab now shows both active and archived items so admins can see and manage archived items directly
- **Suggestions exclude archived** — Auto-suggestions only consider active items (archived items won't appear as predictions)

### Database
- **Migration `022_catalog_visibility.sql`** — Adds `visibility` ENUM('active', 'archived', 'hidden') column to `catalog_items`, backfills from existing `active` boolean, adds index

---

## [1.5.5] - 2026-02-25

### Added

#### Shopping ↔ Budget Integration
- **Default vendor per budget** — Budgets can now have a default vendor (e.g., "Electric Company"). The vendor field auto-fills when adding entries to that budget
- **Vendor autocomplete** — The "Add Entry" modal now suggests previously-used vendors via a datalist dropdown, pulling from both budget entries and budget defaults
- **Link shopping categories to budgets** — Each shopping category (Dairy, Produce, etc.) can be linked to a budget via Shopping → Manage → Categories → Edit. A badge shows the linked budget name
- **Auto-create budget entries on purchase** — When a shopping item is marked as purchased and its category is linked to a budget, a budget entry is automatically created with the item name, brand, store as vendor, and correct price
- **Shopping summary on budget overview** — A new "Shopping This Month" card on the Budget Overview tab shows total shopping spend, purchase count, top store, and per-store breakdown
- **Net position includes shopping** — The Income vs Expenses summary now subtracts shopping spending from net position, with a dedicated "Shopping Spend" column when purchases exist

### Fixed

#### Budget $NaN Display Bug
- **MariaDB DECIMAL string coercion** — MariaDB returns DECIMAL columns as strings, causing `$NaN` totals when JavaScript's `.reduce()` concatenated strings instead of summing numbers. Added `Number()` coercion across EntriesTab, OverviewTab, and BudgetsTab
- **Budget sort comparisons** — Fixed sort-by-amount and sort-by-spent comparisons to use `Number()` coercion

#### Shopping Purchase Price Tracking
- **Price now sent on purchase** — The frontend purchase handler now passes the item's known price and storeId to the backend, instead of sending an empty request body
- **Field name mismatch fixed** — Frontend sent `price` but backend read `unitPrice`; backend now accepts both
- **NULL storeId price fallback** — When no store was assigned, the price lookup query `WHERE storeId = NULL` always failed. Now falls back to `MIN(price)` across all stores for the item
- **$0 budget entries prevented** — Auto-created budget entries with zero amounts are now skipped with a warning log

### Database
- **Migration `021_budget_vendor.sql`** — Adds `defaultVendor` VARCHAR(200) to `budgets` table; adds `budgetId` FK to `shopping_categories` linking categories to budgets

---

## [1.5.4] - 2026-02-25

### Added

#### Store-First Catalog Redesign
- **Store pills navigation** — The Catalog tab now features a horizontal row of store pills at the top. Tap a store to browse only items available there with store-specific images, brands, and prices. "All Stores" shows everything with the lowest price across stores
- **Per-store brand & image variants** — Each catalog item can now have different brand names and product images per store (e.g., "Great Value" at Walmart vs "Sprouts Brand" at Sprouts). Set these in the item editor's store price rows
- **Smart image selection in All Stores view** — When browsing "All Stores", the catalog shows the image/brand from the most frequently purchased store variant for each item. Falls back to lowest-price store if no purchase history, then to the base item
- **Click-to-expand product images** — Tapping a product thumbnail on the shopping list opens a full-screen lightbox with the high-resolution image. Tap the backdrop or X to close

### Improved

#### Shopping List Store-Aware Display
- **Store-specific images and brands on shopping list** — List items now show the correct brand name and product image for whichever store they're assigned to, instead of always showing the base catalog item data
- **Larger product image in Add to List modal** — The item preview image in the Store Select modal is now significantly larger (80×80px vs 48×48px) for better product identification

### Changed
- **Categories collapsed by default** — Catalog categories now start collapsed instead of auto-expanding, reducing visual clutter when browsing large catalogs
- **Store filter dropdown replaced** — The old store filter dropdown has been replaced by the new store pills UI for faster, more visible store switching

### Database
- **Migration `020_catalog_store_variants.sql`** — Adds `imageUrl` (VARCHAR 500) and `brand` (VARCHAR 100) nullable columns to `item_prices` table for per-store overrides

---

## [1.5.3] - 2026-02-24

### Fixed

#### Family Page Avatars
- **Family members API response** — The backend `getMembers` endpoint was selecting `avatarUrl` from the database but the response mapper was not including it in the returned JSON. Family page always showed colored circles with initials instead of avatar images

#### Upload Tab Improvements
- **Background color picker** — Added a color palette to the Upload tab's crop interface so users can choose the background color visible when the image is zoomed out or doesn't fill the crop circle
- **Blank uploaded avatar fix** — Added `crossOrigin` attribute to image loading to prevent canvas tainting issues that could result in a blank/empty avatar after cropping

#### Version Display
- **About page now shows correct version** — The root `package.json` version was not being updated alongside git tags, causing the About page to display an outdated version number

---

## [1.5.2] - 2026-02-24

### Fixed

#### More Missing Avatar Displays
- **Paid Chores leaderboard** — Earnings leaderboard was still showing colored circles with initials instead of avatar images
- **Calendar user day cards (with items)** — The second render path for users with events/chores was missed in v1.5.1 and still showed initials only
- **New Conversation modal** — User selection list in direct messages was missing avatar images
- **Today's Chores widget** — Assignee avatars on dashboard chore items were always colored circles
- **Backend dashboard query** — Added `avatarUrl` to the today's chores SQL query so assignee avatars are returned to the frontend

---

## [1.5.1] - 2026-02-24

### Fixed

#### Avatars Not Displaying Across App
- **Avatars now show on all pages** — Custom avatars (uploaded photos, emoji, icons, characters) were only visible on the Settings profile page. Seven frontend components were rendering plain colored circles with initials instead of checking for the user's avatar image. Fixed avatar display on:
  - Chores page (leaderboard podium + full list, all-chores user headers)
  - Calendar page (user day cards)
  - Family page (member list)
  - Messages page (conversation list + conversation header)
  - Dashboard widgets (chore leaderboard + family members)
- **Backend queries now return `avatarUrl`** — The calendar users and family members API endpoints were missing `avatarUrl` in their SQL SELECT queries, so even if the frontend checked for it, the data was never sent

#### Avatar Crop Improvements
- **Free movement in all directions** — Previously the crop tool only allowed panning left/right (or up/down depending on image orientation) because `react-easy-crop` restricted the image to always fill the crop circle. Now uses `restrictPosition={false}` for free dragging in any direction
- **Zoom out support** — The zoom slider now goes down to 0.5x (was 1x minimum), allowing the image to be scaled smaller than the crop circle with a neutral background fill
- **Proper canvas rendering when zoomed out** — Updated the crop utility to correctly handle negative crop coordinates that occur when the image is smaller than the crop area

---

## [1.5.0] - 2026-02-24

### Added

#### Avatar Picker & Crop Modal
- **New avatar picker modal** — Clicking your avatar or the camera button on the Profile settings page now opens a full avatar selection experience with 4 tabs:
  - **Emoji** — 60 curated emoji with customizable background color, rendered to a 400×400 image
  - **Icons** — 20 Lucide icons on colored circle backgrounds with a color picker
  - **Characters** — 24 fun illustrated SVG avatars (robot, ninja, cat, dragon, wizard, astronaut, and more)
  - **Upload** — Upload a custom photo with circular crop, zoom, and reposition controls powered by `react-easy-crop`
- All avatar types are rendered client-side to a 400×400 image and uploaded through the existing API — no backend changes needed

---

## [1.4.11] - 2026-02-24

### Improved

#### Product Image Display in Shopping Module
- **Catalog cards now show full product images** — Replaced the small 64px cropped thumbnail with a full-width square card image using `object-contain`, so the entire product (e.g., a milk jug) is visible instead of being cropped. Added a new `CardImage` component for catalog grid cards.
- **All shopping item images use `object-contain`** — Switched product images across shopping list, predictions, requests, catalog browser, and store select modals from `object-cover` (crops to fill) to `object-contain` (scales to fit) with a subtle background, so the full product is always visible. Avatars and logos remain unchanged.

---

## [1.4.10] - 2026-02-24

### Fixed

#### Uploaded Images Still 404ing Despite /uploads Proxy
- **Added `^~` modifier to nginx `/uploads` location** — A regex location block for static file caching (`*.png`, `*.jpg`, etc.) was taking priority over the `/uploads` prefix location, causing nginx to serve upload requests from the SPA directory instead of proxying them to the API server. The `^~` modifier ensures the `/uploads` proxy block always wins over regex matches.

---

## [1.4.9] - 2026-02-24

### Fixed

#### Image URLs Using localhost:3000 in Production
- **Removed hardcoded `localhost:3000` fallback from all image URL resolution** — Throughout the frontend, image URLs were constructed as `${VITE_API_BASE_URL || 'http://localhost:3000'}${path}`. Since `VITE_API_BASE_URL` is not set in production, avatars, logos, and background images loaded from `http://localhost:3000` instead of the current origin, causing mixed-content errors and broken images. With nginx now proxying `/uploads` (v1.4.8), relative paths work directly — removed the API base prefix from all 12 affected files across layouts, pages, and theme editors.

---

## [1.4.8] - 2026-02-24

### Fixed

#### Uploaded Images Not Loading (404)
- **Added `/uploads` proxy to nginx** — Uploaded files (catalog images, profile pictures, recipe photos, etc.) are served by the Express API via `express.static`, but nginx was only proxying `/api` requests to the backend. Requests to `/uploads/...` fell through to the SPA fallback and returned 404. Added a dedicated `/uploads` location block that proxies to the API server with 7-day caching.

---

## [1.4.7] - 2026-02-24

### Fixed

#### Image Uploads Failing (413 Request Entity Too Large)
- **Added `client_max_body_size` to nginx config** — Nginx's default 1MB body limit was rejecting image uploads (profile pictures, catalog images, etc.) before they reached the Express API. Set to 10MB to accommodate base64-encoded images with overhead.

---

## [1.4.6] - 2026-02-22

### Fixed

#### Catalog Items Not Showing in Default View
- **Fixed LIMIT 100 truncating catalog results** — The catalog API defaulted to returning only 100 items sorted alphabetically. Catalogs with 100+ items would silently drop items past the cutoff, making newly added items invisible unless a store filter narrowed the result set. Raised default limit to 10,000.
- **Auto-expand catalog categories** — Category groups in the catalog now auto-expand when they contain items, matching the shopping list behavior

---

## [1.4.5] - 2026-02-22

### Fixed

#### Shopping List Items Not Visible After Adding
- **Fixed store groups starting collapsed** — All store groups in the shopping list were initialized as collapsed, so newly added items appeared to be missing even though they were successfully added to the database
- **Auto-expand store groups** — Store groups that contain items now automatically expand when the list loads or refreshes

#### Prediction Algorithm Suggesting Wrong Items
- **Fixed suggestions based on adds instead of purchases** — The popular items suggestion source was tracking list additions (`item_add_events`), not actual purchases (`shopping_purchase_events`). Items that were added to the list then removed without buying would still appear as suggestions
- **Fixed recently purchased items appearing as suggestions** — Added a 7-day exclusion window so items purchased within the last week won't be suggested again as "popular"
- **Fixed pattern-based predictions for same-day purchases** — Items purchased today or yesterday are now skipped by the pattern-based prediction engine to prevent immediate re-suggestion

#### Catalog Image Upload Not Working
- **Added missing upload endpoint** — The frontend was calling `POST /shopping/upload-image` but no such API route existed. Added the `uploadShoppingImage` handler following the same base64 pattern as recipe image uploads
- **Auto-creates upload directory** — The `uploads/shopping/` directory is created automatically on server startup

### Improved

#### Advanced Prediction Algorithm (8 Enhancements)
- **Weighted recent intervals** — Purchase interval predictions now use exponential decay weighting on the last 5 intervals, so recent purchasing behavior matters more than old patterns
- **Variance-adjusted confidence** — Items with highly variable purchase intervals (coefficient of variation > 0.6) get downgraded confidence; very consistent items (CV < 0.15) get boosted to high confidence
- **Single-purchase item suggestions** — Items bought exactly once 14-45 days ago now appear as low-confidence suggestions ("might need again?")
- **Dynamic exclusion window** — Popular items source now uses each item's own average interval (40% of interval) to determine the exclusion window instead of a hardcoded 7 days
- **Weighted recent quantities** — Suggested quantities now weight recent purchases more heavily using exponential decay, so if you recently started buying 2 instead of 1, the suggestion reflects that
- **Shopping day detection** — Analyzes 90-day purchase history to detect preferred shopping days; scores get a 30% boost on your shopping day and 15% the day before
- **Co-purchase boosting** — New suggestion source that identifies items frequently bought together on the same day; if items on your current list are often purchased alongside other items, those companions are suggested
- **Trending items** — New suggestion source for items added by 2+ household members in the last 14 days that have never been purchased (new items the family wants to try)

### Added

#### Store Filter on Catalog
- **Filter catalog items by store** — New store dropdown filter on the Catalog tab allows filtering items to only show products available at a specific store (based on price entries)
- **Works alongside category filter** — Store and category filters can be combined for precise browsing

---

## [1.4.4] - 2026-02-21

### Fixed

#### Do Not Disturb (Quiet Hours) Not Working
- **Fixed quiet hours being ignored** — The `checkUserPreferences()` function in the email queue was not reading or checking the `quietHoursEnabled`, `quietHoursStart`, and `quietHoursEnd` fields from the database, causing emails to be sent at any time regardless of DND settings
- **Quiet hours now respected** — Email notifications are suppressed during the user's configured quiet hours window (e.g., 22:00-07:00)
- **Handles midnight wrap-around** — Correctly handles quiet hour ranges that cross midnight (e.g., 22:00 to 07:00)
- **Critical emails bypass DND** — Welcome emails, password reset emails, and test emails are always delivered regardless of quiet hours
- **Uses configured timezone** — Quiet hours comparison uses the household's configured timezone

---

## [1.4.3] - 2026-02-21

### Added

#### Forgot Password Flow
- **"Forgot Password?" link on login page** — Users can now reset their password directly from the login screen without admin help
- **Email-based reset** — Enter email, receive a 6-digit code (expires in 10 minutes), set a new password
- **Anti-enumeration** — Always returns success even for unknown emails to prevent email discovery
- **Auto-login** — After resetting, user is automatically logged in with a new session

#### Per-User Force Password Reset
- **Individual user reset** — Admins can now force a specific user to change their password via the shield icon on each member row in the Family page
- **Bulk reset retained** — The header "Force Password Reset" button still resets all non-admin users at once

### Changed
- Backend `POST /api/auth/creds/forgot` and `POST /api/auth/creds/reset` now accept `email` in addition to `userId`

---

## [1.4.2] - 2026-02-20

### Security

#### Critical: First-Login Password Change Fix
- **Fixed password not being saved on first login** — The `credentials` table was missing a UNIQUE constraint on `(userId, provider)`, causing `ON DUPLICATE KEY UPDATE` to silently insert duplicate rows instead of updating the existing password. Users who changed their password via the first-login flow were still authenticating with their temporary password.
- **Database migration** — `019_fix_credentials_unique_constraint.sql` removes duplicate credential rows (keeping the latest) and adds the missing UNIQUE constraint
- **Belt-and-suspenders code fix** — `updateUserCredential()` in `crypto.ts` and credential upserts in `family/credentials.ts` now use explicit check-then-update logic instead of relying solely on `ON DUPLICATE KEY UPDATE`

### Added

#### Force Password Reset
- **Admin bulk password reset** — New "Force Password Reset" button on the Family page forces all non-admin users to change their passwords on next login
- **Email notifications** — Users with email addresses receive a "Password Update Required" email with login URL
- **Session invalidation** — All affected users are immediately logged out and must set a new password on re-login
- **API endpoint** — `POST /api/family/members/force-password-reset` (admin only) supports targeting all users or specific user IDs

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
