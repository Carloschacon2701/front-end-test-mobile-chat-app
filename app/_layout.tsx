import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/shared/hooks/theme/useColorScheme';
import { AppProvider, useAppContext } from '@/shared/hooks/AppContext';
import { DrizzleStudioDevTool } from '@/shared/database/DrizzleStudio';
import { useProtectedRoute } from '@/shared/hooks/auth/useProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();


function RootLayoutNav() {
  const { isLoggedIn, loading } = useAppContext();

  // Call the hook unconditionally
  useProtectedRoute(isLoggedIn, loading);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="ChatRoom"
          options={{ headerShown: true }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      {__DEV__ && <DrizzleStudioDevTool />}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
