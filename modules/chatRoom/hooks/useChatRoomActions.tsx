import { useAppContext } from "@/shared/hooks/AppContext";
import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { type Chat } from "@/shared/services/chats";
import { type Message } from "@/shared/services/chats";
import { useGetAllUsers } from "@/shared/hooks/users/useGetAllUsers";
import { useGetChats } from "@/shared/hooks/chats/useGetChats";
import { useChatActions } from "@/shared/hooks/chats/useChatActions";

export const useChatRoomActions = (chatId: string) => {
    const { loadMoreMessages, currentUser } = useAppContext()
    const { users } = useGetAllUsers();
    const { sendMessageMutation, editMessageMutation, deleteMessageMutation } = useChatActions(currentUser?.id || '');
    const [actionMenuVisible, setActionMenuVisible] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [messagePosition, setMessagePosition] = useState({ x: 0, y: 0 });
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [messageText, setMessageText] = useState('');
    const { chats } = useGetChats(currentUser?.id || '');

    // Simple find operation - no need for useMemo
    const chat = chats.find(c => c.id === chatId) as Chat;

    // Simple functions - no need for useCallback
    const handleSendMessage = () => {
        if (messageText.trim() && currentUser && chat) {
            sendMessageMutation.mutate({
                chatId: chat.id,
                senderId: currentUser.id,
                text: messageText.trim(),
            });
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
            editMessageMutation.mutate({
                id: selectedMessage.id,
                text: newText,
            });

            if (editMessageMutation.isSuccess) {
                setEditModalVisible(false);
                setSelectedMessage(null);
            }
        }
    }, [selectedMessage]);

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
                            deleteMessageMutation.mutate(selectedMessage.id);
                            if (deleteMessageMutation.isSuccess) {
                                setActionMenuVisible(false);
                                setSelectedMessage(null);
                            }
                        },
                    },
                ]
            );
        }
    }, [selectedMessage]);

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
