// src/redux/slices/notificationsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Определяем константы для типов уведомлений
export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  GROUP_CREATED: 'group_created',
  GROUP_UPDATED: 'group_updated',
  GROUP_DELETED: 'group_deleted'
} as const;

type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  groupId?: number;
  senderId?: number;
}

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
}

// Типы для payload действий
type AddNotificationPayload = Omit<Notification, 'id' | 'timestamp' | 'read'>;
type MarkAsReadPayload = string;

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<AddNotificationPayload>) => {
      // Убираем console.log в production для SEO и производительности
      if (process.env.NODE_ENV === 'development') {
        console.log('🔔 [NOTIFICATIONS] addNotification called with:', action.payload);
      }
      
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
      
      // Добавляем новое уведомление в начало списка
      state.notifications.unshift(notification);
      state.unreadCount += 1;
    },
    
    markAsRead: (state, action: PayloadAction<MarkAsReadPayload>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        // Убеждаемся, что счетчик не отрицательный
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllAsRead: (state) => {
      // Отмечаем все уведомления как прочитанные
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    
    clearNotifications: (state) => {
      // Очищаем все уведомления
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

export default notificationsSlice.reducer;
