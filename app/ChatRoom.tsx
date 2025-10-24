import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/shared/hooks/AppContext';
import { ThemedText } from '@/shared/components/ThemedText';
import { ThemedView } from '@/shared/components/ThemedView';
import { MessageBubble } from '@/shared/components/MessageBubble';
import { MessageActionMenu } from '@/shared/components/MessageActionMenu';
import { EditMessageModal } from '@/shared/components/EditMessageModal';
import { Avatar } from '@/shared/components/Avatar';
import { IconSymbol } from '@/shared/components/ui/IconSymbol';
import { Chat, Message } from '@/shared/database/services/chats';
import { markMessagesAsRead } from '@/shared/database/services/chats';

export default function ChatRoomScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { currentUser, users, chats, sendMessage, editMessage, deleteMessage, loadMoreMessages } = useAppContext();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // State for action menu and edit modal
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messagePosition, setMessagePosition] = useState({ x: 0, y: 0 });
  const [editModalVisible, setEditModalVisible] = useState(false);

  const chat = useMemo(() => chats.find(c => c.id === chatId) as Chat, [chats, chatId]);

  const chatParticipants = useMemo(() =>
    chat?.participants
      .filter(id => id !== currentUser?.id)
      .map(id => users.find(user => user.id === id))
      .filter(Boolean) || [],
    [chat, currentUser, users]
  );

  const chatName = useMemo(() =>
    chatParticipants.length === 1
      ? chatParticipants[0]?.name
      : `${chatParticipants[0]?.name || 'Unknown'} & ${chatParticipants.length - 1} other${chatParticipants.length > 1 ? 's' : ''}`,
    [chatParticipants]
  );

  const handleSendMessage = useCallback(() => {
    if (messageText.trim() && currentUser && chat) {
      sendMessage(chat.id, messageText.trim(), currentUser.id);
      setMessageText('');
    }
  }, [messageText, currentUser, chat, sendMessage]);

  const handleLoadMore = useCallback(() => {
    if (chatId) {
      loadMoreMessages(chatId);
    }
  }, [chatId, loadMoreMessages]);

  // Handle long press on message
  const handleMessageLongPress = useCallback((message: Message, position: { x: number; y: number }) => {
    setSelectedMessage(message);
    setMessagePosition(position);
    setActionMenuVisible(true);
  }, []);

  // Handle edit message
  const handleEditMessage = useCallback(() => {
    setActionMenuVisible(false);
    setEditModalVisible(true);
  }, []);

  // Handle save edited message
  const handleSaveEditedMessage = useCallback(async (newText: string) => {
    if (selectedMessage) {
      const success = await editMessage(selectedMessage.id, newText);
      if (success) {
        setEditModalVisible(false);
        setSelectedMessage(null);
      }
    }
  }, [selectedMessage, editMessage]);

  // Handle delete message
  const handleDeleteMessage = useCallback(async () => {
    if (selectedMessage) {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const success = await deleteMessage(selectedMessage.id);
              if (success) {
                setActionMenuVisible(false);
                setSelectedMessage(null);
              }
            },
          },
        ]
      );
    }
  }, [selectedMessage, deleteMessage]);

  // Handle dismiss action menu
  const handleDismissActionMenu = useCallback(() => {
    setActionMenuVisible(false);
    setSelectedMessage(null);
  }, []);

  // Handle cancel edit modal
  const handleCancelEditModal = useCallback(() => {
    setEditModalVisible(false);
    setSelectedMessage(null);
  }, []);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <MessageBubble
      message={item}
      isCurrentUser={item.senderId === currentUser?.id}
      onLongPress={handleMessageLongPress}
    />
  ), [currentUser?.id, handleMessageLongPress]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 80, // Estimated height for message bubble
    offset: 80 * index,
    index,
  }), []);

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
      markMessagesAsRead(chatId, currentUser.id);
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={() => (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText>No messages yet. Say hello!</ThemedText>
          </ThemedView>
        )}
      />

      <ThemedView style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
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