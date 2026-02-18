// apps/web/src/pages/RecipesPage.tsx
// Recipe Book page - browse, search, and manage recipes

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { mealsApi } from '../api/meals';
import type { Recipe, RecipeStatus, RecipeDifficulty } from '../types/meals';

// Import split components
import { RecipeCard, AddRecipeModal, RecipeDetailModal, ApprovalModal } from './recipes';

// Tabs for recipe filtering
type RecipeTab = 'all' | 'pending' | 'my-recipes';

export function RecipesPage() {
  const { user } = useAuth();
  const { getPageAnimationClasses } = useTheme();
  const isAdmin = user?.role === 'admin';
  const animationClasses = getPageAnimationClasses('recipes-background');

  // Data state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter state
  const [activeTab, setActiveTab] = useState<RecipeTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<RecipeDifficulty | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [recipeToApprove, setRecipeToApprove] = useState<Recipe | null>(null);

  // Fetch recipes on load and filter change
  useEffect(() => {
    fetchRecipes();
  }, [activeTab, difficultyFilter]);

  async function fetchRecipes() {
    setLoading(true);
    try {
      const params: { status?: RecipeStatus; difficulty?: RecipeDifficulty; search?: string } = {};

      if (activeTab === 'pending') {
        params.status = 'pending';
      }
      if (difficultyFilter) {
        params.difficulty = difficultyFilter;
      }

      const data = await mealsApi.getRecipes(params);
      let filteredRecipes = data.recipes;

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredRecipes = filteredRecipes.filter(
          (r) =>
            r.name.toLowerCase().includes(term) ||
            r.description?.toLowerCase().includes(term) ||
            r.tags?.some((t) => t.toLowerCase().includes(term)),
        );
      }

      // Filter by "my recipes" tab
      if (activeTab === 'my-recipes' && user) {
        filteredRecipes = filteredRecipes.filter((r) => r.createdBy === user.id);
      }

      setRecipes(filteredRecipes);
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipes();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleApprove = async (recipe: Recipe) => {
    try {
      await mealsApi.approveRecipe(recipe.id);
      showSuccessMessage(`"${recipe.name}" approved!`);
      fetchRecipes();
      setShowApprovalModal(false);
      setRecipeToApprove(null);
    } catch (err) {
      setError('Failed to approve recipe');
    }
  };

  const handleReject = async (recipe: Recipe, reason?: string) => {
    try {
      await mealsApi.rejectRecipe(recipe.id, reason);
      showSuccessMessage(`"${recipe.name}" rejected`);
      fetchRecipes();
      setShowApprovalModal(false);
      setRecipeToApprove(null);
    } catch (err) {
      setError('Failed to reject recipe');
    }
  };

  // Get count of pending recipes for badge
  const pendingCount = recipes.filter((r) => r.status === 'pending').length;

  // Tabs configuration
  const tabs: { id: RecipeTab; label: string; badge?: number }[] = [
    { id: 'all', label: 'All Recipes' },
    { id: 'my-recipes', label: 'My Recipes' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'pending', label: 'Pending Approval', badge: pendingCount });
  }

  return (
    <div className={`min-h-screen themed-recipes-bg ${animationClasses}`}>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">Recipe Book</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="themed-btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Recipe
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] flex items-center gap-2">
          <Check size={18} />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 text-[var(--color-destructive)] flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-destructive)] text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recipes..."
            className="themed-input w-full pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-colors ${
            showFilters || difficultyFilter
              ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
          }`}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-4 p-4 themed-card">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Difficulty
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as RecipeDifficulty | '')}
                className="themed-input"
              >
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--color-muted-foreground)]">
            <BookOpen size={48} className="mb-4 opacity-50" />
            <p className="text-lg">
              {searchTerm ? 'No recipes found' : 'No recipes yet'}
            </p>
            <p className="text-sm">
              {searchTerm
                ? 'Try a different search term'
                : 'Add your first recipe to get started!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => setSelectedRecipe(recipe)}
                onApprove={isAdmin && recipe.status === 'pending' ? () => {
                  setRecipeToApprove(recipe);
                  setShowApprovalModal(true);
                } : undefined}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Recipe Modal */}
      {showAddModal && (
        <AddRecipeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(name) => {
            showSuccessMessage(`Recipe "${name}" ${isAdmin ? 'added!' : 'submitted for approval!'}`);
            fetchRecipes();
          }}
          isAdmin={isAdmin}
        />
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onUpdate={() => fetchRecipes()}
          isAdmin={isAdmin}
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && recipeToApprove && (
        <ApprovalModal
          recipe={recipeToApprove}
          onApprove={() => handleApprove(recipeToApprove)}
          onReject={(reason) => handleReject(recipeToApprove, reason)}
          onClose={() => {
            setShowApprovalModal(false);
            setRecipeToApprove(null);
          }}
        />
      )}
      </div>
    </div>
  );
}
