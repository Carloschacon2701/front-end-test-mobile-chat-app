import { chatsService } from '@/shared/services/chats'
import { useQuery } from '@tanstack/react-query'

export const useGetChats = (userId: string) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['chats'],
        queryFn: async () => await chatsService.loadUserChats(userId),
    })

    return {
        chats: data || [],
        isLoading,
        error,
    }
}
