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
import {
  COLUMNS,
  COLUMNS as COLUMN_CONSTANTS,
  UI_STRINGS,
  getColumnConfig,
} from '@/constants';
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
    if (task.status === 'running' || task.column === COLUMNS.DONE) {
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
      toast.success(UI_STRINGS.TASK_STARTED);
    } catch (error) {
      toast.error(UI_STRINGS.FAILED_TO_START);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePause = async () => {
    setIsActionLoading(true);
    try {
      await pauseTask(task.id);
      toast.success(UI_STRINGS.TASK_PAUSED);
    } catch (error) {
      toast.error(UI_STRINGS.FAILED_TO_PAUSE);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsActionLoading(true);
    try {
      await retryTask(task.id);
      toast.success(UI_STRINGS.TASK_RETRY_STARTED);
    } catch (error) {
      toast.error(UI_STRINGS.FAILED_TO_RETRY);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      await approveTask(task.id);
      toast.success(UI_STRINGS.TASK_APPROVED);
      onClose();
    } catch (error) {
      toast.error(UI_STRINGS.FAILED_TO_APPROVE);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt(UI_STRINGS.ENTER_REJECTION_REASON);
    if (!reason) return;

    setIsActionLoading(true);
    try {
      await rejectTask(task.id, reason);
      toast.success(UI_STRINGS.TASK_REJECTED);
      onClose();
    } catch (error) {
      toast.error(UI_STRINGS.FAILED_TO_REJECT);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    const changes = prompt(UI_STRINGS.ENTER_CHANGES_NEEDED);
    if (!changes) return;

    setIsActionLoading(true);
    try {
      await requestChanges(task.id, changes);
      toast.success(UI_STRINGS.CHANGES_REQUESTED);
      onClose();
    } catch (error) {
      toast.error(UI_STRINGS.FAILED_TO_REQUEST_CHANGES);
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const columnConfig = getColumnConfig(task.column);

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
              columnConfig.chipClass
            )}>
              {columnConfig.title.toUpperCase()}
            </span>
            {task.status === 'running' && (
              <span className="flex items-center gap-1 text-xs text-yellow-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                {UI_STRINGS.RUNNING}
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
              {UI_STRINGS.DESCRIPTION}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        {/* Stage Progress */}
        {task.labels?.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {UI_STRINGS.EXECUTION_PROGRESS} ({task.progress}%)
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
        {task.childTasks?.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {UI_STRINGS.SUB_TASKS}
            </h3>
            <ChildTasks
              parentId={task.id}
              childTasks={[]}
              onTaskClick={() => { }}
            />
          </div>
        )}

        {/* Activity Log */}
        {(task.status === 'running' || task.column === COLUMNS.DONE || task.column === COLUMNS.REVIEW) && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {UI_STRINGS.ACTIVITY_LOG}
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
                  {UI_STRINGS.ERROR}
                </h4>
                <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                  {task.error}
                </p>
                {task.errorDetails?.suggestedFix && (
                  <p className="mt-2 text-xs text-red-500">
                    {UI_STRINGS.SUGGESTION}: {task.errorDetails.suggestedFix}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{UI_STRINGS.CREATED}:</span>
            <p className="text-gray-700 dark:text-gray-300">{formatDate(task.createdAt)}</p>
          </div>
          <div>
            <span className="text-gray-500">{UI_STRINGS.PRIORITY}:</span>
            <p className="text-gray-700 dark:text-gray-300 capitalize">{task.priority}</p>
          </div>
          {task.startedAt && (
            <div>
              <span className="text-gray-500">{UI_STRINGS.STARTED}:</span>
              <p className="text-gray-700 dark:text-gray-300">{formatDate(task.startedAt)}</p>
            </div>
          )}
          {task.completedAt && (
            <div>
              <span className="text-gray-500">{UI_STRINGS.COMPLETED}:</span>
              <p className="text-gray-700 dark:text-gray-300">{formatDate(task.completedAt)}</p>
            </div>
          )}
          {task.retryCount > 0 && (
            <div>
              <span className="text-gray-500">{UI_STRINGS.RETRIES}:</span>
              <p className="text-gray-700 dark:text-gray-300">{task.retryCount}/{task.maxRetries}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Todo column - show Start button */}
        {task.column === COLUMNS.TODO && (
          <button
            onClick={handleStart}
            disabled={isActionLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {UI_STRINGS.START_TASK}
          </button>
        )}

        {/* Doing column - show Pause button */}
        {task.column === COLUMNS.DOING && (
          <button
            onClick={handlePause}
            disabled={isActionLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
          >
            <Pause className="w-4 h-4" />
            {UI_STRINGS.PAUSE_TASK}
          </button>
        )}

        {/* Error column - show Retry button */}
        {task.column === COLUMNS.ERROR && (
          <button
            onClick={handleRetry}
            disabled={isActionLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            {UI_STRINGS.RETRY_TASK}
          </button>
        )}

        {/* Review column - show Review actions */}
        {task.column === COLUMNS.REVIEW && (
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={isActionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {UI_STRINGS.REJECT}
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={isActionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4" />
              {UI_STRINGS.REQUEST_CHANGES}
            </button>
            <button
              onClick={handleApprove}
              disabled={isActionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {UI_STRINGS.APPROVE}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
