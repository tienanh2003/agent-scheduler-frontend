'use client';

import { create } from 'zustand';
import type { Task, Column, StageOutput } from './types';
import { taskApi } from './lib/api';
import { socket, SocketEventHandler } from './lib/socket';
import {
  COLUMNS,
  TASK_STATUS,
  WS_EVENTS,
  UI_STRINGS,
} from './constants';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  moveTask: (taskId: string, column: Column, position?: number) => Promise<void>;

  // Task actions
  startTask: (taskId: string) => Promise<void>;
  pauseTask: (taskId: string) => Promise<void>;
  resumeTask: (taskId: string) => Promise<void>;
  retryTask: (taskId: string, fromStage?: string) => Promise<void>;
  approveTask: (taskId: string, comment?: string) => Promise<void>;
  rejectTask: (taskId: string, reason: string) => Promise<void>;
  requestChanges: (taskId: string, changes: string, priority?: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { items } = await taskApi.list();
      set({ tasks: items, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addTask: (task: Task) => {
    set(state => {
      // Check if task already exists (avoid duplicates)
      if (state.tasks.some(t => t.id === task.id)) {
        return state;
      }
      return { tasks: [...state.tasks, task] };
    });
  },

  updateTask: (taskId: string, updates: Partial<Task>) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
  },

  removeTask: (taskId: string) => {
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== taskId),
    }));
  },

  moveTask: async (taskId: string, column: Column, position?: number) => {
    // Optimistic update
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, column } : t
      ),
    }));

    try {
      const updatedTask = await taskApi.move(taskId, column, position);
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? updatedTask : t
        ),
      }));
    } catch (error) {
      // Revert on error
      await get().fetchTasks();
      throw error;
    }
  },

  startTask: async (taskId: string) => {
    try {
      const updatedTask = await taskApi.start(taskId);
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? updatedTask : t
        ),
      }));
    } catch (error) {
      await get().fetchTasks();
      throw error;
    }
  },

  pauseTask: async (taskId: string) => {
    try {
      const updatedTask = await taskApi.pause(taskId);
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? updatedTask : t
        ),
      }));
    } catch (error) {
      await get().fetchTasks();
      throw error;
    }
  },

  resumeTask: async (taskId: string) => {
    try {
      const updatedTask = await taskApi.resume(taskId);
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? updatedTask : t
        ),
      }));
    } catch (error) {
      await get().fetchTasks();
      throw error;
    }
  },

  retryTask: async (taskId: string, fromStage?: string) => {
    try {
      const updatedTask = await taskApi.retry(taskId, fromStage);
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? updatedTask : t
        ),
      }));
    } catch (error) {
      await get().fetchTasks();
      throw error;
    }
  },

  approveTask: async (taskId: string, comment?: string) => {
    try {
      const updatedTask = await taskApi.approve(taskId, comment);
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? updatedTask : t
        ),
      }));
    } catch (error) {
      await get().fetchTasks();
      throw error;
    }
  },

  rejectTask: async (taskId: string, reason: string) => {
    try {
      const updatedTask = await taskApi.reject(taskId, reason);
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? updatedTask : t
        ),
      }));
    } catch (error) {
      await get().fetchTasks();
      throw error;
    }
  },

  requestChanges: async (taskId: string, changes: string, priority?: string) => {
    try {
      const updatedTask = await taskApi.requestChanges(taskId, changes, priority);
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? updatedTask : t
        ),
      }));
    } catch (error) {
      await get().fetchTasks();
      throw error;
    }
  },
}));

// Setup WebSocket event listeners
export function setupSocketListeners() {
  // Task lifecycle
  socket.on(WS_EVENTS.TASK_CREATED, ((data: unknown) => {
    const { task } = data as { task: Task };
    useTaskStore.getState().addTask(task);
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_UPDATED, ((data: unknown) => {
    // Backend now sends full task object
    const { task } = data as { task: Task };
    if (task) {
      useTaskStore.getState().updateTask(task.id, task);
    }
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_MOVED, ((data: unknown) => {
    // Backend sends full task object with from/to columns
    const { task, to_column } = data as { task: Task; to_column: Column; from_column: string };
    if (task) {
      useTaskStore.getState().updateTask(task.id, task);
    } else {
      // Fallback: try to get task_id from the data
      const { task_id } = data as { task_id: string };
      if (task_id && to_column) {
        useTaskStore.getState().updateTask(task_id, { column: to_column });
      }
    }
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_DELETED, ((data: unknown) => {
    const { task_id } = data as { task_id: string };
    useTaskStore.getState().removeTask(task_id);
  }) as SocketEventHandler);

  // Additional event listeners for real-time updates
  socket.on(WS_EVENTS.TASK_STARTED, ((data: unknown) => {
    const { task_id, task } = data as { task_id: string; task: Task };
    if (task) {
      useTaskStore.getState().updateTask(task_id, { ...task, column: COLUMNS.DOING, status: TASK_STATUS.RUNNING });
    } else {
      useTaskStore.getState().updateTask(task_id, { column: COLUMNS.DOING, status: TASK_STATUS.RUNNING });
    }
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_PAUSED, ((data: unknown) => {
    const { task_id, task } = data as { task_id: string; task: Task };
    if (task) {
      useTaskStore.getState().updateTask(task_id, { ...task, column: COLUMNS.TODO, status: TASK_STATUS.PAUSED });
    } else {
      useTaskStore.getState().updateTask(task_id, { column: COLUMNS.TODO, status: TASK_STATUS.PAUSED });
    }
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_RESUMED, ((data: unknown) => {
    const { task_id, task } = data as { task_id: string; task: Task };
    if (task) {
      useTaskStore.getState().updateTask(task_id, { ...task, column: COLUMNS.DOING, status: TASK_STATUS.RUNNING });
    } else {
      useTaskStore.getState().updateTask(task_id, { column: COLUMNS.DOING, status: TASK_STATUS.RUNNING });
    }
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_PROGRESS, ((data: unknown) => {
    const { task_id, progress } = data as { task_id: string; progress: number };
    useTaskStore.getState().updateTask(task_id, { progress });
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_STAGE_START, ((data: unknown) => {
    const { task_id, stage, agent } = data as { task_id: string; stage: string; agent?: string };
    useTaskStore.getState().updateTask(task_id, {
      currentAgent: agent,
      status: TASK_STATUS.RUNNING
    });
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_STAGE_COMPLETE, ((data: unknown) => {
    const { task_id, stage, output } = data as { task_id: string; stage: string; output: StageOutput };
    const task = useTaskStore.getState().tasks.find(t => t.id === task_id);
    if (task) {
      useTaskStore.getState().updateTask(task_id, {
        outputs: { ...task.outputs, [output.label]: output },
        completedLabels: [...(task.completedLabels || []), stage],
      });
    }
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_REVIEW_REQUESTED, ((data: unknown) => {
    const { task_id } = data as { task_id: string };
    useTaskStore.getState().updateTask(task_id, {
      column: COLUMNS.REVIEW,
      status: TASK_STATUS.REVIEWING
    });
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_APPROVED, ((data: unknown) => {
    const { task_id } = data as { task_id: string };
    useTaskStore.getState().updateTask(task_id, {
      column: COLUMNS.DONE,
      status: TASK_STATUS.COMPLETED
    });
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_REJECTED, ((data: unknown) => {
    const { task_id } = data as { task_id: string };
    useTaskStore.getState().updateTask(task_id, {
      column: COLUMNS.ERROR,
      status: TASK_STATUS.ERROR
    });
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_CHANGES_REQUESTED, ((data: unknown) => {
    const { task_id } = data as { task_id: string };
    useTaskStore.getState().updateTask(task_id, {
      column: COLUMNS.DOING,
      status: TASK_STATUS.RUNNING
    });
  }) as SocketEventHandler);

  socket.on(WS_EVENTS.TASK_ERROR, ((data: unknown) => {
    const { task_id, message } = data as { task_id: string; message?: string };
    useTaskStore.getState().updateTask(task_id, {
      column: COLUMNS.ERROR,
      status: TASK_STATUS.ERROR,
      error: message
    });
  }) as SocketEventHandler);
}

// Cleanup function
export function cleanupSocketListeners() {
  socket.off(WS_EVENTS.TASK_CREATED);
  socket.off(WS_EVENTS.TASK_UPDATED);
  socket.off(WS_EVENTS.TASK_MOVED);
  socket.off(WS_EVENTS.TASK_DELETED);
  socket.off(WS_EVENTS.TASK_STARTED);
  socket.off(WS_EVENTS.TASK_PAUSED);
  socket.off(WS_EVENTS.TASK_RESUMED);
  socket.off(WS_EVENTS.TASK_PROGRESS);
  socket.off(WS_EVENTS.TASK_STAGE_START);
  socket.off(WS_EVENTS.TASK_STAGE_COMPLETE);
  socket.off(WS_EVENTS.TASK_REVIEW_REQUESTED);
  socket.off(WS_EVENTS.TASK_APPROVED);
  socket.off(WS_EVENTS.TASK_REJECTED);
  socket.off(WS_EVENTS.TASK_CHANGES_REQUESTED);
  socket.off(WS_EVENTS.TASK_ERROR);
}
