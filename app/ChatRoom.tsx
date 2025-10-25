import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '@/shared/components/ThemedText';
import { ThemedView } from '@/shared/components/ThemedView';
import { MessageBubble } from '@/shared/components/MessageBubble';
import { MessageActionMenu } from '@/shared/components/MessageActionMenu';
import { EditMessageModal } from '@/shared/components/EditMessageModal';
import { ImageViewer } from '@/shared/components/ImageViewer';
import { Avatar } from '@/shared/components/Avatar';
import { IconSymbol } from '@/shared/components/ui/IconSymbol';
import { useOptimizedChatRoom } from '@/shared/hooks/chats/useOptimizedChatRoom';
import { chatsService } from '@/shared/services/chat';

export default function ChatRoomScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { handleSendMessage,
    actionMenuVisible,
    selectedMessage,
    messagePosition,
    editModalVisible,
    imageViewerVisible,
    selectedImageUri,
    chatParticipants,
    handleChangeMessageText,
    messageText,
    chatName,
    currentUser,
    chat,
    handleMessageLongPress,
    handleEditMessage,
    handleSaveEditedMessage,
    handleDeleteMessage,
    handleDismissActionMenu,
    handleCancelEditModal,
    handlePickImage,
    handleImagePress,
    handleCloseImageViewer,
  } = useOptimizedChatRoom(chatId);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 80,
    offset: 80 * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <MessageBubble
      message={item}
      isCurrentUser={item.senderId === currentUser?.id}
      onLongPress={handleMessageLongPress}
      onImagePress={handleImagePress}
    />
  ), [currentUser?.id, handleMessageLongPress, handleImagePress]);

  useEffect(() => {
    if (chat?.messages.length && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chat?.messages.length]);

  // Mark messages as read when user views the chat
  useEffect(() => {
    if (chatId && currentUser?.id) {
      chatsService.markMessagesAsRead(chatId, currentUser.id);
    }
  }, [chatId, currentUser?.id]);


  if (!chat || !currentUser) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Chat not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="auto" />
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <Avatar
                user={chatParticipants[0]}
                size={32}
                showStatus={false}
              />
              <ThemedText type="defaultSemiBold" numberOfLines={1}>
                {chatName}
              </ThemedText>
            </View>
          ),
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <IconSymbol name="chevron.left" size={24} color="#007AFF" />
            </Pressable>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={chat.messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        // onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={() => (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText>No messages yet. Say hello!</ThemedText>
          </ThemedView>
        )}
      />

      <ThemedView style={styles.inputContainer}>
        <Pressable style={styles.imageButton} onPress={handlePickImage}>
          <IconSymbol name="camera" size={24} color="#007AFF" />
        </Pressable>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={handleChangeMessageText}
          placeholder="Type a message..."
          multiline
        />
        <Pressable
          style={[styles.sendButton, !messageText.trim() && styles.disabledButton]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <IconSymbol name="arrow.up.circle.fill" size={32} color="#007AFF" />
        </Pressable>
      </ThemedView>

      {/* Action Menu */}
      <MessageActionMenu
        visible={actionMenuVisible}
        messagePosition={messagePosition}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onDismiss={handleDismissActionMenu}
      />

      {/* Edit Message Modal */}
      <EditMessageModal
        visible={editModalVisible}
        initialText={selectedMessage?.text || ''}
        onSave={handleSaveEditedMessage}
        onCancel={handleCancelEditModal}
      />

      {/* Image Viewer */}
      <ImageViewer
        visible={imageViewerVisible}
        imageUri={selectedImageUri}
        onClose={handleCloseImageViewer}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  messagesContainer: {
    padding: 10,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  imageButton: {
    marginRight: 10,
    marginBottom: 5,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 20,
    padding: 10,
    maxHeight: 100,
    backgroundColor: '#F9F9F9',
  },
  sendButton: {
    marginLeft: 10,
    marginBottom: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 