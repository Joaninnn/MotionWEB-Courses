export const formatTime = (dateString: string) => {
  const date = new Date(dateString + 'Z');
  return date.toLocaleTimeString('ru-RU', { 
    timeZone: 'Asia/Bishkek',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
