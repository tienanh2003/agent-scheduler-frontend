/**
 * Constants & Enums - Tập trung tất cả hardcoded strings
 * Giúp dễ dàng sửa đổi và rà soát source code
 */

// ============================================
// COLUMNS (Kanban Board)
// ============================================
export const COLUMNS = {
  TODO: 'todo',
  DOING: 'doing',
  REVIEW: 'review',
  DONE: 'done',
  ERROR: 'error',
} as const;

export type ColumnId = typeof COLUMNS[keyof typeof COLUMNS];

export const COLUMN_CONFIG = {
  [COLUMNS.TODO]: {
    id: COLUMNS.TODO,
    title: 'Todo',
    color: '#3B82F6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
    chipClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  [COLUMNS.DOING]: {
    id: COLUMNS.DOING,
    title: 'Doing',
    color: '#EAB308',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500',
    chipClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  [COLUMNS.REVIEW]: {
    id: COLUMNS.REVIEW,
    title: 'Review',
    color: '#A855F7',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500',
    chipClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  [COLUMNS.DONE]: {
    id: COLUMNS.DONE,
    title: 'Done',
    color: '#22C55E',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
    chipClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  [COLUMNS.ERROR]: {
    id: COLUMNS.ERROR,
    title: 'Error',
    color: '#EF4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500',
    chipClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
} as const;

// ============================================
// LABELS / STAGES (Agent Execution Pipeline)
// ============================================
export const LABELS = {
  BRAINSTORM: 'brainstorm',
  RESEARCH: 'research',
  PLAN: 'plan',
  REVIEW_PLAN: 'review-plan',
  IMPLEMENT: 'implement',
  TEST: 'test',
  CODE_REVIEW: 'code-review',
} as const;

export type LabelId = typeof LABELS[keyof typeof LABELS];

export const LABEL_VALUES: LabelId[] = [
  LABELS.BRAINSTORM,
  LABELS.RESEARCH,
  LABELS.PLAN,
  LABELS.REVIEW_PLAN,
  LABELS.IMPLEMENT,
  LABELS.TEST,
  LABELS.CODE_REVIEW,
];

export const LABEL_CONFIG = {
  [LABELS.BRAINSTORM]: { label: 'Brainstorm', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  [LABELS.RESEARCH]: { label: 'Research', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  [LABELS.PLAN]: { label: 'Plan', color: 'bg-green-100 text-green-700 border-green-200' },
  [LABELS.REVIEW_PLAN]: { label: 'Review Plan', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  [LABELS.IMPLEMENT]: { label: 'Implement', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  [LABELS.TEST]: { label: 'Test', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  [LABELS.CODE_REVIEW]: { label: 'Code Review', color: 'bg-red-100 text-red-700 border-red-200' },
} as const;

// ============================================
// TASK STATUS
// ============================================
export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  PAUSED: 'paused',
  REVIEWING: 'reviewing',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

export type TaskStatusId = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// ============================================
// PRIORITY
// ============================================
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type PriorityId = typeof PRIORITY[keyof typeof PRIORITY];

export const PRIORITY_CONFIG = {
  [PRIORITY.LOW]: { label: 'Low', color: 'text-gray-500' },
  [PRIORITY.MEDIUM]: { label: 'Medium', color: 'text-blue-500' },
  [PRIORITY.HIGH]: { label: 'High', color: 'text-orange-500' },
  [PRIORITY.URGENT]: { label: 'Urgent', color: 'text-red-500' },
} as const;

// ============================================
// PERMISSION PROFILES
// ============================================
export const PERMISSION_PROFILE = {
  SAFE: 'safe',
  CODE: 'code',
  FULL: 'full',
} as const;

export type PermissionProfileId = typeof PERMISSION_PROFILE[keyof typeof PERMISSION_PROFILE];

export const PERMISSION_PROFILE_CONFIG = {
  [PERMISSION_PROFILE.SAFE]: {
    id: PERMISSION_PROFILE.SAFE,
    label: 'Safe',
    description: 'Read/Search',
  },
  [PERMISSION_PROFILE.CODE]: {
    id: PERMISSION_PROFILE.CODE,
    label: 'Code',
    description: 'Read/Edit/Test',
  },
  [PERMISSION_PROFILE.FULL]: {
    id: PERMISSION_PROFILE.FULL,
    label: 'Full',
    description: 'All tools',
  },
} as const;

// ============================================
// STAGE OUTPUT STATUS
// ============================================
export const STAGE_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

export type StageStatusId = typeof STAGE_STATUS[keyof typeof STAGE_STATUS];

// ============================================
// ACTIVITY TYPES
// ============================================
export const ACTIVITY_TYPE = {
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',
  THOUGHT: 'thought',
  FILE_CHANGE: 'file_change',
  AGENT_SPAWN: 'agent_spawn',
  ERROR: 'error',
  MESSAGE: 'message',
} as const;

export type ActivityTypeId = typeof ACTIVITY_TYPE[keyof typeof ACTIVITY_TYPE];

// ============================================
// FILE CHANGE TYPES
// ============================================
export const FILE_CHANGE_TYPE = {
  CREATED: 'created',
  MODIFIED: 'modified',
  DELETED: 'deleted',
} as const;

export type FileChangeTypeId = typeof FILE_CHANGE_TYPE[keyof typeof FILE_CHANGE_TYPE];

// ============================================
// REVIEW DECISIONS
// ============================================
export const REVIEW_DECISION = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHANGES_REQUESTED: 'changes_requested',
} as const;

export type ReviewDecisionId = typeof REVIEW_DECISION[keyof typeof REVIEW_DECISION];

// ============================================
// API ENDPOINTS
// ============================================
export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  PREFIX: '/api/v1',

  // Tasks
  TASKS: '/api/v1/tasks',
  TASK_BY_ID: (id: string) => `/api/v1/tasks/${id}`,
  TASK_START: (id: string) => `/api/v1/tasks/${id}/start`,
  TASK_PAUSE: (id: string) => `/api/v1/tasks/${id}/pause`,
  TASK_RESUME: (id: string) => `/api/v1/tasks/${id}/resume`,
  TASK_RETRY: (id: string) => `/api/v1/tasks/${id}/retry`,
  TASK_MOVE: (id: string) => `/api/v1/tasks/${id}/move`,
  TASK_APPROVE: (id: string) => `/api/v1/tasks/${id}/approve`,
  TASK_REJECT: (id: string) => `/api/v1/tasks/${id}/reject`,
  TASK_REQUEST_CHANGES: (id: string) => `/api/v1/tasks/${id}/request-changes`,
  TASK_SCHEDULE: (id: string) => `/api/v1/tasks/${id}/schedule`,
  TASK_ACTIVITIES: (id: string) => `/api/v1/tasks/${id}/activities`,
  TASK_REVIEW_DECISIONS: (id: string) => `/api/v1/tasks/${id}/review-decisions`,

  // Database
  DB_CLEAR: '/api/v1/db/clear',
  DB_STATS: '/api/v1/db/stats',

  // Claude CLI
  CLAUDE_STATUS: '/api/v1/claude/status',

  // Health
  HEALTH: '/api/v1/health',
} as const;

// ============================================
// WEBSOCKET EVENTS
// ============================================
export const WS_EVENTS = {
  // Task lifecycle
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_MOVED: 'task:moved',
  TASK_DELETED: 'task:deleted',

  // Task actions
  TASK_STARTED: 'task:started',
  TASK_PAUSED: 'task:paused',
  TASK_RESUMED: 'task:resumed',
  TASK_PROGRESS: 'task:progress',

  // Stage events
  TASK_STAGE_START: 'task:stage-start',
  TASK_STAGE_COMPLETE: 'task:stage-complete',

  // Review events
  TASK_REVIEW_REQUESTED: 'task:review-requested',
  TASK_APPROVED: 'task:approved',
  TASK_REJECTED: 'task:rejected',
  TASK_CHANGES_REQUESTED: 'task:changes-requested',

  // Error
  TASK_ERROR: 'task:error',
} as const;

// ============================================
// UI STRINGS
// ============================================
export const UI_STRINGS = {
  // Common
  NO_TASKS: 'No tasks',
  LOADING: 'Loading...',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
  EDIT: 'Edit',
  CLOSE: 'Close',

  // Task actions
  START_TASK: 'Start Task',
  PAUSE_TASK: 'Pause Task',
  RETRY_TASK: 'Retry Task',
  APPROVE: 'Approve',
  REJECT: 'Reject',
  REQUEST_CHANGES: 'Request Changes',

  // Task details
  DESCRIPTION: 'Description',
  EXECUTION_PROGRESS: 'Execution Progress',
  SUB_TASKS: 'Sub-tasks',
  ACTIVITY_LOG: 'Activity Log',
  ERROR: 'Error',
  CREATED: 'Created',
  PRIORITY: 'Priority',
  STARTED: 'Started',
  COMPLETED: 'Completed',
  RETRIES: 'Retries',

  // Status
  RUNNING: 'Running',
  PENDING: 'Pending',
  PAUSED: 'Paused',
  COMPLETED_STATUS: 'Completed',
  ERROR_STATUS: 'Error',

  // Task builder
  CREATE_NEW_TASK: 'Create New Task',
  TASK_TITLE: 'Task Title',
  SELECT_AGENTS: 'Select Agents',
  PERMISSION_PROFILE: 'Permission Profile',
  SCHEDULE_FOR_LATER: 'Schedule for Later',
  SAVE_TO_BOARD: 'Save to Board',
  RUN_NOW: 'Run Now',
  SELECTED_AGENTS: 'Selected',

  // Validation messages
  ENTER_TASK_TITLE: 'Please enter a task title',
  SELECT_AT_LEAST_ONE_AGENT: 'Please select at least one agent',
  ENTER_REJECTION_REASON: 'Please enter rejection reason',
  ENTER_CHANGES_NEEDED: 'What changes are needed?',

  // Feedback messages
  TASK_STARTED: 'Task started',
  TASK_PAUSED: 'Task paused',
  TASK_RETRY_STARTED: 'Task retry started',
  TASK_APPROVED: 'Task approved',
  TASK_REJECTED: 'Task rejected',
  CHANGES_REQUESTED: 'Changes requested',
  FAILED_TO_START: 'Failed to start task',
  FAILED_TO_PAUSE: 'Failed to pause task',
  FAILED_TO_RETRY: 'Failed to retry task',
  FAILED_TO_APPROVE: 'Failed to approve task',
  FAILED_TO_REJECT: 'Failed to reject task',
  FAILED_TO_REQUEST_CHANGES: 'Failed to request changes',

  // Column titles
  TODO_TITLE: 'Todo',
  DOING_TITLE: 'Doing',
  REVIEW_TITLE: 'Review',
  DONE_TITLE: 'Done',
  ERROR_TITLE: 'Error',

  // Misc
  AGENTS: 'agents',
  SUBTASKS: 'subtasks',
  CREATED_FILES: 'created',
  MODIFIED_FILES: 'modified',
  TOOLS_USED: 'tools used',
  SUGGESTION: 'Suggestion',
  OUTPUT: 'Output',
  VIEW_FULL: 'View Full',
} as const;

// ============================================
// DEFAULT VALUES
// ============================================
export const DEFAULTS = {
  PRIORITY: PRIORITY.MEDIUM,
  COLUMN: COLUMNS.TODO,
  TASK_STATUS: TASK_STATUS.PENDING,
  MAX_RETRIES: 3,
  API_PAGE_SIZE: 100,
  PROGRESS: 0,
  CURRENT_LABEL_INDEX: 0,
  AUTO_START: false,
  REVIEW_ENABLED: true,
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get column config by column ID
 */
export function getColumnConfig(columnId: ColumnId) {
  return COLUMN_CONFIG[columnId] || COLUMN_CONFIG[COLUMNS.TODO];
}

/**
 * Get label config by label ID
 */
export function getLabelConfig(labelId: LabelId) {
  return LABEL_CONFIG[labelId] || { label: labelId, color: 'bg-gray-100 text-gray-700 border-gray-200' };
}

/**
 * Get priority config by priority ID
 */
export function getPriorityConfig(priorityId: PriorityId) {
  return PRIORITY_CONFIG[priorityId] || PRIORITY_CONFIG[PRIORITY.MEDIUM];
}

/**
 * Get permission profile config by ID
 */
export function getPermissionProfileConfig(profileId: PermissionProfileId) {
  return PERMISSION_PROFILE_CONFIG[profileId] || PERMISSION_PROFILE_CONFIG[PERMISSION_PROFILE.CODE];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get CSS classes for a label/stage (for UI components)
 */
export function getLabelClass(label: LabelId | string): string {
  const config = LABEL_CONFIG[label as LabelId];
  return config?.color || 'bg-gray-100 text-gray-700 border-gray-200';
}

/**
 * Get CSS classes for priority (for UI components)
 */
export function getPriorityClass(priority: PriorityId): string {
  const priorityClasses: Record<PriorityId, string> = {
    [PRIORITY.LOW]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    [PRIORITY.MEDIUM]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    [PRIORITY.HIGH]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    [PRIORITY.URGENT]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return priorityClasses[priority] || priorityClasses[PRIORITY.MEDIUM];
}

/**
 * Get CSS classes for a column chip
 */
export function getColumnChipClass(columnId: ColumnId): string {
  const config = COLUMN_CONFIG[columnId];
  return config?.chipClass || 'bg-gray-100 text-gray-700';
}

/**
 * Check if task is in executing state
 */
export function isTaskExecuting(task: { status: TaskStatusId; column: ColumnId }): boolean {
  return task.status === TASK_STATUS.RUNNING || task.column === COLUMNS.DOING;
}

/**
 * Check if task has error
 */
export function isTaskError(task: { status: TaskStatusId; column: ColumnId }): boolean {
  return task.column === COLUMNS.ERROR || task.status === TASK_STATUS.ERROR;
}

/**
 * Check if task is in review
 */
export function isTaskInReview(task: { column: ColumnId }): boolean {
  return task.column === COLUMNS.REVIEW;
}

// Export arrays for iteration
export const COLUMNS_ARRAY = Object.values(COLUMNS).map(id => COLUMN_CONFIG[id]);
export const LABELS_ARRAY = Object.values(LABELS).map(id => ({ id, ...LABEL_CONFIG[id] }));
export const PRIORITIES_ARRAY = Object.values(PRIORITY).map(id => ({ id, ...PRIORITY_CONFIG[id] }));
