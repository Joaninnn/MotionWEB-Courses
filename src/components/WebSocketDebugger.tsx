'use client';

import React, { useState, useEffect } from 'react';
import { wsManager } from '@/services/websocket';

interface WebSocketDebuggerProps {
  groupId: number;
}

const WebSocketDebugger: React.FC<WebSocketDebuggerProps> = ({ groupId }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState('Не подключен');
  
  useEffect(() => {
    const interval = setInterval(() => {
      const state = wsManager.getReadyState();
      const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
      setStatus(states[state || 3] || 'UNKNOWN');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };
  
  const testConnection = () => {
    const token = document.cookie
      .split('access_token=')[1]?.split(';')[0];
    
    if (!token) {
      addLog('❌ Токен не найден!');
      return;
    }
    
    addLog(`🔌 Подключаемся к группе ${groupId}...`);
    
    wsManager.connect(groupId, token)
      .then(() => addLog('✅ Подключение успешно!'))
      .catch(err => addLog(`❌ Ошибка: ${err.message}`));
    
    wsManager.setMessageHandler((data) => {
      addLog(`📨 Получено: ${JSON.stringify(data)}`);
    });
  };
  
  const sendTestMessage = () => {
    try {
      wsManager.sendMessage({
        text: 'Тестовое сообщение',
        group_id: groupId,
        message_type: 'text'
      });
      addLog('📤 Сообщение отправлено');
    } catch (err: any) {
      addLog(`❌ Ошибка отправки: ${err.message}`);
    }
  };
  
  const clearLogs = () => {
    setLogs([]);
  };
  
  return (
    <div style={{ 
      padding: '20px', 
      background: '#1a1a1a', 
      color: '#fff',
      border: '2px solid #ff0000',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3>🔧 WebSocket Debugger</h3>
      <p>Статус: <strong style={{ color: status === 'Подключено' ? '#00ff00' : '#ff0000' }}>{status}</strong></p>
      <p>Группа: <strong>{groupId}</strong></p>
      
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={testConnection}
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Подключиться
        </button>
        <button 
          onClick={sendTestMessage}
          style={{
            padding: '8px 16px',
            background: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Отправить тест
        </button>
        <button 
          onClick={() => wsManager.disconnect()}
          style={{
            padding: '8px 16px',
            background: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Отключиться
        </button>
        <button 
          onClick={clearLogs}
          style={{
            padding: '8px 16px',
            background: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Очистить логи
        </button>
      </div>
      
      <div style={{ 
        height: '300px', 
        overflow: 'auto', 
        background: '#000', 
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRadius: '4px'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#666' }}>Логи пусты. Нажмите Подключиться для начала</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
          ))
        )}
      </div>
    </div>
  );
};

export default WebSocketDebugger;