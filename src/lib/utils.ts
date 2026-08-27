import type { Label, Priority } from '@/types';

// Label color classes
const LABEL_COLORS: Record<string, { bg: string; text: string }> = {
  brainstorm: { bg: 'bg-pink-100', text: 'text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  research: { bg: 'bg-blue-100', text: 'text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  plan: { bg: 'bg-amber-100', text: 'text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'review-plan': { bg: 'bg-violet-100', text: 'text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  implement: { bg: 'bg-emerald-100', text: 'text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  test: { bg: 'bg-orange-100', text: 'text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  'code-review': { bg: 'bg-red-100', text: 'text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

// Priority color classes
const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  low: { bg: 'bg-gray-200', text: 'text-gray-700 dark:bg-gray-600 dark:text-gray-300' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

/**
 * Get CSS classes for a label badge
 */
export function getLabelClass(label: string, useDarkMode = true): string {
  const colors = LABEL_COLORS[label] || { bg: 'bg-gray-100', text: 'text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
  return `${colors.bg} ${useDarkMode ? colors.text : ''}`;
}

/**
 * Get CSS classes for a priority badge
 */
export function getPriorityClass(priority: Priority): string {
  const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
  return `${colors.bg} ${colors.text}`;
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) return 'Overdue';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString();
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
