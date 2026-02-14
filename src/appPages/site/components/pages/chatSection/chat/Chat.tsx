// src/appPages/site/components/pages/chatSection/chat/Chat.tsx
'use client';
import React, { useState } from 'react';
import ChatList from '../../Chat/ChatList';
import ChatWindow from '../../Chat/ChatWindow';
import styles from './chat.module.scss';

function Chat() {
  const [selectedChat, setSelectedChat] = useState<{ groupId: number; title: string } | null>(null);

  const handleSelectChat = (groupId: number, title: string) => {
    setSelectedChat({ groupId, title });
    // Прокручиваем страницу вверху при выборе чата
    window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  return (
    <div className={styles.chat}>
      <div className="container">
        <div className={styles.content}>
          <div className={`${styles.groups} ${selectedChat ? styles.mobileHidden : ''}`}>
            <ChatList onSelectChat={handleSelectChat} activeGroupId={selectedChat?.groupId || 0} />
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
