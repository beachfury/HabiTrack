// apps/web/src/pages/HomePage.tsx
import { useState, useEffect, useCallback } from 'react';
import { GridLayout, useContainerWidth, useResponsiveLayout, LayoutItem } from 'react-grid-layout';
import { Plus, Settings, RotateCcw, GripVertical, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dashboardApi, WidgetLayout, DashboardWidget, DashboardData } from '../api/dashboard';
import { widgetRegistry, getWidgetData, getWidgetThemedClass } from '../components/dashboard/widgets';
import { WidgetSandbox } from '../components/dashboard/WidgetSandbox';
import { WidgetConfigModal } from '../components/dashboard/WidgetConfigModal';
import { ModalPortal, ModalBody } from '../components/common/ModalPortal';
import { PageHeader } from '../components/common/PageHeader';

import 'react-grid-layout/css/styles.css';

export function HomePage() {
  const { user } = useAuth();
  const { getPageAnimationClasses } = useTheme();
  const { width, containerRef, mounted } = useContainerWidth();

  // Get animation classes for the home page background
  const animationClasses = getPageAnimationClasses('home-background');
  const [layouts, setLayouts] = useState<WidgetLayout[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<DashboardWidget[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [configModal, setConfigModal] = useState<{
    widgetId: string;
    widgetName: string;
    configSchema: Record<string, unknown>;
    currentConfig: Record<string, unknown>;
  } | null>(null);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [layoutData, widgetsData, data] = await Promise.all([
        dashboardApi.getLayout(),
        dashboardApi.getAvailableWidgets(),
        dashboardApi.getDashboardData(),
      ]);
      setLayouts(layoutData);
      setAvailableWidgets(widgetsData);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Convert layouts to react-grid-layout format
  const gridLayout: LayoutItem[] = layouts.filter(l => l.visible).map((layout) => ({
    i: layout.widgetId,
    x: layout.x,
    y: layout.y,
    w: layout.w,
    h: layout.h,
    minW: layout.minW ?? undefined,
    minH: layout.minH ?? undefined,
    maxW: layout.maxW ?? undefined,
    maxH: layout.maxH ?? undefined,
  }));

  // Get responsive layout
  const responsiveLayouts = {
    lg: gridLayout,
    md: gridLayout,
    sm: gridLayout.map(l => ({ ...l, w: Math.min(l.w, 2) })),
    xs: gridLayout.map(l => ({ ...l, w: Math.min(l.w, 2) })),
    xxs: gridLayout.map(l => ({ ...l, w: 1 })),
  };

  const { layout: currentLayout, cols } = useResponsiveLayout({
    width,
    layouts: responsiveLayouts,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 4, md: 4, sm: 2, xs: 2, xxs: 1 },
  });

  // Handle layout change
  const handleLayoutChange = (newLayout: readonly LayoutItem[]) => {
    if (!isEditing) return;

    const updatedLayouts = layouts.map((layout) => {
      const gridItem = newLayout.find((item) => item.i === layout.widgetId);
      if (gridItem) {
        return {
          ...layout,
          x: gridItem.x,
          y: gridItem.y,
          w: gridItem.w,
          h: gridItem.h,
        };
      }
      return layout;
    });

    setLayouts(updatedLayouts);
  };

  // Save layout when editing ends
  const handleSaveLayout = async () => {
    try {
      await dashboardApi.saveLayout(layouts);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  };

  // Add a widget
  const handleAddWidget = async (widgetId: string) => {
    try {
      const widget = availableWidgets.find((w) => w.id === widgetId);
      if (!widget) return;

      // Find a good position for the new widget
      const maxY = Math.max(...layouts.filter(l => l.visible).map((l) => l.y + l.h), 0);

      const newLayout = await dashboardApi.addWidget(widgetId, {
        x: 0,
        y: maxY,
        w: widget.defaultW,
        h: widget.defaultH,
      });

      setLayouts([...layouts.filter(l => l.widgetId !== widgetId), newLayout]);
      setShowWidgetPicker(false);
    } catch (error) {
      console.error('Failed to add widget:', error);
    }
  };

  // Remove a widget
  const handleRemoveWidget = async (widgetId: string) => {
    try {
      await dashboardApi.removeWidget(widgetId);
      setLayouts(layouts.map(l =>
        l.widgetId === widgetId ? { ...l, visible: false } : l
      ));
    } catch (error) {
      console.error('Failed to remove widget:', error);
    }
  };

  // Reset dashboard
  const handleReset = async () => {
    if (!confirm('Reset dashboard to default layout?')) return;
    try {
      const newLayouts = await dashboardApi.resetDashboard();
      setLayouts(newLayouts);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to reset dashboard:', error);
    }
  };

  // Open config modal for a widget
  const openConfigModal = (layout: WidgetLayout) => {
    setConfigModal({
      widgetId: layout.widgetId,
      widgetName: layout.name || 'Widget',
      configSchema: layout.configSchema!,
      currentConfig: layout.config || {},
    });
  };

  // Save widget config
  const handleSaveConfig = async (config: Record<string, unknown>) => {
    if (!configModal) return;
    try {
      await dashboardApi.updateWidgetConfig(configModal.widgetId, config);
      setLayouts((prev) =>
        prev.map((l) =>
          l.widgetId === configModal.widgetId ? { ...l, config } : l
        )
      );
      setConfigModal(null);
    } catch (error) {
      console.error('Failed to save widget config:', error);
    }
  };

  // Get widgets not currently visible
  const hiddenWidgets = availableWidgets.filter(
    (widget) => !layouts.find((l) => l.widgetId === widget.id && l.visible)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 min-h-screen themed-home-bg ${animationClasses}`} ref={containerRef}>
      {/* Header */}
      <PageHeader
        title="Home"
        titleClassName="themed-home-title"
        actions={
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setShowWidgetPicker(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-success)] text-[var(--color-success-foreground)] rounded-[var(--radius-md)] hover:brightness-110 transition-all"
                >
                  <Plus size={16} />
                  Add Widget
                </button>
                <button
                  onClick={handleReset}
                  className="themed-btn-secondary flex items-center gap-1 text-sm transition-colors"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
                <button
                  onClick={handleSaveLayout}
                  className="themed-btn-primary flex items-center gap-1 text-sm transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    loadDashboard(); // Reload to discard changes
                  }}
                  className="themed-btn-secondary flex items-center gap-1 text-sm transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="themed-btn-secondary flex items-center gap-1 text-sm transition-colors"
              >
                <Settings size={16} />
                Customize
              </button>
            )}
          </div>
        }
      />

      {/* Widget Grid */}
      {mounted && width > 0 && (
        <GridLayout
          className="layout"
          layout={currentLayout}
          width={width}
          gridConfig={{
            cols,
            rowHeight: 150,
            margin: [16, 16],
            containerPadding: [0, 0],
          }}
          dragConfig={{
            enabled: isEditing,
            handle: '.widget-drag-handle',
          }}
          resizeConfig={{
            enabled: isEditing,
          }}
          onLayoutChange={handleLayoutChange}
        >
          {layouts
            .filter((layout) => layout.visible)
            .map((layout) => {
              const registryEntry = widgetRegistry.get(layout.widgetId);
              const widgetInfo = availableWidgets.find((w) => w.id === layout.widgetId);
              const themedClass = getWidgetThemedClass(layout.widgetId);
              // Use DB configSchema with fallback to registry manifest
              const effectiveConfigSchema = layout.configSchema ?? registryEntry?.manifest.configSchema ?? null;

              if (!registryEntry) {
                return (
                  <div
                    key={layout.widgetId}
                    className={themedClass}
                  >
                    <p className="text-[var(--color-muted-foreground)]">Unknown widget: {layout.widgetId}</p>
                  </div>
                );
              }

              const WidgetComponent = registryEntry.component;
              const props = getWidgetData(layout.widgetId, dashboardData as Record<string, unknown>, user?.id, layout.config);

              return (
                <div
                  key={layout.widgetId}
                  className={`${themedClass} overflow-hidden`}
                  style={{ padding: 0 }}
                >
                  {isEditing && (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-muted)] border-b border-[var(--color-border)]">
                      <div className="widget-drag-handle flex items-center gap-1 cursor-grab text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                        <GripVertical size={14} />
                        <span className="text-xs font-medium">{widgetInfo?.name || registryEntry.manifest.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {effectiveConfigSchema && typeof effectiveConfigSchema === 'object' && Object.keys(effectiveConfigSchema).length > 0 && (
                          <button
                            onClick={() => openConfigModal({ ...layout, configSchema: effectiveConfigSchema as Record<string, unknown> })}
                            className="p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors"
                            title="Widget settings"
                          >
                            <Settings size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveWidget(layout.widgetId)}
                          className="p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className={`p-[var(--card-padding)] h-full ${isEditing ? 'pt-2' : ''}`}>
                    <WidgetSandbox widgetId={layout.widgetId}>
                      <WidgetComponent {...props} />
                    </WidgetSandbox>
                  </div>
                </div>
              );
            })}
        </GridLayout>
      )}

      {/* Empty State */}
      {layouts.filter((l) => l.visible).length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--color-muted-foreground)] mb-4">
            Your dashboard is empty. Add some widgets to get started!
          </p>
          <button
            onClick={() => {
              setIsEditing(true);
              setShowWidgetPicker(true);
            }}
            className="themed-btn-primary inline-flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Add Widgets
          </button>
        </div>
      )}

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <ModalPortal
          isOpen={true}
          onClose={() => setShowWidgetPicker(false)}
          title="Add Widget"
          size="lg"
        >
          <ModalBody>
            {hiddenWidgets.length === 0 ? (
              <p className="text-center text-[var(--color-muted-foreground)] py-8">
                All widgets are already on your dashboard!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {hiddenWidgets.map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => handleAddWidget(widget.id)}
                    className="flex flex-col items-start p-3 bg-[var(--color-muted)] rounded-[var(--radius-md)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors text-left"
                  >
                    <span className="font-medium text-[var(--color-foreground)]">
                      {widget.name}
                    </span>
                    {widget.description && (
                      <span className="text-xs text-[var(--color-muted-foreground)] mt-1">
                        {widget.description}
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-primary)] mt-2 capitalize">
                      {widget.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ModalBody>
        </ModalPortal>
      )}

      {/* Widget Config Modal */}
      {configModal && (
        <WidgetConfigModal
          isOpen={true}
          onClose={() => setConfigModal(null)}
          widgetName={configModal.widgetName}
          configSchema={configModal.configSchema}
          currentConfig={configModal.currentConfig}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
}
