// src/components/NotificationsPanel.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { markAsRead, markAllAsRead, clearNotifications } from '@/redux/slices/notificationsSlice';
import { Notification } from '@/redux/slices/notificationsSlice';
import styles from './NotificationsPanel.module.scss';

const NotificationsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notifications);
  const [isOpen, setIsOpen] = useState(false);

  // Автоматически закрываем уведомления при входе в чат
  const { activeGroupId } = useSelector((state: RootState) => state.chat);
  
  useEffect(() => {
    if (activeGroupId && isOpen) {
      setIsOpen(false);
    }
  }, [activeGroupId, isOpen]);

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleClearNotifications = () => {
    dispatch(clearNotifications());
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'только что';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} минут назад`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} часов назад`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} дней назад`;
    }
  };

  return (
    <div className={styles.notificationsPanel}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <span className={styles.title}>Уведомления</span>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
        <span className={styles.toggle}>{isOpen ? '▼' : '▶'}</span>
      </div>
      
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Уведомления</span>
            <div className={styles.actions}>
              <button 
                className={styles.actionButton}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                Отметить все как прочитанные
              </button>
              <button 
                className={styles.actionButton}
                onClick={handleClearNotifications}
              >
                Очистить
              </button>
            </div>
          </div>
          
          <div className={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📭</span>
                <span>Нет уведомлений</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notification} ${!notification.read ? styles.unread : ''}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className={styles.notificationIcon}>
                    {notification.type === 'message' && '💬'}
                    {notification.type === 'group_created' && '👥'}
                    {notification.type === 'group_updated' && '📝'}
                    {notification.type === 'group_deleted' && '🗑️'}
                  </div>
                  
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationHeader}>
                      <span className={styles.notificationTitle}>{notification.title}</span>
                      <span className={styles.notificationTime}>
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <div className={styles.notificationMessage}>
                      {notification.message}
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className={styles.unreadDot}></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
