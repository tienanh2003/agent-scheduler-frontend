import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Shield, AlertTriangle, Check, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface ToolPermission {
  id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  requested_by?: string;
}

interface TaskReview {
  id: string;
  task_id: string;
  comment: string;
  status: 'pending' | 'approved' | 'changes_requested';
  requested_at: string;
  requested_by?: string;
}

interface ApprovalPanelProps {
  socketUrl?: string;
  apiBaseUrl?: string;
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
};

const truncateJson = (obj: Record<string, unknown>, maxLength = 200): string => {
  const json = JSON.stringify(obj, null, 2);
  if (json.length <= maxLength) return json;
  return json.substring(0, maxLength) + '...';
};

const ApprovalPanel: React.FC<ApprovalPanelProps> = ({
  socketUrl = 'http://localhost:3001',
  apiBaseUrl = '/api',
}) => {
  const [permissions, setPermissions] = useState<ToolPermission[]>([]);
  const [reviews, setReviews] = useState<TaskReview[]>([]);
  const [expandedPermission, setExpandedPermission] = useState<string | null>(null);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('approval:permission', (data: ToolPermission) => {
      setPermissions((prev) => {
        const exists = prev.some((p) => p.id === data.id);
        if (exists) return prev;
        return [{ ...data, status: 'pending' }, ...prev];
      });
    });

    newSocket.on('approval:review', (data: TaskReview) => {
      setReviews((prev) => {
        const exists = prev.some((r) => r.id === data.id);
        if (exists) return prev;
        return [{ ...data, status: 'pending' }, ...prev];
      });
    });

    newSocket.on('approval:permission:update', (data: { id: string; status: string }) => {
      setPermissions((prev) =>
        prev.map((p) => (p.id === data.id ? { ...p, status: data.status as ToolPermission['status'] } : p))
      );
    });

    newSocket.on('approval:review:update', (data: { id: string; status: string }) => {
      setReviews((prev) =>
        prev.map((r) => (r.id === data.id ? { ...r, status: data.status as TaskReview['status'] } : r))
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [socketUrl]);

  const handleApprove = useCallback(
    async (id: string, type: 'permission' | 'review') => {
      setProcessingIds((prev) => new Set(prev).add(id));
      try {
        const response = await fetch(`${apiBaseUrl}/approvals/${id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });

        if (!response.ok) {
          throw new Error(`Failed to approve: ${response.statusText}`);
        }

        if (type === 'permission') {
          setPermissions((prev) => prev.filter((p) => p.id !== id));
        } else {
          setReviews((prev) => prev.filter((r) => r.id !== id));
        }
      } catch (error) {
        console.error(`Error approving ${type}:`, error);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [apiBaseUrl]
  );

  const handleDeny = useCallback(
    async (id: string, type: 'permission' | 'review') => {
      setProcessingIds((prev) => new Set(prev).add(id));
      try {
        const response = await fetch(`${apiBaseUrl}/approvals/${id}/deny`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });

        if (!response.ok) {
          throw new Error(`Failed to deny: ${response.statusText}`);
        }

        if (type === 'permission') {
          setPermissions((prev) => prev.filter((p) => p.id !== id));
        } else {
          setReviews((prev) => prev.filter((r) => r.id !== id));
        }
      } catch (error) {
        console.error(`Error denying ${type}:`, error);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [apiBaseUrl]
  );

  const pendingPermissions = permissions.filter((p) => p.status === 'pending');
  const pendingReviews = reviews.filter((r) => r.status === 'pending');

  const isProcessing = (id: string) => processingIds.has(id);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg dark:bg-amber-900/30">
            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Approval Requests</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review and approve pending tool permissions and task changes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Tool Permissions Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tool Permissions</h3>
          {pendingPermissions.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
              {pendingPermissions.length} pending
            </span>
          )}
        </div>

        {pendingPermissions.length === 0 ? (
          <div className="p-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <Shield className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">No pending tool permission requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPermissions.map((permission) => (
              <div
                key={permission.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-mono rounded">
                        {permission.tool_name}
                      </code>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(permission.requested_at)}
                      </span>
                    </div>
                    {permission.requested_by && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Requested by: {permission.requested_by}
                      </p>
                    )}
                    <div className="mt-2">
                      <button
                        onClick={() =>
                          setExpandedPermission(expandedPermission === permission.id ? null : permission.id)
                        }
                        className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {expandedPermission === permission.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        {expandedPermission === permission.id ? 'Hide' : 'Show'} Input Details
                      </button>
                    </div>
                    {expandedPermission === permission.id && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto max-h-64">
                        <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {JSON.stringify(permission.tool_input, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDeny(permission.id, 'permission')}
                      disabled={isProcessing(permission.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing(permission.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Deny
                    </button>
                    <button
                      onClick={() => handleApprove(permission.id, 'permission')}
                      disabled={isProcessing(permission.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing(permission.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Task Reviews Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Task Reviews</h3>
          {pendingReviews.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
              {pendingReviews.length} pending
            </span>
          )}
        </div>

        {pendingReviews.length === 0 ? (
          <div className="p-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <Shield className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">No pending task review requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Task #{review.task_id}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(review.requested_at)}
                      </span>
                    </div>
                    {review.requested_by && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Requested by: {review.requested_by}
                      </p>
                    )}
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {review.comment || 'No comment provided'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDeny(review.id, 'review')}
                      disabled={isProcessing(review.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing(review.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleApprove(review.id, 'review')}
                      disabled={isProcessing(review.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing(review.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Empty State When Nothing Is Pending */}
      {pendingPermissions.length === 0 && pendingReviews.length === 0 && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">All Caught Up!</h3>
          <p className="text-gray-500 dark:text-gray-400">
            No pending approval requests. New requests will appear here in real-time.
          </p>
        </div>
      )}
    </div>
  );
};

export default ApprovalPanel;
