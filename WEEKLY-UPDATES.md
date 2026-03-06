# HabiTrack Weekly Updates

Updates are batched and implemented on **Thursdays only**.
Exceptions: critical bugs or security issues that need immediate attention.

---

## Week of 2026-03-02

### Enhancements
- [x] **Admin: Reassign paid chores** — Admins currently have no way to reassign a paid chore once it's been claimed. Need an admin action to reassign paid chores to a different household member (e.g., if someone is being greedy with high-value chores). **Fixed:** Added `POST /paid-chores/:id/reassign` endpoint, reassign button + modal on claimed chore cards, and new "All Claimed" admin tab. v1.7.0.

### Issues (for Friday)
- [x] **Avatar too small** — Increase avatar size on all pages, widgets, and cards that display avatars. **Fixed:** Globally increased all avatar sizes in Avatar.tsx. v1.8.0.
- [x] **Animated background speed inconsistency** — Sidebar animation speeds up on certain pages. **Fixed:** Added stable `key` to sidebar to prevent React remounting. v1.8.0.
- [x] **Store page not in theme editor** — Already configured. `store-background` element exists in ElementsTab.tsx. Not a bug.
- [x] **Kid-safe themes not showing for kids** — Backend query excluded non-public kid-approved themes. **Fixed:** Added kid-user query branch filtering by `isApprovedForKids`. v1.8.0.
- [x] **Direct messages don't show without refresh** — No real-time updates for DMs. **Fixed:** Added 5s message polling and 15s conversation list polling. v1.8.0.
- [x] **Paid chore completion photos showing as broken** — Photo URLs used wrong `/api/uploads/` path. **Fixed:** Corrected to `/uploads/` paths. v1.8.0.
- [x] **🔒 Kiosk accessible from external network** — Docker bridge IP passed RFC 1918 check. **Fixed:** Rewrote middleware to trust XFF from private networks + admin-configurable IP whitelist. v1.8.0.
- [x] **Kiosk logout goes to /login instead of /kiosk** — Kiosk flag lost on logout. **Fixed:** Saves kiosk state to sessionStorage before clearing user, ProtectedRoute checks flag. v1.8.0.
- [x] **Kiosk on-screen keyboard** — No virtual keyboard for touchscreen. **Fixed:** Built VirtualKeyboard component with react-simple-keyboard, emoji picker, draggable/resizable. Kiosk-only. v1.8.0.

### Enhancements (for Friday)
- [x] **Delete All for Notifications & Announcements** — **Fixed:** Added Delete All buttons with confirmation on Notifications (all users) and Announcements (admin) tabs. v1.8.0.
- [x] **Multi-image support for regular chores** — **Fixed:** Added multi-image upload to regular chore completion with upload endpoint, preview grid, JSON storage. v1.8.0.

---

## Week of 2026-02-23

### Issues
- [x] **$NaN on Budget Categories tab** — When a budget category contains more than one budget, the total displays as `$NaN`. MariaDB DECIMAL-as-string coercion issue — missed during v1.5.5 fix. **Fixed:** Added `Number()` wrap in `CategoriesTab.tsx` line 54.

### Notes
- v1.6.1 released 2026-02-25 (image auto-resize)

---

<!-- Template for new weeks:

## Week of YYYY-MM-DD

### Issues
- [ ] Description of issue — where it happens, steps to reproduce

### Enhancements
- [ ] Description of desired improvement

### Notes
- Any observations, ideas, or things to revisit

-->
