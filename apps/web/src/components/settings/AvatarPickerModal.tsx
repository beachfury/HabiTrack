// apps/web/src/components/settings/AvatarPickerModal.tsx
import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import {
  Smile,
  Shapes,
  Image,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { ModalPortal, ModalBody } from '../common/ModalPortal';
import { ModalFooterButtons } from '../common/ModalFooterButtons';
import {
  getCroppedImg,
  renderEmojiToImage,
  renderIconToImage,
  renderSvgToImage,
} from '../../utils/cropImage';
import {
  EMOJI_AVATARS,
  ICON_AVATARS,
  ILLUSTRATION_AVATARS,
  ICON_BG_COLORS,
} from './avatarPresets';
import type { IconAvatar } from './avatarPresets';
import { renderToStaticMarkup } from 'react-dom/server';

type TabId = 'emoji' | 'icons' | 'illustrations' | 'upload';

interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatarUrl: string | null;
  userColor: string;
  onSelect: (data: { dataUrl: string; mimeType: string }) => void;
  onClose: () => void;
}

const TABS: { id: TabId; label: string; icon: typeof Smile }[] = [
  { id: 'emoji', label: 'Emoji', icon: Smile },
  { id: 'icons', label: 'Icons', icon: Shapes },
  { id: 'illustrations', label: 'Characters', icon: Image },
  { id: 'upload', label: 'Upload', icon: Upload },
];

export function AvatarPickerModal({
  isOpen,
  userColor,
  onSelect,
  onClose,
}: AvatarPickerModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('emoji');
  const [saving, setSaving] = useState(false);

  // Emoji state
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  // Icon state
  const [selectedIcon, setSelectedIcon] = useState<IconAvatar | null>(null);
  const [iconBgColor, setIconBgColor] = useState(userColor || '#3b82f6');

  // Illustration state
  const [selectedIllustration, setSelectedIllustration] = useState<string | null>(null);

  // Upload/crop state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadImageUrl, setUploadImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropBgColor, setCropBgColor] = useState(userColor || '#e5e7eb');

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) return;

    if (uploadImageUrl) URL.revokeObjectURL(uploadImageUrl);
    const url = URL.createObjectURL(file);
    setUploadImageUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    e.target.value = '';
  };

  const clearUpload = () => {
    if (uploadImageUrl) URL.revokeObjectURL(uploadImageUrl);
    setUploadImageUrl(null);
    setCroppedAreaPixels(null);
  };

  const hasSelection = () => {
    if (activeTab === 'emoji') return !!selectedEmoji;
    if (activeTab === 'icons') return !!selectedIcon;
    if (activeTab === 'illustrations') return !!selectedIllustration;
    if (activeTab === 'upload') return !!uploadImageUrl && !!croppedAreaPixels;
    return false;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result: { dataUrl: string; mimeType: string };

      if (activeTab === 'emoji' && selectedEmoji) {
        result = await renderEmojiToImage(selectedEmoji, iconBgColor);
      } else if (activeTab === 'icons' && selectedIcon) {
        const IconComponent = selectedIcon.icon;
        const svgHtml = renderToStaticMarkup(
          <IconComponent size={200} strokeWidth={2} stroke="white" />
        );
        result = await renderIconToImage(svgHtml, iconBgColor);
      } else if (activeTab === 'illustrations' && selectedIllustration) {
        result = await renderSvgToImage(selectedIllustration);
      } else if (activeTab === 'upload' && uploadImageUrl && croppedAreaPixels) {
        result = await getCroppedImg(uploadImageUrl, croppedAreaPixels, 400, cropBgColor);
      } else {
        return;
      }

      onSelect(result);
    } catch {
      // Stay in modal on error
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (uploadImageUrl) URL.revokeObjectURL(uploadImageUrl);
    onClose();
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={handleClose}
      title="Choose Avatar"
      size="lg"
      footer={
        <ModalFooterButtons
          onCancel={handleClose}
          onSubmit={handleSave}
          submitText="Save Avatar"
          submittingText="Saving..."
          submitting={saving}
          submitDisabled={!hasSelection()}
        />
      }
    >
      <ModalBody className="!p-0">
        {/* Tabs */}
        <div
          className="flex border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-b-2'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={isActive ? {
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-primary)',
                } : undefined}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-4" style={{ minHeight: '320px' }}>
          {/* Emoji Tab */}
          {activeTab === 'emoji' && (
            <div className="space-y-3">
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl sm:text-3xl transition-all hover:scale-110 ${
                      selectedEmoji === emoji
                        ? 'ring-2 ring-offset-2 scale-110'
                        : 'hover:bg-[var(--color-muted)]'
                    }`}
                    style={selectedEmoji === emoji ? {
                      ['--tw-ring-color' as string]: 'var(--color-primary)',
                    } : undefined}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {selectedEmoji && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-[var(--color-muted-foreground)]">Background:</span>
                  <div className="flex gap-1.5">
                    {ICON_BG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setIconBgColor(color)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          iconBgColor === color ? 'ring-2 ring-offset-1 scale-110' : ''
                        }`}
                        style={{
                          backgroundColor: color,
                          ['--tw-ring-color' as string]: 'var(--color-primary)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Icons Tab */}
          {activeTab === 'icons' && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
                {ICON_AVATARS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedIcon?.name === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSelectedIcon(item)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        isSelected
                          ? 'ring-2 ring-offset-2 scale-105'
                          : 'hover:bg-[var(--color-muted)]'
                      }`}
                      style={isSelected ? { ['--tw-ring-color' as string]: 'var(--color-primary)' } : undefined}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: isSelected ? iconBgColor : item.defaultColor }}
                      >
                        <Icon size={24} className="text-white" />
                      </div>
                      <span className="text-xs text-[var(--color-muted-foreground)] truncate w-full text-center">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedIcon && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-[var(--color-muted-foreground)]">Color:</span>
                  <div className="flex gap-1.5">
                    {ICON_BG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setIconBgColor(color)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          iconBgColor === color ? 'ring-2 ring-offset-1 scale-110' : ''
                        }`}
                        style={{
                          backgroundColor: color,
                          ['--tw-ring-color' as string]: 'var(--color-primary)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Illustrations Tab */}
          {activeTab === 'illustrations' && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {ILLUSTRATION_AVATARS.map((item) => {
                const isSelected = selectedIllustration === item.src;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIllustration(item.src)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-2 scale-105'
                        : 'hover:bg-[var(--color-muted)]'
                    }`}
                    style={isSelected ? { ['--tw-ring-color' as string]: 'var(--color-primary)' } : undefined}
                  >
                    <img
                      src={item.src}
                      alt={item.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <span className="text-xs text-[var(--color-muted-foreground)] truncate w-full text-center">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div>
              {!uploadImageUrl ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-muted)' }}
                  >
                    <Upload size={32} className="text-[var(--color-muted-foreground)]" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-[var(--color-foreground)]">
                      Upload a photo
                    </p>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                      JPEG, PNG, GIF, or WebP (max 5MB)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg font-medium"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-primary-foreground)',
                    }}
                  >
                    Choose File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Crop area */}
                  <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '280px' }}>
                    <Cropper
                      image={uploadImageUrl}
                      crop={crop}
                      zoom={zoom}
                      minZoom={0.5}
                      maxZoom={3}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      restrictPosition={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      style={{
                        containerStyle: { backgroundColor: cropBgColor },
                      }}
                    />
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-3 px-2">
                    <ZoomOut size={18} className="text-[var(--color-muted-foreground)] flex-shrink-0" />
                    <input
                      type="range"
                      min={0.5}
                      max={3}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <ZoomIn size={18} className="text-[var(--color-muted-foreground)] flex-shrink-0" />
                  </div>

                  {/* Background color picker */}
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-sm text-[var(--color-muted-foreground)]">Background:</span>
                    <div className="flex gap-1.5">
                      {ICON_BG_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCropBgColor(color)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            cropBgColor === color ? 'ring-2 ring-offset-1 scale-110' : ''
                          }`}
                          style={{
                            backgroundColor: color,
                            ['--tw-ring-color' as string]: 'var(--color-primary)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Reset / Choose different */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={clearUpload}
                      className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                      <RotateCcw size={14} />
                      Choose different image
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
