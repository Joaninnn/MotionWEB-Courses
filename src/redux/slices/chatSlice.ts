// src/redux/slices/chatSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatItem, Message, GroupMember, WebSocketMessage } from '../api/chat/types';

export interface TypingUser {
  user_id: number;
  username: string;
  is_typing: boolean;
  timeout?: NodeJS.Timeout;
}

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
  
  // Group members
  groupMembers: Record<number, GroupMember[]>;
  
  // Typing indicators
  typingUsers: Record<number, TypingUser[]>;
  
  // Connection status
  wsConnected: boolean;
  wsConnectionState: 'disconnected' | 'connecting' | 'connected' | 'closing' | 'closed' | 'unknown';
  
  // Unread counts
  unreadCounts: Record<number, number>;
  
  // UI state
  messageInput: string;
  isTyping: boolean;
  uploadingFile: boolean;
}

const initialState: ChatState = {
  activeGroupId: null,
  activeGroupTitle: '',
  messages: {},
  loadingMessages: {},
  hasMoreMessages: {},
  chats: [],
  chatsLoading: false,
  groupMembers: {},
  typingUsers: {},
  wsConnected: false,
  wsConnectionState: 'disconnected',
  unreadCounts: {},
  messageInput: '',
  isTyping: false,
  uploadingFile: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Active chat management
    setActiveGroup: (state, action: PayloadAction<{ groupId: number; title: string }>) => {
      const { groupId, title } = action.payload;
      state.activeGroupId = groupId;
      state.activeGroupTitle = title;
    },
    
    clearActiveGroup: (state) => {
      state.activeGroupId = null;
      state.activeGroupTitle = '';
    },
    
    // Messages
    setMessages: (state, action: PayloadAction<{ groupId: number; messages: Message[]; hasMore: boolean }>) => {
      const { groupId, messages, hasMore } = action.payload;
      state.messages[groupId] = messages;
      state.hasMoreMessages[groupId] = hasMore;
      state.loadingMessages[groupId] = false;
    },
    
    addMessages: (state, action: PayloadAction<{ groupId: number; messages: Message[] }>) => {
      const { groupId, messages } = action.payload;
      if (!state.messages[groupId]) {
        state.messages[groupId] = [];
      }
      state.messages[groupId].unshift(...messages);
    },
    
    addMessage: (state, action: PayloadAction<{ groupId: number; message: Message }>) => {
      const { groupId, message } = action.payload;
      if (!state.messages[groupId]) {
        state.messages[groupId] = [];
      }
      state.messages[groupId].push(message);
      
      // Update last message in chats list
      const chatIndex = state.chats.findIndex(chat => chat.group_id === groupId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = message;
        // Increment unread count if this is not the active chat
        if (state.activeGroupId !== groupId) {
          state.chats[chatIndex].unread_count += 1;
          state.unreadCounts[groupId] = (state.unreadCounts[groupId] || 0) + 1;
        }
      }
    },
    
    updateMessage: (state, action: PayloadAction<{ groupId: number; messageId: number; text: string; editedAt: string }>) => {
      const { groupId, messageId, text, editedAt } = action.payload;
      const message = state.messages[groupId]?.find(m => m.id === messageId);
      if (message) {
        message.text = text;
        message.edited_at = editedAt;
      }
    },
    
    deleteMessage: (state, action: PayloadAction<{ groupId: number; messageId: number }>) => {
      const { groupId, messageId } = action.payload;
      const message = state.messages[groupId]?.find(m => m.id === messageId);
      if (message) {
        message.is_deleted = true;
        message.text = 'Message deleted';
      }
    },
    
    setLoadingMessages: (state, action: PayloadAction<{ groupId: number; loading: boolean }>) => {
      state.loadingMessages[action.payload.groupId] = action.payload.loading;
    },
    
    // Chats list
    setChats: (state, action: PayloadAction<ChatItem[]>) => {
      state.chats = action.payload;
      state.chatsLoading = false;
      
      // Update unread counts
      action.payload.forEach(chat => {
        state.unreadCounts[chat.group_id] = chat.unread_count;
      });
    },
    
    setChatsLoading: (state, action: PayloadAction<boolean>) => {
      state.chatsLoading = action.payload;
    },
    
    updateChatUnreadCount: (state, action: PayloadAction<{ groupId: number; unreadCount: number }>) => {
      const { groupId, unreadCount } = action.payload;
      state.unreadCounts[groupId] = unreadCount;
      
      const chatIndex = state.chats.findIndex(chat => chat.group_id === groupId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unread_count = unreadCount;
      }
    },
    
    // Group members
    setGroupMembers: (state, action: PayloadAction<{ groupId: number; members: GroupMember[] }>) => {
      state.groupMembers[action.payload.groupId] = action.payload.members;
    },
    
    // Typing indicators
    setTypingUser: (state, action: PayloadAction<{ groupId: number; user: TypingUser }>) => {
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
    
    removeTypingUser: (state, action: PayloadAction<{ groupId: number; userId: number }>) => {
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
    
    setWsConnectionState: (state, action: PayloadAction<ChatState['wsConnectionState']>) => {
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
          case 'connected':
            state.wsConnected = true;
            state.wsConnectionState = 'connected';
            break;

          case 'message': {
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

          case 'read_receipt':
            // Optional: update unread counts/read state if needed
            break;

          case 'error':
            state.wsConnected = false;
            state.wsConnectionState = 'disconnected';
            break;
        }

        return;
      }

      // Legacy format (kept for compatibility): { type: 'message', group_id, data }
      const message = payload as WebSocketMessage;
      switch (message.type) {
        case 'message':
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

        case 'message_edited':
          if (message.data && message.group_id) {
            const editedMessage = message.data as Message;
            const msg = state.messages[message.group_id]?.find(m => m.id === editedMessage.id);
            if (msg) {
              msg.text = editedMessage.text;
              msg.edited_at = editedMessage.edited_at;
            }
          }
          break;

        case 'message_deleted':
          if (message.data && message.group_id) {
            const deletedMessage = message.data as Message;
            const msg = state.messages[message.group_id]?.find(m => m.id === deletedMessage.id);
            if (msg) {
              msg.is_deleted = true;
              msg.text = 'Message deleted';
            }
          }
          break;

        case 'typing':
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
  updateChatUnreadCount,
  setGroupMembers,
  setTypingUser,
  removeTypingUser,
  setWsConnected,
  setWsConnectionState,
  setMessageInput,
  setIsTyping,
  setUploadingFile,
  handleWebSocketMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
