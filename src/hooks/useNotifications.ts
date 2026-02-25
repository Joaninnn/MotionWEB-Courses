// src/hooks/useNotifications.ts
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { addNotification, markAsRead, markAllAsRead } from '@/redux/slices/notificationsSlice';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notifications);

  const addMessageNotification = (groupId: number, title: string, message: string, senderId?: number) => {
    dispatch(addNotification({
      type: 'message',
      title,
      message,
      groupId,
      senderId,
    }));
  };

  const addGroupNotification = (title: string, message: string) => {
    dispatch(addNotification({
      type: 'group_created',
      title,
      message,
    }));
  };

  return {
    notifications,
    unreadCount,
    markAsRead: (id: string) => dispatch(markAsRead(id)),
    markAllAsRead: () => dispatch(markAllAsRead()),
    addMessageNotification,
    addGroupNotification,
  };
};
