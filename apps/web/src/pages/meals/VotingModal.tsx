// apps/web/src/pages/meals/VotingModal.tsx
// Modal for voting on meal suggestions

import { useState, useEffect } from 'react';
import {
  ChefHat,
  Vote,
  Check,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { ModalPortal, ModalBody } from '../../components/common/ModalPortal';
import { mealsApi } from '../../api/meals';
import type { MealPlan, MealSuggestion, Recipe } from '../../types/meals';

interface VotingModalProps {
  mealPlan: MealPlan;
  recipes: Recipe[];
  isAdmin: boolean;
  currentUserId: number | undefined;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function VotingModal({
  mealPlan,
  recipes,
  isAdmin,
  currentUserId,
  onClose,
  onSuccess,
}: VotingModalProps) {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSuggestion, setShowAddSuggestion] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dateObj = new Date(mealPlan.date + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    fetchSuggestions();
  }, [mealPlan.id]);

  async function fetchSuggestions() {
    setLoading(true);
    try {
      const data = await mealsApi.getMealPlan(mealPlan.date);
      setSuggestions(data.mealPlan.suggestions || []);
    } catch (err) {
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }

  const handleVote = async (suggestionId: number) => {
    try {
      await mealsApi.castVote(mealPlan.id, suggestionId);
      fetchSuggestions();
    } catch (err) {
      setError('Failed to cast vote');
    }
  };

  const handleAddSuggestion = async () => {
    if (!selectedRecipeId && !customName.trim()) {
      setError('Please select a recipe or enter a custom name');
      return;
    }

    setSubmitting(true);
    try {
      await mealsApi.addSuggestion(mealPlan.id, {
        recipeId: selectedRecipeId || undefined,
        customMealName: customName || undefined,
      });
      setShowAddSuggestion(false);
      setSelectedRecipeId(null);
      setCustomName('');
      fetchSuggestions();
      onSuccess('Suggestion added!');
    } catch (err: any) {
      setError(err.message || 'Failed to add suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async (overrideRecipeId?: number, overrideCustomName?: string) => {
    setSubmitting(true);
    try {
      await mealsApi.finalizeMealPlan(mealPlan.id, {
        overrideRecipeId,
        overrideCustomName,
      });
      onSuccess('Meal finalized!');
      onClose();
    } catch (err) {
      setError('Failed to finalize meal');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Cancel voting and return to planned status
  const handleCancelVoting = async () => {
    if (!confirm('Cancel voting? The meal will return to planned status.')) return;

    setSubmitting(true);
    try {
      await mealsApi.updateMealPlan(mealPlan.id, { status: 'planned' });
      onSuccess('Voting cancelled');
      onClose();
    } catch (err) {
      setError('Failed to cancel voting');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Delete the entire meal plan
  const handleDeleteMealPlan = async () => {
    if (!confirm('Delete this meal plan? All suggestions and votes will be lost.')) return;

    setSubmitting(true);
    try {
      await mealsApi.deleteMealPlan(mealPlan.id);
      onSuccess('Meal plan deleted');
      onClose();
    } catch (err) {
      setError('Failed to delete meal plan');
    } finally {
      setSubmitting(false);
    }
  };

  // Sort suggestions by vote count
  const sortedSuggestions = [...suggestions].sort((a, b) => b.voteCount - a.voteCount);

  // Build title with date
  const titleContent = (
    <div>
      <div>Vote for Dinner</div>
      <p className="text-sm text-[var(--color-muted-foreground)] font-normal">{formattedDate}</p>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={titleContent}
      size="lg"
    >
      <ModalBody>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : (
          <>
            {/* Suggestions List */}
            <div className="space-y-3 mb-4">
              {sortedSuggestions.length === 0 ? (
                <div className="text-center py-6 text-[var(--color-muted-foreground)]">
                  <Vote size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No suggestions yet. Be the first to suggest a meal!</p>
                </div>
              ) : (
                sortedSuggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onVote={() => handleVote(suggestion.id)}
                    isAdmin={isAdmin}
                    onFinalize={() => handleFinalize(
                      suggestion.recipeId || undefined,
                      suggestion.customMealName || undefined
                    )}
                  />
                ))
              )}
            </div>

            {/* Add Suggestion */}
            {showAddSuggestion ? (
              <div className="p-4 bg-[var(--color-muted)] rounded-xl space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                    Suggest from Recipe Book
                  </label>
                  <select
                    value={selectedRecipeId || ''}
                    onChange={(e) => {
                      setSelectedRecipeId(parseInt(e.target.value) || null);
                      setCustomName('');
                    }}
                    className="themed-input w-full"
                  >
                    <option value="">Choose a recipe...</option>
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-center text-sm text-[var(--color-muted-foreground)]">or</div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                    Custom Suggestion
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value);
                      setSelectedRecipeId(null);
                    }}
                    className="themed-input w-full"
                    placeholder="e.g., Tacos, Sushi..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddSuggestion(false)}
                    className="themed-btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSuggestion}
                    disabled={submitting}
                    className="themed-btn-primary flex-1"
                  >
                    {submitting ? 'Adding...' : 'Add Suggestion'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddSuggestion(true)}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Suggestion
              </button>
            )}

            {/* Admin: Finalize with winner button */}
            {isAdmin && sortedSuggestions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <button
                  onClick={() => handleFinalize()}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[var(--color-success)] text-[var(--color-success-foreground)] hover:bg-[var(--color-success)]/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  {submitting ? 'Finalizing...' : 'Finalize with Top Vote'}
                </button>
                <p className="text-xs text-center text-[var(--color-muted-foreground)] mt-2">
                  Click a suggestion's ✨ icon to pick a specific winner
                </p>
              </div>
            )}

            {/* Admin: Cancel Voting / Delete Meal Plan */}
            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex gap-3">
                <button
                  onClick={handleCancelVoting}
                  disabled={submitting}
                  className="flex-1 py-2 px-3 rounded-xl border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors text-sm"
                >
                  Cancel Voting
                </button>
                <button
                  onClick={handleDeleteMealPlan}
                  disabled={submitting}
                  className="py-2 px-3 rounded-xl border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </ModalBody>
    </ModalPortal>
  );
}

// Suggestion Card Component
function SuggestionCard({
  suggestion,
  onVote,
  isAdmin,
  onFinalize,
}: {
  suggestion: MealSuggestion;
  onVote: () => void;
  isAdmin: boolean;
  onFinalize: () => void;
}) {
  const name = suggestion.recipe?.name || suggestion.customMealName || 'Unknown';

  return (
    <div className="p-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl flex items-center gap-4">
      {/* Recipe image or icon */}
      <div className="w-12 h-12 rounded-lg bg-[var(--color-muted)] flex items-center justify-center overflow-hidden flex-shrink-0">
        {suggestion.recipe?.imageUrl ? (
          <img
            src={suggestion.recipe.imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ChefHat size={20} className="text-[var(--color-muted-foreground)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-foreground)] truncate">{name}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Suggested by {suggestion.suggestedByName || 'Unknown'}
        </p>
      </div>

      {/* Vote count */}
      <div className="text-center">
        <span className="text-xl font-bold text-[var(--color-foreground)]">
          {suggestion.voteCount}
        </span>
        <p className="text-xs text-[var(--color-muted-foreground)]">votes</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onVote}
          className={`p-2 rounded-lg transition-colors ${
            suggestion.hasVoted
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]'
          }`}
          title={suggestion.hasVoted ? 'Your vote' : 'Vote for this'}
        >
          <Check size={18} />
        </button>

        {isAdmin && (
          <button
            onClick={onFinalize}
            className="p-2 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 transition-colors"
            title="Pick this as winner"
          >
            <Sparkles size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
