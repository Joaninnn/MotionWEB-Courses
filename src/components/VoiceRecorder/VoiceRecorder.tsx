'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './VoiceRecorder.module.scss';

interface VoiceRecorderProps {
  onRecordingComplete: (audioFile: File, duration: number) => void;
  disabled?: boolean;
  shouldReset?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, disabled, shouldReset }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Форматирование времени в MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Запрос разрешения на микрофон
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      setPermissionGranted(true);
      return stream;
    } catch (err) {
      setError('Не удалось получить доступ к микрофону');
      console.error('Microphone permission error:', err);
      return null;
    }
  }, []);

  // Начало записи
  const startRecording = useCallback(async () => {
    if (disabled) return;

    setError(null);
    
    let stream = audioStreamRef.current;
    
    // Если еще нет потока, запрашиваем разрешение
    if (!stream) {
      stream = await requestMicrophonePermission();
      if (!stream) return;
      
      audioStreamRef.current = stream;
    }

    try {
      // Создаем MediaRecorder с поддержкой разных форматов
      let mimeType = 'audio/mpeg'; // MP3 формат
      
      // Проверяем поддержку форматов
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm;codecs=opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg;codecs=opus';
      }
      
      console.log('🎤 Используемый MIME тип:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log('🎤 Аудио blob создан:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: chunksRef.current.length,
          duration
        });
        
        // Определяем расширение файла в зависимости от формата
        let extension = 'mp3';
        if (mimeType.includes('webm')) extension = 'webm';
        else if (mimeType.includes('mp4')) extension = 'mp4';
        else if (mimeType.includes('ogg')) extension = 'ogg';
        
        const audioFile = new File([audioBlob], `voice_${Date.now()}.${extension}`, { type: mimeType });
        console.log('🎤 Аудио файл создан:', {
          name: audioFile.name,
          size: audioFile.size,
          type: audioFile.type
        });
        
        setAudioBlob(audioBlob);
        onRecordingComplete(audioFile, duration);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Запускаем таймер
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('Не удалось начать запись');
      console.error('Recording start error:', err);
    }
  }, [disabled, duration, onRecordingComplete, requestMicrophonePermission]);

  // Остановка записи
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Останавливаем таймер
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  // Переключение записи (старт/стоп)
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Удаление записи
  const deleteRecording = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    setError(null);
  }, []);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Сбрасываем аудио при shouldReset
  useEffect(() => {
    if (shouldReset) {
      setTimeout(() => {
        setAudioBlob(null);
        setDuration(0);
        setError(null);
      }, 0);
    }
  }, [shouldReset]);

  if (error) {
    return (
      <div className={styles.voiceRecorder}>
        <div className={styles.error}>
          <span>🎤</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.voiceRecorder}>
      {audioBlob ? (
        // Показываем превью записи
        <div className={styles.recordingPreview}>
          <div className={styles.recordingInfo}>
            <span className={styles.audioIcon}>🎤</span>
            <span className={styles.duration}>{formatTime(duration)}</span>
            <span className={styles.recordingLabel}>Голосовое сообщение</span>
          </div>
          <div className={styles.recordingActions}>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={deleteRecording}
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        </div>
      ) : (
        // Кнопка записи
        <button
          type="button"
          className={`${styles.recordButton} ${isRecording ? styles.recording : ''} ${disabled ? styles.disabled : ''}`}
          onClick={toggleRecording}
          disabled={disabled}
          title={isRecording ? 'Остановить запись' : 'Записать голосовое сообщение'}
        >
          <span className={styles.microphoneIcon}>
            {isRecording ? '⏹️' : '🎤'}
          </span>
          {isRecording && (
            <span className={styles.recordingTime}>{formatTime(duration)}</span>
          )}
        </button>
      )}
    </div>
  );
};

export default VoiceRecorder;
