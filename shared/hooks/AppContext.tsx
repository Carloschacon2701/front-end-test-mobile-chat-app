import React, { createContext, useContext, ReactNode } from 'react';
import { DatabaseProvider, useDatabase } from '../database/context/DatabaseProvider';
import { type User } from '../services/user';
import { useAuth } from './auth/useAuth';

type AppContextType = {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (userId: string) => Promise<boolean>;
  logout: () => void;
  dbInitialized: boolean;
  loading: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppContent({ children }: { children: ReactNode }) {
  const { isInitialized } = useDatabase();
  const authContext = useAuth();

  const loading = !isInitialized

  const value = {
    ...authContext,
    loading,
    dbInitialized: isInitialized,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
      <AppContent>{children}</AppContent>
    </DatabaseProvider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 