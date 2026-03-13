'use client'
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useSendMessageMutation } from '../../../../../redux/api/chat';
import { useDispatch, useSelector } from 'react-redux';
import { resetUnreadCount } from '../../../../../redux/slices/chatSlice';
import { RootState } from '../../../../../redux/store';
import VoiceRecorder from '@/components/VoiceRecorder/VoiceRecorder';
import styles from './MessageInput.module.scss';

interface MessageInputProps {
  groupId: number;
  sendMessage?: (text: string, fileUrl?: string, fileType?: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ groupId, sendMessage }) => {
  const [sendMessageMutation, { isLoading: isSending }] = useSendMessageMutation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [shouldResetAudio, setShouldResetAudio] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Можно загружать только изображения');
        return;
      }
      
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioRecorded = (audioFile: File, duration: number) => {
    
    
    setSelectedAudio(audioFile);
    setAudioDuration(duration);
  };

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !selectedFile && !selectedAudio) || isSending) {
      return;
    }

    try {
      const fileToSend = selectedAudio || selectedFile;
      
      if (sendMessage) {
        if (fileToSend) {
          await sendMessageMutation({
            groupId,
            text: message.trim() || (selectedAudio ? 'Голосовое сообщение' : undefined),
            file: fileToSend || undefined,
          }).unwrap();
        } else {
          sendMessage(message.trim());
        }
      } else {
        await sendMessageMutation({
          groupId,
          text: message.trim() || (selectedAudio ? 'Голосовое сообщение' : undefined),
          file: fileToSend || undefined,
        }).unwrap();
      }
      
      dispatch(resetUnreadCount(groupId));
      
      const userKey = `unreadCountOverrides_user_${user.id}`;
      const currentOverrides = JSON.parse(localStorage.getItem(userKey) || '{}');
      if (currentOverrides[groupId]) {
        delete currentOverrides[groupId];
        localStorage.setItem(userKey, JSON.stringify(currentOverrides));
      }
      
      setMessage('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedAudio(null);
      setAudioDuration(0);
      setShouldResetAudio(true); 
      setTimeout(() => setShouldResetAudio(false), 100); 
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      
      if (error && typeof error === 'object' && 'status' in error) {
       
      }
      
      alert('Ошибка при отправке сообщения');
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          🧷
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
