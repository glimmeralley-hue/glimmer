import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const user = JSON.parse(localStorage.getItem('user') || '{}');
const TODAY = new Date().toISOString().split('T')[0];

// ─── POMODORO ────────────────────────────────────────────────────────────────
const WORK_SECS = 25 * 60;
const BREAK_SECS = 5 * 60;

const StudySection = () => {
    const [mode, setMode] = useState('work');
    const [seconds, setSeconds] = useState(WORK_SECS);
    const [running, setRunning] = useState(false);
    const [sessions, setSessions] = useState(() => {
        const saved = JSON.parse(localStorage.getItem('glimmer_study_today') || '{}');
        return saved.date === TODAY ? saved.sessions : 0;
    });
    const [totalSecs, setTotalSecs] = useState(() => {
        const saved = JSON.parse(localStorage.getItem('glimmer_study_today') || '{}');
        return saved.date === TODAY ? (saved.totalSecs || 0) : 0;
    });
    const [note, setNote] = useState(localStorage.getItem('glimmer_study_note') || '');
    const tickRef = useRef(null);
    const startedRef = useRef(null);

    const saveToday = useCallback((s, t) => {
        localStorage.setItem('glimmer_study_today', JSON.stringify({ date: TODAY, sessions: s, totalSecs: t }));
    }, []);

    useEffect(() => {
        if (running) {
            startedRef.current = Date.now();
            tickRef.current = setInterval(() => {
                setSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(tickRef.current);
                        setRunning(false);
                        if (mode === 'work') {
                            const newSessions = sessions + 1;
                            const elapsed = Math.round((Date.now() - startedRef.current) / 1000);
                            const newTotal = totalSecs + elapsed;
                            setSessions(newSessions);
                            setTotalSecs(newTotal);
                            saveToday(newSessions, newTotal);
                            setMode('break');
                            return BREAK_SECS;
                        } else {
                            setMode('work');
                            return WORK_SECS;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(tickRef.current);
        }
        return () => clearInterval(tickRef.current);
    }, [running]);

    const reset = () => {
        setRunning(false);
        setSeconds(mode === 'work' ? WORK_SECS : BREAK_SECS);
    };

    const switchMode = (m) => {
        setRunning(false);
        setMode(m);
        setSeconds(m === 'work' ? WORK_SECS : BREAK_SECS);
    };

    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    const pct = mode === 'work' ? (seconds / WORK_SECS) * 100 : (seconds / BREAK_SECS) * 100;
    const totalMins = Math.floor(totalSecs / 60);
    const totalHrs = Math.floor(totalMins / 60);
    const remMins = totalMins % 60;

    const circumference = 2 * Math.PI * 88;
    const strokeDash = (pct / 100) * circumference;

    const accent = mode === 'work' ? '#00c853' : '#7c4dff';

    return (
        <div style={{ padding: '40px 48px', maxWidth: '680px' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '4px', fontWeight: '900', marginBottom: '6px' }}>FOCUS TIMER</p>
            <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '1.8rem', letterSpacing: '-1px', marginBottom: '32px' }}>STUDY SESSION</h2>

            {/* Mode toggle */}
            <div className="d-flex gap-2 mb-10" style={{ marginBottom: '40px' }}>
                {['work', 'break'].map(m => (
                    <button
                        key={m}
                        onClick={() => switchMode(m)}
                        style={{ background: mode === m ? accent : 'rgba(255,255,255,0.06)', color: mode === m ? '#000' : 'rgba(255,255,255,0.4)', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        {m === 'work' ? '🧠 FOCUS' : '☕ BREAK'}
                    </button>
                ))}
            </div>

            {/* Circle timer */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                    <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                        <circle
                            cx="100" cy="100" r="88" fill="none"
                            stroke={accent} strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${strokeDash} ${circumference}`}
                            style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.4s ease' }}
                        />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#fff', fontWeight: '900', fontSize: '2.8rem', letterSpacing: '-2px', margin: 0, fontFamily: 'monospace' }}>
                            {mins}:{secs}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: '900', letterSpacing: '3px', margin: '4px 0 0' }}>
                            {mode === 'work' ? 'FOCUS' : 'BREAK'}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="d-flex gap-3 mt-4">
                    <button
                        onClick={reset}
                        style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: '44px', height: '44px', borderRadius: '50%', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}
                    >↺</button>
                    <button
                        onClick={() => setRunning(r => !r)}
                        style={{ background: accent, border: 'none', color: '#000', padding: '0 32px', height: '44px', borderRadius: '22px', fontWeight: '900', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', transition: 'background 0.3s ease', minWidth: '110px' }}
                    >
                        {running ? '⏸ PAUSE' : '▶ START'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="d-flex gap-3 mb-5">
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 20px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '3px', fontWeight: '900', margin: '0 0 6px' }}>SESSIONS TODAY</p>
                    <p style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>{sessions}</p>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 20px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '3px', fontWeight: '900', margin: '0 0 6px' }}>FOCUS TIME</p>
                    <p style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>
                        {totalHrs > 0 ? `${totalHrs}h ${remMins}m` : `${totalMins}m`}
                    </p>
                </div>
            </div>

            {/* Session note */}
            <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '3px', fontWeight: '900', marginBottom: '10px' }}>SESSION NOTES</p>
                <textarea
                    value={note}
                    onChange={(e) => { setNote(e.target.value); localStorage.setItem('glimmer_study_note', e.target.value); }}
                    placeholder="What are you working on today?"
                    rows={4}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontSize: '14px', resize: 'none', outline: 'none', lineHeight: '1.7', boxSizing: 'border-box' }}
                />
            </div>
        </div>
    );
};

// ─── HEALTH ──────────────────────────────────────────────────────────────────
const MOODS = ['😊', '😐', '😔', '😤', '🔥', '😴', '🤒', '💪'];
const WATER_GOAL = 8;

const HealthSection = () => {
    const [log, setLog] = useState({ water: 0, sleep: 7, mood: '😊' });
    const [saved, setSaved] = useState(false);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`/api/health_logs/${user.email}`);
            const logs = res.data || [];
            setHistory(logs);
            const todayLog = logs.find(l => l.date === TODAY);
            if (todayLog) {
                setLog({ water: todayLog.water_glasses, sleep: todayLog.sleep_hours, mood: todayLog.mood });
                setSaved(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await axios.post('/api/save_health_log', {
                user_email: user.email,
                date: TODAY,
                water_glasses: log.water,
                sleep_hours: log.sleep,
                mood: log.mood,
            });
            setSaved(true);
            fetchLogs();
        } catch (e) {
            console.error(e);
        }
    };

    const streak = (() => {
        if (history.length === 0) return 0;
        const dates = history.map(l => l.date).sort().reverse();
        let s = 0;
        let expected = new Date();
        for (const d of dates) {
            const dDate = new Date(d);
            const exp = expected.toISOString().split('T')[0];
            const got = dDate.toISOString().split('T')[0];
            if (got === exp || got === TODAY) { s++; expected.setDate(expected.getDate() - 1); }
            else break;
        }
        return s;
    })();

    return (
        <div style={{ padding: '40px 48px', maxWidth: '680px' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '4px', fontWeight: '900', marginBottom: '6px' }}>DAILY CHECK-IN</p>
            <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '1.8rem', letterSpacing: '-1px', marginBottom: '6px' }}>BODY & HEALTH</h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginBottom: '32px' }}>
                {new Date().toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>

            {/* Streak */}
            <div style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: '14px', padding: '14px 20px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>🔥</span>
                <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '3px', fontWeight: '900', margin: '0 0 2px' }}>CHECK-IN STREAK</p>
                    <p style={{ color: '#00c853', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>{streak} day{streak !== 1 ? 's' : ''} in a row</p>
                </div>
            </div>

            {/* Water */}
            <div style={{ marginBottom: '32px' }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '3px', fontWeight: '900', margin: 0 }}>💧 WATER INTAKE</p>
                    <p style={{ color: log.water >= WATER_GOAL ? '#00c853' : 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '900', margin: 0 }}>
                        {log.water} / {WATER_GOAL} glasses
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    {Array.from({ length: WATER_GOAL }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setSaved(false); setLog(l => ({ ...l, water: i < l.water ? i : i + 1 })); }}
                            style={{
                                width: '44px', height: '52px', borderRadius: '10px', border: 'none', fontSize: '20px',
                                background: i < log.water ? 'rgba(100,180,255,0.2)' : 'rgba(255,255,255,0.04)',
                                cursor: 'pointer', transition: 'all 0.15s ease',
                                transform: i < log.water ? 'scale(1.05)' : 'scale(1)',
                            }}
                        >
                            {i < log.water ? '🥤' : '⬜'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sleep */}
            <div style={{ marginBottom: '32px' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '3px', fontWeight: '900', marginBottom: '12px' }}>😴 SLEEP LAST NIGHT</p>
                <div className="d-flex align-items-center gap-4">
                    <button
                        onClick={() => { setSaved(false); setLog(l => ({ ...l, sleep: Math.max(0, l.sleep - 0.5) })); }}
                        style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontWeight: '900', fontSize: '18px', cursor: 'pointer' }}
                    >−</button>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#fff', fontWeight: '900', fontSize: '2.4rem', letterSpacing: '-1.5px', margin: 0 }}>{log.sleep}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', letterSpacing: '2px', margin: 0 }}>HOURS</p>
                    </div>
                    <button
                        onClick={() => { setSaved(false); setLog(l => ({ ...l, sleep: Math.min(24, l.sleep + 0.5) })); }}
                        style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontWeight: '900', fontSize: '18px', cursor: 'pointer' }}
                    >+</button>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (log.sleep / 10) * 100)}%`, height: '100%', background: log.sleep >= 7 ? '#00c853' : log.sleep >= 5 ? '#ffc107' : '#ff5252', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                    </div>
                </div>
            </div>

            {/* Mood */}
            <div style={{ marginBottom: '36px' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '3px', fontWeight: '900', marginBottom: '12px' }}>TODAY'S MOOD</p>
                <div className="d-flex gap-2 flex-wrap">
                    {MOODS.map(m => (
                        <button
                            key={m}
                            onClick={() => { setSaved(false); setLog(l => ({ ...l, mood: m })); }}
                            style={{ fontSize: '24px', background: log.mood === m ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: log.mood === m ? '1.5px solid rgba(255,255,255,0.3)' : '1.5px solid transparent', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', transition: 'all 0.15s ease', transform: log.mood === m ? 'scale(1.15)' : 'scale(1)' }}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSave}
                style={{ background: saved ? 'rgba(0,200,83,0.15)' : '#fff', color: saved ? '#00c853' : '#000', border: saved ? '1px solid rgba(0,200,83,0.3)' : 'none', padding: '14px 36px', borderRadius: '30px', fontWeight: '900', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
                {saved ? '✓ LOGGED FOR TODAY' : 'SAVE TODAY\'S LOG'}
            </button>

            {/* History */}
            {history.length > 1 && (
                <div style={{ marginTop: '40px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '3px', fontWeight: '900', marginBottom: '16px' }}>RECENT LOGS</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {history.slice(0, 7).map(l => (
                            <div key={l.date} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', margin: 0, minWidth: '80px' }}>{l.date}</p>
                                <span style={{ fontSize: '16px' }}>{l.mood}</span>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>💧 {l.water_glasses} · 😴 {l.sleep_hours}h</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── AFFIRMATIONS ─────────────────────────────────────────────────────────────
const AffirmationsSection = () => {
    const [affirmations, setAffirmations] = useState([]);
    const [newText, setNewText] = useState('');
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [featured, setFeatured] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchAffirmations = async () => {
        try {
            const res = await axios.get(`/api/affirmations/${user.email}`);
            const data = res.data || [];
            setAffirmations(data);
            if (data.length > 0 && !featured) {
                const todayKey = `glimmer_affirmation_featured_${TODAY}`;
                const saved = localStorage.getItem(todayKey);
                const pick = saved ? data.find(a => String(a.id) === saved) : null;
                setFeatured(pick || data[Math.floor(Math.random() * data.length)]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAffirmations();
    }, []);

    const handleAdd = async () => {
        if (!newText.trim()) return;
        setSaving(true);
        try {
            await axios.post('/api/add_affirmation', { user_email: user.email, content: newText.trim() });
            setNewText('');
            setAdding(false);
            await fetchAffirmations();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/delete_affirmation/${id}`, { data: { user_email: user.email } });
            if (featured?.id === id) setFeatured(null);
            await fetchAffirmations();
        } catch (e) {
            console.error(e);
        }
    };

    const setAsToday = (a) => {
        setFeatured(a);
        localStorage.setItem(`glimmer_affirmation_featured_${TODAY}`, String(a.id));
    };

    const DEFAULTS = [
        'I am capable of achieving anything I set my mind to.',
        'Every day I grow stronger and wiser.',
        'I deserve peace, love, and all good things.',
        'My potential is limitless.',
        'I choose progress over perfection.',
    ];

    return (
        <div style={{ padding: '40px 48px', maxWidth: '680px' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '4px', fontWeight: '900', marginBottom: '6px' }}>SPEAK IT INTO EXISTENCE</p>
            <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '1.8rem', letterSpacing: '-1px', marginBottom: '32px' }}>AFFIRMATIONS</h2>

            {/* Featured card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(0,200,83,0.12) 0%, rgba(0,200,83,0.03) 100%)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: '20px', padding: '36px 32px', marginBottom: '32px', position: 'relative', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', letterSpacing: '3px', fontWeight: '900', marginBottom: '14px' }}>TODAY'S AFFIRMATION</p>
                {loading ? (
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '900', margin: 0, fontSize: '11px' }}>LOADING...</p>
                ) : featured ? (
                    <p style={{ color: '#fff', fontWeight: '700', fontSize: '1.3rem', lineHeight: '1.6', margin: 0, letterSpacing: '-0.3px' }}>
                        "{featured.content}"
                    </p>
                ) : (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '700', fontSize: '1.1rem', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
                        "{DEFAULTS[new Date().getDay() % DEFAULTS.length]}"
                    </p>
                )}
                <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '28px', opacity: 0.15 }}>✨</div>
            </div>

            {/* Add affirmation */}
            {adding ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
                    <textarea
                        autoFocus
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Write your affirmation..."
                        rows={3}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', resize: 'none', outline: 'none', lineHeight: '1.7', boxSizing: 'border-box', marginBottom: '12px' }}
                    />
                    <div className="d-flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={saving || !newText.trim()}
                            style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 24px', borderRadius: '20px', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer' }}
                        >
                            {saving ? 'SAVING...' : 'SAVE'}
                        </button>
                        <button
                            onClick={() => { setAdding(false); setNewText(''); }}
                            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '10px 20px', borderRadius: '20px', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer' }}
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setAdding(true)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 24px', borderRadius: '20px', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer', marginBottom: '28px' }}
                >
                    + WRITE NEW AFFIRMATION
                </button>
            )}

            {/* All affirmations */}
            {affirmations.length > 0 && (
                <>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '3px', fontWeight: '900', marginBottom: '14px' }}>ALL AFFIRMATIONS ({affirmations.length})</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {affirmations.map(a => (
                            <div
                                key={a.id}
                                style={{ background: featured?.id === a.id ? 'rgba(0,200,83,0.08)' : 'rgba(255,255,255,0.03)', border: featured?.id === a.id ? '1px solid rgba(0,200,83,0.2)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                            >
                                <p style={{ color: '#fff', fontSize: '13px', margin: 0, flex: 1, lineHeight: '1.6', opacity: 0.85 }}>"{a.content}"</p>
                                <div className="d-flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => setAsToday(a)}
                                        title="Set as today's affirmation"
                                        style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', opacity: featured?.id === a.id ? 1 : 0.35, transition: 'opacity 0.2s' }}
                                    >✨</button>
                                    <button
                                        onClick={() => handleDelete(a.id)}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.5)', fontSize: '12px', cursor: 'pointer', fontWeight: '900' }}
                                    >✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {affirmations.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p style={{ fontSize: '32px', marginBottom: '12px' }}>🌱</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: '11px', letterSpacing: '3px' }}>NO AFFIRMATIONS YET</p>
                    <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>Write your first one above</p>
                </div>
            )}
        </div>
    );
};

// ─── MAIN HUB ─────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'study', label: '📚 STUDY', icon: '📚' },
    { id: 'health', label: '💪 HEALTH', icon: '💪' },
    { id: 'affirmations', label: '✨ AFFIRMATIONS', icon: '✨' },
];

const SelfGrowth = () => {
    const [tab, setTab] = useState('study');
    const submode = localStorage.getItem('glimmer_submode') || 'free';

    return (
        <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '32px 48px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="d-flex align-items-end justify-content-between mb-0">
                    <div>
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', letterSpacing: '4px', fontWeight: '900', margin: '0 0 4px' }}>
                            SELF GROWTH · {submode.toUpperCase()}
                        </p>
                        <h1 style={{ color: '#fff', fontWeight: '900', fontSize: '1.8rem', letterSpacing: '-1.5px', margin: 0 }}>YOUR GROWTH HUB</h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '16px' }}>
                        <span style={{ fontSize: '20px' }}>🌱</span>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: '900', letterSpacing: '2px', margin: 0 }}>
                            {new Date().toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Tab bar */}
                <div className="d-flex gap-0" style={{ marginTop: '24px' }}>
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            style={{
                                background: 'none', border: 'none',
                                color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.3)',
                                fontWeight: '900', fontSize: '11px', letterSpacing: '2px',
                                padding: '12px 24px', cursor: 'pointer',
                                borderBottom: tab === t.id ? '2px solid #00c853' : '2px solid transparent',
                                marginBottom: '-1px', transition: 'all 0.2s ease',
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {tab === 'study' && <StudySection />}
                {tab === 'health' && <HealthSection />}
                {tab === 'affirmations' && <AffirmationsSection />}
            </div>
        </div>
    );
};

export default SelfGrowth;
