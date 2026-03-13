import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatItem, Message, GroupMember, WebSocketMessage } from '../api/chat/types';

export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  CLOSING: 'closing',
  CLOSED: 'closed',
  UNKNOWN: 'unknown'
} as const;

type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];
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

export interface ChatState {
  activeGroupId: number | null;
  activeGroupTitle: string;
  
  messages: Record<number, Message[]>;
  loadingMessages: Record<number, boolean>;
  hasMoreMessages: Record<number, boolean>;
  
  chats: ChatItem[];
  chatsLoading: boolean;
  
  unreadCountOverrides: Record<number, number>;
  
  groupMembers: Record<number, GroupMember[]>;
  
  typingUsers: Record<number, TypingUser[]>;
  
  wsConnected: boolean;
  wsConnectionState: ConnectionState;
  
  messageInput: string;
  isTyping: boolean;
  uploadingFile: boolean;
}

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
    setActiveGroup: (state, action: PayloadAction<SetActiveGroupPayload>) => {
      const { groupId, title } = action.payload;
      state.activeGroupId = groupId;
      state.activeGroupTitle = title;
    },
    
    clearActiveGroup: (state) => {
      state.activeGroupId = null;
      state.activeGroupTitle = '';
    },
    
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
      
      const existingMessageIndex = state.messages[groupId].findIndex(
        msg => msg.id === message.id
      );
      
      if (existingMessageIndex === -1) {
        state.messages[groupId].push(message);
      } else {
        state.messages[groupId][existingMessageIndex] = message;
      }
      
      const chatIndex = state.chats.findIndex(chat => chat.group_id === groupId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = message;
        
        if (message.user_id && state.chats[chatIndex].unread_count > 0) {
        }
      }
    },

    addIncomingMessage: (state, action: PayloadAction<{ groupId: number; message: Message; currentUserId: number }>) => {
      const { groupId, message, currentUserId } = action.payload;
      if (!state.messages[groupId]) {
        state.messages[groupId] = [];
      }
      
      const existingMessageIndex = state.messages[groupId].findIndex(
        msg => msg.id === message.id
      );
      
      if (existingMessageIndex === -1) {
        state.messages[groupId].push(message);
      } else {
        state.messages[groupId][existingMessageIndex] = message;
      }
      
      const chatIndex = state.chats.findIndex(chat => chat.group_id === groupId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = message;
        
        if (message.user_id !== currentUserId) {
          state.chats[chatIndex].unread_count = (state.chats[chatIndex].unread_count || 0) + 1;
        } else {
        }
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
    
    setChats: (state, action: PayloadAction<ChatItem[]>) => {
      state.chats = action.payload;
      state.chatsLoading = false;
    },
    
    setChatsLoading: (state, action: PayloadAction<boolean>) => {
      state.chatsLoading = action.payload;
    },
    
    
    setGroupMembers: (state, action: PayloadAction<SetGroupMembersPayload>) => {
      state.groupMembers[action.payload.groupId] = action.payload.members;
    },
    
    setTypingUser: (state, action: PayloadAction<SetTypingUserPayload>) => {
      const { groupId, user } = action.payload;
      if (!state.typingUsers[groupId]) {
        state.typingUsers[groupId] = [];
      }
      
      state.typingUsers[groupId] = state.typingUsers[groupId].filter(
        u => u.user_id !== user.user_id
      );
      
      if (user.is_typing) {
        state.typingUsers[groupId].push(user);
        
        if (user.timeout) {
          clearTimeout(user.timeout);
        }
        user.timeout = setTimeout(() => {
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
    setWsConnected: (state, action: PayloadAction<boolean>) => {
      state.wsConnected = action.payload;
    },
    
    setWsConnectionState: (state, action: PayloadAction<ConnectionState>) => {
      state.wsConnectionState = action.payload;
    },
    
    setMessageInput: (state, action: PayloadAction<string>) => {
      state.messageInput = action.payload;
    },
    
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    
    setUploadingFile: (state, action: PayloadAction<boolean>) => {
      state.uploadingFile = action.payload;
    },
    
    handleWebSocketMessage: (state, action: PayloadAction<unknown>) => {
      const payload = action.payload;

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
            
            const existingMessageIndex = state.messages[groupId].findIndex(
              m => m.id === msg.id
            );
            
            if (existingMessageIndex === -1) {
              state.messages[groupId].push(msg);
            } else {
              state.messages[groupId][existingMessageIndex] = msg;
            }

            const chatIndex = state.chats.findIndex(chat => chat.group_id === groupId);
            if (chatIndex !== -1) {
              state.chats[chatIndex].last_message = msg;
            }
            break;
          }

          case WS_EVENTS.READ_RECEIPT:
            break;

          case WS_EVENTS.ERROR:
            state.wsConnected = false;
            state.wsConnectionState = CONNECTION_STATES.DISCONNECTED;
            break;
        }

        return;
      }

      const message = payload as WebSocketMessage;
      switch (message.type) {
        case WS_EVENTS.MESSAGE:
          if (message.data && message.group_id) {
            if (!state.messages[message.group_id]) {
              state.messages[message.group_id] = [];
            }
            
            const msg = message.data as Message;
            const existingMessageIndex = state.messages[message.group_id].findIndex(
              m => m.id === msg.id
            );
            
            if (existingMessageIndex === -1) {
              state.messages[message.group_id].push(msg);
            } else {
              state.messages[message.group_id][existingMessageIndex] = msg;
            }

            const chatIndex = state.chats.findIndex(chat => chat.group_id === message.group_id);
            if (chatIndex !== -1) {
              state.chats[chatIndex].last_message = msg;
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
      
      delete state.unreadCountOverrides[groupId];
      
      const chatIndex = state.chats.findIndex(chat => chat.group_id === groupId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unread_count = 0;
      }
      
    },

    clearUnreadCountOverrides: (state) => {
      state.unreadCountOverrides = {};
    },
  },
});

export const {
  setActiveGroup,
  clearActiveGroup,
  setMessages,
  addMessages,
  addMessage,
  addIncomingMessage,
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
