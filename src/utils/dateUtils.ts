// Утилитарная функция для форматирования даты с правильной типизацией
export const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    
    // Проверяем, что строка соответствует формату ISO 8601
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!iso8601Regex.test(dateString)) return dateString;
    
    try {
        // Создаем дату с правильным типом
        const date = new Date(dateString);
        
        // Проверяем, что дата валидная
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('ru-RU');
    } catch (error) {
        console.warn('Error formatting date:', error);
        return dateString;
    }
};
