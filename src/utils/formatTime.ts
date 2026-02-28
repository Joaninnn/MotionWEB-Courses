export const formatTime = (dateString: string) => {
  // Сервер отдаёт UTC без Z, парсим как UTC
  const date = new Date(dateString + 'Z');
  return date.toLocaleTimeString('ru-RU', { 
    timeZone: 'Asia/Bishkek',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
