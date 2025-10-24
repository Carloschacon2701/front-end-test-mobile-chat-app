import { type User } from "../../services/user";
import { useUserDb } from "./useUserDb";

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
