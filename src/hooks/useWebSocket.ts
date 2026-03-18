import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import {
  handleWebSocketMessage,
  setWsConnected,
  setWsConnectionState,
  resetUnreadCount,
} from '@/redux/slices/chatSlice';
import { wsManager } from '@/services/websocket';

type SendTypingFn = (isTyping: boolean) => void;

export const useWebSocket = (groupId: number) => {
  const dispatch = useAppDispatch();
  const isConnecting = useRef(false);
  const connectedOnce = useRef(false);
  
  useEffect(() => {
    if (isConnecting.current) {
      return;
    }

    let cancelled = false;
    
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1] || '';

    isConnecting.current = true;
    dispatch(setWsConnectionState('connecting'));
    
    wsManager.connect(groupId, token)
      .then(() => {
        if (cancelled) {
          return;
        }
      })
      .then(() => {
        if (!cancelled) {
          connectedOnce.current = true;
          
          // Отправляем set_active_chat сразу после подключения
          wsManager.sendMessage({ action: 'set_active_chat', group_id: groupId });
          
          dispatch(setWsConnected(true));
          dispatch(setWsConnectionState('connected'));
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch(setWsConnected(false));
          dispatch(setWsConnectionState('disconnected'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          isConnecting.current = false;
        }
      });
    
    wsManager.setMessageHandler((data) => {
      if (data && typeof data === 'object' && 'type' in data) {
        const messageData = data as { type: string; status?: string };
        if (messageData.type === 'connection_status' && messageData.status === 'connected_via_http') {
          dispatch(setWsConnected(true));
          dispatch(setWsConnectionState('connected'));
          return;
        }
      }

      dispatch(handleWebSocketMessage(data));
    });
    
    return () => {
      cancelled = true;

      if (connectedOnce.current) {
        // Send clear_active_chat before disconnecting
        if (wsManager.isConnected()) {
          wsManager.sendMessage({ action: 'clear_active_chat' });
        }
        wsManager.disconnect();
      }

      isConnecting.current = false;
      dispatch(setWsConnected(false));
      dispatch(setWsConnectionState('disconnected'));
    };
  }, [groupId, dispatch]);

  const sendMessage = useCallback(async (text: string, fileUrl?: string, fileType?: string) => {
    try {
      const payload: Record<string, unknown> = {
        group_id: groupId,
        text,
      };

      if (fileUrl) payload.file_url = fileUrl;
      if (fileType) payload.file_type = fileType;

      wsManager.sendMessage(payload);
      dispatch(resetUnreadCount(groupId));
    } catch {
      // Handle error silently
    }
  }, [groupId, dispatch]);

  const sendTyping: SendTypingFn = useCallback(() => {
    return;
  }, []);

  const getConnectionStatus = useCallback(() => {
    if (!wsManager.isWebSocketEnabled()) {
      return 'WebSocket недоступен';
    }

    if (wsManager.isConnected() && wsManager.isWebSocketEnabled()) {
      return 'Подключено';
    }

    // Если isConnected через HTTP fallback
    if (wsManager.isConnected() && !wsManager.isWebSocketEnabled()) {
      return 'Подключено (HTTP)';
    }

    switch (wsManager.getReadyState()) {
      case WebSocket.CONNECTING:
        return 'Подключение...';
      case WebSocket.OPEN:
        return 'Подключено';
      case WebSocket.CLOSING:
        return 'Закрывается...';
      case WebSocket.CLOSED:
        return 'Отключено';
      default:
        return 'Подключено'; 
    }
  }, []);

  return {
    sendMessage,
    sendTyping,
    getConnectionStatus,
    isConnected: wsManager.isConnected()
  };
};
