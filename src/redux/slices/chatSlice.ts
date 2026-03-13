// src/redux/slices/chatSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatItem, Message, GroupMember, WebSocketMessage } from '../api/chat/types';

// Определяем константы для типов соединения
export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  CLOSING: 'closing',
  CLOSED: 'closed',
  UNKNOWN: 'unknown'
} as const;

type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];

// Определяем константы для событий WebSocket
export const WS_EVENTS = {
  CONNECTED: 'connected',
  MESSAGE: 'message',
  READ_RECEIPT: 'read_receipt',
  ERROR: 'error',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  TYPING: 'typing'
} as const;

export interface TypingUser {
  user_id: number;
  username: string;
  is_typing: boolean;
  timeout?: NodeJS.Timeout;
}

// Создаем более строгие типы для интерфейсов
export interface ChatState {
  // Current active chat
  activeGroupId: number | null;
  activeGroupTitle: string;
  
  // Messages
  messages: Record<number, Message[]>;
  loadingMessages: Record<number, boolean>;
  hasMoreMessages: Record<number, boolean>;
  
  // Chats list
  chats: ChatItem[];
  chatsLoading: boolean;
  
  // Unread counts override (для постоянного сброса счетчиков)
  unreadCountOverrides: Record<number, number>;
  
  // Group members
  groupMembers: Record<number, GroupMember[]>;
  
  // Typing indicators
  typingUsers: Record<number, TypingUser[]>;
  
  // Connection status
  wsConnected: boolean;
  wsConnectionState: ConnectionState;
  
  // UI state
  messageInput: string;
  isTyping: boolean;
  uploadingFile: boolean;
}

// Типы для payload действий
type SetActiveGroupPayload = { groupId: number; title: string };
type SetMessagesPayload = { groupId: number; messages: Message[]; hasMore: boolean };
type AddMessagesPayload = { groupId: number; messages: Message[] };
type AddMessagePayload = { groupId: number; message: Message };
type UpdateMessagePayload = { groupId: number; messageId: number; text: string; editedAt: string };
type DeleteMessagePayload = { groupId: number; messageId: number };
type SetLoadingMessagesPayload = { groupId: number; loading: boolean };
type SetGroupMembersPayload = { groupId: number; members: GroupMember[] };
type SetTypingUserPayload = { groupId: number; user: TypingUser };
type RemoveTypingUserPayload = { groupId: number; userId: number };

const initialState: ChatState = {
  activeGroupId: null,
  activeGroupTitle: '',
  messages: {},
  loadingMessages: {},
  hasMoreMessages: {},
  chats: [],
  chatsLoading: false,
  unreadCountOverrides: {},
  groupMembers: {},
  typingUsers: {},
  wsConnected: false,
  wsConnectionState: CONNECTION_STATES.DISCONNECTED,
  messageInput: '',
  isTyping: false,
  uploadingFile: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Active chat management
    setActiveGroup: (state, action: PayloadAction<SetActiveGroupPayload>) => {
      const { groupId, title } = action.payload;
      state.activeGroupId = groupId;
      state.activeGroupTitle = title;
    },
    
    clearActiveGroup: (state) => {
      state.activeGroupId = null;
      state.activeGroupTitle = '';
    },
    
    // Messages
    setMessages: (state, action: PayloadAction<SetMessagesPayload>) => {
      const { groupId, messages, hasMore } = action.payload;
      state.messages[groupId] = messages;
      state.hasMoreMessages[groupId] = hasMore;
      state.loadingMessages[groupId] = false;
    },
    
    addMessages: (state, action: PayloadAction<AddMessagesPayload>) => {
      const { groupId, messages } = action.payload;
      if (!state.messages[groupId]) {
        state.messages[groupId] = [];
      }
      state.messages[groupId].unshift(...messages);
    },
    
    addMessage: (state, action: PayloadAction<AddMessagePayload>) => {
      const { groupId, message } = action.payload;
      if (!state.messages[groupId]) {
        state.messages[groupId] = [];
      }
      state.messages[groupId].push(message);
      
      // Update last message in chats list
      const chatIndex = state.chats.findIndex(chat => chat.group_id === groupId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = message;
      }
    },
    
    updateMessage: (state, action: PayloadAction<UpdateMessagePayload>) => {
      const { groupId, messageId, text, editedAt } = action.payload;
      const message = state.messages[groupId]?.find(m => m.id === messageId);
      if (message) {
        message.text = text;
        message.edited_at = editedAt;
      }
    },
    
    deleteMessage: (state, action: PayloadAction<DeleteMessagePayload>) => {
      const { groupId, messageId } = action.payload;
      const message = state.messages[groupId]?.find(m => m.id === messageId);
      if (message) {
        message.is_deleted = true;
        message.text = 'Message deleted';
      }
    },
    
    setLoadingMessages: (state, action: PayloadAction<SetLoadingMessagesPayload>) => {
      state.loadingMessages[action.payload.groupId] = action.payload.loading;
    },
    
    // Chats list
    setChats: (state, action: PayloadAction<ChatItem[]>) => {
      state.chats = action.payload;
      state.chatsLoading = false;
    },
    
    setChatsLoading: (state, action: PayloadAction<boolean>) => {
      state.chatsLoading = action.payload;
    },
    
    
    // Group members
    setGroupMembers: (state, action: PayloadAction<SetGroupMembersPayload>) => {
      state.groupMembers[action.payload.groupId] = action.payload.members;
    },
    
    // Typing indicators
    setTypingUser: (state, action: PayloadAction<SetTypingUserPayload>) => {
      const { groupId, user } = action.payload;
      if (!state.typingUsers[groupId]) {
        state.typingUsers[groupId] = [];
      }
      
      // Remove existing typing for this user
      state.typingUsers[groupId] = state.typingUsers[groupId].filter(
        u => u.user_id !== user.user_id
      );
      
      // Add new typing indicator if user is typing
      if (user.is_typing) {
        state.typingUsers[groupId].push(user);
        
        // Auto-remove typing indicator after 3 seconds
        if (user.timeout) {
          clearTimeout(user.timeout);
        }
        user.timeout = setTimeout(() => {
          // This will be handled in the component or via WebSocket message
        }, 3000);
      }
    },
    
    removeTypingUser: (state, action: PayloadAction<RemoveTypingUserPayload>) => {
      const { groupId, userId } = action.payload;
      if (state.typingUsers[groupId]) {
        state.typingUsers[groupId] = state.typingUsers[groupId].filter(
          u => u.user_id !== userId
        );
      }
    },
    
    // WebSocket connection
    setWsConnected: (state, action: PayloadAction<boolean>) => {
      state.wsConnected = action.payload;
    },
    
    setWsConnectionState: (state, action: PayloadAction<ConnectionState>) => {
      state.wsConnectionState = action.payload;
    },
    
    // UI state
    setMessageInput: (state, action: PayloadAction<string>) => {
      state.messageInput = action.payload;
    },
    
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    
    setUploadingFile: (state, action: PayloadAction<boolean>) => {
      state.uploadingFile = action.payload;
    },
    
    // WebSocket message handlers
    handleWebSocketMessage: (state, action: PayloadAction<unknown>) => {
      const payload = action.payload;

      // Backend format: { event: 'connected'|'message'|'read_receipt'|'error', ... }
      if (payload && typeof payload === 'object' && 'event' in payload) {
        const backendPayload = payload as { event: string; [key: string]: unknown };

        switch (backendPayload.event) {
          case WS_EVENTS.CONNECTED:
            state.wsConnected = true;
            state.wsConnectionState = CONNECTION_STATES.CONNECTED;
            break;

          case WS_EVENTS.MESSAGE: {
            const msg = (backendPayload as { message?: Message }).message;
            if (!msg || typeof msg.group_id !== 'number') break;

            const groupId = msg.group_id;
            if (!state.messages[groupId]) {
              state.messages[groupId] = [];
            }
            state.messages[groupId].push(msg);

            const chatIndex = state.chats.findIndex(chat => chat.group_id === groupId);
            if (chatIndex !== -1) {
              state.chats[chatIndex].last_message = msg;
            }
            break;
          }

          case WS_EVENTS.READ_RECEIPT:
            // Optional: update unread counts/read state if needed
            break;

          case WS_EVENTS.ERROR:
            state.wsConnected = false;
            state.wsConnectionState = CONNECTION_STATES.DISCONNECTED;
            break;
        }

        return;
      }

      // Legacy format (kept for compatibility): { type: 'message', group_id, data }
      const message = payload as WebSocketMessage;
      switch (message.type) {
        case WS_EVENTS.MESSAGE:
          if (message.data && message.group_id) {
            if (!state.messages[message.group_id]) {
              state.messages[message.group_id] = [];
            }
            state.messages[message.group_id].push(message.data as Message);

            const chatIndex = state.chats.findIndex(chat => chat.group_id === message.group_id);
            if (chatIndex !== -1) {
              state.chats[chatIndex].last_message = message.data as Message;
            }
          }
          break;

        case WS_EVENTS.MESSAGE_EDITED:
          if (message.data && message.group_id) {
            const editedMessage = message.data as Message;
            const msg = state.messages[message.group_id]?.find(m => m.id === editedMessage.id);
            if (msg) {
              msg.text = editedMessage.text;
              msg.edited_at = editedMessage.edited_at;
            }
          }
          break;

        case WS_EVENTS.MESSAGE_DELETED:
          if (message.data && message.group_id) {
            const deletedMessage = message.data as Message;
            const msg = state.messages[message.group_id]?.find(m => m.id === deletedMessage.id);
            if (msg) {
              msg.is_deleted = true;
              msg.text = 'Message deleted';
            }
          }
          break;

        case WS_EVENTS.TYPING:
          if (message.data && message.group_id) {
            const typingData = message.data as TypingUser;
            if (!state.typingUsers[message.group_id]) {
              state.typingUsers[message.group_id] = [];
            }

            state.typingUsers[message.group_id] = state.typingUsers[message.group_id].filter(
              u => u.user_id !== typingData.user_id
            );

            if (typingData.is_typing) {
              state.typingUsers[message.group_id].push(typingData);
            }
          }
          break;
      }
    },

    resetUnreadCount: (state, action: PayloadAction<number>) => {
      const groupId = action.payload;
      // УДАЛЯЕМ override чтобы счетчик мог обновиться с сервера
      delete state.unreadCountOverrides[groupId];
      
      // Также обновляем в текущем списке чатов если есть
      const chatIndex = state.chats.findIndex(chat => chat.group_id === groupId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unread_count = 0;
      }
      console.log(`Счетчик непрочитанных для чата ${groupId} сброшен (override удален)`);
    },

    clearUnreadCountOverrides: (state) => {
      state.unreadCountOverrides = {};
      console.log('Все overrides счетчиков очищены');
    },
  },
});

export const {
  setActiveGroup,
  clearActiveGroup,
  setMessages,
  addMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  setLoadingMessages,
  setChats,
  setChatsLoading,
  setGroupMembers,
  setTypingUser,
  removeTypingUser,
  setWsConnected,
  setWsConnectionState,
  setMessageInput,
  setIsTyping,
  setUploadingFile,
  handleWebSocketMessage,
  resetUnreadCount,
  clearUnreadCountOverrides,
} = chatSlice.actions;

export default chatSlice.reducer;
