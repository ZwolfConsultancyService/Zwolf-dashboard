import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Search,
    Send,
    Paperclip,
    Smile,
    MoreVertical,
    ArrowLeft,
    Check,
    CheckCheck,
    FileText,
    X,
    Plus,
    Loader2,
    UserCircle,
    MessageSquare,
    Video,
    Music,
    Download,
    BriefcaseBusiness,
} from 'lucide-react';

import EmojiPicker from 'emoji-picker-react';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ClientMessagesPage() {
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] =
        useState(null);

    const [messages, setMessages] = useState([]);

    const [loadingConversations, setLoadingConversations] =
        useState(true);

    const [loadingMessages, setLoadingMessages] =
        useState(false);

    const [creatingConversation, setCreatingConversation] =
        useState(false);

    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [search, setSearch] = useState('');
    const [message, setMessage] = useState('');

    const [showChat, setShowChat] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);

    const [showEmojiPicker, setShowEmojiPicker] =
        useState(false);

    const [attachment, setAttachment] = useState(null);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);

    /*
    |--------------------------------------------------------------------------
    | Client ID
    |--------------------------------------------------------------------------
    */

    const clientId =
        user?._id ||
        user?.clientId ||
        user?.id ||
        null;

    /*
    |--------------------------------------------------------------------------
    | Load existing conversations
    |--------------------------------------------------------------------------
    */

 const fetchConversations = async () => {
    try {
        setLoadingConversations(true);

        const response = await api.get(
            '/client-messages/conversations'
        );

        console.log(
            'CLIENT CONVERSATIONS RESPONSE:',
            response.data
        );

        /*
        |--------------------------------------------------------------------------
        | Backend can return:
        | { success: true, conversations: [...] }
        |
        | or:
        | { success: true, data: [...] }
        |--------------------------------------------------------------------------
        */

        const rawData =
            response.data?.conversations ??
            response.data?.data?.conversations ??
            response.data?.data ??
            response.data?.results ??
            [];

        const conversationList =
            Array.isArray(rawData)
                ? rawData
                : [];

        setConversations(conversationList);

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT:
        | If currently selected conversation no longer exists in the
        | fresh backend response, clear it.
        |
        | This prevents old/stale conversation IDs from being reused.
        |--------------------------------------------------------------------------
        */

        setSelectedConversation((prev) => {
            if (!prev?._id) {
                return null;
            }

            const exists = conversationList.some(
                (conversation) =>
                    String(conversation._id) ===
                    String(prev._id)
            );

            return exists ? prev : null;
        });

        /*
        |--------------------------------------------------------------------------
        | If selected conversation is not valid anymore, clear messages.
        |--------------------------------------------------------------------------
        */

        setMessages((prevMessages) => {
            if (!conversationList.length) {
                return [];
            }

            return prevMessages;
        });

    } catch (error) {
        console.error(
            'Failed to load client conversations:',
            error
        );

        console.error(
            'Server response:',
            error?.response?.data
        );

        setConversations([]);
        setSelectedConversation(null);
        setMessages([]);
        setShowChat(false);
    } finally {
        setLoadingConversations(false);
    }
};

    /*
    |--------------------------------------------------------------------------
    | Initial Load
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        fetchConversations();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Load messages
    |--------------------------------------------------------------------------
    */

   const fetchMessages = async (conversationId) => {
    if (!conversationId) {
        setMessages([]);
        return;
    }

    try {
        setLoadingMessages(true);

        const response = await api.get(
            `/client-messages/conversations/${conversationId}`
        );

        console.log(
            'CLIENT MESSAGES RESPONSE:',
            response.data
        );

        const rawData =
            response.data?.messages ??
            response.data?.data?.messages ??
            response.data?.data ??
            response.data?.results ??
            [];

        const messageList =
            Array.isArray(rawData)
                ? rawData
                : [];

        setMessages(messageList);

        await markAsRead(conversationId);

    } catch (error) {
        console.error(
            'Failed to load client messages:',
            error
        );

        console.error(
            'Server response:',
            error?.response?.data
        );

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT:
        | If old/stale conversation returns 403,
        | completely remove it from frontend state.
        |--------------------------------------------------------------------------
        */

        if (error?.response?.status === 403) {
            console.warn(
                'Removing inaccessible/stale client conversation:',
                conversationId
            );

            setConversations((prev) =>
                prev.filter(
                    (conversation) =>
                        String(conversation._id) !==
                        String(conversationId)
                )
            );

            setSelectedConversation((prev) =>
                prev &&
                String(prev._id) ===
                    String(conversationId)
                    ? null
                    : prev
            );

            setMessages([]);
            setShowChat(false);

            /*
            |--------------------------------------------------------------------------
            | Reload fresh conversations from backend
            |--------------------------------------------------------------------------
            */

            await fetchConversations();
        } else {
            setMessages([]);
        }

    } finally {
        setLoadingMessages(false);
    }
};

    /*
    |--------------------------------------------------------------------------
    | Mark conversation as read
    |--------------------------------------------------------------------------
    */

    const markAsRead = async (
        conversationId
    ) => {
        try {
            await api.patch(
                `/client-messages/conversations/${conversationId}/read`
            );

            setConversations((prev) =>
                prev.map((conversation) =>
                    conversation._id === conversationId
                        ? {
                            ...conversation,
                            unreadCount: 0,
                        }
                        : conversation
                )
            );
        } catch (error) {
            console.error(
                'Failed to mark conversation as read:',
                error
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Select conversation
    |--------------------------------------------------------------------------
    */

   const handleSelectConversation = async (conversation) => {
    if (!conversation?._id) {
        return;
    }

    /*
    |--------------------------------------------------------------------------
    | Only allow conversations currently present in frontend list.
    |--------------------------------------------------------------------------
    */

    const exists = conversations.some(
        (item) =>
            String(item._id) ===
            String(conversation._id)
    );

    if (!exists) {
        console.warn(
            'Conversation is not present in current conversation list:',
            conversation._id
        );

        return;
    }

    setSelectedConversation(conversation);

    setShowChat(true);
    setShowMenu(false);
    setShowEmojiPicker(false);

    /*
    |--------------------------------------------------------------------------
    | Clear previous messages before loading new conversation.
    |--------------------------------------------------------------------------
    */

    setMessages([]);

    await fetchMessages(
        conversation._id
    );
};

    /*
    |--------------------------------------------------------------------------
    | Get participant
    |--------------------------------------------------------------------------
    */

    const getParticipant = (
        conversation
    ) => {
        if (!conversation) {
            return null;
        }

        if (conversation.sales) {
            return {
                ...conversation.sales,
                chatType: 'sales',
            };
        }

        if (conversation.manager) {
            return {
                ...conversation.manager,
                chatType: 'manager',
            };
        }

        return null;
    };

    /*
    |--------------------------------------------------------------------------
    | Conversation name
    |--------------------------------------------------------------------------
    */

    const getConversationName = (
        conversation
    ) => {
        const participant =
            getParticipant(conversation);

        if (!participant) {
            return 'Team Member';
        }

        return (
            participant.name ||
            participant.fullName ||
            participant.employeeName ||
            participant.email ||
            'Team Member'
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Conversation subtitle
    |--------------------------------------------------------------------------
    */

    const getConversationSubtitle = (
        conversation
    ) => {
        const participant =
            getParticipant(conversation);

        if (!participant) {
            return 'ZWOLF Consultancy Service';
        }

        if (
            participant.chatType ===
            'sales'
        ) {
            return (
                participant.designation ||
                participant.role ||
                'Sales'
            );
        }

        return (
            participant.designation ||
            participant.role ||
            'Reporting Manager'
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Conversation type
    |--------------------------------------------------------------------------
    */

    const getConversationType = (
        conversation
    ) => {
        if (conversation?.sales) {
            return 'Sales';
        }

        if (conversation?.manager) {
            return 'Manager';
        }

        return 'Team';
    };

    /*
    |--------------------------------------------------------------------------
    | Initial
    |--------------------------------------------------------------------------
    */

    const getInitial = (
        conversation
    ) => {
        const name =
            getConversationName(
                conversation
            );

        return (
            name
                ?.charAt(0)
                ?.toUpperCase() ||
            '?'
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Filter conversations
    |--------------------------------------------------------------------------
    */

    const filteredConversations =
        useMemo(() => {
            const value =
                search
                    .trim()
                    .toLowerCase();

            if (!value) {
                return conversations;
            }

            return conversations.filter(
                (conversation) => {
                    const name =
                        getConversationName(
                            conversation
                        )?.toLowerCase() ||
                        '';

                    const subtitle =
                        getConversationSubtitle(
                            conversation
                        )?.toLowerCase() ||
                        '';

                    const type =
                        getConversationType(
                            conversation
                        )?.toLowerCase() ||
                        '';

                    return (
                        name.includes(value) ||
                        subtitle.includes(value) ||
                        type.includes(value)
                    );
                }
            );
        }, [
            conversations,
            search,
        ]);

    /*
    |--------------------------------------------------------------------------
    | Create Sales / Manager conversation
    |--------------------------------------------------------------------------
    */

  const handleStartConversation = async (target) => {
    try {
        setCreatingConversation(true);

        const response = await api.post(
            '/client-messages/conversations',
            {
                target,
            }
        );

        console.log(
            'CREATE CLIENT CONVERSATION RESPONSE:',
            response.data
        );

        /*
        |--------------------------------------------------------------------------
        | Support different backend response structures
        |--------------------------------------------------------------------------
        */

        const conversation =
            response.data?.conversation ??
            response.data?.data?.conversation ??
            response.data?.data ??
            null;

        if (!conversation?._id) {
            throw new Error(
                'Conversation was not returned by server'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Add/update conversation in list
        |--------------------------------------------------------------------------
        */

        setConversations((prev) => {
            const exists = prev.some(
                (item) =>
                    String(item._id) ===
                    String(conversation._id)
            );

            if (exists) {
                return prev.map(
                    (item) =>
                        String(item._id) ===
                        String(conversation._id)
                            ? {
                                ...item,
                                ...conversation,
                            }
                            : item
                );
            }

            return [
                conversation,
                ...prev,
            ];
        });

        /*
        |--------------------------------------------------------------------------
        | VERY IMPORTANT:
        | Select ONLY the newly returned conversation ID.
        |--------------------------------------------------------------------------
        */

        setSelectedConversation(
            conversation
        );

        setMessages([]);

        setShowNewChat(false);
        setShowChat(true);
        setShowMenu(false);
        setShowEmojiPicker(false);

        /*
        |--------------------------------------------------------------------------
        | Load messages of newly created/current conversation
        |--------------------------------------------------------------------------
        */

        await fetchMessages(
            conversation._id
        );

    } catch (error) {
        console.error(
            'Failed to create client conversation:',
            error
        );

        console.error(
            'Server response:',
            error?.response?.data
        );

        const serverMessage =
            error?.response?.data?.message ||
            error?.response?.data?.error;

        if (serverMessage) {
            alert(serverMessage);
        }

    } finally {
        setCreatingConversation(false);
    }
};

    /*
    |--------------------------------------------------------------------------
    | Scroll to bottom
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    }, [messages]);

    /*
    |--------------------------------------------------------------------------
    | Close Emoji Picker
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const handleOutsideClick = (
            event
        ) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(
                    event.target
                )
            ) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener(
                'mousedown',
                handleOutsideClick
            );
        }

        return () => {
            document.removeEventListener(
                'mousedown',
                handleOutsideClick
            );
        };
    }, [showEmojiPicker]);

    /*
    |--------------------------------------------------------------------------
    | Upload Attachment
    |--------------------------------------------------------------------------
    */

    const uploadAttachment = async (
        file
    ) => {
        if (
            !selectedConversation ||
            !file
        ) {
            return null;
        }

        try {
            setUploading(true);

            const formData =
                new FormData();

            formData.append(
                'file',
                file
            );

            formData.append(
                'conversationId',
                selectedConversation._id
            );

            const response =
                await api.post(
                    '/client-messages/upload',
                    formData
                );

            const uploadedFile =
                response.data?.data;

            if (!uploadedFile?.url) {
                throw new Error(
                    'File URL was not returned by server'
                );
            }

            return uploadedFile;
        } catch (error) {
            console.error(
                'Failed to upload client attachment:',
                error
            );

            console.error(
                'Server response:',
                error?.response?.data
            );

            return null;
        } finally {
            setUploading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | File Change
    |--------------------------------------------------------------------------
    */

    const handleFileChange = async (
        event
    ) => {
        const file =
            event.target.files?.[0];

        event.target.value = '';

        if (!file) {
            return;
        }

        if (!selectedConversation) {
            return;
        }

        const maxSize =
            25 * 1024 * 1024;

        if (file.size > maxSize) {
            alert(
                'File size cannot be more than 25 MB.'
            );

            return;
        }

        const uploadedFile =
            await uploadAttachment(
                file
            );

        if (!uploadedFile) {
            return;
        }

        setAttachment(
            uploadedFile
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Attachment Button
    |--------------------------------------------------------------------------
    */

    const handleAttachmentClick = () => {
        if (
            uploading ||
            sending ||
            !selectedConversation
        ) {
            return;
        }

        fileInputRef.current?.click();
    };

    /*
    |--------------------------------------------------------------------------
    | Remove Attachment
    |--------------------------------------------------------------------------
    */

    const handleRemoveAttachment = () => {
        setAttachment(null);
    };

    /*
    |--------------------------------------------------------------------------
    | Emoji
    |--------------------------------------------------------------------------
    */

    const handleEmojiClick = (
        emojiData
    ) => {
        const emoji =
            emojiData?.emoji || '';

        if (!emoji) {
            return;
        }

        setMessage(
            (prev) =>
                prev + emoji
        );

        setShowEmojiPicker(false);

        setTimeout(() => {
            textareaRef.current?.focus();
        }, 0);
    };

    /*
    |--------------------------------------------------------------------------
    | Message Type
    |--------------------------------------------------------------------------
    */

    const getMessageType = (
        uploadedAttachment,
        text
    ) => {
        if (
            uploadedAttachment &&
            text
        ) {
            return 'mixed';
        }

        if (uploadedAttachment) {
            return (
                uploadedAttachment.type ||
                'file'
            );
        }

        return 'text';
    };

    /*
    |--------------------------------------------------------------------------
    | Send Message
    |--------------------------------------------------------------------------
    */

    const handleSendMessage = async () => {
        const text =
            message.trim();

      if (
    (!text && !attachment) ||
    !selectedConversation?._id ||
    sending ||
    uploading
) {
    return;
}

        try {
            setSending(true);

            const messageType =
                getMessageType(
                    attachment,
                    text
                );

            const response =
                await api.post(
                    '/client-messages',
                    {
                        conversationId:
                            selectedConversation._id,

                        text,

                        messageType,

                        attachments:
                            attachment
                                ? [attachment]
                                : [],
                    }
                );

            const newMessage =
                response.data?.data;

            if (newMessage) {
                setMessages(
                    (prev) => [
                        ...prev,
                        newMessage,
                    ]
                );

                setConversations(
                    (prev) =>
                        prev.map(
                            (
                                conversation
                            ) =>
                                conversation._id ===
                                selectedConversation._id
                                    ? {
                                        ...conversation,
                                        lastMessage:
                                            newMessage,
                                        lastMessageAt:
                                            newMessage.createdAt,
                                        unreadCount: 0,
                                    }
                                    : conversation
                        )
                );

                setSelectedConversation(
                    (prev) =>
                        prev
                            ? {
                                ...prev,
                                lastMessage:
                                    newMessage,
                                lastMessageAt:
                                    newMessage.createdAt,
                            }
                            : prev
                );
            }

            setMessage('');
            setAttachment(null);
            setShowEmojiPicker(false);

            if (textareaRef.current) {
                textareaRef.current.style.height =
                    'auto';
            }
         } catch (error) {
    console.error(
        'Failed to send client message:',
        error
    );

    console.error(
        'Server response:',
        error?.response?.data
    );

    if (error?.response?.status === 403) {
        const staleConversationId =
            selectedConversation?._id;

        console.warn(
            'Selected client conversation is no longer accessible:',
            staleConversationId
        );

        setConversations((prev) =>
            prev.filter(
                (conversation) =>
                    String(conversation._id) !==
                    String(staleConversationId)
            )
        );

        setSelectedConversation(null);
        setMessages([]);
        setShowChat(false);

        await fetchConversations();
    }
} finally {
    setSending(false);
}
    };

    /*
    |--------------------------------------------------------------------------
    | Enter To Send
    |--------------------------------------------------------------------------
    */

    const handleKeyDown = (
        event
    ) => {
        if (
            event.key === 'Enter' &&
            !event.shiftKey
        ) {
            event.preventDefault();

            handleSendMessage();
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Textarea
    |--------------------------------------------------------------------------
    */

    const handleTextareaChange = (
        event
    ) => {
        setMessage(
            event.target.value
        );

        event.target.style.height =
            'auto';

        event.target.style.height =
            `${Math.min(
                event.target.scrollHeight,
                120
            )}px`;
    };

    /*
    |--------------------------------------------------------------------------
    | New Chat
    |--------------------------------------------------------------------------
    */

    const handleNewChat = () => {
        setSearch('');
        setShowNewChat(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Format Time
    |--------------------------------------------------------------------------
    */

    const formatTime = (
        date
    ) => {
        if (!date) {
            return '';
        }

        return new Date(
            date
        ).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Client Name
    |--------------------------------------------------------------------------
    */

    const clientName =
        user?.clientName ||
        user?.name ||
        'Client';

    return (
        <div className="h-[calc(100vh-120px)] min-h-[520px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex relative">

            {/* =========================================================
                FILE INPUT
            ========================================================== */}

            <input
                ref={fileInputRef}
                type="file"
                accept="
                    image/jpeg,
                    image/png,
                    image/webp,
                    image/gif,
                    video/mp4,
                    video/webm,
                    video/quicktime,
                    audio/mpeg,
                    audio/mp3,
                    audio/wav,
                    audio/ogg,
                    audio/webm,
                    audio/mp4,
                    audio/aac,
                    audio/x-m4a,
                    application/pdf,
                    application/msword,
                    application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                    application/vnd.ms-excel,
                    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                    application/vnd.ms-powerpoint,
                    application/vnd.openxmlformats-officedocument.presentationml.presentation,
                    text/plain
                "
                onChange={
                    handleFileChange
                }
                className="hidden"
            />

            {/* =========================================================
                LEFT SIDEBAR
            ========================================================== */}

            <section
                className={`
                    w-full md:w-[340px] lg:w-[360px]
                    border-r border-gray-200
                    flex flex-col
                    bg-white
                    ${
                        showChat
                            ? 'hidden md:flex'
                            : 'flex'
                    }
                `}
            >

                {/* Header */}

                <div className="px-5 py-4 border-b border-gray-200">

                    <div className="flex items-center justify-between mb-4">

                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                Messages
                            </h1>

                            <p className="text-xs text-gray-500 mt-1">
                                Sales & Reporting Manager
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleNewChat
                            }
                            className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition"
                            title="New conversation"
                        >
                            <Plus size={18} />
                        </button>

                    </div>

                    <div className="relative">

                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Search conversations..."
                            className="w-full h-10 pl-10 pr-3 rounded-lg bg-gray-100 border border-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 transition"
                        />

                    </div>

                </div>

                {/* Conversations */}

                <div className="flex-1 overflow-y-auto">

                    {loadingConversations ? (
                        <div className="flex justify-center items-center h-40">

                            <Loader2
                                size={22}
                                className="animate-spin text-blue-600"
                            />

                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="px-6 py-16 text-center">

                            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">

                                <MessageSquare
                                    size={22}
                                    className="text-gray-400"
                                />

                            </div>

                            <h3 className="text-sm font-semibold text-gray-800">
                                No conversations yet
                            </h3>

                            <p className="text-xs text-gray-500 mt-1">
                                Start a conversation with your
                                Sales Person or Manager.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleNewChat
                                }
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                            >
                                <Plus size={15} />
                                Start Conversation
                            </button>

                        </div>
                    ) : (
                        filteredConversations.map(
                            (
                                conversation
                            ) => {
                                const active =
                                    selectedConversation?._id ===
                                    conversation._id;

                                const name =
                                    getConversationName(
                                        conversation
                                    );

                                return (
                                    <button
                                        key={
                                            conversation._id
                                        }
                                        type="button"
                                        onClick={() =>
                                            handleSelectConversation(
                                                conversation
                                            )
                                        }
                                        className={`
                                            w-full text-left
                                            px-4 py-3
                                            flex items-center gap-3
                                            border-b border-gray-100
                                            transition
                                            ${
                                                active
                                                    ? 'bg-blue-50'
                                                    : 'hover:bg-gray-50'
                                            }
                                        `}
                                    >

                                        <div className="relative flex-shrink-0">

                                            <div
                                                className={`
                                                    w-11 h-11 rounded-full
                                                    flex items-center justify-center
                                                    font-semibold text-sm
                                                    ${
                                                        conversation.sales
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-purple-100 text-purple-700'
                                                    }
                                                `}
                                            >
                                                {getInitial(
                                                    conversation
                                                )}
                                            </div>

                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <div className="flex items-center justify-between gap-2">

                                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                    {name}
                                                </h3>

                                                <span className="text-[11px] text-gray-400 flex-shrink-0">
                                                    {formatTime(
                                                        conversation.lastMessageAt
                                                    )}
                                                </span>

                                            </div>

                                            <div className="flex items-center justify-between gap-2 mt-1">

                                                <div className="flex items-center gap-1 min-w-0">

                                                    <span className="text-[10px] font-medium text-blue-600 flex-shrink-0">
                                                        {
                                                            getConversationType(
                                                                conversation
                                                            )
                                                        }
                                                    </span>

                                                    <span className="text-gray-300">
                                                        •
                                                    </span>

                                                    <p className="text-xs text-gray-500 truncate">
                                                        {conversation
                                                            .lastMessage
                                                            ?.text ||
                                                            (
                                                                conversation
                                                                    .lastMessage
                                                                    ?.attachments
                                                                    ?.length >
                                                                0
                                                                    ? 'Attachment'
                                                                    : getConversationSubtitle(
                                                                        conversation
                                                                    )
                                                            )}
                                                    </p>

                                                </div>

                                                {conversation.unreadCount >
                                                    0 && (
                                                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-semibold">
                                                            {conversation.unreadCount >
                                                                99
                                                                ? '99+'
                                                                : conversation.unreadCount}
                                                        </span>
                                                    )}

                                            </div>

                                        </div>

                                    </button>
                                );
                            }
                        )
                    )}

                </div>

            </section>

            {/* =========================================================
                CHAT SECTION
            ========================================================== */}

            <section
                className={`
                    flex-1 min-w-0 flex-col
                    bg-[#efeae2]
                    ${
                        showChat
                            ? 'flex'
                            : 'hidden md:flex'
                    }
                `}
            >

                {!selectedConversation ? (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">

                        <div className="text-center max-w-sm px-6">

                            <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-5">

                                <MessageSquare
                                    size={30}
                                    className="text-blue-600"
                                />

                            </div>

                            <h2 className="text-lg font-semibold text-gray-900">
                                Your Messages
                            </h2>

                            <p className="text-sm text-gray-500 mt-2">
                                Chat directly with your Sales
                                Person or Reporting Manager.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleNewChat
                                }
                                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                            >
                                <Plus size={17} />
                                New Conversation
                            </button>

                        </div>

                    </div>
                ) : (
                    <>
                        {/* =================================================
                            CHAT HEADER
                        ================================================== */}

                        <header className="h-[68px] flex-shrink-0 bg-white border-b border-gray-200 px-4 flex items-center justify-between">

                            <div className="flex items-center gap-3 min-w-0">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowChat(
                                            false
                                        )
                                    }
                                    className="md:hidden h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                                >
                                    <ArrowLeft
                                        size={19}
                                    />
                                </button>

                                <div
                                    className={`
                                        w-10 h-10 rounded-full
                                        flex items-center justify-center
                                        font-semibold text-sm
                                        flex-shrink-0
                                        ${
                                            selectedConversation.sales
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-purple-100 text-purple-700'
                                        }
                                    `}
                                >
                                    {getInitial(
                                        selectedConversation
                                    )}
                                </div>

                                <div className="min-w-0">

                                    <div className="flex items-center gap-2">

                                        <h2 className="text-sm font-semibold text-gray-900 truncate">
                                            {getConversationName(
                                                selectedConversation
                                            )}
                                        </h2>

                                        <span
                                            className={`
                                                text-[10px] px-2 py-0.5 rounded-full font-medium
                                                ${
                                                    selectedConversation.sales
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-purple-50 text-purple-600'
                                                }
                                            `}
                                        >
                                            {getConversationType(
                                                selectedConversation
                                            )}
                                        </span>

                                    </div>

                                    <p className="text-xs text-gray-500 truncate">
                                        {getConversationSubtitle(
                                            selectedConversation
                                        )}
                                    </p>

                                </div>

                            </div>

                            <div className="relative">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowMenu(
                                            (value) =>
                                                !value
                                        )
                                    }
                                    className="h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"
                                >
                                    <MoreVertical
                                        size={19}
                                    />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 top-11 w-40 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-20">

                                        <button
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                        >
                                            View profile
                                        </button>

                                    </div>
                                )}

                            </div>

                        </header>

                        {/* =================================================
                            MESSAGES
                        ================================================== */}

                        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">

                            {loadingMessages ? (
                                <div className="h-full flex items-center justify-center">

                                    <Loader2
                                        size={24}
                                        className="animate-spin text-blue-600"
                                    />

                                </div>
                            ) : messages.length ===
                              0 ? (
                                <div className="h-full flex items-center justify-center">

                                    <div className="bg-white/90 rounded-xl px-5 py-4 text-center shadow-sm">

                                        <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-3">

                                            <MessageSquare
                                                size={18}
                                                className="text-blue-600"
                                            />

                                        </div>

                                        <p className="text-sm font-medium text-gray-700">
                                            No messages yet
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            Send a message to start the
                                            conversation.
                                        </p>

                                    </div>

                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto space-y-2">

                                    {messages.map(
                                        (item) => (
                                            <ClientMessageBubble
                                                key={
                                                    item._id
                                                }
                                                message={
                                                    item
                                                }
                                                currentClientId={
                                                    clientId
                                                }
                                            />
                                        )
                                    )}

                                    <div
                                        ref={
                                            messagesEndRef
                                        }
                                    />

                                </div>
                            )}

                        </div>

                        {/* =================================================
                            ATTACHMENT PREVIEW
                        ================================================== */}

                        {attachment && (
                            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 sm:px-4 pt-3">

                                <div className="max-w-4xl mx-auto">

                                    <div className="relative w-fit max-w-full">

                                        {attachment.type ===
                                            'image' ? (
                                            <img
                                                src={
                                                    attachment.url
                                                }
                                                alt={
                                                    attachment.name ||
                                                    'Attachment'
                                                }
                                                className="h-24 w-24 object-cover rounded-xl border border-gray-200"
                                            />
                                        ) : attachment.type ===
                                            'video' ? (
                                            <div className="h-24 w-32 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center">

                                                <Video
                                                    size={25}
                                                    className="text-blue-600"
                                                />

                                                <span className="text-[10px] text-gray-600 mt-1 px-2 truncate max-w-full">
                                                    {
                                                        attachment.name
                                                    }
                                                </span>

                                            </div>
                                        ) : attachment.type ===
                                            'audio' ? (
                                            <div className="h-24 w-32 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center">

                                                <Music
                                                    size={25}
                                                    className="text-blue-600"
                                                />

                                                <span className="text-[10px] text-gray-600 mt-1 px-2 truncate max-w-full">
                                                    {
                                                        attachment.name
                                                    }
                                                </span>

                                            </div>
                                        ) : (
                                            <div className="h-24 w-40 rounded-xl bg-gray-100 border border-gray-200 flex items-center gap-2 px-3">

                                                <FileText
                                                    size={25}
                                                    className="text-blue-600 flex-shrink-0"
                                                />

                                                <span className="text-xs text-gray-700 truncate">
                                                    {
                                                        attachment.name
                                                    }
                                                </span>

                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={
                                                handleRemoveAttachment
                                            }
                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-md hover:bg-black"
                                            title="Remove attachment"
                                        >
                                            <X size={13} />
                                        </button>

                                    </div>

                                </div>

                            </div>
                        )}

                        {/* =================================================
                            COMPOSER
                        ================================================== */}

                        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 sm:px-4 py-3">

                            <div className="max-w-4xl mx-auto relative">

                                {showEmojiPicker && (
                                    <div
                                        ref={
                                            emojiPickerRef
                                        }
                                        className="absolute bottom-14 left-0 z-50 shadow-xl"
                                    >
                                        <EmojiPicker
                                            onEmojiClick={
                                                handleEmojiClick
                                            }
                                            width={320}
                                            height={400}
                                            searchDisabled={
                                                false
                                            }
                                            skinTonesDisabled={
                                                false
                                            }
                                            previewConfig={{
                                                showPreview:
                                                    false,
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="flex items-end gap-2">

                                    {/* Attachment */}

                                    <button
                                        type="button"
                                        onClick={
                                            handleAttachmentClick
                                        }
                                        disabled={
                                            uploading ||
                                            sending
                                        }
                                        className="h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0 disabled:opacity-50"
                                        title="Attach file"
                                    >
                                        {uploading ? (
                                            <Loader2
                                                size={20}
                                                className="animate-spin text-blue-600"
                                            />
                                        ) : (
                                            <Paperclip
                                                size={20}
                                            />
                                        )}
                                    </button>

                                    {/* Input */}

                                    <div className="flex-1 bg-gray-100 rounded-2xl flex items-end px-3">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowEmojiPicker(
                                                    (value) =>
                                                        !value
                                                )
                                            }
                                            className="h-10 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0"
                                            title="Emoji"
                                        >
                                            <Smile
                                                size={19}
                                            />
                                        </button>

                                        <textarea
                                            ref={
                                                textareaRef
                                            }
                                            value={
                                                message
                                            }
                                            onChange={
                                                handleTextareaChange
                                            }
                                            onKeyDown={
                                                handleKeyDown
                                            }
                                            rows={1}
                                            placeholder="Type a message..."
                                            className="flex-1 resize-none bg-transparent outline-none border-none text-sm text-gray-800 placeholder:text-gray-400 py-2.5 max-h-[120px]"
                                        />

                                    </div>

                                    {/* Send */}

                                    <button
                                        type="button"
                                        onClick={
                                            handleSendMessage
                                        }
                                        disabled={
                                            (!message.trim() &&
                                                !attachment) ||
                                            sending ||
                                            uploading
                                        }
                                        className={`
                                            h-10 w-10 rounded-full
                                            flex items-center justify-center
                                            flex-shrink-0
                                            transition
                                            ${
                                                message.trim() ||
                                                attachment
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'bg-gray-100 text-gray-400'
                                            }
                                        `}
                                    >
                                        {sending ? (
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Send
                                                size={18}
                                            />
                                        )}
                                    </button>

                                </div>

                            </div>

                        </div>
                    </>
                )}

            </section>

            {/* =========================================================
                NEW CHAT MODAL
            ========================================================== */}

            {showNewChat && (
                <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

                        {/* Header */}

                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">

                            <div>

                                <h2 className="text-lg font-semibold text-gray-900">
                                    New Conversation
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Choose who you want to contact
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowNewChat(
                                        false
                                    )
                                }
                                className="h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                            >
                                <X size={19} />
                            </button>

                        </div>

                        {/* Options */}

                        <div className="p-4 space-y-3">

                            {/* Sales */}

                            <button
                                type="button"
                                disabled={
                                    creatingConversation
                                }
                                onClick={() =>
                                    handleStartConversation(
                                        'sales'
                                    )
                                }
                                className="w-full p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition flex items-center gap-4 text-left disabled:opacity-60"
                            >

                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                    <BriefcaseBusiness
                                        size={22}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">

                                    <p className="text-sm font-semibold text-gray-900">
                                        Sales Person
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Chat with your assigned Sales
                                        Person
                                    </p>

                                </div>

                                <MessageSquare
                                    size={18}
                                    className="text-gray-400"
                                />

                            </button>

                            {/* Manager */}

                            <button
                                type="button"
                                disabled={
                                    creatingConversation
                                }
                                onClick={() =>
                                    handleStartConversation(
                                        'manager'
                                    )
                                }
                                className="w-full p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition flex items-center gap-4 text-left disabled:opacity-60"
                            >

                                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                                    <UserCircle
                                        size={23}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">

                                    <p className="text-sm font-semibold text-gray-900">
                                        Reporting Manager
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Chat with your Sales Person's
                                        reporting Manager
                                    </p>

                                </div>

                                <MessageSquare
                                    size={18}
                                    className="text-gray-400"
                                />

                            </button>

                            {creatingConversation && (
                                <div className="flex items-center justify-center gap-2 pt-2">

                                    <Loader2
                                        size={17}
                                        className="animate-spin text-blue-600"
                                    />

                                    <span className="text-xs text-gray-500">
                                        Opening conversation...
                                    </span>

                                </div>
                            )}

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Client Message Bubble
|--------------------------------------------------------------------------
*/

function ClientMessageBubble({
    message,
    currentClientId,
}) {
    const senderClientId =
        message.senderClient?._id ||
        message.senderClient;

    const isMine =
        message.senderType === 'client' ||
        String(senderClientId) ===
            String(currentClientId);

    const formatFileSize = (
        bytes
    ) => {
        if (!bytes) {
            return '';
        }

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (
            bytes <
            1024 * 1024
        ) {
            return `${(
                bytes / 1024
            ).toFixed(1)} KB`;
        }

        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    };

    return (
        <div
            className={`flex ${
                isMine
                    ? 'justify-end'
                    : 'justify-start'
            }`}
        >

            <div
                className={`
                    max-w-[80%] sm:max-w-[65%]
                    rounded-2xl
                    px-3.5 py-2
                    shadow-sm
                    ${
                        isMine
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md'
                    }
                `}
            >

                {/* Attachments */}

                {message.attachments?.length >
                    0 && (
                    <div className="space-y-2 mb-2">

                        {message.attachments.map(
                            (
                                attachment,
                                index
                            ) => {

                                {/* Image */}

                                if (
                                    attachment.type ===
                                    'image'
                                ) {
                                    return (
                                        <a
                                            key={
                                                index
                                            }
                                            href={
                                                attachment.url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block"
                                        >
                                            <img
                                                src={
                                                    attachment.url
                                                }
                                                alt={
                                                    attachment.name ||
                                                    'Attachment'
                                                }
                                                className="max-w-full rounded-lg max-h-80 object-cover cursor-pointer"
                                            />
                                        </a>
                                    );
                                }

                                {/* Video */}

                                if (
                                    attachment.type ===
                                    'video'
                                ) {
                                    return (
                                        <video
                                            key={
                                                index
                                            }
                                            src={
                                                attachment.url
                                            }
                                            controls
                                            preload="metadata"
                                            className="max-w-full rounded-lg max-h-80"
                                        />
                                    );
                                }

                                {/* Audio */}

                                if (
                                    attachment.type ===
                                    'audio'
                                ) {
                                    return (
                                        <div
                                            key={
                                                index
                                            }
                                            className={`
                                                rounded-lg p-2
                                                ${
                                                    isMine
                                                        ? 'bg-blue-500'
                                                        : 'bg-gray-100'
                                                }
                                            `}
                                        >

                                            <div className="flex items-center gap-2 mb-2">

                                                <Music
                                                    size={18}
                                                />

                                                <span className="text-xs font-medium truncate">
                                                    {attachment.name ||
                                                        'Audio'}
                                                </span>

                                            </div>

                                            <audio
                                                src={
                                                    attachment.url
                                                }
                                                controls
                                                className="w-full max-w-[280px]"
                                            />

                                        </div>
                                    );
                                }

                                {/* File */}

                                return (
                                    <div
                                        key={
                                            index
                                        }
                                        className={`
                                            flex items-center gap-3
                                            p-3 rounded-lg
                                            ${
                                                isMine
                                                    ? 'bg-blue-500'
                                                    : 'bg-gray-100'
                                            }
                                        `}
                                    >

                                        <div
                                            className={`
                                                w-9 h-9 rounded-lg
                                                flex items-center justify-center
                                                ${
                                                    isMine
                                                        ? 'bg-blue-400'
                                                        : 'bg-white'
                                                }
                                            `}
                                        >
                                            <FileText
                                                size={19}
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <p className="text-xs font-medium truncate">
                                                {attachment.name ||
                                                    'Attachment'}
                                            </p>

                                            {attachment.size ? (
                                                <p
                                                    className={`text-[10px] ${
                                                        isMine
                                                            ? 'text-blue-100'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    {formatFileSize(
                                                        attachment.size
                                                    )}
                                                </p>
                                            ) : null}

                                        </div>

                                        <a
                                            href={
                                                attachment.url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            download={
                                                attachment.name ||
                                                true
                                            }
                                            className={`
                                                w-8 h-8 rounded-full
                                                flex items-center justify-center
                                                ${
                                                    isMine
                                                        ? 'hover:bg-blue-400'
                                                        : 'hover:bg-gray-200'
                                                }
                                            `}
                                            title="Download file"
                                        >
                                            <Download
                                                size={16}
                                            />
                                        </a>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

                {/* Text */}

                {message.text && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {message.isDeleted
                            ? 'This message was deleted'
                            : message.text}
                    </p>
                )}

                {/* Time */}

                <div
                    className={`
                        flex items-center justify-end gap-1 mt-1
                        ${
                            isMine
                                ? 'text-blue-100'
                                : 'text-gray-400'
                        }
                    `}
                >

                    {message.isEdited && (
                        <span className="text-[9px]">
                            edited
                        </span>
                    )}

                    <span className="text-[10px]">
                        {message.createdAt
                            ? new Date(
                                message.createdAt
                            ).toLocaleTimeString(
                                [],
                                {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }
                            )
                            : ''}
                    </span>

                    {isMine &&
                        (
                            message.readAt ? (
                                <CheckCheck
                                    size={13}
                                />
                            ) : (
                                <Check
                                    size={13}
                                />
                            )
                        )}

                </div>

            </div>

        </div>
    );
}