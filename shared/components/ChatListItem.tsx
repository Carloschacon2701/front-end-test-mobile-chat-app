import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from './Avatar';
import { ThemedText } from './ThemedText';
import { type User } from '../services/user';
import { formatChatTime } from '../utils/timeUtils';
import { Chat } from '../services/chat';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
  users: User[];
  unreadCount?: number;
  searchQuery?: string;
}

const ChatListItem = React.memo(({ chat, currentUserId, users, unreadCount = 0, searchQuery = '' }: ChatListItemProps) => {
  const navigation = useNavigation();

  const otherParticipants = useMemo(() => {
    return chat.participants
      .filter(id => id !== currentUserId)
      .map(id => users.find(user => user.id === id))
      .filter(Boolean) as User[];
  }, [chat.participants, currentUserId, users]);

  const chatName = useMemo(() => {
    if (otherParticipants.length === 0) {
      return 'No participants';
    } else if (otherParticipants.length === 1) {
      return otherParticipants[0].name;
    } else {
      return `${otherParticipants[0].name} & ${otherParticipants.length - 1} other${otherParticipants.length > 2 ? 's' : ''}`;
    }
  }, [otherParticipants]);

  const handlePress = () => {
    (navigation as any).navigate('ChatRoom', { chatId: chat.id });
  };

  const timeString = useMemo(() => {
    if (!chat.lastMessage) return '';
    return formatChatTime(chat.lastMessage.timestamp);
  }, [chat.lastMessage]);

  const isCurrentUserLastSender = chat.lastMessage?.senderId === currentUserId;

  // Find matching messages for search
  const matchingMessages = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return chat.messages.filter(msg =>
      msg.text.toLowerCase().includes(query) && !msg.isDeleted
    );
  }, [chat.messages, searchQuery]);

  // Get the preview text to show
  const previewText = useMemo(() => {
    if (searchQuery && matchingMessages.length > 0) {
      const matchCount = matchingMessages.length;
      return `${matchCount} message${matchCount > 1 ? 's' : ''} match your search`;
    }
    return chat.lastMessage ? chat.lastMessage.text : '';
  }, [searchQuery, matchingMessages.length, chat.lastMessage]);

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Avatar
        user={otherParticipants[0]}
        size={50}
      />
      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.name}>
            {chatName}
          </ThemedText>
          {timeString && (
            <ThemedText style={styles.time}>{timeString}</ThemedText>
          )}
        </View>
        <View style={styles.bottomRow}>
          {previewText && (
            <ThemedText
              numberOfLines={1}
              style={[
                styles.lastMessage,
                isCurrentUserLastSender && !searchQuery && styles.currentUserMessage,
                searchQuery && matchingMessages.length > 0 && styles.searchMatch
              ]}
            >
              {isCurrentUserLastSender && !searchQuery && 'You: '}{previewText}
            </ThemedText>
          )}
          {unreadCount > 0 && !searchQuery && (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

export { ChatListItem };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E1E1',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#8F8F8F',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8F8F8F',
    flex: 1,
  },
  currentUserMessage: {
    fontStyle: 'italic',
  },
  searchMatch: {
    color: '#007AFF',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 