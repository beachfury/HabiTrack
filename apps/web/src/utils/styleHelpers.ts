// apps/web/src/utils/styleHelpers.ts
// Centralized style helper functions to avoid duplication

export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Returns CSS-variable-based styles for difficulty badges.
 * Uses color-mix for semi-transparent backgrounds that work in both light/dark modes.
 */
export const getDifficultyStyle = (difficulty: Difficulty | string) => {
  switch (difficulty) {
    case 'easy':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
        color: 'var(--color-success)',
      };
    case 'hard':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
        color: 'var(--color-destructive)',
      };
    default: // medium
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
        color: 'var(--color-warning)',
      };
  }
};

/**
 * Returns human-readable difficulty label
 */
export const getDifficultyLabel = (difficulty: Difficulty | string): string => {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'hard':
      return 'Hard';
    default:
      return 'Medium';
  }
};

/**
 * Status badge styles using CSS variables
 */
export type Status = 'pending' | 'completed' | 'approved' | 'rejected' | 'skipped';

export const getStatusStyle = (status: Status | string) => {
  switch (status) {
    case 'completed':
    case 'approved':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
        color: 'var(--color-success)',
      };
    case 'rejected':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
        color: 'var(--color-destructive)',
      };
    case 'skipped':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-muted) 30%, transparent)',
        color: 'var(--color-muted-foreground)',
      };
    default: // pending
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
        color: 'var(--color-warning)',
      };
  }
};

/**
 * Priority badge styles
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export const getPriorityStyle = (priority: Priority | string) => {
  switch (priority) {
    case 'low':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-muted) 30%, transparent)',
        color: 'var(--color-muted-foreground)',
      };
    case 'high':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
        color: 'var(--color-warning)',
      };
    case 'urgent':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
        color: 'var(--color-destructive)',
      };
    default: // medium
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
        color: 'var(--color-primary)',
      };
  }
};
