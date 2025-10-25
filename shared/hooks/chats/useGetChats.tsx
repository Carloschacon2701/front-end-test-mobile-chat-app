import { useAppContext } from '@/shared/hooks/AppContext';
import { chatsService } from '@/shared/services/chats'
import { useQuery } from '@tanstack/react-query'

export const useGetChats = (filter: string = '') => {
    const { currentUser } = useAppContext();
    const { data, isLoading, error } = useQuery({
        queryKey: ['chats', filter],
        queryFn: async () => await chatsService.loadUserChats(currentUser?.id || '', filter),
    })

    return {
        chats: data || [],
        isLoading,
        error,
    }
}
