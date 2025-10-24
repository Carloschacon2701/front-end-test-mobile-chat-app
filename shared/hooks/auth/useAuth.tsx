import { userService } from '@/shared/services/user';
import { useCallback, useState } from 'react'
import { type User } from '@/shared/services/user';

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const login = useCallback(async (userId: string) => {
        try {
            const user = await userService.getUserById(userId);

            if (user) {
                setCurrentUser(user);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error during login:", error);
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        setCurrentUser(null);
    }, []);

    return {
        currentUser,
        login,
        logout,
        isLoggedIn: !!currentUser,
    };
}