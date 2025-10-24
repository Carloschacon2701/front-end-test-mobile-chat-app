import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedText } from '@/shared/components/ThemedText';
import { IconSymbol } from '@/shared/components/ui/IconSymbol';
import { useColorScheme } from '@/shared/hooks/useColorScheme';

interface MessageActionMenuProps {
    visible: boolean;
    messagePosition: { x: number; y: number };
    onEdit: () => void;
    onDelete: () => void;
    onDismiss: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MessageActionMenu = React.memo(({
    visible,
    messagePosition,
    onEdit,
    onDelete,
    onDismiss,
}: MessageActionMenuProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const scaleAnim = React.useRef(new Animated.Value(0)).current;
    const opacityAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 300,
                    friction: 10,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 300,
                    friction: 10,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, scaleAnim, opacityAnim]);

    if (!visible) return null;

    // Calculate menu position to avoid screen edges
    const menuWidth = 120;
    const menuHeight = 80;
    const padding = 20;

    let menuX = messagePosition.x - menuWidth / 2;
    let menuY = messagePosition.y - menuHeight - 10;

    // Adjust position if too close to edges
    if (menuX < padding) menuX = padding;
    if (menuX + menuWidth > screenWidth - padding) menuX = screenWidth - menuWidth - padding;
    if (menuY < padding) menuY = messagePosition.y + 10;

    return (
        <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurContainer}
        >
            <Pressable style={styles.backdrop} onPress={onDismiss} />

            <Animated.View
                style={[
                    styles.menuContainer,
                    {
                        left: menuX,
                        top: menuY,
                        backgroundColor: isDark ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    }
                ]}
            >
                <Pressable
                    style={[styles.actionButton, { borderBottomWidth: 1, borderBottomColor: isDark ? '#555' : '#E1E1E1' }]}
                    onPress={onEdit}
                >
                    <IconSymbol name="pencil" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
                    <ThemedText style={styles.actionText}>Edit</ThemedText>
                </Pressable>

                <Pressable
                    style={styles.actionButton}
                    onPress={onDelete}
                >
                    <IconSymbol name="trash" size={18} color="#FF3B30" />
                    <ThemedText style={[styles.actionText, { color: '#FF3B30' }]}>Delete</ThemedText>
                </Pressable>
            </Animated.View>
        </BlurView>
    );
});

const styles = StyleSheet.create({
    blurContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    backdrop: {
        flex: 1,
    },
    menuContainer: {
        position: 'absolute',
        width: 120,
        height: 80,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        overflow: 'hidden',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        gap: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
