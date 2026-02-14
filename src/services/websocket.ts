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
    this.groupId = groupId;
    this.token = token;
    this.shouldReconnect = true;

    this.wsUrlCandidates = [
      `ws://13.53.212.64/ws/messages?token=${token}`,
      `ws://13.53.212.64:8080/ws/messages?token=${token}`,
    ];
    this.wsUrlIndex = 0;

    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.ws?.readyState === WebSocket.CONNECTING && this.connectingPromise) {
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
        console.log(`🔌 Подключение к WebSocket (вариант ${this.wsUrlIndex + 1}/${this.wsUrlCandidates.length}):`, wsUrl);
        console.log('📊 Group ID:', groupId);
        console.log('🔑 Token (первые 20 символов):', token.substring(0, 20) + '...');

        try {
          this.ws = new WebSocket(wsUrl);

          const connectionTimeout = setTimeout(() => {
            if (this.ws?.readyState === WebSocket.CONNECTING) {
              console.log('⏰ Таймаут подключения, закрываем соединение');
              this.ws.close();
            }
          }, 5000); // 5 секунд на подключение

          this.ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log('✅ WebSocket СОЕДИНЕНИЕ УСТАНОВЛЕНО');
            console.log('🔗 URL:', wsUrl);
            this.startPing();
            this.reconnectAttempts = 0;
            this.stopPing();
            this.resolveConnecting?.();
            this.cleanupConnectingPromise();
          };

          this.ws.onerror = (error) => {
            console.error('❌ ОШИБКА WebSocket:', error);
            console.error('📡 ReadyState при ошибке:', this.ws?.readyState);
            console.error('🔗 URL:', wsUrl);
            
            // Если это ошибка соединения (не удалось подключиться), пробуем следующий URL
            if (this.ws?.readyState === WebSocket.CONNECTING) {
              console.log('🔄 Ошибка при подключении, пробуем следующий URL...');
              this.wsUrlIndex++;
              if (this.wsUrlIndex < this.wsUrlCandidates.length) {
                setTimeout(() => tryConnect(), 500); // Уменьшили задержку до 500ms
                return;
              }
            }
            // Не reject здесь: причина придёт в onclose.
          };

          this.ws.onclose = (event) => {
            console.log('🔌 WebSocket ЗАКРЫТ');
            console.log('📊 Close Code:', event.code);
            console.log('📝 Close Reason:', event.reason);
            console.log('🔍 Was Clean:', event.wasClean);

            const closeCodes: Record<number, string> = {
              1000: 'Normal Closure',
              1001: 'Going Away',
              1006: 'Abnormal Closure',
              1008: 'Policy Violation',
              1011: 'Internal Error',
            };

            console.log('ℹ️ Описание:', closeCodes[event.code] || 'Неизвестный код');
            this.stopPing();

            // Если соединение не успело открыться — пробуем следующий URL.
            if (this.connectingPromise) {
              if (this.wsUrlIndex < this.wsUrlCandidates.length - 1) {
                this.wsUrlIndex++;
                setTimeout(() => tryConnect(), 300); // Быстрое переключение
              } else {
                // Все URL испробованы, переключаемся на HTTP polling
                console.log('❌ Все WebSocket URL недоступны, переключаемся на HTTP polling');
                this.isWebSocketAvailable = false;
                this.startPolling();
                this.resolveConnecting?.(); // Резолвим промис, чтобы приложение продолжило работу
                this.cleanupConnectingPromise();
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
        this.connect(this.groupId!, this.token!).catch(err => {
          console.error('❌ Ошибка переподключения:', err);
        });
      }, 3000);
    } else {
      console.error('❌ Исчерпаны все попытки переподключения');
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
    
    if (readyState === WebSocket.OPEN) {
      try {
        this.ws!.send(JSON.stringify(message));
        console.log('✅ Сообщение успешно отправлено через WebSocket');
      } catch (error) {
        console.error('❌ Ошибка при отправке:', error);
        throw error;
      }
    } else if (!this.isWebSocketAvailable) {
      // Если WebSocket недоступен, отправляем через HTTP API
      this.sendMessageViaHTTP(message);
    } else {
      const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
      const stateName = stateNames[readyState || 3] || 'UNKNOWN';
      console.error(`❌ WebSocket не готов. Состояние: ${stateName} (${readyState})`);
      throw new Error(`WebSocket не подключен (состояние: ${stateName})`);
    }
  }
  
  private async sendMessageViaHTTP(message: unknown): Promise<void> {
    try {
      console.log('📤 Отправка сообщения через HTTP API');
      const response = await fetch('http://13.53.212.64/api/messages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(message),
      });
      
      if (response.ok) {
        console.log('✅ Сообщение успешно отправлено через HTTP');
      } else {
        throw new Error(`HTTP ошибка: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Ошибка отправки через HTTP:', error);
      throw error;
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

    // Если connect ещё не завершился — закрываем promise явно.
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      this.rejectConnecting?.(new Error('WebSocket connection cancelled by client'));
      this.cleanupConnectingPromise();
    }
    
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
          const response = await fetch(`http://13.53.212.64/api/messages/?group_id=${this.groupId}`, {
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
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager();
