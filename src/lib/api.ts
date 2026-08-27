import type { Task, Column, StageOutput } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_PREFIX = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  return response.json();
}

// Transform snake_case from backend to camelCase for frontend
function transformTask(task: Record<string, unknown>): Task {
  // Parse JSON strings if needed
  const parseJson = <T>(val: unknown, fallback: T): T => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val) as T;
      } catch {
        return fallback;
      }
    }
    return (val ?? fallback) as T;
  };

  // Parse labels ensuring they are Label type
  const parseLabels = (val: unknown): Task['labels'] => {
    const arr = parseJson<string[]>(val, []);
    return arr as Task['labels'];
  };

  // Parse outputs - may be nested JSON string
  const parseOutputs = (val: unknown): Record<string, StageOutput> => {
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        // If already parsed correctly
        if (typeof parsed === 'object' && parsed !== null) {
          // Transform each output to use camelCase
          const result: Record<string, StageOutput> = {};
          for (const [key, value] of Object.entries(parsed)) {
            if (value && typeof value === 'object') {
              result[key] = {
                label: (value as Record<string, unknown>).label as string || key,
                agent: (value as Record<string, unknown>).agent as string || '',
                status: ((value as Record<string, unknown>).status as StageOutput['status']) || 'completed',
                output: (value as Record<string, unknown>).output as string || '',
                summary: (value as Record<string, unknown>).summary as string | undefined,
                files_created: parseJson<string[]>((value as Record<string, unknown>).files_created, []),
                files_modified: parseJson<string[]>((value as Record<string, unknown>).files_modified, []),
                files_deleted: parseJson<string[]>((value as Record<string, unknown>).files_deleted, []),
                tools_used: parseJson<string[]>((value as Record<string, unknown>).tools_used, []),
                sub_agents_spawned: parseJson<string[]>((value as Record<string, unknown>).sub_agents_spawned, []),
                tokens_used: (value as Record<string, unknown>).tokens_used as number | undefined,
                duration: (value as Record<string, unknown>).duration as number | undefined,
                started_at: (value as Record<string, unknown>).started_at as string | undefined,
                completed_at: (value as Record<string, unknown>).completed_at as string | undefined,
                model: (value as Record<string, unknown>).model as string | undefined,
                error: (value as Record<string, unknown>).error as string | undefined,
              };
            }
          }
          return result;
        }
        return {};
      } catch {
        return {};
      }
    }
    return (val ?? {}) as Record<string, StageOutput>;
  };

  return {
    id: task.id as string,
    title: task.title as string,
    description: task.description as string | undefined,
    labels: parseLabels(task.labels),
    currentLabelIndex: (task.current_label_index as number) || 0,
    completedLabels: parseJson<string[]>(task.completed_labels, []),
    reviewEnabled: (task.review_enabled as boolean) ?? true,
    scheduledAt: task.scheduled_at as string | undefined,
    autoStart: (task.auto_start as boolean) ?? false,
    column: (task.column as Column) || 'todo',
    status: (task.status as Task['status']) || 'pending',
    parentTaskId: task.parent_task_id as string | undefined,
    childTasks: parseJson<string[]>(task.child_tasks, []),
    outputs: parseOutputs(task.outputs),
    currentAgent: task.current_agent as string | undefined,
    error: task.error as string | undefined,
    errorDetails: parseJson<Task['errorDetails']>(task.error_details, undefined),
    retryCount: (task.retry_count as number) || 0,
    maxRetries: (task.max_retries as number) || 3,
    progress: (task.progress as number) || 0,
    priority: (task.priority as Task['priority']) || 'medium',
    tags: parseJson<string[]>(task.tags, []),
    assignedTo: task.assigned_to as string | undefined,
    createdAt: task.created_at as string,
    updatedAt: task.updated_at as string | undefined,
    startedAt: task.started_at as string | undefined,
    completedAt: task.completed_at as string | undefined,
  };
}

// Transform camelCase to snake_case for backend requests
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        result[snakeKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        result[snakeKey] = toSnakeCase(value as Record<string, unknown>);
      } else {
        result[snakeKey] = value;
      }
    }
  }
  return result;
}

// Task API
export const taskApi = {
  list: (params?: {
    column?: string;
    status?: string;
    parentTaskId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Task[]; total: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.column) searchParams.set('column', params.column);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.parentTaskId) searchParams.set('parent_task_id', params.parentTaskId);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const endpoint = query ? `${API_PREFIX}/tasks?${query}` : `${API_PREFIX}/tasks`;
    return request<{ tasks: Record<string, unknown>[]; total: number }>(endpoint)
      .then(r => ({
        items: r.tasks.map(transformTask),
        total: r.total
      }));
  },

  get: (taskId: string): Promise<Task> => {
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}`)
      .then(r => transformTask(r));
  },

  create: (data: {
    title: string;
    description?: string;
    labels: string[];
    scheduledAt?: string;
    autoStart?: boolean;
    reviewEnabled?: boolean;
    parentTaskId?: string;
    priority?: string;
    tags?: string[];
  }): Promise<Task> => {
    const payload = {
      ...toSnakeCase(data),
      // Map priority to enum value
      priority: data.priority || 'medium',
    };
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(r => transformTask(r));
  },

  update: (taskId: string, data: Partial<Task>): Promise<Task> => {
    const payload = toSnakeCase(data as Record<string, unknown>);
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then(r => transformTask(r));
  },

  delete: (taskId: string, cascade: boolean = true): Promise<void> => {
    return request<{ success: boolean }>(`${API_PREFIX}/tasks/${taskId}?cascade=${cascade}`, {
      method: 'DELETE',
    }).then(() => undefined);
  },

  start: (taskId: string): Promise<Task> => {
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}/start`, {
      method: 'POST',
    }).then(r => transformTask(r));
  },

  pause: (taskId: string): Promise<Task> => {
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}/pause`, {
      method: 'POST',
    }).then(r => transformTask(r));
  },

  resume: (taskId: string): Promise<Task> => {
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}/resume`, {
      method: 'POST',
    }).then(r => transformTask(r));
  },

  retry: (taskId: string, fromStage?: string): Promise<Task> => {
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}/retry`, {
      method: 'POST',
      body: JSON.stringify({ from_stage: fromStage }),
    }).then(r => transformTask(r));
  },

  move: (taskId: string, column: Column, position?: number): Promise<Task> => {
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}/move`, {
      method: 'POST',
      body: JSON.stringify({ column: column, position }),
    }).then(r => transformTask(r));
  },

  approve: (taskId: string, comment?: string): Promise<Task> => {
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }).then(r => transformTask(r));
  },

  reject: (taskId: string, reason: string): Promise<Task> => {
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }).then(r => transformTask(r));
  },

  requestChanges: (taskId: string, changes: string, priority?: string): Promise<Task> => {
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}/request-changes`, {
      method: 'POST',
      body: JSON.stringify({
        changes,
        priority: priority || undefined
      }),
    }).then(r => transformTask(r));
  },

  schedule: (taskId: string, scheduledAt: string, autoStart: boolean): Promise<Task> => {
    return request<Record<string, unknown>>(`${API_PREFIX}/tasks/${taskId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduled_at: scheduledAt, auto_start: autoStart }),
    }).then(r => transformTask(r));
  },

  getActivities: (taskId: string, limit?: number): Promise<unknown[]> => {
    return request<{ activities: unknown[] }>(`${API_PREFIX}/tasks/${taskId}/activities?limit=${limit || 100}`)
      .then(r => r.activities || []);
  },

  getReviewDecisions: (taskId: string): Promise<unknown[]> => {
    return request<{ decisions: unknown[] }>(`${API_PREFIX}/tasks/${taskId}/review-decisions`)
      .then(r => r.decisions || []);
  }
};

// Database API
export const dbApi = {
  clear: (): Promise<{ success: boolean; message: string; tables_cleared: string[] }> => {
    return request(`${API_PREFIX}/db/clear`, { method: 'POST' });
  },

  getStats: (): Promise<{
    tasks: number;
    agent_calls: number;
    activities: number;
    review_decisions: number;
  }> => {
    return request(`${API_PREFIX}/db/stats`);
  }
};
