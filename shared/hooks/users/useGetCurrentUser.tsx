import { userService } from '@/shared/services/user'
import { useQuery } from '@tanstack/react-query'

export const useGetCurrentUser = (userId: string) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => await userService.getUserById(userId)
    })

    return {
        currentUser: data,
        loading: isLoading,
        error: error
    }

}
