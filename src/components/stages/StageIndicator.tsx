'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { Label, StageOutput } from '@/types';

interface StageIndicatorProps {
  labels: Label[];
  currentIndex: number;
  completedLabels: string[];
  outputs?: Record<string, StageOutput>;
  compact?: boolean;
  onStageClick?: (label: string, output?: StageOutput) => void;
}

export function StageIndicator({
  labels,
  currentIndex,
  completedLabels,
  outputs = {},
  compact = false,
  onStageClick,
}: StageIndicatorProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const getStageStatus = (label: Label, index: number) => {
    if (completedLabels.includes(label)) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const getStageIcon = (label: Label, index: number) => {
    const status = getStageStatus(label, index);
    const output = outputs[label];

    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'current':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        if (output?.status === 'error') {
          return <XCircle className="w-4 h-4 text-red-500" />;
        }
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const toggleExpand = (label: string) => {
    setExpandedStage(expandedStage === label ? null : label);
  };

  return (
    <div className={clsx(compact ? 'space-y-1' : 'space-y-2')}>
      <div className="flex items-center gap-1 flex-wrap">
        {labels.map((label, index) => {
          const status = getStageStatus(label, index);
          const isExpanded = expandedStage === label;
          const hasOutput = !!outputs[label];

          return (
            <React.Fragment key={label}>
              {/* Stage Chip */}
              <button
                onClick={() => hasOutput && !compact && toggleExpand(label)}
                disabled={!hasOutput || compact}
                className={clsx(
                  'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all',
                  status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  status === 'current' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse',
                  status === 'pending' && 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                  hasOutput && !compact && 'cursor-pointer hover:scale-105'
                )}
              >
                {getStageIcon(label, index)}
                <span>{label}</span>
                {hasOutput && !compact && (
                  isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                )}
                {hasOutput && outputs[label]?.duration && (
                  <span className="text-[10px] opacity-75">
                    {formatDuration(outputs[label].duration)}
                  </span>
                )}
              </button>

              {/* Connector */}
              {index < labels.length - 1 && (
                <div className={clsx(
                  'w-4 h-0.5',
                  completedLabels.includes(label) ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Expanded Output */}
      {expandedStage && outputs[expandedStage] && !compact && (
        <div className="ml-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {outputs[expandedStage].agent} Output
            </span>
            <button
              onClick={() => onStageClick?.(expandedStage, outputs[expandedStage])}
              className="text-blue-500 hover:text-blue-600"
            >
              View Full
            </button>
          </div>

          {outputs[expandedStage].summary && (
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {outputs[expandedStage].summary}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-[10px]">
            {(outputs[expandedStage]?.files_created?.length ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                +{outputs[expandedStage]?.files_created?.length} created
              </span>
            )}
            {(outputs[expandedStage]?.files_modified?.length ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                ~{outputs[expandedStage]?.files_modified?.length} modified
              </span>
            )}
            {(outputs[expandedStage]?.tools_used?.length ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded">
                {outputs[expandedStage]?.tools_used?.length} tools used
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
