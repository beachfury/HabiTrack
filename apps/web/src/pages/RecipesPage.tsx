// apps/web/src/pages/RecipesPage.tsx
// Recipe Book page - browse, search, and manage recipes

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Clock,
  Users,
  ChefHat,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  Pencil,
  ImagePlus,
  Image,
} from 'lucide-react';
import { ModalPortal, ModalBody } from '../components/common/ModalPortal';
import { useAuth } from '../context/AuthContext';
import { mealsApi } from '../api/meals';
import type {
  Recipe,
  RecipeIngredient,
  RecipeStatus,
  RecipeDifficulty,
  CreateRecipeData,
  UpdateRecipeData,
  CreateIngredientData,
} from '../types/meals';
import {
  getDifficultyLabel,
  getDifficultyStyle,
  formatCookTime,
} from '../types/meals';

// Tabs for recipe filtering
type RecipeTab = 'all' | 'pending' | 'my-recipes';

export function RecipesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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
    <div className="p-8 h-full flex flex-col themed-recipes-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
  );
}

// =============================================================================
// Recipe Card Component
// =============================================================================
function RecipeCard({
  recipe,
  onClick,
  onApprove,
  isAdmin,
}: {
  recipe: Recipe;
  onClick: () => void;
  onApprove?: () => void;
  isAdmin: boolean;
}) {
  const totalTime = formatCookTime(recipe.prepTimeMinutes, recipe.cookTimeMinutes);

  return (
    <div
      onClick={onClick}
      className="themed-card p-4 cursor-pointer hover:shadow-lg transition-shadow group"
    >
      {/* Image or Placeholder */}
      <div className="aspect-video rounded-lg bg-[var(--color-muted)] mb-3 overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-muted-foreground)]">
            <ChefHat size={48} className="opacity-30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Status Badge for pending */}
        {recipe.status === 'pending' && (
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
            Pending Approval
          </span>
        )}

        {/* Title */}
        <h3 className="font-semibold text-[var(--color-foreground)] line-clamp-1">
          {recipe.name}
        </h3>

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
          {totalTime && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {totalTime}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={12} />
            {recipe.servings}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={getDifficultyStyle(recipe.difficulty)}
          >
            {getDifficultyLabel(recipe.difficulty)}
          </span>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="text-xs text-[var(--color-muted-foreground)]">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* External link indicator */}
        {recipe.sourceUrl && (
          <div className="flex items-center gap-1 text-xs text-[var(--color-primary)]">
            <ExternalLink size={12} />
            External recipe
          </div>
        )}

        {/* Approve button for pending (admin only) */}
        {onApprove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
            className="w-full mt-2 py-2 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 transition-colors text-sm font-medium"
          >
            Review & Approve
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Add Recipe Modal
// =============================================================================
function AddRecipeModal({
  onClose,
  onSuccess,
  isAdmin,
}: {
  onClose: () => void;
  onSuccess: (name: string) => void;
  isAdmin: boolean;
}) {
  const [formData, setFormData] = useState<CreateRecipeData>({
    name: '',
    description: '',
    instructions: '',
    prepTimeMinutes: undefined,
    cookTimeMinutes: undefined,
    servings: 4,
    difficulty: 'medium',
    sourceUrl: '',
    tags: [],
    ingredients: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Ingredient form state
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: '',
    unit: '',
    notes: '',
  });

  // Instructions steps state
  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');

  // Image state
  const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('Invalid image type. Allowed: JPEG, PNG, GIF, WebP');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large. Maximum size is 5MB');
      return;
    }

    // Read file for preview and later upload
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setPendingImage({ data: dataUrl, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPendingImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Recipe name is required');
      return;
    }

    setSaving(true);
    try {
      // Create the recipe first
      const result = await mealsApi.createRecipe(formData);

      // If there's a pending image, upload it
      if (pendingImage && result.id) {
        try {
          await mealsApi.uploadRecipeImage(result.id, pendingImage.data, pendingImage.mimeType);
        } catch (imgErr) {
          console.error('Failed to upload image:', imgErr);
          // Recipe was created, just image failed - still count as success
        }
      }

      onSuccess(formData.name);
      onClose();
    } catch (err) {
      setError('Failed to create recipe');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag),
    });
  };

  const addIngredient = () => {
    if (!newIngredient.name.trim()) return;

    const ingredient: CreateIngredientData = {
      name: newIngredient.name.trim(),
      quantity: parseFloat(newIngredient.quantity) || 1,
      unit: newIngredient.unit.trim() || undefined,
      notes: newIngredient.notes.trim() || undefined,
      sortOrder: (formData.ingredients?.length || 0),
    };

    setFormData({
      ...formData,
      ingredients: [...(formData.ingredients || []), ingredient],
    });

    setNewIngredient({ name: '', quantity: '', unit: '', notes: '' });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients?.filter((_, i) => i !== index),
    });
  };

  const updateIngredientInForm = (index: number, field: keyof CreateIngredientData, value: string | number) => {
    const updated = [...(formData.ingredients || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, ingredients: updated });
  };

  // Step management
  const addStep = () => {
    if (!newStep.trim()) return;
    const updatedSteps = [...steps, newStep.trim()];
    setSteps(updatedSteps);
    // Update instructions as numbered steps
    setFormData({
      ...formData,
      instructions: updatedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
    });
    setNewStep('');
  };

  const removeStep = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    setSteps(updatedSteps);
    setFormData({
      ...formData,
      instructions: updatedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
    });
  };

  const updateStep = (index: number, value: string) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = value;
    setSteps(updatedSteps);
    setFormData({
      ...formData,
      instructions: updatedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
    });
  };

  const footer = (
    <div className="flex gap-3">
      <button type="button" onClick={onClose} className="themed-btn-secondary flex-1">
        Cancel
      </button>
      <button
        type="submit"
        form="add-recipe-form"
        disabled={saving}
        className="themed-btn-primary flex-1 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Plus size={18} />
            {isAdmin ? 'Add Recipe' : 'Submit for Approval'}
          </>
        )}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Add Recipe"
      size="lg"
      footer={footer}
    >
      <ModalBody>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm">
            {error}
          </div>
        )}

        {!isAdmin && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-warning)]/10 text-[var(--color-warning)] text-sm">
            Your recipe will be submitted for admin approval before appearing in the recipe book.
          </div>
        )}

        <form id="add-recipe-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Recipe Image */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Recipe Image
            </label>
            <div className="flex items-start gap-4">
              {/* Image preview */}
              <div className="w-32 h-24 rounded-lg overflow-hidden bg-[var(--color-muted)] flex items-center justify-center flex-shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Recipe preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image size={32} className="text-[var(--color-muted-foreground)] opacity-50" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <label className="px-3 py-2 text-sm rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 cursor-pointer flex items-center gap-2 transition-colors">
                    <ImagePlus size={16} />
                    {imagePreview ? 'Change' : 'Select Image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-2 text-sm rounded-lg border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  JPEG, PNG, GIF or WebP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Recipe Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="themed-input w-full"
              placeholder="e.g., Spaghetti Carbonara"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="themed-input w-full"
              placeholder="Brief description of the dish..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Prep Time (min)
              </label>
              <input
                type="number"
                value={formData.prepTimeMinutes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, prepTimeMinutes: parseInt(e.target.value) || undefined })
                }
                className="themed-input w-full"
                placeholder="15"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Cook Time (min)
              </label>
              <input
                type="number"
                value={formData.cookTimeMinutes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, cookTimeMinutes: parseInt(e.target.value) || undefined })
                }
                className="themed-input w-full"
                placeholder="30"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Servings
              </label>
              <input
                type="number"
                value={formData.servings}
                onChange={(e) =>
                  setFormData({ ...formData, servings: parseInt(e.target.value) || 4 })
                }
                className="themed-input w-full"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value as RecipeDifficulty })
                }
                className="themed-input w-full"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Recipe URL (optional)
            </label>
            <input
              type="url"
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              className="themed-input w-full"
              placeholder="https://example.com/recipe"
            />
          </div>

          {/* Ingredients Section */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Ingredients
            </label>

            {/* Existing ingredients list */}
            {formData.ingredients && formData.ingredients.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="p-2 bg-[var(--color-muted)] rounded-lg space-y-2"
                  >
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={ing.quantity || ''}
                        onChange={(e) => updateIngredientInForm(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="themed-input w-full text-sm"
                        placeholder="Qty"
                      />
                      <input
                        type="text"
                        value={ing.unit || ''}
                        onChange={(e) => updateIngredientInForm(index, 'unit', e.target.value)}
                        className="themed-input w-full text-sm"
                        placeholder="Unit"
                      />
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredientInForm(index, 'name', e.target.value)}
                        className="themed-input w-full text-sm col-span-2"
                        placeholder="Ingredient name"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ing.notes || ''}
                        onChange={(e) => updateIngredientInForm(index, 'notes', e.target.value)}
                        className="themed-input flex-1 text-sm"
                        placeholder="Notes (optional)"
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new ingredient form */}
            <div className="p-3 bg-[var(--color-muted)] rounded-lg space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <input
                    type="text"
                    value={newIngredient.quantity}
                    onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                    className="themed-input w-full text-sm"
                    placeholder="Qty"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                    className="themed-input w-full text-sm"
                    placeholder="Unit (oz, cups...)"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    className="themed-input w-full text-sm"
                    placeholder="Ingredient name"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIngredient.notes}
                  onChange={(e) => setNewIngredient({ ...newIngredient, notes: e.target.value })}
                  className="themed-input flex-1 text-sm"
                  placeholder="Notes (optional): diced, room temp..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                />
                <button
                  type="button"
                  onClick={addIngredient}
                  disabled={!newIngredient.name.trim()}
                  className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Example: 4 | oz | milk | cold
              </p>
            </div>
          </div>

          {/* Instructions Section */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Instructions
            </label>

            {/* Existing steps list */}
            {steps.length > 0 && (
              <div className="space-y-2 mb-3">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-[var(--color-muted)] rounded-lg"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      className="themed-input flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-colors mt-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new step form */}
            <div className="flex gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] text-xs font-bold flex items-center justify-center mt-2">
                {steps.length + 1}
              </span>
              <input
                type="text"
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                className="themed-input flex-1"
                placeholder={steps.length === 0 ? "Add step 1..." : "Add next step..."}
              />
              <button
                type="button"
                onClick={addStep}
                disabled={!newStep.trim()}
                className="px-3 py-2 text-sm rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Step
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="themed-input flex-1"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="themed-btn-secondary"
              >
                Add
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-[var(--color-destructive)]"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

        </form>
      </ModalBody>
    </ModalPortal>
  );
}

// =============================================================================
// Recipe Detail Modal with Edit functionality
// =============================================================================
function RecipeDetailModal({
  recipe,
  onClose,
  onUpdate,
  isAdmin,
}: {
  recipe: Recipe;
  onClose: () => void;
  onUpdate: () => void;
  isAdmin: boolean;
}) {
  const { user } = useAuth();
  const [fullRecipe, setFullRecipe] = useState<Recipe & { ingredients?: RecipeIngredient[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Edit form state
  const [formData, setFormData] = useState<UpdateRecipeData>({});
  const [ingredients, setIngredients] = useState<CreateIngredientData[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: '',
    unit: '',
    notes: '',
  });
  const [tagInput, setTagInput] = useState('');

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  // Check if user can edit this recipe (admin or recipe owner)
  const canEdit = isAdmin || (user && recipe.createdBy === user.id);

  useEffect(() => {
    fetchFullRecipe();
  }, [recipe.id]);

  async function fetchFullRecipe() {
    try {
      const data = await mealsApi.getRecipe(recipe.id);
      setFullRecipe(data.recipe);
      // Initialize form data from recipe
      initializeFormData(data.recipe);
    } catch (err) {
      console.error('Failed to fetch recipe:', err);
    } finally {
      setLoading(false);
    }
  }

  function initializeFormData(r: Recipe & { ingredients?: RecipeIngredient[] }) {
    setFormData({
      name: r.name,
      description: r.description || '',
      instructions: r.instructions || '',
      prepTimeMinutes: r.prepTimeMinutes ?? undefined,
      cookTimeMinutes: r.cookTimeMinutes ?? undefined,
      servings: r.servings,
      difficulty: r.difficulty,
      sourceUrl: r.sourceUrl || '',
      tags: r.tags || [],
    });

    // Parse instructions into steps
    if (r.instructions) {
      const parsedSteps = r.instructions
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(step => step);
      setSteps(parsedSteps);
    } else {
      setSteps([]);
    }

    // Convert ingredients
    if (r.ingredients) {
      setIngredients(
        r.ingredients.map((ing, index) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit || undefined,
          notes: ing.notes || undefined,
          sortOrder: index,
        }))
      );
    } else {
      setIngredients([]);
    }

    // Set current image
    setCurrentImageUrl(r.imageUrl);
  }

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError('Recipe name is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Update recipe with ingredients
      await mealsApi.updateRecipe(recipe.id, {
        ...formData,
        instructions: steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
        ingredients: ingredients,
      });

      // Refresh data and exit edit mode
      await fetchFullRecipe();
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to update recipe:', err);
      setError('Failed to update recipe');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('Invalid image type. Allowed: JPEG, PNG, GIF, WebP');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large. Maximum size is 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = await mealsApi.uploadRecipeImage(
            recipe.id,
            reader.result as string,
            file.type,
          );
          setCurrentImageUrl(result.imageUrl);
          // Refresh to get updated recipe
          await fetchFullRecipe();
          onUpdate();
        } catch (err) {
          console.error('Failed to upload image:', err);
          setError('Failed to upload image');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to read image:', err);
      setError('Failed to read image');
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!currentImageUrl) return;

    setUploadingImage(true);
    setError('');

    try {
      await mealsApi.deleteRecipeImage(recipe.id);
      setCurrentImageUrl(null);
      await fetchFullRecipe();
      onUpdate();
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError('Failed to delete image');
    } finally {
      setUploadingImage(false);
    }
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    setSteps([...steps, newStep.trim()]);
    setNewStep('');
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const addIngredient = () => {
    if (!newIngredient.name.trim()) return;
    setIngredients([
      ...ingredients,
      {
        name: newIngredient.name.trim(),
        quantity: parseFloat(newIngredient.quantity) || 1,
        unit: newIngredient.unit.trim() || undefined,
        notes: newIngredient.notes.trim() || undefined,
        sortOrder: ingredients.length,
      },
    ]);
    setNewIngredient({ name: '', quantity: '', unit: '', notes: '' });
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof CreateIngredientData, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag),
    });
  };

  const totalTime = formatCookTime(recipe.prepTimeMinutes, recipe.cookTimeMinutes);

  // Build title with edit button for view mode
  const titleContent = (
    <div className="flex items-center gap-2">
      <span>{isEditing ? 'Edit Recipe' : recipe.name}</span>
      {canEdit && !isEditing && !loading && (
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 hover:bg-[var(--color-muted)] rounded-lg transition-colors"
          title="Edit recipe"
        >
          <Pencil size={18} className="text-[var(--color-primary)]" />
        </button>
      )}
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={titleContent}
      size="xl"
    >
      <ModalBody>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : isEditing ? (
          // Edit Mode
          <div className="space-y-4">
            {/* Recipe Image */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                Recipe Image
              </label>
              <div className="flex items-start gap-4">
                {/* Current image preview */}
                <div className="w-32 h-24 rounded-lg overflow-hidden bg-[var(--color-muted)] flex items-center justify-center flex-shrink-0">
                  {currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt="Recipe"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image size={32} className="text-[var(--color-muted-foreground)] opacity-50" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <label className="px-3 py-2 text-sm rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 cursor-pointer flex items-center gap-2 transition-colors">
                      {uploadingImage ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ImagePlus size={16} />
                      )}
                      {currentImageUrl ? 'Change' : 'Upload'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    {currentImageUrl && (
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        disabled={uploadingImage}
                        className="px-3 py-2 text-sm rounded-lg border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    JPEG, PNG, GIF or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Recipe Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="themed-input w-full"
                placeholder="Recipe name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="themed-input w-full"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Prep Time (min)
                </label>
                <input
                  type="number"
                  value={formData.prepTimeMinutes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, prepTimeMinutes: parseInt(e.target.value) || undefined })
                  }
                  className="themed-input w-full"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Cook Time (min)
                </label>
                <input
                  type="number"
                  value={formData.cookTimeMinutes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, cookTimeMinutes: parseInt(e.target.value) || undefined })
                  }
                  className="themed-input w-full"
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Servings
                </label>
                <input
                  type="number"
                  value={formData.servings || 4}
                  onChange={(e) =>
                    setFormData({ ...formData, servings: parseInt(e.target.value) || 4 })
                  }
                  className="themed-input w-full"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty || 'medium'}
                  onChange={(e) =>
                    setFormData({ ...formData, difficulty: e.target.value as RecipeDifficulty })
                  }
                  className="themed-input w-full"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Recipe URL
              </label>
              <input
                type="url"
                value={formData.sourceUrl || ''}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                className="themed-input w-full"
                placeholder="https://example.com/recipe"
              />
            </div>

            {/* Ingredients Section */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                Ingredients
              </label>

              {ingredients.length > 0 && (
                <div className="space-y-2 mb-3">
                  {ingredients.map((ing, index) => (
                    <div
                      key={index}
                      className="p-2 bg-[var(--color-muted)] rounded-lg space-y-2"
                    >
                      <div className="grid grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={ing.quantity || ''}
                          onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="themed-input w-full text-sm"
                          placeholder="Qty"
                        />
                        <input
                          type="text"
                          value={ing.unit || ''}
                          onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                          className="themed-input w-full text-sm"
                          placeholder="Unit"
                        />
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                          className="themed-input w-full text-sm col-span-2"
                          placeholder="Ingredient name"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ing.notes || ''}
                          onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                          className="themed-input flex-1 text-sm"
                          placeholder="Notes (optional)"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-[var(--color-muted)] rounded-lg space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newIngredient.quantity}
                    onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                    className="themed-input w-full text-sm"
                    placeholder="Qty"
                  />
                  <input
                    type="text"
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                    className="themed-input w-full text-sm"
                    placeholder="Unit"
                  />
                  <input
                    type="text"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    className="themed-input w-full text-sm col-span-2"
                    placeholder="Ingredient name"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIngredient.notes}
                    onChange={(e) => setNewIngredient({ ...newIngredient, notes: e.target.value })}
                    className="themed-input flex-1 text-sm"
                    placeholder="Notes (optional)"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                  />
                  <button
                    type="button"
                    onClick={addIngredient}
                    disabled={!newIngredient.name.trim()}
                    className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions Section */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                Instructions
              </label>

              {steps.length > 0 && (
                <div className="space-y-2 mb-3">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-[var(--color-muted)] rounded-lg"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold flex items-center justify-center mt-0.5">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => updateStep(index, e.target.value)}
                        className="themed-input flex-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-colors mt-0.5"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] text-xs font-bold flex items-center justify-center mt-2">
                  {steps.length + 1}
                </span>
                <input
                  type="text"
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                  className="themed-input flex-1"
                  placeholder={steps.length === 0 ? "Add step 1..." : "Add next step..."}
                />
                <button
                  type="button"
                  onClick={addStep}
                  disabled={!newStep.trim()}
                  className="px-3 py-2 text-sm rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Step
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="themed-input flex-1"
                  placeholder="Add a tag..."
                />
                <button type="button" onClick={addTag} className="themed-btn-secondary">
                  Add
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-[var(--color-destructive)]"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Edit Mode Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (fullRecipe) initializeFormData(fullRecipe);
                }}
                className="themed-btn-secondary flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="themed-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-6">
            {/* Image */}
            {recipe.imageUrl && (
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
              {totalTime && (
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {totalTime}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users size={16} />
                {fullRecipe?.servings || recipe.servings} servings
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={getDifficultyStyle(fullRecipe?.difficulty || recipe.difficulty)}
              >
                {getDifficultyLabel(fullRecipe?.difficulty || recipe.difficulty)}
              </span>
            </div>

            {/* Description */}
            {(fullRecipe?.description || recipe.description) && (
              <p className="text-[var(--color-foreground)]">{fullRecipe?.description || recipe.description}</p>
            )}

            {/* External URL */}
            {(fullRecipe?.sourceUrl || recipe.sourceUrl) && (
              <a
                href={fullRecipe?.sourceUrl || recipe.sourceUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline"
              >
                <ExternalLink size={16} />
                View Original Recipe
              </a>
            )}

            {/* Ingredients */}
            {fullRecipe?.ingredients && fullRecipe.ingredients.length > 0 && (
              <div>
                <h3 className="font-semibold text-[var(--color-foreground)] mb-2">
                  Ingredients
                </h3>
                <ul className="space-y-1">
                  {fullRecipe.ingredients.map((ing) => (
                    <li key={ing.id} className="flex items-center gap-2 text-[var(--color-foreground)]">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                      <span>
                        {ing.quantity} {ing.unit} {ing.name}
                        {ing.notes && (
                          <span className="text-[var(--color-muted-foreground)]"> ({ing.notes})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {(fullRecipe?.instructions || recipe.instructions) && (
              <div>
                <h3 className="font-semibold text-[var(--color-foreground)] mb-3">
                  Instructions
                </h3>
                <ol className="space-y-3">
                  {(fullRecipe?.instructions || recipe.instructions || '').split('\n').filter(line => line.trim()).map((line, index) => {
                    const stepText = line.replace(/^\d+\.\s*/, '').trim();
                    if (!stepText) return null;
                    return (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-[var(--color-foreground)] pt-0.5">{stepText}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Tags */}
            {(fullRecipe?.tags || recipe.tags) && (fullRecipe?.tags || recipe.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(fullRecipe?.tags || recipe.tags || []).map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Created by */}
            {(fullRecipe?.createdByName || recipe.createdByName) && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Added by {fullRecipe?.createdByName || recipe.createdByName}
              </p>
            )}
          </div>
        )}

        {!isEditing && (
          <div className="flex justify-end pt-4 mt-4 border-t border-[var(--color-border)]">
            <button onClick={onClose} className="themed-btn-secondary">
              Close
            </button>
          </div>
        )}
      </ModalBody>
    </ModalPortal>
  );
}

// =============================================================================
// Approval Modal
// =============================================================================
function ApprovalModal({
  recipe,
  onApprove,
  onReject,
  onClose,
}: {
  recipe: Recipe;
  onApprove: () => void;
  onReject: (reason?: string) => void;
  onClose: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const footer = showRejectForm ? (
    <div className="flex gap-3">
      <button
        onClick={() => setShowRejectForm(false)}
        className="themed-btn-secondary flex-1"
      >
        Back
      </button>
      <button
        onClick={() => onReject(rejectReason)}
        className="flex-1 py-2 rounded-xl bg-[var(--color-destructive)] text-white hover:bg-[var(--color-destructive)]/90"
      >
        Reject Recipe
      </button>
    </div>
  ) : (
    <div className="flex gap-3">
      <button onClick={onClose} className="themed-btn-secondary flex-1">
        Cancel
      </button>
      <button
        onClick={() => setShowRejectForm(true)}
        className="flex-1 py-2 rounded-xl border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
      >
        Reject
      </button>
      <button
        onClick={onApprove}
        className="flex-1 py-2 rounded-xl bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/90"
      >
        Approve
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Review Recipe"
      size="md"
      footer={footer}
    >
      <ModalBody>
        <div className="mb-4 p-4 bg-[var(--color-muted)] rounded-xl">
          <h3 className="font-medium text-[var(--color-foreground)]">{recipe.name}</h3>
          {recipe.description && (
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {recipe.description}
            </p>
          )}
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
            Submitted by {recipe.createdByName}
          </p>
        </div>

        {showRejectForm && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Reason for rejection (optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="themed-input w-full"
              placeholder="Enter reason..."
              rows={3}
            />
          </div>
        )}
      </ModalBody>
    </ModalPortal>
  );
}
