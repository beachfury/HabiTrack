// apps/web/src/pages/ShoppingPage.tsx
// Refactored - uses components from components/shopping/

import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  Sparkles,
  History,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { shoppingApi } from '../api';
import type {
  ShoppingCategory,
  ShoppingStore,
  CatalogItem,
  ShoppingListItem,
  ShoppingRequest,
  Suggestion,
  StoreRequest,
  AnalyticsData,
  PurchaseHistory,
  ShoppingTotals,
} from '../types';

// Import tab components
import {
  ShoppingListTab,
  CatalogTab,
  PredictionsTab,
  HistoryTab,
  ManageTab,
  MealIngredientsCard,
  CatalogBrowserModal,
  StoreSelectModal,
  NewItemModal,
  EditListItemModal,
} from '../components/shopping';

type Tab = 'list' | 'catalog' | 'predictions' | 'history' | 'manage';

export function ShoppingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isKid = user?.role === 'kid';

  // Data state
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [stores, setStores] = useState<ShoppingStore[]>([]);
  const [listItems, setListItems] = useState<ShoppingListItem[]>([]);
  const [purchasedToday, setPurchasedToday] = useState<ShoppingListItem[]>([]);
  const [requests, setRequests] = useState<ShoppingRequest[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [totals, setTotals] = useState<ShoppingTotals>({ needsOnly: 0, needsPlusWants: 0 });
  const [dueThisWeek, setDueThisWeek] = useState<Suggestion[]>([]);
  const [suggestionStats, setSuggestionStats] = useState<{
    totalSuggestions: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    dueThisWeekCount: number;
  } | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  // Modal state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showNewCatalogItemModal, setShowNewCatalogItemModal] = useState(false);
  const [showStoreSelectModal, setShowStoreSelectModal] = useState(false);
  const [itemForStoreSelect, setItemForStoreSelect] = useState<CatalogItem | null>(null);
  const [editingListItem, setEditingListItem] = useState<ShoppingListItem | null>(null);

  // Fetch data on tab change
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Auto-refresh list
  useEffect(() => {
    if (activeTab === 'list') {
      const interval = setInterval(fetchShoppingList, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      await Promise.all([fetchCategories(), fetchStores()]);

      if (activeTab === 'list') {
        await Promise.all([fetchShoppingList(), fetchSuggestions()]);
      } else if (activeTab === 'catalog') {
        // Fetch requests too for the integrated pending requests panel
        await Promise.all([fetchCatalog(), fetchRequests()]);
      } else if (activeTab === 'predictions') {
        await fetchSuggestions();
      } else if (activeTab === 'history') {
        await Promise.all([fetchAnalytics(), fetchPurchaseHistory()]);
      } else if (activeTab === 'manage' && isAdmin) {
        await Promise.all([fetchStoreRequests(), fetchCatalog()]);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    const data = await shoppingApi.getCategories();
    setCategories(data.categories);
  }

  async function fetchStores() {
    const data = await shoppingApi.getStores();
    setStores(data.stores);
  }

  async function fetchShoppingList() {
    const data = await shoppingApi.getShoppingList();
    const active = data.items.filter((i) => !i.purchasedToday);
    const purchased = data.items.filter((i) => i.purchasedToday);
    setListItems(active);
    setPurchasedToday(purchased);
    setTotals(data.totals);
  }

  async function fetchRequests() {
    const data = await shoppingApi.getRequests();
    setRequests(data.requests);
  }

  async function fetchCatalog(search?: string) {
    const data = await shoppingApi.getCatalogItems(search || searchTerm);
    setCatalogItems(data.items);
  }

  async function fetchSuggestions() {
    const data = await shoppingApi.getSuggestions();
    setSuggestions(data.suggestions || []);
    setDueThisWeek(data.dueThisWeek || []);
    setSuggestionStats(data.stats || null);
  }

  async function fetchStoreRequests() {
    const data = await shoppingApi.getStoreRequests();
    setStoreRequests(data.requests);
  }

  async function fetchAnalytics(days: number = 30) {
    const data = await shoppingApi.getAnalytics(days);
    setAnalytics(data);
  }

  async function fetchPurchaseHistory(days: number = 30) {
    const data = await shoppingApi.getHistory(30);
    setPurchaseHistory(data.purchases);
  }

  // Helpers
  const showSuccessMessage = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Refresh helper for child components
  const handleRefreshAll = () => {
    fetchCategories();
    fetchStores();
    fetchCatalog();
    if (isAdmin) fetchStoreRequests();
  };

  // Handlers
  const handleMarkPurchased = async (id: number) => {
    try {
      await shoppingApi.markAsPurchased(id);
      showSuccessMessage('Marked as purchased!');
      fetchShoppingList();
    } catch (err) {
      setError('Failed to mark as purchased');
    }
  };

  const handleRemoveFromList = async (id: number) => {
    try {
      await shoppingApi.removeFromShoppingList(id);
      showSuccessMessage('Removed from list');
      fetchShoppingList();
    } catch (err) {
      setError('Failed to remove item');
    }
  };

  const handleEditListItem = async (data: {
    listType: 'need' | 'want';
    quantity: number;
    storeId: number | null;
  }) => {
    if (!editingListItem) return;
    try {
      await shoppingApi.updateListItem(editingListItem.id, data);
      showSuccessMessage('Item updated!');
      setEditingListItem(null);
      fetchShoppingList();
    } catch (err) {
      setError('Failed to update item');
    }
  };

  const handleAddSuggestion = async (
    catalogItemId: number,
    quantity?: number,
    storeId?: number | null,
  ) => {
    try {
      await shoppingApi.addToShoppingList({
        catalogItemId,
        listType: 'need',
        quantity: quantity || 1,
        storeId: storeId || undefined,
      });
      showSuccessMessage('Added to list!');
      fetchShoppingList();
      fetchSuggestions();
    } catch (err) {
      setError('Failed to add item');
    }
  };

  const handleAddAllSuggestions = async (confidenceLevel?: string) => {
    try {
      const result = await shoppingApi.addAllSuggestions(confidenceLevel);
      showSuccessMessage(result.message || 'Suggestions added!');
      fetchShoppingList();
      fetchSuggestions();
    } catch (err) {
      setError('Failed to add suggestions');
    }
  };

  const handleDismissSuggestion = (catalogItemId: number) => {
    setSuggestions(suggestions.filter((s) => s.catalogItemId !== catalogItemId));
  };

  const handleAddToListClick = (item: CatalogItem) => {
    setItemForStoreSelect(item);
    setShowStoreSelectModal(true);
  };

  const handleAddToList = async (data: {
    catalogItemId: number;
    storeId: number | null;
    listType: 'need' | 'want';
    quantity: number;
  }) => {
    try {
      await shoppingApi.addToShoppingList(data);
      showSuccessMessage('Added to list!');
      setShowStoreSelectModal(false);
      setItemForStoreSelect(null);
      fetchShoppingList();
    } catch (err) {
      setError('Failed to add item');
    }
  };

  const handleCreateCatalogItem = async (data: {
    name: string;
    brand?: string;
    sizeText?: string;
    categoryId?: number;
    imageUrl?: string;
    prices?: Array<{ storeId: number; price: number }>;
  }) => {
    try {
      if (isAdmin) {
        // Create the catalog item
        const result = await shoppingApi.createCatalogItem(data);

        // If prices were provided, save them
        if (data.prices && data.prices.length > 0 && result.id) {
          for (const price of data.prices) {
            await shoppingApi.setCatalogItemPrice(result.id, price.storeId, price.price);
          }
        }

        showSuccessMessage('Item created!');
      } else {
        await shoppingApi.createRequest({
          requestType: 'need',
          name: data.name,
          brand: data.brand,
          category: categories.find((c) => c.id === data.categoryId)?.name,
          packageSize: data.sizeText,
          imageKey: data.imageUrl,
        });
        showSuccessMessage('Request submitted!');
      }
      setShowNewCatalogItemModal(false);
      setShowAddItemModal(false);
      fetchCatalog();
      fetchRequests();
    } catch (err) {
      setError('Failed to create item');
    }
  };

  const handleApproveStore = async (id: number) => {
    try {
      await shoppingApi.approveStoreRequest(id);
      showSuccessMessage('Store approved!');
      fetchStoreRequests();
      fetchStores();
    } catch (err) {
      setError('Failed to approve store');
    }
  };

  const handleDenyStore = async (id: number) => {
    try {
      await shoppingApi.denyStoreRequest(id);
      showSuccessMessage('Store request denied');
      fetchStoreRequests();
    } catch (err) {
      setError('Failed to deny store request');
    }
  };

  const handleDenyRequest = async (id: number) => {
    if (!confirm('Deny this request?')) return;
    try {
      await shoppingApi.denyRequest(id);
      showSuccessMessage('Request denied');
      fetchRequests();
    } catch (err) {
      setError('Failed to deny request');
    }
  };

  // Create a quick request (from catalog search)
  const handleCreateQuickRequest = async (data: {
    name: string;
    brand?: string;
    categoryId?: number;
  }) => {
    await shoppingApi.createRequest({
      requestType: 'need',
      name: data.name,
      brand: data.brand,
      category: categories.find((c) => c.id === data.categoryId)?.name,
    });
    showSuccessMessage('Request submitted! An admin will review it.');
    fetchRequests();
  };

  // Approve request and add to catalog
  const handleApproveRequestAndAdd = async (request: ShoppingRequest) => {
    try {
      // First create the catalog item
      const result = await shoppingApi.createCatalogItem({
        name: request.name,
        brand: request.brand || undefined,
        categoryId: request.categoryId || undefined,
        imageUrl: request.imageKey || undefined,
      });

      // Then approve the request (mark as reviewed)
      await shoppingApi.approveRequest(request.id, {});

      showSuccessMessage(`"${request.name}" approved and added to catalog!`);
      fetchRequests();
      fetchCatalog();
    } catch (err) {
      setError('Failed to approve request');
    }
  };

  const handleAddCategory = async (name: string, color?: string) => {
    try {
      await shoppingApi.createCategory(name, color);
      showSuccessMessage('Category added!');
      fetchCategories();
    } catch (err) {
      setError('Failed to add category');
    }
  };

  const handleAddStore = async (name: string) => {
    try {
      await shoppingApi.createStore(name);
      showSuccessMessage('Store added!');
      fetchStores();
    } catch (err) {
      setError('Failed to add store');
    }
  };

  const toggleStore = (store: string) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(store)) {
      newExpanded.delete(store);
    } else {
      newExpanded.add(store);
    }
    setExpandedStores(newExpanded);
  };

  // Group items by store then category
  const groupItemsByStoreAndCategory = (items: ShoppingListItem[]) => {
    const byStore: Record<string, Record<string, ShoppingListItem[]>> = {};
    items.forEach((item) => {
      const storeName = item.storeName || 'Any Store';
      const categoryName = item.categoryName || 'Other';
      if (!byStore[storeName]) byStore[storeName] = {};
      if (!byStore[storeName][categoryName]) byStore[storeName][categoryName] = [];
      byStore[storeName][categoryName].push(item);
    });
    return byStore;
  };

  const itemsByStoreAndCategory = groupItemsByStoreAndCategory(listItems);

  // Tab configuration - Requests tab removed, integrated into Catalog
  const tabs: Array<{ id: Tab; label: string; icon: any; show: boolean }> = [
    { id: 'list', label: 'List', icon: ShoppingCart, show: true },
    { id: 'catalog', label: 'Catalog', icon: Package, show: true },
    { id: 'predictions', label: 'Predict', icon: Sparkles, show: true },
    { id: 'history', label: 'History', icon: History, show: true },
    { id: 'manage', label: 'Manage', icon: Settings, show: isAdmin },
  ];

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden themed-shopping-bg">
      {/* Header */}
      <div className="themed-card border-b border-[var(--color-border)] sticky top-0 z-10 rounded-none">
        <div className="max-w-4xl mx-auto px-3 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
              <ShoppingCart className="text-[var(--color-warning)]" size={22} />
              Shopping
            </h1>
            {activeTab === 'list' && (
              <div className="text-right text-sm">
                <p className="text-[var(--color-muted-foreground)]">
                  Needs:{' '}
                  <span className="font-semibold text-[var(--color-success)]">
                    ${Number(totals.needsOnly).toFixed(2)}
                  </span>
                </p>
                <p className="text-[var(--color-muted-foreground)]">
                  Total:{' '}
                  <span className="font-semibold text-[var(--color-warning)]">
                    ${Number(totals.needsPlusWants).toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
            {tabs
              .filter((t) => t.show)
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="max-w-4xl mx-auto px-3 mt-3">
          <div className="p-3 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] rounded-xl flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
            <button onClick={() => setError('')} className="ml-auto">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-4xl mx-auto px-3 mt-3">
          <div className="p-3 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-xl flex items-center gap-2">
            <CheckCircle size={18} />
            {success}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="animate-spin text-[var(--color-primary)]" />
          </div>
        ) : (
          <>
            {activeTab === 'list' && (
              <>
                {/* Meal Ingredients Suggestions */}
                <MealIngredientsCard
                  onAddToList={(name, quantity, unit) => {
                    // This is called when ingredients are added via meal suggestions
                    // The API handles adding to the list directly
                  }}
                  onRefresh={fetchShoppingList}
                  isAdmin={isAdmin}
                />

                <ShoppingListTab
                  itemsByStoreAndCategory={itemsByStoreAndCategory}
                  purchasedToday={purchasedToday}
                  suggestions={suggestions}
                  expandedStores={expandedStores}
                  toggleStore={toggleStore}
                  onMarkPurchased={handleMarkPurchased}
                  onRemove={handleRemoveFromList}
                  onEdit={setEditingListItem}
                  onAddSuggestion={handleAddSuggestion}
                  onAddAllSuggestions={handleAddAllSuggestions}
                  onAddItem={() => setShowAddItemModal(true)}
                  isAdmin={isAdmin}
                />
              </>
            )}

            {activeTab === 'catalog' && (
              <CatalogTab
                items={catalogItems}
                categories={categories}
                stores={stores}
                searchTerm={searchTerm}
                onSearch={(term) => {
                  setSearchTerm(term);
                  fetchCatalog(term);
                }}
                onAddToList={handleAddToListClick}
                onAddNewItem={() => setShowNewCatalogItemModal(true)}
                onRequestItem={() => setShowNewCatalogItemModal(true)}
                onRefresh={() => fetchCatalog()}
                isAdmin={isAdmin}
                isKid={isKid}
                // Integrated request handling
                pendingRequests={requests.filter((r) => r.status === 'pending')}
                onApproveRequest={handleApproveRequestAndAdd}
                onDenyRequest={handleDenyRequest}
                onCreateRequest={handleCreateQuickRequest}
              />
            )}

            {activeTab === 'predictions' && (
              <PredictionsTab
                suggestions={suggestions}
                dueThisWeek={dueThisWeek}
                stats={suggestionStats}
                onAdd={handleAddSuggestion}
                onDismiss={handleDismissSuggestion}
                onAddAll={handleAddAllSuggestions}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTab
                analytics={analytics}
                purchaseHistory={purchaseHistory}
                onPeriodChange={(days) => {
                  fetchAnalytics(days);
                }}
              />
            )}

            {activeTab === 'manage' && isAdmin && (
              <ManageTab
                categories={categories}
                stores={stores}
                storeRequests={storeRequests}
                onApproveStore={handleApproveStore}
                onDenyStore={handleDenyStore}
                onAddCategory={handleAddCategory}
                onAddStore={handleAddStore}
                onRefresh={handleRefreshAll}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddItemModal && (
        <CatalogBrowserModal
          title="Add Item to List"
          catalogItems={catalogItems}
          categories={categories}
          stores={stores}
          onClose={() => setShowAddItemModal(false)}
          onSelectItem={handleAddToListClick}
          onAddNewItem={() => {
            setShowAddItemModal(false);
            setShowNewCatalogItemModal(true);
          }}
          onSearch={(term) => {
            setSearchTerm(term);
            fetchCatalog(term);
          }}
          isAdmin={isAdmin}
        />
      )}

      {showStoreSelectModal && itemForStoreSelect && (
        <StoreSelectModal
          item={itemForStoreSelect}
          stores={stores}
          onClose={() => {
            setShowStoreSelectModal(false);
            setItemForStoreSelect(null);
          }}
          onAdd={handleAddToList}
          isAdmin={isAdmin}
        />
      )}

      {showNewCatalogItemModal && (
        <NewItemModal
          categories={categories}
          stores={stores}
          onClose={() => setShowNewCatalogItemModal(false)}
          onSubmit={handleCreateCatalogItem}
          isAdmin={isAdmin}
        />
      )}

      {editingListItem && (
        <EditListItemModal
          item={editingListItem}
          stores={stores}
          onClose={() => setEditingListItem(null)}
          onSave={handleEditListItem}
        />
      )}
    </div>
  );
}
