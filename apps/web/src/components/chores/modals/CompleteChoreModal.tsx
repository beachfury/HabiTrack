// apps/web/src/components/chores/modals/CompleteChoreModal.tsx
import { useState } from 'react';
import { Star, Clock, MessageSquare, Camera, X } from 'lucide-react';
import type { ChoreInstance } from '../../../types';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';
import { ModalFooterButtons } from '../../common/ModalFooterButtons';
import { getDifficultyStyle } from '../../../utils';

const API_BASE = '/api';
async function uploadChoreImage(imageData: string, contentType: string): Promise<{ imageKey: string }> {
  const response = await fetch(`${API_BASE}/chores/upload-image`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData, contentType }),
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}

interface CompleteChoreModalProps {
  instance: ChoreInstance;
  onComplete: (instance: ChoreInstance, notes?: string, photos?: string[]) => void;
  onClose: () => void;
}

export function CompleteChoreModal({ instance, onComplete, onClose }: CompleteChoreModalProps) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) continue;
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const result = await uploadChoreImage(dataUrl, file.type);
        setCompletionPhotos((prev) => [...prev, result.imageKey]);
      }
    } catch (err: any) {
      console.error('Photo upload failed:', err);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onComplete(instance, notes || undefined, completionPhotos.length > 0 ? completionPhotos : undefined);
    setSubmitting(false);
  };

  const footer = (
    <ModalFooterButtons
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitText="Complete"
      submitting={submitting}
    />
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Complete Chore"
      size="md"
      footer={footer}
    >
      <ModalBody>
        <div className="space-y-4">
          {/* Chore Info */}
          <div className="bg-[var(--color-muted)] rounded-xl p-4">
            <h3 className="font-semibold text-[var(--color-foreground)] mb-2">{instance.title}</h3>
            {instance.description && (
              <p className="text-[var(--color-muted-foreground)] text-sm mb-3">{instance.description}</p>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span
                className="px-2 py-0.5 rounded-full"
                style={getDifficultyStyle(instance.difficulty)}
              >
                {instance.difficulty}
              </span>
              <span className="text-[var(--color-muted-foreground)] flex items-center gap-1">
                <Star size={14} className="text-[var(--color-warning)]" />
                {instance.points} points
              </span>
              {instance.estimatedMinutes && (
                <span className="text-[var(--color-muted-foreground)] flex items-center gap-1">
                  <Clock size={14} />
                  ~{instance.estimatedMinutes} min
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              <MessageSquare size={14} className="inline mr-1" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this completion..."
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] resize-none"
              rows={3}
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Photos (optional)
            </label>
            {completionPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {completionPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border)]"
                    />
                    <button
                      type="button"
                      onClick={() => setCompletionPhotos((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-destructive)] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:opacity-80 transition-opacity">
              {uploadingPhoto ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-primary)]" />
              ) : (
                <Camera size={18} className="text-[var(--color-muted-foreground)]" />
              )}
              <span className="text-sm text-[var(--color-muted-foreground)]">
                {uploadingPhoto ? 'Uploading...' : 'Add photos'}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>
          </div>

          {/* Approval Notice */}
          {instance.requireApproval && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
                color: 'var(--color-warning)',
                border: '1px solid',
              }}
            >
              This chore requires admin approval before points are awarded.
            </div>
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
