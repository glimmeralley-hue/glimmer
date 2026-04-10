import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import API_URL from '../config/api';
import { STATIC_URL } from '../config/constants';

const Messages = () => {
    const navigate = useNavigate();
    
    // State Management
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [showNewConvModal, setShowNewConvModal] = useState(false);
    const [newConvEmail, setNewConvEmail] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const messagesEndRef = useRef(null);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // 1. WebSocket Lifecycle
    useEffect(() => {
        const newSocket = io('https://glimmer-api.onrender.com', {
            transports: ['websocket', 'polling'],
            auth: { email: user.email }
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            newSocket.emit('join_user', user.email);
            console.log('Connected to chat server');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from chat server');
        });

        newSocket.on('online_users', (users) => {
            setOnlineUsers(users);
        });

        newSocket.on('receive_message', (data) => {
            // If the incoming message belongs to the open chat, append it
            setSelectedConversation(current => {
                if (current && data.conversation_id === current.id) {
                    setMessages(prev => [...prev, data.message]);
                }
                return current;
            });

            // Update the sidebar preview for all users
            setConversations(prev => prev.map(conv => 
                conv.id === data.conversation_id 
                    ? { ...conv, last_message: data.message.message_content, last_message_time: data.message.created_at }
                    : conv
            ));
        });

        setSocket(newSocket);
        return () => newSocket.close();
    }, [user.email]);

    // 2. Data Fetching
    const fetchConversations = async () => {
        try {
            const res = await axios.get(`${API_URL}/get_conversations/${user.email}`);
            setConversations(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Fetch Conversations Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conv) => {
        if (!conv || !conv.id) {
            console.error("Invalid conversation object:", conv);
            return;
        }
        setSelectedConversation(conv);
        try {
            const res = await axios.get(`${API_URL}/get_messages/${conv.id}`);
            setMessages(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Fetch Messages Error:", err);
            setMessages([]);
        }
    };

    // 3. Actions
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

        setSendingMessage(true);
        const messageData = {
            conversation_id: selectedConversation.id,
            sender_email: user.email,
            message_content: newMessage
        };

        try {
            const res = await axios.post(`${API_URL}/send_message`, messageData);
            if (res.data.success) {
                const savedMsg = res.data.message;
                setMessages(prev => [...prev, savedMsg]);
                setNewMessage("");

                // Emit to recipient via Socket
                socket.emit('send_message', {
                    conversation_id: selectedConversation.id,
                    message: savedMsg,
                    recipient_email: selectedConversation.other_user_email
                });
            } else {
                alert('Failed to send message');
            }
        } catch (err) {
            console.error("Send Error:", err);
            alert('Failed to send message. Please try again.');
        } finally {
            setSendingMessage(false);
        }
    };

    const startNewConversation = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/create_conversation`, {
                user1_email: user.email,
                user2_email: newConvEmail
            });
            
            if (res.data.status === "success" || res.data.status === "exists") {
                await fetchConversations();
                setShowNewConvModal(false);
                setNewConvEmail("");
                
                // Find the conversation in the updated list and select it
                const updatedConversations = await axios.get(`${API_URL}/get_conversations/${user.email}`);
                if (Array.isArray(updatedConversations.data)) {
                    const newConv = updatedConversations.data.find(conv => 
                        conv.other_user_email === newConvEmail
                    );
                    if (newConv) {
                        selectConversation(newConv);
                    }
                }
            }
        } catch (err) {
            console.error("Create conversation error:", err);
            alert("User not found or error creating conversation.");
        }
    };

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => { fetchConversations(); }, []);

    const selectConversation = (conv) => {
        setSelectedConversation(conv);
        fetchMessages(conv);
    };

    const filteredConversations = conversations.filter(c => c.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="container-fluid bg-dark text-white p-0" style={{ height: '100vh' }}>
            <div className="row g-0 h-100">
                
                {/* SIDEBAR: Conversations List */}
                <div className="col-md-4 border-end border-secondary d-flex flex-column h-100">
                    <div className="p-3 bg-black">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="d-flex align-items-center gap-2">
                                <h4 className="fw-bold m-0">CHATS</h4>
                                <span className={`badge ${isConnected ? 'bg-success' : 'bg-danger'} rounded-pill`} style={{ fontSize: '8px' }}>
                                    {isConnected ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </div>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowNewConvModal(true)}>+</button>
                        </div>
                        <input 
                            className="form-control form-control-sm bg-secondary border-0 text-white" 
                            placeholder="Search..." 
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-grow-1 overflow-auto" style={{ maxHeight: 'calc(100% - 120px)' }}>
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center py-5">
                                <p className="text-white opacity-40 fw-black">NO CONVERSATIONS</p>
                                <p className="text-white opacity-30 small">START A NEW CONVERSATION</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className="p-3 border-bottom border-secondary cursor-pointer hover-bg-primary hover-bg-opacity-10"
                                    onClick={() => selectConversation(conv)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-start gap-3">
                                        <img 
                                            src={conv.profile_pic ? `${STATIC_URL}/${conv.profile_pic}` : `${STATIC_URL}/default.png`} 
                                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-black" 
                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                                            onError={(e) => { e.target.src = `${STATIC_URL}/default.png`; }} 
                                            alt=""
                                        />
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 className="fw-black mb-1 text-white">{conv.other_user_name || 'Unknown User'}</h6>
                                                    <p className="text-white opacity-50 mb-0 small" style={{ fontSize: '11px' }}>
                                                        {conv.last_message || 'No messages yet'}
                                                    </p>
                                                </div>
                                                <div className="text-end">
                                                    <p className="text-white opacity-40 mb-0" style={{ fontSize: '10px' }}>
                                                        {conv.last_message_time ? new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </p>
                                                    {conv.unread_count > 0 && (
                                                        <span className="badge bg-primary rounded-pill mt-1">{conv.unread_count}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* MAIN: Chat Window */}
                {selectedConversation ? (
                <div className="flex-grow-1">
                    <div className="p-3">
                        <Link to={`/profile/${selectedConversation.other_user_email}`} className="text-white text-decoration-none">
                            <h5 className="m-0">{selectedConversation.other_user_name}</h5>
                            <small className={isConnected ? "text-success" : "text-danger"}>
                                {isConnected ? "Online" : "Offline"}
                            </small>
                        </Link>
                    </div>
                    <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column">
                        {messages.map((msg, i) => (
                            <div key={i} className={`d-flex mb-3 ${msg.sender_email === user.email ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div className={`p-2 px-3 rounded-pill ${msg.sender_email === user.email ? 'bg-primary text-white' : 'bg-secondary text-white'}`} style={{ maxWidth: '75%' }}>
                                    <div style={{ fontSize: '14px' }}>{msg.message_content}</div>
                                    <div className="text-white opacity-50" style={{ fontSize: '10px', marginTop: '4px' }}>
                                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="p-3 bg-dark">
                                <div className="input-group">
                                    <input 
                                        className="form-control bg-black text-white border-secondary"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Write something..."
                                        disabled={sendingMessage}
                                    />
                                    <button className="btn btn-primary px-4" type="submit" disabled={sendingMessage}>
                                        {sendingMessage ? (
                                            <React.Fragment>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                SENDING...
                                            </React.Fragment>
                                        ) : 'SEND'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="h-100 d-flex flex-column align-items-center justify-content-center opacity-25">
                            <i className="bi bi-chat-dots fs-1"></i>
                            <p className="mt-2">Select a user to start a conversation</p>
                        </div>
                    )}
            </div>

            {/* MODAL: New Conversation */}
            {showNewConvModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content bg-dark border-secondary">
                            <form onSubmit={startNewConversation}>
                                <div className="modal-header border-secondary">
                                    <h5 className="modal-title">New Message</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowNewConvModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <label className="small text-white-50">Recipient Email</label>
                                    <input 
                                        type="email" 
                                        required 
                                        className="form-control bg-black text-white border-secondary"
                                        value={newConvEmail}
                                        onChange={(e) => setNewConvEmail(e.target.value)}
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div className="modal-footer border-secondary">
                                    <button type="submit" className="btn btn-primary w-100">Start Chat</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
