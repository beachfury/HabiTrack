// apps/web/src/components/settings/AboutTab.tsx
// About section showing app info, version, system diagnostics, household info, and updates

import { useState, useEffect } from 'react';
import {
  Info,
  Server,
  Database,
  Clock,
  HardDrive,
  Home,
  Users,
  RefreshCw,
  ExternalLink,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UpdateModal } from './UpdateModal';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

interface VersionInfo {
  version: string;
  name: string;
  environment: string;
}

interface SystemInfo {
  app: {
    version: string;
    name: string;
  };
  server: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
    };
  };
  database: {
    type: string;
    version: string;
    sizeMB: number;
    tableCount: number;
  };
  timestamp: string;
}

interface HouseholdInfo {
  name: string;
  memberCount: number;
  createdAt?: string;
}

interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseName?: string;
  releaseNotes?: string;
  releaseUrl?: string;
  publishedAt?: string;
  message?: string;
}

async function request(path: string) {
  const res = await fetch(API_BASE + path, { credentials: 'include' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  return res.json();
}

export function AboutTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [householdInfo, setHouseholdInfo] = useState<HouseholdInfo | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(false);

  // Update state
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    fetchBasicInfo();
  }, []);

  const fetchBasicInfo = async () => {
    try {
      // Fetch version (public endpoint)
      const versionData = await request('/api/version');
      setVersion(versionData);

      // Fetch household info
      try {
        const householdData = await request('/api/settings/household');
        const membersData = await request('/api/family/members');
        setHouseholdInfo({
          name: householdData.household?.householdName || 'My Household',
          memberCount: membersData.members?.length || 0,
        });
      } catch {
        // Non-admin may not have access to household settings
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load info');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemInfo = async () => {
    setLoadingSystem(true);
    setError('');
    try {
      const data = await request('/api/debug/system');
      setSystemInfo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load system info');
    } finally {
      setLoadingSystem(false);
    }
  };

  const checkForUpdates = async () => {
    setCheckingUpdates(true);
    setUpdateError('');
    try {
      const data = await request('/api/updates/check');
      setUpdateInfo(data);
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to check for updates');
    } finally {
      setCheckingUpdates(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Info className="text-[var(--color-primary)]" />
          About HabiTrack
        </h2>
      </div>

      {error && (
        <div className="p-3 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-lg text-[var(--color-destructive)] text-sm">
          {error}
        </div>
      )}

      {/* App Info Card */}
      <div className="p-6 bg-[var(--color-muted)]/50 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            H
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-[var(--color-foreground)]">
              {version?.name || 'HabiTrack'}
            </h3>
            <p className="text-[var(--color-muted-foreground)] mt-1">
              Family household management made simple
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full text-sm font-medium">
                v{version?.version || '1.0.0'}
              </span>
              {version?.environment && (
                <span className="px-3 py-1 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-full text-sm">
                  {version.environment}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            HabiTrack helps families manage chores, shopping lists, meal planning, budgets, and more.
            Keep everyone organized and on the same page.
          </p>
        </div>
      </div>

      {/* Updates Section (Admin only) */}
      {isAdmin && (
        <div className="p-4 bg-[var(--color-muted)]/50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[var(--color-foreground)] flex items-center gap-2">
              <ArrowUpCircle size={18} className="text-[var(--color-primary)]" />
              Software Updates
            </h3>
            <button
              onClick={checkForUpdates}
              disabled={checkingUpdates}
              className="themed-btn-secondary text-sm flex items-center gap-2"
            >
              <RefreshCw size={14} className={checkingUpdates ? 'animate-spin' : ''} />
              {checkingUpdates ? 'Checking...' : 'Check for Updates'}
            </button>
          </div>

          {updateError && (
            <div className="p-3 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-lg text-[var(--color-destructive)] text-sm mb-4">
              {updateError}
            </div>
          )}

          {updateInfo ? (
            updateInfo.updateAvailable ? (
              <div className="p-4 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Download className="text-[var(--color-primary)] mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-medium text-[var(--color-foreground)]">
                      Update Available: {updateInfo.releaseName || `v${updateInfo.latestVersion}`}
                    </h4>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                      Current version: v{updateInfo.currentVersion} → Latest: v{updateInfo.latestVersion}
                    </p>
                    {updateInfo.publishedAt && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                        Released: {formatDate(updateInfo.publishedAt)}
                      </p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setShowUpdateModal(true)}
                        className="themed-btn-primary text-sm flex items-center gap-2"
                      >
                        <Download size={14} />
                        Update Now
                      </button>
                      {updateInfo.releaseUrl && (
                        <a
                          href={updateInfo.releaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="themed-btn-secondary text-sm flex items-center gap-2"
                        >
                          <ExternalLink size={14} />
                          View Release Notes
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[var(--color-background)] rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">You're up to date!</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Running version v{updateInfo.currentVersion}
                      {updateInfo.message && ` - ${updateInfo.message}`}
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Click "Check for Updates" to see if a newer version is available.
            </p>
          )}
        </div>
      )}

      {/* Household Info */}
      {householdInfo && (
        <div className="p-4 bg-[var(--color-muted)]/50 rounded-xl">
          <h3 className="font-medium text-[var(--color-foreground)] mb-4 flex items-center gap-2">
            <Home size={18} className="text-[var(--color-primary)]" />
            Your Household
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-[var(--color-background)] rounded-lg">
              <div className="flex items-center gap-2 text-[var(--color-muted-foreground)] text-sm mb-1">
                <Home size={14} />
                Household Name
              </div>
              <p className="font-medium text-[var(--color-foreground)]">{householdInfo.name}</p>
            </div>
            <div className="p-3 bg-[var(--color-background)] rounded-lg">
              <div className="flex items-center gap-2 text-[var(--color-muted-foreground)] text-sm mb-1">
                <Users size={14} />
                Family Members
              </div>
              <p className="font-medium text-[var(--color-foreground)]">{householdInfo.memberCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* System Diagnostics (Admin only - collapsible) */}
      {isAdmin && (
        <div className="p-4 bg-[var(--color-muted)]/50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[var(--color-foreground)] flex items-center gap-2">
              <Server size={18} className="text-[var(--color-primary)]" />
              System Information
            </h3>
            <button
              onClick={fetchSystemInfo}
              disabled={loadingSystem}
              className="themed-btn-secondary text-sm flex items-center gap-2"
            >
              <RefreshCw size={14} className={loadingSystem ? 'animate-spin' : ''} />
              {loadingSystem ? 'Loading...' : systemInfo ? 'Refresh' : 'Load'}
            </button>
          </div>

          {systemInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Server Info */}
              <div className="p-3 bg-[var(--color-background)] rounded-lg">
                <h4 className="text-sm font-medium text-[var(--color-foreground)] mb-2 flex items-center gap-2">
                  <Clock size={14} />
                  Server
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">Node.js</span>
                    <span className="text-[var(--color-foreground)]">{systemInfo.server.nodeVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">Platform</span>
                    <span className="text-[var(--color-foreground)]">{systemInfo.server.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">Uptime</span>
                    <span className="text-[var(--color-foreground)]">{formatUptime(systemInfo.server.uptime)}</span>
                  </div>
                </div>
              </div>

              {/* Memory Info */}
              <div className="p-3 bg-[var(--color-background)] rounded-lg">
                <h4 className="text-sm font-medium text-[var(--color-foreground)] mb-2 flex items-center gap-2">
                  <HardDrive size={14} />
                  Memory
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">Heap Used</span>
                    <span className="text-[var(--color-foreground)]">~{systemInfo.server.memory.heapUsedMB} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">Heap Total</span>
                    <span className="text-[var(--color-foreground)]">~{systemInfo.server.memory.heapTotalMB} MB</span>
                  </div>
                </div>
              </div>

              {/* Database Info */}
              <div className="p-3 bg-[var(--color-background)] rounded-lg md:col-span-2">
                <h4 className="text-sm font-medium text-[var(--color-foreground)] mb-2 flex items-center gap-2">
                  <Database size={14} />
                  Database
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--color-muted-foreground)] block">Type</span>
                    <span className="text-[var(--color-foreground)] font-medium">{systemInfo.database.type}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)] block">Version</span>
                    <span className="text-[var(--color-foreground)] font-medium">{systemInfo.database.version}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)] block">Size</span>
                    <span className="text-[var(--color-foreground)] font-medium">~{systemInfo.database.sizeMB} MB</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)] block">Tables</span>
                    <span className="text-[var(--color-foreground)] font-medium">{systemInfo.database.tableCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Click "Load" to view server and database diagnostics
            </p>
          )}
        </div>
      )}

      {/* Links / Credits */}
      <div className="p-4 bg-[var(--color-muted)]/50 rounded-xl">
        <h3 className="font-medium text-[var(--color-foreground)] mb-3">Resources</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/beachfury/HabiTrack"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-[var(--color-background)] rounded-lg text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <ExternalLink size={14} />
            Documentation
          </a>
          <a
            href="https://github.com/beachfury/HabiTrack/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-[var(--color-background)] rounded-lg text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <ExternalLink size={14} />
            Report an Issue
          </a>
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && updateInfo && (
        <UpdateModal
          updateInfo={updateInfo}
          onClose={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  );
}
