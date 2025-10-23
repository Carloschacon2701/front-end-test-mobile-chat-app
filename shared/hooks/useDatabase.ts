import { useDatabaseStatus } from "../database/context/DatabaseProvider";

export function useDatabase() {
  return useDatabaseStatus();
}
