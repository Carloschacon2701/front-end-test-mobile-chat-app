import React from 'react';
import {
    Modal,
    View,
    StyleSheet,
    Pressable,
    Dimensions,
    StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { IconSymbol } from './ui/IconSymbol';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageViewerProps {
    visible: boolean;
    imageUri: string;
    onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
    visible,
    imageUri,
    onClose,
}) => {
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    const resetValues = () => {
        scale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        opacity.value = 1;
    };

    const closeViewer = () => {
        resetValues();
        onClose();
    };

    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = Math.max(0.5, Math.min(3, event.scale));
        })
        .onEnd(() => {
            if (scale.value < 1) {
                scale.value = withSpring(1);
            } else if (scale.value > 2.5) {
                scale.value = withSpring(2.5);
            }
        });

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (scale.value > 1) {
                translateX.value = event.translationX;
                translateY.value = event.translationY;
            }
        })
        .onEnd(() => {
            if (scale.value <= 1) {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        });

    const tapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (scale.value === 1) {
                scale.value = withSpring(2);
            } else {
                scale.value = withSpring(1);
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        });

    const swipeDownGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
                opacity.value = Math.max(0.3, 1 - event.translationY / 300);
            }
        })
        .onEnd((event) => {
            if (event.translationY > 100 || event.velocityY > 500) {
                runOnJS(closeViewer)();
            } else {
                translateY.value = withSpring(0);
                opacity.value = withSpring(1);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
        opacity: opacity.value,
    }));

    const backgroundStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const composedGesture = Gesture.Simultaneous(
        pinchGesture,
        panGesture,
        tapGesture,
        swipeDownGesture
    );

    if (!visible || !imageUri) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={closeViewer}
        >
            <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
            <Animated.View style={[styles.container, backgroundStyle]}>
                <Pressable style={styles.closeButton} onPress={closeViewer}>
                    <IconSymbol name="xmark" size={24} color="#FFFFFF" />
                </Pressable>

                <GestureDetector gesture={composedGesture}>
                    <Animated.View style={styles.imageContainer}>
                        <Animated.View style={animatedStyle}>
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.image}
                                contentFit="contain"
                                transition={200}
                            />
                        </Animated.View>
                    </Animated.View>
                </GestureDetector>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width: screenWidth,
        height: screenHeight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: screenWidth,
        height: screenHeight,
    },
});
