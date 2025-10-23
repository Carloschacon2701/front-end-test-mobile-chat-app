import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";

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

/**
 * Load all users from the database
 */
export async function loadAllUsers(): Promise<User[]> {
  const usersData = await db.select().from(users);
  return usersData;
}

/**
 * Get a user by their ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const user = await db.select().from(users).where(eq(users.id, userId));

  if (user && user.length > 0) {
    return user[0];
  }

  return null;
}
