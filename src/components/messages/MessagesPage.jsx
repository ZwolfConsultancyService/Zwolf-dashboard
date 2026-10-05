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
    Users,
    UserCircle,
    MessageSquare,
    Image as ImageIcon,
    Video,
    Music,
    Download,
} from 'lucide-react';

import EmojiPicker from 'emoji-picker-react';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext.jsx';

export default function MessagesPage({ mode = 'manager' }) {
    const { user } = useAuth();

    const isManager = mode === 'manager';
    const isSales = mode === 'sales';
    const isDeveloper = mode === 'developer';

    const [conversations, setConversations] = useState([]);

    const [employees, setEmployees] = useState([]);
    const [clients, setClients] = useState([]);

    const [selectedConversation, setSelectedConversation] =
        useState(null);

    const [messages, setMessages] = useState([]);

    const [loadingConversations, setLoadingConversations] =
        useState(true);

    const [loadingPeople, setLoadingPeople] = useState(false);

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

    const [newChatTab, setNewChatTab] = useState(
        isManager ? 'employees' : 'manager'
    );

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);

    /*
    |--------------------------------------------------------------------------
    | Load existing conversations
    |--------------------------------------------------------------------------
    */

    const fetchConversations = async () => {
        try {
            setLoadingConversations(true);

            const response = await api.get(
                '/messages/conversations'
            );

            const data =
                response.data?.data ||
                response.data?.results ||
                [];

            setConversations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(
                'Failed to load conversations:',
                error
            );

            setConversations([]);
        } finally {
            setLoadingConversations(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Load people for new chat
    |--------------------------------------------------------------------------
    */

    const fetchPeople = async () => {
        try {
            setLoadingPeople(true);

            /*
            |--------------------------------------------------------------------------
            | Manager
            |--------------------------------------------------------------------------
            */

            if (isManager) {
                const [
                    employeesResponse,
                    clientsResponse,
                ] = await Promise.all([
                    api.get('/employees', {
                        params: {
                            page: 1,
                            limit: 100,
                        },
                    }),

                    api.get('/clients', {
                        params: {
                            page: 1,
                            limit: 100,
                        },
                    }),
                ]);

                const employeesData =
                    employeesResponse.data?.data ||
                    employeesResponse.data?.results ||
                    [];

                const clientsData =
                    clientsResponse.data?.data ||
                    clientsResponse.data?.results ||
                    [];

                setEmployees(
                    Array.isArray(employeesData)
                        ? employeesData
                        : []
                );

                setClients(
                    Array.isArray(clientsData)
                        ? clientsData
                        : []
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Sales
            |--------------------------------------------------------------------------
            */

            if (isSales) {
                const response = await api.get(
                    '/clients',
                    {
                        params: {
                            page: 1,
                            limit: 100,
                        },
                    }
                );

                const data =
                    response.data?.data ||
                    response.data?.results ||
                    [];

                setClients(
                    Array.isArray(data) ? data : []
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Developer
            |--------------------------------------------------------------------------
            | Developer does not need clients/employees.
            | Manager conversation is resolved by backend
            | using reportingManager.
            |--------------------------------------------------------------------------
            */
        } catch (error) {
            console.error(
                'Failed to load people:',
                error
            );

            setEmployees([]);
            setClients([]);
        } finally {
            setLoadingPeople(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Initial load
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        fetchConversations();
        fetchPeople();
    }, [mode]);

    /*
    |--------------------------------------------------------------------------
    | Load messages
    |--------------------------------------------------------------------------
    */

    const fetchMessages = async (
        conversationId
    ) => {
        try {
            setLoadingMessages(true);

            const response = await api.get(
                `/messages/conversations/${conversationId}`
            );

            const data =
                response.data?.data ||
                response.data?.results ||
                [];

            setMessages(
                Array.isArray(data) ? data : []
            );

            await markAsRead(conversationId);
        } catch (error) {
            console.error(
                'Failed to load messages:',
                error
            );

            setMessages([]);
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
                `/messages/conversations/${conversationId}/read`
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
    | Select existing conversation
    |--------------------------------------------------------------------------
    */

    const handleSelectConversation = async (
        conversation
    ) => {
        setSelectedConversation(conversation);
        setShowChat(true);
        setShowMenu(false);
        setShowEmojiPicker(false);

        await fetchMessages(
            conversation._id
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Create / Get conversation
    |--------------------------------------------------------------------------
    */

    const handleStartConversation = async ({
        type,
        employeeId,
        clientId,
    }) => {
        try {
            setCreatingConversation(true);

            const payload = {
                type,
            };

            /*
            |--------------------------------------------------------------------------
            | Only manager sends employeeId.
            |
            | Sales / Developer send only:
            | { type: 'employee' }
            |
            | Backend resolves their manager using reportingManager.
            |--------------------------------------------------------------------------
            */

            if (type === 'employee') {
                if (isManager && employeeId) {
                    payload.employeeId = employeeId;
                }
            }

            if (type === 'client') {
                payload.clientId = clientId;
            }

            const response = await api.post(
                '/messages/conversations',
                payload
            );

            const conversation =
                response.data?.data;

            if (!conversation) {
                throw new Error(
                    'Conversation was not returned by server'
                );
            }

            setConversations((prev) => {
                const exists = prev.some(
                    (item) =>
                        item._id === conversation._id
                );

                if (exists) {
                    return prev.map((item) =>
                        item._id === conversation._id
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

            setSelectedConversation(
                conversation
            );

            setShowNewChat(false);
            setShowChat(true);

            await fetchMessages(
                conversation._id
            );
        } catch (error) {
            console.error(
                'Failed to create conversation:',
                error
            );

            console.error(
                'Server response:',
                error?.response?.data
            );
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
    | Close emoji picker when clicking outside
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const handleOutsideClick = (event) => {
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
    | Conversation name
    |--------------------------------------------------------------------------
    */

    const getConversationName = (
        conversation
    ) => {
        if (conversation.type === 'employee') {
            if (
                user?.role === 'manager'
            ) {
                return (
                    conversation.employee?.name ||
                    'Employee'
                );
            }

            return (
                conversation.manager?.name ||
                'Manager'
            );
        }

        return (
            conversation.client?.clientName ||
            conversation.client?.companyName ||
            'Client'
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
        if (conversation.type === 'employee') {
            if (
                user?.role === 'manager'
            ) {
                return (
                    conversation.employee?.designation ||
                    conversation.employee?.role ||
                    'Employee'
                );
            }

            return (
                conversation.manager?.email ||
                'Manager'
            );
        }

        return (
            conversation.client?.companyName ||
            conversation.client?.phone ||
            'Client'
        );
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
            name?.charAt(0)?.toUpperCase() ||
            '?'
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Filter existing conversations
    |--------------------------------------------------------------------------
    */

    const filteredConversations =
        useMemo(() => {
            const value =
                search.trim().toLowerCase();

            if (!value) {
                return conversations;
            }

            return conversations.filter(
                (conversation) => {
                    const name =
                        getConversationName(
                            conversation
                        )?.toLowerCase() || '';

                    const subtitle =
                        getConversationSubtitle(
                            conversation
                        )?.toLowerCase() || '';

                    return (
                        name.includes(value) ||
                        subtitle.includes(value)
                    );
                }
            );
        }, [
            conversations,
            search,
            user?.role,
        ]);

    /*
    |--------------------------------------------------------------------------
    | Filter new chat employees
    |--------------------------------------------------------------------------
    */

    const filteredEmployees =
        useMemo(() => {
            const value =
                search.trim().toLowerCase();

            if (!value) {
                return employees;
            }

            return employees.filter(
                (employee) =>
                    employee.name
                        ?.toLowerCase()
                        .includes(value) ||
                    employee.email
                        ?.toLowerCase()
                        .includes(value) ||
                    employee.role
                        ?.toLowerCase()
                        .includes(value) ||
                    employee.designation
                        ?.toLowerCase()
                        .includes(value)
            );
        }, [employees, search]);

    /*
    |--------------------------------------------------------------------------
    | Filter clients
    |--------------------------------------------------------------------------
    */

    const filteredClients =
        useMemo(() => {
            const value =
                search.trim().toLowerCase();

            if (!value) {
                return clients;
            }

            return clients.filter(
                (client) =>
                    client.clientName
                        ?.toLowerCase()
                        .includes(value) ||
                    client.companyName
                        ?.toLowerCase()
                        .includes(value) ||
                    client.email
                        ?.toLowerCase()
                        .includes(value) ||
                    client.phone
                        ?.toLowerCase()
                        .includes(value)
            );
        }, [clients, search]);

    /*
    |--------------------------------------------------------------------------
    | Upload attachment to ImageKit
    |--------------------------------------------------------------------------
    */

    /*
|--------------------------------------------------------------------------
| Upload attachment to ImageKit
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Upload attachment to ImageKit
|--------------------------------------------------------------------------
*/

const uploadAttachment = async (file) => {
    if (!selectedConversation || !file) {
        return null;
    }

    try {
        setUploading(true);

        const formData = new FormData();

        formData.append("file", file);

        formData.append(
            "conversationId",
            selectedConversation._id
        );

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        | This MessagesPage is for EMPLOYEE users:
        | Manager / Sales / Developer
        |
        | Even when the conversation is with a CLIENT,
        | employee authentication is used.
        |
        | Therefore always use:
        | /messages/upload
        |--------------------------------------------------------------------------
        */

        console.log(
            "MESSAGE UPLOAD ENDPOINT:",
            "/messages/upload"
        );

        console.log(
            "CONVERSATION TYPE:",
            selectedConversation?.type
        );

        console.log(
            "CONVERSATION ID:",
            selectedConversation?._id
        );

        const response = await api.post(
            "/messages/upload",
            formData
        );

        const uploadedFile =
            response.data?.data;

        if (!uploadedFile?.url) {
            throw new Error(
                "File URL was not returned by server"
            );
        }

        return uploadedFile;

    } catch (error) {
        console.error(
            "Failed to upload attachment:",
            error
        );

        console.error(
            "Server response:",
            error?.response?.data
        );

        return null;

    } finally {
        setUploading(false);
    }
};
    /*
    |--------------------------------------------------------------------------
    | Attachment selected
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
            await uploadAttachment(file);

        if (!uploadedFile) {
            return;
        }

        setAttachment(
            uploadedFile
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Attachment button
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
    | Remove attachment
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
    | Get message type
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
    | Send message
    |--------------------------------------------------------------------------
    */

    const handleSendMessage = async () => {
        const text =
            message.trim();

        if (
            (!text && !attachment) ||
            !selectedConversation ||
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
                    '/messages',
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
                setMessages((prev) => [
                    ...prev,
                    newMessage,
                ]);

                setConversations(
                    (prev) =>
                        prev.map(
                            (conversation) =>
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
                'Failed to send message:',
                error
            );

            console.error(
                'Server response:',
                error?.response?.data
            );
        } finally {
            setSending(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Enter to send
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
    | Open new chat
    |--------------------------------------------------------------------------
    */

    const handleNewChat = () => {
        setSearch('');

        setNewChatTab(
            isManager
                ? 'employees'
                : 'manager'
        );

        setShowNewChat(true);
    };
    /*
|--------------------------------------------------------------------------
| Clear chat
|--------------------------------------------------------------------------
*/

const handleClearChat = async () => {
    if (!selectedConversation) {
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to clear this entire chat? All messages will be permanently deleted."
    );

    if (!confirmed) {
        return;
    }

    try {
        setShowMenu(false);

        await api.delete(
            `/messages/conversations/${selectedConversation._id}/clear`
        );

        /*
        |--------------------------------------------------------------------------
        | Clear messages from UI
        |--------------------------------------------------------------------------
        */

        setMessages([]);

        /*
        |--------------------------------------------------------------------------
        | Reset last message in conversation list
        |--------------------------------------------------------------------------
        */

        setConversations((prev) =>
            prev.map((conversation) =>
                conversation._id ===
                selectedConversation._id
                    ? {
                        ...conversation,
                        lastMessage: null,
                        lastMessageAt: null,
                        unreadCount: 0,
                    }
                    : conversation
            )
        );

        /*
        |--------------------------------------------------------------------------
        | Reset selected conversation state
        |--------------------------------------------------------------------------
        */

        setSelectedConversation((prev) =>
            prev
                ? {
                    ...prev,
                    lastMessage: null,
                    lastMessageAt: null,
                    unreadCount: 0,
                }
                : prev
        );

    } catch (error) {
        console.error(
            "Failed to clear chat:",
            error
        );

        console.error(
            "Server response:",
            error?.response?.data
        );

        alert(
            error?.response?.data?.message ||
            "Failed to clear chat."
        );
    }
};

    /*
    |--------------------------------------------------------------------------
    | Format time
    |--------------------------------------------------------------------------
    */

    const formatTime = (
        date
    ) => {
        if (!date) return '';

        return new Date(
            date
        ).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Sidebar subtitle
    |--------------------------------------------------------------------------
    */

    const sidebarSubtitle =
        isManager
            ? 'Employees & Clients'
            : isSales
                ? 'Manager & Clients'
                : 'Manager';

    return (
        <div className="h-[calc(100vh-120px)] min-h-[520px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex relative">

            {/* =========================================================
                HIDDEN FILE INPUT
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
                LEFT
            ========================================================== */}

            <section
                className={`
                    w-full md:w-[340px] lg:w-[360px]
                    border-r border-gray-200
                    flex flex-col
                    bg-white
                    ${showChat
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
                                {sidebarSubtitle}
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

                {/* Existing conversations */}

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
                                Click the + button to start a
                                conversation.
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
                            (conversation) => {
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
                                            ${active
                                                ? 'bg-blue-50'
                                                : 'hover:bg-gray-50'
                                            }
                                        `}
                                    >

                                        <div className="relative flex-shrink-0">

                                            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
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

                                                <p className="text-xs text-gray-500 truncate">
                                                    {conversation
                                                        .lastMessage
                                                        ?.text ||
                                                        (
                                                            conversation
                                                                .lastMessage
                                                                ?.attachments
                                                                ?.length > 0
                                                                ? 'Attachment'
                                                                : getConversationSubtitle(
                                                                    conversation
                                                                )
                                                        )}
                                                </p>

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
                CHAT
            ========================================================== */}

            <section
                className={`
                    flex-1 min-w-0 flex-col
                    bg-[#efeae2]
                    ${showChat
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
                                Select a conversation or start a
                                new chat.
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
                                        setShowChat(false)
                                    }
                                    className="md:hidden h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                                >
                                    <ArrowLeft
                                        size={19}
                                    />
                                </button>

                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                    {getInitial(
                                        selectedConversation
                                    )}
                                </div>

                                <div className="min-w-0">

                                    <h2 className="text-sm font-semibold text-gray-900 truncate">
                                        {getConversationName(
                                            selectedConversation
                                        )}
                                    </h2>

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
<button
    type="button"
    onClick={handleClearChat}
    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600"
>
    Clear chat
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
                            ) : messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center">

                                    <div className="bg-white/90 rounded-xl px-5 py-3 text-center shadow-sm">

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
                                            <MessageBubble
                                                key={
                                                    item._id
                                                }
                                                message={
                                                    item
                                                }
                                                currentUserId={
                                                    user?._id
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
                                                    size={
                                                        25
                                                    }
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
                                                    size={
                                                        25
                                                    }
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
                                                    size={
                                                        25
                                                    }
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
                                            <X
                                                size={
                                                    13
                                                }
                                            />
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

                                {/* Emoji Picker */}

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
                                            width={
                                                320
                                            }
                                            height={
                                                400
                                            }
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
                                                size={
                                                    20
                                                }
                                                className="animate-spin text-blue-600"
                                            />
                                        ) : (
                                            <Paperclip
                                                size={
                                                    20
                                                }
                                            />
                                        )}
                                    </button>

                                    {/* Message Input */}

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
                                                size={
                                                    19
                                                }
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
                                            ${(
                                                message.trim() ||
                                                attachment
                                            )
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-gray-100 text-gray-400'
                                            }
                                        `}
                                    >
                                        {sending ? (
                                            <Loader2
                                                size={
                                                    18
                                                }
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Send
                                                size={
                                                    18
                                                }
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

                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

                        {/* Modal Header */}

                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    New Conversation
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Select who you want to message
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowNewChat(false)
                                }
                                className="h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                            >
                                <X
                                    size={19}
                                />
                            </button>

                        </div>

                        {/* =================================================
                            MANAGER TABS
                        ================================================== */}

                        {isManager && (
                            <div className="px-5 pt-4">

                                <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-lg">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewChatTab(
                                                'employees'
                                            );
                                            setSearch('');
                                        }}
                                        className={`
                                            py-2 rounded-md text-sm font-medium transition
                                            ${newChatTab ===
                                                'employees'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500'
                                            }
                                        `}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Users
                                                size={
                                                    16
                                                }
                                            />
                                            Employees
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewChatTab(
                                                'clients'
                                            );
                                            setSearch('');
                                        }}
                                        className={`
                                            py-2 rounded-md text-sm font-medium transition
                                            ${newChatTab ===
                                                'clients'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500'
                                            }
                                        `}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <UserCircle
                                                size={
                                                    16
                                                }
                                            />
                                            Clients
                                        </span>
                                    </button>

                                </div>

                            </div>
                        )}

                        {/* =================================================
                            SALES TABS
                        ================================================== */}

                        {isSales && (
                            <div className="px-5 pt-4">

                                <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-lg">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewChatTab(
                                                'manager'
                                            );
                                            setSearch('');
                                        }}
                                        className={`
                                            py-2 rounded-md text-sm font-medium transition
                                            ${newChatTab ===
                                                'manager'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500'
                                            }
                                        `}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <UserCircle
                                                size={
                                                    16
                                                }
                                            />
                                            Manager
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewChatTab(
                                                'clients'
                                            );
                                            setSearch('');
                                        }}
                                        className={`
                                            py-2 rounded-md text-sm font-medium transition
                                            ${newChatTab ===
                                                'clients'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500'
                                            }
                                        `}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Users
                                                size={
                                                    16
                                                }
                                            />
                                            Clients
                                        </span>
                                    </button>

                                </div>

                            </div>
                        )}

                        {/* =================================================
                            DEVELOPER
                        ================================================== */}

                        {isDeveloper && (
                            <div className="px-5 pt-4">

                                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">

                                    <div className="flex items-center gap-3">

                                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <UserCircle
                                                size={
                                                    19
                                                }
                                            />
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                My Manager
                                            </p>

                                            <p className="text-xs text-gray-500">
                                                Start a conversation with your manager
                                            </p>
                                        </div>

                                    </div>

                                </div>

                            </div>
                        )}

                        {/* =================================================
                            Search
                        ================================================== */}

                        {(!isDeveloper ||
                            newChatTab !== 'manager') && (
                                <div className="px-5 py-4">

                                    <div className="relative">

                                        <Search
                                            size={
                                                17
                                            }
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="text"
                                            value={
                                                search
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setSearch(
                                                    e.target.value
                                                )
                                            }
                                            placeholder={
                                                newChatTab ===
                                                    'employees'
                                                    ? 'Search employees...'
                                                    : 'Search clients...'
                                            }
                                            className="w-full h-10 pl-10 pr-3 rounded-lg bg-gray-100 border border-transparent outline-none text-sm focus:bg-white focus:border-blue-500"
                                        />

                                    </div>

                                </div>
                            )}

                        {/* =================================================
                            People
                        ================================================== */}

                        <div className="max-h-[420px] overflow-y-auto border-t border-gray-100">

                            {loadingPeople ||
                                creatingConversation ? (
                                <div className="h-40 flex items-center justify-center">

                                    <Loader2
                                        size={
                                            24
                                        }
                                        className="animate-spin text-blue-600"
                                    />

                                </div>
                            ) : (
                                <>
                                    {/* =================================================
                                        Manager / Developer
                                    ================================================== */}

                                    {(newChatTab ===
                                        'manager') && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleStartConversation(
                                                        {
                                                            type: 'employee',
                                                        }
                                                    )
                                                }
                                                className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-50 border-b border-gray-100"
                                            >

                                                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                                    {conversations.find(
                                                        (
                                                            conversation
                                                        ) =>
                                                            conversation.type ===
                                                            'employee' &&
                                                            conversation.manager
                                                    )?.manager?.name
                                                        ?.charAt(
                                                            0
                                                        )
                                                        ?.toUpperCase() ||
                                                        'M'}
                                                </div>

                                                <div className="min-w-0 flex-1">

                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {conversations.find(
                                                            (
                                                                conversation
                                                            ) =>
                                                                conversation.type ===
                                                                'employee' &&
                                                                conversation.manager
                                                        )?.manager
                                                            ?.name ||
                                                            'My Manager'}
                                                    </p>

                                                    <p className="text-xs text-gray-500 truncate">
                                                        Start conversation with manager
                                                    </p>

                                                </div>

                                                <MessageSquare
                                                    size={
                                                        17
                                                    }
                                                    className="text-gray-400"
                                                />

                                            </button>
                                        )}

                                    {/* =================================================
                                        Employees
                                    ================================================== */}

                                    {isManager &&
                                        newChatTab ===
                                        'employees' && (
                                            <>
                                                {filteredEmployees.length ===
                                                    0 ? (
                                                    <EmptyPeople
                                                        icon={
                                                            <Users
                                                                size={
                                                                    22
                                                                }
                                                            />
                                                        }
                                                        title="No employees found"
                                                        text="There are no employees available."
                                                    />
                                                ) : (
                                                    filteredEmployees.map(
                                                        (
                                                            employee
                                                        ) => (
                                                            <button
                                                                key={
                                                                    employee._id
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    handleStartConversation(
                                                                        {
                                                                            type: 'employee',
                                                                            employeeId:
                                                                                employee._id,
                                                                        }
                                                                    )
                                                                }
                                                                className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-gray-50 border-b border-gray-100"
                                                            >

                                                                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                                                    {employee.name
                                                                        ?.charAt(
                                                                            0
                                                                        )
                                                                        ?.toUpperCase() ||
                                                                        'E'}
                                                                </div>

                                                                <div className="min-w-0 flex-1">

                                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                                        {
                                                                            employee.name
                                                                        }
                                                                    </p>

                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {employee.designation ||
                                                                            employee.role ||
                                                                            employee.email}
                                                                    </p>

                                                                </div>

                                                                <MessageSquare
                                                                    size={
                                                                        17
                                                                    }
                                                                    className="text-gray-400"
                                                                />

                                                            </button>
                                                        )
                                                    )
                                                )}
                                            </>
                                        )}

                                    {/* =================================================
                                        Clients
                                    ================================================== */}

                                    {newChatTab ===
                                        'clients' && (
                                            <>
                                                {filteredClients.length ===
                                                    0 ? (
                                                    <EmptyPeople
                                                        icon={
                                                            <UserCircle
                                                                size={
                                                                    22
                                                                }
                                                            />
                                                        }
                                                        title="No clients found"
                                                        text={
                                                            isSales
                                                                ? 'No assigned clients are available.'
                                                                : 'There are no clients available.'
                                                        }
                                                    />
                                                ) : (
                                                    filteredClients.map(
                                                        (
                                                            client
                                                        ) => (
                                                            <button
                                                                key={
                                                                    client._id
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    handleStartConversation(
                                                                        {
                                                                            type: 'client',
                                                                            clientId:
                                                                                client._id,
                                                                        }
                                                                    )
                                                                }
                                                                className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-gray-50 border-b border-gray-100"
                                                            >

                                                                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                                                    {client.clientName
                                                                        ?.charAt(
                                                                            0
                                                                        )
                                                                        ?.toUpperCase() ||
                                                                        client.companyName
                                                                            ?.charAt(
                                                                                0
                                                                            )
                                                                            ?.toUpperCase() ||
                                                                        'C'}
                                                                </div>

                                                                <div className="min-w-0 flex-1">

                                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                                        {client.clientName ||
                                                                            client.companyName ||
                                                                            'Client'}
                                                                    </p>

                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {client.companyName ||
                                                                            client.email ||
                                                                            client.phone ||
                                                                            'Client'}
                                                                    </p>

                                                                </div>

                                                                <MessageSquare
                                                                    size={
                                                                        17
                                                                    }
                                                                    className="text-gray-400"
                                                                />

                                                            </button>
                                                        )
                                                    )
                                                )}
                                            </>
                                        )}
                                </>
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
| Empty People
|--------------------------------------------------------------------------
*/

function EmptyPeople({
    icon,
    title,
    text,
}) {
    return (
        <div className="px-6 py-14 text-center">

            <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                {icon}
            </div>

            <h3 className="text-sm font-semibold text-gray-800">
                {title}
            </h3>

            <p className="text-xs text-gray-500 mt-1">
                {text}
            </p>

        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Message Bubble
|--------------------------------------------------------------------------
*/

function MessageBubble({
    message,
    currentUserId,
}) {
    const senderId =
        message.sender?._id ||
        message.sender;

    const isMine =
        String(senderId) ===
        String(currentUserId);

    const formatFileSize = (
        bytes
    ) => {
        if (!bytes) return '';

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
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

                {/* =================================================
                    Attachments
                ================================================== */}

                {message.attachments?.length >
                    0 && (
                    <div className="space-y-2 mb-2">

                        {message.attachments.map(
                            (
                                attachment,
                                index
                            ) => {

                                /*
                                |--------------------------------------------------------------------------
                                | Image
                                |--------------------------------------------------------------------------
                                */

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

                                /*
                                |--------------------------------------------------------------------------
                                | Video
                                |--------------------------------------------------------------------------
                                */

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

                                /*
                                |--------------------------------------------------------------------------
                                | Audio
                                |--------------------------------------------------------------------------
                                */

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
                                                    size={
                                                        18
                                                    }
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

                                /*
                                |--------------------------------------------------------------------------
                                | Document / File
                                |--------------------------------------------------------------------------
                                */

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

                                        <div className={`
                                            w-9 h-9 rounded-lg
                                            flex items-center justify-center
                                            ${
                                                isMine
                                                    ? 'bg-blue-400'
                                                    : 'bg-white'
                                            }
                                        `}>
                                            <FileText
                                                size={
                                                    19
                                                }
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
                                                size={
                                                    16
                                                }
                                            />
                                        </a>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

                {/* =================================================
                    Text
                ================================================== */}

                {message.text && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {message.isDeleted
                            ? 'This message was deleted'
                            : message.text}
                    </p>
                )}

                {/* =================================================
                    Time
                ================================================== */}

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
                        (message.readAt ? (
                            <CheckCheck
                                size={
                                    13
                                }
                            />
                        ) : (
                            <Check
                                size={
                                    13
                                }
                            />
                        ))}

                </div>

            </div>
        </div>
    );
}