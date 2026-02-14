export const WEBSOCKET_CONFIG = {
  // ВАЖНО: без порта 8000!
  baseUrl: 'ws://13.53.212.64',
  httpUrl: 'http://13.53.212.64:8000',
  pingInterval: 30000,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5
};

export const getWebSocketUrl = (groupId: number, token: string): string => {
  return `${WEBSOCKET_CONFIG.baseUrl}/ws/${groupId}/?token=${token}`;
};