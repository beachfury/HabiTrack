// apps/web/src/pages/StorePage.tsx
// Marketplace page for browsing available widgets and themes

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles, BarChart3, Calendar, CheckSquare, ListChecks, Trophy,
  ShoppingCart, DollarSign, Wallet, Users, Megaphone, CloudSun,
  UtensilsCrossed, Package, Store, Search, Filter, Upload, Download,
  Send, Clock, Check, X, AlertCircle, Palette,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ModalPortal, ModalBody } from '../components/common/ModalPortal';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

// ── Types ──────────────────────────────────────────────────────────────────

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  icon: string;
  tags: string[];
  category: string;
  builtIn?: boolean;
  kidApproved?: boolean;
}

interface StoreRequest {
  id: number;
  userId: number;
  displayName?: string;
  itemType: 'widget' | 'theme';
  itemId: string;
  itemName: string;
  message: string | null;
  status: 'pending' | 'approved' | 'dismissed';
  createdAt: string;
  reviewedAt: string | null;
}

type Tab = 'widgets' | 'themes';

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const iconMap: Record<string, React.ComponentType<any>> = {
  'sparkles': Sparkles, 'bar-chart-3': BarChart3, 'calendar': Calendar,
  'check-square': CheckSquare, 'list-checks': ListChecks, 'trophy': Trophy,
  'shopping-cart': ShoppingCart, 'dollar-sign': DollarSign, 'wallet': Wallet,
  'users': Users, 'megaphone': Megaphone, 'cloud-sun': CloudSun,
  'utensils-crossed': UtensilsCrossed,
};

const getIcon = (name: string) => iconMap[name] || Package;

/** Shared input styling for themed form controls */
const inputStyle = {
  backgroundColor: 'var(--color-background)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-foreground)',
};

const badgeMuted = 'text-[10px] font-medium px-2 py-0.5 rounded-full';

// ── Component ──────────────────────────────────────────────────────────────

export function StorePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data
  const [widgets, setWidgets] = useState<CatalogItem[]>([]);
  const [themes, setThemes] = useState<CatalogItem[]>([]);
  const [requests, setRequests] = useState<StoreRequest[]>([]);

  // UI
  const [activeTab, setActiveTab] = useState<Tab>('widgets');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ title: '', description: '', type: 'widget' as 'widget' | 'theme' });
  const [importResult, setImportResult] = useState<{ success?: boolean; warnings?: string[]; error?: string } | null>(null);

  // ── Data Fetching ─────────────────────────────────────────────────────

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi<{ widgets: CatalogItem[]; themes: CatalogItem[] }>('/api/store/catalog');
      setWidgets(data.widgets || []);
      setThemes(data.themes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await fetchApi<{ requests: StoreRequest[] }>('/api/store/requests');
      setRequests(data.requests || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchCatalog(); fetchRequests(); }, [fetchCatalog, fetchRequests]);

  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  // ── Actions ───────────────────────────────────────────────────────────

  const handleSubmitRequest = async () => {
    if (!requestForm.title.trim()) return;
    try {
      await fetchApi('/api/store/requests', {
        method: 'POST',
        body: JSON.stringify({
          itemType: requestForm.type,
          itemId: requestForm.title.toLowerCase().replace(/\s+/g, '-'),
          itemName: requestForm.title,
          message: requestForm.description || null,
        }),
      });
      setSuccess('Request submitted successfully');
      setShowRequestModal(false);
      setRequestForm({ title: '', description: '', type: 'widget' });
      fetchRequests();
    } catch (err: any) { setError(err.message || 'Failed to submit request'); }
  };

  const handleRequestAction = async (id: number, status: 'approved' | 'dismissed') => {
    try {
      await fetchApi(`/api/store/requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setSuccess(`Request ${status}`);
      fetchRequests();
    } catch (err: any) { setError(err.message || 'Failed to update request'); }
  };

  const handleImportTheme = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    try {
      const themeData = JSON.parse(await file.text());
      const result = await fetchApi<{ success: boolean; warnings?: string[] }>('/api/themes/import', {
        method: 'POST', body: JSON.stringify(themeData),
      });
      setImportResult({ success: true, warnings: result.warnings });
      fetchCatalog();
    } catch (err: any) { setImportResult({ error: err.message || 'Failed to import theme' }); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportTheme = async (themeId: string) => {
    try {
      const res = await fetch(API_BASE + `/api/themes/${themeId}/export`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `theme-${themeId}.habi-theme`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) { setError(err.message || 'Failed to export theme'); }
  };

  // ── Filtering ─────────────────────────────────────────────────────────

  const items = activeTab === 'widgets' ? widgets : themes;
  const categories = ['all', ...new Set(items.map((i) => i.category).filter(Boolean))];
  const lowerSearch = search.toLowerCase();
  const filtered = items.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (!search) return true;
    return item.name.toLowerCase().includes(lowerSearch)
      || item.description.toLowerCase().includes(lowerSearch)
      || item.tags.some((t) => t.toLowerCase().includes(lowerSearch));
  });

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-foreground)] flex items-center gap-3">
              <Store className="text-[var(--color-primary)]" /> Store
            </h1>
            <p className="text-[var(--color-muted-foreground)] mt-1">Browse available widgets and themes for your household</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && activeTab === 'themes' && (
              <button onClick={() => setShowImportModal(true)} className="themed-btn-primary flex items-center gap-2">
                <Upload size={16} /> Import Theme
              </button>
            )}
            {!isAdmin && (
              <button onClick={() => setShowRequestModal(true)} className="themed-btn-secondary flex items-center gap-2">
                <Send size={16} /> Request
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-4 p-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-xl text-[var(--color-success)] flex items-center gap-2 text-sm">
            <Check size={18} /> {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-xl text-[var(--color-destructive)] flex items-center gap-2 text-sm">
            <AlertCircle size={18} /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {(['widgets', 'themes'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCategoryFilter('all'); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                activeTab === tab
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              {tab === 'widgets' ? <Package size={16} /> : <Palette size={16} />}
              {tab === 'widgets' ? 'Widgets' : 'Themes'}
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input
              type="text" placeholder={`Search ${activeTab}...`} value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm" style={inputStyle}
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <select
              value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-lg border text-sm appearance-none cursor-pointer" style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-[var(--color-muted-foreground)]">
            <Sparkles size={32} className="mx-auto mb-3 animate-pulse" /> Loading catalog...
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 themed-card rounded-2xl">
            <Package size={48} className="mx-auto mb-3 text-[var(--color-muted-foreground)]" />
            <p className="text-[var(--color-muted-foreground)]">
              {search || categoryFilter !== 'all' ? 'No items match your search criteria' : `No ${activeTab} available yet`}
            </p>
          </div>
        )}

        {/* Catalog Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {filtered.map((item) => {
              const Icon = getIcon(item.icon);
              return (
                <div key={item.id} className="themed-card rounded-2xl p-5 flex flex-col gap-3 group hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--color-primary, #6366f1)', opacity: 0.12 }}>
                      <Icon size={22} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.builtIn && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">Built-in</span>
                      )}
                      {activeTab === 'themes' && item.kidApproved && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)]">Kid Approved</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--color-foreground)] mb-1">{item.name}</h3>
                    <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
                    <span>by {item.author}</span>
                    <span>v{item.version}</span>
                  </div>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className={`${badgeMuted} rounded-full`} style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}>
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 4 && <span className="text-[10px] text-[var(--color-muted-foreground)]">+{item.tags.length - 4}</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <span className={badgeMuted} style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}>{item.category}</span>
                    {activeTab === 'themes' && (
                      <button onClick={() => handleExportTheme(item.id)} className="text-xs flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity">
                        <Download size={14} /> Export
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pending Requests */}
        {requests.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
              <Clock size={20} className="text-[var(--color-primary)]" />
              {isAdmin ? 'Pending Requests' : 'Your Requests'}
            </h2>
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="themed-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[var(--color-foreground)]">{req.itemName}</span>
                      <span className={badgeMuted} style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}>{req.itemType}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        req.status === 'pending' ? 'bg-[var(--color-warning,#f59e0b)]/15 text-[var(--color-warning,#f59e0b)]'
                          : req.status === 'approved' ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                          : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                      }`}>{req.status}</span>
                    </div>
                    {req.message && <p className="text-sm text-[var(--color-muted-foreground)]">{req.message}</p>}
                    {isAdmin && req.displayName && <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Requested by {req.displayName}</p>}
                  </div>
                  {isAdmin && req.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleRequestAction(req.id, 'approved')} className="themed-btn-primary flex items-center gap-1 text-xs px-3 py-1.5">
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => handleRequestAction(req.id, 'dismissed')} className="themed-btn-secondary flex items-center gap-1 text-xs px-3 py-1.5">
                        <X size={14} /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Request Modal ──────────────────────────────────────────────── */}
      <ModalPortal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Submit a Request" size="md">
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Type</label>
              <select
                value={requestForm.type}
                onChange={(e) => setRequestForm((f) => ({ ...f, type: e.target.value as 'widget' | 'theme' }))}
                className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle}
              >
                <option value="widget">Widget</option>
                <option value="theme">Theme</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Title</label>
              <input
                type="text" value={requestForm.title}
                onChange={(e) => setRequestForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="What would you like to see?"
                className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Description</label>
              <textarea
                value={requestForm.description}
                onChange={(e) => setRequestForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe what you're looking for..." rows={3}
                className="w-full px-3 py-2 rounded-lg border text-sm resize-none" style={inputStyle}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowRequestModal(false)} className="themed-btn-secondary px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={handleSubmitRequest} disabled={!requestForm.title.trim()}
                className="themed-btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
              >
                <Send size={14} /> Submit
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalPortal>

      {/* ── Import Theme Modal ─────────────────────────────────────────── */}
      <ModalPortal isOpen={showImportModal} onClose={() => { setShowImportModal(false); setImportResult(null); }} title="Import Theme" size="md">
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Select a <code className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] text-xs">.habi-theme</code> file to import.
            </p>
            <input
              ref={fileInputRef} type="file" accept=".habi-theme,.json" onChange={handleImportTheme}
              className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:cursor-pointer"
              style={{ color: 'var(--color-foreground)' }}
            />
            {importResult?.success && (
              <div className="p-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-[var(--color-success)] font-medium"><Check size={16} /> Theme imported successfully</div>
                {importResult.warnings && importResult.warnings.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[var(--color-muted-foreground)]">
                    {importResult.warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-[var(--color-warning,#f59e0b)]" /> {w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {importResult?.error && (
              <div className="p-3 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-lg text-sm text-[var(--color-destructive)] flex items-center gap-2">
                <AlertCircle size={16} /> {importResult.error}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => { setShowImportModal(false); setImportResult(null); }} className="themed-btn-secondary px-4 py-2 text-sm">Close</button>
            </div>
          </div>
        </ModalBody>
      </ModalPortal>
    </div>
  );
}
