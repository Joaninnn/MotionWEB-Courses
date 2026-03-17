import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Message } from '@/redux/api/chat/types';
import styles from './MessageStatus.module.scss';

interface MessageStatusProps {
  message: Message;
  groupId: number;
  isOwn: boolean;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ message, groupId, isOwn }) => {
  const currentUser = useSelector((state: RootState) => state.user);
  const groupMembers = useSelector((state: RootState) => state.chat.groupMembers[groupId] || []);

  const getMessageStatus = () => {
    // If not own message, don't show status
    if (!isOwn) {
      return null;
    }

    // Check if message has been read by anyone
    const hasBeenRead = message.read_by && message.read_by.length > 0;
    
    // Better private chat detection - check if title starts with 'dialog_' or has exactly 2 members
    const isPrivateChat = groupMembers.length === 2;
    
    if (isPrivateChat) {
      // In private chat, show 2 checkmarks if recipient has read it
      const recipientRead = message.read_by && 
        message.read_by.some(readerId => readerId !== currentUser.id);
      
      if (recipientRead) {
        return 'read';
      }
      
      // If message exists and is delivered, show 1 checkmark
      if (message.delivered) {
        return 'delivered';
      }
      
      return 'delivered'; // Default to delivered for own messages
    }
    
    // For group chats
    if (hasBeenRead && message.read_by) {
      // Show 2 checkmarks if at least one person has read it (excluding sender)
      const someoneElseRead = message.read_by.some(readerId => readerId !== currentUser.id);
      if (someoneElseRead) {
        return 'read';
      }
    }
    
    // If message exists, it's at least delivered
    return 'delivered';
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
