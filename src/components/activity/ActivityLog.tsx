'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Terminal,
  FileEdit,
  GitBranch,
  AlertCircle,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';
import type { ActivityEntry } from '@/types';
import { ACTIVITY_TYPE, FILE_CHANGE_TYPE } from '@/constants';
import clsx from 'clsx';

interface ActivityLogProps {
  taskId: string;
  activities: ActivityEntry[];
  loading?: boolean;
  autoScroll?: boolean;
  maxItems?: number;
}

export function ActivityLog({
  activities,
  loading = false,
  autoScroll = true,
  maxItems = 100
}: ActivityLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [activities, autoScroll]);

  const copyToClipboard = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case ACTIVITY_TYPE.TOOL_CALL:
      case ACTIVITY_TYPE.TOOL_RESULT:
        return <Terminal className="w-3.5 h-3.5" />;
      case ACTIVITY_TYPE.FILE_CHANGE:
        return <FileEdit className="w-3.5 h-3.5" />;
      case ACTIVITY_TYPE.AGENT_SPAWN:
        return <GitBranch className="w-3.5 h-3.5" />;
      case ACTIVITY_TYPE.ERROR:
        return <AlertCircle className="w-3.5 h-3.5" />;
      case ACTIVITY_TYPE.THOUGHT:
      case ACTIVITY_TYPE.MESSAGE:
        return <MessageSquare className="w-3.5 h-3.5" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  const getActivityClass = (type: string): string => {
    switch (type) {
      case ACTIVITY_TYPE.TOOL_CALL:
        return 'border-l-blue-400 bg-blue-50 dark:bg-blue-900/10';
      case ACTIVITY_TYPE.TOOL_RESULT:
        return 'border-l-blue-300 bg-blue-50/50 dark:bg-blue-900/5';
      case ACTIVITY_TYPE.FILE_CHANGE:
        return 'border-l-amber-400 bg-amber-50 dark:bg-amber-900/10';
      case ACTIVITY_TYPE.AGENT_SPAWN:
        return 'border-l-purple-400 bg-purple-50 dark:bg-purple-900/10';
      case ACTIVITY_TYPE.ERROR:
        return 'border-l-red-400 bg-red-50 dark:bg-red-900/10';
      case ACTIVITY_TYPE.THOUGHT:
        return 'border-l-gray-400 bg-gray-50 dark:bg-gray-800/50';
      default:
        return 'border-l-gray-300 dark:border-l-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const displayedActivities = activities.slice(-maxItems);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="space-y-1 overflow-y-auto max-h-[400px] pr-2"
    >
      {displayedActivities.length === 0 ? (
        <div className="text-center text-gray-500 py-8 text-sm">
          No activity yet
        </div>
      ) : (
        displayedActivities.map((activity, index) => (
          <div
            key={activity.id || index}
            className={clsx(
              'flex gap-2 p-2 rounded border-l-2 text-xs group',
              getActivityClass(activity.activity_type)
            )}
          >
            {/* Timestamp */}
            <span className="text-gray-400 font-mono shrink-0">
              {formatTime(activity.created_at)}
            </span>

            {/* Icon */}
            <span className="shrink-0 mt-0.5">
              {getActivityIcon(activity.activity_type)}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Tool call with expandable args */}
              {activity.tool_name && (
                <div>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {activity.tool_name}
                  </span>
                  {activity.tool_input !== undefined && activity.tool_input !== null && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        Arguments
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-[10px] overflow-x-auto">
                        {JSON.stringify(activity.tool_input as unknown as object, null, 2)}
                      </pre>
                    </details>
                  )}
                  {activity.tool_output !== undefined && activity.tool_output !== null && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        Output
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-[10px] overflow-x-auto">
                        {typeof activity.tool_output === 'string'
                          ? activity.tool_output
                          : JSON.stringify(activity.tool_output as object, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* File change */}
              {activity.file_path && (
                <div>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    {activity.change_type === FILE_CHANGE_TYPE.CREATED && '+'}
                    {activity.change_type === FILE_CHANGE_TYPE.MODIFIED && '~'}
                    {activity.change_type === FILE_CHANGE_TYPE.DELETED && '-'}
                    {' '}{activity.file_path}
                  </span>
                </div>
              )}

              {/* Agent spawn */}
              {activity.activity_type === ACTIVITY_TYPE.AGENT_SPAWN && (
                <div>
                  <span className="text-purple-600 dark:text-purple-400">
                    Spawned sub-agent
                  </span>
                  {activity.call_id && (
                    <span className="text-gray-500 ml-1">
                      (ID: {activity.call_id.slice(0, 8)}...)
                    </span>
                  )}
                </div>
              )}

              {/* Error */}
              {activity.activity_type === ACTIVITY_TYPE.ERROR && (
                <div className="text-red-600 dark:text-red-400">
                  {activity.content}
                </div>
              )}

              {/* Regular content */}
              {!activity.tool_name && !activity.file_path &&
               activity.activity_type !== ACTIVITY_TYPE.AGENT_SPAWN &&
               activity.activity_type !== ACTIVITY_TYPE.ERROR && (
                <span className="text-gray-700 dark:text-gray-300 break-words">
                  {activity.content}
                </span>
              )}
            </div>

            {/* Copy button */}
            {activity.content && activity.id && (
              <button
                onClick={() => activity.content && copyToClipboard(activity.content, activity.id ?? String(index))}
                className="shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100"
              >
                {copiedId === (activity.id ?? String(index)) ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-400" />
                )}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
