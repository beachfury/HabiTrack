-- 017_widget_data_fixes.sql
-- Fix missing upcoming-meals widget, category mismatches, and icon mismatches

-- ============================================================================
-- 1. Insert missing upcoming-meals widget (was absent from 009)
-- ============================================================================
INSERT IGNORE INTO `dashboard_widgets` (`id`, `name`, `description`, `icon`, `category`, `defaultW`, `defaultH`, `minW`, `minH`, `maxW`, `maxH`, `sortOrder`)
VALUES ('upcoming-meals', 'Upcoming Meals', 'Upcoming meal plans and voting', 'utensils-crossed', 'meals', 2, 2, 1, 2, 4, 4, 14);

-- Apply 013 columns to the new widget (in case 013 already ran)
UPDATE `dashboard_widgets` SET `dataSources` = '["upcomingMeals"]', `builtIn` = 1, `author` = 'HabiTrack'
WHERE `id` = 'upcoming-meals';

-- ============================================================================
-- 2. Fix categories: paid-chores and earnings should be 'finance' not 'chores'
-- ============================================================================
UPDATE `dashboard_widgets` SET `category` = 'finance' WHERE `id` = 'paid-chores';
UPDATE `dashboard_widgets` SET `category` = 'finance' WHERE `id` = 'earnings';

-- ============================================================================
-- 3. Fix icon names to match frontend iconMap (lucide-react names)
-- ============================================================================
UPDATE `dashboard_widgets` SET `icon` = 'sparkles' WHERE `id` = 'welcome';
UPDATE `dashboard_widgets` SET `icon` = 'bar-chart-3' WHERE `id` = 'quick-stats';
UPDATE `dashboard_widgets` SET `icon` = 'calendar' WHERE `id` = 'upcoming-events';
UPDATE `dashboard_widgets` SET `icon` = 'utensils-crossed' WHERE `id` = 'upcoming-meals';
