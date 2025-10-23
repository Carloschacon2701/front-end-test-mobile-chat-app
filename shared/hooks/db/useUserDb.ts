import { useState, useEffect, useCallback } from 'react';
import { db } from '../../database/db';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
}

export function useUserDb() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all users from the database
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await db.select().from(users);
        setAllUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);
  
  const login = useCallback(async (userId: string) => {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId));
      
      if (user && user.length > 0) {
        setCurrentUser(user[0]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during login:', error);
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