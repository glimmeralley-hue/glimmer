import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { STATIC_URL } from '../config/constants';
import LoadingSpinner from './LoadingSpinner';

const Feed = () => {
    const [thoughts, setThoughts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [newThought, setNewThought] = useState("");
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [error, setError] = useState("");
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [musicUrl, setMusicUrl] = useState("");
    const [showMusicInput, setShowMusicInput] = useState(false);
    const fileInputRef = useRef(null);
    
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const fetchFeed = async () => {
        try {
            setError("");
            const res = await axios.get(`${API_URL}/get_thoughts`);
            setThoughts(Array.isArray(res.data) ? res.data : []);
        } catch (err) { 
            console.error("FEED_OFFLINE", err);
            setError("Failed to load feed. Please refresh."); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        if (!user.email) navigate("/signin");
        fetchFeed(); 
    }, []);

    const formatTime = (dateStr) => {
        console.log("formatTime called with:", dateStr);
        if (!dateStr) return "JUST NOW";
        
        // Handle different date formats from database
        let date;
        if (dateStr.includes('GMT')) {
            // Format: "Fri, 27 Mar 2026 16:03:35 GMT"
            date = new Date(dateStr);
        } else if (dateStr.includes(' ')) {
            // Format: "2026-03-27 16:03:35"
            date = new Date(dateStr.replace(' ', 'T'));
        } else {
            // Try direct parsing
            date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) return "RECENT";
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        console.log("Time diff:", { diffMs, diffMins, diffHours, diffDays });
        
        // If within last 24 hours, show relative time
        if (diffMins < 1) return "JUST NOW";
        if (diffMins < 60) return `${diffMins}M AGO`;
        if (diffHours < 24) return `${diffHours}H AGO`;
        if (diffDays < 7) return `${diffDays}D AGO`;
        
        // If older than 7 days, show date
        const result = date.toLocaleDateString('en-KE', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
        console.log("Returning:", result);
        return result;
    };

    const renderMusicPlayer = (url) => {
    if (!url || typeof url !== 'string' || url === "null" || url.trim() === "") return null;
    
    try {
        // 1. YouTube & YouTube Music Handling
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            let videoId = "";
            if (url.includes("watch?v=")) {
                videoId = url.split("v=")[1]?.split("&")[0];
            } else if (url.includes("youtu.be/")) {
                videoId = url.split("youtu.be/")[1]?.split("?")[0];
            } else if (url.includes("music.youtube.com/watch?v=")) {
                videoId = url.split("v=")[1]?.split("&")[0];
            }

            if (videoId) {
                return (
                    <div className="music-player-wrapper mb-3 animate-in">
                        <iframe 
                            width="100%" 
                            height="180" 
                            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} 
                            title="YouTube Music Player"
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                        ></iframe>
                    </div>
                );
            }
        }

        // 2. Spotify Handling (Matched to your DB screenshot)
        if (url.includes("spotify.com")) {
            const trackId = url.split("track/")[1]?.split("?")[0];
            if (trackId) {
                return (
                    <div className="music-player-wrapper mb-3 animate-in">
                        <iframe 
                            src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`} 
                            width="100%" height="80" frameBorder="0" 
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                            style={{ borderRadius: '12px' }}
                            loading="lazy"
                        ></iframe>
                    </div>
                );
            }
        }

        // 3. Apple Music Handling
        if (url.includes("music.apple.com")) {
            const appleEmbed = url.replace("music.apple.com", "embed.music.apple.com");
            return (
                <div className="music-player-wrapper mb-3 animate-in">
                    <iframe 
                        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" 
                        frameBorder="0" height="175" 
                        style={{ width:'100%', maxWidth:'660px', overflow:'hidden', borderRadius:'12px', background: 'transparent' }} 
                        src={appleEmbed}
                    ></iframe>
                </div>
            );
        }
    } catch (e) { 
        console.error("PLAYER_RENDER_ERROR", e);
        return null; 
    }
    return null;
};


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handlePostSpill = async (e) => {
        e.preventDefault();
        if (!newThought.trim() && !selectedFile && !musicUrl.trim()) return;
        
        setPosting(true);
        try {
            const fd = new FormData();
            fd.append("email", user.email);
            fd.append("content", newThought.trim() || " "); 
            fd.append("music_url", musicUrl.trim() || ""); 
            
            if (selectedFile) {
                fd.append("image", selectedFile);
            }
            
            const formdata = fd;
            await axios.post(`${API_URL}/add_thought`, formdata);
            
            // Clean up
            setNewThought(""); 
            setSelectedFile(null); 
            setMusicUrl(""); 
            setShowMusicInput(false);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null); 
            if (fileInputRef.current) fileInputRef.current.value = null;
            
            fetchFeed();
        } catch (err) { 
            console.error("SPILL_FAILED", err);
            setError("Failed to post spill. Please try again.");
        } finally {
            setPosting(false);
        }
    };

    const toggleClock = async (id) => {
        try {
            const fd = new FormData();
            fd.append("thought_id", id);
            fd.append("email", user.email);
            const formdata = fd;
            await axios.post(`${API_URL}/toggle_clock`, formdata);
            if (fd.data.status === "success") fetchFeed(); 
        } catch (err) { console.error("CLOCK_ERR"); }
    };

    const toggleClapBackClock = async (id) => {
        try {
            const fd = new FormData();
            fd.append("thought_id", id);  // Use same endpoint for clapbacks
            fd.append("email", user.email);
            const formdata = fd;
            await axios.post(`${API_URL}/toggle_clock`, formdata);
            if (fd.data.status === "success") fetchFeed(); 
        } catch (err) { console.error("CLAPBACK_CLOCK_ERR"); }
    };

    const deleteThought = async (id) => {
        if (!window.confirm("ERASE THIS SPILL?")) return;
        try {
            const fd = new FormData();
            fd.append("id", id);
            fd.append("email", user.email);
            const formdata = fd;
            await axios.post(`${API_URL}/delete_thought`, formdata);
            fetchFeed();
        } catch (err) { console.error("DELETE_FAILED"); }
    };

    const handleClapBack = async (thoughtId) => {
        if (!replyText.trim()) return;
        try {
            const fd = new FormData();
            fd.append("thought_id", thoughtId);
            fd.append("email", user.email);
            fd.append("content", replyText);
            const formdata = fd;
            await axios.post(`${API_URL}/add_clapback`, formdata);
            setReplyText(""); 
            setActiveReplyId(null); 
            fetchFeed();
        } catch (err) { console.error("CLAPBACK_FAILED"); }
    };

    const handleReplyToClapBack = async (replyId) => {
        if (!replyText.trim()) return;
        try {
            const fd = new FormData();
            fd.append("thought_id", replyId);  // Use the clapback ID as thought_id
            fd.append("email", user.email);
            fd.append("content", replyText);
            const formdata = fd;
            await axios.post(`${API_URL}/add_clapback`, formdata);
            setReplyText(""); 
            setActiveReplyId(null); 
            fetchFeed();
        } catch (err) { console.error("REPLY_TO_CLAPBACK_FAILED"); }
    };

    const deleteClapBack = async (replyId) => {
        if (!window.confirm("DELETE THIS REPLY?")) return;
        try {
            const fd = new FormData();
            fd.append("id", replyId);
            fd.append("email", user.email);
            const formdata = fd;
            await axios.post(`${API_URL}/delete_clapback`, formdata);
            fetchFeed();
        } catch (err) { console.error("REPLY_DELETE_FAILED"); }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    
                    {/* INPUT SECTION */}
                    <div className="glass-panel p-4 mb-5 border-top border-white border-4">
                        <form onSubmit={handlePostSpill}>
                            <textarea 
                                className="form-control mb-3 bg-transparent border-0 text-white p-0 shadow-none fs-4 fw-bolder text-uppercase" 
                                rows="2" 
                                placeholder="WHAT'S THE SPILL?" 
                                value={newThought}
                                onChange={(e) => setNewThought(e.target.value)}
                                style={{ resize: 'none' }}
                            />
                            {previewUrl && (
                                <div className="position-relative mb-3">
                                    <img src={previewUrl} className="w-100 rounded-4" style={{ maxHeight: '300px', objectFit: 'cover' }} alt="Preview" />
                                    <button type="button" className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle" onClick={() => { setSelectedFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = null; }}>✕</button>
                                </div>
                            )}
                            {showMusicInput && (
                                <input 
                                    type="text"
                                    className="form-control bg-white bg-opacity-10 border-0 text-white mb-3 rounded-3 py-2 px-3 shadow-none"
                                    placeholder="PASTE SPOTIFY/APPLE MUSIC LINK..."
                                    value={musicUrl}
                                    onChange={(e) => setMusicUrl(e.target.value)}
                                />
                            )}
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex gap-3">
                                    <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
                                    <button type="button" className="btn p-0 text-white opacity-50" onClick={() => fileInputRef.current.click()}>📸</button>
                                    <button type="button" className={`btn p-0 ${showMusicInput ? 'text-info' : 'text-white opacity-50'}`} onClick={() => setShowMusicInput(!showMusicInput)}>🎵</button>
                                </div>
                                <button type="submit" className="btn bg-white text-black fw-black px-5 py-2 rounded-pill" disabled={posting}>
                                    {posting ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>POSTING...</>
                                    ) : 'POST'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ERROR MESSAGE */}
                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert" style={{ backgroundColor: 'rgba(220, 53, 69, 0.2)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
                            <span className="text-white">{error}</span>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setError('')}></button>
                        </div>
                    )}

                    {/* FEED SECTION */}
                    {loading ? (
                        <LoadingSpinner message="SYNCING_GLIMMER_STREAM..." />
                    ) : thoughts.length === 0 ? (
                        <div className="glass-panel p-5 text-center">
                            <i className="bi bi-chat-dots fs-1 text-white opacity-50 mb-3"></i>
                            <h5 className="text-white opacity-50">No spills yet</h5>
                            <p className="text-white opacity-30">Be the first to spill something!</p>
                        </div>
                    ) : thoughts.map((t) => (
                        <div key={t.id} className="glass-panel p-4 mb-5 border-start border-white border-4">
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <Link to={`/profile/${t.user_email}`} className="d-flex align-items-center gap-3 text-decoration-none">
                                    <img src={`${STATIC_URL}/${t.profile_pic || 'default.png'}`} className="rounded-circle border border-white" style={{ width: '45px', height: '45px', objectFit: 'cover' }} alt="" />
                                    <div>
                                        <span className="text-white fw-black d-block">{t.username?.toUpperCase()}</span>
                                        <span className="text-white opacity-40 fw-black small">🤏🏽 {t.clock_count || 0} CLOCKS</span>
                                    </div>
                                </Link>
                                <div className="text-end">
                                    <span className="text-white opacity-20 small fw-bold d-block mb-1">{formatTime(t.created_at)}</span>
                                    {t.user_email === user.email && (
                                        <button onClick={() => deleteThought(t.id)} className="btn p-0 border-0 text-danger opacity-50 fw-black small">DELETE</button>
                                    )}
                                </div>
                            </div>

                            <p className="text-white fw-medium mb-3 fs-5">{t.content}</p>
                            
                            {/* MUSIC PLAYER TRIGGERED HERE */}
                            {t.music_url && renderMusicPlayer(t.music_url)}
                            
                            {t.image_url && <img src={`${STATIC_URL}/${t.image_url}`} className="w-100 rounded-4 mb-3" alt="Post" />}

                            <div className="d-flex gap-4 border-top border-white border-opacity-10 pt-3">
                                <button onClick={() => toggleClock(t.id)} className="btn btn-link p-0 text-white fw-black text-decoration-none">
                                    <span>🤏🏽 CLOCK</span>
                                </button>
                                <button onClick={() => setActiveReplyId(activeReplyId === t.id ? null : t.id)} className="btn btn-link p-0 text-white opacity-50 fw-black text-decoration-none">
                                    💬 CLAP BACK ({t.replies ? t.replies.length : 0})
                                </button>
                            </div>

                            {/* REPLIES SECTION */}
                            {t.replies && t.replies.length > 0 && (
                                <div className="mt-4 border-start border-white border-opacity-10 ps-4">
                                    {t.replies.map((reply) => (
                                        <div key={reply.id} className="mb-4">
                                            <div className="d-flex gap-3 align-items-start">
                                                <Link to={`/profile/${reply.user_email}`} className="text-decoration-none">
                                                    <img src={`${STATIC_URL}/${reply.profile_pic || 'default.png'}`} className="rounded-circle border border-white" style={{ width: '32px', height: '32px', objectFit: 'cover' }} alt="" />
                                                </Link>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <Link to={`/profile/${reply.user_email}`} className="text-decoration-none">
                                                            <span className="text-white fw-black small opacity-75">{reply.username?.toUpperCase()}</span>
                                                        </Link>
                                                        <span className="text-white opacity-40 fw-black small">🤏🏽 {reply.clock_count || 0} CLOCKS</span>
                                                        <button onClick={() => toggleClapBackClock(reply.id)} className="btn btn-link p-0 text-white opacity-50 fw-black text-decoration-none small">
                                                            🤏🏽 CLOCK
                                                        </button>
                                                        {(reply.user_email === user.email || t.user_email === user.email) && (
                                                            <button onClick={() => deleteClapBack(reply.id)} className="btn p-0 border-0 text-danger opacity-50 fw-black small ms-2">✕</button>
                                                        )}
                                                    </div>
                                                    <p className="text-white opacity-80 small mb-2">{reply.reply_content}</p>
                                                    
                                                    {/* Reply to clapback */}
                                                    <button onClick={() => setActiveReplyId(activeReplyId === `reply-${reply.id}` ? null : `reply-${reply.id}`)} className="btn btn-link p-0 text-white opacity-30 fw-black text-decoration-none small mb-2">
                                                        ↳ REPLY
                                                    </button>
                                                </div>
                                                
                                                {/* Reply input for clapback */}
                                                {activeReplyId === `reply-${reply.id}` && (
                                                    <div className="mt-2 d-flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            className="form-control bg-transparent border-white border-opacity-20 text-white" 
                                                            value={replyText} 
                                                            onChange={(e) => setReplyText(e.target.value)} 
                                                            placeholder="REPLY..." 
                                                            style={{ fontSize: '0.85rem' }}
                                                        />
                                                        <button 
                                                            onClick={() => handleReplyToClapBack(reply.id)} 
                                                            className="btn bg-white text-black fw-black px-3 py-1" 
                                                            style={{ fontSize: '0.75rem' }}
                                                        >
                                                            SEND
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeReplyId === t.id && (
                                <div className="mt-3 d-flex gap-2">
                                    <input type="text" className="form-control bg-transparent border-white border-opacity-20 text-white" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="REPLY..." />
                                    <button onClick={() => handleClapBack(t.id)} className="btn bg-white text-black fw-black px-4">SEND</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Feed;
