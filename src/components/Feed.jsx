import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Feed = () => {
    const [thoughts, setThoughts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newThought, setNewThought] = useState("");
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [clockedPosts, setClockedPosts] = useState(new Set()); 
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [musicUrl, setMusicUrl] = useState("");
    const [showMusicInput, setShowMusicInput] = useState(false);
    const fileInputRef = useRef(null);
    
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const fetchFeed = async () => {
        try {
            // This now pulls the "Bundled" thoughts with replies and clock_count
            const res = await axios.get("https://glimmer.alwaysdata.net/api/get_thoughts");
            setThoughts(Array.isArray(res.data) ? res.data : []);
        } catch (err) { 
            console.error("FEED_OFFLINE"); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        if (!user.email) navigate("/signin");
        fetchFeed(); 
    }, []);

    // --- BULLETPROOF MUSIC RENDERER ---
    const renderMusicPlayer = (url) => {
        if (!url || url === "null" || url === "" || url === "undefined") return null;
        try {
            // Fix for Spotify links (handles standard and share links)
            if (url.includes("spotify.com")) {
                const spotifyMatch = url.match(/track\/([a-zA-Z0-9]+)/);
                const trackId = spotifyMatch ? spotifyMatch[1] : null;
                if (trackId) {
                    return (
                        <div className="music-player-wrapper mb-3 animate-in">
                            <iframe 
                                src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`} 
                                width="100%" height="80" frameBorder="0" 
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                style={{ borderRadius: '12px', background: 'transparent' }}
                                loading="lazy"
                            ></iframe>
                        </div>
                    );
                }
            }
            // Fix for Apple Music links
            if (url.includes("music.apple.com")) {
                const appleEmbed = url.replace("music.apple.com", "embed.music.apple.com");
                return (
                    <div className="music-player-wrapper mb-3 animate-in">
                        <iframe 
                            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" 
                            frameBorder="0" height="175" 
                            style={{ width:'100%', overflow:'hidden', borderRadius:'12px', background: 'transparent' }} 
                            src={appleEmbed}
                        ></iframe>
                    </div>
                );
            }
        } catch (e) { return null; }
        return null;
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "JUST NOW";
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) { return "RECENT"; }
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
        try {
            const fd = new FormData();
            fd.append("email", user.email);
            fd.append("content", newThought);
            fd.append("music_url", musicUrl); 
            if (selectedFile) fd.append("image", selectedFile);
            
            await axios.post("https://glimmer.alwaysdata.net/api/add_thought", fd);
            setNewThought(""); setSelectedFile(null); setPreviewUrl(null); setMusicUrl(""); setShowMusicInput(false);
            fetchFeed();
        } catch (err) { alert("SPILL_FAILED"); }
    };

    const toggleClock = async (id) => {
        // Optimistic Update
        setClockedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });

        try {
            const fd = new FormData();
            fd.append("thought_id", id);
            fd.append("email", user.email);
            await axios.post("https://glimmer.alwaysdata.net/api/toggle_clock", fd);
            fetchFeed(); 
        } catch (err) { console.error("CLOCK_ERR"); }
    };

    const handleClapBack = async (thoughtId) => {
        if (!replyText.trim()) return;
        try {
            const fd = new FormData();
            fd.append("thought_id", thoughtId);
            fd.append("email", user.email);
            fd.append("content", replyText);
            await axios.post("https://glimmer.alwaysdata.net/api/add_clapback", fd);
            setReplyText(""); setActiveReplyId(null); fetchFeed();
        } catch (err) { console.error("CLAPBACK_FAILED"); }
    };

    const deleteClapBack = async (replyId) => {
        if (!window.confirm("DELETE THIS REPLY?")) return;
        try {
            const fd = new FormData();
            fd.append("id", replyId);
            fd.append("email", user.email);
            await axios.post("https://glimmer.alwaysdata.net/api/delete_clapback", fd);
            fetchFeed();
        } catch (err) { console.error("REPLY_DELETE_FAILED"); }
    };

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '100px' }}>
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    
                    {/* TOP SPILL BOX */}
                    <div className="glass-panel p-4 mb-5" style={{ borderTop: '4px solid #fff' }}>
                        <form onSubmit={handlePostSpill}>
                            <textarea 
                                className="form-control mb-3 bg-transparent border-0 text-white p-0 shadow-none" 
                                rows="2" 
                                placeholder="WHAT'S THE SPILL?" 
                                value={newThought}
                                onChange={(e) => setNewThought(e.target.value)}
                                style={{ resize: 'none', fontSize: '1.4rem', fontWeight: '900', textTransform: 'uppercase' }}
                            />
                            {previewUrl && (
                                <div className="position-relative mb-3">
                                    <img src={previewUrl} className="w-100 rounded-4" style={{ maxHeight: '300px', objectFit: 'cover' }} alt="Preview" />
                                    <button type="button" className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}>✕</button>
                                </div>
                            )}
                            {showMusicInput && (
                                <input 
                                    type="text"
                                    className="form-control bg-white bg-opacity-10 border-0 text-white mb-3 rounded-3 py-2 px-3 shadow-none"
                                    placeholder="PASTE SPOTIFY/APPLE MUSIC LINK..."
                                    value={musicUrl}
                                    onChange={(e) => setMusicUrl(e.target.value)}
                                    style={{ fontSize: '0.85rem' }}
                                />
                            )}
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex gap-3">
                                    <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
                                    <button type="button" className="btn p-0 text-white opacity-50 hover-opacity-100 border-0 shadow-none" onClick={() => fileInputRef.current.click()}>📸</button>
                                    <button type="button" className={`btn p-0 border-0 shadow-none ${showMusicInput ? 'text-info' : 'text-white opacity-50'}`} onClick={() => setShowMusicInput(!showMusicInput)}>🎵</button>
                                </div>
                                <button type="submit" className="btn bg-white text-black fw-black px-5 py-2 rounded-pill">POST</button>
                            </div>
                        </form>
                    </div>

                    {loading ? (
                        <p className="text-white opacity-20 fw-black text-center">SYNCING_GLIMMER_STREAM...</p>
                    ) : thoughts.map((t) => (
                        <div key={t.id} className="glass-panel p-4 mb-5" style={{ borderLeft: '4px solid #fff' }}>
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <Link to={`/profile/${t.user_email}`} className="d-flex align-items-center gap-3 text-decoration-none">
                                    <img src={`https://glimmer.alwaysdata.net/static/images/${t.profile_pic || 'default.png'}`} className="rounded-circle border border-white" style={{ width: '45px', height: '45px', objectFit: 'cover' }} alt="" />
                                    <div>
                                        <span className="text-white fw-black d-block">{t.username?.toUpperCase()}</span>
                                        <span className="text-white opacity-40 fw-black small">🤏🏽 {t.clock_count || 0} CLOCKS</span>
                                    </div>
                                </Link>
                                <span className="text-white opacity-20 small fw-bold">{formatTime(t.created_at)}</span>
                            </div>

                            <p className="text-white fw-medium mb-3" style={{ fontSize: '1.25rem' }}>{t.content}</p>
                            
                            {/* MUSIC PLAYER RENDERED HERE */}
                            {t.music_url && renderMusicPlayer(t.music_url)}
                            
                            {t.image_url && <img src={`https://glimmer.alwaysdata.net/static/images/${t.image_url}`} className="w-100 rounded-4 mb-3" alt="Post" />}

                            <div className="d-flex gap-4 border-top border-white border-opacity-10 pt-3">
                                <button onClick={() => toggleClock(t.id)} className="btn btn-link p-0 text-white fw-black text-decoration-none d-flex align-items-center gap-2">
                                    <span>🤏🏽</span> 
                                    <span style={{ fontSize: '0.8rem' }}>{clockedPosts.has(t.id) ? 'CLOCKED' : 'CLOCK'}</span>
                                </button>
                                <button onClick={() => setActiveReplyId(activeReplyId === t.id ? null : t.id)} className="btn btn-link p-0 text-white opacity-50 fw-black text-decoration-none" style={{ fontSize: '0.8rem' }}>
                                    💬 CLAP BACK {t.replies?.length > 0 && `(${t.replies.length})`}
                                </button>
                            </div>

                            {/* REPLIES Section using the Bundled Data */}
                            {t.replies && t.replies.length > 0 && (
                                <div className="mt-4 border-start border-white border-opacity-10 ps-4">
                                    {t.replies.map((reply) => (
                                        <div key={reply.id} className="mb-3 d-flex justify-content-between">
                                            <div>
                                                <Link to={`/profile/${reply.user_email}`} className="text-decoration-none">
                                                    <span className="text-white fw-black small opacity-50">{reply.username?.toUpperCase()}</span>
                                                </Link>
                                                <p className="text-white opacity-80 small mb-0">{reply.reply_content}</p>
                                            </div>
                                            {(reply.user_email === user.email || t.user_email === user.email) && (
                                                <button onClick={() => deleteClapBack(reply.id)} className="btn p-0 border-0 text-danger opacity-30 fw-black" style={{ fontSize: '0.65rem' }}>✕</button>
                                            )}
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
