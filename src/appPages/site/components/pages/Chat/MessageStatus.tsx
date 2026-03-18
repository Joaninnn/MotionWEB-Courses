import React from 'react';
import { Message } from '@/redux/api/chat/types';
import styles from './MessageStatus.module.scss';

interface MessageStatusProps {
  message: Message;
  isOwn: boolean;
  isGroupChat?: boolean;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ message, isOwn, isGroupChat = false }) => {

  const getMessageStatus = () => {
    // If not own message, don't show status
    if (!isOwn) {
      return null;
    }

    // Для личных чатов используем is_read поле
    if (!isGroupChat) {
      if (message.is_read) {
        return 'read';
      }
      if (message.delivered) {
        return 'delivered';
      }
      return 'delivered';
    }

    // Для групповых чатов - сложная логика
    if (isGroupChat) {
      // Автор смотрит свои сообщения:
      // - Если кто-то другой прочитал -> две галочки
      // - Если никто не прочитал -> одна галочка
      
      if (message.read_by && message.read_by.length > 0) {
        // Проверяем что прочитал кто-то кроме автора
        const otherReaders = message.read_by.filter(id => id !== message.user_id);
        if (otherReaders.length > 0) {
          return 'read'; // Кто-то другой прочитал
        }
      }
      
      // Никто не прочитал или только автор в read_by
      return message.delivered ? 'delivered' : 'delivered';
    }
    
    return null;
  };

  const status = getMessageStatus();

  if (!status) {
    return null;
  }

  return (
    <div className={styles.messageStatus}>
      {status === 'delivered' && (
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={styles.checkmark}
        >
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      )}
      
      {status === 'read' && (
        <div className={styles.doubleCheck}>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className={styles.checkmark}
          >
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className={styles.checkmark}
          >
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
      )}
    </div>
  );
};

export default MessageStatus;
