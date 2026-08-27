'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { Task, ActivityEntry } from '@/types';
import { useTaskStore } from '@/store';
import { taskApi } from '@/lib/api';
import { StageIndicator } from '@/components/stages/StageIndicator';
import { ActivityLog } from '@/components/activity/ActivityLog';
import { ChildTasks } from '@/components/child-tasks/ChildTasks';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  // Use selectors to avoid re-render loops
  const startTask = useTaskStore(state => state.startTask);
  const pauseTask = useTaskStore(state => state.pauseTask);
  const retryTask = useTaskStore(state => state.retryTask);
  const approveTask = useTaskStore(state => state.approveTask);
  const rejectTask = useTaskStore(state => state.rejectTask);
  const requestChanges = useTaskStore(state => state.requestChanges);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch activities
  useEffect(() => {
    if (task.status === 'running' || task.column === 'done') {
      fetchActivities();
    }
  }, [task.id, task.status]);

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const data = await taskApi.getActivities(task.id, 50);
      setActivities(data as ActivityEntry[]);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleStart = async () => {
    setIsActionLoading(true);
    try {
      await startTask(task.id);
      toast.success('Task started');
    } catch (error) {
      toast.error('Failed to start task');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePause = async () => {
    setIsActionLoading(true);
    try {
      await pauseTask(task.id);
      toast.success('Task paused');
    } catch (error) {
      toast.error('Failed to pause task');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsActionLoading(true);
    try {
      await retryTask(task.id);
      toast.success('Task retry started');
    } catch (error) {
      toast.error('Failed to retry task');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      await approveTask(task.id);
      toast.success('Task approved');
      onClose();
    } catch (error) {
      toast.error('Failed to approve task');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    setIsActionLoading(true);
    try {
      await rejectTask(task.id, reason);
      toast.success('Task rejected');
      onClose();
    } catch (error) {
      toast.error('Failed to reject task');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    const changes = prompt('What changes are needed?');
    if (!changes) return;

    setIsActionLoading(true);
    try {
      await requestChanges(task.id, changes);
      toast.success('Changes requested');
      onClose();
    } catch (error) {
      toast.error('Failed to request changes');
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {task.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={clsx(
              'px-2 py-0.5 text-xs rounded font-medium',
              task.column === 'todo' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              task.column === 'doing' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
              task.column === 'review' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
              task.column === 'done' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              task.column === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}>
              {task.column.toUpperCase()}
            </span>
            {task.status === 'running' && (
              <span className="flex items-center gap-1 text-xs text-yellow-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Running
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Description */}
        {task.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        {/* Stage Progress */}
        {task.labels.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Execution Progress ({task.progress}%)
            </h3>
            <div className="progress-bar mb-3">
              <div
                className="progress-bar-fill"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <StageIndicator
              labels={task.labels}
              currentIndex={task.currentLabelIndex}
              completedLabels={task.completedLabels}
              outputs={task.outputs}
            />
          </div>
        )}

        {/* Child Tasks */}
        {task.childTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Sub-tasks
            </h3>
            <ChildTasks
              parentId={task.id}
              childTasks={[]}
              onTaskClick={() => { }}
            />
          </div>
        )}

        {/* Activity Log */}
        {(task.status === 'running' || task.column === 'done' || task.column === 'review') && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Activity Log
              {loadingActivities && <Loader2 className="w-3 h-3 animate-spin" />}
            </h3>
            <ActivityLog
              taskId={task.id}
              activities={activities}
              loading={loadingActivities}
            />
          </div>
        )}

        {/* Error Info */}
        {task.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-700 dark:text-red-400">
                  Error
                </h4>
                <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                  {task.error}
                </p>
                {task.errorDetails?.suggestedFix && (
                  <p className="mt-2 text-xs text-red-500">
                    Suggestion: {task.errorDetails.suggestedFix}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Created:</span>
            <p className="text-gray-700 dark:text-gray-300">{formatDate(task.createdAt)}</p>
          </div>
          <div>
            <span className="text-gray-500">Priority:</span>
            <p className="text-gray-700 dark:text-gray-300 capitalize">{task.priority}</p>
          </div>
          {task.startedAt && (
            <div>
              <span className="text-gray-500">Started:</span>
              <p className="text-gray-700 dark:text-gray-300">{formatDate(task.startedAt)}</p>
            </div>
          )}
          {task.completedAt && (
            <div>
              <span className="text-gray-500">Completed:</span>
              <p className="text-gray-700 dark:text-gray-300">{formatDate(task.completedAt)}</p>
            </div>
          )}
          {task.retryCount > 0 && (
            <div>
              <span className="text-gray-500">Retries:</span>
              <p className="text-gray-700 dark:text-gray-300">{task.retryCount}/{task.maxRetries}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Todo column - show Start button */}
        {task.column === 'todo' && (
          <button
            onClick={handleStart}
            disabled={isActionLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Start Task
          </button>
        )}

        {/* Doing column - show Pause button */}
        {task.column === 'doing' && (
          <button
            onClick={handlePause}
            disabled={isActionLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
          >
            <Pause className="w-4 h-4" />
            Pause Task
          </button>
        )}

        {/* Error column - show Retry button */}
        {task.column === 'error' && (
          <button
            onClick={handleRetry}
            disabled={isActionLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Task
          </button>
        )}

        {/* Review column - show Review actions */}
        {task.column === 'review' && (
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={isActionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={isActionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4" />
              Request Changes
            </button>
            <button
              onClick={handleApprove}
              disabled={isActionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
