import { useSegments, useRouter } from 'expo-router';
import { useEffect } from 'react'

export const useProtectedRoute = (isLoggedIn: boolean, loading: boolean) => {
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // Don't redirect during loading

        const inAuthGroup = segments[0] === 'login';

        if (!isLoggedIn && !inAuthGroup) {
            // Redirect to the login page if not logged in
            router.replace('/login');
        } else if (isLoggedIn && inAuthGroup) {
            // Redirect to the home page if logged in and trying to access login page
            router.replace('/(tabs)');
        }
    }, [isLoggedIn, segments, loading]);
}
