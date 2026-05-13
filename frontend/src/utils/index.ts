// Utility helpers
import type { ProjectStatus } from '@/models';

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    default: return 'Unknown';
  }
}

export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}
