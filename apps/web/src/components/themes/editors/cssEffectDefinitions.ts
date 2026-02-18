// apps/web/src/components/themes/editors/cssEffectDefinitions.ts
// CSS effect type definitions, constants, and utility functions for the
// AdvancedCSSEffects component. Contains all effect data organized by
// property type (background, border, shadow, text, shape, animation, pattern)
// and theme category (matrix, cyberpunk, retro, nature, minimal, etc.).

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CSSEffect {
  id: string;
  name: string;
  css: string;
  description?: string;
}

export interface EffectCategory {
  id: string;
  label: string;
  icon: string;
  effects: CSSEffect[];
}

export interface PropertyType {
  id: string;
  label: string;
  icon: string;
  description: string;
  categories: EffectCategory[];
}

// ============================================
// EFFECT DEFINITIONS
// Organized by Property Type, then by Theme Category
// ============================================

// BACKGROUND EFFECTS
const BACKGROUND_EFFECTS: PropertyType = {
  id: 'background',
  label: 'Background',
  icon: '🎨',
  description: 'Gradients, colors, and patterns',
  categories: [
    {
      id: 'matrix-hacker',
      label: 'Matrix/Hacker',
      icon: '🖥️',
      effects: [
        { id: 'bg-matrix-dark', name: 'Matrix Dark', css: 'background: linear-gradient(180deg, rgba(0,20,0,0.95) 0%, rgba(0,40,0,0.9) 100%);', description: 'Dark green gradient' },
        { id: 'bg-terminal', name: 'Terminal', css: 'background: linear-gradient(180deg, #000800 0%, #001a00 50%, #000800 100%);', description: 'Classic terminal look' },
        { id: 'bg-digital-rain', name: 'Digital Rain', css: 'background: linear-gradient(180deg, #000 0%, #001a00 50%, #000 100%);', description: 'Matrix rain background' },
        { id: 'bg-phosphor', name: 'Phosphor', css: 'background: radial-gradient(ellipse at center, rgba(0,50,0,0.8) 0%, rgba(0,20,0,0.95) 70%, rgba(0,0,0,1) 100%);', description: 'CRT phosphor glow' },
      ],
    },
    {
      id: 'cyberpunk',
      label: 'Cyberpunk',
      icon: '🌃',
      effects: [
        { id: 'bg-neon-city', name: 'Neon City', css: 'background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);', description: 'Dark blue neon' },
        { id: 'bg-synthwave', name: 'Synthwave', css: 'background: linear-gradient(180deg, #2b1055 0%, #7597de 50%, #ff6b6b 100%);', description: '80s synthwave' },
        { id: 'bg-cyber-purple', name: 'Cyber Purple', css: 'background: linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%);', description: 'Deep purple cyber' },
        { id: 'bg-hologram', name: 'Hologram', css: 'background: linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(255,0,255,0.1) 50%, rgba(0,255,255,0.1) 100%);', description: 'Holographic shimmer' },
      ],
    },
    {
      id: 'retro',
      label: 'Retro/CRT',
      icon: '📺',
      effects: [
        { id: 'bg-amber-crt', name: 'Amber CRT', css: 'background: #1a0f00;', description: 'Amber monitor' },
        { id: 'bg-green-crt', name: 'Green CRT', css: 'background: #001a00;', description: 'Green monitor' },
        { id: 'bg-blue-crt', name: 'Blue CRT', css: 'background: linear-gradient(180deg, #001830 0%, #003060 50%, #001830 100%);', description: 'Blue monitor' },
        { id: 'bg-vhs', name: 'VHS', css: 'background: linear-gradient(180deg, #1a1a2e 0%, #2d2d44 100%);', description: 'VHS tape look' },
      ],
    },
    {
      id: 'nature',
      label: 'Nature',
      icon: '🌿',
      effects: [
        { id: 'bg-aurora', name: 'Aurora', css: 'background: linear-gradient(180deg, #0a0a2e 0%, #1a3a5c 30%, #2d5a5a 60%, #1a3a5c 100%);', description: 'Northern lights' },
        { id: 'bg-sunset', name: 'Sunset', css: 'background: linear-gradient(180deg, #1a0a00 0%, #2d1506 50%, #1a0a00 100%);', description: 'Warm sunset' },
        { id: 'bg-ocean', name: 'Ocean', css: 'background: linear-gradient(180deg, #001a2c 0%, #003366 50%, #001a2c 100%);', description: 'Deep ocean blue' },
        { id: 'bg-forest', name: 'Forest', css: 'background: linear-gradient(180deg, #0a1a0a 0%, #1a2e1a 50%, #0a1a0a 100%);', description: 'Deep forest green' },
      ],
    },
    {
      id: 'minimal',
      label: 'Minimal',
      icon: '⬜',
      effects: [
        { id: 'bg-glass-dark', name: 'Glass Dark', css: 'background: rgba(0,0,0,0.5); backdrop-filter: blur(10px);', description: 'Dark glass effect' },
        { id: 'bg-glass-light', name: 'Glass Light', css: 'background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);', description: 'Light glass effect' },
        { id: 'bg-subtle-gradient', name: 'Subtle Gradient', css: 'background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%);', description: 'Subtle dark gradient' },
        { id: 'bg-frosted', name: 'Frosted', css: 'background: rgba(255,255,255,0.05); backdrop-filter: blur(20px) saturate(180%);', description: 'Frosted glass' },
      ],
    },
  ],
};

// BORDER EFFECTS
const BORDER_EFFECTS: PropertyType = {
  id: 'border',
  label: 'Border',
  icon: '🔲',
  description: 'Borders, outlines, and edges',
  categories: [
    {
      id: 'matrix-hacker',
      label: 'Matrix/Hacker',
      icon: '🖥️',
      effects: [
        { id: 'border-matrix', name: 'Matrix Green', css: 'border: 1px solid #00ff00;', description: 'Green terminal border' },
        { id: 'border-matrix-thick', name: 'Matrix Thick', css: 'border: 2px solid #00ff00;', description: 'Thick green border' },
        { id: 'border-hacker', name: 'Hacker Gradient', css: 'border: 2px solid transparent; border-image: linear-gradient(45deg, #00ff00, #00aa00, #00ff00) 1;', description: 'Gradient green border' },
        { id: 'border-terminal', name: 'Terminal', css: 'border: 1px solid rgba(0,255,0,0.5);', description: 'Semi-transparent green' },
      ],
    },
    {
      id: 'cyberpunk',
      label: 'Cyberpunk',
      icon: '🌃',
      effects: [
        { id: 'border-neon-pink', name: 'Neon Pink', css: 'border: 2px solid #ff00ff;', description: 'Hot pink neon' },
        { id: 'border-neon-blue', name: 'Neon Blue', css: 'border: 2px solid #00ffff;', description: 'Cyan neon' },
        { id: 'border-cyber-gradient', name: 'Cyber Gradient', css: 'border: 2px solid transparent; border-image: linear-gradient(45deg, #00ffff, #ff00ff) 1;', description: 'Pink-cyan gradient' },
        { id: 'border-hologram', name: 'Hologram', css: 'border: 1px solid rgba(0,255,255,0.5);', description: 'Holographic border' },
      ],
    },
    {
      id: 'retro',
      label: 'Retro/CRT',
      icon: '📺',
      effects: [
        { id: 'border-amber', name: 'Amber', css: 'border: 1px solid #ffb000;', description: 'Amber monitor border' },
        { id: 'border-scanline', name: 'Scanline', css: 'border: 1px solid rgba(255,255,255,0.2);', description: 'CRT scanline style' },
        { id: 'border-retro-thick', name: 'Retro Thick', css: 'border: 3px solid;', description: 'Thick retro border' },
        { id: 'border-double', name: 'Double Line', css: 'border: 4px double;', description: 'Double border' },
      ],
    },
    {
      id: 'minimal',
      label: 'Minimal',
      icon: '⬜',
      effects: [
        { id: 'border-subtle', name: 'Subtle', css: 'border: 1px solid rgba(255,255,255,0.1);', description: 'Very subtle border' },
        { id: 'border-outline', name: 'Outline', css: 'outline: 1px solid rgba(255,255,255,0.2); outline-offset: 2px;', description: 'Offset outline' },
        { id: 'border-none', name: 'None', css: 'border: none;', description: 'Remove border' },
        { id: 'border-thin', name: 'Thin', css: 'border: 1px solid rgba(255,255,255,0.05);', description: 'Very thin border' },
      ],
    },
  ],
};

// SHADOW/GLOW EFFECTS
const SHADOW_EFFECTS: PropertyType = {
  id: 'shadow',
  label: 'Shadow/Glow',
  icon: '✨',
  description: 'Box shadows and glow effects',
  categories: [
    {
      id: 'matrix-hacker',
      label: 'Matrix/Hacker',
      icon: '🖥️',
      effects: [
        { id: 'shadow-matrix-glow', name: 'Matrix Glow', css: 'box-shadow: 0 0 15px rgba(0,255,0,0.4), inset 0 0 30px rgba(0,255,0,0.05);', description: 'Green outer glow' },
        { id: 'shadow-matrix-inner', name: 'Inner Glow', css: 'box-shadow: inset 0 0 30px rgba(0,255,0,0.2), inset 0 0 60px rgba(0,255,0,0.1);', description: 'Green inner glow' },
        { id: 'shadow-matrix-strong', name: 'Strong Glow', css: 'box-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 40px #00ff00;', description: 'Intense green glow' },
        { id: 'shadow-terminal', name: 'Terminal', css: 'box-shadow: 0 0 10px rgba(0,255,0,0.3), inset 0 0 10px rgba(0,255,0,0.1);', description: 'Soft terminal glow' },
      ],
    },
    {
      id: 'cyberpunk',
      label: 'Cyberpunk',
      icon: '🌃',
      effects: [
        { id: 'shadow-neon-pink', name: 'Neon Pink', css: 'box-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff;', description: 'Pink neon glow' },
        { id: 'shadow-neon-blue', name: 'Neon Blue', css: 'box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff;', description: 'Cyan neon glow' },
        { id: 'shadow-cyber-dual', name: 'Dual Neon', css: 'box-shadow: 0 0 10px #ff00ff, 0 0 20px #00ffff, inset 0 0 15px rgba(255,0,255,0.1);', description: 'Pink and cyan' },
        { id: 'shadow-hologram', name: 'Hologram', css: 'box-shadow: 0 0 20px rgba(0,255,255,0.3), inset 0 0 20px rgba(255,0,255,0.1);', description: 'Holographic glow' },
      ],
    },
    {
      id: 'retro',
      label: 'Retro/CRT',
      icon: '📺',
      effects: [
        { id: 'shadow-amber-glow', name: 'Amber Glow', css: 'box-shadow: 0 0 20px rgba(255,176,0,0.3), inset 0 0 50px rgba(255,176,0,0.1);', description: 'Warm amber glow' },
        { id: 'shadow-crt-curve', name: 'CRT Curve', css: 'box-shadow: inset 0 0 50px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,0,0.2);', description: 'CRT screen curve' },
        { id: 'shadow-phosphor', name: 'Phosphor Burn', css: 'box-shadow: inset 0 0 100px rgba(0,255,0,0.1);', description: 'Phosphor burn-in' },
        { id: 'shadow-vintage', name: 'Vintage', css: 'box-shadow: 0 0 30px rgba(255,200,100,0.2);', description: 'Warm vintage glow' },
      ],
    },
    {
      id: 'minimal',
      label: 'Minimal',
      icon: '⬜',
      effects: [
        { id: 'shadow-soft', name: 'Soft Shadow', css: 'box-shadow: 0 10px 40px rgba(0,0,0,0.3);', description: 'Soft drop shadow' },
        { id: 'shadow-subtle', name: 'Subtle', css: 'box-shadow: 0 4px 20px rgba(0,0,0,0.2);', description: 'Very subtle shadow' },
        { id: 'shadow-none', name: 'None', css: 'box-shadow: none;', description: 'Remove shadows' },
        { id: 'shadow-lifted', name: 'Lifted', css: 'box-shadow: 0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);', description: 'Lifted paper effect' },
      ],
    },
  ],
};

// TEXT EFFECTS
const TEXT_EFFECTS: PropertyType = {
  id: 'text',
  label: 'Text',
  icon: '📝',
  description: 'Text shadows and colors',
  categories: [
    {
      id: 'matrix-hacker',
      label: 'Matrix/Hacker',
      icon: '🖥️',
      effects: [
        { id: 'text-matrix-glow', name: 'Matrix Glow', css: 'text-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 20px #00ff00;', description: 'Green text glow' },
        { id: 'text-terminal', name: 'Terminal', css: 'text-shadow: 0 0 5px #00ff00; color: #00ff00;', description: 'Terminal text' },
        { id: 'text-hacker', name: 'Hacker', css: 'text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00; color: #00ff41;', description: 'Bright hacker text' },
        { id: 'text-code', name: 'Code', css: 'font-family: monospace; text-shadow: 0 0 3px #00ff00;', description: 'Monospace code style' },
      ],
    },
    {
      id: 'cyberpunk',
      label: 'Cyberpunk',
      icon: '🌃',
      effects: [
        { id: 'text-neon-pink', name: 'Neon Pink', css: 'text-shadow: 0 0 5px #ff00ff, 0 0 10px #ff00ff; color: #ff00ff;', description: 'Pink neon text' },
        { id: 'text-neon-blue', name: 'Neon Blue', css: 'text-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff; color: #00ffff;', description: 'Cyan neon text' },
        { id: 'text-glitch', name: 'Glitch', css: 'text-shadow: 2px 0 #ff0000, -2px 0 #00ffff;', description: 'RGB glitch effect' },
        { id: 'text-hologram', name: 'Hologram', css: 'text-shadow: 0 0 5px #00ffff, 0 0 10px #ff00ff; color: #ffffff;', description: 'Holographic text' },
      ],
    },
    {
      id: 'retro',
      label: 'Retro/CRT',
      icon: '📺',
      effects: [
        { id: 'text-amber', name: 'Amber', css: 'text-shadow: 0 0 5px #ffb000; color: #ffb000;', description: 'Amber CRT text' },
        { id: 'text-vhs', name: 'VHS', css: 'text-shadow: 2px 0 #ff0000, -2px 0 #00ffff;', description: 'VHS tracking error' },
        { id: 'text-crt-blur', name: 'CRT Blur', css: 'text-shadow: 0 0 2px currentColor, 0 0 4px currentColor;', description: 'CRT blur effect' },
        { id: 'text-scanline', name: 'Scanline', css: 'text-shadow: 0 1px 0 rgba(0,0,0,0.5);', description: 'Scanline shadow' },
      ],
    },
    {
      id: 'minimal',
      label: 'Minimal',
      icon: '⬜',
      effects: [
        { id: 'text-subtle-shadow', name: 'Subtle Shadow', css: 'text-shadow: 0 2px 4px rgba(0,0,0,0.3);', description: 'Soft text shadow' },
        { id: 'text-none', name: 'None', css: 'text-shadow: none;', description: 'Remove text shadow' },
        { id: 'text-crisp', name: 'Crisp', css: 'text-shadow: none; -webkit-font-smoothing: antialiased;', description: 'Crisp antialiased' },
        { id: 'text-emboss', name: 'Emboss', css: 'text-shadow: 0 1px 0 rgba(255,255,255,0.1), 0 -1px 0 rgba(0,0,0,0.3);', description: 'Embossed text' },
      ],
    },
  ],
};

// SHAPE EFFECTS
const SHAPE_EFFECTS: PropertyType = {
  id: 'shape',
  label: 'Shape',
  icon: '🔷',
  description: 'Clip-paths and transforms',
  categories: [
    {
      id: 'lcars',
      label: 'LCARS/Sci-Fi',
      icon: '🖖',
      effects: [
        { id: 'shape-lcars-clip', name: 'LCARS Clip', css: 'clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 25%);', description: 'Star Trek LCARS corner' },
        { id: 'shape-lcars-curve', name: 'LCARS Curve', css: 'border-top-right-radius: 40px; border-bottom-right-radius: 40px;', description: 'Curved LCARS style' },
        { id: 'shape-notched', name: 'Notched', css: 'clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));', description: 'Corner notches' },
        { id: 'shape-angled', name: 'Angled', css: 'clip-path: polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%);', description: 'Bottom-right angle' },
      ],
    },
    {
      id: 'geometric',
      label: 'Geometric',
      icon: '📐',
      effects: [
        { id: 'shape-hexagon', name: 'Hexagon', css: 'clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);', description: 'Hexagon shape' },
        { id: 'shape-octagon', name: 'Octagon', css: 'clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);', description: 'Octagon shape' },
        { id: 'shape-diamond', name: 'Diamond', css: 'clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);', description: 'Diamond shape' },
        { id: 'shape-chevron', name: 'Chevron', css: 'clip-path: polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%, 10% 50%);', description: 'Arrow chevron' },
      ],
    },
    {
      id: 'transform',
      label: 'Transform',
      icon: '🔄',
      effects: [
        { id: 'shape-skew-left', name: 'Skew Left', css: 'transform: skewX(-3deg);', description: 'Skew to the left' },
        { id: 'shape-skew-right', name: 'Skew Right', css: 'transform: skewX(3deg);', description: 'Skew to the right' },
        { id: 'shape-rotate-slight', name: 'Slight Rotate', css: 'transform: rotate(-1deg);', description: 'Slight rotation' },
        { id: 'shape-perspective', name: 'Perspective', css: 'transform: perspective(1000px) rotateY(-2deg);', description: '3D perspective' },
      ],
    },
    {
      id: 'rounded',
      label: 'Rounded',
      icon: '⭕',
      effects: [
        { id: 'shape-pill', name: 'Pill', css: 'border-radius: 9999px;', description: 'Fully rounded pill' },
        { id: 'shape-rounded-lg', name: 'Large Rounded', css: 'border-radius: 24px;', description: 'Large corner radius' },
        { id: 'shape-rounded-xl', name: 'Extra Large', css: 'border-radius: 32px;', description: 'Extra large radius' },
        { id: 'shape-asymmetric', name: 'Asymmetric', css: 'border-radius: 40px 8px 40px 8px;', description: 'Asymmetric corners' },
      ],
    },
  ],
};

// ANIMATION EFFECTS
const ANIMATION_EFFECTS: PropertyType = {
  id: 'animation',
  label: 'Animation',
  icon: '🎬',
  description: 'CSS animations and transitions',
  categories: [
    {
      id: 'glow',
      label: 'Glow/Pulse',
      icon: '💫',
      effects: [
        { id: 'anim-pulse-glow-slow', name: 'Pulse Glow (Slow)', css: 'animation: pulse-glow 4s ease-in-out infinite;', description: 'Slow pulsing glow' },
        { id: 'anim-pulse-glow', name: 'Pulse Glow (Normal)', css: 'animation: pulse-glow 2s ease-in-out infinite;', description: 'Normal pulsing glow' },
        { id: 'anim-pulse-glow-fast', name: 'Pulse Glow (Fast)', css: 'animation: pulse-glow 1s ease-in-out infinite;', description: 'Fast pulsing glow' },
        { id: 'anim-breathing-slow', name: 'Breathing (Slow)', css: 'animation: breathing 5s ease-in-out infinite;', description: 'Slow breathing scale' },
        { id: 'anim-breathing', name: 'Breathing (Normal)', css: 'animation: breathing 3s ease-in-out infinite;', description: 'Normal breathing scale' },
        { id: 'anim-breathing-fast', name: 'Breathing (Fast)', css: 'animation: breathing 1.5s ease-in-out infinite;', description: 'Fast breathing scale' },
        { id: 'anim-border-flow', name: 'Border Flow', css: 'animation: border-flow 3s linear infinite;', description: 'Flowing border color' },
        { id: 'anim-shimmer-slow', name: 'Shimmer (Slow)', css: 'background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 4s infinite;', description: 'Slow shimmer' },
        { id: 'anim-shimmer', name: 'Shimmer (Normal)', css: 'background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2s infinite;', description: 'Normal shimmer' },
        { id: 'anim-shimmer-fast', name: 'Shimmer (Fast)', css: 'background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 1s infinite;', description: 'Fast shimmer' },
      ],
    },
    {
      id: 'motion',
      label: 'Motion',
      icon: '🌊',
      effects: [
        { id: 'anim-float-slow', name: 'Float (Slow)', css: 'animation: float 5s ease-in-out infinite;', description: 'Slow floating motion' },
        { id: 'anim-float', name: 'Float (Normal)', css: 'animation: float 3s ease-in-out infinite;', description: 'Normal floating motion' },
        { id: 'anim-float-fast', name: 'Float (Fast)', css: 'animation: float 1.5s ease-in-out infinite;', description: 'Fast floating motion' },
        { id: 'anim-rotate-very-slow', name: 'Rotate (Very Slow)', css: 'animation: rotate-slow 40s linear infinite;', description: 'Very slow rotation' },
        { id: 'anim-rotate-slow', name: 'Rotate (Slow)', css: 'animation: rotate-slow 20s linear infinite;', description: 'Slow rotation' },
        { id: 'anim-rotate-normal', name: 'Rotate (Normal)', css: 'animation: rotate-slow 10s linear infinite;', description: 'Normal rotation' },
        { id: 'anim-rotate-fast', name: 'Rotate (Fast)', css: 'animation: rotate-slow 5s linear infinite;', description: 'Fast rotation' },
        { id: 'anim-bob-slow', name: 'Bob (Slow)', css: 'animation: bob 4s ease-in-out infinite;', description: 'Slow bobbing' },
        { id: 'anim-bob', name: 'Bob (Normal)', css: 'animation: bob 2s ease-in-out infinite;', description: 'Normal bobbing' },
        { id: 'anim-bob-fast', name: 'Bob (Fast)', css: 'animation: bob 1s ease-in-out infinite;', description: 'Fast bobbing' },
        { id: 'anim-sway-slow', name: 'Sway (Slow)', css: 'animation: sway 6s ease-in-out infinite;', description: 'Slow swaying' },
        { id: 'anim-sway', name: 'Sway (Normal)', css: 'animation: sway 4s ease-in-out infinite;', description: 'Normal swaying' },
        { id: 'anim-sway-fast', name: 'Sway (Fast)', css: 'animation: sway 2s ease-in-out infinite;', description: 'Fast swaying' },
      ],
    },
    {
      id: 'glitch',
      label: 'Glitch/Cyber',
      icon: '⚡',
      effects: [
        { id: 'anim-glitch-slow', name: 'Glitch (Slow)', css: 'animation: glitch 0.5s infinite;', description: 'Slow glitch effect' },
        { id: 'anim-glitch', name: 'Glitch (Normal)', css: 'animation: glitch 0.3s infinite;', description: 'Normal glitch effect' },
        { id: 'anim-glitch-fast', name: 'Glitch (Fast)', css: 'animation: glitch 0.15s infinite;', description: 'Fast glitch effect' },
        { id: 'anim-crt-flicker-slow', name: 'CRT Flicker (Slow)', css: 'animation: crt-flicker 0.3s infinite;', description: 'Slow CRT flicker' },
        { id: 'anim-crt-flicker', name: 'CRT Flicker (Normal)', css: 'animation: crt-flicker 0.15s infinite;', description: 'Normal CRT flicker' },
        { id: 'anim-crt-flicker-fast', name: 'CRT Flicker (Fast)', css: 'animation: crt-flicker 0.08s infinite;', description: 'Fast CRT flicker' },
        { id: 'anim-vhs-tracking', name: 'VHS Tracking', css: 'animation: vhs-tracking 0.5s infinite;', description: 'VHS tracking error' },
        { id: 'anim-scan-slow', name: 'Scan Line (Slow)', css: 'animation: scan-line 6s linear infinite;', description: 'Slow scan line' },
        { id: 'anim-scan', name: 'Scan Line (Normal)', css: 'animation: scan-line 4s linear infinite;', description: 'Normal scan line' },
        { id: 'anim-scan-fast', name: 'Scan Line (Fast)', css: 'animation: scan-line 2s linear infinite;', description: 'Fast scan line' },
      ],
    },
    {
      id: 'special',
      label: 'Particle Effects',
      icon: '🎇',
      effects: [
        { id: 'anim-matrix-rain-slow', name: 'Matrix Rain (Slow)', css: 'matrix-rain: true; matrix-rain-speed: slow;', description: 'Slow matrix rain' },
        { id: 'anim-matrix-rain', name: 'Matrix Rain (Normal)', css: 'matrix-rain: true; matrix-rain-speed: normal;', description: 'Normal matrix rain' },
        { id: 'anim-matrix-rain-fast', name: 'Matrix Rain (Fast)', css: 'matrix-rain: true; matrix-rain-speed: fast;', description: 'Fast matrix rain' },
        { id: 'anim-matrix-rain-veryfast', name: 'Matrix Rain (Very Fast)', css: 'matrix-rain: true; matrix-rain-speed: veryfast;', description: 'Very fast matrix rain' },
        { id: 'anim-snowfall', name: 'Snowfall', css: 'snowfall: true;', description: 'Falling snow' },
        { id: 'anim-sparkle', name: 'Sparkle', css: 'sparkle: true;', description: 'Sparkling particles' },
        { id: 'anim-fireflies', name: 'Fireflies', css: 'embers: true;', description: 'Floating fireflies' },
        { id: 'anim-bubbles', name: 'Bubbles', css: 'bubbles: true;', description: 'Rising bubbles' },
      ],
    },
  ],
};

// PATTERN/OVERLAY EFFECTS
const PATTERN_EFFECTS: PropertyType = {
  id: 'pattern',
  label: 'Pattern/Overlay',
  icon: '🔳',
  description: 'Patterns and overlay effects',
  categories: [
    {
      id: 'scanlines',
      label: 'Scanlines',
      icon: '📺',
      effects: [
        { id: 'pattern-scanlines', name: 'Scanlines', css: 'background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px);', description: 'CRT scanlines' },
        { id: 'pattern-scanlines-dense', name: 'Dense Scanlines', css: 'background-image: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px);', description: 'Dense scanlines' },
        { id: 'pattern-horizontal', name: 'Horizontal Lines', css: 'background-image: repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 5px);', description: 'Horizontal lines' },
        { id: 'pattern-vertical', name: 'Vertical Lines', css: 'background-image: repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 5px);', description: 'Vertical lines' },
      ],
    },
    {
      id: 'grid',
      label: 'Grid',
      icon: '🔲',
      effects: [
        { id: 'pattern-grid', name: 'Grid', css: 'background-image: linear-gradient(rgba(0,255,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.1) 1px, transparent 1px); background-size: 20px 20px;', description: 'Grid pattern' },
        { id: 'pattern-dots', name: 'Dots', css: 'background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 10px 10px;', description: 'Dot pattern' },
        { id: 'pattern-cyber-grid', name: 'Cyber Grid', css: 'background-image: linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px;', description: 'Large cyber grid' },
        { id: 'pattern-hex', name: 'Hex Pattern', css: 'background-image: repeating-linear-gradient(60deg, rgba(0,255,0,0.05), rgba(0,255,0,0.05) 1px, transparent 1px, transparent 30px);', description: 'Hexagonal pattern' },
      ],
    },
    {
      id: 'noise',
      label: 'Noise/Texture',
      icon: '🌫️',
      effects: [
        { id: 'pattern-noise-subtle', name: 'Subtle Noise', css: 'background-image: url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E");', description: 'Subtle noise texture' },
        { id: 'pattern-vignette', name: 'Vignette', css: 'box-shadow: inset 0 0 100px rgba(0,0,0,0.5);', description: 'Dark vignette edges' },
        { id: 'pattern-grain', name: 'Film Grain', css: 'background-image: url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.1\'/%3E%3C/svg%3E");', description: 'Film grain texture' },
        { id: 'pattern-static', name: 'Static', css: 'animation: static-noise 0.5s steps(10) infinite;', description: 'TV static noise' },
      ],
    },
  ],
};

// ============================================
// AGGREGATED COLLECTION
// ============================================

/** All property types containing every CSS effect definition */
export const ALL_PROPERTY_TYPES: PropertyType[] = [
  BACKGROUND_EFFECTS,
  BORDER_EFFECTS,
  SHADOW_EFFECTS,
  TEXT_EFFECTS,
  SHAPE_EFFECTS,
  ANIMATION_EFFECTS,
  PATTERN_EFFECTS,
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/** Parse a CSS string into a record of property-value pairs */
export function parseCSSString(css: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!css) return result;

  // Split by semicolon, handling potential whitespace
  const declarations = css.split(';').filter(d => d.trim());

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex > 0) {
      const property = decl.substring(0, colonIndex).trim();
      const value = decl.substring(colonIndex + 1).trim();
      if (property && value) {
        result[property] = value;
      }
    }
  }

  return result;
}

/** Merge CSS strings, combining properties intelligently (new overwrites existing for same property) */
export function mergeCSSStrings(existing: string, newCSS: string): string {
  const existingProps = parseCSSString(existing);
  const newProps = parseCSSString(newCSS);

  // Check for special flags (not real CSS properties)
  const specialFlags = ['matrix-rain', 'snowfall', 'sparkle', 'embers', 'bubbles'];
  const specialProps = ['matrix-rain-speed']; // Properties that accompany flags
  const existingFlags: string[] = [];
  const newFlags: string[] = [];
  const existingSpecialProps: Record<string, string> = {};
  const newSpecialProps: Record<string, string> = {};

  // Extract special flags and props from existing
  for (const flag of specialFlags) {
    const regex = new RegExp(`${flag}:\\s*true`, 'i');
    if (existing.match(regex)) {
      existingFlags.push(`${flag}: true`);
    }
  }
  for (const prop of specialProps) {
    const regex = new RegExp(`${prop}:\\s*(\\w+)`, 'i');
    const match = existing.match(regex);
    if (match) {
      existingSpecialProps[prop] = match[1];
    }
  }

  // Extract special flags and props from new
  for (const flag of specialFlags) {
    const regex = new RegExp(`${flag}:\\s*true`, 'i');
    if (newCSS.match(regex)) {
      newFlags.push(`${flag}: true`);
    }
  }
  for (const prop of specialProps) {
    const regex = new RegExp(`${prop}:\\s*(\\w+)`, 'i');
    const match = newCSS.match(regex);
    if (match) {
      newSpecialProps[prop] = match[1];
    }
  }

  // Merge properties (new overwrites existing for same property)
  const merged = { ...existingProps, ...newProps };

  // Build final CSS string
  let result = Object.entries(merged)
    .map(([prop, val]) => `${prop}: ${val}`)
    .join('; ');

  // Add special flags (new flags replace old ones of same type)
  const allFlags = [...new Set([...existingFlags, ...newFlags])];
  if (allFlags.length > 0) {
    if (result) result += '; ';
    result += allFlags.join('; ');
  }

  // Add special props (new props override existing)
  const mergedSpecialProps = { ...existingSpecialProps, ...newSpecialProps };
  for (const [prop, val] of Object.entries(mergedSpecialProps)) {
    if (result) result += '; ';
    result += `${prop}: ${val}`;
  }

  return result ? result + ';' : '';
}

/** Remove an effect's CSS properties from a CSS string */
export function removeEffectFromCSS(css: string, effectCSS: string): string {
  const existingProps = parseCSSString(css);
  const effectProps = parseCSSString(effectCSS);

  // Remove matching properties
  for (const prop of Object.keys(effectProps)) {
    delete existingProps[prop];
  }

  // Handle special flags and props
  const specialFlags = ['matrix-rain', 'snowfall', 'sparkle', 'embers', 'bubbles'];
  const specialProps = ['matrix-rain-speed'];

  let result = Object.entries(existingProps)
    .map(([prop, val]) => `${prop}: ${val}`)
    .join('; ');

  // Keep flags that aren't in the effect being removed
  for (const flag of specialFlags) {
    const inExisting = css.includes(`${flag}: true`) || css.includes(`${flag}:true`);
    const inEffect = effectCSS.includes(`${flag}: true`) || effectCSS.includes(`${flag}:true`);
    if (inExisting && !inEffect) {
      if (result) result += '; ';
      result += `${flag}: true`;
    }
  }

  // Keep special props only if their parent flag is still present
  for (const prop of specialProps) {
    const propRegex = new RegExp(`${prop}:\\s*(\\w+)`, 'i');
    const existingMatch = css.match(propRegex);
    const effectMatch = effectCSS.match(propRegex);

    // If the effect being removed has this prop, don't keep it
    if (effectMatch) continue;

    // If existing has it and parent flag is still there, keep it
    if (existingMatch) {
      // Check if parent flag (matrix-rain) is still in result
      const parentFlag = prop.replace('-speed', '');
      if (result.includes(`${parentFlag}: true`)) {
        if (result) result += '; ';
        result += `${prop}: ${existingMatch[1]}`;
      }
    }
  }

  return result ? result + ';' : '';
}

/** Check if an effect is active in the current CSS string */
export function isEffectActive(css: string, effectCSS: string): boolean {
  if (!css) return false;

  const existingProps = parseCSSString(css);
  const effectProps = parseCSSString(effectCSS);

  // Check special flags first
  const specialFlags = ['matrix-rain', 'snowfall', 'sparkle', 'embers', 'bubbles'];
  const specialProps = ['matrix-rain-speed'];

  // For effects with special flags
  for (const flag of specialFlags) {
    const effectHasFlag = effectCSS.includes(`${flag}: true`) || effectCSS.includes(`${flag}:true`);
    if (effectHasFlag) {
      const cssHasFlag = css.includes(`${flag}: true`) || css.includes(`${flag}:true`);
      if (!cssHasFlag) return false;

      // Also check special props like matrix-rain-speed
      for (const prop of specialProps) {
        if (prop.startsWith(flag)) {
          const effectSpeedMatch = effectCSS.match(new RegExp(`${prop}:\\s*(\\w+)`, 'i'));
          const cssSpeedMatch = css.match(new RegExp(`${prop}:\\s*(\\w+)`, 'i'));

          if (effectSpeedMatch) {
            // Effect specifies a speed, check if CSS has same speed
            if (!cssSpeedMatch || cssSpeedMatch[1] !== effectSpeedMatch[1]) {
              return false;
            }
          }
        }
      }
      return true;
    }
  }

  // Check if all effect properties are present in existing CSS
  for (const [prop, val] of Object.entries(effectProps)) {
    if (!existingProps[prop] || existingProps[prop] !== val) {
      return false;
    }
  }

  return Object.keys(effectProps).length > 0;
}
