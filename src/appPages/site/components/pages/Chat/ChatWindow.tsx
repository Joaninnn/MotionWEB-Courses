// src/appPages/site/components/pages/Chat/ChatWindow.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import WebSocketDebugger from '@/components/WebSocketDebugger'; // ДОБАВЛЕНО
import { useGetGroupDetailFullQuery } from '@/redux/api/chat';
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
  const [showDebugger, setShowDebugger] = useState(false); // ДОБАВЛЕНО - покажет дебаггер
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const { data: groupDetail } = useGetGroupDetailFullQuery(groupId, {
    skip: !groupId,
  });

  // Фиксируем скролл вверху при переключении групп
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = 0;
    }
    // Также прокручиваем всю страницу вверху
    window.scrollTo(0, 0);
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
            <h3 className={styles.chatTitle}>{title}</h3>
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
        
        <div className={styles.headerRight}>
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
          
          <button className={styles.headerButton} title="Поиск">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          
          <button className={styles.headerButton} title="Настройки чата">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
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
              <div key={m.user_id} className={styles.member}>
                <div className={styles.memberAvatar}>
                  <div className={styles.avatarPlaceholder}>
                    {(m.username || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>{m.username}</span>
                  <span className={styles.memberRole}>
                    {m.role === 'owner'
                      ? ' Владелец'
                      : m.role === 'admin'
                      ? ' Админ'
                      : m.user_id === user?.id && user.status === 'mentor'
                      ? ' Ментор'
                      : ' Студент'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;