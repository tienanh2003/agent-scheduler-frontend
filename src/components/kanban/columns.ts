import type { Column } from '@/types';
import { COLUMNS, COLUMN_CONFIG, getColumnConfig } from '@/constants';

// Re-export for convenience
export { COLUMNS, getColumnConfig };

// Column configuration array for Kanban board
export const COLUMNS_ARRAY = Object.values(COLUMNS).map(id => COLUMN_CONFIG[id]);

// Helper function to get column config by ID
export const getColumnConfigById = (columnId: Column) => {
  return getColumnConfig(columnId);
};
