import { useAppContext } from '@/shared/hooks/AppContext';
import { chatsService } from '@/shared/services/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUserListActions = () => {
    const { currentUser } = useAppContext();
    const queryClient = useQueryClient();

    const createChatMutation = useMutation({
        mutationFn: async (participantIds: string[]) => {
            return await chatsService.createNewChat(currentUser?.id || '', participantIds);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });

        }
    });


    const deleteChatMutation = useMutation({
        mutationFn: async (chatId: string) => {
            return await chatsService.deleteChat(chatId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
    });

    return (
        {
            createChatMutation,
            deleteChatMutation,
        }
    )
}
