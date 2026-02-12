// apps/web/src/pages/recipes/AddRecipeModal.tsx
// Modal for adding a new recipe

import { useState } from 'react';
import { Plus, X, Loader2, Trash2, ImagePlus, Image } from 'lucide-react';
import { ModalPortal, ModalBody } from '../../components/common/ModalPortal';
import { mealsApi } from '../../api/meals';
import type { RecipeDifficulty, CreateRecipeData, CreateIngredientData } from '../../types/meals';

interface AddRecipeModalProps {
  onClose: () => void;
  onSuccess: (name: string) => void;
  isAdmin: boolean;
}

export function AddRecipeModal({ onClose, onSuccess, isAdmin }: AddRecipeModalProps) {
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
      sortOrder: formData.ingredients?.length || 0,
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
