import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { addIncomingMessage } from '../slices/chatSlice';
import { WebSocketMessage, Message } from '../api/chat/types';

export const chatMiddleware: Middleware<unknown, RootState> = 
  (store) => (next) => (action: unknown) => {
    const result = next(action);

    if (typeof action === 'object' && action !== null && 'type' in action && action.type === 'chat/handleWebSocketMessage') {
      const state = store.getState() as RootState;
      const currentUserId = state.user.id;
      
      if (!currentUserId) {
        return result;
      }
      
      const payload = (action as unknown as { payload: unknown }).payload;

      if (payload && typeof payload === 'object' && 'event' in payload) {
        const backendPayload = payload as { event: string; [key: string]: unknown };
        
        if (backendPayload.event === 'message' && backendPayload.message) {
          const message = backendPayload.message as Message;
          
          if (message.group_id && message.user_id !== undefined) {
           
            
            store.dispatch(addIncomingMessage({
              groupId: message.group_id,
              message,
              currentUserId
            }));
            
            return result;
          }
        }
      }

      const legacyMessage = payload as WebSocketMessage;
      if (legacyMessage.type === 'message' && legacyMessage.data && legacyMessage.group_id) {
        const message = legacyMessage.data as Message;
        
        if (message.user_id !== undefined) {
          
          
          store.dispatch(addIncomingMessage({
            groupId: legacyMessage.group_id,
            message,
            currentUserId
          }));
          
          return result;
        }
      }
    }

    return result;
  };
