import { useAppContext } from "@/shared/hooks/AppContext";
import { Chat, Message } from "@/shared/hooks/useChats";
import { useState, useCallback } from "react";
import { Alert } from "react-native";

export const useChatRoomActions = (chatId: string) => {
    const { sendMessage, editMessage, deleteMessage, loadMoreMessages, chats, currentUser, users } = useAppContext()
    const [actionMenuVisible, setActionMenuVisible] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [messagePosition, setMessagePosition] = useState({ x: 0, y: 0 });
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [messageText, setMessageText] = useState('');

    // Simple find operation - no need for useMemo
    const chat = chats.find(c => c.id === chatId) as Chat;

    // Simple functions - no need for useCallback
    const handleSendMessage = () => {
        if (messageText.trim() && currentUser && chat) {
            sendMessage(chat.id, messageText.trim(), currentUser.id);
            setMessageText('');
        }
    };

    const handleLoadMore = () => {
        if (chatId) {
            loadMoreMessages(chatId);
        }
    };

    const handleMessageLongPress = (message: Message, position: { x: number; y: number }) => {
        setSelectedMessage(message);
        setMessagePosition(position);
        setActionMenuVisible(true);
    };

    const handleEditMessage = () => {
        setActionMenuVisible(false);
        setEditModalVisible(true);
    };

    // Keep useCallback for async operations that depend on selectedMessage
    const handleSaveEditedMessage = useCallback(async (newText: string) => {
        if (selectedMessage) {
            const success = await editMessage(selectedMessage.id, newText);
            if (success) {
                setEditModalVisible(false);
                setSelectedMessage(null);
            }
        }
    }, [selectedMessage, editMessage]);

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

    const handleDismissActionMenu = () => {
        setActionMenuVisible(false);
        setSelectedMessage(null);
    };

    const handleCancelEditModal = () => {
        setEditModalVisible(false);
        setSelectedMessage(null);
    };

    const handleChangeMessageText = (text: string) => {
        setMessageText(text);
    };

    // Simple computations - no need for useMemo
    const chatParticipants = chat?.participants
        .filter(id => id !== currentUser?.id)
        .map(id => users.find(user => user.id === id))
        .filter(Boolean) || [];

    const chatName = chatParticipants.length === 1
        ? chatParticipants[0]?.name
        : `${chatParticipants[0]?.name || 'Unknown'} & ${chatParticipants.length - 1} other${chatParticipants.length > 1 ? 's' : ''}`;


    return {
        handleSendMessage,
        handleLoadMore,
        handleMessageLongPress,
        handleEditMessage,
        handleSaveEditedMessage,
        handleDeleteMessage,
        handleDismissActionMenu,
        handleCancelEditModal,
        actionMenuVisible,
        selectedMessage,
        messagePosition,
        editModalVisible,
        messageText,
        handleChangeMessageText,
        setActionMenuVisible,
        setSelectedMessage,
        setMessagePosition,
        setEditModalVisible,
        chat,
        currentUser,
        chatParticipants,
        chatName,
    }
}
