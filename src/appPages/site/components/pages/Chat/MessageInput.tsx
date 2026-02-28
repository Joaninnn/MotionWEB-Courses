// src/components/Chat/MessageInput.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useSendMessageMutation } from '../../../../../redux/api/chat';
import VoiceRecorder from '@/components/VoiceRecorder/VoiceRecorder';
import styles from './MessageInput.module.scss';

interface MessageInputProps {
  groupId: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ groupId }) => {
  const [sendMessageMutation, { isLoading: isSending }] = useSendMessageMutation();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [shouldResetAudio, setShouldResetAudio] = useState<boolean>(false);
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

  const handleAudioRecorded = (audioFile: File, duration: number) => {
    console.log('🎤 Получено аудио в MessageInput:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      duration
    });
    
    setSelectedAudio(audioFile);
    setAudioDuration(duration);
  };

  const handleTranscribe = async () => {
    if (!selectedAudio) {
      alert('Сначала запишите голосовое сообщение');
      return;
    }

    try {
      // Создаем FormData для отправки аудио на транскрипцию
      const formData = new FormData();
      formData.append('audio', selectedAudio);

      // Здесь будет запрос к API транскрипции
      // const response = await fetch('/api/transcribe', {
      //   method: 'POST',
      //   body: formData
      // });
      // const result = await response.json();
      
      // Временно просто показываем заглушку
      const transcribedText = 'Транскрипция голосового сообщения...';
      setMessage(transcribedText);
      
      // Удаляем аудио после транскрипции
      setSelectedAudio(null);
      setAudioDuration(0);
      
    } catch (error) {
      console.error('Ошибка транскрипции:', error);
      alert('Не удалось транскрибировать голосовое сообщение');
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !selectedFile && !selectedAudio) || isSending) {
      return;
    }

    try {
      // Определяем какой файл отправлять - изображение или аудио
      const fileToSend = selectedAudio || selectedFile;
      
      console.log('🎤 Отправка сообщения:', {
        groupId,
        text: message.trim() || (selectedAudio ? 'Голосовое сообщение' : undefined),
        file: fileToSend ? {
          name: fileToSend.name,
          type: fileToSend.type,
          size: fileToSend.size
        } : null,
        hasAudio: !!selectedAudio,
        hasImage: !!selectedFile
      });
      
      await sendMessageMutation({
        groupId,
        text: message.trim() || (selectedAudio ? 'Голосовое сообщение' : undefined),
        file: fileToSend || undefined,
      }).unwrap();
      
      setMessage('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedAudio(null);
      setAudioDuration(0);
      setShouldResetAudio(true); // Сбрасываем аудио в VoiceRecorder
      setTimeout(() => setShouldResetAudio(false), 100); // Сбрасываем флаг
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Добавляем детальную информацию об ошибке
      if (error && typeof error === 'object' && 'status' in error) {
        const errorData = error as { status?: number; data?: unknown };
        console.error('Error details:', {
          status: errorData.status,
          data: errorData.data,
          dataString: JSON.stringify(errorData.data, null, 2)
        });
      }
      
      alert('Ошибка при отправке сообщения');
    }
  };

  // Удаление изображения
  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Удаление аудио
  const removeAudio = () => {
    setSelectedAudio(null);
    setAudioDuration(0);
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
            onClick={removeImage}
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
            📷
          </button>
          
          <VoiceRecorder 
            onRecordingComplete={handleAudioRecorded}
            disabled={isSending}
            shouldReset={shouldResetAudio}
          />
          
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
            className={`${styles.sendButton} ${(!message.trim() && !selectedFile && !selectedAudio) || isSending ? styles.disabled : ''}`}
            disabled={(!message.trim() && !selectedFile && !selectedAudio) || isSending}
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
