// src/appPages/site/components/pages/Chat/ChatWindow.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import WebSocketDebugger from '../../../../../components/WebSocketDebugger'; // ДОБАВЛЕНО
import { useGetGroupDetailFullQuery, useGetOrCreateDialogMutation } from '../../../../../redux/api/chat';
import { GroupMember } from '../../../../../redux/api/chat/types';
import { getUserNameById, getUserRoleById, getDisplayRole } from '../../../../../constants/userNames';
import { useRouter } from 'next/navigation';
import styles from './ChatWindow.module.scss';

interface ChatWindowProps {
  groupId: number;
  title: string;
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ groupId, title, onBack }) => {
  const { typingUsers, wsConnected } = useSelector((state: RootState) => state.chat);
  const user = useSelector((state: RootState) => state.user);
  const [showMembers, setShowMembers] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const router = useRouter();
  const [createDialog] = useGetOrCreateDialogMutation();

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
    // НЕ скроллим автоматически при переключении групп
    // Пользователь должен сам контролировать скролл
    if (chatWindowRef.current) {
      // Сохраняем текущую позицию скролла
      const currentScrollTop = chatWindowRef.current.scrollTop;
      // Не меняем позицию скролла
    }
  }, [groupId]);

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
                  {wsConnected ? 'Подключено' : 'Подключение...'}
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
        <MessageInput groupId={groupId} />
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