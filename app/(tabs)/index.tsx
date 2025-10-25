import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { useAppContext } from '@/shared/hooks/AppContext';
import { ThemedText } from '@/shared/components/ThemedText';
import { ThemedView } from '@/shared/components/ThemedView';
import { ChatListItem } from '@/shared/components/ChatListItem';
import { UserListItem } from '@/shared/components/UserListItem';
import { IconSymbol } from '@/shared/components/ui/IconSymbol';
import { useGetAllUsers } from '@/shared/hooks/users/useGetAllUsers';
import { useGetChats } from '@/shared/hooks/chats/useGetChats';
import { Chat } from '@/shared/services/chats';
import { useUserListActions } from '@/shared/hooks/chats/useUserListActions';
import { router } from 'expo-router';

export default function ChatsScreen() {
  const { currentUser } = useAppContext();
  const { users } = useGetAllUsers();
  const { createChatMutation } = useUserListActions();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { chats } = useGetChats(searchQuery);

  const toggleUserSelection = useCallback((userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  }, [selectedUsers]);

  const handleCreateChat = useCallback(() => {
    if (currentUser && selectedUsers.length > 0) {
      const participants = [currentUser.id, ...selectedUsers];

      const existingChat = chats.find(chat => chat.participants.every(participant => participants.includes(participant)));

      if (existingChat) {
        setModalVisible(false);
        setSelectedUsers([]);
        router.push(`/ChatRoom?chatId=${existingChat.id}`);
        return;
      }

      createChatMutation.mutate(participants);
      setModalVisible(false);
      setSelectedUsers([]);
    }
  }, [currentUser, selectedUsers, createChatMutation]);

  const getItemLayout = (data: any, index: number) => ({
    length: 74, // Fixed height for chat list items
    offset: 74 * index,
    index,
  });

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const renderEmptyComponent = useCallback(() => (
    <ThemedView style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>No chats yet</ThemedText>
      <ThemedText>Tap the + button to start a new conversation</ThemedText>
    </ThemedView>
  ), []);

  const keyExtractor = (item: any) => item.id;

  const renderChatItem = useCallback(({ item }: { item: Chat }) => (
    <ChatListItem
      chat={item}
      currentUserId={currentUser?.id || ''}
      users={users}
      unreadCount={item.unreadCount}
      searchQuery={searchQuery}
    />
  ), [currentUser?.id, users, searchQuery]);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery) {
      return chats;
    }
    // Show all chats, but ChatListItem will show which ones have matching messages
    return chats.filter(chat => chat.messages.length > 0);
  }, [chats, searchQuery]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Chats</ThemedText>
        <Pressable
          style={styles.newChatButton}
          onPress={() => setModalVisible(true)}
        >
          <IconSymbol name="plus" size={24} color="#007AFF" />
        </Pressable>
      </ThemedView>

      <TextInput
        placeholder="Search chats"
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filteredChats}
        keyExtractor={keyExtractor}
        renderItem={renderChatItem}
        getItemLayout={getItemLayout}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedUsers([]);
        }}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">New Chat</ThemedText>
              <Pressable onPress={() => {
                setModalVisible(false);
                setSelectedUsers([]);
              }}>
                <IconSymbol name="xmark" size={24} color="#007AFF" />
              </Pressable>
            </ThemedView>

            <ThemedText style={styles.modalSubtitle}>
              Select users to chat with
            </ThemedText>

            <FlatList
              data={users.filter(user => user.id !== currentUser?.id)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserListItem
                  user={item}
                  onSelect={() => toggleUserSelection(item.id)}
                  isSelected={selectedUsers.includes(item.id)}
                />
              )}
              style={styles.userList}
            />

            <Pressable
              style={[
                styles.createButton,
                selectedUsers.length === 0 && styles.disabledButton
              ]}
              onPress={handleCreateChat}
              disabled={selectedUsers.length === 0}
            >
              <ThemedText style={styles.createButtonText}>
                Create Chat
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalSubtitle: {
    marginBottom: 10,
  },
  userList: {
    maxHeight: 400,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
