// src/redux/slices/notificationsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'message' | 'group_created' | 'group_updated' | 'group_deleted';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  groupId?: number;
  senderId?: number;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: action.payload.type,
        title: action.payload.title,
        message: action.payload.message,
        timestamp: Date.now(),
        read: false,
        groupId: action.payload.groupId,
        senderId: action.payload.senderId,
      };
      
      state.notifications.unshift(notification);
      state.unreadCount += 1;
    },
    
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} = notificationsSlice.actions;

export type { Notification };
export default notificationsSlice.reducer;
