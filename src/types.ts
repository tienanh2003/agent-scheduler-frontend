/**
 * Frontend Type Definitions
 * Đồng bộ với backend/app/models/task.py và app/schemas/task/response.py
 */

// Re-export constants for type definitions
export {
  COLUMNS,
  LABELS,
  TASK_STATUS,
  PRIORITY,
  STAGE_STATUS,
  ACTIVITY_TYPE,
  FILE_CHANGE_TYPE,
} from '@/constants';

// Import types from constants
import type {
  ColumnId,
  LabelId,
  TaskStatusId,
  PriorityId,
  StageStatusId,
  ActivityTypeId,
  FileChangeTypeId,
} from '@/constants';

// Column types
export type Column = ColumnId;

// Task status
export type TaskStatus = TaskStatusId;

// Priority levels
export type Priority = PriorityId;

// Label/Stage types (execution stages)
export type Label = LabelId;

// Label values array - re-exported from constants
export { LABEL_VALUES } from '@/constants';

// Stage output status
export type StageOutputStatus = StageStatusId;

// Activity entry
export interface ActivityEntry {
  id: string;
  call_id?: string;
  task_id: string;
  activity_type: ActivityTypeId;
  content?: string;
  tool_name?: string;
  tool_input?: string;
  tool_output?: string;
  file_path?: string;
  change_type?: FileChangeTypeId;
  created_at: string;
}

// Main Task interface
export interface Task {
  // Primary key
  id: string;

  // Basic info
  title: string;
  description?: string;

  // Execution stages
  labels: Label[];
  currentLabelIndex: number;
  completedLabels: string[];

  // Review
  reviewEnabled: boolean;

  // Scheduling
  scheduledAt?: string;
  autoStart: boolean;

  // Kanban state
  column: Column;
  position?: number;
  status: TaskStatus;

  // Hierarchy
  parentTaskId?: string;
  childTasks: string[];

  // Outputs
  outputs: Record<string, StageOutput>;
  currentAgent?: string;
  error?: string;
  errorDetails?: {
    stage?: string;
    message?: string;
    stack?: string;
    suggestedFix?: string;
  };

  // Retry
  retryCount: number;
  maxRetries: number;

  // Progress (0-100)
  progress: number;

  // Metadata
  priority: Priority;
  tags: string[];
  assignedTo?: string;

  // Claude Code session
  sessionId?: string;

  // Timestamps
  createdAt: string;
  updatedAt?: string;
  startedAt?: string;
  completedAt?: string;
}

// API Request types (camelCase -> backend sẽ chuyển thành snake_case)
export interface CreateTaskRequest {
  title: string;
  description?: string;
  labels: Label[];
  scheduledAt?: string;
  autoStart?: boolean;
  reviewEnabled?: boolean;
  parentTaskId?: string;
  priority?: Priority;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  labels?: Label[];
  reviewEnabled?: boolean;
  scheduledAt?: string;
  autoStart?: boolean;
  column?: Column;
  position?: number;
  priority?: Priority;
  tags?: string[];
  assignedTo?: string;
}

export interface MoveTaskRequest {
  column: Column;
  position?: number;
}

// Stage output from agent execution
export interface StageOutput {
  label: string;
  agent: string;
  status: StageOutputStatus;
  output: string;
  summary?: string;
  files_created: string[];
  files_modified: string[];
  files_deleted: string[];
  tools_used: string[];
  sub_agents_spawned: string[];
  tokens_used?: number;
  duration?: number;
  started_at?: string;
  completed_at?: string;
  model?: string;
  error?: string;
}

// WebSocket event payloads
export interface TaskCreatedEvent {
  task: Task;
}

export interface TaskMovedEvent {
  task_id: string;
  from_column: Column;
  to_column: Column;
}

export interface TaskStageEvent {
  task_id: string;
  stage: string;
  agent?: string;
  output?: StageOutput;
}

export interface TaskProgressEvent {
  task_id: string;
  progress: number;
  current_stage?: string;
}

export interface TaskReviewEvent {
  task_id: string;
  decision?: 'approved' | 'rejected' | 'changes_requested';
  comment?: string;
}
