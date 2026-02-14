// src/components/Chat/MessageList.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import { useGetMessagesQuery, useGetGroupDetailFullQuery, useEditMessageMutation, useDeleteMessageMutation } from '../../../../../redux/api/chat';
import styles from './MessageList.module.scss';
import { Message } from '../../../../../redux/api/chat/types';

interface MessageListProps {
  groupId: number;
}

const MessageList: React.FC<MessageListProps> = ({ groupId }) => {
  const dispatch = useDispatch();
  const { messages } = useSelector((state: RootState) => state.chat);
  const user = useSelector((state: RootState) => state.user);
  
  const [editMessage] = useEditMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showMenuId, setShowMenuId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    data: messagesData,
    isLoading,
    error,
  } = useGetMessagesQuery(
    { groupId, limit: 50 },
    {
      skip: !groupId,
      refetchOnMountOrArgChange: true,
    }
  );

  const { data: groupDetail } = useGetGroupDetailFullQuery(groupId, {
    skip: !groupId,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set messages from API response
  useEffect(() => {
    if (messagesData) {
      dispatch({
        type: 'chat/setMessages',
        payload: {
          groupId,
          messages: messagesData.items,
          hasMore: messagesData.has_more,
        },
      });
    }
  }, [messagesData, groupId, dispatch]);

  // Auto scroll to bottom on new messages
  const currentMessages = messages[groupId];
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  // Mark messages as read when they are visible
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (isNearBottom && messages[groupId]?.length > 0) {
          const lastMessage = messages[groupId][messages[groupId].length - 1];
          if (lastMessage) {
            // Mark as read logic would go here
          }
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages, groupId, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenuId && !(event.target as Element).closest(`.${styles.messageMenu}`)) {
        setShowMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuId]);

  const handleEditMessage = async () => {
    if (editingMessageId && editingText.trim()) {
      try {
        await editMessage({ messageId: editingMessageId, text: editingText.trim() }).unwrap();
        setEditingMessageId(null);
        setEditingText('');
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId).unwrap();
      setShowMenuId(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
    setShowMenuId(null);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const formatTime = (dateString: string) => {
    // Сервер отдаёт UTC без Z, парсим как UTC
    const date = new Date(dateString + 'Z');
    return date.toLocaleTimeString('ru-RU', { 
      timeZone: 'Asia/Bishkek',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'Z');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const groupMessagesByDate = (messageList: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messageList.forEach(message => {
      const date = new Date(message.created_date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.user_id === user?.id;
    const isDeleted = message.is_deleted;
    const isEdited = message.edited_at && !isDeleted;
    const isEditing = editingMessageId === message.id;

    const username =
      groupDetail?.members?.find((m) => m.user_id === message.user_id)?.username ||
      `Пользователь ${message.user_id}`;

    const avatarLetter = username.charAt(0).toUpperCase();

    return (
      <div
        key={message.id}
        className={`${styles.message} ${isOwn ? styles.own : styles.other}`}
      >
        {!isOwn && (
          <div className={styles.messageAvatar}>
            <div className={styles.avatarPlaceholder}>
              {avatarLetter || '?'}
            </div>
          </div>
        )}
        
        <div className={styles.messageContent}>
          <div className={styles.messageHeader}>
            <span className={styles.messageAuthor}>
              {username}
            </span>
            <div className={styles.messageTimeWrapper}>
              <span className={styles.messageTime}>
                {formatTime(message.created_date)}
              </span>
              {isOwn && !isDeleted && (
                <div className={styles.messageMenu}>
                  <button
                    className={styles.menuButton}
                    onClick={() => setShowMenuId(showMenuId === message.id ? null : message.id)}
                  >
                    ⋯
                  </button>
                  {showMenuId === message.id && (
                    <div className={styles.menuDropdown}>
                      <button
                        className={styles.menuItem}
                        onClick={() => startEditing(message)}
                      >
                        Изменить
                      </button>
                      <button
                        className={styles.menuItem}
                        onClick={() => handleDeleteMessage(message.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className={`${styles.messageBubble} ${isDeleted ? styles.deleted : ''}`}>
            {isDeleted ? (
              <span className={styles.deletedText}>Сообщение удалено</span>
            ) : isEditing ? (
              <div className={styles.editContainer}>
                <textarea
                  className={styles.editInput}
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') cancelEditing();
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEditMessage();
                    }
                  }}
                  autoFocus
                />
                <div className={styles.editActions}>
                  <button className={styles.editButton} onClick={handleEditMessage}>
                    Сохранить
                  </button>
                  <button className={styles.editButton} onClick={cancelEditing}>
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className={styles.messageText}>{message.text}</p>
                {message.file_url && (
                  <div className={styles.messageFile}>
                    {message.file_type?.startsWith('image/') ? (
                      <img 
                        src={message.file_url} 
                        alt="Shared image"
                        className={styles.sharedImage}
                        onClick={() => window.open(message.file_url, '_blank')}
                      />
                    ) : (
                      <a 
                        href={message.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.fileLink}
                      >
                        📎 Открыть файл
                      </a>
                    )}
                  </div>
                )}
                {isEdited && (
                  <span className={styles.editedIndicator}>изменено</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDateSeparator = (date: string) => (
    <div key={date} className={styles.dateSeparator}>
      <span className={styles.dateText}>{formatDate(date)}</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className={styles.messageList}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Загрузка сообщений...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.messageList}>
        <div className={styles.error}>
          <span>Не удалось загрузить сообщения</span>
          <button onClick={() => window.location.reload()}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  const groupMessages = messages[groupId] || [];
  const groupedMessages = groupMessagesByDate(groupMessages);

  return (
    <div className={styles.messageList} ref={containerRef}>
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <React.Fragment key={date}>
          {renderDateSeparator(date)}
          {dateMessages.map(renderMessage)}
        </React.Fragment>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
