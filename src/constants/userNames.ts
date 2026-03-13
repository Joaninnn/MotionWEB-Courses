
export const USER_NAMES: Record<number, string> = {
};

export const USER_ROLES: Record<number, string> = {
 
};

export const getUserNameById = (userId: number): string => {
  return USER_NAMES[userId] || `Диалог`;
};

export const getUserRoleById = (userId: number): string => {
  return USER_ROLES[userId] || 'student';
};

export const getDisplayRole = (role: string): string => {
  if (role === 'mentor') return 'Ментор';
  if (role === 'student') return 'Студент';
  if (role === 'admin') return 'Админ';
  return 'Студент';
};
