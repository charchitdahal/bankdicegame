"use client";

let ws: WebSocket;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 5000;

type MessageHandler = (data: any) => void;
const messageHandlers = new Map<string, MessageHandler>();

export const connectionStatus = new EventTarget();

const createConnectionEvent = (status: 'connecting' | 'connected' | 'disconnected' | 'failed', error?: string) => {
  return new CustomEvent('connectionStatus', {
    detail: { status, error }
  });
};

const pingServer = (socket: WebSocket) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'ping' }));
  }
};

export const initializeSocket = () => {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    try {
      connectionStatus.dispatchEvent(createConnectionEvent('connecting'));
      
      // Use secure WebSocket connection with fallback URLs
      const wsUrls = [
        'wss://bank-game-server.fly.dev',
        'wss://bank-game-server.stackblitz.io'
      ];
      
      let currentUrlIndex = 0;
      const tryConnect = () => {
        if (currentUrlIndex >= wsUrls.length) {
          connectionStatus.dispatchEvent(createConnectionEvent('failed', 'All connection attempts failed'));
          return;
        }

        ws = new WebSocket(wsUrls[currentUrlIndex]);
        console.log(`Attempting to connect to ${wsUrls[currentUrlIndex]}`);

        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            currentUrlIndex++;
            tryConnect();
          }
        }, CONNECTION_TIMEOUT);

        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          clearTimeout(connectionTimeout);
          reconnectAttempts = 0;
          connectionStatus.dispatchEvent(createConnectionEvent('connected'));

          const pingTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              pingServer(ws);
            } else {
              clearInterval(pingTimer);
            }
          }, PING_INTERVAL);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') return;
            
            const handler = messageHandlers.get(data.type);
            if (handler) {
              handler(data.data);
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          clearTimeout(connectionTimeout);
          currentUrlIndex++;
          tryConnect();
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          connectionStatus.dispatchEvent(createConnectionEvent('disconnected'));
          
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Reconnect attempt ${reconnectAttempts} of ${MAX_RECONNECT_ATTEMPTS}`);
            
            setTimeout(() => {
              console.log('Attempting to reconnect...');
              initializeSocket();
            }, RECONNECT_DELAY * reconnectAttempts);
          } else {
            connectionStatus.dispatchEvent(createConnectionEvent('failed', 'Max reconnection attempts reached'));
          }
        };
      };

      tryConnect();
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      connectionStatus.dispatchEvent(createConnectionEvent('failed', 'Initialization error'));
    }
  }
  return ws;
};

export const getSocket = () => {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    return initializeSocket();
  }
  return ws;
};

export const sendMessage = (type: string, data: any) => {
  const socket = getSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify({ type, data }));
    } catch (error) {
      console.error('Error sending message:', error);
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        initializeSocket();
      }
    }
  } else {
    console.warn('WebSocket is not connected. Message not sent:', { type, data });
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      initializeSocket();
    }
  }
};

export const onMessage = (type: string, handler: MessageHandler) => {
  messageHandlers.set(type, handler);
};

export const offMessage = (type: string) => {
  messageHandlers.delete(type);
};