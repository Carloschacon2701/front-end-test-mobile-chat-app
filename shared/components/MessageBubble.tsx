import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from './ThemedText';
import { type Message } from '../services/chats';
import { useColorScheme } from '../hooks/theme/useColorScheme';
import { formatTime } from '../utils/timeUtils';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  onLongPress?: (message: Message, position: { x: number; y: number }) => void;
}

const MessageBubble = React.memo(({ message, isCurrentUser, onLongPress }: MessageBubbleProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLongPress = (event: any) => {
    if (onLongPress && isCurrentUser) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { pageX, pageY } = event.nativeEvent;
      onLongPress(message, { x: pageX, y: pageY });
    }
  };

  // Show deleted message placeholder
  if (message.isDeleted) {
    return (
      <View style={[
        styles.container,
        isCurrentUser ? styles.selfContainer : styles.otherContainer
      ]}>
        <View style={[
          styles.bubble,
          styles.deletedBubble,
          { backgroundColor: isDark ? '#2A2C33' : '#F0F0F0' }
        ]}>
          <ThemedText style={[
            styles.deletedText,
            { color: isDark ? '#666666' : '#999999' }
          ]}>
            This message was deleted
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={[
        styles.container,
        isCurrentUser ? styles.selfContainer : styles.otherContainer
      ]}
      onLongPress={handleLongPress}
      disabled={!isCurrentUser}
    >
      <View style={[
        styles.bubble,
        isCurrentUser
          ? [styles.selfBubble, { backgroundColor: isDark ? '#235A4A' : '#DCF8C6' }]
          : [styles.otherBubble, { backgroundColor: isDark ? '#2A2C33' : '#FFFFFF' }]
      ]}>
        <ThemedText style={[
          styles.messageText,
          isCurrentUser && !isDark && styles.selfMessageText
        ]}>
          {message.text}
        </ThemedText>
        <View style={styles.timeContainer}>
          <ThemedText style={styles.timeText}>
            {formatTime(message.timestamp)}
          </ThemedText>
          {message.isEdited && (
            <ThemedText style={[styles.editedLabel, { color: isDark ? '#999999' : '#666666' }]}>
              edited
            </ThemedText>
          )}
          {isCurrentUser && (
            <ThemedText style={[styles.readStatus, { color: isDark ? '#4CAF50' : '#4CAF50' }]}>
              {message.isRead ? '✓✓' : '✓'}
            </ThemedText>
          )}
        </View>
      </View>
    </Pressable>
  );
});

export { MessageBubble };

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  selfContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selfBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  selfMessageText: {
    color: '#000000',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.7,
  },
  readStatus: {
    fontSize: 10,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  editedLabel: {
    fontSize: 10,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  deletedBubble: {
    opacity: 0.7,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
}); 