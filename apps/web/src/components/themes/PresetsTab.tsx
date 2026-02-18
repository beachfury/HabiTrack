// apps/web/src/components/themes/PresetsTab.tsx
// Quick-apply theme presets (LCARS, Glassmorphism, Matrix, etc.)

import type { ExtendedTheme } from '../../types/theme';

export function PresetsTab({
  onApplyPreset,
}: {
  onApplyPreset: (preset: Partial<ExtendedTheme>) => void;
}) {
  const presets: { name: string; description: string; preset: Partial<ExtendedTheme> }[] = [
    {
      name: 'LCARS',
      description: 'Star Trek-inspired interface',
      preset: {
        elementStyles: {
          sidebar: {
            backgroundColor: '#000000',
            borderRadius: 0,
            customCSS: 'border-top-right-radius: 40px; border-bottom-right-radius: 40px;',
          },
          card: {
            backgroundColor: 'rgba(204, 153, 0, 0.15)',
            borderColor: '#cc9900',
            borderWidth: 2,
            borderRadius: 0,
          },
          'button-primary': {
            backgroundColor: '#cc9900',
            borderRadius: 15,
            customCSS: 'clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 25%);',
          },
          widget: {
            backgroundColor: 'rgba(153, 153, 255, 0.1)',
            borderColor: '#9999ff',
            borderWidth: 1,
            borderRadius: 0,
          },
        },
        lcarsMode: {
          enabled: true,
          cornerStyle: 'lcars-curve',
          colorScheme: {
            primary: '#cc9900',
            secondary: '#9999ff',
            tertiary: '#cc6666',
            background: '#000000',
          },
        },
      },
    },
    {
      name: 'Glassmorphism',
      description: 'Frosted glass effect',
      preset: {
        elementStyles: {
          card: {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            blur: 10,
          },
          sidebar: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            blur: 20,
          },
        },
      },
    },
    {
      name: 'Sharp',
      description: 'No rounded corners',
      preset: {
        elementStyles: {
          card: { borderRadius: 0 },
          widget: { borderRadius: 0 },
          'button-primary': { borderRadius: 0 },
          'button-secondary': { borderRadius: 0 },
          input: { borderRadius: 0 },
          modal: { borderRadius: 0 },
        },
      },
    },
    {
      name: 'Pill',
      description: 'Maximum rounded corners',
      preset: {
        elementStyles: {
          card: { borderRadius: 24 },
          widget: { borderRadius: 16 },
          'button-primary': { borderRadius: 9999 },
          'button-secondary': { borderRadius: 9999 },
          input: { borderRadius: 9999 },
        },
      },
    },
    {
      name: 'Neon',
      description: 'Glowing borders',
      preset: {
        elementStyles: {
          card: {
            backgroundColor: 'rgba(60, 179, 113, 0.1)',
            borderColor: '#3cb371',
            borderWidth: 1,
            boxShadow: '0 0 20px rgba(60, 179, 113, 0.3)',
          },
          'button-primary': {
            boxShadow: '0 0 15px rgba(60, 179, 113, 0.5)',
          },
        },
      },
    },
    {
      name: 'Matrix (Slow)',
      description: 'Digital rain - peaceful speed',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #000800 0%, #001a00 50%, #000800 100%);
border-right: 2px solid #00ff00;
box-shadow: inset 0 0 30px rgba(0,255,0,0.15), 0 0 25px rgba(0,255,0,0.4);
text-shadow: 0 0 8px #00ff00;
matrix-rain: true;
matrix-rain-speed: slow;`,
            textColor: '#00ff00',
          },
          card: {
            backgroundColor: 'rgba(0, 40, 0, 0.9)',
            borderColor: '#00ff00',
            borderWidth: 1,
            textColor: '#00ff00',
          },
        },
        colorsDark: {
          primary: '#00ff00',
          primaryForeground: '#000800',
          secondary: '#003300',
          secondaryForeground: '#00ff00',
          accent: '#00ff00',
          accentForeground: '#000800',
          background: '#000800',
          foreground: '#00ff00',
          card: '#001a00',
          cardForeground: '#00ff00',
          muted: '#002200',
          mutedForeground: '#00cc00',
          border: '#003300',
          destructive: '#ff0000',
          destructiveForeground: '#ffffff',
          success: '#00ff00',
          successForeground: '#000800',
          warning: '#ffff00',
          warningForeground: '#000000',
        },
      },
    },
    {
      name: 'Matrix (Fast)',
      description: 'Digital rain - intense hacker mode',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #000800 0%, #001a00 50%, #000800 100%);
border-right: 2px solid #00ff00;
box-shadow: inset 0 0 30px rgba(0,255,0,0.15), 0 0 25px rgba(0,255,0,0.4);
text-shadow: 0 0 8px #00ff00;
animation: crt-flicker 0.1s infinite;
matrix-rain: true;
matrix-rain-speed: fast;`,
            textColor: '#00ff00',
          },
          card: {
            backgroundColor: 'rgba(0, 40, 0, 0.9)',
            borderColor: '#00ff00',
            borderWidth: 1,
            textColor: '#00ff00',
          },
        },
        colorsDark: {
          primary: '#00ff00',
          primaryForeground: '#000800',
          secondary: '#003300',
          secondaryForeground: '#00ff00',
          accent: '#00ff00',
          accentForeground: '#000800',
          background: '#000800',
          foreground: '#00ff00',
          card: '#001a00',
          cardForeground: '#00ff00',
          muted: '#002200',
          mutedForeground: '#00cc00',
          border: '#003300',
          destructive: '#ff0000',
          destructiveForeground: '#ffffff',
          success: '#00ff00',
          successForeground: '#000800',
          warning: '#ffff00',
          warningForeground: '#000000',
        },
      },
    },
    {
      name: 'Winter Wonderland',
      description: 'Snowfall effect with icy colors',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #1a2a3a 0%, #0d1a26 100%);
border-right: 1px solid #87ceeb;
box-shadow: inset 0 0 20px rgba(135,206,235,0.1);
snowfall: true;`,
            textColor: '#e0f0ff',
          },
          card: {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderColor: '#87ceeb',
            borderWidth: 1,
            blur: 8,
          },
        },
        colorsLight: {
          primary: '#4a90d9',
          primaryForeground: '#ffffff',
          secondary: '#e8f4fc',
          secondaryForeground: '#2c5282',
          accent: '#63b3ed',
          accentForeground: '#1a365d',
          background: '#f0f8ff',
          foreground: '#2d3748',
          card: '#ffffff',
          cardForeground: '#2d3748',
          muted: '#e2e8f0',
          mutedForeground: '#718096',
          border: '#bee3f8',
          destructive: '#e53e3e',
          destructiveForeground: '#ffffff',
          success: '#48bb78',
          successForeground: '#ffffff',
          warning: '#ed8936',
          warningForeground: '#1a202c',
        },
      },
    },
    {
      name: 'Magical Sparkle',
      description: 'Twinkling stars effect',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
border-right: 1px solid #ffd700;
box-shadow: inset 0 0 30px rgba(255,215,0,0.1);
sparkle: true;`,
            textColor: '#f0e68c',
          },
          card: {
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            borderColor: '#ffd700',
            borderWidth: 1,
          },
        },
        colorsDark: {
          primary: '#ffd700',
          primaryForeground: '#1a1a2e',
          secondary: '#2a2a4e',
          secondaryForeground: '#ffd700',
          accent: '#ff6b6b',
          accentForeground: '#1a1a2e',
          background: '#0f0f23',
          foreground: '#f0e68c',
          card: '#1a1a2e',
          cardForeground: '#f0e68c',
          muted: '#2a2a4e',
          mutedForeground: '#b8860b',
          border: '#3a3a5e',
          destructive: '#ff6b6b',
          destructiveForeground: '#ffffff',
          success: '#98fb98',
          successForeground: '#1a1a2e',
          warning: '#ffa500',
          warningForeground: '#1a1a2e',
        },
      },
    },
    {
      name: 'Underwater',
      description: 'Rising bubbles effect',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #001830 0%, #003060 50%, #001830 100%);
border-right: 1px solid #00ced1;
box-shadow: inset 0 0 40px rgba(0,206,209,0.15);
bubbles: true;`,
            textColor: '#87ceeb',
          },
          card: {
            backgroundColor: 'rgba(0, 48, 96, 0.8)',
            borderColor: '#00ced1',
            borderWidth: 1,
            blur: 5,
          },
        },
        colorsDark: {
          primary: '#00ced1',
          primaryForeground: '#001830',
          secondary: '#003060',
          secondaryForeground: '#87ceeb',
          accent: '#20b2aa',
          accentForeground: '#001830',
          background: '#001830',
          foreground: '#b0e0e6',
          card: '#002040',
          cardForeground: '#b0e0e6',
          muted: '#003050',
          mutedForeground: '#5f9ea0',
          border: '#004080',
          destructive: '#ff6347',
          destructiveForeground: '#ffffff',
          success: '#3cb371',
          successForeground: '#001830',
          warning: '#ffa07a',
          warningForeground: '#001830',
        },
      },
    },
    {
      name: 'Cozy Fireplace',
      description: 'Floating embers effect',
      preset: {
        elementStyles: {
          sidebar: {
            customCSS: `background: linear-gradient(180deg, #1a0a00 0%, #2d1506 50%, #1a0a00 100%);
border-right: 1px solid #ff6600;
box-shadow: inset 0 0 40px rgba(255,102,0,0.2);
embers: true;`,
            textColor: '#ffd9b3',
          },
          card: {
            backgroundColor: 'rgba(45, 21, 6, 0.95)',
            borderColor: '#ff9900',
            borderWidth: 1,
          },
        },
        colorsDark: {
          primary: '#ff6600',
          primaryForeground: '#1a0a00',
          secondary: '#3d1f0a',
          secondaryForeground: '#ffd9b3',
          accent: '#ff9900',
          accentForeground: '#1a0a00',
          background: '#1a0a00',
          foreground: '#ffeedd',
          card: '#2d1506',
          cardForeground: '#ffeedd',
          muted: '#3d1f0a',
          mutedForeground: '#cc7700',
          border: '#5d2f1a',
          destructive: '#ff4444',
          destructiveForeground: '#ffffff',
          success: '#88cc44',
          successForeground: '#1a0a00',
          warning: '#ffcc00',
          warningForeground: '#1a0a00',
        },
      },
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Apply a preset to quickly transform your theme. You can customize further after applying.
      </p>
      {presets.map((p) => (
        <button
          key={p.name}
          onClick={() => onApplyPreset(p.preset)}
          className="w-full flex flex-col p-3 rounded-lg text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {p.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {p.description}
          </span>
        </button>
      ))}
    </div>
  );
}
