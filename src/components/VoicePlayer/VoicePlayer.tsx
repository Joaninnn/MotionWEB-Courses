'use client'
import React, { useState, useRef, useEffect } from 'react';
import styles from './VoicePlayer.module.scss';

interface VoicePlayerProps {
  audioUrl: string;
  duration?: number;
  className?: string;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ audioUrl, duration, className }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Форматирование времени в MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Переключение воспроизведения
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Обновление времени воспроизведения
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Обработка загрузки метаданных
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  // Обработка окончания воспроизведения
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Перемотка по клику на прогресс бар
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audioDuration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Вычисление прогресса
  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', () => setIsLoading(true));

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', () => setIsLoading(true));
    };
  }, []);

  return (
    <div className={`${styles.voicePlayer} ${className || ''}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
      />
      
      <button
        className={styles.playButton}
        onClick={togglePlayPause}
        disabled={isLoading}
        title={isPlaying ? 'Пауза' : 'Воспроизвести'}
      >
        {isLoading ? (
          <span className={styles.loadingSpinner}>⏳</span>
        ) : isPlaying ? (
          <span className={styles.pauseIcon}>⏸️</span>
        ) : (
          <span className={styles.playIcon}>▶️</span>
        )}
      </button>

      <div className={styles.playerContent}>
        <div className={styles.progressBar} onClick={handleProgressClick}>
          <div 
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className={styles.timeInfo}>
          <span className={styles.currentTime}>{formatTime(currentTime)}</span>
          <span className={styles.separator}>/</span>
          <span className={styles.totalTime}>{formatTime(audioDuration)}</span>
        </div>
      </div>

      <div className={styles.voiceIcon}>
        🎤
      </div>
    </div>
  );
};

export default VoicePlayer;
