import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Pressable, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedText } from '@/shared/components/ThemedText';
import { IconSymbol } from '@/shared/components/ui/IconSymbol';
import { useColorScheme } from '@/shared/hooks/useColorScheme';

interface EditMessageModalProps {
    visible: boolean;
    initialText: string;
    onSave: (newText: string) => void;
    onCancel: () => void;
}

export const EditMessageModal = React.memo(({
    visible,
    initialText,
    onSave,
    onCancel,
}: EditMessageModalProps) => {
    const [text, setText] = useState(initialText);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        if (visible) {
            setText(initialText);
        }
    }, [visible, initialText]);

    const handleSave = () => {
        const trimmedText = text.trim();
        if (trimmedText && trimmedText !== initialText) {
            onSave(trimmedText);
        } else {
            onCancel();
        }
    };

    const handleCancel = () => {
        setText(initialText);
        onCancel();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={styles.blurContainer}
            >
                <Pressable style={styles.backdrop} onPress={handleCancel} />

                <View
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        }
                    ]}
                >
                    <ThemedText style={styles.title}>Edit Message</ThemedText>

                    <TextInput
                        style={[
                            styles.textInput,
                            {
                                backgroundColor: isDark ? 'rgba(60, 60, 60, 0.8)' : 'rgba(240, 240, 240, 0.8)',
                                color: isDark ? '#FFFFFF' : '#000000',
                            }
                        ]}
                        value={text}
                        onChangeText={setText}
                        placeholder="Type your message..."
                        placeholderTextColor={isDark ? '#999999' : '#666666'}
                        multiline
                        maxLength={1000}
                        autoFocus
                        selectTextOnFocus
                    />

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.button,
                                styles.saveButton,
                                { backgroundColor: text.trim() ? '#007AFF' : '#CCCCCC' }
                            ]}
                            onPress={handleSave}
                            disabled={!text.trim()}
                        >
                            <ThemedText style={[
                                styles.saveButtonText,
                                { color: text.trim() ? '#FFFFFF' : '#999999' }
                            ]}>
                                Save
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
});

const styles = StyleSheet.create({
    blurContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E1E1E1',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 100,
        maxHeight: 200,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E1E1E1',
    },
    saveButton: {
        // backgroundColor set dynamically
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
