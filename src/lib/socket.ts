import { io, Socket } from 'socket.io-client';
import { WS_EVENTS, API } from '@/constants';

const WS_URL = API.BASE_URL;

export type SocketEventHandler = (data: unknown) => void;

class SocketManager {
  private socket: Socket | null = null;
  private handlers: Map<string, Set<SocketEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isConnectedFlag = false;
  private isConnecting = false;
  private pendingConnectResolve: (() => void) | null = null;

  private async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${WS_URL}${API.HEALTH}`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // Already connected
      if (this.socket?.connected) {
        resolve();
        return;
      }

      // Already connecting
      if (this.isConnecting) {
        // Wait for existing connection attempt
        this.pendingConnectResolve = resolve;
        return;
      }

      this.isConnecting = true;
      this.pendingConnectResolve = resolve;

      try {
        // First check if server is ready
        const isServerUp = await this.checkServerHealth();
        if (!isServerUp) {
          console.log('[Socket] Server not ready, will retry later');
          this.isConnecting = false;
          // Don't reject, just leave disconnected
          resolve();
          return;
        }

        // Close existing socket if any
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }

        this.socket = io(WS_URL, {
          transports: ['websocket', 'polling'],
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 10000,
          timeout: 15000,
        });

        this.socket.on('connect', () => {
          console.log('[Socket] Connected');
          this.isConnectedFlag = true;
          this.reconnectAttempts = 0;
          // Subscribe to tasks room (backend uses 'tasks')
          this.socket?.emit('subscribe', { room: 'tasks' });
          this.isConnecting = false;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected:', reason);
          this.isConnectedFlag = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('[Socket] Connection error:', error.message);
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[Socket] Max reconnect attempts reached, giving up');
            this.isConnecting = false;
            // Still resolve - the app can work without real-time updates
            resolve();
          }
        });

        // Register event handlers before connecting
        this.setupEventHandlers();

        // Actually connect
        this.socket.connect();
      } catch (error) {
        console.error('[Socket] Unexpected error:', error);
        this.isConnecting = false;
        resolve(); // Don't block the app
      }
    });
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Task lifecycle - using constants
    this.socket.on(WS_EVENTS.TASK_CREATED, (data) => this.emit(WS_EVENTS.TASK_CREATED, data));
    this.socket.on(WS_EVENTS.TASK_UPDATED, (data) => this.emit(WS_EVENTS.TASK_UPDATED, data));
    this.socket.on(WS_EVENTS.TASK_DELETED, (data) => this.emit(WS_EVENTS.TASK_DELETED, data));

    // Kanban
    this.socket.on(WS_EVENTS.TASK_MOVED, (data) => this.emit(WS_EVENTS.TASK_MOVED, data));

    // Execution
    this.socket.on(WS_EVENTS.TASK_STARTED, (data) => this.emit(WS_EVENTS.TASK_STARTED, data));
    this.socket.on(WS_EVENTS.TASK_PAUSED, (data) => this.emit(WS_EVENTS.TASK_PAUSED, data));
    this.socket.on(WS_EVENTS.TASK_RESUMED, (data) => this.emit(WS_EVENTS.TASK_RESUMED, data));

    // Stages
    this.socket.on(WS_EVENTS.TASK_STAGE_START, (data) => this.emit(WS_EVENTS.TASK_STAGE_START, data));
    this.socket.on(WS_EVENTS.TASK_STAGE_COMPLETE, (data) => this.emit(WS_EVENTS.TASK_STAGE_COMPLETE, data));
    this.socket.on('task:stage-error', (data) => this.emit('task:stage-error', data));

    // Progress
    this.socket.on(WS_EVENTS.TASK_PROGRESS, (data) => this.emit(WS_EVENTS.TASK_PROGRESS, data));

    // Review
    this.socket.on(WS_EVENTS.TASK_REVIEW_REQUESTED, (data) => this.emit(WS_EVENTS.TASK_REVIEW_REQUESTED, data));
    this.socket.on(WS_EVENTS.TASK_APPROVED, (data) => this.emit(WS_EVENTS.TASK_APPROVED, data));
    this.socket.on(WS_EVENTS.TASK_REJECTED, (data) => this.emit(WS_EVENTS.TASK_REJECTED, data));
    this.socket.on(WS_EVENTS.TASK_CHANGES_REQUESTED, (data) => this.emit(WS_EVENTS.TASK_CHANGES_REQUESTED, data));

    // Completion
    this.socket.on('task:completed', (data) => this.emit('task:completed', data));
    this.socket.on(WS_EVENTS.TASK_ERROR, (data) => this.emit(WS_EVENTS.TASK_ERROR, data));

    // Agents
    this.socket.on('task:agent-start', (data) => this.emit('task:agent-start', data));
    this.socket.on('task:agent-activity', (data) => this.emit('task:agent-activity', data));
    this.socket.on('task:agent-spawn', (data) => this.emit('task:agent-spawn', data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnectedFlag = false;
    }
  }

  on(event: string, handler: SocketEventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    const wrappedHandler = (data: unknown) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[Socket] Handler error for ${event}:`, error);
      }
    };

    this.handlers.get(event)?.add(wrappedHandler);

    return () => {
      this.handlers.get(event)?.delete(wrappedHandler);
    };
  }

  off(event: string, handler?: SocketEventHandler) {
    if (handler) {
      this.handlers.get(event)?.delete(handler);
    } else {
      this.handlers.delete(event);
    }
  }

  private emit(event: string, data: unknown) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[Socket] Handler error:`, error);
        }
      });
    }
  }

  get isConnected(): boolean {
    return this.isConnectedFlag;
  }

  get connectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (this.socket?.connected) return 'connected';
    return 'disconnected';
  }
}

export const socket = new SocketManager();
