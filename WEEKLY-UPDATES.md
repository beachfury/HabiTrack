# HabiTrack Weekly Updates

Updates are batched and implemented on **Thursdays only**.
Exceptions: critical bugs or security issues that need immediate attention.

---

## Week of 2026-03-02

### Enhancements
- [x] **Admin: Reassign paid chores** — Admins currently have no way to reassign a paid chore once it's been claimed. Need an admin action to reassign paid chores to a different household member (e.g., if someone is being greedy with high-value chores). **Fixed:** Added `POST /paid-chores/:id/reassign` endpoint, reassign button + modal on claimed chore cards, and new "All Claimed" admin tab. v1.7.0.

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
