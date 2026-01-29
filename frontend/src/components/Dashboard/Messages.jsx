import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getMySessions, getMessages, uploadAttachment, markMessagesRead, deleteMessage } from "../../api/chatApi";
import axiosClient from "../../api/axiosClient";
import {
    FiSend, FiPaperclip, FiImage, FiFileText, FiMessageSquare, FiSearch,
    FiMoreVertical, FiArrowLeft, FiEdit2, FiCheck, FiX, FiTrash2, FiCornerDownLeft,
    FiSmile, FiInfo, FiMail, FiMapPin, FiAward, FiWifi, FiWifiOff
} from "react-icons/fi";
import { toast } from "sonner";

export default function Messages({ setSelectedRecipient, selectedRecipient, profile }) {
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [stompClient, setStompClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [isTyping, setIsTyping] = useState(false);
    const [showContactInfo, setShowContactInfo] = useState(false);
    const [contactInfo, setContactInfo] = useState(null);
    const [isOnline, setIsOnline] = useState(true); // User's own online status
    const [onlineUsers, setOnlineUsers] = useState(new Map()); // Track online status of other users
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const currentRole = (profile?.role || localStorage.getItem("role") || "CITIZEN").toUpperCase();
    const currentUserId = profile?.id || localStorage.getItem("userId");

    // Load online status from localStorage on mount
    useEffect(() => {
        const savedStatus = localStorage.getItem(`userOnlineStatus_${currentUserId}`);
        if (savedStatus !== null) {
            setIsOnline(savedStatus === 'true');
        }
    }, [currentUserId]);

    // Save online status to localStorage
    useEffect(() => {
        if (currentUserId) {
            localStorage.setItem(`userOnlineStatus_${currentUserId}`, isOnline.toString());
        }
    }, [isOnline, currentUserId]);

    // Define scrollToBottom first
    const scrollToBottom = React.useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, []);

    // Define selectSession using useCallback
    const selectSession = React.useCallback(async (session) => {
        setCurrentSession(session);
        setReplyingTo(null);
        setEditingMessage(null);
        setMessageText("");
        try {
            const res = await getMessages(session.id);
            setMessages(res.data);
            scrollToBottom();
            await markMessagesRead(session.id);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    }, [scrollToBottom]);

    // Fetch sessions on load
    useEffect(() => {
        const fetchSessions = async (retryCount = 0) => {
            try {
                const res = await getMySessions();
                // Sort by last message time (most recent first)
                const sorted = res.data.sort((a, b) => {
                    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(a.updatedAt || a.createdAt);
                    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(b.updatedAt || b.createdAt);
                    return timeB - timeA;
                });
                setSessions(sorted);

                // Handle selectedRecipient after sessions are loaded
                if (selectedRecipient) {
                    let session = null;
                    
                    // First, try to find by sessionId if provided
                    if (selectedRecipient.sessionId) {
                        session = sorted.find(s => String(s.id) === String(selectedRecipient.sessionId));
                    }
                    
                    // If not found by sessionId, try to find by provider/citizen ID
                    if (!session && selectedRecipient.id) {
                        if (currentRole === 'CITIZEN') {
                            const recipientType = selectedRecipient.type?.toUpperCase() || '';
                            session = sorted.find(s => 
                                String(s.providerId) === String(selectedRecipient.id) && 
                                s.providerRole?.toUpperCase() === recipientType
                            );
                        } else {
                            session = sorted.find(s => String(s.citizenId) === String(selectedRecipient.id));
                        }
                    }
                    
                    // If session found, select it
                    if (session) {
                        selectSession(session);
                        // Clear selectedRecipient after successful selection to avoid re-triggering
                        if (setSelectedRecipient) {
                            setSelectedRecipient(null);
                        }
                    } else if (selectedRecipient.sessionId && retryCount < 3) {
                        // If sessionId is provided but not found, retry after a short delay
                        // This handles the case where the session was just created
                        setTimeout(() => {
                            fetchSessions(retryCount + 1);
                        }, 500);
                    } else if (selectedRecipient.sessionId) {
                        // If we have a sessionId but can't find it after retries, create a temporary session object
                        const tempSession = {
                            id: selectedRecipient.sessionId,
                            providerId: currentRole === 'CITIZEN' ? selectedRecipient.id : null,
                            providerRole: currentRole === 'CITIZEN' ? (selectedRecipient.type?.toUpperCase() || 'LAWYER') : null,
                            citizenId: currentRole !== 'CITIZEN' ? selectedRecipient.id : null,
                            caseId: null,
                            lastMessageTime: null,
                            unreadCount: 0
                        };
                        selectSession(tempSession);
                        if (setSelectedRecipient) {
                            setSelectedRecipient(null);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching sessions:", err);
            }
        };
        fetchSessions();
    }, [selectedRecipient, currentRole, selectSession, setSelectedRecipient]);

    // Connect to WebSocket when session is selected
    useEffect(() => {
        if (!currentSession) return;

        // Get base URL from axiosClient or use default
        const baseUrl = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://localhost:8080';
        const socket = new SockJS(`${baseUrl}/ws-chat`);
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                // Subscribe to session messages
                client.subscribe(`/topic/session.${currentSession.id}`, (msg) => {
                    const data = JSON.parse(msg.body);

                    if (data.type === 'READ_RECEIPT') {
                        if (String(data.readerId) !== String(currentUserId)) {
                            setMessages(prev => prev.map(m => ({ ...m, read: true, isRead: true })));
                        }
                    } else if (data.type === 'TYPING') {
                        if (String(data.userId) !== String(currentUserId)) {
                            if (data.isTyping) {
                                setTypingUsers(prev => new Set([...prev, data.userId]));
                            } else {
                                setTypingUsers(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(data.userId);
                                    return newSet;
                                });
                            }
                        }
                    } else if (data.type === 'PRESENCE') {
                        // Handle presence status updates
                        if (String(data.userId) !== String(currentUserId)) {
                            setOnlineUsers(prev => {
                                const newMap = new Map(prev);
                                newMap.set(data.userId, data.isOnline);
                                return newMap;
                            });
                        }
                    } else {
                        // It's a message (new, edited, or deleted)
                        setMessages((prev) => {
                            const exists = prev.find(m => m.id === data.id);
                            if (exists) {
                                return prev.map(m => m.id === data.id ? data : m);
                            }
                            return [...prev, data];
                        });

                        if (String(data.senderId) !== String(currentUserId)) {
                            markMessagesRead(currentSession.id);
                        }
                        scrollToBottom();
                    }
                });

                // Broadcast initial online status after connection is established
                // Use a small delay to ensure connection is fully ready
                setTimeout(() => {
                    try {
                        if (client && client.connected) {
                            client.publish({
                                destination: "/app/chat.presence",
                                body: JSON.stringify({
                                    sessionId: currentSession.id,
                                    userId: currentUserId,
                                    isOnline: isOnline
                                }),
                            });
                        }
                    } catch (error) {
                        console.warn("Failed to broadcast initial presence:", error);
                    }
                }, 200);
            },
            onDisconnect: () => {
                console.log("WebSocket disconnected");
            },
            onStompError: (frame) => {
                console.error("STOMP error:", frame);
            }
        });

        client.activate();
        setStompClient(client);

        return () => {
            if (client) {
                try {
                    client.deactivate();
                } catch (error) {
                    console.warn("Error deactivating client:", error);
                }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSession, currentUserId]);

    // Broadcast presence status when it changes to all sessions
    useEffect(() => {
        if (!stompClient || !currentUserId || sessions.length === 0) return;

        // Only broadcast if client is connected
        if (!stompClient.connected) {
            // Wait a bit and try again
            const timeoutId = setTimeout(() => {
                if (stompClient && stompClient.connected) {
                    sessions.forEach(session => {
                        try {
                            stompClient.publish({
                                destination: "/app/chat.presence",
                                body: JSON.stringify({
                                    sessionId: session.id,
                                    userId: currentUserId,
                                    isOnline: isOnline
                                }),
                            });
                        } catch (error) {
                            console.warn("Failed to broadcast presence:", error);
                        }
                    });
                }
            }, 300);
            return () => clearTimeout(timeoutId);
        }

        // Broadcast to all sessions
        sessions.forEach(session => {
            try {
                stompClient.publish({
                    destination: "/app/chat.presence",
                    body: JSON.stringify({
                        sessionId: session.id,
                        userId: currentUserId,
                        isOnline: isOnline
                    }),
                });
            } catch (error) {
                console.warn("Failed to broadcast presence to session:", session.id, error);
            }
        });
    }, [isOnline, stompClient, sessions, currentUserId]);


    const handleTyping = () => {
        if (!stompClient || !currentSession) return;

        setIsTyping(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send typing indicator
        stompClient.publish({
            destination: "/app/chat.typing",
            body: JSON.stringify({
                sessionId: currentSession.id,
                userId: currentUserId,
                isTyping: true
            }),
        });

        // Stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            stompClient.publish({
                destination: "/app/chat.typing",
                body: JSON.stringify({
                    sessionId: currentSession.id,
                    userId: currentUserId,
                    isTyping: false
                }),
            });
        }, 3000);
    };

    const handleSendMessage = () => {
        if ((!messageText.trim()) || !stompClient || !currentSession) return;

        if (editingMessage) {
            const updatedMessage = {
                ...editingMessage,
                content: messageText
            };
            stompClient.publish({
                destination: "/app/chat.editMessage",
                body: JSON.stringify(updatedMessage),
            });
            setEditingMessage(null);
        } else {
            const chatMessage = {
                sessionId: currentSession.id,
                senderId: currentUserId,
                senderRole: currentRole,
                content: messageText,
                replyToId: replyingTo?.id || null,
                timestamp: new Date().toISOString()
            };

            stompClient.publish({
                destination: "/app/chat.sendMessage",
                body: JSON.stringify(chatMessage),
            });
            setReplyingTo(null);
        }

        setMessageText("");
        setIsTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await deleteMessage(messageId);
            toast.success("Message deleted");
        } catch (err) {
            toast.error("Failed to delete message");
            console.error(err);
        }
    };

    const startEditing = (msg) => {
        setEditingMessage(msg);
        setMessageText(msg.content);
        setReplyingTo(null);
    };

    const cancelEditing = () => {
        setEditingMessage(null);
        setMessageText("");
    };

    const startReplying = (msg) => {
        setReplyingTo(msg);
        setEditingMessage(null);
    };

    const cancelReplying = () => {
        setReplyingTo(null);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !stompClient || !currentSession) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        try {
            const toastId = toast.loading("Uploading attachment...");
            const res = await uploadAttachment(file);
            toast.dismiss(toastId);

            const isImage = file.type.startsWith("image/");

            const chatMessage = {
                sessionId: currentSession.id,
                senderId: currentUserId,
                senderRole: currentRole,
                content: isImage ? "📷 Photo" : "📎 Document",
                attachmentUrl: res.url,
                attachmentType: isImage ? "IMAGE" : "FILE",
                timestamp: new Date().toISOString()
            };

            stompClient.publish({
                destination: "/app/chat.sendMessage",
                body: JSON.stringify(chatMessage),
            });

        } catch (err) {
            toast.error("Failed to upload file");
            console.error(err);
        }
    };

    const getSessionDisplayName = (session) => {
        if (currentRole === 'CITIZEN') {
            return session.providerName
                ? `${session.providerName}`
                : (session.providerRole === "LAWYER" ? `Lawyer #${session.providerId}` : `NGO #${session.providerId}`);
        } else {
            return session.citizenName
                ? `${session.citizenName}`
                : `Citizen #${session.citizenId}`;
        }
    };

    const getSessionSubtitle = (session) => {
        if (currentRole === 'CITIZEN') {
            return session.providerRole === "LAWYER" ? "Legal Counsel" : "Non-Governmental Org";
        }
        return "Citizen Client";
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const shouldShowDateSeparator = (currentMsg, prevMsg) => {
        if (!prevMsg) return true;
        const currentDate = new Date(currentMsg.timestamp).toDateString();
        const prevDate = new Date(prevMsg.timestamp).toDateString();
        return currentDate !== prevDate;
    };

    const getDateLabel = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    };

    const filteredSessions = sessions.filter(s =>
        getSessionDisplayName(s).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getReplyMessage = (replyToId) => {
        return messages.find(m => m.id === replyToId);
    };


    const handleShowInfo = async () => {
        if (!currentSession) return;

        try {
            let contactData = {
                name: getSessionDisplayName(currentSession),
                role: getSessionSubtitle(currentSession),
                sessionId: currentSession.id,
                email: null,
                phone: null,
            };

            // Fetch contact details
            if (currentRole === 'CITIZEN') {
                if (currentSession.providerRole === 'LAWYER') {
                    const response = await axiosClient.get(`/lawyers/${currentSession.providerId}`);
                    contactData.email = response.data?.email;
                    contactData.phone = response.data?.mobileNum || response.data?.mobile;
                    contactData.specialization = response.data?.specialization;
                } else if (currentSession.providerRole === 'NGO') {
                    const response = await axiosClient.get(`/ngos/${currentSession.providerId}`);
                    contactData.email = response.data?.email;
                    contactData.phone = response.data?.contact;
                    contactData.ngoType = response.data?.ngoType;
                }
            } else {
                // Fetch citizen contact
                try {
                    const response = await axiosClient.get(`/citizens/${currentSession.citizenId}`);
                    contactData.email = response.data?.email;
                    contactData.phone = response.data?.mobileNum || response.data?.mobile;
                } catch (error) {
                    console.error("Error fetching citizen:", error);
                    // Fallback: Try directory
                    try {
                        const dirResponse = await axiosClient.get(`/directory/search?originalId=${currentSession.citizenId}`);
                        if (dirResponse.data?.content && dirResponse.data.content.length > 0) {
                            const entry = dirResponse.data.content[0];
                            contactData.email = entry.contactEmail;
                            contactData.phone = entry.contactPhone;
                        }
                    } catch (dirError) {
                        console.log("Directory lookup also failed");
                    }
                }
            }

            setContactInfo(contactData);
            setShowContactInfo(true);
        } catch (error) {
            console.error("Error fetching contact info:", error);
            toast.error("Unable to load contact information.");
            // Still show basic info
            setContactInfo({
                name: getSessionDisplayName(currentSession),
                role: getSessionSubtitle(currentSession),
                sessionId: currentSession.id,
            });
            setShowContactInfo(true);
        }
    };

    const handleCloseInfo = () => {
        setShowContactInfo(false);
        setContactInfo(null);
    };

    const toggleOnlineStatus = () => {
        setIsOnline(prev => !prev);
        toast.success(`You are now ${!isOnline ? 'online' : 'offline'}`);
    };

    // Get the other user's ID in the current session
    const getOtherUserId = () => {
        if (!currentSession) return null;
        if (currentRole === 'CITIZEN') {
            return currentSession.providerId;
        } else {
            return currentSession.citizenId;
        }
    };

    const otherUserId = getOtherUserId();
    const isOtherUserOnline = otherUserId ? onlineUsers.get(otherUserId) : false;

    return (
        <div className="flex h-[calc(100vh-160px)] bg-[#efeae2] dark:bg-[#0a0a0a] overflow-hidden font-sans transition-colors">
            {/* Sidebar - Platform style */}
            <div className={`w-full md:w-[30%] lg:w-[35%] bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-[#333] flex flex-col ${currentSession ? 'hidden md:flex' : 'flex'} transition-colors`}>
                {/* Sidebar Header */}
                <div className="bg-white dark:bg-[#1a1a1a] px-4 py-3 border-b border-gray-200 dark:border-[#333] transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white">Legal Communications</h3>
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    isOnline 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    {isOnline ? 'Online' : 'Offline'}
                                </div>
                            </div>
                            <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Secure Messaging Hub</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleOnlineStatus}
                                className={`p-2 rounded-full transition-colors ${
                                    isOnline
                                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#222]'
                                }`}
                                title={isOnline ? "You're Online - Click to go Offline" : "You're Offline - Click to go Online"}
                            >
                                {isOnline ? <FiWifi size={20} /> : <FiWifiOff size={20} />}
                            </button>
                            <button
                                onClick={() => toast.info("New conversation feature coming soon")}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222] hover:text-[#D4AF37] rounded-full transition-colors"
                                title="New Conversation"
                            >
                                <FiMessageSquare size={20} />
                            </button>
                            <button
                                onClick={() => toast.info("More options coming soon")}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222] hover:text-[#D4AF37] rounded-full transition-colors"
                                title="More Options"
                            >
                                <FiMoreVertical size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21] custom-scrollbar">
                    {filteredSessions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <FiMessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-sm">No conversations found</p>
                        </div>
                    ) : (
                        filteredSessions.map((session) => {
                            const isActive = currentSession?.id === session.id;
                            return (
                                <button
                                    key={session.id}
                                    onClick={() => selectSession(session)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#202c33] border-b border-gray-100 dark:border-[#2a3942] transition-colors ${isActive ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white text-lg shadow-lg ${isActive ? 'bg-[#D4AF37]' : 'bg-gray-500 dark:bg-[#54656f]'}`}>
                                                {getSessionDisplayName(session).charAt(0).toUpperCase()}
                                            </div>
                                            {/* Online/Offline indicator */}
                                            {(() => {
                                                const otherUserId = currentRole === 'CITIZEN' ? session.providerId : session.citizenId;
                                                const isOtherOnline = otherUserId ? onlineUsers.get(otherUserId) : false;
                                                return (
                                                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-[#1a1a1a] rounded-full shadow-sm ${
                                                        isOtherOnline ? 'bg-green-500' : 'bg-gray-400'
                                                    }`} title={isOtherOnline ? 'Online' : 'Offline'}></div>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                                    {getSessionDisplayName(session)}
                                                </h4>
                                                {session.lastMessageTime && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                                                        {formatTime(session.lastMessageTime)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 min-w-0">
                                                    {session.lastMessagePreview || "No messages yet"}
                                                </p>
                                                {session.unreadCount > 0 && (
                                                    <span className="px-2 py-0.5 bg-[#D4AF37] text-black text-xs font-bold rounded-full min-w-[20px] text-center flex-shrink-0 shadow-sm">
                                                        {session.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area - Platform style */}
            <div className={`flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0a0a0a] ${!currentSession ? 'hidden md:flex' : 'flex'} transition-colors relative`}>
                {currentSession ? (
                    <>
                        {/* Contact Info Panel */}
                        {showContactInfo && (
                            <div className="absolute inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-[#333] shadow-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white">Contact Information</h3>
                                        <button
                                            onClick={handleCloseInfo}
                                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222] rounded-full transition-colors"
                                        >
                                            <FiX size={20} />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center text-white font-bold text-xl">
                                                {getSessionDisplayName(currentSession).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{getSessionDisplayName(currentSession)}</h4>
                                                <p className="text-sm text-[#D4AF37] font-medium">{getSessionSubtitle(currentSession)}</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-200 dark:border-[#333]">
                                            <div className="pt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                                Session ID: {currentSession.id}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chat Header */}
                        <div className="bg-white dark:bg-[#1a1a1a] px-4 py-3 border-b border-gray-200 dark:border-[#333] flex items-center justify-between transition-colors shadow-sm">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCurrentSession(null)}
                                    className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222] hover:text-[#D4AF37] rounded-full transition-colors"
                                >
                                    <FiArrowLeft size={20} />
                                </button>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-white font-semibold shadow-lg">
                                        {getSessionDisplayName(currentSession).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#D4AF37] border-2 border-white dark:border-[#1a1a1a] rounded-full shadow-sm"></div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white font-serif">
                                        {getSessionDisplayName(currentSession)}
                                    </h3>
                                    <p className="text-xs text-[#D4AF37] font-medium">
                                        {typingUsers.size > 0 
                                            ? "typing..." 
                                            : isOtherUserOnline 
                                                ? "online • Secure Channel" 
                                                : "offline • Secure Channel"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleOnlineStatus}
                                    className={`p-2 rounded-full transition-colors ${
                                        isOnline
                                            ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#222]'
                                    }`}
                                    title={isOnline ? "Go Offline" : "Go Online"}
                                >
                                    {isOnline ? <FiWifi size={20} /> : <FiWifiOff size={20} />}
                                </button>
                                <button
                                    onClick={handleShowInfo}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222] hover:text-[#D4AF37] rounded-full transition-colors"
                                    title="Contact Info"
                                >
                                    <FiInfo size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[#efeae2] dark:bg-[#0b141a] bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern id=%22grid%22 width=%2260%22 height=%2260%22 patternUnits=%22userSpaceOnUse%22%3E%3Cpath d=%22M 60 0 L 0 0 0 60%22 fill=%22none%22 stroke=%22rgba(0,0,0,0.03)%22 stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23grid)%22 /%3E%3C/svg%3E')] dark:bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern id=%22grid%22 width=%2260%22 height=%2260%22 patternUnits=%22userSpaceOnUse%22%3E%3Cpath d=%22M 60 0 L 0 0 0 60%22 fill=%22none%22 stroke=%22rgba(255,255,255,0.02)%22 stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23grid)%22 /%3E%3C/svg%3E')]">
                            {messages.map((msg, idx) => {
                                const isMe = String(msg.senderId) === String(currentUserId) &&
                                    String(msg.senderRole).toUpperCase() === currentRole.toUpperCase();
                                const isSeen = msg.read === true || msg.isRead === true;
                                const isDeleted = msg.isDeleted === true || msg.deleted === true;
                                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                                const showDate = shouldShowDateSeparator(msg, prevMsg);
                                const replyMsg = msg.replyToId ? getReplyMessage(msg.replyToId) : null;

                                return (
                                    <React.Fragment key={msg.id || idx}>
                                        {showDate && (
                                            <div className="flex justify-center my-4">
                                                <span className="px-3 py-1 bg-white/80 dark:bg-[#202c33]/80 backdrop-blur-sm text-xs text-gray-600 dark:text-gray-400 rounded-full shadow-sm">
                                                    {getDateLabel(msg.timestamp)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                                            <div className={`max-w-[65%] md:max-w-[45%] relative ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                                {/* Reply Preview */}
                                                {replyMsg && !isDeleted && (
                                                    <div className={`w-full mb-1 px-3 py-2 rounded-t-lg border-l-4 ${isMe
                                                        ? 'bg-white/50 dark:bg-[#2a3942]/50 border-[#D4AF37] dark:border-[#D4AF37]'
                                                        : 'bg-white/50 dark:bg-[#2a3942]/50 border-gray-300 dark:border-gray-600'
                                                        }`}>
                                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                            {replyMsg.senderId === currentUserId ? 'You' : getSessionDisplayName(currentSession)}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                            {replyMsg.attachmentUrl
                                                                ? (replyMsg.attachmentType === 'IMAGE' ? '📷 Photo' : '📎 Document')
                                                                : replyMsg.content
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                <div className={`relative flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    {/* Message Bubble */}
                                                    <div
                                                        className={`px-3 py-2 rounded-lg shadow-sm relative group ${isMe
                                                            ? isDeleted
                                                                ? "bg-gray-300 dark:bg-[#2a3942] text-gray-500 dark:text-gray-500"
                                                                : "bg-[#D4AF37] dark:bg-[#D4AF37]/90 text-black dark:text-black rounded-tr-none"
                                                            : isDeleted
                                                                ? "bg-gray-200 dark:bg-[#202c33] text-gray-500 dark:text-gray-500"
                                                                : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-tl-none"
                                                            }`}
                                                    >
                                                        {!isMe && !isDeleted && (
                                                            <div className="text-xs font-semibold text-[#D4AF37] dark:text-[#D4AF37] mb-1">
                                                                {getSessionDisplayName(currentSession)}
                                                            </div>
                                                        )}

                                                        {msg.attachmentUrl && !isDeleted ? (
                                                            msg.attachmentType === "IMAGE" ? (
                                                                <div className="mb-2 overflow-hidden rounded-lg">
                                                                    <img
                                                                        src={msg.attachmentUrl}
                                                                        alt="attachment"
                                                                        className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                                        onClick={() => window.open(msg.attachmentUrl, '_blank')}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <a
                                                                    href={msg.attachmentUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center gap-3 p-3 bg-white/50 dark:bg-[#2a3942]/50 rounded-lg mb-2 hover:bg-white/70 dark:hover:bg-[#2a3942]/70 transition-colors"
                                                                >
                                                                    <div className="p-2 bg-[#D4AF37] dark:bg-[#D4AF37] rounded-lg">
                                                                        <FiFileText size={20} className="text-black" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Document</div>
                                                                        <div className="text-xs text-gray-600 dark:text-gray-400">Click to download</div>
                                                                    </div>
                                                                </a>
                                                            )
                                                        ) : null}

                                                        <div className={`text-sm leading-relaxed ${isDeleted ? 'italic' : ''}`}>
                                                            {isDeleted ? "This message was deleted" : msg.content}
                                                        </div>

                                                        <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                                {formatMessageTime(msg.timestamp)}
                                                            </span>
                                                            {isMe && !isDeleted && (
                                                                <div className="flex items-center">
                                                                    {isSeen ? (
                                                                        <FiCheck size={14} className="text-blue-600 dark:text-blue-400" />
                                                                    ) : (
                                                                        <FiCheck size={14} className="text-black/40 dark:text-black/40" />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {msg.isEdited && (
                                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">edited</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Message Actions */}
                                                    {!isDeleted && (
                                                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                            <button
                                                                onClick={() => startReplying(msg)}
                                                                className="p-1.5 bg-white dark:bg-[#202c33] rounded-full shadow-lg border border-gray-200 dark:border-[#2a3942] hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors"
                                                                title="Reply"
                                                            >
                                                                <FiCornerDownLeft size={14} className="text-gray-600 dark:text-gray-400" />
                                                            </button>
                                                            {isMe && (
                                                                <>
                                                                    <button
                                                                        onClick={() => startEditing(msg)}
                                                                        className="p-1.5 bg-white dark:bg-[#202c33] rounded-full shadow-lg border border-gray-200 dark:border-[#2a3942] hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors"
                                                                        title="Edit"
                                                                    >
                                                                        <FiEdit2 size={14} className="text-gray-600 dark:text-gray-400" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                                        className="p-1.5 bg-white dark:bg-[#202c33] rounded-full shadow-lg border border-gray-200 dark:border-[#2a3942] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <FiTrash2 size={14} className="text-red-500" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}

                            {/* Typing Indicator */}
                            {typingUsers.size > 0 && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-[#202c33] px-4 py-2 rounded-lg shadow-sm">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Preview Bar */}
                        {replyingTo && (
                            <div className="px-4 py-2 bg-white/90 dark:bg-[#202c33]/90 backdrop-blur-sm border-t border-gray-200 dark:border-[#2a3942] flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                                        <FiCornerDownLeft size={14} className="text-black rotate-180" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            Replying to {replyingTo.senderId === currentUserId ? 'yourself' : getSessionDisplayName(currentSession)}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                            {replyingTo.attachmentUrl
                                                ? (replyingTo.attachmentType === 'IMAGE' ? '📷 Photo' : '📎 Document')
                                                : replyingTo.content
                                            }
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={cancelReplying}
                                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                        )}

                        {/* Edit Preview Bar */}
                        {editingMessage && (
                            <div className="px-4 py-2 bg-[#D4AF37]/10 dark:bg-[#2a3942] border-t border-[#D4AF37] dark:border-[#D4AF37] flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <FiEdit2 className="text-[#D4AF37] dark:text-[#D4AF37]" size={18} />
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Editing message</p>
                                </div>
                                <button
                                    onClick={cancelEditing}
                                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                        )}

                        {/* Input Area - WhatsApp style */}
                        <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-3 border-t border-gray-200 dark:border-[#2a3942] transition-colors">
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a3942] rounded-full transition-colors flex-shrink-0"
                                    title="Attach file"
                                >
                                    <FiPaperclip size={22} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept="image/*,.pdf,.doc,.docx"
                                />

                                <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-3xl px-4 py-2 flex items-center gap-2 border border-gray-200 dark:border-[#2a3942] focus-within:border-[#D4AF37] transition-colors">
                                    <button
                                        onClick={() => toast.info("Emoji picker coming soon")}
                                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-[#D4AF37] transition-colors"
                                        title="Emoji"
                                    >
                                        <FiSmile size={22} />
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Type a message"
                                        className="flex-1 bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 text-sm md:text-base outline-none"
                                        value={messageText}
                                        onChange={(e) => {
                                            setMessageText(e.target.value);
                                            handleTyping();
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim() && !editingMessage}
                                    className={`p-3 rounded-full shadow-lg transition-colors flex-shrink-0 ${
                                        messageText.trim() || editingMessage
                                            ? 'bg-[#D4AF37] hover:bg-[#c5a059] text-black cursor-pointer'
                                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    }`}
                                    title="Send Message"
                                >
                                    <FiSend size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-[#efeae2] dark:bg-[#0a0a0a]">
                        <div className="w-32 h-32 bg-white/50 dark:bg-[#1a1a1a]/50 rounded-full flex items-center justify-center mb-6 border-2 border-[#D4AF37]/20">
                            <FiMessageSquare size={64} className="text-[#D4AF37]/30" />
                        </div>
                        <h3 className="text-2xl font-bold font-serif text-gray-900 dark:text-white mb-2">Legal Communication Hub</h3>
                        <p className="text-center max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            Connect securely with your legal advisors and case managers.<br />
                            All conversations are protected and confidential.
                        </p>
                        <div className="mt-8 px-6 py-3 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#D4AF37]/30 rounded-full">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">End-to-End Encrypted</span>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-500 text-center">
                            Select a conversation to begin messaging
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
