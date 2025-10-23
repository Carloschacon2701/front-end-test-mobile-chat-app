import { db } from "../db";
import { users } from "../schema";
import { eq, desc } from "drizzle-orm";

// Simple in-memory cache for user queries
const userCache = new Map<string, { data: any; timestamp: number }>();
const USER_CACHE_TTL = 60000; // 60 seconds cache TTL for users

function getCachedUser<T>(key: string): T | null {
  const cached = userCache.get(key);
  if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
    return cached.data as T;
  }
  userCache.delete(key);
  return null;
}

function setCachedUser<T>(key: string, data: T): void {
  userCache.set(key, { data, timestamp: Date.now() });
}

function invalidateUserCache(): void {
  userCache.clear();
}

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
 * Cached for 60 seconds since user data doesn't change frequently
 */
export async function loadAllUsers(): Promise<User[]> {
  const cacheKey = "all_users";
  const cached = getCachedUser<User[]>(cacheKey);
  if (cached) return cached;

  const usersData = await db.select().from(users);
  setCachedUser(cacheKey, usersData);
  return usersData;
}

/**
 * Get a user by their ID
 * Cached for 60 seconds since user data doesn't change frequently
 */
export async function getUserById(userId: string): Promise<User | null> {
  const cacheKey = `user_${userId}`;
  const cached = getCachedUser<User | null>(cacheKey);
  if (cached !== null) return cached;

  const user = await db.select().from(users).where(eq(users.id, userId));

  const result = user && user.length > 0 ? user[0] : null;
  setCachedUser(cacheKey, result);
  return result;
}
