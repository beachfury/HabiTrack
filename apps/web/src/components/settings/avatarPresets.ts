// apps/web/src/components/settings/avatarPresets.ts
import {
  User,
  Heart,
  Star,
  Gamepad2,
  Music,
  Palette,
  Camera,
  Rocket,
  Flame,
  Zap,
  Crown,
  Gem,
  Shield,
  Swords,
  TreePine,
  Sun,
  Moon,
  Cloud,
  Anchor,
  Compass,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// --- Emoji Avatars ---
export const EMOJI_AVATARS: string[] = [
  // Faces
  '😀', '😎', '🤩', '😊', '🥳', '😇', '🤗', '🤠',
  '🧐', '😏', '🤓', '😺',
  // Animals
  '🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁',
  '🐸', '🐵', '🦄', '🐲', '🦋', '🐙', '🦈', '🐢',
  '🦉', '🐧', '🐬', '🦜',
  // Nature & Objects
  '🌸', '🌻', '🌈', '🔥', '⭐', '🌙', '❄️', '🍀',
  '🎮', '🎨', '🎸', '🎯', '🏆', '💎', '🚀', '⚡',
  '🎭', '🎪', '🧩', '🛸',
  // Food
  '🍕', '🍩', '🧁', '🍓', '🥑', '🌮', '🍦', '☕',
];

// --- Icon Avatars ---
export interface IconAvatar {
  name: string;
  icon: LucideIcon;
  defaultColor: string;
}

export const ICON_AVATARS: IconAvatar[] = [
  { name: 'Person', icon: User, defaultColor: '#3b82f6' },
  { name: 'Heart', icon: Heart, defaultColor: '#ef4444' },
  { name: 'Star', icon: Star, defaultColor: '#eab308' },
  { name: 'Gaming', icon: Gamepad2, defaultColor: '#8b5cf6' },
  { name: 'Music', icon: Music, defaultColor: '#ec4899' },
  { name: 'Art', icon: Palette, defaultColor: '#f97316' },
  { name: 'Camera', icon: Camera, defaultColor: '#6366f1' },
  { name: 'Rocket', icon: Rocket, defaultColor: '#14b8a6' },
  { name: 'Fire', icon: Flame, defaultColor: '#ef4444' },
  { name: 'Lightning', icon: Zap, defaultColor: '#eab308' },
  { name: 'Crown', icon: Crown, defaultColor: '#f59e0b' },
  { name: 'Gem', icon: Gem, defaultColor: '#8b5cf6' },
  { name: 'Shield', icon: Shield, defaultColor: '#3b82f6' },
  { name: 'Swords', icon: Swords, defaultColor: '#64748b' },
  { name: 'Tree', icon: TreePine, defaultColor: '#22c55e' },
  { name: 'Sun', icon: Sun, defaultColor: '#f59e0b' },
  { name: 'Moon', icon: Moon, defaultColor: '#6366f1' },
  { name: 'Cloud', icon: Cloud, defaultColor: '#06b6d4' },
  { name: 'Anchor', icon: Anchor, defaultColor: '#0ea5e9' },
  { name: 'Compass', icon: Compass, defaultColor: '#14b8a6' },
];

// --- Illustration Avatars ---
export interface IllustrationAvatar {
  name: string;
  src: string;
}

export const ILLUSTRATION_AVATARS: IllustrationAvatar[] = [
  { name: 'Robot', src: '/avatars/robot.svg' },
  { name: 'Astronaut', src: '/avatars/astronaut.svg' },
  { name: 'Ninja', src: '/avatars/ninja.svg' },
  { name: 'Wizard', src: '/avatars/wizard.svg' },
  { name: 'Pirate', src: '/avatars/pirate.svg' },
  { name: 'Chef', src: '/avatars/chef.svg' },
  { name: 'Cat', src: '/avatars/cat.svg' },
  { name: 'Dog', src: '/avatars/dog.svg' },
  { name: 'Fox', src: '/avatars/fox.svg' },
  { name: 'Owl', src: '/avatars/owl.svg' },
  { name: 'Bear', src: '/avatars/bear.svg' },
  { name: 'Panda', src: '/avatars/panda.svg' },
  { name: 'Alien', src: '/avatars/alien.svg' },
  { name: 'Ghost', src: '/avatars/ghost.svg' },
  { name: 'Dragon', src: '/avatars/dragon.svg' },
  { name: 'Unicorn', src: '/avatars/unicorn.svg' },
  { name: 'Superhero', src: '/avatars/superhero.svg' },
  { name: 'Scientist', src: '/avatars/scientist.svg' },
  { name: 'Artist', src: '/avatars/artist.svg' },
  { name: 'Gamer', src: '/avatars/gamer.svg' },
  { name: 'Flower', src: '/avatars/flower.svg' },
  { name: 'Star', src: '/avatars/star.svg' },
  { name: 'Mountain', src: '/avatars/mountain.svg' },
  { name: 'Ocean', src: '/avatars/ocean.svg' },
];

// Background colors for icons (user can pick)
export const ICON_BG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
];
