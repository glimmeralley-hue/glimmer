import React, { useState, useEffect } from 'react';

const THEMES = [
    {
        id: 'void',
        name: 'VOID',
        desc: 'Pure black. No distractions.',
        bg: '#000000',
        glass: 'rgba(20,20,20,0.95)',
        border: 'rgba(255,255,255,0.3)',
        accent: '#ffffff',
        accentLabel: '#000',
    },
    {
        id: 'midnight',
        name: 'MIDNIGHT',
        desc: 'Deep indigo. Late night energy.',
        bg: '#05050f',
        glass: 'rgba(10,8,28,0.96)',
        border: 'rgba(120,100,255,0.35)',
        accent: '#9b8ff7',
        accentLabel: '#fff',
    },
    {
        id: 'forest',
        name: 'FOREST',
        desc: 'Dark green. Calm and grounded.',
        bg: '#030e06',
        glass: 'rgba(4,14,7,0.96)',
        border: 'rgba(0,200,80,0.3)',
        accent: '#00c853',
        accentLabel: '#000',
    },
    {
        id: 'rose',
        name: 'ROSE',
        desc: 'Deep pink. Bold and expressive.',
        bg: '#0f0408',
        glass: 'rgba(18,4,10,0.96)',
        border: 'rgba(255,80,130,0.3)',
        accent: '#ff4d8d',
        accentLabel: '#fff',
    },
    {
        id: 'ocean',
        name: 'OCEAN',
        desc: 'Dark teal. Cool and focused.',
        bg: '#020a10',
        glass: 'rgba(2,12,22,0.96)',
        border: 'rgba(0,200,255,0.25)',
        accent: '#00bcd4',
        accentLabel: '#000',
    },
];

const Settings = () => {
    const [activeTheme, setActiveTheme] = useState(() => {
        return localStorage.getItem('glimmer_theme') || 'void';
    });

    const applyTheme = (themeId) => {
        setActiveTheme(themeId);
        localStorage.setItem('glimmer_theme', themeId);
        if (themeId === 'void') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', themeId);
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem('glimmer_theme') || 'void';
        if (saved !== 'void') {
            document.documentElement.setAttribute('data-theme', saved);
        }
    }, []);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px', paddingBottom: '60px' }}>
            {/* Header */}
            <div className="mb-5">
                <p className="text-white fw-black mb-1" style={{ fontSize: '11px', letterSpacing: '4px', opacity: 0.4 }}>GLIMMER</p>
                <h1 className="fw-black text-white mb-2" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>SETTINGS</h1>
                <p className="text-white fw-medium" style={{ opacity: 0.4, fontSize: '13px', letterSpacing: '2px' }}>
                    PERSONALISE YOUR EXPERIENCE
                </p>
            </div>

            {/* THEMES */}
            <div className="mb-5">
                <p className="text-white fw-black mb-4" style={{ fontSize: '11px', letterSpacing: '4px', opacity: 0.5, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    THEMES
                </p>
                <div className="row g-3">
                    {THEMES.map((theme) => {
                        const isActive = activeTheme === theme.id;
                        return (
                            <div key={theme.id} className="col-6 col-md-4">
                                <div
                                    onClick={() => applyTheme(theme.id)}
                                    style={{
                                        cursor: 'pointer',
                                        border: isActive ? `2px solid ${theme.accent}` : '2px solid rgba(255,255,255,0.08)',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                                        transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = isActive ? 'scale(1.02)' : 'scale(1)'}
                                >
                                    {/* Theme Preview */}
                                    <div style={{ background: theme.bg, padding: '20px 16px', minHeight: '90px', position: 'relative' }}>
                                        {/* Mini glass panel mock */}
                                        <div style={{
                                            background: theme.glass,
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: '8px',
                                            padding: '8px 10px',
                                            marginBottom: '8px',
                                        }}>
                                            <div style={{ width: '60%', height: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '3px', marginBottom: '4px' }} />
                                            <div style={{ width: '40%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px' }} />
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            background: theme.accent,
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                        }}>
                                            <div style={{ width: '30px', height: '5px', background: theme.accentLabel === '#000' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', borderRadius: '3px' }} />
                                        </div>
                                        {isActive && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                background: theme.accent,
                                                color: theme.accentLabel,
                                                fontSize: '9px',
                                                fontWeight: '900',
                                                padding: '2px 6px',
                                                borderRadius: '20px',
                                                letterSpacing: '1px',
                                            }}>
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    {/* Theme Label */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px' }}>
                                        <p className="mb-0 fw-black text-white" style={{ fontSize: '11px', letterSpacing: '2px' }}>{theme.name}</p>
                                        <p className="mb-0 text-white fw-medium" style={{ fontSize: '10px', opacity: 0.4 }}>{theme.desc}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODE */}
            <div className="mb-5">
                <p className="text-white fw-black mb-4" style={{ fontSize: '11px', letterSpacing: '4px', opacity: 0.5, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    APP MODE
                </p>
                <div className="glass-panel p-4 d-flex align-items-center justify-content-between">
                    <div>
                        <p className="mb-0 fw-black text-white" style={{ fontSize: '13px', letterSpacing: '1px' }}>
                            {(() => {
                                const mode = localStorage.getItem('glimmer_mode');
                                const sub = localStorage.getItem('glimmer_submode');
                                if (!mode) return 'NOT SET';
                                if (mode === 'selfgrowth') return `SELF GROWTH · ${(sub || 'free').toUpperCase()}`;
                                return mode.toUpperCase();
                            })()}
                        </p>
                        <p className="mb-0 text-white fw-medium" style={{ opacity: 0.4, fontSize: '11px' }}>Current experience mode</p>
                    </div>
                    <button
                        onClick={() => { localStorage.removeItem('glimmer_mode'); localStorage.removeItem('glimmer_submode'); window.location.href = '/booths'; }}
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer' }}
                    >
                        CHANGE MODE
                    </button>
                </div>
            </div>

            {/* APP INFO */}
            <div>
                <p className="text-white fw-black mb-4" style={{ fontSize: '11px', letterSpacing: '4px', opacity: 0.5, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    ABOUT
                </p>
                <div className="glass-panel p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-bold text-white" style={{ fontSize: '12px', letterSpacing: '2px' }}>PLATFORM</span>
                        <span className="text-white fw-black" style={{ opacity: 0.4, fontSize: '12px' }}>GLIMMER v1.0</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-bold text-white" style={{ fontSize: '12px', letterSpacing: '2px' }}>DATABASE</span>
                        <span className="text-white fw-black" style={{ opacity: 0.4, fontSize: '12px' }}>SQLite (Live)</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-bold text-white" style={{ fontSize: '12px', letterSpacing: '2px' }}>SERVER</span>
                        <span className="text-white fw-black" style={{ opacity: 0.4, fontSize: '12px' }}>Flask + React</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-white" style={{ fontSize: '12px', letterSpacing: '2px' }}>PAYMENTS</span>
                        <span className="text-white fw-black" style={{ opacity: 0.4, fontSize: '12px' }}>M-Pesa STK Push</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
