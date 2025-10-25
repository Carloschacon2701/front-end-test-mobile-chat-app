import { useAppContext } from '@/shared/hooks/AppContext';
import { chatsService } from '@/shared/services/chat';
import { useQuery } from '@tanstack/react-query';

/**
 * Optimized hook that uses the existing chatsService with better caching
 * Provides better performance through improved state management
 */
export const useOptimizedChats = (filter: string = '') => {
    const { currentUser } = useAppContext();

    const { data, isLoading, error } = useQuery({
        queryKey: ['chats', filter],
        queryFn: async () => {
            if (!currentUser?.id) {
                console.log('No current user ID');
                return [];
            }
            console.log('Loading chats for user:', currentUser.id);
            const result = await chatsService.loadUserChatsOptimized(currentUser.id, filter);
            console.log('Hook received chats:', result.length);
            return result;
        },
        enabled: !!currentUser?.id,
        staleTime: 30000, // 30 seconds cache
        gcTime: 60000, // 1 minute cache time
    });

    return {
        chats: data || [],
        isLoading,
        error,
    };
};

/**
 * Hook to get optimized chat messages with pagination
 */
export const useOptimizedChatMessages = (chatId: string, offset: number = 0, limit: number = 50) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['chatMessages', chatId, offset, limit],
        queryFn: async () => {
            return await chatsService.getChatMessagesPaginated(chatId, offset, limit, '');
        },
        enabled: !!chatId,
        staleTime: 10000, // 10 seconds cache for messages
        gcTime: 30000, // 30 seconds cache time
    });

    return {
        messages: data || [],
        isLoading,
        error,
    };
};
