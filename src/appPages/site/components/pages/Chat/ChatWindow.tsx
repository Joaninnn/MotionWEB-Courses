// src/appPages/site/components/pages/Chat/ChatWindow.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import WebSocketDebugger from '../../../../../components/WebSocketDebugger'; // ДОБАВЛЕНО
import { useGetGroupDetailFullQuery, useGetOrCreateDialogMutation, useGetMessagesQuery, useGetMyChatsQuery, useMarkAsReadMutation, useTestMeQuery } from '../../../../../redux/api/chat';
import { GroupMember } from '../../../../../redux/api/chat/types';
import { getUserNameById, getUserRoleById, getDisplayRole } from '../../../../../constants/userNames';
import { useWebSocket } from '../../../../../hooks/useWebSocket';
import { useDispatch } from 'react-redux';
import { resetUnreadCount } from '../../../../../redux/slices/chatSlice';
import styles from './ChatWindow.module.scss';

interface ChatWindowProps {
  groupId: number;
  title: string;
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ groupId, title, onBack }) => {
  const { typingUsers, wsConnected } = useSelector((state: RootState) => state.chat);
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const [showMembers, setShowMembers] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [createDialog] = useGetOrCreateDialogMutation();

  // Получаем сообщения для определения ID последнего сообщения
  const { data: messagesData } = useGetMessagesQuery(
    { groupId, limit: 50 },
    { skip: !groupId }
  );

  // Получаем список чатов для обновления кэша
  const { refetch: refetchChats } = useGetMyChatsQuery();
  
  // API для отметки сообщений как прочитанных
  const [markAsRead] = useMarkAsReadMutation();
  
  // Временная проверка доступности бэкенда
  const { data: testData, error: testError } = useTestMeQuery();

  // Инициализируем WebSocket подключение
  const { sendMessage, getConnectionStatus } = useWebSocket(groupId);
  
  console.log('🔗 ChatWindow render:', { groupId, title, wsConnected });
  
  // Проверяем доступность бэкенда
  useEffect(() => {
    if (testError) {
      console.error('❌ Бэкенд недоступен:', testError);
    } else if (testData) {
      console.log('✅ Бэкенд доступен:', testData);
    }
  }, [testData, testError]);

  // Функция для определения никнейма собеседника в личном чате
  const getChatPartnerName = () => {
    // Проверяем, является ли это личным чатом по названию или флагу
    const isPrivateChat = title.startsWith('dialog_') || groupDetail?.is_private;
    
    if (isPrivateChat) {
      // Из названия dialog_X_Y можно определить ID собеседника
      const parts = title.split('_');
      if (parts.length === 3) {
        const userId1 = parseInt(parts[1]);
        const userId2 = parseInt(parts[2]);
        const currentUserId = user.id;
        
        // Определяем ID собеседника
        const partnerId = userId1 === currentUserId ? userId2 : userId1;
        
        // Используем общий кэш имен
        return getUserNameById(partnerId);
      }
    }
    
    // Для групповых чатов или если не смогли определить, форматируем название
    return formatChatTitle(title);
  };

  // Функция для определения роли собеседника в личном чате
  const getChatPartnerRole = () => {
    // Проверяем, является ли это личным чатом по названию или флагу
    const isPrivateChat = title.startsWith('dialog_') || groupDetail?.is_private;
    
    if (isPrivateChat) {
      // Из названия dialog_X_Y можно определить ID собеседника
      const parts = title.split('_');
      if (parts.length === 3) {
        const userId1 = parseInt(parts[1]);
        const userId2 = parseInt(parts[2]);
        const currentUserId = user.id;
        
        // Определяем ID собеседника
        const partnerId = userId1 === currentUserId ? userId2 : userId1;
        
        // Используем общий кэш ролей
        const role = getUserRoleById(partnerId);
        return getDisplayRole(role);
      }
    }
    
    // Для групповых чатов не показываем роль
    return null;
  };

  // Функция для обработки клика на участника (создание личного чата)
  const handleMemberClick = async (member: GroupMember) => {
    // Не создаем диалог с самим собой
    if (member.user_id === user.id) {
      console.log('Нельзя создать диалог с самим собой');
      return;
    }

    try {
      console.log('🔄 Создание диалога с пользователем:', member.user_id);
      const result = await createDialog(member.user_id).unwrap();
      console.log('✅ Диалог создан:', result);
      
      // Здесь можно добавить логику для перехода в созданный диалог
      // Например, обновить список чатов и выбрать новый диалог
      
    } catch (error) {
      console.error('❌ Ошибка создания диалога:', error);
    }
  };

  // Функция для определения роли участника
  const getMemberRole = (member: GroupMember) => {
    console.log('🔍 [ROLE] Участник:', member);
    console.log('🔍 [ROLE] Текущий пользователь:', user);
    
    // Если роль участника - ментор, показываем как ментора
    if (member.role === 'mentor') {
      console.log('✅ [ROLE] Ментор → Ментор');
      return 'Ментор';
    }
    
    // Все остальные - студенты
    console.log('❌ [ROLE] Остальные → Студент');
    return 'Студент';
  };
  // Функция для форматирования названия чата
  const formatChatTitle = (title: string) => {
    // Если название начинается с 'course:', заменяем на 'группа:'
    if (title.startsWith('course:')) {
      return title.replace('course:', 'группа:');
    }
    return title;
  };
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const { data: groupDetail } = useGetGroupDetailFullQuery(groupId, {
    skip: !groupId,
  });

  // Фиксируем скролл вверху при переключении групп
  useEffect(() => {
    // НЕ скроллируем автоматически при переключении групп
    // Пользователь должен сам контролировать скролл
  }, [groupId]);

  // Отмечаем сообщения как прочитанные при загрузке чата
  useEffect(() => {
    console.log(`🔄 useEffect для сброса счетчиков triggered, groupId: ${groupId}`);
    
    // Сбрасываем счетчик непрочитанных сообщений для этого чата (удаляем override)
    console.log(`🔄 Вызываем dispatch(resetUnreadCount(${groupId}))`);
    dispatch(resetUnreadCount(groupId));
    
    // Отмечаем сообщения как прочитанные на сервере
    if (messagesData?.items && messagesData.items.length > 0) {
      // Фильтруем сообщения только от других пользователей и только из текущего чата
      const otherUserMessages = messagesData.items.filter(msg => 
        msg.user_id !== user.id && msg.group_id === groupId
      );
      
      console.log(`📝 Сообщения от других пользователей в чате ${groupId}:`, otherUserMessages.length);
      
      if (otherUserMessages.length > 0) {
        const lastMessageFromOther = otherUserMessages[0]; // Берем последнее сообщение (отсортированы по убыванию даты)
        
        console.log(`📝 Последнее сообщение от другого пользователя:`, lastMessageFromOther);
        
        if (lastMessageFromOther?.id) {
          console.log(`📤 Вызываем markAsRead API для groupId: ${groupId}, messageId: ${lastMessageFromOther.id}`);
          console.log(`📦 Параметры: groupId=${groupId}, messageId=${lastMessageFromOther.id}`);
          console.log(`📦 URL: POST /chats/${groupId}/read`);
          
          // Проверяем, что сообщение действительно существует в списке И в текущем чате
          const messageExists = messagesData?.items?.some(msg => 
            msg.id === lastMessageFromOther.id && msg.group_id === groupId
          );
          console.log(`🔍 Проверка существования сообщения:`, {
            messageId: lastMessageFromOther.id,
            groupId: groupId,
            exists: messageExists,
            totalMessages: messagesData?.items?.length
          });
          
          if (!messageExists) {
            console.warn(`⚠️ Сообщение ${lastMessageFromOther.id} не найдено в чате ${groupId}, пробуем последнее сообщение в чате`);
            
            // Берем самое последнее сообщение из текущего чата
            const lastMessageInChat = messagesData?.items?.find(msg => 
              msg.group_id === groupId && msg.user_id !== user.id
            );
            
            if (lastMessageInChat) {
              console.log(`🔄 Используем последнее сообщение в чате ${groupId}:`, lastMessageInChat.id);
              
              markAsRead({ 
                groupId, 
                messageId: lastMessageInChat.id 
              }).unwrap()
                .then((response) => {
                  console.log(`✅ markAsRead успешен (альтернатива):`, response);
                  // Обновляем список чатов чтобы получить актуальные счетчики
                  setTimeout(() => {
                    refetchChats();
                  }, 500);
                })
                .catch((error) => {
                  console.error(`❌ Ошибка markAsRead (альтернатива):`, error);
                  console.error(`❌ Полный объект ошибки:`, JSON.stringify(error, null, 2));
                });
            } else {
              console.warn(`⚠️ Нет подходящих сообщений для отметки прочтения в чате ${groupId}`);
            }
            return;
          }
          
          // ВСЕГДА вызываем API при открытии чата для синхронизации с бэкендом
          console.log(`🚀 [markAsRead] Начинаем запрос:`, {
            groupId,
            messageId: lastMessageFromOther.id,
            url: `${process.env.NEXT_PUBLIC_CHAT_API}/chats/${groupId}/read`
          });
          
          markAsRead({ 
            groupId, 
            messageId: lastMessageFromOther.id 
          }).unwrap()
            .then((response) => {
              console.log(`✅ markAsRead успешен:`, response);
              // Обновляем список чатов чтобы получить актуальные счетчики с бэкенда
              setTimeout(() => {
                refetchChats();
              }, 500); // Небольшая задержка для обновления бэкенда
            })
            .catch((error) => {
              console.error(`❌ Ошибка markAsRead:`, error);
              console.error(`❌ Полный объект ошибки:`, JSON.stringify(error, null, 2));
              console.error(`❌ Детали ошибки:`, {
                status: error?.status || 'unknown',
                statusText: error?.statusText || 'unknown',
                data: error?.data || 'unknown',
                message: error?.message || 'unknown',
                error: error?.error || 'unknown'
              });
              
              // Проверяем конкретные типы ошибок
              if (error?.status === 404) {
                console.error(`❌ Сообщение не найдено в чате - возможно ID сообщения неверный или оно было удалено`);
              } else if (error?.status === 403) {
                console.error(`❌ Ошибка доступа - проблема с авторизацией`);
              } else if (error?.status === 500) {
                console.error(`❌ Внутренняя ошибка бэкенда`);
              } else {
                console.error(`❌ Неизвестная ошибка сети или бэкенда`);
              }
              
              // Даже при ошибке пытаем обновить список чатов
              setTimeout(() => {
                refetchChats();
              }, 1000);
            });
        } else {
          console.log(`⚠️ Нет непрочитанных сообщений от других пользователей`);
        }
      } else {
        console.log(`⚠️ Нет сообщений от других пользователей`);
      }
    } else {
      console.log(`⚠️ Нет сообщений для отметки как прочитанные`);
    }
  }, [groupId, dispatch, refetchChats, markAsRead, messagesData, user.id]);

  // Дополнительно обновляем счетчики при отправке сообщений
  useEffect(() => {
    if (messagesData?.items && messagesData.items.length > 0) {
      // При появлении новых сообщений обновляем список чатов
      console.log(`🔄 Обновляем список чатов после загрузки сообщений...`);
      setTimeout(() => {
        refetchChats();
      }, 1000);
    }
  }, [messagesData?.items, refetchChats]);

  const getTypingText = () => {
    const currentTypingUsers = typingUsers[groupId] || [];
    if (currentTypingUsers.length === 0) return '';
    
    if (currentTypingUsers.length === 1) {
      return `${currentTypingUsers[0].username} печатает...`;
    }
    
    if (currentTypingUsers.length === 2) {
      return `${currentTypingUsers[0].username} и ${currentTypingUsers[1].username} печатают...`;
    }
    
    return `${currentTypingUsers.length} человек печатают...`;
  };

  return (
    <div className={styles.chatWindow} ref={chatWindowRef}>
      {/* ДОБАВЛЕНО: Дебаггер в самом верху */}
      {showDebugger && (
        <div style={{ marginBottom: '10px' }}>
          <WebSocketDebugger groupId={groupId} />
          <button 
            onClick={() => setShowDebugger(false)}
            style={{
              width: '100%',
              padding: '8px',
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Скрыть дебаггер (закрыть после проверки)
          </button>
        </div>
      )}
      
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          {onBack && (
            <button className={styles.backButton} onClick={onBack}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          
          <div className={styles.chatInfo}>
            <h3 className={styles.chatTitle}>{getChatPartnerName()}</h3>
            <div className={styles.userInfoRow}>
              {getChatPartnerRole() && (
                <span className={styles.chatPartnerRole}>
                  {getChatPartnerRole()}
                </span>
              )}
              <div className={styles.chatStatus}>
                <span className={`${styles.connectionIndicator} ${wsConnected ? styles.connected : styles.disconnected}`}>
                  {wsConnected ? '●' : '●'}
                </span>
                <span className={styles.statusText}>
                  {getConnectionStatus()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.headerRight}>
          {/* Показываем кнопку участников только для групповых чатов */}
          {!title.startsWith('dialog_') && !groupDetail?.is_private && (
            <button 
              className={styles.headerButton}
              onClick={() => setShowMembers(!showMembers)}
              title="Участники"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={styles.chatBody}>
        <MessageList groupId={groupId} />
        
        {typingUsers[groupId] && typingUsers[groupId].length > 0 && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className={styles.typingText}>{getTypingText()}</span>
          </div>
        )}
      </div>

      <div className={styles.chatFooter}>
        <MessageInput groupId={groupId} sendMessage={sendMessage} />
      </div>

      {showMembers && (
        <div className={styles.membersSidebar}>
          <div className={styles.membersHeader}>
            <h4>Участники</h4>
            <button 
              className={styles.closeButton}
              onClick={() => setShowMembers(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className={styles.membersList}>
            {groupDetail?.members?.map((m) => (
              <div 
                key={m.user_id} 
                className={`${styles.member} ${m.user_id !== user.id ? styles.clickable : ''}`}
                onClick={() => m.user_id !== user.id && handleMemberClick(m)}
                title={m.user_id !== user.id ? "Начать личный чат" : "Это вы"}
              >
                <div className={styles.memberAvatar}>
                  <div className={styles.avatarPlaceholder}>
                    {(m.username || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>{m.username}</span>
                  <span className={styles.memberRole}>
                    {getMemberRole(m)}
                  </span>
                </div>
                {m.user_id !== user.id && (
                  <div className={styles.privateChatIndicator}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;