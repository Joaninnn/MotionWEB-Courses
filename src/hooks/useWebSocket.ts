// src/hooks/useWebSocket.ts
import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import {
  handleWebSocketMessage,
  setWsConnected,
  setWsConnectionState,
} from '@/redux/slices/chatSlice';
import { wsManager } from '@/services/websocket';

type SendTypingFn = (isTyping: boolean) => void;

export const useWebSocket = (groupId: number) => {
  const dispatch = useAppDispatch();
  const isConnecting = useRef(false);
  const connectedOnce = useRef(false);
  
  useEffect(() => {
    if (isConnecting.current) return;

    let cancelled = false;
    
    const getToken = () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
      return token;
    };
    
    const token = getToken();
    
    if (!token) {
      console.error('❌ Токен доступа не найден в cookies');
      dispatch(setWsConnected(false));
      dispatch(setWsConnectionState('disconnected'));
      return;
    }
    
    console.log('🔑 Токен найден, подключаемся к группе:', groupId);
    isConnecting.current = true;
    dispatch(setWsConnectionState('connecting'));
    
    // Подключаем WebSocket
    wsManager.connect(groupId, token)
      .then(() => {
        if (cancelled) {
          return;
        }
        connectedOnce.current = true;
        console.log('✅ WebSocket успешно подключен');
        wsManager.sendMessage({ action: 'set_active_chat', group_id: groupId });
        dispatch(setWsConnected(true));
        dispatch(setWsConnectionState('connected'));
      })
      .catch(error => {
        console.error('❌ Ошибка подключения WebSocket:', error);
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
    
    // Устанавливаем обработчик сообщений
    wsManager.setMessageHandler((data) => {
      console.log('📨 Обработка сообщения в useWebSocket:', data);

      dispatch(handleWebSocketMessage(data));
    });
    
    // Очистка при размонтировании
    return () => {
      console.log('🧹 Очистка WebSocket соединения');
      cancelled = true;

      // В dev (React StrictMode) эффекты монтируются/размонтируются дважды.
      // Не закрываем сокет, если соединение ещё не успело установиться.
      if (connectedOnce.current) {
        wsManager.disconnect();
      }

      isConnecting.current = false;
      dispatch(setWsConnected(false));
      dispatch(setWsConnectionState('disconnected'));
    };
  }, [groupId, dispatch]);
  
  const sendMessage = useCallback(async (text: string, fileUrl?: string, fileType?: string) => {
    try {
      if (!wsManager.isConnected()) {
        throw new Error('WebSocket не подключен');
      }

      const payload: Record<string, unknown> = {
        group_id: groupId,
        text,
      };

      if (fileUrl) payload.file_url = fileUrl;
      if (fileType) payload.file_type = fileType;

      wsManager.sendMessage(payload);
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      throw error;
    }
  }, [groupId]);

  const sendTyping: SendTypingFn = useCallback(() => {
    return;
  }, []);
  
  const getConnectionStatus = useCallback(() => {
    const readyState = wsManager.getReadyState();
    switch (readyState) {
      case WebSocket.CONNECTING:
        return 'Подключение...';
      case WebSocket.OPEN:
        return 'Подключено';
      case WebSocket.CLOSING:
        return 'Закрывается...';
      case WebSocket.CLOSED:
        return 'Отключено';
      default:
        return 'Неизвестно';
    }
  }, []);
  
  return { 
    sendMessage,
    sendTyping,
    getConnectionStatus,
    isConnected: wsManager.isConnected()
  };
};