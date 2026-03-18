import React from 'react';
import { Message } from '@/redux/api/chat/types';
import styles from './MessageStatus.module.scss';

interface MessageStatusProps {
  message: Message;
  isOwn: boolean;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ message, isOwn }) => {
  const getMessageStatus = () => {
    // If not own message, don't show status
    if (!isOwn) {
      return null;
    }

    // Use is_read field for both private and group chats
    // Backend should set this field when someone reads the message
    if (message.is_read) {
      return 'read';
    }
    
    // If message exists and is delivered, show 1 checkmark
    if (message.delivered) {
      return 'delivered';
    }
    
    return 'delivered'; // Default to delivered for own messages
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
