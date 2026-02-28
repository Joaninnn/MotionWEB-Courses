// src/components/Chat/MessageInput.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useSendMessageMutation } from '../../../../../redux/api/chat';
import styles from './MessageInput.module.scss';

interface MessageInputProps {
  groupId: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ groupId }) => {
  const [sendMessageMutation, { isLoading: isSending }] = useSendMessageMutation();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      // Проверяем, что это изображение
      if (!file.type.startsWith('image/')) {
        alert('Можно загружать только изображения');
        return;
      }
      
      setSelectedFile(file);
      
      // Создаем превью изображения
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !selectedFile) || isSending) {
      return;
    }

    try {
      await sendMessageMutation({
        groupId,
        text: message.trim() || undefined,
        file: selectedFile || undefined,
      }).unwrap();
      
      setMessage('');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Ошибка при отправке сообщения');
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
      {previewUrl && (
        <div className={styles.imagePreview}>
          <Image 
            src={previewUrl} 
            alt="Preview" 
            width={200}
            height={150}
            className={styles.previewImage}
            style={{ objectFit: 'cover' }}
          />
          <button
            type="button"
            className={styles.removeImage}
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            title="Удалить изображение"
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputContainer}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
          
          <button
            type="button"
            className={styles.attachButton}
            onClick={() => fileInputRef.current?.click()}
            title="Прикрепить изображение"
          >
            �
          </button>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            className={styles.textInput}
            rows={1}
            disabled={isSending}
          />
          
          <button
            type="submit"
            className={`${styles.sendButton} ${(!message.trim() && !selectedFile) || isSending ? styles.disabled : ''}`}
            disabled={(!message.trim() && !selectedFile) || isSending}
            title={isSending ? 'Отправка...' : 'Отправить сообщение'}
          >
            {isSending ? '⏳' : '➤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
