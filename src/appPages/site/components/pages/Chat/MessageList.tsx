// src/components/Chat/MessageList.tsx
'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { useGetMessagesQuery, useGetGroupDetailFullQuery, useEditMessageMutation, useDeleteMessageMutation } from '@/redux/api/chat';
import ImageModal from '@/components/ImageModal/ImageModal';
import VoicePlayer from '@/components/VoicePlayer/VoicePlayer';
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
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null);
  
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
    console.log('📨 Messages data received:', {
      messagesData,
      items: messagesData?.items,
      itemsLength: messagesData?.items?.length,
      groupId
    });
    
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

  // Auto scroll to bottom on new messages, but only if user is at bottom
  const currentMessages = messages[groupId];
  const [isAtBottom, setIsAtBottom] = useState(false); // Изменено на false по умолчанию
  const [hasInitialized, setHasInitialized] = useState(false); // Флаг для первой загрузки
  
  // Скролл вниз только при первой загрузке чата
  useEffect(() => {
    if (currentMessages && currentMessages.length > 0 && !hasInitialized) {
      scrollToBottom();
      setTimeout(() => setHasInitialized(true), 0); // Асинхронное обновление состояния
    }
  }, [currentMessages, hasInitialized]);
  
  // Сбрасываем флаг при смене чата
  useEffect(() => {
    setTimeout(() => setHasInitialized(false), 0); // Асинхронное обновление состояния
  }, [groupId]);
  
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [currentMessages, isAtBottom]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const threshold = 100; // 100px from bottom
      const newIsAtBottom = scrollHeight - scrollTop - clientHeight < threshold;
      
      if (newIsAtBottom !== isAtBottom) {
        setIsAtBottom(newIsAtBottom);
      }
      
      // Mark messages as read logic
      if (newIsAtBottom && messages[groupId]?.length > 0) {
        const lastMessage = messages[groupId][messages[groupId].length - 1];
        if (lastMessage) {
          // Mark as read logic would go here
        }
      }
    }
  }, [messages, groupId, isAtBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

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
                  <button 
                    className={styles.editButton} 
                    onClick={handleEditMessage}
                    style={{
                      background: '#007bff',
                      border: '1px solid #007bff',
                      borderRadius: '10px',
                      color: 'white',
                      padding: '8px 12px'
                    }}
                  >
                    Сохранить
                  </button>
                  <button 
                    className={styles.editButton} 
                    onClick={cancelEditing}
                    style={{
                      background: '#222',
                      border: '1px solid rgb(98, 98, 98)',
                      borderRadius: '10px',
                      color: 'white',
                      padding: '8px 12px'
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className={styles.messageText}>{message.text}</p>
                {(message.file_url || message.attachments) && (
                  <div className={styles.messageFile}>
                    {message.file_url && (
                      <>
                        {message.file_type?.startsWith('image/') ? (
                          <Image 
                            src={message.file_url.startsWith('http') 
                              ? message.file_url 
                              : `${process.env.NEXT_PUBLIC_CHAT_API || 'https://chat.apibackendokukg.space'}${message.file_url}`} 
                            alt="Shared image"
                            width={200}
                            height={200}
                            style={{ objectFit: 'cover' }}
                            onClick={() => setModalImage({ 
                              url: message.file_url && message.file_url.startsWith('http') 
                                ? message.file_url 
                                : `${process.env.NEXT_PUBLIC_CHAT_API || 'https://chat.apibackendokukg.space'}${message.file_url || ''}`, 
                              alt: 'Shared image' 
                            })}
                            className={styles.clickableImage}
                          />
                        ) : message.file_type?.startsWith('audio/') ? (
                          <VoicePlayer 
                            audioUrl={message.file_url.startsWith('http') 
                              ? message.file_url 
                              : `${process.env.NEXT_PUBLIC_CHAT_API || 'https://chat.apibackendokukg.space'}${message.file_url}`}
                            className={styles.voicePlayer}
                          />
                        ) : (
                          <a 
                            href={message.file_url.startsWith('http') 
                              ? message.file_url 
                              : `${process.env.NEXT_PUBLIC_CHAT_API || 'https://chat.apibackendokukg.space'}${message.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.fileLink}
                          >
                            📎 Открыть файл
                          </a>
                        )}
                      </>
                    )}
                    {message.attachments?.map((attachment) => {
                      const imageUrl = attachment.url || attachment.file_url;
                      const fullImageUrl = imageUrl?.startsWith('http') 
                        ? imageUrl 
                        : `${process.env.NEXT_PUBLIC_CHAT_API || 'https://chat.apibackendokukg.space'}${imageUrl}`;
                      const isImage = attachment.type?.startsWith('image/') || attachment.file_type?.startsWith('image/') || attachment.mime?.startsWith('image/');
                      const isAudio = attachment.type?.startsWith('audio/') || attachment.file_type?.startsWith('audio/') || attachment.mime?.startsWith('audio/');
                      
                      if (isImage) {
                        return (
                          <Image 
                            key={attachment.id}
                            src={fullImageUrl} 
                            alt="Shared image"
                            width={200}
                            height={200}
                            style={{ objectFit: 'cover' }}
                            onClick={() => setModalImage({ url: fullImageUrl, alt: 'Shared image' })}
                            className={styles.clickableImage}
                          />
                        );
                      }
                      
                      if (isAudio) {
                        return (
                          <VoicePlayer 
                            key={attachment.id}
                            audioUrl={fullImageUrl}
                            duration={attachment.duration}
                            className={styles.voicePlayer}
                          />
                        );
                      }
                      
                      return (
                        <a 
                          key={attachment.id}
                          href={fullImageUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.fileLink}
                        >
                          📎 {attachment.file_name || attachment.name || 'Открыть файл'}
                        </a>
                      );
                    })}
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

  console.log('📨 MessageList debug:', {
    groupId,
    allMessages: messages,
    groupMessages,
    groupedMessages,
    messagesData
  });

  return (
    <div className={styles.messageList} ref={containerRef}>
      {isLoading && (
        <div className={styles.loading}>
          Загрузка сообщений...
        </div>
      )}
      
      {!isLoading && (!groupMessages || groupMessages.length === 0) && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3>Нет сообщений</h3>
          <p>Начните диалог первым!</p>
        </div>
      )}
      
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <React.Fragment key={date}>
          {renderDateSeparator(date)}
          {dateMessages.map(renderMessage)}
        </React.Fragment>
      ))}
      
      <div ref={messagesEndRef} />
      
      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
};

export default MessageList;
