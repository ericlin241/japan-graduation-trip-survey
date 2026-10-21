import { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionStatus } from '../types';

interface UseWebSocketSyncProps {
  onNewResponse?: (data: any) => void;
  onUpdateResponse?: (data: any) => void;
  onDeleteResponse?: (data: { id: string }) => void;
  onRefreshNeeded?: () => void;
}

export function useWebSocketSync({
  onNewResponse,
  onUpdateResponse,
  onDeleteResponse,
  onRefreshNeeded,
}: UseWebSocketSyncProps = {}) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/ws`;

      setStatus(reconnectAttemptsRef.current === 0 ? 'connecting' : 'reconnecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) return;
        setStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Start ping heartbeat
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);

        // Notify refresh needed on reconnect to catch any missed updates
        onRefreshNeeded?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'NEW_RESPONSE' && message.payload) {
            onNewResponse?.(message.payload);
          } else if (message.type === 'UPDATE_RESPONSE' && message.payload) {
            onUpdateResponse?.(message.payload);
          } else if (message.type === 'DELETE_RESPONSE' && message.payload) {
            onDeleteResponse?.(message.payload);
          } else if (message.type === 'STATS_UPDATE') {
            onRefreshNeeded?.();
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setStatus('reconnecting');
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (unmountedRef.current) return;
        setStatus('reconnecting');
        ws.close();
      };
    } catch {
      setStatus('disconnected');
      scheduleReconnect();
    }
  }, [onNewResponse, onDeleteResponse, onRefreshNeeded]);

  const scheduleReconnect = useCallback(() => {
    if (unmountedRef.current) return;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    const backoff = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
    reconnectAttemptsRef.current++;

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, backoff);
  }, [connect]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { status, reconnect: connect };
}
