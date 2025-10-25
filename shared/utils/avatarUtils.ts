/**
 * Utility functions for avatar generation and color calculation
 */

export const getAvatarColor = (identifier?: string): string => {
  if (!identifier) return "#C0C0C0";

  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }

  return color;
};

export const getInitials = (name?: string): string => {
  if (!name) return "?";

  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getStatusColor = (
  status: "online" | "offline" | "away"
): string => {
  const statusColors = {
    online: "#4CAF50",
    offline: "#9E9E9E",
    away: "#FFC107",
  };

  return statusColors[status];
};
