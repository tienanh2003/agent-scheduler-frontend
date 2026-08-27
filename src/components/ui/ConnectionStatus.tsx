'use client';

import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ConnectionStatusProps {
  isConnected: boolean;
  onToggle: () => void;
}

export function ConnectionStatus({ isConnected, onToggle }: ConnectionStatusProps) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
        isConnected && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200',
        !isConnected && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
      )}
      title={isConnected ? 'Connected - Click to disconnect' : 'Disconnected - Click to connect'}
    >
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3" />
          <span className="hidden sm:inline">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span className="hidden sm:inline">Offline</span>
        </>
      )}
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
