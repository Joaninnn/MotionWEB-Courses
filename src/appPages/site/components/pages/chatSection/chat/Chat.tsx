// src/appPages/site/components/pages/chatSection/chat/Chat.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import ChatList from '../../Chat/ChatList';
import ChatWindow from '../../Chat/ChatWindow';
import styles from './chat.module.scss';

function Chat() {
  const [selectedChat, setSelectedChat] = useState<{ groupId: number; title: string } | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); // Для принудительного обновления
  const scrollLockRef = useRef<{ locked: boolean; position: number; allowScroll: boolean }>({ locked: false, position: 0, allowScroll: false });

  const handleSelectChat = (groupId: number, title: string) => {
    // Сохраняем позицию и блокируем скролл
    scrollLockRef.current = { locked: true, position: window.scrollY, allowScroll: false };
    
    document.body.classList.add('scroll-locked');
    
    setSelectedChat({ groupId, title });
    setForceUpdate(prev => prev + 1); // Принудительное обновление
    
    // Разблокируем скролл после рендера
    setTimeout(() => {
      document.body.classList.remove('scroll-locked');
      
      // Восстанавливаем позицию
      window.scrollTo(0, scrollLockRef.current.position);
      
      // Разрешаем скролл через 200ms
      setTimeout(() => {
        scrollLockRef.current.allowScroll = true;
        scrollLockRef.current.locked = false;
      }, 200);
    }, 100);
  };

  // Следим за скроллом и контролируем его
  useEffect(() => {
    const handleScroll = () => {
      if (scrollLockRef.current.locked && !scrollLockRef.current.allowScroll) {
        window.scrollTo(0, scrollLockRef.current.position);
      }
    };

    const intervalId = setInterval(handleScroll, 10); // Проверяем каждые 10ms
    
    return () => clearInterval(intervalId);
  }, []);

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  return (
    <div className={styles.chat}>
      <div className="container chat-container">
        <div className={styles.content}>
          <div className={`${styles.groups} ${selectedChat ? styles.mobileHidden : ''}`}>
            <ChatList 
              key={`chatlist-${selectedChat?.groupId || 0}-${forceUpdate}`}
              onSelectChat={handleSelectChat} 
              activeGroupId={selectedChat?.groupId || 0} 
            />
          </div>
          <div className={`${styles.activeChat} ${!selectedChat ? styles.mobileHidden : ''}`}>
            {selectedChat ? (
              <ChatWindow
                groupId={selectedChat.groupId}
                title={selectedChat.title}
                onBack={handleBackToList}
              />
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h3>Выберите чат для начала общения</h3>
                <p>Выберите диалог из списка чтобы начать переписку</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
