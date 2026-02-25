// src/components/Chat/MessageInput.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import { useWebSocket } from '../../../../../hooks/useWebSocket';
import { fileUploadService } from '../../../../../services/fileUpload';
import styles from './MessageInput.module.scss';

interface MessageInputProps {
  groupId: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ groupId }) => {
  const { sendMessage } = useWebSocket(groupId);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { uploadingFile } = useSelector((state: RootState) => state.chat);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Временно отключаем загрузку файлов
      alert('Загрузка файлов временно отключена. Функция будет доступна после исправления на стороне бэкенда.');
      return;
      
      setSelectedFile(file || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !selectedFile) || uploadingFile) {
      return;
    }

    try {
      let fileUrl: string | undefined;
      let fileType: string | undefined;

      if (selectedFile) {
        const result = await fileUploadService.uploadFile(selectedFile);
        fileUrl = result.url;
        fileType = selectedFile.type;
      }

      await sendMessage(message.trim(), fileUrl, fileType);
      
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={styles.messageInput}>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputContainer}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
          
          <button
            type="button"
            className={styles.attachButton}
            onClick={() => fileInputRef.current?.click()}
            title="Прикрепить файл"
          >
            📎
          </button>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            className={styles.textInput}
            rows={1}
            disabled={uploadingFile}
          />
          
          <button
            type="submit"
            className={`${styles.sendButton} ${(!message.trim() && !selectedFile) || uploadingFile ? styles.disabled : ''}`}
            disabled={(!message.trim() && !selectedFile) || uploadingFile}
            title={uploadingFile ? 'Отправка...' : 'Отправить сообщение'}
          >
            {uploadingFile ? '⏳' : '➤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
