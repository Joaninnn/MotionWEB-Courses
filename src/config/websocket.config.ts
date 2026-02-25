export const WEBSOCKET_CONFIG = {
  // Используем переменные окружения из .env
  baseUrl: process.env.NEXT_PUBLIC_WS_URL || 'wss://chat.apibackendokukg.space',
  httpUrl: process.env.NEXT_PUBLIC_CHAT_API || 'https://chat.apibackendokukg.space',
  pingInterval: 30000,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5
};

export const getWebSocketUrl = (groupId: number, token: string): string => {
  return `${WEBSOCKET_CONFIG.baseUrl}/ws/${groupId}/?token=${token}`;
};