// apps/web/src/components/themes/ElementsTab.tsx
// Element overview tab — lists global and page-specific themeable elements

import type { ThemeableElement, ElementStyle } from '../../types/theme';

export type PreviewPage = 'home' | 'chores' | 'calendar' | 'shopping' | 'messages' | 'settings' | 'budget' | 'meals' | 'recipes' | 'paidchores' | 'family' | 'store' | 'modal' | 'login' | 'kiosk';

export function ElementsTab({
  elementStyles,
  onSelectElement,
  selectedElement,
  onApplyPageToAll,
  currentPage,
  isSystemTheme = false,
  isAdmin = false,
}: {
  elementStyles: Partial<Record<ThemeableElement, ElementStyle>>;
  onSelectElement: (element: ThemeableElement) => void;
  selectedElement: ThemeableElement | null;
  onApplyPageToAll: (sourcePage: 'home' | 'calendar' | 'chores' | 'shopping' | 'messages' | 'settings' | 'store') => void;
  currentPage: PreviewPage;
  isSystemTheme?: boolean;
  isAdmin?: boolean;
}) {
  // Global elements shared across all pages
  const globalElements: { id: ThemeableElement; label: string; description: string }[] = [
    { id: 'sidebar', label: 'Sidebar', description: 'Navigation sidebar (all pages)' },
    { id: 'button-primary', label: 'Primary Buttons', description: 'Main action buttons (all pages)' },
    { id: 'button-secondary', label: 'Secondary Buttons', description: 'Alternative buttons (all pages)' },
    { id: 'input', label: 'Input Fields', description: 'Text inputs and forms (all pages)' },
  ];

  // Page-specific elements - only show for the current page
  const pageElements: Record<PreviewPage, { id: ThemeableElement; label: string; description: string }[]> = {
    home: [
      { id: 'home-background', label: 'Page Background', description: 'Home page background' },
      { id: 'home-title', label: 'Page Title', description: '"Home" heading text' },
      { id: 'home-welcome-banner', label: 'Welcome Banner', description: 'Greeting banner at top of page' },
      { id: 'home-stats-widget', label: 'Stats Widget', description: 'Quick stats summary widget' },
      { id: 'home-chores-card', label: 'Chores Card', description: "Today's chores card" },
      { id: 'home-events-card', label: 'Events Card', description: "Today's events card" },
      { id: 'home-weather-widget', label: 'Weather Widget', description: 'Weather display widget' },
      { id: 'home-leaderboard-widget', label: 'Leaderboard Widget', description: 'Points leaderboard' },
      { id: 'home-meals-widget', label: 'Meals Widget', description: 'Upcoming meals preview' },
      { id: 'home-shopping-widget', label: 'Shopping Widget', description: 'Shopping list preview' },
      { id: 'home-earnings-widget', label: 'Earnings Widget', description: 'Earnings summary' },
      { id: 'home-family-widget', label: 'Family Widget', description: 'Family members display' },
      { id: 'home-announcements-widget', label: 'Announcements Widget', description: 'Family announcements' },
    ],
    calendar: [
      { id: 'calendar-background', label: 'Page Background', description: 'Calendar page background' },
      { id: 'calendar-title', label: 'Page Title', description: 'Month/Year heading text' },
      { id: 'calendar-grid', label: 'Calendar Grid', description: 'Main calendar card' },
      { id: 'calendar-meal-widget', label: 'Meal Planner', description: 'Weekly meal plan widget' },
      { id: 'calendar-user-card', label: 'User Schedule Cards', description: "Member's daily schedule cards" },
    ],
    chores: [
      { id: 'chores-background', label: 'Page Background', description: 'Chores page background' },
      { id: 'chores-task-card', label: 'Task List Card', description: 'Main chores list' },
      { id: 'chores-paid-card', label: 'Paid Chores Card', description: 'Paid chores/race section' },
    ],
    shopping: [
      { id: 'shopping-background', label: 'Page Background', description: 'Shopping page background' },
      { id: 'shopping-filter-widget', label: 'Filter Widget', description: 'Category filter bar' },
      { id: 'shopping-list-card', label: 'Shopping List', description: 'Main shopping list card' },
    ],
    messages: [
      { id: 'messages-background', label: 'Page Background', description: 'Messages page background' },
      { id: 'messages-announcements-card', label: 'Announcements', description: 'Family announcements section' },
      { id: 'messages-chat-card', label: 'Chat Card', description: 'Direct messages section' },
    ],
    settings: [
      { id: 'settings-background', label: 'Page Background', description: 'Settings page background' },
      { id: 'settings-nav-card', label: 'Navigation Card', description: 'Settings navigation sidebar' },
      { id: 'settings-content-card', label: 'Content Card', description: 'Settings content area' },
    ],
    budget: [
      { id: 'budget-background', label: 'Page Background', description: 'Budget page background' },
    ],
    meals: [
      { id: 'meals-background', label: 'Page Background', description: 'Meals page background' },
    ],
    recipes: [
      { id: 'recipes-background', label: 'Page Background', description: 'Recipes page background' },
    ],
    paidchores: [
      { id: 'paidchores-background', label: 'Page Background', description: 'Paid Chores page background' },
    ],
    family: [
      { id: 'family-background', label: 'Page Background', description: 'Family page background' },
    ],
    store: [
      { id: 'store-background', label: 'Page Background', description: 'Store page background' },
    ],
    modal: [
      { id: 'modal', label: 'Modal Dialog', description: 'Popup dialog styling' },
    ],
    login: isAdmin && !isSystemTheme ? [
      { id: 'login-page', label: 'Login Page', description: 'Household branding (login screen)' },
    ] : [],
    kiosk: isAdmin && !isSystemTheme ? [
      { id: 'kiosk', label: 'Kiosk Mode', description: 'Tablet/kiosk PIN login screen' },
    ] : [],
  };

  // Get current page elements
  const currentPageElements = pageElements[currentPage] || [];
  const pageName = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);

  const renderElementButton = (el: { id: ThemeableElement; label: string; description: string }) => {
    const hasCustomStyle = elementStyles[el.id] && Object.keys(elementStyles[el.id]!).length > 0;
    return (
      <button
        key={el.id}
        onClick={() => !isSystemTheme && onSelectElement(el.id)}
        disabled={isSystemTheme}
        className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
          selectedElement === el.id
            ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500'
            : isSystemTheme
              ? 'bg-gray-50 dark:bg-gray-700/50 opacity-50 cursor-not-allowed'
              : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isSystemTheme ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
              {el.label}
            </span>
            {hasCustomStyle && !isSystemTheme && (
              <span className="px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded">
                Custom
              </span>
            )}
            {isSystemTheme && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded">
                Locked
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {el.description}
          </p>
        </div>
      </button>
    );
  };

  // Determine if current page supports "Apply to all"
  const canApplyToAll = ['home', 'calendar', 'chores', 'shopping', 'messages', 'settings', 'store'].includes(currentPage);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isSystemTheme
          ? 'HabiTrack Classic cannot be modified. This is the default branding.'
          : `Editing ${pageName} page. Click an element below or in the preview to customize.`}
      </p>

      {/* Current Page Elements */}
      {currentPageElements.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {pageName} Page Elements
            </h4>
            {!isSystemTheme && canApplyToAll && (
              <button
                onClick={() => onApplyPageToAll(currentPage as 'home' | 'calendar' | 'chores' | 'shopping' | 'messages' | 'settings' | 'store')}
                className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                title={`Apply ${pageName} page styling to all other pages`}
              >
                Apply to all pages
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {currentPageElements.map(renderElementButton)}
          </div>
        </div>
      )}

      {/* Global Elements */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
          Global Elements
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Shared across all pages
        </p>
        <div className="space-y-1.5">
          {globalElements.map(renderElementButton)}
        </div>
      </div>
    </div>
  );
}
