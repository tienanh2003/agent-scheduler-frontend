'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { useTaskStore } from '@/store';
import { dbApi } from '@/lib/api';
import { socket } from '@/lib/socket';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface HeaderProps {
  onNewTask: () => void;
  onMenuToggle?: () => void;
}

export function Header({ onNewTask }: HeaderProps) {
  const tasks = useTaskStore(s => s.tasks);
  const fetchTasks = useTaskStore(s => s.fetchTasks);
  const [isConnected, setIsConnected] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [dbStats, setDbStats] = useState<{ tasks: number; activities: number } | null>(null);

  // Subscribe to socket connection status
  React.useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    setIsConnected(socket.isConnected);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const handleConnectToggle = () => {
    if (isConnected) {
      socket.disconnect();
    } else {
      socket.connect();
    }
  };

  const handleClearDbClick = async () => {
    try {
      const stats = await dbApi.getStats();
      setDbStats({ tasks: stats.tasks, activities: stats.activities });
    } catch {
      setDbStats({ tasks: 0, activities: 0 });
    }
    setShowClearConfirm(true);
  };

  const handleClearDbConfirm = async () => {
    setIsClearing(true);
    try {
      await dbApi.clear();
      await fetchTasks();
      setShowClearConfirm(false);
      toast.success('Database cleared!');
    } catch {
      toast.error('Failed to clear database');
    } finally {
      setIsClearing(false);
    }
  };

  const stats = useMemo(() => {
    const taskList = Array.isArray(tasks) ? tasks : [];
    return {
      todo: taskList.filter(t => t && t.column === 'todo').length,
      doing: taskList.filter(t => t && t.column === 'doing').length,
      review: taskList.filter(t => t && t.column === 'review').length,
      done: taskList.filter(t => t && t.column === 'done').length,
      error: taskList.filter(t => t && t.column === 'error').length,
    };
  }, [tasks]);

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Agent Scheduler
            </h1>

            <div className="hidden md:flex items-center gap-4 text-sm">
              <StatBadge count={stats.todo} label="Todo" color="blue" />
              <StatBadge count={stats.doing} label="Doing" color="yellow" />
              <StatBadge count={stats.review} label="Review" color="purple" />
              <StatBadge count={stats.done} label="Done" color="green" />
              {stats.error > 0 && (
                <StatBadge count={stats.error} label="Error" color="red" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ConnectionStatus
              isConnected={isConnected}
              onToggle={handleConnectToggle}
            />

            <button
              onClick={handleClearDbClick}
              className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Clear database"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Clear DB</span>
            </button>

            <button
              onClick={onNewTask}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>

        <div className="flex md:hidden items-center gap-3 mt-3 overflow-x-auto pb-1">
          <StatBadge count={stats.todo} label="Todo" color="blue" />
          <StatBadge count={stats.doing} label="Doing" color="yellow" />
          <StatBadge count={stats.review} label="Review" color="purple" />
          <StatBadge count={stats.done} label="Done" color="green" />
          {stats.error > 0 && (
            <StatBadge count={stats.error} label="Error" color="red" />
          )}
        </div>
      </header>

      {/* Clear DB Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Clear Database
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                This will permanently delete:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-gray-700 dark:text-gray-300">
                    All tasks ({dbStats?.tasks || 0})
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-gray-700 dark:text-gray-300">
                    All activities ({dbStats?.activities || 0})
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearDbConfirm}
                disabled={isClearing}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface StatBadgeProps {
  count: number;
  label: string;
  color: 'blue' | 'yellow' | 'purple' | 'green' | 'red';
}

function StatBadge({ count, label, color }: StatBadgeProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className={clsx(
      'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap',
      colorClasses[color]
    )}>
      <span>{label}</span>
      <span className="font-bold">{count}</span>
    </div>
  );
}
