// src/hooks/useWebSocket.ts
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
  
  console.log('🔌 useWebSocket called with groupId:', groupId);
  
  useEffect(() => {
    console.log('🔌 useWebSocket useEffect triggered for groupId:', groupId);
    if (isConnecting.current) {
      console.log('🔌 Already connecting, skipping...');
      return;
    }

    let cancelled = false;
    
    const getToken = () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
      
      console.log('🔍 Поиск токена в cookies:');
      console.log('  Все cookies:', document.cookie);
      console.log('  Найденный токен:', token ? `${token.substring(0, 20)}...` : 'не найден');
      
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
        // Отправляем сообщение только после полного подключения
        setTimeout(() => {
          if (!cancelled && wsManager.isConnected()) {
            wsManager.sendMessage({ action: 'set_active_chat', group_id: groupId });
          }
        }, 100);
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

      // Обрабатываем статус подключения
      if (data && typeof data === 'object' && 'type' in data) {
        const messageData = data as { type: string; status?: string };
        if (messageData.type === 'connection_status' && messageData.status === 'connected_via_http') {
          console.log('✅ Подключено через HTTP fallback');
          dispatch(setWsConnected(true));
          dispatch(setWsConnectionState('connected'));
          return;
        }
      }

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
      const payload: Record<string, unknown> = {
        group_id: groupId,
        text,
      };

      if (fileUrl) payload.file_url = fileUrl;
      if (fileType) payload.file_type = fileType;

      // Всегда пытаемся отправить через wsManager - он сам решит, использовать WebSocket или HTTP
      wsManager.sendMessage(payload);
      
      // Сбрасываем счетчик непрочитанных после отправки сообщения
      dispatch(resetUnreadCount(groupId));
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      // Не выбрасываем ошибку дальше, чтобы не прерывать UI
      console.log('⚠️ Попытка отправки не удалась, но приложение продолжает работать');
    }
  }, [groupId, dispatch]);

  const sendTyping: SendTypingFn = useCallback(() => {
    return;
  }, []);
  
  const getConnectionStatus = useCallback(() => {
    // Если используется HTTP fallback, показываем "Подключено"
    if (!wsManager.isWebSocketEnabled()) {
      return 'Подключено';
    }
    
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
        return 'Подключено'; // По умолчанию считаем подключенным через HTTP
    }
  }, []);
  
  return { 
    sendMessage,
    sendTyping,
    getConnectionStatus,
    isConnected: wsManager.isConnected()
  };
};