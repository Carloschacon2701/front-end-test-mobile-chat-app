import { userService } from '@/shared/services/user';
import { useQuery } from '@tanstack/react-query';

export const useGetAllUsers = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: userService.loadAllUsers
    })

    return {
        users: data || [],
        loading: isLoading,
        error: error
    }
}
