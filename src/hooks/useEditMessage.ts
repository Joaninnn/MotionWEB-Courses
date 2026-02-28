import { useEditMessageMutation } from '@/redux/api/chat';

export const useEditMessage = () => {
  const [editMessage] = useEditMessageMutation();
  
  return editMessage;
};
