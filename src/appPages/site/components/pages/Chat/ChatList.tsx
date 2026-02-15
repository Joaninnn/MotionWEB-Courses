// src/components/Chat/ChatList.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMyChatsQuery } from '../../../../../redux/api/chat';
import { setActiveGroup } from '../../../../../redux/slices/chatSlice';
import { RootState } from '../../../../../redux/store';
import styles from './ChatList.module.scss';

interface ChatListProps {
  onSelectChat: (groupId: number, title: string) => void;
  activeGroupId: number;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, activeGroupId }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const { data: chats = [], isLoading, error } = useGetMyChatsQuery();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Функция для форматирования названия чата
  const formatChatTitle = (title: string) => {
    // Если название начинается с 'course:', заменяем на 'группа:'
    if (title.startsWith('course:')) {
      return title.replace('course:', 'группа:');
    }
    return title;
  };

  // Фильтруем чаты по chat_group_id пользователя
  const filteredChats = chats.filter(chat => {
    // Если у пользователя нет chat_group_id, показываем все чаты
    if (!user.chat_group_id) return true;
    
    // Фильтруем по group_id в чате
    console.log(' Чат:', chat.title, 'Group ID:', chat.group_id, 'User chat_group_id:', user.chat_group_id);
    console.log(' Курс пользователя:', user.course);
    
    return chat.group_id === user.chat_group_id;
  });

  // Сохраняем позицию скролла при переключении чатов
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      // Восстанавливаем позицию скролла из localStorage
      const savedScrollTop = localStorage.getItem('chatListScrollTop');
      if (savedScrollTop) {
        scrollContainer.scrollTop = parseInt(savedScrollTop, 10);
      }
    }
  }, [filteredChats]);

  // Логирование для проверки автоматического создания групп
  useEffect(() => {
    console.log(' Все чаты с эндпоинта /chats/my:', chats);
    console.log(' Отфильтрованные чаты:', filteredChats);
    console.log(' Chat group ID пользователя:', user.chat_group_id);
    console.log(' Курс пользователя:', user.course);
    console.log(' Количество чатов:', filteredChats.length);
    console.log(' Загрузка:', isLoading);
    console.log(' Ошибка:', error);
    
    if (filteredChats.length > 0) {
      console.log(' Группы автоматически созданы! Пример чата:', filteredChats[0]);
    } else if (!isLoading && !error) {
      console.log(' Группы не найдены. Возможно, они не создаются автоматически.');
    }
  }, [filteredChats, chats, isLoading, error, user.chat_group_id, user.course]);

  const handleSelectChat = (groupId: number, title: string) => {
    // Сохраняем текущую позицию скролла
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
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { 
        timeZone: 'Asia/Bishkek',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('ru-RU', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
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
        ) : filteredChats.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <p>Чатов еще нет</p>
            <p>Начните диалог, чтобы увидеть его здесь</p>
          </div>
        ) : (
          <div className={styles.chatItems}>
            {filteredChats.map((chat) => (
              <div
                key={chat.group_id}
                className={`${styles.chatItem} ${activeGroupId === chat.group_id ? styles.active : ''}`}
                onClick={() => handleSelectChat(chat.group_id, chat.title)}
              >
                <div className={styles.chatAvatar}>
                  <div className={styles.avatarPlaceholder}>
                    {formatChatTitle(chat.title).charAt(0).toUpperCase()}
                  </div>
                  {chat.is_private && (
                    <div className={styles.privateIndicator}>🔒</div>
                  )}
                </div>
                
                <div className={styles.chatInfo}>
                  <div className={styles.chatHeader}>
                    <h4 className={styles.chatTitle}>{formatChatTitle(chat.title)}</h4>
                    <span className={styles.chatTime}>
                      {chat.last_message ? formatTime(chat.last_message.created_date) : ''}
                    </span>
                  </div>
                  
                  <div className={styles.chatPreview}>
                    <p className={styles.lastMessage}>
                      {chat.last_message && !chat.last_message.is_deleted
                        ? chat.last_message.text
                        : chat.last_message?.is_deleted
                        ? 'Сообщение удалено'
                        : 'Сообщений еще нет'
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
