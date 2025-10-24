import { db } from "../db";
import { users } from "../schema";
import { eq, desc } from "drizzle-orm";

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
}

export interface UserData {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
}

export class UserService {
  // Simple in-memory cache for user queries
  private userCache = new Map<string, { data: any; timestamp: number }>();
  private readonly USER_CACHE_TTL = 60000; // 60 seconds cache TTL for users

  private getCachedUser<T>(key: string): T | null {
    const cached = this.userCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.USER_CACHE_TTL) {
      return cached.data as T;
    }
    this.userCache.delete(key);
    return null;
  }

  private setCachedUser<T>(key: string, data: T): void {
    this.userCache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateUserCache(): void {
    this.userCache.clear();
  }

  /**
   * Load all users from the database
   * Cached for 60 seconds since user data doesn't change frequently
   */
  async loadAllUsers(): Promise<User[]> {
    const cacheKey = "all_users";
    const cached = this.getCachedUser<User[]>(cacheKey);
    if (cached) return cached;

    const usersData = await db.select().from(users);
    this.setCachedUser(cacheKey, usersData);
    return usersData;
  }

  /**
   * Get a user by their ID
   * Cached for 60 seconds since user data doesn't change frequently
   */
  async getUserById(userId: string): Promise<User | null> {
    const cacheKey = `user_${userId}`;
    const cached = this.getCachedUser<User | null>(cacheKey);
    if (cached !== null) return cached;

    const user = await db.select().from(users).where(eq(users.id, userId));

    const result = user && user.length > 0 ? user[0] : null;
    this.setCachedUser(cacheKey, result);
    return result;
  }
}

// Export a singleton instance for backward compatibility
export const userService = new UserService();
