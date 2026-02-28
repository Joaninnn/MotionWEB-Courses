// src/components/Chat/ChatList.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMyChatsQuery } from '../../../../../redux/api/chat';
import { setActiveGroup } from '../../../../../redux/slices/chatSlice';
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
  const { data: chats = [], isLoading, error } = useGetMyChatsQuery();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Функция для получения имени собеседника для личного чата
  const getChatDisplayName = (chat: ChatItem) => {
    // Если это личный чат (dialog_), пытаемся извлечь имя собеседника
    if (chat.title.startsWith('dialog_') && chat.is_private) {
      // Из названия dialog_X_Y можно определить ID собеседника
      const parts = chat.title.split('_');
      if (parts.length === 3) {
        const userId1 = parseInt(parts[1]);
        const userId2 = parseInt(parts[2]);
        const currentUserId = user.id;
        
        // Определяем ID собеседника
        const partnerId = userId1 === currentUserId ? userId2 : userId1;
        
        // Ищем имя собеседника в других чатах, где он может быть участником
        // const partnerName = findPartnerNameInChats();
        // if (partnerName) {
        //   return partnerName;
        // }
        
        // Используем общий кэш имен
        return getUserNameById(partnerId);
      }
    }
    
    // Для групповых чатов или если не смогли определить, используем форматирование
    return formatChatTitle(chat.title);
  };

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

  // Сортируем чаты по времени последнего сообщения (самые свежие наверху)
  const sortedChats = [...filteredChats].sort((a, b) => {
    // Если у обоих чатов есть последние сообщения, сортируем по времени
    if (a.last_message && b.last_message) {
      return new Date(b.last_message.created_date).getTime() - new Date(a.last_message.created_date).getTime();
    }
    
    // Если только у одного чата есть последнее сообщение, он идет наверх
    if (a.last_message && !b.last_message) {
      return -1;
    }
    
    if (!a.last_message && b.last_message) {
      return 1;
    }
    
    // Если у обоих нет последних сообщений, сортируем по group_id (для стабильности)
    return b.group_id - a.group_id;
  });

  // Сохраняем позицию скролла при переключении чатов
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      // НЕ восстанавливаем позицию скролла при загрузке чатов
      // Пользователь должен сам контролировать скролл
    }
  }, [sortedChats]);

  // Логирование для проверки автоматического создания групп
  useEffect(() => {
    console.log(' Все чаты с эндпоинта /chats/my:', chats);
    console.log(' Отфильтрованные чаты:', filteredChats);
    console.log(' Отсортированные чаты:', sortedChats);
    console.log(' Chat group ID пользователя:', user.chat_group_id);
    console.log(' Курс пользователя:', user.course);
    console.log(' Количество чатов:', sortedChats.length);
    console.log(' Загрузка:', isLoading);
    console.log(' Ошибка:', error);
    
    if (sortedChats.length > 0) {
      console.log(' Группы автоматически созданы! Пример чата:', sortedChats[0]);
    } else if (!isLoading && !error) {
      console.log(' Группы не найдены. Возможно, они не создаются автоматически.');
    }
  }, [sortedChats, filteredChats, chats, isLoading, error, user.chat_group_id, user.course]);

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
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Если сообщение отправлено сегодня
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
    
    // Если сообщение отправлено вчера
    if (diffInDays === 1) {
      return 'вчера';
    }
    
    // Если сообщение отправлено в течение недели
    if (diffInDays < 7) {
      return date.toLocaleDateString('ru-RU', { 
        timeZone: 'Asia/Bishkek',
        weekday: 'short' 
      });
    }
    
    // Для более старых сообщений
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
            {sortedChats.map((chat) => (
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
                              📷 {chat.last_message.text ? chat.last_message.text : 'Фото'}
                            </>
                          ) : (
                            chat.last_message.text || 'Сообщений еще нет'
                          )}
                        </>
                      ) : chat.last_message?.is_deleted ? (
                        'Сообщение удалено'
                      ) : (
                        'Сообщений еще нет'
                      )}
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
