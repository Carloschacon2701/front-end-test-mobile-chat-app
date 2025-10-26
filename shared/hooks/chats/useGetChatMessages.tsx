import { Chat, chatsService } from '@/shared/services/chat';
import { useQuery } from '@tanstack/react-query';

export const useGetChatMessages = (chatId: string, filter: string = "", offset: number = 0, limit: number = 50) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['chatMessages', chatId, offset, limit],
        queryFn: async () => {
            return await chatsService.getChat(chatId);
        },
        enabled: !!chatId,

    });

    return {
        chat: data || {} as Chat,
        isLoading,
        error,
    };
};
