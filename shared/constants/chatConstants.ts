/**
 * Constants for chat-related functionality
 */

export const CHAT_CONSTANTS = {
  // Pagination
  DEFAULT_MESSAGE_LIMIT: 50,
  DEFAULT_CHAT_LIMIT: 20,

  // Cache TTL (Time To Live)
  CACHE_TTL: 30000, // 30 seconds
  USER_CACHE_TTL: 60000, // 1 minute

  // UI Constants
  MESSAGE_BUBBLE_MAX_WIDTH: "80%",
  AVATAR_SIZES: {
    SMALL: 32,
    MEDIUM: 50,
    LARGE: 80,
  },

  // Animation Durations
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300,
  },

  // Status Colors
  STATUS_COLORS: {
    ONLINE: "#4CAF50",
    OFFLINE: "#9E9E9E",
    AWAY: "#FFC107",
  },

  // Message Limits
  MAX_MESSAGE_LENGTH: 1000,
  MAX_CHAT_NAME_LENGTH: 50,

  // Search
  SEARCH_DEBOUNCE_DELAY: 300,
} as const;

export const CHAT_QUERY_KEYS = {
  CHATS: "chats",
  USERS: "users",
  MESSAGES: "messages",
  CHAT_PARTICIPANTS: "chatParticipants",
} as const;

export const CHAT_EVENTS = {
  MESSAGE_SENT: "messageSent",
  MESSAGE_EDITED: "messageEdited",
  MESSAGE_DELETED: "messageDeleted",
  CHAT_CREATED: "chatCreated",
  USER_JOINED: "userJoined",
  USER_LEFT: "userLeft",
} as const;
