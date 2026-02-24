// src/constants/userNames.ts

// Общий кэш имен пользователей для чатов
export const USER_NAMES: Record<number, string> = {
  4: 'mentor',   // Текущий пользователь
  12: 'aza',     // Собеседник
  13: 'инсан',   // Другой пользователь
  6: 'нурик',   // Другой пользователь
  8: 'моушн2023', // Другой пользователь
  9: 'maria',    // Другой пользователь
  10: 'david',    // Другой пользователь
  11: 'sarah',   // Другой пользователь
  1: 'admin',    // Добавим для ID 1
};

// Общий кэш ролей пользователей
export const USER_ROLES: Record<number, string> = {
  4: 'mentor',   // Текущий пользователь
  12: 'student', // Собеседник
  13: 'student', // Другой пользователь
  6: 'student',  // Другой пользователь
  8: 'mentor',   // Другой пользователь
  9: 'student',  // Другой пользователь
  10: 'student',  // Другой пользователь
  11: 'student',  // Другой пользователь
  1: 'admin',    // Добавим для ID 1
};

// Функция для получения имени по ID
export const getUserNameById = (userId: number): string => {
  return USER_NAMES[userId] || `Диалог`;
};

// Функция для получения роли по ID
export const getUserRoleById = (userId: number): string => {
  return USER_ROLES[userId] || 'student';
};

// Функция для получения отображаемой роли
export const getDisplayRole = (role: string): string => {
  if (role === 'mentor') return 'Ментор';
  if (role === 'student') return 'Студент';
  if (role === 'admin') return 'Админ';
  return 'Студент';
};
