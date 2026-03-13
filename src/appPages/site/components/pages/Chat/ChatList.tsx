'use client';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMyChatsQuery } from '../../../../../redux/api/chat';
import { setActiveGroup, resetUnreadCount, clearUnreadCountOverrides } from '../../../../../redux/slices/chatSlice';
import { RootState } from '../../../../../redux/store';
import { ChatItem } from '../../../../../redux/api/chat/types';
import { getUserNameById } from '../../../../../constants/userNames';
import styles from './ChatList.module.scss';

interface ChatListProps {
  onSelectChat: (groupId: number, title: string) => void;
  activeGroupId: number;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, activeGroupId }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const { unreadCountOverrides } = useSelector((state: RootState) => state.chat);
  const { data: chats = [], isLoading, error } = useGetMyChatsQuery();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user.id || !user.username) return;
    
    const userKey = `unreadCountOverrides_user_${user.id}`;
    const savedOverrides = localStorage.getItem(userKey);
    
    if (savedOverrides) {
      try {
        const overrides = JSON.parse(savedOverrides);
        
        Object.entries(overrides).forEach(([groupId, count]) => {
          dispatch(resetUnreadCount(Number(groupId)));
        });
      } catch (error) {
      }
    } else {
    }
  }, [user.id, user.username, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearUnreadCountOverrides());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!user.id || Object.keys(unreadCountOverrides).length === 0) return;
    
    const storageKey = `unreadCountOverrides_user_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(unreadCountOverrides));
  }, [unreadCountOverrides, user.id]);

  const getChatDisplayName = (chat: ChatItem) => {
    if (chat.title.startsWith('dialog_') && chat.is_private) {
      const parts = chat.title.split('_');
      if (parts.length === 3) {
        const userId1 = parseInt(parts[1]);
        const userId2 = parseInt(parts[2]);
        const currentUserId = user.id;
        
        const partnerId = userId1 === currentUserId ? userId2 : userId1;
        
   
        return getUserNameById(partnerId);
      }
    }
    
    return formatChatTitle(chat.title);
  };

    const formatChatTitle = (title: string) => {
    if (title.startsWith('course:')) {
      return title.replace('course:', 'группа:');
    }
    return title;
  };

  const chatsWithOverrides = chats.map(chat => ({
    ...chat,
    unread_count: unreadCountOverrides[chat.group_id] !== undefined 
      ? unreadCountOverrides[chat.group_id] 
      : chat.unread_count
  }));

  const filteredChats = chatsWithOverrides.filter(chat => {
    if (!user.chat_group_id) return true;
    
    
    const isGroupChat = chat.group_id === user.chat_group_id;
    const isPrivateChat = chat.title.startsWith('dialog_');
    
    return isGroupChat || isPrivateChat;
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.last_message && b.last_message) {
      return new Date(b.last_message.created_date).getTime() - new Date(a.last_message.created_date).getTime();
    }
    
    if (a.last_message && !b.last_message) {
      return -1;
    }
    
    if (!a.last_message && b.last_message) {
      return 1;
    }
    
    return b.group_id - a.group_id;
  });

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
    }
  }, [sortedChats]);

  useEffect(() => {
    
    if (sortedChats.length > 0) {
    } else if (!isLoading && !error) {
    }
  }, [sortedChats, filteredChats, chats, isLoading, error, user.chat_group_id, user.course]);

  useEffect(() => {
    const interval = setInterval(() => {
      chats.forEach(chat => {
        const isOwnLastMessage = chat.last_message && chat.last_message.user_id === user.id;
        
        if (isOwnLastMessage && chat.unread_count > 0) {
          dispatch(resetUnreadCount(chat.group_id));
        }
      });
    }, 500); 

    return () => clearInterval(interval);
  }, [chats, user.id, dispatch]);

  useEffect(() => {
    chats.forEach(chat => {
    });
  }, [chats, unreadCountOverrides]);

  const handleSelectChat = (groupId: number, title: string) => {
    
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      localStorage.setItem('chatListScrollTop', scrollContainer.scrollTop.toString());
    }
    
    dispatch(setActiveGroup({ groupId, title }));
    onSelectChat(groupId, title);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString + 'Z');
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      if (diffInMinutes < 1) {
        return 'только что';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} мин назад`;
      } else if (diffInHours < 12) {
        return `${diffInHours} ч назад`;
      } else {
        return date.toLocaleTimeString('ru-RU', { 
          timeZone: 'Asia/Bishkek',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    }
    
    if (diffInDays === 1) {
      return 'вчера';
    }
    
    if (diffInDays < 7) {
      return date.toLocaleDateString('ru-RU', { 
        timeZone: 'Asia/Bishkek',
        weekday: 'short' 
      });
    }
    
    return date.toLocaleDateString('ru-RU', { 
      timeZone: 'Asia/Bishkek',
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className={styles.chatList}>
        <div className={styles.header}>
          <h3>Чаты</h3>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Загрузка чатов...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.chatList}>
        <div className={styles.header}>
          <h3>Чаты</h3>
        </div>
        <div className={styles.error}>
          <span>Сервер чата временно недоступен</span>
          <p>Попробуйте позже или обратитесь к администратору</p>
          <button onClick={() => window.location.reload()}>
            Обновить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatList}>
      <div className={styles.chatListHeader}>
        <h2>Чаты</h2>
      </div>

      <div className={styles.chatListContent} ref={scrollContainerRef}>
        {isLoading ? (
          <div className={styles.loading}>Загрузка чатов...</div>
        ) : sortedChats.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <p>Чатов еще нет</p>
            <p>Начните диалог, чтобы увидеть его здесь</p>
          </div>
        ) : (
          <div className={styles.chatItems}>
            {sortedChats.map((chat) => {
              const isOwnLastMessage = chat.last_message && chat.last_message.user_id === user.id;
              
              const shouldShowBadge = chat.unread_count !== null && 
                                      chat.unread_count !== undefined && 
                                      typeof chat.unread_count === 'number' && 
                                      chat.unread_count > 0 && 
                                      !isOwnLastMessage;
              
              return (
              <div
                key={chat.group_id}
                className={`${styles.chatItem} ${activeGroupId === chat.group_id ? styles.active : ''}`}
                onClick={() => handleSelectChat(chat.group_id, chat.title)}
              >
                <div className={styles.chatAvatar}>
                  <div className={styles.avatarPlaceholder}>
                    {getChatDisplayName(chat).charAt(0).toUpperCase()}
                  </div>
                  {chat.is_private && (
                    <div className={styles.privateIndicator}>🔒</div>
                  )}
                </div>
                
                <div className={styles.chatInfo}>
                  <div className={styles.chatHeader}>
                    <h4 className={styles.chatTitle}>{getChatDisplayName(chat)}</h4>
                    <span className={styles.chatTime}>
                      {chat.last_message ? formatTime(chat.last_message.created_date) : ''}
                    </span>
                  </div>
                  
                  <div className={styles.chatPreview}>
                    <p className={styles.lastMessage}>
                      {chat.last_message && !chat.last_message.is_deleted ? (
                        <>
                          {chat.last_message.file_url || chat.last_message.attachments?.length ? (
                            <>
                              {chat.last_message.file_url?.includes('audio') ? (
                                <span>🗣️</span>
                              ) : (
                                <span>📷</span>
                              )}
                              {chat.last_message.text ? chat.last_message.text : 'Фото'}
                            </>
                          ) : chat.last_message.text || 'Сообщений еще нет'}
                        </>
                      ) : chat.last_message?.is_deleted ? (
                        'Сообщение удалено'
                      ) : (
                        'Сообщений еще нет'
                      )}
                    </p>
                    {shouldShowBadge && (
                      <div className={styles.unreadBadge}>
                        {Number(chat.unread_count) > 99 ? '99+' : chat.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
