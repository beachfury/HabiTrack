-- 015_widget_config_schema.sql
-- Add configSchema to the upcoming-events widget (proof of concept)

UPDATE `dashboard_widgets`
SET `configSchema` = '{"properties":{"daysAhead":{"type":"number","title":"Days Ahead","description":"How many days ahead to show events","default":7,"minimum":1,"maximum":30},"showAllDay":{"type":"boolean","title":"Show All-Day Events","description":"Include all-day events in the list","default":true}}}'
WHERE `id` = 'upcoming-events';
