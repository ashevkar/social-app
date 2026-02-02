import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

type RealtimeUpdate = {
  type: 'connected' | 'likes' | 'comments' | 'new_tweet' | 'error';
  data?: any;
  timestamp?: string;
  message?: string;
};

type UseRealtimeUpdatesOptions = {
  enabled?: boolean;
  onLike?: (update: any) => void;
  onComment?: (update: any) => void;
  onNewTweet?: (update: any) => void;
  onError?: (error: string) => void;
};

export function useRealtimeUpdates({
  enabled = true,
  onLike,
  onComment,
  onNewTweet,
  onError,
}: UseRealtimeUpdatesOptions = {}) {
  const { data: session } = useSession();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    if (!enabled || !session || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource('/api/tweets/realtime');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const update: RealtimeUpdate = JSON.parse(event.data);
          
          switch (update.type) {
            case 'connected':
              console.log('Real-time connection established');
              break;
            case 'likes':
              onLike?.(update.data);
              break;
            case 'comments':
              onComment?.(update.data);
              break;
            case 'new_tweet':
              onNewTweet?.(update.data);
              break;
            case 'error':
              onError?.(update.message || 'Unknown error');
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;

        // Exponential backoff reconnection
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          onError?.('Failed to maintain real-time connection');
        }
      };
    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      onError?.('Failed to connect to real-time updates');
    }
  }, [enabled, session, onLike, onComment, onNewTweet, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled && session) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, session, connect, disconnect]);

  return { connect, disconnect };
}
