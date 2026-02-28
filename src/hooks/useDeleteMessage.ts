import { useDeleteMessageMutation } from '@/redux/api/chat';

export const useDeleteMessage = () => {
  const [deleteMessage] = useDeleteMessageMutation();
  
  return deleteMessage;
};
