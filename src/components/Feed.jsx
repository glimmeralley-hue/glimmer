import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { STATIC_URL } from '../config/constants';
import LoadingSpinner from './LoadingSpinner';

const Feed = () => {
    const [activeTab, setActiveTab] = useState('spills');
    const [thoughts, setThoughts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
<<<<<<< HEAD
    const [productsLoading, setProductsLoading] = useState(false);

    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyText, setReplyText] = useState("");

    const [showSpillModal, setShowSpillModal] = useState(false);
    const [newThought, setNewThought] = useState("");
=======
    const [posting, setPosting] = useState(false);
    const [newThought, setNewThought] = useState("");
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [error, setError] = useState("");
    
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [musicUrl, setMusicUrl] = useState("");
    const [showMusicInput, setShowMusicInput] = useState(false);
    const [posting, setPosting] = useState(false);

    const [viewProduct, setViewProduct] = useState(null);

    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const fetchFeed = async () => {
        try {
<<<<<<< HEAD
            const res = await axios.get("/api/get_thoughts");
            const raw = Array.isArray(res.data) ? res.data : [];
            const scored = raw.map(t => ({
                ...t,
                _score: (t.clock_count || 0) * 2 +
                    ((t.replies || []).length) * 1.5 +
                    (((Date.now() - new Date(t.created_at.replace(' ', 'T') + 'Z').getTime()) / 3600000) < 6 ? 5 : 0),
            }));
            scored.sort((a, b) => b._score - a._score);
            setThoughts(scored);
        } catch (err) {
            console.error("FEED_OFFLINE");
        } finally {
            setLoading(false);
=======
            setError("");
            const res = await axios.get(`${API_URL}/get_thoughts`);
            setThoughts(Array.isArray(res.data) ? res.data : []);
        } catch (err) { 
            console.error("FEED_OFFLINE", err);
            setError("Failed to load feed. Please refresh."); 
        } finally { 
            setLoading(false); 
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
        }
    };

    const fetchProducts = async () => {
        if (products.length > 0) return;
        setProductsLoading(true);
        try {
            const res = await axios.get("/api/get_products");
            setProducts(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        if (!user.email) navigate("/signin");
        fetchFeed();
    }, []);

    useEffect(() => {
        if (activeTab === 'products') fetchProducts();
    }, [activeTab]);

    const formatTime = (dateStr) => {
        console.log("formatTime called with:", dateStr);
        if (!dateStr) return "JUST NOW";
<<<<<<< HEAD
        const date = new Date(dateStr.replace(' ', 'T') + 'Z');
        if (isNaN(date.getTime())) return "RECENT";
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "JUST NOW";
        if (diffMins < 60) return `${diffMins}m AGO`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h AGO`;
        return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
=======
        
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
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
    };

    const renderMusicPlayer = (url) => {
        if (!url || url === "null" || url.trim() === "") return null;
        try {
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                let videoId = "";
                if (url.includes("watch?v=")) videoId = url.split("v=")[1]?.split("&")[0];
                else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];
                if (videoId) return (
                    <div className="mb-3">
                        <iframe width="100%" height="160" src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                            title="YouTube" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} allowFullScreen />
                    </div>
                );
            }
            if (url.includes("spotify.com")) {
                const trackId = url.split("track/")[1]?.split("?")[0];
                if (trackId) return (
                    <div className="mb-3">
                        <iframe src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
                            width="100%" height="80" frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            style={{ borderRadius: '12px' }} loading="lazy" />
                    </div>
                );
            }
        } catch (e) { return null; }
        return null;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
    };

    const handlePostSpill = async (e) => {
        e.preventDefault();
        if (!newThought.trim() && !selectedFile && !musicUrl.trim()) return;
<<<<<<< HEAD
=======
        
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
        setPosting(true);
        try {
            const fd = new FormData();
            fd.append("email", user.email);
<<<<<<< HEAD
            fd.append("content", newThought.trim() || " ");
            fd.append("music_url", musicUrl.trim() || "");
            if (selectedFile) fd.append("image", selectedFile);
            await axios.post("/api/add_thought", fd);
            setNewThought(""); setSelectedFile(null); setMusicUrl(""); setShowMusicInput(false);
=======
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
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = null;
            setShowSpillModal(false);
            fetchFeed();
<<<<<<< HEAD
        } catch (err) {
            alert("SPILL_FAILED");
=======
        } catch (err) { 
            console.error("SPILL_FAILED", err);
            setError("Failed to post spill. Please try again.");
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
        } finally {
            setPosting(false);
        }
    };

    const toggleClock = async (id) => {
        try {
            const fd = new FormData();
<<<<<<< HEAD
            fd.append("thought_id", id); fd.append("email", user.email);
            await axios.post("/api/toggle_clock", fd);
            fetchFeed();
=======
            fd.append("thought_id", id);
            fd.append("email", user.email);
            const formdata = fd;
            await axios.post(`${API_URL}/toggle_clock`, formdata);
            if (fd.data.status === "success") fetchFeed(); 
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
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
<<<<<<< HEAD
            fd.append("id", id); fd.append("email", user.email);
            await axios.post("/api/delete_thought", fd);
=======
            fd.append("id", id);
            fd.append("email", user.email);
            const formdata = fd;
            await axios.post(`${API_URL}/delete_thought`, formdata);
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
            fetchFeed();
        } catch (err) { console.error("DELETE_FAILED"); }
    };

    const handleClapBack = async (thoughtId) => {
        if (!replyText.trim()) return;
        try {
            const fd = new FormData();
<<<<<<< HEAD
            fd.append("thought_id", thoughtId); fd.append("email", user.email); fd.append("content", replyText);
            await axios.post("/api/add_clapback", fd);
            setReplyText(""); setActiveReplyId(null);
=======
            fd.append("thought_id", thoughtId);
            fd.append("email", user.email);
            fd.append("content", replyText);
            const formdata = fd;
            await axios.post(`${API_URL}/add_clapback`, formdata);
            setReplyText(""); 
            setActiveReplyId(null); 
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
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
<<<<<<< HEAD
            fd.append("id", replyId); fd.append("email", user.email);
            await axios.post("/api/delete_clapback", fd);
=======
            fd.append("id", replyId);
            fd.append("email", user.email);
            const formdata = fd;
            await axios.post(`${API_URL}/delete_clapback`, formdata);
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
            fetchFeed();
        } catch (err) { console.error("REPLY_DELETE_FAILED"); }
    };

    return (
<<<<<<< HEAD
        <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>
            {/* TAB NAV */}
            <div style={{
                position: 'sticky', top: '60px', zIndex: 100,
                background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div className="container">
                    <div className="d-flex gap-0" style={{ maxWidth: '680px', margin: '0 auto' }}>
                        {[
                            { key: 'spills', label: '💬 SPILLS' },
                            { key: 'products', label: '🛍️ PRODUCTS' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    flex: 1, background: 'none', border: 'none',
                                    color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.3)',
                                    fontWeight: '900', fontSize: '11px', letterSpacing: '2px',
                                    padding: '14px 0', cursor: 'pointer',
                                    borderBottom: activeTab === tab.key ? '2px solid #fff' : '2px solid transparent',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
=======
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
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
                    </div>
                </div>
            </div>

<<<<<<< HEAD
            <div className="container py-4">
                <div style={{ maxWidth: '680px', margin: '0 auto' }}>

                    {/* ── SPILLS TAB ── */}
                    {activeTab === 'spills' && (
                        <>
                            {loading ? (
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: '11px', letterSpacing: '3px', textAlign: 'center', marginTop: '60px' }}>
                                    SYNCING STREAM...
                                </p>
                            ) : thoughts.length === 0 ? (
                                <div style={{ textAlign: 'center', marginTop: '80px' }}>
                                    <p style={{ fontSize: '32px', marginBottom: '12px' }}>💬</p>
                                    <p style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: '11px', letterSpacing: '3px' }}>NO SPILLS YET</p>
                                </div>
                            ) : thoughts.map((t) => (
                                <div key={t.id} className="glass-panel p-4 mb-4" style={{ borderLeft: '3px solid rgba(255,255,255,0.2)' }}>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <Link to={`/profile/${t.user_email}`} className="d-flex align-items-center gap-3 text-decoration-none">
                                            <img
                                                src={`/static/images/${t.profile_pic || 'default.png'}`}
                                                className="rounded-circle"
                                                style={{ width: '40px', height: '40px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23333'/%3E%3Ccircle cx='20' cy='16' r='6' fill='%23666'/%3E%3Cellipse cx='20' cy='34' rx='11' ry='8' fill='%23666'/%3E%3C/svg%3E"; }}
                                                alt=""
                                            />
                                            <div>
                                                <span style={{ color: '#fff', fontWeight: '900', fontSize: '13px', display: 'block' }}>{t.username?.toUpperCase()}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: '700', fontSize: '10px' }}>🤏🏽 {t.clock_count || 0} CLOCKS</span>
                                            </div>
                                        </Link>
                                        <div className="text-end">
                                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                                                {formatTime(t.created_at)}
                                            </span>
                                            {t.user_email === user.email && (
                                                <button onClick={() => deleteThought(t.id)} style={{ background: 'none', border: 'none', color: '#ff4444', fontWeight: '900', fontSize: '10px', cursor: 'pointer', padding: 0 }}>
                                                    DELETE
                                                </button>
                                            )}
                                        </div>
=======
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
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
                                    </div>

                                    <p style={{ color: '#fff', fontWeight: '500', fontSize: '15px', lineHeight: '1.6', marginBottom: t.music_url || t.image_url ? '12px' : '16px' }}>
                                        {t.content}
                                    </p>

                                    {t.music_url && renderMusicPlayer(t.music_url)}
                                    {t.image_url && (
                                        <img src={`/static/images/${t.image_url}`} className="w-100 mb-3" style={{ borderRadius: '12px', maxHeight: '400px', objectFit: 'cover' }} alt="Post" />
                                    )}

                                    <div className="d-flex gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                                        <button onClick={() => toggleClock(t.id)} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: '900', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', padding: 0 }}>
                                            🤏🏽 CLOCK
                                        </button>
                                        <button onClick={() => setActiveReplyId(activeReplyId === t.id ? null : t.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', padding: 0 }}>
                                            💬 CLAP BACK ({(t.replies || []).length})
                                        </button>
                                    </div>

                                    {/* REPLIES WITH PROFILE PICS */}
                                    {(t.replies || []).length > 0 && (
                                        <div style={{ marginTop: '16px', borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: '16px' }}>
                                            {t.replies.map((reply) => (
                                                <div key={reply.id} className="d-flex align-items-start gap-2 mb-3">
                                                    <Link to={`/profile/${reply.user_email}`}>
                                                        <img
                                                            src={`/static/images/${reply.profile_pic || 'default.png'}`}
                                                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}
                                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='14' fill='%23333'/%3E%3Ccircle cx='14' cy='11' r='4' fill='%23666'/%3E%3Cellipse cx='14' cy='24' rx='8' ry='6' fill='%23666'/%3E%3C/svg%3E"; }}
                                                            alt=""
                                                        />
                                                    </Link>
                                                    <div style={{ flex: 1 }}>
                                                        <Link to={`/profile/${reply.user_email}`} style={{ textDecoration: 'none' }}>
                                                            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '900', fontSize: '11px' }}>
                                                                {reply.username?.toUpperCase()}
                                                            </span>
                                                        </Link>
                                                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', margin: '2px 0 0' }}>{reply.reply_content}</p>
                                                    </div>
                                                    {(reply.user_email === user.email || t.user_email === user.email) && (
                                                        <button onClick={() => deleteClapBack(reply.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.6)', fontWeight: '900', fontSize: '10px', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeReplyId === t.id && (
                                        <div className="d-flex gap-2 mt-3">
                                            <input
                                                type="text"
                                                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: '#fff', padding: '8px 16px', fontSize: '13px', outline: 'none' }}
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="REPLY..."
                                            />
                                            <button onClick={() => handleClapBack(t.id)} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '20px', padding: '8px 20px', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                                                SEND
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

<<<<<<< HEAD
                    {/* ── PRODUCTS TAB ── */}
                    {activeTab === 'products' && (
                        <>
                            {productsLoading ? (
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: '11px', letterSpacing: '3px', textAlign: 'center', marginTop: '60px' }}>
                                    LOADING ASSETS...
                                </p>
                            ) : products.length === 0 ? (
                                <div style={{ textAlign: 'center', marginTop: '80px' }}>
                                    <p style={{ fontSize: '32px', marginBottom: '12px' }}>🛍️</p>
                                    <p style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: '11px', letterSpacing: '3px' }}>NO PRODUCTS LISTED</p>
                                </div>
                            ) : (
                                <div className="row g-3">
                                    {products.map((p) => (
                                        <div key={p.id} className="col-6">
                                            <div
                                                className="glass-panel p-0"
                                                style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}
                                                onClick={() => setViewProduct(p)}
                                            >
                                                <img
                                                    src={`/static/images/${p.product_photo}`}
                                                    style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    alt={p.product_name}
                                                />
                                                <div style={{ padding: '12px 14px' }}>
                                                    <p style={{ color: '#fff', fontWeight: '900', fontSize: '12px', margin: '0 0 2px', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {p.product_name?.toUpperCase()}
                                                    </p>
                                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: '11px', margin: '0 0 8px' }}>
                                                        {p.product_description?.substring(0, 30)}
                                                    </p>
                                                    <p style={{ color: '#fff', fontWeight: '900', fontSize: '13px', margin: 0 }}>
                                                        KES {Number(p.product_cost).toLocaleString()}
                                                    </p>
                                                </div>
=======
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
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── FLOATING SPILL BUTTON ── */}
            {activeTab === 'spills' && (
                <button
                    onClick={() => setShowSpillModal(true)}
                    style={{
                        position: 'fixed', bottom: '32px', right: '32px',
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: '#fff', color: '#000', border: 'none',
                        fontWeight: '900', fontSize: '22px', cursor: 'pointer',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                        zIndex: 500, transition: 'transform 0.2s ease',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title="Add Spill"
                >
                    ✏️
                </button>
            )}

            {/* ── SPILL MODAL ── */}
            {showSpillModal && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(8px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowSpillModal(false); }}
                >
                    <div style={{
                        width: '100%', maxWidth: '680px', margin: '0 auto',
                        background: 'rgba(15,15,15,0.98)', borderRadius: '24px 24px 0 0',
                        border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
                        padding: '32px 28px 40px', animation: 'slideUp 0.25s ease',
                    }}>
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h5 style={{ color: '#fff', fontWeight: '900', margin: 0, fontSize: '14px', letterSpacing: '2px' }}>NEW SPILL</h5>
                            <button onClick={() => setShowSpillModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                        </div>

                        <div className="d-flex gap-3 mb-3">
                            <img
                                src={`/static/images/${user.profile_pic || 'default.png'}`}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='18' r='18' fill='%23444'/%3E%3C/svg%3E"; }}
                                alt=""
                            />
                            <textarea
                                style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', fontWeight: '500', resize: 'none', outline: 'none', lineHeight: '1.6', minHeight: '80px' }}
                                placeholder="What's the spill?"
                                value={newThought}
                                onChange={(e) => setNewThought(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {previewUrl && (
                            <div style={{ position: 'relative', marginBottom: '12px' }}>
                                <img src={previewUrl} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px' }} alt="Preview" />
                                <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                            </div>
                        )}

                        {showMusicInput && (
                            <input type="text" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', padding: '10px 14px', fontSize: '13px', outline: 'none', marginBottom: '12px' }}
                                placeholder="PASTE SPOTIFY/YOUTUBE LINK..."
                                value={musicUrl}
                                onChange={(e) => setMusicUrl(e.target.value)}
                            />
                        )}

                        <div className="d-flex justify-content-between align-items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px' }}>
                            <div className="d-flex gap-3">
                                <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
                                <button type="button" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: 0, opacity: 0.6 }} onClick={() => fileInputRef.current.click()}>📸</button>
                                <button type="button" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: 0, opacity: showMusicInput ? 1 : 0.6 }} onClick={() => setShowMusicInput(!showMusicInput)}>🎵</button>
                            </div>
                            <button
                                onClick={handlePostSpill}
                                disabled={posting || (!newThought.trim() && !selectedFile && !musicUrl.trim())}
                                style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '30px', padding: '10px 28px', fontWeight: '900', fontSize: '12px', letterSpacing: '2px', cursor: 'pointer', opacity: posting ? 0.6 : 1 }}
                            >
                                {posting ? 'POSTING...' : 'SPILL IT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PRODUCT QUICK VIEW MODAL ── */}
            {viewProduct && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setViewProduct(null); }}
                >
                    <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', maxWidth: '480px', width: '100%', overflow: 'hidden' }}>
                        <img src={`/static/images/${viewProduct.product_photo}`} style={{ width: '100%', height: '260px', objectFit: 'contain', background: '#000', display: 'block' }} alt={viewProduct.product_name} />
                        <div style={{ padding: '24px 28px 28px' }}>
                            <h3 style={{ color: '#fff', fontWeight: '900', fontSize: '1.4rem', margin: '0 0 6px', letterSpacing: '-0.5px' }}>{viewProduct.product_name}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 16px', lineHeight: '1.6' }}>{viewProduct.product_description}</p>
                            <p style={{ color: '#fff', fontWeight: '900', fontSize: '1.2rem', margin: '0 0 20px' }}>KES {Number(viewProduct.product_cost).toLocaleString()}</p>
                            <div className="d-flex gap-2">
                                <button onClick={() => { navigate('/dashboard'); setViewProduct(null); }} style={{ flex: 1, background: '#fff', color: '#000', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: '900', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer' }}>
                                    VIEW IN SHOP
                                </button>
                                <button onClick={() => setViewProduct(null)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 20px', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                                    CLOSE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
    );
};

export default Feed;
