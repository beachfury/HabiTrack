# HabiTrack Database Migrations

## Overview

Migrations are run sequentially by number prefix (001, 002, etc.). Once a migration has been run on a database, it should NOT be modified - create a new migration instead.

## Migration Groups

### Core System (001-005)
- `001_core_settings_users.sql` - Settings, households, users
- `002_auth_tables.sql` - Sessions, password resets
- `003_permissions_security.sql` - Permissions, audit log
- `004_notifications_messages.sql` - System messages, notifications
- `005_calendar_events.sql` - Calendar events

### Chores System (006-008, 010, 014, 018)
- `006_chores_core.sql` - Chore definitions, categories
- `007_chores_instances.sql` - Chore instances, completions
- `008_achievements.sql` - Achievement system
- `010_default_chore_templates.sql` - Seed data for chore templates
- `014_points_adjustments.sql` - Manual points adjustments
- `018_paid_chores.sql` - Paid chores / chore race feature

### Shopping System (009, 011, 031)
- `009_shopping.sql` - Shopping lists, items, stores, categories
- `011_default_catalog_items.sql` - Seed data for catalog
- `031_shopping_popularity_tracking.sql` - Item popularity tracking

### Theme System (017, 022, 024-029, 032-033)
These migrations build the theme system incrementally:

| Migration | Purpose |
|-----------|---------|
| `017_themes.sql` | Core tables: themes, user_theme_preferences, theme_assets |
| `022_extended_themes.sql` | Add elementStyles, widgetOverrides, loginPage, lcarsMode columns; theme_element_presets table |
| `024_update_habitrack_classic_colors.sql` | Update colors from purple to green/navy |
| `025_update_brand_color_green.sql` | Update household brand color |
| `026_update_user_colors_green.sql` | Update user default colors |
| `027_theme_system_cleanup.sql` | Add isSystemTheme column, insert Household Brand theme |
| `028_theme_asset_categories.sql` | Add category/name to theme_assets |
| `029_remove_extra_themes.sql` | Clean up old demo themes |
| `032_fix_theme_colors.sql` | Add missing semantic colors (destructive, success, warning) |
| `033_clear_hardcoded_element_colors.sql` | Clear hardcoded colors from elementStyles |

### Budget System (020-021)
- `020_budget_system.sql` - Budget definitions, entries, categories
- `021_budget_type.sql` - Add budget type column

### Meals System (023)
- `023_dinner_planner.sql` - Recipes, meal plans, ingredients, voting

### Messages System (015-016)
- `015_direct_messages.sql` - Direct messages
- `016_messages_direct_columns.sql` - Additional DM columns

### Dashboard (019)
- `019_dashboard_widgets.sql` - Dashboard widget configurations

### Kiosk Mode (030)
- `030_kiosk_sessions_and_notifications.sql` - Kiosk sessions, notification outbox

### Utility Migrations (012-013)
- `012_color_swatches.sql` - Color palette options
- `013_fix_households_audit.sql` - Fix audit table references

## Creating New Migrations

1. Use the next sequential number: `034_your_migration_name.sql`
2. Always use `SET NAMES utf8mb4;` at the top
3. Use `IF NOT EXISTS` / `IF EXISTS` for safety
4. Include clear comments explaining the purpose
5. Test on a fresh database AND an existing database

## Running Migrations

Migrations are automatically run by the API server on startup. The `migrations_log` table tracks which migrations have been applied.

```bash
# Rebuild API to run new migrations
cd apps/api && pnpm build && pnpm start
```
