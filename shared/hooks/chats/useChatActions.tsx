import { chatsService, Message } from '@/shared/services/chats';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useChatActions = (currentUserId: string) => {
    const queryClient = useQueryClient();

    const createChatMutation = useMutation({
        mutationFn: async (participantIds: string[]) => {
            return await chatsService.createNewChat(currentUserId, participantIds);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });

        }
    });

    const deleteMessageMutation = useMutation({
        mutationFn: async (messageId: string) => {
            return await chatsService.deleteMessage(messageId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
    });

    const editMessageMutation = useMutation({
        mutationFn: async (data: { id: string, text: string }) => {
            return await chatsService.editMessage(data.id, data.text);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (data: { chatId: string, senderId: string, text: string }) => {
            return await chatsService.sendMessageToChat(data.chatId, data.senderId, data.text);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
    });

    return {
        createChatMutation,
        deleteMessageMutation,
        editMessageMutation,
        sendMessageMutation,
    }
}
