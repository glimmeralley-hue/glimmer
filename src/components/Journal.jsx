import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GestureLock, { hasGestureLock, isJournalUnlocked, lockJournal, clearGestureLock } from './GestureLock';

const MOODS = ['✨', '😊', '😔', '😤', '💭', '🔥', '❤️', '🌙', '😂', '🫶'];

const Journal = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ title: '', content: '', mood: '✨' });
    const [saving, setSaving] = useState(false);

    const [lockState, setLockState] = useState(() => {
        if (hasGestureLock() && !isJournalUnlocked()) return 'locked';
        return 'open';
    });
    const [showSetup, setShowSetup] = useState(false);

    const fetchEntries = async () => {
        try {
            const res = await axios.get(`/api/get_journals/${user.email}`);
            setEntries(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.email && lockState === 'open') fetchEntries();
    }, [lockState]);

    const startNew = () => {
        setSelected(null);
        setForm({ title: '', content: '', mood: '✨' });
        setIsEditing(true);
    };

    const openEntry = (entry) => {
        setSelected(entry);
        setForm({ title: entry.title, content: entry.content, mood: entry.mood });
        setIsEditing(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) return;
        setSaving(true);
        try {
            if (selected) {
                await axios.put(`/api/update_journal/${selected.id}`, { ...form, user_email: user.email });
            } else {
                await axios.post('/api/add_journal', { ...form, user_email: user.email });
            }
            await fetchEntries();
            setIsEditing(false);
            setSelected(null);
            setForm({ title: '', content: '', mood: '✨' });
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await axios.delete(`/api/delete_journal/${id}`, { data: { user_email: user.email } });
            await fetchEntries();
            setSelected(null);
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleLockNow = () => {
        lockJournal();
        setLockState('locked');
    };

    const handleEnableLock = () => setShowSetup(true);

    const handleDisableLock = () => {
        if (window.confirm('Remove gesture lock from your journal?')) {
            clearGestureLock();
            setLockState('open');
        }
    };

    const formatDate = (str) => {
        if (!str) return '';
        const d = new Date(str.replace(' ', 'T') + 'Z');
        return d.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (lockState === 'locked') {
        return (
            <GestureLock
                mode="verify"
                onUnlock={() => setLockState('open')}
            />
        );
    }

    if (showSetup) {
        return (
            <GestureLock
                mode="setup"
                onSetup={() => { setShowSetup(false); setLockState('open'); }}
                onCancel={() => setShowSetup(false)}
            />
        );
    }

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', overflow: 'hidden' }}>
            {/* LEFT SIDEBAR */}
            <div style={{
                width: '300px', minWidth: '300px',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column',
                background: 'rgba(255,255,255,0.01)',
            }}>
                {/* Header */}
                <div className="p-4 border-bottom border-white border-opacity-10">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                            <p className="mb-0 fw-black text-white" style={{ fontSize: '10px', letterSpacing: '3px', opacity: 0.4 }}>PRIVATE</p>
                            <h5 className="mb-0 fw-black text-white" style={{ letterSpacing: '-0.5px' }}>JOURNAL</h5>
                        </div>
                        <button
                            onClick={startNew}
                            className="btn btn-sm fw-black"
                            style={{ background: '#fff', color: '#000', fontSize: '11px', borderRadius: '8px', padding: '6px 12px' }}
                        >
                            + NEW
                        </button>
                    </div>

                    {/* Lock controls */}
                    <div className="d-flex gap-2 flex-wrap">
                        {hasGestureLock() ? (
                            <>
                                <button
                                    onClick={handleLockNow}
                                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '9px', fontWeight: '900', letterSpacing: '1.5px', padding: '5px 10px', borderRadius: '20px', cursor: 'pointer' }}
                                >
                                    🔒 LOCK NOW
                                </button>
                                <button
                                    onClick={handleDisableLock}
                                    style={{ background: 'transparent', border: '1px solid rgba(255,50,50,0.2)', color: 'rgba(255,100,100,0.7)', fontSize: '9px', fontWeight: '900', letterSpacing: '1.5px', padding: '5px 10px', borderRadius: '20px', cursor: 'pointer' }}
                                >
                                    REMOVE LOCK
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleEnableLock}
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: '900', letterSpacing: '1.5px', padding: '5px 10px', borderRadius: '20px', cursor: 'pointer' }}
                            >
                                🔓 SET GESTURE LOCK
                            </button>
                        )}
                    </div>
                </div>

                {/* Entry list */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <p className="text-white p-4 fw-black" style={{ opacity: 0.3, fontSize: '11px', letterSpacing: '2px' }}>LOADING...</p>
                    ) : entries.length === 0 ? (
                        <div className="p-4 text-center">
                            <p className="text-white fw-black" style={{ opacity: 0.2, fontSize: '11px', letterSpacing: '2px' }}>NO ENTRIES YET</p>
                            <p className="text-white fw-medium" style={{ opacity: 0.15, fontSize: '10px' }}>HIT + NEW TO START</p>
                        </div>
                    ) : entries.map((entry) => (
                        <div
                            key={entry.id}
                            onClick={() => openEntry(entry)}
                            style={{
                                padding: '16px 20px', cursor: 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                background: selected?.id === entry.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                                transition: 'background 0.15s ease',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.currentTarget.style.background = selected?.id === entry.id ? 'rgba(255,255,255,0.06)' : 'transparent'}
                        >
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span style={{ fontSize: '14px' }}>{entry.mood}</span>
                                <p className="mb-0 fw-black text-white" style={{ fontSize: '12px', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {entry.title}
                                </p>
                            </div>
                            <p className="mb-0 text-white fw-medium" style={{ fontSize: '10px', opacity: 0.3, letterSpacing: '1px' }}>
                                {formatDate(entry.created_at)}
                            </p>
                            <p className="mb-0 text-white fw-medium mt-1" style={{ fontSize: '11px', opacity: 0.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {entry.content.substring(0, 60)}...
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {isEditing ? (
                    <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 48px', overflow: 'auto' }}>
                        <div className="d-flex align-items-center justify-content-between mb-5">
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); setSelected(null); }}
                                className="btn p-0 text-white fw-black"
                                style={{ fontSize: '12px', letterSpacing: '2px', opacity: 0.4 }}
                            >
                                ← CANCEL
                            </button>
                            <button
                                type="submit"
                                className="btn fw-black px-4 py-2"
                                style={{ background: '#fff', color: '#000', fontSize: '12px', letterSpacing: '2px', borderRadius: '8px' }}
                                disabled={saving}
                            >
                                {saving ? 'SAVING...' : selected ? 'UPDATE' : 'SAVE'}
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-white fw-black mb-2" style={{ fontSize: '10px', letterSpacing: '3px', opacity: 0.4 }}>MOOD</p>
                            <div className="d-flex gap-2 flex-wrap">
                                {MOODS.map(m => (
                                    <button
                                        key={m} type="button"
                                        onClick={() => setForm(f => ({ ...f, mood: m }))}
                                        style={{
                                            fontSize: '20px',
                                            background: form.mood === m ? 'rgba(255,255,255,0.15)' : 'transparent',
                                            border: form.mood === m ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                                            borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <input
                            type="text"
                            className="form-control border-0 bg-transparent fw-black text-white mb-3 px-0"
                            placeholder="TITLE..."
                            value={form.title}
                            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                            style={{ fontSize: '1.8rem', letterSpacing: '-1px', boxShadow: 'none' }}
                        />

                        <textarea
                            className="form-control border-0 bg-transparent text-white px-0"
                            placeholder="Write your thoughts here..."
                            rows={12}
                            value={form.content}
                            onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                            style={{ fontSize: '15px', lineHeight: '1.8', resize: 'none', boxShadow: 'none', flex: 1 }}
                        />
                    </form>
                ) : selected ? (
                    <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
                        <div className="d-flex align-items-center justify-content-between mb-5">
                            <button
                                onClick={() => { setSelected(null); setIsEditing(false); }}
                                className="btn p-0 text-white fw-black"
                                style={{ fontSize: '12px', letterSpacing: '2px', opacity: 0.4 }}
                            >
                                ← BACK
                            </button>
                            <div className="d-flex gap-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn fw-black px-3 py-2"
                                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', letterSpacing: '2px', borderRadius: '8px' }}
                                >
                                    EDIT
                                </button>
                                <button
                                    onClick={() => handleDelete(selected.id)}
                                    className="btn fw-black px-3 py-2"
                                    style={{ background: 'rgba(255,50,50,0.15)', color: '#ff6b6b', fontSize: '11px', letterSpacing: '2px', borderRadius: '8px', border: '1px solid rgba(255,50,50,0.2)' }}
                                >
                                    DELETE
                                </button>
                            </div>
                        </div>
                        <div className="mb-2" style={{ fontSize: '28px' }}>{selected.mood}</div>
                        <p className="text-white fw-black mb-1" style={{ fontSize: '10px', letterSpacing: '3px', opacity: 0.3 }}>
                            {formatDate(selected.created_at)}
                        </p>
                        <h2 className="fw-black text-white mb-4" style={{ fontSize: '2rem', letterSpacing: '-1px', lineHeight: 1.2 }}>
                            {selected.title}
                        </h2>
                        <p className="text-white fw-medium" style={{ fontSize: '15px', lineHeight: '1.9', opacity: 0.75, whiteSpace: 'pre-wrap' }}>
                            {selected.content}
                        </p>
                    </div>
                ) : (
                    <div className="d-flex align-items-center justify-content-center h-100">
                        <div className="text-center">
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📓</div>
                            <p className="fw-black text-white mb-2" style={{ fontSize: '11px', letterSpacing: '4px', opacity: 0.3 }}>YOUR JOURNAL</p>
                            <p className="fw-medium text-white mb-4" style={{ opacity: 0.2, fontSize: '13px' }}>Select an entry or create a new one</p>
                            <button
                                onClick={startNew}
                                className="btn fw-black px-4 py-3"
                                style={{ background: '#fff', color: '#000', fontSize: '11px', letterSpacing: '3px', borderRadius: '10px' }}
                            >
                                + NEW ENTRY
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Journal;
