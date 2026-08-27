'use client';

import { create } from 'zustand';
import type { Task, Column, StageOutput } from './types';
import { taskApi } from './lib/api';
import { socket, SocketEventHandler } from './lib/socket';

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
  socket.on('task:created', ((data: unknown) => {
    const { task } = data as { task: Task };
    useTaskStore.getState().addTask(task);
  }) as SocketEventHandler);

  socket.on('task:updated', ((data: unknown) => {
    // Backend now sends full task object
    const { task } = data as { task: Task };
    if (task) {
      useTaskStore.getState().updateTask(task.id, task);
    }
  }) as SocketEventHandler);

  socket.on('task:moved', ((data: unknown) => {
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

  socket.on('task:deleted', ((data: unknown) => {
    const { task_id } = data as { task_id: string };
    useTaskStore.getState().removeTask(task_id);
  }) as SocketEventHandler);

  // Additional event listeners for real-time updates
  socket.on('task:started', ((data: unknown) => {
    const { task_id, task } = data as { task_id: string; task: Task };
    if (task) {
      useTaskStore.getState().updateTask(task_id, { ...task, column: 'doing', status: 'running' });
    } else {
      useTaskStore.getState().updateTask(task_id, { column: 'doing', status: 'running' });
    }
  }) as SocketEventHandler);

  socket.on('task:paused', ((data: unknown) => {
    const { task_id, task } = data as { task_id: string; task: Task };
    if (task) {
      useTaskStore.getState().updateTask(task_id, { ...task, column: 'todo', status: 'paused' });
    } else {
      useTaskStore.getState().updateTask(task_id, { column: 'todo', status: 'paused' });
    }
  }) as SocketEventHandler);

  socket.on('task:resumed', ((data: unknown) => {
    const { task_id, task } = data as { task_id: string; task: Task };
    if (task) {
      useTaskStore.getState().updateTask(task_id, { ...task, column: 'doing', status: 'running' });
    } else {
      useTaskStore.getState().updateTask(task_id, { column: 'doing', status: 'running' });
    }
  }) as SocketEventHandler);

  socket.on('task:progress', ((data: unknown) => {
    const { task_id, progress } = data as { task_id: string; progress: number };
    useTaskStore.getState().updateTask(task_id, { progress });
  }) as SocketEventHandler);

  socket.on('task:stage-start', ((data: unknown) => {
    const { task_id, stage, agent } = data as { task_id: string; stage: string; agent?: string };
    useTaskStore.getState().updateTask(task_id, {
      currentAgent: agent,
      status: 'running'
    });
  }) as SocketEventHandler);

  socket.on('task:stage-complete', ((data: unknown) => {
    const { task_id, stage, output } = data as { task_id: string; stage: string; output: StageOutput };
    const task = useTaskStore.getState().tasks.find(t => t.id === task_id);
    if (task) {
      useTaskStore.getState().updateTask(task_id, {
        outputs: { ...task.outputs, [output.label]: output },
        completedLabels: [...task.completedLabels, stage],
      });
    }
  }) as SocketEventHandler);

  socket.on('task:review-requested', ((data: unknown) => {
    const { task_id } = data as { task_id: string };
    useTaskStore.getState().updateTask(task_id, {
      column: 'review',
      status: 'reviewing'
    });
  }) as SocketEventHandler);

  socket.on('task:approved', ((data: unknown) => {
    const { task_id } = data as { task_id: string };
    useTaskStore.getState().updateTask(task_id, {
      column: 'done',
      status: 'completed'
    });
  }) as SocketEventHandler);

  socket.on('task:rejected', ((data: unknown) => {
    const { task_id } = data as { task_id: string };
    useTaskStore.getState().updateTask(task_id, {
      column: 'error',
      status: 'error'
    });
  }) as SocketEventHandler);

  socket.on('task:changes-requested', ((data: unknown) => {
    const { task_id } = data as { task_id: string };
    useTaskStore.getState().updateTask(task_id, {
      column: 'doing',
      status: 'running'
    });
  }) as SocketEventHandler);

  socket.on('task:error', ((data: unknown) => {
    const { task_id, message } = data as { task_id: string; message?: string };
    useTaskStore.getState().updateTask(task_id, {
      column: 'error',
      status: 'error',
      error: message
    });
  }) as SocketEventHandler);
}

// Cleanup function
export function cleanupSocketListeners() {
  socket.off('task:created');
  socket.off('task:updated');
  socket.off('task:moved');
  socket.off('task:deleted');
  socket.off('task:started');
  socket.off('task:paused');
  socket.off('task:resumed');
  socket.off('task:progress');
  socket.off('task:stage-start');
  socket.off('task:stage-complete');
  socket.off('task:review-requested');
  socket.off('task:approved');
  socket.off('task:rejected');
  socket.off('task:changes-requested');
  socket.off('task:error');
}
