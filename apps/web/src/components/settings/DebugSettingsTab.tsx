// apps/web/src/components/settings/DebugSettingsTab.tsx
// Debug logging settings (admin only)

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bug,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  FileText,
  AlertCircle,
  Check,
  AlertTriangle,
  Radio,
  Square,
  Filter,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

interface DebugSettings {
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  logToFile: boolean;
  logRetentionDays: number;
  debugModeAutoDisableHours: number;
  debugModeEnabledAt: string | null;
  debugModeExpiresAt: string | null;
}

interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  data?: any;
}

async function request(path: string, options?: RequestInit) {
  const res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export function DebugSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [settings, setSettings] = useState<DebugSettings>({
    debugMode: false,
    logLevel: 'error',
    logToFile: false,
    logRetentionDays: 7,
    debugModeAutoDisableHours: 4,
    debugModeEnabledAt: null,
    debugModeExpiresAt: null,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFiles, setLogFiles] = useState<Array<{ name: string; size: number; modified: string }>>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Live view state
  const [liveView, setLiveView] = useState(false);
  const [liveInterval, setLiveIntervalValue] = useState(3); // seconds
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    fetchDebugSettings();
  }, []);

  // Live view polling
  const fetchLogsQuietly = useCallback(async () => {
    try {
      const levelParam = filterLevel !== 'all' ? `&level=${filterLevel}` : '';
      const data = await request(`/api/debug/logs?limit=200${levelParam}`);
      setLogs(data.logs || []);

      // Auto-scroll to bottom if enabled
      if (autoScroll && logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    } catch {
      // Silently fail during live view to avoid spamming errors
    }
  }, [filterLevel, autoScroll]);

  useEffect(() => {
    if (liveView && showLogs) {
      // Initial fetch
      fetchLogsQuietly();

      // Set up interval
      liveIntervalRef.current = setInterval(fetchLogsQuietly, liveInterval * 1000);

      return () => {
        if (liveIntervalRef.current) {
          clearInterval(liveIntervalRef.current);
          liveIntervalRef.current = null;
        }
      };
    } else {
      // Clear interval when live view is disabled
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    }
  }, [liveView, showLogs, liveInterval, fetchLogsQuietly]);

  const fetchDebugSettings = async () => {
    try {
      const data = await request('/api/debug/settings');
      setSettings(data.settings);
      setLogFiles(data.logFiles || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load debug settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const levelParam = filterLevel !== 'all' ? `&level=${filterLevel}` : '';
      const data = await request(`/api/debug/logs?limit=200${levelParam}`);
      setLogs(data.logs || []);
      setShowLogs(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load logs');
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');
    try {
      await request('/api/debug/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSuccess('Debug settings saved!');
      // Refresh to get updated expiration time
      await fetchDebugSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportLogs = async (format: 'txt' | 'json') => {
    try {
      const response = await fetch(`${API_BASE}/api/debug/logs/export?format=${format}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habitrack-debug-${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'log'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Logs exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to export logs');
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Clear all logs from memory? This cannot be undone.')) return;

    try {
      await request('/api/debug/logs', { method: 'DELETE' });
      setLogs([]);
      setSuccess('Logs cleared!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to clear logs');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'error': return 'text-[var(--color-destructive)]';
      case 'warn': return 'text-[var(--color-warning)]';
      case 'info': return 'text-[var(--color-info)]';
      case 'debug': return 'text-[var(--color-muted-foreground)]';
      default: return 'text-[var(--color-foreground)]';
    }
  };

  const getLevelBgColor = (level: string): string => {
    switch (level) {
      case 'error': return 'bg-[var(--color-destructive)]/10';
      case 'warn': return 'bg-[var(--color-warning)]/10';
      case 'info': return 'bg-[var(--color-info)]/10';
      case 'debug': return 'bg-[var(--color-muted)]/10';
      default: return '';
    }
  };

  // Get unique categories from logs
  const categories = ['all', ...new Set(logs.map(l => l.category))];

  // Filter logs by category (level filtering is done server-side)
  const filteredLogs = filterCategory === 'all'
    ? logs
    : logs.filter(l => l.category === filterCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Bug className="text-[var(--color-primary)]" />
          Debug Logging
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Configure logging for troubleshooting issues
        </p>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="p-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-lg text-[var(--color-success)] flex items-center gap-2 text-sm">
          <Check size={16} />
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-lg text-[var(--color-destructive)] flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Debug Mode Toggle */}
      <div className="p-4 bg-[var(--color-muted)]/50 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[var(--color-foreground)]">Debug Mode</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Enable verbose logging for troubleshooting
            </p>
            {settings.debugMode && settings.debugModeExpiresAt && (
              <p className="text-xs text-[var(--color-warning)] mt-1 flex items-center gap-1">
                <Clock size={12} />
                Auto-disables at {new Date(settings.debugModeExpiresAt).toLocaleTimeString()}
              </p>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.debugMode}
              onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--color-muted)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
          </label>
        </div>

        {/* Security notice when debug is on */}
        {settings.debugMode && (
          <div className="p-3 rounded-lg flex items-start gap-2 text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)', color: 'var(--color-warning)' }}>
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Debug mode is enabled</p>
              <p className="text-xs mt-1">
                Verbose logging captures additional data. For security, debug mode will automatically
                disable after {settings.debugModeAutoDisableHours} hour{settings.debugModeAutoDisableHours !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        )}

        {/* Auto-disable Timeout */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            Auto-disable After (hours)
          </label>
          <input
            type="number"
            min={1}
            max={24}
            value={settings.debugModeAutoDisableHours}
            onChange={(e) => setSettings({ ...settings, debugModeAutoDisableHours: parseInt(e.target.value) || 4 })}
            className="themed-input w-24"
          />
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            Debug mode will automatically turn off after this many hours (1-24)
          </p>
        </div>

        {/* Log Level */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            Log Level
          </label>
          <select
            value={settings.logLevel}
            onChange={(e) => setSettings({ ...settings, logLevel: e.target.value as any })}
            className="themed-input w-full max-w-xs"
          >
            <option value="error">Error - Errors only (recommended)</option>
            <option value="warn">Warn - Errors and warnings</option>
            <option value="info">Info - General information</option>
            <option value="debug">Debug - Verbose debugging</option>
          </select>
        </div>

        {/* Log to File */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-[var(--color-foreground)]">Log to File</h4>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Write logs to disk for persistence
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.logToFile}
              onChange={(e) => setSettings({ ...settings, logToFile: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--color-muted)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
          </label>
        </div>

        {/* Log Retention */}
        {settings.logToFile && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Log Retention (days)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={settings.logRetentionDays}
              onChange={(e) => setSettings({ ...settings, logRetentionDays: parseInt(e.target.value) || 7 })}
              className="themed-input w-24"
            />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
              Log files older than this will be automatically deleted (1-30 days)
            </p>
          </div>
        )}

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="themed-btn-primary text-sm"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Log Viewer & Export */}
      <div className="p-4 bg-[var(--color-muted)]/50 rounded-xl">
        <h3 className="font-medium text-[var(--color-foreground)] mb-3 flex items-center gap-2">
          <FileText size={18} />
          Log Console
        </h3>

        {/* Controls Row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => {
              fetchLogs();
              if (!showLogs) setShowLogs(true);
            }}
            className="themed-btn-secondary text-sm flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {/* Live View Toggle */}
          <button
            onClick={() => {
              if (!showLogs) {
                fetchLogs();
                setShowLogs(true);
              }
              setLiveView(!liveView);
            }}
            className={`text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
              liveView
                ? 'bg-[var(--color-success)]/20 border-[var(--color-success)]/50 text-[var(--color-success)]'
                : 'themed-btn-secondary'
            }`}
          >
            {liveView ? (
              <>
                <Radio size={16} className="animate-pulse" />
                Live ({liveInterval}s)
              </>
            ) : (
              <>
                <Radio size={16} />
                Start Live View
              </>
            )}
          </button>

          {liveView && (
            <select
              value={liveInterval}
              onChange={(e) => setLiveIntervalValue(parseInt(e.target.value))}
              className="themed-input text-sm py-1.5"
            >
              <option value={1}>1s refresh</option>
              <option value={2}>2s refresh</option>
              <option value={3}>3s refresh</option>
              <option value={5}>5s refresh</option>
              <option value={10}>10s refresh</option>
            </select>
          )}

          <button
            onClick={() => handleExportLogs('txt')}
            className="themed-btn-secondary text-sm flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>

          <button
            onClick={handleClearLogs}
            className="themed-btn-secondary text-sm flex items-center gap-2 text-[var(--color-destructive)]"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>

        {/* Filters Row (when logs are shown) */}
        {showLogs && (
          <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--color-muted-foreground)]" />
              <span className="text-[var(--color-muted-foreground)]">Filter:</span>
            </div>

            <select
              value={filterLevel}
              onChange={(e) => {
                setFilterLevel(e.target.value);
                // Refetch with new filter
                setTimeout(fetchLogs, 0);
              }}
              className="themed-input text-sm py-1"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="themed-input text-sm py-1"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {liveView && (
              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
                <span className="text-[var(--color-muted-foreground)]">Auto-scroll</span>
              </label>
            )}
          </div>
        )}

        {/* Log Files on Disk */}
        {logFiles.length > 0 && !showLogs && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-[var(--color-foreground)] mb-2">Log Files on Disk</h4>
            <div className="space-y-1">
              {logFiles.map((file) => (
                <div key={file.name} className="flex items-center justify-between text-sm p-2 bg-[var(--color-background)] rounded">
                  <span className="text-[var(--color-foreground)]">{file.name}</span>
                  <span className="text-[var(--color-muted-foreground)]">{formatBytes(file.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Log Console Output */}
      {showLogs && (
        <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-gray-100 flex items-center gap-2">
                {liveView && <span className="w-2 h-2 bg-[var(--color-success)] rounded-full animate-pulse" />}
                Console
              </h3>
              <span className="text-xs text-gray-500">
                {filteredLogs.length} entries
              </span>
            </div>
            <button
              onClick={() => {
                setShowLogs(false);
                setLiveView(false);
              }}
              className="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-1"
            >
              <Square size={14} />
              Close
            </button>
          </div>

          <div
            ref={logContainerRef}
            className="h-96 overflow-y-auto bg-black/50 rounded-lg p-3 font-mono text-xs space-y-0.5"
          >
            {filteredLogs.length === 0 ? (
              <p className="text-gray-500">
                {liveView
                  ? 'Waiting for logs... Perform some actions in the app to see logs appear here.'
                  : 'No logs available. Enable debug mode and perform some actions to see logs.'}
              </p>
            ) : (
              filteredLogs.map((log, i) => (
                <div
                  key={`${log.timestamp}-${i}`}
                  className={`flex gap-2 py-0.5 px-1 rounded ${getLevelBgColor(log.level)} hover:bg-white/5`}
                >
                  <span className="text-gray-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`shrink-0 uppercase w-12 font-semibold ${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="text-cyan-400 shrink-0">[{log.category}]</span>
                  <span className="text-gray-200 break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>
              {liveView ? `Auto-refreshing every ${liveInterval}s` : 'Manual refresh mode'}
            </span>
            {filteredLogs.length > 0 && (
              <span>
                Latest: {new Date(filteredLogs[filteredLogs.length - 1]?.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
