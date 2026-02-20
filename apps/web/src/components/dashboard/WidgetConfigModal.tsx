// WidgetConfigModal.tsx
// Auto-generates a settings form from a widget's configSchema.
// Used in HomePage customize mode — gear icon opens this modal.

import { useState, useMemo } from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import { ModalPortal, ModalBody, ModalFooter } from '../common/ModalPortal';

// ── Config Schema Types ────────────────────────────────────────────────────

interface ConfigSchemaField {
  type: 'string' | 'number' | 'boolean';
  title: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  enumLabels?: string[];
  format?: string;
  minimum?: number;
  maximum?: number;
}

interface ConfigSchema {
  properties: Record<string, ConfigSchemaField>;
}

// ── Component Props ────────────────────────────────────────────────────────

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetName: string;
  configSchema: Record<string, unknown>;
  currentConfig: Record<string, unknown>;
  onSave: (config: Record<string, unknown>) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getDefaults(schema: ConfigSchema): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(schema.properties)) {
    if (field.default !== undefined) {
      defaults[key] = field.default;
    } else if (field.type === 'boolean') {
      defaults[key] = false;
    } else if (field.type === 'number') {
      defaults[key] = field.minimum ?? 0;
    } else {
      defaults[key] = '';
    }
  }
  return defaults;
}

function isValidSchema(schema: unknown): schema is ConfigSchema {
  if (!schema || typeof schema !== 'object') return false;
  const s = schema as Record<string, unknown>;
  return s.properties != null && typeof s.properties === 'object';
}

// ── Input Styles ───────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40';
const inputStyle = {
  backgroundColor: 'var(--color-background)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-foreground)',
};

// ── Component ──────────────────────────────────────────────────────────────

export function WidgetConfigModal({
  isOpen,
  onClose,
  widgetName,
  configSchema,
  currentConfig,
  onSave,
}: WidgetConfigModalProps) {
  // Parse and validate schema
  const schema = useMemo(() => {
    if (isValidSchema(configSchema)) return configSchema;
    return null;
  }, [configSchema]);

  const defaults = useMemo(() => (schema ? getDefaults(schema) : {}), [schema]);

  // Local form state, initialized from current config merged with defaults
  const [formData, setFormData] = useState<Record<string, unknown>>(() => ({
    ...defaults,
    ...currentConfig,
  }));

  if (!schema) return null;

  const fields = Object.entries(schema.properties);

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetDefaults = () => {
    setFormData({ ...defaults });
  };

  const handleSave = () => {
    onSave(formData);
  };

  // ── Render Field ──────────────────────────────────────────────────────

  const renderField = (key: string, field: ConfigSchemaField) => {
    const value = formData[key];

    // Boolean → Toggle
    if (field.type === 'boolean') {
      return (
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{field.title}</p>
            {field.description && (
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{field.description}</p>
            )}
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 rounded-full transition-colors bg-[var(--color-muted)] peer-checked:bg-[var(--color-primary)]" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-white peer-checked:translate-x-5" />
          </div>
        </label>
      );
    }

    // String with enum → Select dropdown
    if (field.type === 'string' && field.enum) {
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            {field.title}
          </label>
          {field.description && (
            <p className="text-xs text-[var(--color-muted-foreground)] mb-2">{field.description}</p>
          )}
          <select
            value={String(value ?? '')}
            onChange={(e) => handleChange(key, e.target.value)}
            className={`${inputClass} appearance-none cursor-pointer`}
            style={inputStyle}
          >
            {field.enum.map((opt, i) => (
              <option key={opt} value={opt}>
                {field.enumLabels?.[i] ?? opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // String with format: color → Color input
    if (field.type === 'string' && field.format === 'color') {
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            {field.title}
          </label>
          {field.description && (
            <p className="text-xs text-[var(--color-muted-foreground)] mb-2">{field.description}</p>
          )}
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={String(value ?? '#6366f1')}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-10 h-10 rounded-lg border cursor-pointer"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <input
              type="text"
              value={String(value ?? '')}
              onChange={(e) => handleChange(key, e.target.value)}
              className={inputClass}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="#6366f1"
            />
          </div>
        </div>
      );
    }

    // Number → Number input
    if (field.type === 'number') {
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            {field.title}
          </label>
          {field.description && (
            <p className="text-xs text-[var(--color-muted-foreground)] mb-2">{field.description}</p>
          )}
          <input
            type="number"
            value={value !== undefined && value !== null ? Number(value) : ''}
            onChange={(e) => handleChange(key, e.target.value === '' ? field.default ?? 0 : Number(e.target.value))}
            min={field.minimum}
            max={field.maximum}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      );
    }

    // Default: String → Text input
    return (
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          {field.title}
        </label>
        {field.description && (
          <p className="text-xs text-[var(--color-muted-foreground)] mb-2">{field.description}</p>
        )}
        <input
          type={field.format === 'date' ? 'date' : 'text'}
          value={String(value ?? '')}
          onChange={(e) => handleChange(key, e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>
    );
  };

  // ── Modal ─────────────────────────────────────────────────────────────

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Settings size={18} className="text-[var(--color-primary)]" />
          {widgetName} Settings
        </span>
      }
      size="md"
      footer={
        <ModalFooter>
          <button
            onClick={handleResetDefaults}
            className="themed-btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm mr-auto"
          >
            <RotateCcw size={14} /> Defaults
          </button>
          <button onClick={onClose} className="themed-btn-secondary px-4 py-2 text-sm">
            Cancel
          </button>
          <button onClick={handleSave} className="themed-btn-primary px-4 py-2 text-sm">
            Save
          </button>
        </ModalFooter>
      }
    >
      <ModalBody>
        {fields.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            This widget has no configurable settings.
          </p>
        ) : (
          <div className="space-y-5">
            {fields.map(([key, field]) => (
              <div key={key}>{renderField(key, field)}</div>
            ))}
          </div>
        )}
      </ModalBody>
    </ModalPortal>
  );
}
