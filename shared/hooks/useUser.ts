import { type User } from "../database/services/user";
import { useUserDb } from "./db/useUserDb";

export { User };

export function useUser() {
  const { users, currentUser, login, logout, isLoggedIn, loading } =
    useUserDb();

  return {
    users,
    currentUser,
    login,
    logout,
    isLoggedIn,
    loading,
  };
}
