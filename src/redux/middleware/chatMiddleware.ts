// src/redux/middleware/chatMiddleware.ts
import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { addIncomingMessage } from '../slices/chatSlice';
import { WebSocketMessage, Message } from '../api/chat/types';

export const chatMiddleware: Middleware<unknown, RootState> = 
  (store) => (next) => (action: unknown) => {
    // Пропускаем все действия через middleware
    const result = next(action);

    // Если это WebSocket сообщение, обрабатываем его с проверкой user_id
    if (typeof action === 'object' && action !== null && 'type' in action && action.type === 'chat/handleWebSocketMessage') {
      const state = store.getState() as RootState;
      const currentUserId = state.user.id;
      
      // Если user.id null, пропускаем обработку
      if (!currentUserId) {
        console.log('⚠️ [chatMiddleware] Текущий пользователь ID не определен, пропускаем обработку');
        return result;
      }
      
      const payload = (action as unknown as { payload: unknown }).payload;
      console.log('🔍 [chatMiddleware] Обработка WebSocket сообщения:', payload);
      console.log('🔍 [chatMiddleware] Текущий пользователь ID:', currentUserId);

      // Проверяем backend формат
      if (payload && typeof payload === 'object' && 'event' in payload) {
        const backendPayload = payload as { event: string; [key: string]: unknown };
        
        if (backendPayload.event === 'message' && backendPayload.message) {
          const message = backendPayload.message as Message;
          
          if (message.group_id && message.user_id !== undefined) {
            console.log('📨 [chatMiddleware] Новое сообщение:', {
              groupId: message.group_id,
              userId: message.user_id,
              currentUserId,
              isOwnMessage: message.user_id === currentUserId
            });
            
            // Используем новый action с проверкой user_id
            store.dispatch(addIncomingMessage({
              groupId: message.group_id,
              message,
              currentUserId
            }));
            
            // Предотвращаем дальнейшую обработку в handleWebSocketMessage
            return result;
          }
        }
      }

      // Проверяем legacy формат
      const legacyMessage = payload as WebSocketMessage;
      if (legacyMessage.type === 'message' && legacyMessage.data && legacyMessage.group_id) {
        const message = legacyMessage.data as Message;
        
        if (message.user_id !== undefined) {
          console.log('📨 [chatMiddleware] Новое сообщение (legacy):', {
            groupId: legacyMessage.group_id,
            userId: message.user_id,
            currentUserId,
            isOwnMessage: message.user_id === currentUserId
          });
          
          // Используем новый action с проверкой user_id
          store.dispatch(addIncomingMessage({
            groupId: legacyMessage.group_id,
            message,
            currentUserId
          }));
          
          // Предотвращаем дальнейшую обработку в handleWebSocketMessage
          return result;
        }
      }
    }

    return result;
  };
