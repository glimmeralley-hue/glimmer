import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';

const Messages = () => {
    const { email: paramEmail } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searchMsg, setSearchMsg] = useState("");
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);

    useEffect(() => {
        if (!user.email) { navigate("/signin"); return; }
        fetchConversations();
    }, []);

    useEffect(() => {
        if (paramEmail && paramEmail !== user.email) {
            openChatWith(paramEmail);
        }
    }, [paramEmail]);

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat);
            pollRef.current = setInterval(() => fetchMessages(activeChat), 4000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [activeChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await axios.get(`/api/get_conversations/${user.email}`);
            setConversations(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error("CONV_ERR"); }
    };

    const fetchMessages = async (otherEmail) => {
        try {
            const res = await axios.get(`/api/get_messages/${user.email}/${otherEmail}`);
            setMessages(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error("MSG_ERR"); }
    };

    const openChatWith = async (email) => {
        setActiveChat(email);
        setLoadingMessages(true);
        try {
            const res = await axios.get(`/api/get_user/${email}`);
            setSearchResult(res.data);
        } catch (err) {}
        setLoadingMessages(false);
        fetchConversations();
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;
        try {
            const fd = new FormData();
            fd.append("sender_email", user.email);
            fd.append("recipient_email", activeChat);
            fd.append("content", newMessage.trim());
            await axios.post("/api/send_message", fd);
            setNewMessage("");
            fetchMessages(activeChat);
            fetchConversations();
        } catch (err) { console.error("SEND_ERR"); }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchMsg("");
        setSearchResult(null);
        if (!searchEmail.trim()) return;
        try {
            const res = await axios.get(`/api/get_user/${searchEmail.trim().toLowerCase()}`);
            setSearchResult(res.data);
        } catch (err) {
            setSearchMsg("USER NOT FOUND");
        }
    };

    const activeChatUser = conversations.find(c => c.other_email === activeChat) || searchResult;

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>

            {/* LEFT PANEL - CONVERSATIONS */}
            <div className="d-flex flex-column" style={{ width: '320px', minWidth: '280px', background: 'rgba(0,0,0,0.8)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="p-4 border-bottom border-white border-opacity-10">
                    <h5 className="fw-black text-white mb-3" style={{ letterSpacing: '-0.5px' }}>MESSAGES</h5>
                    <form onSubmit={handleSearch}>
                        <div className="d-flex gap-2">
                            <input
                                type="text"
                                className="form-control bg-white bg-opacity-5 border-0 text-white shadow-none"
                                placeholder="Find by email..."
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                style={{ fontSize: '12px', borderRadius: '8px' }}
                            />
                            <button type="submit" className="btn btn-sm fw-black text-black" style={{ background: '#fff', borderRadius: '8px', whiteSpace: 'nowrap', fontSize: '11px' }}>GO</button>
                        </div>
                        {searchMsg && <p className="text-danger fw-black small mt-2 mb-0">{searchMsg}</p>}
                    </form>

                    {searchResult && !conversations.find(c => c.other_email === searchResult.email) && searchResult.email !== user.email && (
                        <div
                            className="d-flex align-items-center gap-3 mt-3 p-2 rounded-3"
                            style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
                            onClick={() => openChatWith(searchResult.email)}
                        >
                            <img src={`/static/images/${searchResult.profile_pic || 'default.png'}`} className="rounded-circle" style={{ width: '36px', height: '36px', objectFit: 'cover' }} alt="" onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='18' r='18' fill='%23444'/%3E%3C/svg%3E"; }} />
                            <div>
                                <div className="text-white fw-black small">{searchResult.username?.toUpperCase()}</div>
                                <div className="text-white opacity-40" style={{ fontSize: '10px' }}>{searchResult.email}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-grow-1 overflow-auto">
                    {conversations.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-white opacity-20 fw-black small">NO CONVERSATIONS YET</p>
                            <p className="text-white opacity-10 fw-bold" style={{ fontSize: '10px' }}>SEARCH AN EMAIL TO START</p>
                        </div>
                    ) : conversations.map((conv) => (
                        <div
                            key={conv.other_email}
                            className="d-flex align-items-center gap-3 px-4 py-3"
                            style={{
                                cursor: 'pointer',
                                background: activeChat === conv.other_email ? 'rgba(255,255,255,0.08)' : 'transparent',
                                borderLeft: activeChat === conv.other_email ? '3px solid #fff' : '3px solid transparent',
                                transition: 'all 0.15s'
                            }}
                            onClick={() => openChatWith(conv.other_email)}
                        >
                            <img src={`/static/images/${conv.profile_pic || 'default.png'}`} className="rounded-circle flex-shrink-0" style={{ width: '40px', height: '40px', objectFit: 'cover' }} alt="" onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23444'/%3E%3C/svg%3E"; }} />
                            <div className="flex-grow-1 overflow-hidden">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-white fw-black small">{conv.username?.toUpperCase()}</span>
                                    {conv.unread_count > 0 && (
                                        <span className="badge bg-white text-black fw-black" style={{ fontSize: '9px', borderRadius: '10px' }}>{conv.unread_count}</span>
                                    )}
                                </div>
                                <p className="text-white opacity-40 mb-0 text-truncate" style={{ fontSize: '11px' }}>{conv.last_message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL - CHAT */}
            <div className="flex-grow-1 d-flex flex-column" style={{ background: 'rgba(0,0,0,0.6)' }}>
                {activeChat ? (
                    <>
                        {/* CHAT HEADER */}
                        <div className="px-5 py-3 border-bottom border-white border-opacity-10 d-flex align-items-center gap-3">
                            {(activeChatUser || searchResult) && (
                                <>
                                    <img
                                        src={`/static/images/${(activeChatUser || searchResult)?.profile_pic || 'default.png'}`}
                                        className="rounded-circle"
                                        style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                                        alt=""
                                        onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='38' height='38' viewBox='0 0 38 38'%3E%3Ccircle cx='19' cy='19' r='19' fill='%23444'/%3E%3C/svg%3E"; }}
                                    />
                                    <div>
                                        <Link to={`/profile/${activeChat}`} className="text-white fw-black text-decoration-none d-block" style={{ letterSpacing: '-0.3px' }}>
                                            {(activeChatUser || searchResult)?.username?.toUpperCase()}
                                        </Link>
                                        <span className="text-white opacity-30 fw-bold" style={{ fontSize: '10px' }}>{activeChat}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* MESSAGES AREA */}
                        <div className="flex-grow-1 overflow-auto px-5 py-4 d-flex flex-column gap-3">
                            {loadingMessages ? (
                                <p className="text-white opacity-20 fw-black text-center">SYNCING...</p>
                            ) : messages.length === 0 ? (
                                <div className="text-center my-auto">
                                    <p className="text-white opacity-20 fw-black">NO MESSAGES YET</p>
                                    <p className="text-white opacity-10 small fw-bold">SAY SOMETHING</p>
                                </div>
                            ) : messages.map((msg) => {
                                const isMe = msg.sender_email === user.email;
                                return (
                                    <div key={msg.id} className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                        <div
                                            style={{
                                                maxWidth: '65%',
                                                padding: '10px 16px',
                                                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                background: isMe ? '#ffffff' : 'rgba(255,255,255,0.1)',
                                                color: isMe ? '#000' : '#fff',
                                            }}
                                        >
                                            <p className="mb-0 fw-medium" style={{ fontSize: '14px', wordBreak: 'break-word' }}>{msg.content}</p>
                                            <p className="mb-0 mt-1 fw-bold" style={{ fontSize: '9px', opacity: 0.4, textAlign: isMe ? 'right' : 'left' }}>
                                                {msg.created_at ? new Date(msg.created_at.replace(' ', 'T')).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* MESSAGE INPUT */}
                        <div className="px-5 py-4 border-top border-white border-opacity-10">
                            <form onSubmit={handleSend} className="d-flex gap-3">
                                <input
                                    type="text"
                                    className="form-control bg-white bg-opacity-5 border-0 text-white shadow-none py-3 px-4"
                                    placeholder="TYPE A MESSAGE..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    style={{ borderRadius: '14px', fontSize: '14px' }}
                                />
                                <button
                                    type="submit"
                                    className="btn fw-black text-black px-4"
                                    style={{ background: '#fff', borderRadius: '14px', whiteSpace: 'nowrap' }}
                                    disabled={!newMessage.trim()}
                                >
                                    SEND
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                        <div className="text-center">
                            <h3 className="fw-black text-white opacity-20 mb-2">SELECT A CONVERSATION</h3>
                            <p className="text-white opacity-10 fw-bold small">OR SEARCH FOR A USER TO START CHATTING</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
