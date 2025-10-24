import { db } from "../database/db";
import { users } from "../database/schema";
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
  /**
   * Load all users from the database
   * Cached for 60 seconds since user data doesn't change frequently
   */
  async loadAllUsers(): Promise<User[]> {
    const usersData = await db.select().from(users);
    return usersData;
  }

  /**
   * Get a user by their ID
   * Cached for 60 seconds since user data doesn't change frequently
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = await db.select().from(users).where(eq(users.id, userId));

    const result = user && user.length > 0 ? user[0] : null;
    return result;
  }
}

// Export a singleton instance for backward compatibility
export const userService = new UserService();
