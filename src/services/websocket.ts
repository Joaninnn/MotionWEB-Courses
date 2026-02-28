// src/services/websocket.ts
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private messageHandler: ((data: unknown) => void) | null = null;
  private groupId: number | null = null;
  private token: string | null = null;
  private shouldReconnect = true;
  private connectingPromise: Promise<void> | null = null;
  private resolveConnecting: (() => void) | null = null;
  private rejectConnecting: ((reason?: unknown) => void) | null = null;
  private wsUrlCandidates: string[] = [];
  private wsUrlIndex = 0;
  private isWebSocketAvailable = true; // Флаг доступности WebSocket
  private pollingInterval: NodeJS.Timeout | null = null; // Для HTTP polling fallback
  
  connect(groupId: number, token: string): Promise<void> {
    // Если уже подключены к той же группе, не переподключаемся
    if (this.ws?.readyState === WebSocket.OPEN && this.groupId === groupId) {
      console.log('🔄 Уже подключены к группе', groupId);
      return Promise.resolve();
    }

    this.groupId = groupId;
    this.token = token;
    this.shouldReconnect = true;

    // Формируем WebSocket URL с fallback
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
                  process.env.NEXT_PUBLIC_CHAT_API?.replace('http', 'ws') || 
                  'ws://13.53.67.23:8000';
    
    this.wsUrlCandidates = [
      `${wsUrl}/ws/messages?token=${token}&group_id=${groupId}`,
    ];
    this.wsUrlIndex = 0;

    console.log('🔗 WebSocket URL:', this.wsUrlCandidates[0]);
    console.log('🌍 Environment variables:');
    console.log('  NEXT_PUBLIC_WS_URL:', process.env.NEXT_PUBLIC_WS_URL);
    console.log('  NEXT_PUBLIC_CHAT_API:', process.env.NEXT_PUBLIC_CHAT_API);

    // Закрываем существующее соединение, если оно есть
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.log('🔌 Закрытие предыдущего соединения...');
      this.ws.close();
      this.ws = null;
    }

    // Если уже есть активное подключение, ждем его завершения
    if (this.connectingPromise) {
      return this.connectingPromise;
    }
    
    this.connectingPromise = new Promise((resolve, reject) => {
      this.resolveConnecting = resolve;
      this.rejectConnecting = reject;

      const tryConnect = () => {
        if (!this.shouldReconnect) {
          return;
        }

        const wsUrl = this.wsUrlCandidates[this.wsUrlIndex];
        console.log(`🔌 Подключение к WebSocket (${this.wsUrlIndex + 1}/${this.wsUrlCandidates.length})`);

        try {
          this.ws = new WebSocket(wsUrl);

          const connectionTimeout = setTimeout(() => {
            if (this.ws?.readyState === WebSocket.CONNECTING) {
              console.log('⏰ Таймаут подключения к WebSocket (3 секунды)');
              this.ws.close();
            }
          }, 3000); // Уменьшили до 3 секунд

          this.ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log('✅ WebSocket СОЕДИНЕНИЕ УСТАНОВЛЕНО');
            console.log('🔗 URL:', wsUrl);
            console.log('📊 Подключено к группе:', groupId);
            this.startPing();
            this.reconnectAttempts = 0;
            this.stopPing();
            this.resolveConnecting?.();
            this.cleanupConnectingPromise();
          };

          this.ws.onerror = () => {
            // Уменьшаем количество логов для ошибок
            console.warn('⚠️ WebSocket соединение недоступно, используем HTTP fallback');
            
            // Если это ошибка соединения (не удалось подключиться), пробуем следующий URL
            if (this.ws?.readyState === WebSocket.CONNECTING) {
              this.wsUrlIndex++;
              if (this.wsUrlIndex < this.wsUrlCandidates.length) {
                setTimeout(() => tryConnect(), 500);
                return;
              }
            }
            
            // Не reject здесь: причина придёт в onclose.
          };

          this.ws.onclose = (event) => {
            // Уменьшаем количество логов для закрытия соединения
            if (event.code !== 1000) { // Не логаем нормальное закрытие
              console.log('� WebSocket соединение закрыто, переключаемся на HTTP');
            }
            
            this.stopPing();

            // Если соединение не успело открыться — пробуем следующий URL.
            if (this.connectingPromise) {
              if (this.wsUrlIndex < this.wsUrlCandidates.length - 1) {
                this.wsUrlIndex++;
                setTimeout(() => tryConnect(), 300);
              } else {
                // Все URL испробованы, переключаемся на HTTP polling
                console.log('🔄 Используем HTTP API для обмена сообщениями');
                this.isWebSocketAvailable = false;
                this.startPolling();
                this.resolveConnecting?.();
                this.cleanupConnectingPromise();
                // Уведомляем об успешном подключении через HTTP fallback
                if (this.messageHandler) {
                  this.messageHandler({
                    type: 'connection_status',
                    status: 'connected_via_http',
                    message: 'Подключено через HTTP API'
                  });
                }
              }
            }

            if (this.shouldReconnect && event.code !== 1000) {
              this.handleReconnect();
            }
          };

          this.ws.onmessage = (event) => {
            try {
              console.log('📨 Получены RAW данные:', event.data);
              const data = JSON.parse(event.data);
              console.log('📦 Распарсенные данные:', data);

              this.messageHandler?.(data);
            } catch (error) {
              console.error('❌ Ошибка парсинга сообщения:', error);
              console.error('📄 Сырые данные:', event.data);
            }
          };
        } catch (error) {
          console.error('❌ Исключение при создании WebSocket:', error);

          if (this.wsUrlIndex < this.wsUrlCandidates.length - 1) {
            this.wsUrlIndex += 1;
            setTimeout(tryConnect, 500);
            return;
          }

          this.rejectConnecting?.(error);
          this.cleanupConnectingPromise();
        }
      };

      tryConnect();
    });

    return this.connectingPromise;
  }

  private cleanupConnectingPromise() {
    this.connectingPromise = null;
    this.resolveConnecting = null;
    this.rejectConnecting = null;
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < 5 && this.groupId && this.token) {
      this.reconnectAttempts++;
      console.log(`🔄 Попытка переподключения ${this.reconnectAttempts}/5 через 3 секунды...`);
      
      setTimeout(() => {
        // Проверяем, что переподключение все еще нужно
        if (this.shouldReconnect) {
          this.connect(this.groupId!, this.token!).catch(err => {
            console.error('❌ Ошибка переподключения:', err);
          });
        }
      }, 3000);
    } else {
      // Переключаемся на HTTP polling после всех неудачных попыток
      if (!this.isWebSocketAvailable) {
        this.startPolling();
      }
    }
  }
  
  private startPing() {
    return;
  }
  
  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      console.log('⏹️ Ping остановлен');
    }
  }
  
  sendMessage(message: unknown): void {
    const readyState = this.ws?.readyState;
    
    console.log('📤 Попытка отправить сообщение');
    console.log('📡 Текущий ReadyState:', readyState);
    console.log('📦 Данные для отправки:', message);
    console.log('🏷️ Текущая группа WebSocket:', this.groupId);
    
    // Проверяем, что группа в сообщении совпадает с текущей группой WebSocket
    if (message && typeof message === 'object' && message !== null && 'group_id' in message) {
      const messageGroupId = (message as { group_id?: number }).group_id;
      if (messageGroupId !== undefined && messageGroupId !== this.groupId) {
        console.warn(`⚠️ Несовпадение ID групп: message.group_id=${messageGroupId}, ws.groupId=${this.groupId}`);
        console.log('🔄 Пропускаем отправку сообщения для неверной группы');
        return;
      }
    }
    
    if (readyState === WebSocket.OPEN) {
      try {
        this.ws!.send(JSON.stringify(message));
        console.log('✅ Сообщение успешно отправлено через WebSocket');
      } catch (error) {
        console.error('❌ Ошибка при отправке через WebSocket:', error);
        // Пробуем отправить через HTTP при ошибке WebSocket
        this.sendMessageViaHTTP(message);
      }
    } else if (readyState === WebSocket.CONNECTING) {
      // Если WebSocket подключается, ждем немного и пробуем снова
      console.log('⏳ WebSocket подключается, ждем...');
      setTimeout(() => {
        this.sendMessage(message);
      }, 1000);
    } else {
      // Если WebSocket недоступен, отправляем через HTTP API
      console.log('🔄 WebSocket недоступен, используем HTTP API');
      this.sendMessageViaHTTP(message);
    }
  }
  
  private async sendMessageViaHTTP(message: unknown): Promise<void> {
    try {
      console.log('📤 Отправка сообщения через HTTP API');
      console.log('📦 Данные для отправки:', message);
      
      // Проверяем, есть ли в сообщении файл
      const messageObj = message as { text?: string; file?: File; file_url?: string; attachments?: unknown[] };
      
      // Если есть attachments, отправляем как есть
      if (messageObj.attachments && messageObj.attachments.length > 0) {
        console.log('📁 Отправка сообщения с attachments');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API}/groups/${this.groupId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
          body: JSON.stringify(message),
        });
        
        if (response.ok) {
          console.log('✅ Сообщение с attachments успешно отправлено через HTTP');
        } else {
          console.warn(`⚠️ Ошибка отправки: ${response.status} ${response.statusText}`);
        }
        return;
      }
      
      // Если есть файл, нужно использовать FormData
      if (messageObj.file_url || messageObj.file) {
        console.log('📁 Сообщение содержит файл, используем FormData');
        
        const formData = new FormData();
        
        if (messageObj.text) {
          formData.append('text', messageObj.text);
        }
        
        if (messageObj.file) {
          formData.append('file', messageObj.file);
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API}/groups/${this.groupId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
          body: formData,
        });
        
        if (response.ok) {
          console.log('✅ Сообщение с файлом успешно отправлено через HTTP');
        } else {
          console.warn(`⚠️ Ошибка отправки файла: ${response.status} ${response.statusText}`);
        }
      } else {
        // Для текстовых сообщений используем JSON
        console.log('📝 Отправка текстового сообщения');
        const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API}/groups/${this.groupId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
          },
          body: JSON.stringify(message),
        });
        
        if (response.ok) {
          console.log('✅ Текстовое сообщение успешно отправлено через HTTP');
        } else {
          console.warn(`⚠️ Ошибка отправки текста: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ HTTP fallback временно недоступен:', error);
      // Не выбрасываем ошибку, чтобы не прерывать UI
      console.log('⚠️ Сообщение будет отправлено через WebSocket когда соединение будет установлено');
    }
  }
  
  setMessageHandler(handler: (data: unknown) => void) {
    this.messageHandler = handler;
    console.log('✅ Обработчик сообщений установлен');
  }
  
  disconnect() {
    console.log('🔌 Принудительное закрытие WebSocket');
    this.shouldReconnect = false;
    this.stopPing();
    this.messageHandler = null;
    this.groupId = null;
    this.token = null;

    // Просто очищаем переменные без ошибок
    this.connectingPromise = null;
    this.resolveConnecting = null;
    this.rejectConnecting = null;
    
    if (this.ws) {
      this.ws.close(1000, 'Закрыто клиентом');
      this.ws = null;
    }
  }
  
  // HTTP polling fallback
  private startPolling(): void {
    if (this.pollingInterval) return;
    
    console.log('🔄 Запуск HTTP polling как fallback...');
    this.pollingInterval = setInterval(async () => {
      if (this.groupId && this.token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API}/groups/${this.groupId}/messages`, {
            headers: {
              'Authorization': `Bearer ${this.token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            // Здесь можно обработать новые сообщения
            console.log('📨 Получены сообщения через HTTP polling:', data.length);
          }
        } catch (error) {
          console.error('❌ Ошибка HTTP polling:', error);
        }
      }
    }, 5000); // Проверяем каждые 5 секунд
  }
  
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('⏹️ HTTP polling остановлен');
    }
  }
  
  getReadyState(): number | undefined {
    return this.ws?.readyState;
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || !this.isWebSocketAvailable;
  }
  
  isWebSocketEnabled(): boolean {
    return this.isWebSocketAvailable;
  }
}

export const wsManager = new WebSocketManager();
