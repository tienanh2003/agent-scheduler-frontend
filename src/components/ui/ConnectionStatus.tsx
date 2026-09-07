'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { claudeApi, type ClaudeStatus } from '@/lib/api';

interface ConnectionStatusProps {
  onStatusChange?: (connected: boolean) => void;
}

export function ConnectionStatus({ onStatusChange }: ConnectionStatusProps) {
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await claudeApi.getStatus();
      setStatus(result);
      onStatusChange?.(result.connected);
    } catch {
      // Claude CLI status endpoint may not be available
      setStatus({
        status: 'error',
        message: 'Claude CLI not available',
        connected: false
      });
      onStatusChange?.(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onStatusChange]);

  // Poll for status every 5 seconds
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    fetchStatus();
  };

  if (loading || !status) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="hidden sm:inline">Checking...</span>
      </div>
    );
  }

  const isConnected = status.status === 'connected';
  const isError = status.status === 'error';

  return (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className={clsx(
        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
        isConnected && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200',
        !isConnected && !isError && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200',
        isError && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200',
        refreshing && 'opacity-70 cursor-not-allowed'
      )}
      title={`${status.message}\nClick to refresh`}
    >
      {refreshing ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isConnected ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}

      {isConnected ? (
        <span className="hidden sm:inline">Claude CLI</span>
      ) : (
        <span className="hidden sm:inline">Offline</span>
      )}

      <RefreshCw className={clsx(
        'w-2.5 h-2.5 opacity-60',
        !refreshing && 'hover:opacity-100'
      )} />
    </button>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        <span className="text-gray-700 dark:text-gray-300">Loading...</span>
      </div>
    </div>
  );
}
