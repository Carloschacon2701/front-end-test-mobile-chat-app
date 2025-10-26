import { chatsService } from "@/shared/services/chat";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "../AppContext";

export const useGetChatList = (filter: string = '') => {
    const { currentUser } = useAppContext();

    const { data, isLoading, error } = useQuery({
        queryKey: ['chats', filter],
        queryFn: async () => {
            if (!currentUser?.id) {
                return [];
            }
            const result = await chatsService.getChatList(currentUser.id, filter);
            return result;
        },
        enabled: !!currentUser?.id,
    });

    return {
        chats: data || [],
        isLoading,
        error,
    };
};