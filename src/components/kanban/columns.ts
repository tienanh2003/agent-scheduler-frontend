import type { Column, ColumnConfig } from '@/types';

export const COLUMNS: ColumnConfig[] = [
  {
    id: 'todo',
    title: 'Todo',
    color: '#3B82F6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
  },
  {
    id: 'doing',
    title: 'Doing',
    color: '#EAB308',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500',
  },
  {
    id: 'review',
    title: 'Review',
    color: '#A855F7',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500',
  },
  {
    id: 'done',
    title: 'Done',
    color: '#22C55E',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
  },
  {
    id: 'error',
    title: 'Error',
    color: '#EF4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500',
  },
];

export const getColumnConfig = (columnId: Column): ColumnConfig => {
  return COLUMNS.find(c => c.id === columnId) || COLUMNS[0];
};
