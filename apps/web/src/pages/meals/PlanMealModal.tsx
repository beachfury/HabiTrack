// apps/web/src/pages/meals/PlanMealModal.tsx
// Modal for planning or editing a meal

import { useState, useEffect } from 'react';
import {
  ChefHat,
  Vote,
  Check,
  Loader2,
  UtensilsCrossed,
} from 'lucide-react';
import { ModalPortal, ModalBody } from '../../components/common/ModalPortal';
import { mealsApi } from '../../api/meals';
import type { MealPlan, Recipe, CreateMealPlanData } from '../../types/meals';
import { getMealStatusLabel, getMealStatusStyle } from '../../types/meals';

interface PlanMealModalProps {
  date: string;
  existingMeal: MealPlan | null;
  recipes: Recipe[];
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function PlanMealModal({
  date,
  existingMeal,
  recipes,
  isAdmin,
  onClose,
  onSuccess,
}: PlanMealModalProps) {
  const [mode, setMode] = useState<'recipe' | 'custom' | 'ffy' | 'voting'>('recipe');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(
    existingMeal?.recipeId || null
  );
  const [customMealName, setCustomMealName] = useState(existingMeal?.customMealName || '');
  const [ffyMessage, setFfyMessage] = useState(existingMeal?.ffyMessage || '');
  const [notes, setNotes] = useState(existingMeal?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Determine initial mode based on existing meal
  useEffect(() => {
    if (existingMeal) {
      if (existingMeal.isFendForYourself) {
        setMode('ffy');
      } else if (existingMeal.customMealName) {
        setMode('custom');
      } else {
        setMode('recipe');
      }
    }
  }, [existingMeal]);

  const dateObj = new Date(date + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleSave = async () => {
    if (mode === 'recipe' && !selectedRecipeId) {
      setError('Please select a recipe');
      return;
    }
    if (mode === 'custom' && !customMealName.trim()) {
      setError('Please enter a meal name');
      return;
    }
    // Voting mode doesn't require any selection - family will add suggestions

    setSaving(true);
    setError('');

    try {
      if (existingMeal) {
        // Update existing
        if (mode === 'ffy') {
          await mealsApi.setFendForYourself(existingMeal.id, ffyMessage);
        } else {
          await mealsApi.updateMealPlan(existingMeal.id, {
            recipeId: mode === 'recipe' ? selectedRecipeId || undefined : undefined,
            customMealName: mode === 'custom' ? customMealName : undefined,
            isFendForYourself: false,
            notes: notes || undefined,
          });
        }
        onSuccess('Meal plan updated!');
      } else {
        // Create new
        const data: CreateMealPlanData = {
          date,
          mealType: 'dinner',
          notes: notes || undefined,
        };

        if (mode === 'ffy') {
          data.isFendForYourself = true;
          data.ffyMessage = ffyMessage || undefined;
          data.status = 'finalized';
        } else if (mode === 'voting') {
          // Create meal plan and immediately open voting
          data.status = 'voting';
        } else if (mode === 'recipe') {
          data.recipeId = selectedRecipeId || undefined;
          data.status = 'planned';
        } else {
          data.customMealName = customMealName;
          data.status = 'planned';
        }

        await mealsApi.createMealPlan(data);
        onSuccess(mode === 'voting' ? 'Voting is now open!' : 'Meal planned!');
      }
      onClose();
    } catch (err) {
      setError('Failed to save meal plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingMeal) return;

    if (!confirm('Delete this meal plan?')) return;

    setSaving(true);
    try {
      await mealsApi.deleteMealPlan(existingMeal.id);
      onSuccess('Meal plan deleted');
      onClose();
    } catch (err) {
      setError('Failed to delete meal plan');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenVoting = async () => {
    if (!existingMeal) return;

    setSaving(true);
    try {
      await mealsApi.openVoting(existingMeal.id);
      onSuccess('Voting is now open!');
      onClose();
    } catch (err) {
      setError('Failed to open voting');
    } finally {
      setSaving(false);
    }
  };

  // Non-admins can only view existing meals, but can suggest for empty days
  const canEdit = isAdmin;
  const isViewOnly = existingMeal && !canEdit;
  const isSuggestionMode = !existingMeal && !isAdmin;

  // Determine modal title
  const modalTitle = existingMeal
    ? (isViewOnly ? 'Meal Details' : 'Edit Meal Plan')
    : (isSuggestionMode ? 'Suggest a Meal' : 'Plan Dinner');

  // Handle non-admin suggestion submission
  const handleSuggest = async () => {
    if (mode === 'recipe' && !selectedRecipeId) {
      setError('Please select a recipe');
      return;
    }
    if (mode === 'custom' && !customMealName.trim()) {
      setError('Please enter a meal name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Create a voting meal plan with their suggestion
      const data: CreateMealPlanData = {
        date,
        mealType: 'dinner',
        status: 'voting',
      };

      const result = await mealsApi.createMealPlan(data);

      // Add their suggestion to the new meal plan
      await mealsApi.addSuggestion(result.id, {
        recipeId: mode === 'recipe' ? selectedRecipeId || undefined : undefined,
        customMealName: mode === 'custom' ? customMealName : undefined,
      });

      onSuccess('Suggestion submitted! Others can now vote.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit suggestion');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      size="lg"
    >
      <ModalBody>
        <p className="text-[var(--color-muted-foreground)] mb-4">{formattedDate}</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm">
            {error}
          </div>
        )}

        {/* View-only mode for non-admins */}
        {isViewOnly ? (
          <ViewOnlyContent existingMeal={existingMeal} onClose={onClose} />
        ) : isSuggestionMode ? (
          <SuggestionContent
            mode={mode}
            setMode={setMode}
            selectedRecipeId={selectedRecipeId}
            setSelectedRecipeId={setSelectedRecipeId}
            customMealName={customMealName}
            setCustomMealName={setCustomMealName}
            recipes={recipes}
            saving={saving}
            onClose={onClose}
            onSuggest={handleSuggest}
          />
        ) : (
          <AdminContent
            mode={mode}
            setMode={setMode}
            selectedRecipeId={selectedRecipeId}
            setSelectedRecipeId={setSelectedRecipeId}
            customMealName={customMealName}
            setCustomMealName={setCustomMealName}
            ffyMessage={ffyMessage}
            setFfyMessage={setFfyMessage}
            notes={notes}
            setNotes={setNotes}
            recipes={recipes}
            existingMeal={existingMeal}
            saving={saving}
            isAdmin={isAdmin}
            onClose={onClose}
            onSave={handleSave}
            onDelete={handleDelete}
            onOpenVoting={handleOpenVoting}
          />
        )}
      </ModalBody>
    </ModalPortal>
  );
}

// View-only content for non-admins viewing existing meals
function ViewOnlyContent({ existingMeal, onClose }: { existingMeal: MealPlan; onClose: () => void }) {
  return (
    <div className="space-y-4">
      {existingMeal.isFendForYourself ? (
        <div className="text-center py-6">
          <span className="text-5xl">🍕</span>
          <p className="text-xl font-medium text-[var(--color-foreground)] mt-3">
            Fend For Yourself!
          </p>
          {existingMeal.ffyMessage && (
            <p className="text-[var(--color-muted-foreground)] mt-2">
              {existingMeal.ffyMessage}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          {existingMeal.recipe?.imageUrl ? (
            <img
              src={existingMeal.recipe.imageUrl}
              alt={existingMeal.recipe.name || ''}
              className="w-32 h-32 mx-auto rounded-xl object-cover mb-4"
            />
          ) : (
            <div className="w-32 h-32 mx-auto rounded-xl bg-[var(--color-muted)] flex items-center justify-center mb-4">
              <ChefHat size={48} className="text-[var(--color-muted-foreground)]" />
            </div>
          )}
          <p className="text-xl font-medium text-[var(--color-foreground)]">
            {existingMeal.recipe?.name || existingMeal.customMealName || 'Meal planned'}
          </p>
          <span
            className="inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium"
            style={getMealStatusStyle(existingMeal.status)}
          >
            {getMealStatusLabel(existingMeal.status)}
          </span>
        </div>
      )}

      {existingMeal.notes && (
        <div className="p-3 bg-[var(--color-muted)] rounded-lg">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            <strong>Notes:</strong> {existingMeal.notes}
          </p>
        </div>
      )}

      <div className="pt-4">
        <button onClick={onClose} className="themed-btn-primary w-full">
          Close
        </button>
      </div>
    </div>
  );
}

// Suggestion content for non-admins suggesting meals
function SuggestionContent({
  mode,
  setMode,
  selectedRecipeId,
  setSelectedRecipeId,
  customMealName,
  setCustomMealName,
  recipes,
  saving,
  onClose,
  onSuggest,
}: {
  mode: string;
  setMode: (mode: 'recipe' | 'custom' | 'ffy' | 'voting') => void;
  selectedRecipeId: number | null;
  setSelectedRecipeId: (id: number | null) => void;
  customMealName: string;
  setCustomMealName: (name: string) => void;
  recipes: Recipe[];
  saving: boolean;
  onClose: () => void;
  onSuggest: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-[var(--color-info)]/10 rounded-xl border border-[var(--color-info)]/20">
        <p className="text-sm text-[var(--color-foreground)]">
          <Vote size={16} className="inline mr-2 text-[var(--color-info)]" />
          Suggest a meal for this day! Your suggestion will start a vote that others can join.
        </p>
      </div>

      {/* Simple mode toggle for suggestions */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('recipe')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'recipe'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
          }`}
        >
          <ChefHat size={16} className="inline mr-1" />
          From Recipes
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'custom'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
          }`}
        >
          <UtensilsCrossed size={16} className="inline mr-1" />
          Custom Idea
        </button>
      </div>

      {mode === 'recipe' && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
            Pick a Recipe
          </label>
          <select
            value={selectedRecipeId || ''}
            onChange={(e) => setSelectedRecipeId(parseInt(e.target.value) || null)}
            className="themed-input w-full"
          >
            <option value="">Choose a recipe...</option>
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>
          {recipes.length === 0 && (
            <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
              No recipes available yet.
            </p>
          )}
        </div>
      )}

      {mode === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
            What should we have?
          </label>
          <input
            type="text"
            value={customMealName}
            onChange={(e) => setCustomMealName(e.target.value)}
            className="themed-input w-full"
            placeholder="e.g., Tacos, Pizza Night, Sushi..."
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button onClick={onClose} className="themed-btn-secondary flex-1">
          Cancel
        </button>
        <button
          onClick={onSuggest}
          disabled={saving}
          className="themed-btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Vote size={18} />
              Suggest This
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Admin content for planning meals
function AdminContent({
  mode,
  setMode,
  selectedRecipeId,
  setSelectedRecipeId,
  customMealName,
  setCustomMealName,
  ffyMessage,
  setFfyMessage,
  notes,
  setNotes,
  recipes,
  existingMeal,
  saving,
  isAdmin,
  onClose,
  onSave,
  onDelete,
  onOpenVoting,
}: {
  mode: string;
  setMode: (mode: 'recipe' | 'custom' | 'ffy' | 'voting') => void;
  selectedRecipeId: number | null;
  setSelectedRecipeId: (id: number | null) => void;
  customMealName: string;
  setCustomMealName: (name: string) => void;
  ffyMessage: string;
  setFfyMessage: (msg: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  recipes: Recipe[];
  existingMeal: MealPlan | null;
  saving: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onOpenVoting: () => void;
}) {
  return (
    <>
      {/* Mode Tabs - Admin only */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setMode('recipe')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'recipe'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
          }`}
        >
          <ChefHat size={16} className="inline mr-1" />
          Recipe
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'custom'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
          }`}
        >
          <UtensilsCrossed size={16} className="inline mr-1" />
          Custom
        </button>
        {!existingMeal && (
          <button
            onClick={() => setMode('voting')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === 'voting'
                ? 'bg-[var(--color-info)] text-[var(--color-primary-foreground)]'
                : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
            }`}
          >
            <Vote size={16} className="inline mr-1" />
            Vote
          </button>
        )}
        <button
          onClick={() => setMode('ffy')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'ffy'
              ? 'bg-[var(--color-warning)] text-[var(--color-warning-foreground)]'
              : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
          }`}
        >
          🍕 FFY
        </button>
      </div>

      {/* Mode Content */}
      <div className="space-y-4">
        {mode === 'recipe' && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Select Recipe
            </label>
            <select
              value={selectedRecipeId || ''}
              onChange={(e) => setSelectedRecipeId(parseInt(e.target.value) || null)}
              className="themed-input w-full"
            >
              <option value="">Choose a recipe...</option>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </select>
            {recipes.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
                No approved recipes yet. Add some in the Recipe Book!
              </p>
            )}
          </div>
        )}

        {mode === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Meal Name
            </label>
            <input
              type="text"
              value={customMealName}
              onChange={(e) => setCustomMealName(e.target.value)}
              className="themed-input w-full"
              placeholder="e.g., Takeout Pizza, Leftovers..."
            />
          </div>
        )}

        {mode === 'ffy' && (
          <div>
            <div className="text-center py-4">
              <span className="text-4xl">🍕</span>
              <p className="text-lg font-medium text-[var(--color-foreground)] mt-2">
                Fend For Yourself!
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Everyone's on their own for dinner tonight
              </p>
            </div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Custom Message (optional)
            </label>
            <input
              type="text"
              value={ffyMessage}
              onChange={(e) => setFfyMessage(e.target.value)}
              className="themed-input w-full"
              placeholder="Raid the fridge!"
            />
          </div>
        )}

        {mode === 'voting' && (
          <div>
            <div className="text-center py-4">
              <Vote size={48} className="mx-auto text-[var(--color-info)] mb-2" />
              <p className="text-lg font-medium text-[var(--color-foreground)]">
                Let the Family Decide!
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Open voting and let everyone suggest and vote on meals
              </p>
            </div>
            <div className="bg-[var(--color-muted)] rounded-lg p-4 text-sm text-[var(--color-muted-foreground)]">
              <p className="font-medium text-[var(--color-foreground)] mb-2">How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Everyone can suggest meals from recipes or custom ideas</li>
                <li>Family members vote on their favorites</li>
                <li>Admin picks the winner or uses the top vote</li>
              </ul>
            </div>
          </div>
        )}

        {mode !== 'ffy' && mode !== 'voting' && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="themed-input w-full"
              placeholder="Any notes for this meal..."
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6">
        {existingMeal && (
          <button
            onClick={onDelete}
            disabled={saving}
            className="py-2 px-4 rounded-xl border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors"
          >
            Delete
          </button>
        )}

        {existingMeal && existingMeal.status !== 'voting' && isAdmin && (
          <button
            onClick={onOpenVoting}
            disabled={saving}
            className="py-2 px-4 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors flex items-center gap-2"
          >
            <Vote size={16} />
            Open Voting
          </button>
        )}

        <div className="flex-1" />

        <button onClick={onClose} className="themed-btn-secondary">
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className={`flex items-center gap-2 ${
            mode === 'voting'
              ? 'py-2 px-4 rounded-xl bg-[var(--color-info)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-info)]/90 transition-colors'
              : 'themed-btn-primary'
          }`}
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {mode === 'voting' ? 'Opening...' : 'Saving...'}
            </>
          ) : mode === 'voting' ? (
            <>
              <Vote size={18} />
              Start Voting
            </>
          ) : (
            <>
              <Check size={18} />
              Save
            </>
          )}
        </button>
      </div>
    </>
  );
}
