import { useState, useEffect, useCallback } from "react";
import { userService, type User } from "../../services/user";

export function useUserDb() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all users from the database
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await userService.loadAllUsers();
        setAllUsers(usersData);
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

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
    users: allUsers,
    currentUser,
    login,
    logout,
    isLoggedIn: !!currentUser,
    loading,
  };
}
