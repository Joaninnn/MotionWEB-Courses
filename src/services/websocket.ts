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
    if (this.ws?.readyState === WebSocket.OPEN && this.groupId === groupId) {
      return Promise.resolve();
    }

    this.groupId = groupId;
    this.token = token;
    this.shouldReconnect = true;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
                  process.env.NEXT_PUBLIC_CHAT_API?.replace('http', 'ws') || 
                  'ws://13.53.67.23:8000';
    
    this.wsUrlCandidates = [
      `${wsUrl}/ws/messages?token=${token}&group_id=${groupId}`,
    ];
    this.wsUrlIndex = 0;

    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
      this.ws = null;
    }

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

        try {
          this.ws = new WebSocket(wsUrl);

          const connectionTimeout = setTimeout(() => {
            if (this.ws?.readyState === WebSocket.CONNECTING) {
              this.ws.close();
            }
          }, 3000);

          this.ws.onopen = () => {
            clearTimeout(connectionTimeout);
            this.startPing();
            this.reconnectAttempts = 0;
            this.stopPing();
            this.resolveConnecting?.();
            this.cleanupConnectingPromise();
          };

          this.ws.onerror = () => {
            
            if (this.ws?.readyState === WebSocket.CONNECTING) {
              this.wsUrlIndex++;
              if (this.wsUrlIndex < this.wsUrlCandidates.length) {
                setTimeout(() => tryConnect(), 500);
                return;
              }
            }
            
          };

          this.ws.onclose = (event) => {
            if (event.code !== 1000) { 
            }
            
            this.stopPing();

            if (this.connectingPromise) {
              if (this.wsUrlIndex < this.wsUrlCandidates.length - 1) {
                this.wsUrlIndex++;
                setTimeout(() => tryConnect(), 300);
              } else {
                this.isWebSocketAvailable = false;
                this.startPolling();
                this.resolveConnecting?.();
                this.cleanupConnectingPromise();
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
              const data = JSON.parse(event.data);

              this.messageHandler?.(data);
            } catch (error) {
            }
          };
        } catch (error) {

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
      
      setTimeout(() => {
        if (this.shouldReconnect) {
          this.connect(this.groupId!, this.token!).catch(err => {
          });
        }
      }, 3000);
    } else {
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
    }
  }
  
  sendMessage(message: unknown): void {
    const readyState = this.ws?.readyState;
    
    
    if (message && typeof message === 'object' && message !== null && 'group_id' in message) {
      const messageGroupId = (message as { group_id?: number }).group_id;
      if (messageGroupId !== undefined && messageGroupId !== this.groupId) {
        return;
      }
    }
    
    if (readyState === WebSocket.OPEN) {
      try {
        this.ws!.send(JSON.stringify(message));
      } catch (error) {
        this.sendMessageViaHTTP(message);
      }
    } else if (readyState === WebSocket.CONNECTING) {
      setTimeout(() => {
        this.sendMessage(message);
      }, 1000);
    } else {
      this.sendMessageViaHTTP(message);
    }
  }
  
  private async sendMessageViaHTTP(message: unknown): Promise<void> {
    try {
      
      const messageObj = message as { text?: string; file?: File; file_url?: string; attachments?: unknown[] };
      
      if (messageObj.attachments && messageObj.attachments.length > 0) {
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API}/groups/${this.groupId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
          body: JSON.stringify(message),
        });
        
        if (response.ok) {
        } else {
        }
        return;
      }
      
      if (messageObj.file_url || messageObj.file) {
        
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
        } else {
        }
      } else {
        const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API}/groups/${this.groupId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
          },
          body: JSON.stringify(message),
        });
        
        if (response.ok) {
        } else {
        }
      }
    } catch (error) {
    }
  }
  
  setMessageHandler(handler: (data: unknown) => void) {
    this.messageHandler = handler;
  }
  
  disconnect() {
    this.shouldReconnect = false;
    this.stopPing();
    this.messageHandler = null;
    this.groupId = null;
    this.token = null;

    this.connectingPromise = null;
    this.resolveConnecting = null;
    this.rejectConnecting = null;
    
    if (this.ws) {
      this.ws.close(1000, 'Закрыто клиентом');
      this.ws = null;
    }
  }
  
  private startPolling(): void {
    if (this.pollingInterval) return;
    
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
          }
        } catch (error) {
        }
      }
    }, 5000); 
  }
  
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
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
