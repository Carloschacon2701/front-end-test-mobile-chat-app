import { useAppContext } from "@/shared/hooks/AppContext";
import { useState, useCallback, useReducer } from "react";
import { Alert } from "react-native";
import { useGetAllUsers } from "@/shared/hooks/users/useGetAllUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOptimizedChats } from "./useOptimizedChats";
import { Chat, Message, chatsService } from "@/shared/services/chat";

// State management using useReducer for better performance
interface ChatRoomState {
    actionMenuVisible: boolean;
    selectedMessage: Message | null;
    messagePosition: { x: number; y: number };
    editModalVisible: boolean;
    messageText: string;
}

type ChatRoomAction =
    | { type: 'SHOW_ACTION_MENU'; payload: { message: Message; position: { x: number; y: number } } }
    | { type: 'HIDE_ACTION_MENU' }
    | { type: 'SHOW_EDIT_MODAL' }
    | { type: 'HIDE_EDIT_MODAL' }
    | { type: 'SET_MESSAGE_TEXT'; payload: string }
    | { type: 'CLEAR_MESSAGE_TEXT' };

const initialState: ChatRoomState = {
    actionMenuVisible: false,
    selectedMessage: null,
    messagePosition: { x: 0, y: 0 },
    editModalVisible: false,
    messageText: '',
};

function chatRoomReducer(state: ChatRoomState, action: ChatRoomAction): ChatRoomState {
    switch (action.type) {
        case 'SHOW_ACTION_MENU':
            return {
                ...state,
                actionMenuVisible: true,
                selectedMessage: action.payload.message,
                messagePosition: action.payload.position,
            };
        case 'HIDE_ACTION_MENU':
            return {
                ...state,
                actionMenuVisible: false,
                selectedMessage: null,
            };
        case 'SHOW_EDIT_MODAL':
            return {
                ...state,
                actionMenuVisible: false,
                editModalVisible: true,
            };
        case 'HIDE_EDIT_MODAL':
            return {
                ...state,
                editModalVisible: false,
                selectedMessage: null,
            };
        case 'SET_MESSAGE_TEXT':
            return {
                ...state,
                messageText: action.payload,
            };
        case 'CLEAR_MESSAGE_TEXT':
            return {
                ...state,
                messageText: '',
            };
        default:
            return state;
    }
}

export const useOptimizedChatRoom = (chatId: string) => {
    const { currentUser } = useAppContext();
    const { users } = useGetAllUsers();
    const [state, dispatch] = useReducer(chatRoomReducer, initialState);
    const [filter, setFilter] = useState('');
    const { chats } = useOptimizedChats(filter);

    const queryClient = useQueryClient();

    // Memoized mutations to prevent unnecessary re-renders
    const deleteMessageMutation = useMutation({
        mutationFn: async (messageId: string) => {
            return await chatsService.deleteMessage(messageId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
    });

    const editMessageMutation = useMutation({
        mutationFn: async (data: { id: string, text: string }) => {
            return await chatsService.editMessage(data.id, data.text);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (data: { chatId: string, senderId: string, text: string }) => {
            return await chatsService.sendMessageToChat(data.chatId, data.senderId, data.text);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
    });

    // Memoized chat lookup
    const chat = chats.find(c => c.id === chatId) as Chat;

    // Optimized event handlers
    const handleSendMessage = useCallback(() => {
        if (state.messageText.trim() && currentUser && chat) {
            sendMessageMutation.mutate({
                chatId: chat.id,
                senderId: currentUser.id,
                text: state.messageText.trim(),
            });
            dispatch({ type: 'CLEAR_MESSAGE_TEXT' });
        }
    }, [state.messageText, currentUser, chat, sendMessageMutation]);

    const handleMessageLongPress = useCallback((message: Message, position: { x: number; y: number }) => {
        dispatch({ type: 'SHOW_ACTION_MENU', payload: { message, position } });
    }, []);

    const handleEditMessage = useCallback(() => {
        dispatch({ type: 'SHOW_EDIT_MODAL' });
    }, []);

    const handleSaveEditedMessage = useCallback(async (newText: string) => {
        if (state.selectedMessage) {
            editMessageMutation.mutate({
                id: state.selectedMessage.id,
                text: newText,
            });

            if (editMessageMutation.isSuccess) {
                dispatch({ type: 'HIDE_EDIT_MODAL' });
            }
        }
    }, [state.selectedMessage, editMessageMutation]);

    const handleDeleteMessage = useCallback(async () => {
        if (state.selectedMessage) {
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
                            deleteMessageMutation.mutate(state.selectedMessage!.id);
                            if (deleteMessageMutation.isSuccess) {
                                dispatch({ type: 'HIDE_ACTION_MENU' });
                            }
                        },
                    },
                ]
            );
        }
    }, [state.selectedMessage, deleteMessageMutation]);

    const handleDismissActionMenu = useCallback(() => {
        dispatch({ type: 'HIDE_ACTION_MENU' });
    }, []);

    const handleCancelEditModal = useCallback(() => {
        dispatch({ type: 'HIDE_EDIT_MODAL' });
    }, []);

    const handleChangeMessageText = useCallback((text: string) => {
        dispatch({ type: 'SET_MESSAGE_TEXT', payload: text });
    }, []);

    // Memoized computed values
    const chatParticipants = chat?.participants
        .filter(id => id !== currentUser?.id)
        .map(id => users.find(user => user.id === id))
        .filter(Boolean) || [];

    const chatName = chatParticipants.length === 1
        ? chatParticipants[0]?.name
        : `${chatParticipants[0]?.name || 'Unknown'} & ${chatParticipants.length - 1} other${chatParticipants.length > 1 ? 's' : ''}`;

    const handleSearch = useCallback((text: string) => {
        setFilter(text);
    }, []);

    return {
        // State
        ...state,
        chat,
        currentUser,
        chatParticipants,
        chatName,

        // Actions
        handleSendMessage,
        handleMessageLongPress,
        handleEditMessage,
        handleSaveEditedMessage,
        handleDeleteMessage,
        handleDismissActionMenu,
        handleCancelEditModal,
        handleChangeMessageText,
        handleSearch,
    };
};
