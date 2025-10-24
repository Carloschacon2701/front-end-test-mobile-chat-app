import React, { createContext, useContext, ReactNode } from 'react';
import { useChats } from './db/useChats';
import { DatabaseProvider } from '../database/context/DatabaseProvider';
import { useDatabase } from './db/useDatabase';
import { type Chat } from '../services/chats';
import { type User } from '../services/user';
import { useAuth } from './auth/useAuth';

type AppContextType = {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (userId: string) => Promise<boolean>;
  logout: () => void;
  chats: Chat[];
  unreadCounts: Record<string, number>;
  createChat: (participantIds: string[]) => Promise<Chat | null>;
  sendMessage: (chatId: string, text: string, senderId: string) => Promise<boolean>;
  editMessage: (messageId: string, newText: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  refreshUnreadCounts: () => Promise<void>;
  loading: boolean;
  dbInitialized: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppContent({ children }: { children: ReactNode }) {
  const { isInitialized } = useDatabase();
  const authContext = useAuth();
  const chatContext = useChats(authContext.currentUser?.id || '');

  const loading = !isInitialized || chatContext.loading;

  const value = {
    ...authContext,
    ...chatContext,
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