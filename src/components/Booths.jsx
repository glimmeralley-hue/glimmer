import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CARDS = [
    {
        id: 'commercial',
        icon: '💼',
        name: 'COMMERCIAL',
        tagline: 'Built for business.',
        desc: 'List products, manage your marketplace, message buyers, and close deals — all in one place.',
        features: ['🛍️ Product Marketplace', '💬 Direct Messages', '🛒 Shopping Cart', '➕ List Products', '📊 Sales Overview'],
        gradient: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        accent: '#ffffff',
        home: '/dashboard',
    },
    {
        id: 'personal',
        icon: '🌟',
        name: 'PERSONAL',
        tagline: 'Stay connected.',
        desc: 'Explore the social feed, share your thoughts, journal privately, shop, and stay in the loop.',
        features: ['📰 Social Feed (Spills)', '💬 Direct Messages', '📓 Private Journal', '🛍️ Shop & Cart', '🌐 Community'],
        gradient: 'linear-gradient(135deg, rgba(155,143,247,0.12) 0%, rgba(155,143,247,0.03) 100%)',
        accent: '#9b8ff7',
        home: '/feed',
    },
    {
        id: 'selfgrowth',
        icon: '🌱',
        name: 'SELF GROWTH',
        tagline: 'Focus on you.',
        desc: 'Choose your intensity level. Tools for studying, journaling, tracking health, and daily affirmations.',
        features: ['📓 Private Journal', '📚 Study Toolkit', '💪 Body & Health', '🌅 Daily Affirmations', '📈 Progress Tracker'],
        gradient: 'linear-gradient(135deg, rgba(0,200,80,0.1) 0%, rgba(0,200,80,0.02) 100%)',
        accent: '#00c853',
        home: null,
        hasModes: true,
    },
];

const SUBMODES = [
    {
        id: 'restricted',
        icon: '🔒',
        name: 'RESTRICTED',
        tagline: 'Deep focus. No distractions.',
        desc: 'Study tools, journal, affirmations, and health tracking. Social features are completely off.',
        features: ['📚 Study + Pomodoro Timer', '📓 Journal with Calendar', '🌅 Daily Affirmations', '💪 Body & Health Section', '📈 Progress Tracker'],
        home: '/journal',
    },
    {
        id: 'free',
        icon: '✨',
        name: 'FREE',
        tagline: 'Balanced growth.',
        desc: 'All the focus tools, with a glimpse into the social world when you need a break.',
        features: ['📓 Journal with Calendar', '🌅 Daily Affirmations', '💪 Body & Health Section', '📈 Progress Tracker', '💬 Messages Sidebar', '📰 Feed Sidebar'],
        home: '/journal',
    },
];

const Booths = () => {
    const navigate = useNavigate();
    const [activeIdx, setActiveIdx] = useState(0);
    const [showSubmode, setShowSubmode] = useState(false);
    const [submodeIdx, setSubmodeIdx] = useState(0);
    const [showFinal, setShowFinal] = useState(false);

    const totalCards = CARDS.length;

    const handleSelect = (card) => {
        if (card.hasModes) {
            setShowSubmode(true);
        } else {
            localStorage.setItem('glimmer_mode', card.id);
            setShowFinal(true);
        }
    };

    const handleSubmodeSelect = (submode) => {
        localStorage.setItem('glimmer_mode', 'selfgrowth');
        localStorage.setItem('glimmer_submode', submode.id);
        setShowSubmode(false);
        setShowFinal(true);
    };

    const handleEnter = () => {
        const mode = localStorage.getItem('glimmer_mode');
        const submode = localStorage.getItem('glimmer_submode');
        if (mode === 'commercial') navigate('/dashboard');
        else if (mode === 'personal') navigate('/feed');
        else if (mode === 'selfgrowth') navigate('/selfgrowth');
        else navigate('/dashboard');
    };

    const goNext = () => setActiveIdx(i => Math.min(i + 1, totalCards - 1));
    const goPrev = () => setActiveIdx(i => Math.max(i - 1, 0));

    if (showFinal) {
        const mode = localStorage.getItem('glimmer_mode');
        const submode = localStorage.getItem('glimmer_submode');
        const modeName = mode === 'commercial' ? 'COMMERCIAL' : mode === 'personal' ? 'PERSONAL' : `SELF GROWTH · ${(submode || 'free').toUpperCase()}`;
        return (
            <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{ textAlign: 'center', maxWidth: '480px' }}>
                    <div style={{ fontSize: '56px', marginBottom: '24px' }}>✅</div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '4px', fontWeight: '900', marginBottom: '8px' }}>
                        MODE SELECTED
                    </p>
                    <h1 style={{ color: '#fff', fontWeight: '900', fontSize: '2.5rem', letterSpacing: '-2px', marginBottom: '16px' }}>
                        {modeName}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.7', marginBottom: '40px' }}>
                        You can always switch modes from the <strong style={{ color: '#fff' }}>Settings</strong> page. Glimmer adapts to you.
                    </p>
                    <button
                        onClick={handleEnter}
                        style={{
                            background: '#fff', color: '#000', border: 'none',
                            padding: '18px 60px', fontWeight: '900', fontSize: '13px',
                            letterSpacing: '3px', borderRadius: '50px', cursor: 'pointer',
                            transition: 'transform 0.2s ease',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        ENTER GLIMMER →
                    </button>
                </div>
            </div>
        );
    }

    if (showSubmode) {
        return (
            <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
                <div style={{ padding: '40px 40px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => setShowSubmode(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer' }}>
                        ← BACK
                    </button>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '3px', fontWeight: '900', margin: 0 }}>SELF GROWTH · CHOOSE MODE</p>
                    <div style={{ width: '60px' }} />
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '0 40px' }}>
                    {SUBMODES.map((sub) => (
                        <div
                            key={sub.id}
                            onClick={() => handleSubmodeSelect(sub)}
                            style={{
                                flex: 1, maxWidth: '340px', background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
                                padding: '40px 32px', cursor: 'pointer', transition: 'all 0.25s ease',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            <div style={{ fontSize: '40px', marginBottom: '16px' }}>{sub.icon}</div>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '3px', fontWeight: '900', margin: '0 0 6px' }}>MODE</p>
                            <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '1.6rem', letterSpacing: '-1px', margin: '0 0 8px' }}>{sub.name}</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '700', margin: '0 0 24px' }}>{sub.tagline}</p>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.7', margin: '0 0 24px' }}>{sub.desc}</p>
                            <div>
                                {sub.features.map((f, i) => (
                                    <div key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '8px' }}>{f}</div>
                                ))}
                            </div>
                            <button style={{ marginTop: '24px', background: '#fff', color: '#000', border: 'none', padding: '12px 28px', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', borderRadius: '30px', cursor: 'pointer', width: '100%' }}>
                                SELECT {sub.name}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{ padding: '36px 40px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '1.4rem', letterSpacing: '-1px', margin: 0 }}>GLIMMER</h2>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', letterSpacing: '3px', fontWeight: '900', margin: 0 }}>CHOOSE YOUR EXPERIENCE</p>
                <div style={{ width: '80px' }} />
            </div>

            {/* Card carousel */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex', width: `${totalCards * 100}%`,
                    transform: `translateX(-${activeIdx * (100 / totalCards)}%)`,
                    transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                    height: '100%',
                    alignItems: 'center',
                }}>
                    {CARDS.map((card, idx) => (
                        <div key={card.id} style={{
                            width: `${100 / totalCards}%`, height: '100%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: '0 40px',
                        }}>
                            <div style={{
                                background: card.gradient, border: `1px solid ${card.accent}22`,
                                borderRadius: '28px', padding: '52px 48px', maxWidth: '480px',
                                width: '100%', position: 'relative', overflow: 'hidden',
                                boxShadow: `0 0 80px ${card.accent}10`,
                                transition: 'all 0.3s ease',
                            }}>
                                {/* Accent glow */}
                                <div style={{
                                    position: 'absolute', top: -60, right: -60, width: '200px', height: '200px',
                                    borderRadius: '50%', background: card.accent, opacity: 0.04, filter: 'blur(40px)',
                                    pointerEvents: 'none',
                                }} />

                                <div style={{ fontSize: '44px', marginBottom: '20px' }}>{card.icon}</div>
                                <p style={{ color: card.accent, fontSize: '10px', letterSpacing: '4px', fontWeight: '900', margin: '0 0 6px', opacity: 0.8 }}>
                                    BOOTH {idx + 1} OF {totalCards}
                                </p>
                                <h1 style={{ color: '#fff', fontWeight: '900', fontSize: '2.2rem', letterSpacing: '-1.5px', margin: '0 0 8px' }}>
                                    {card.name}
                                </h1>
                                <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '700', fontSize: '13px', margin: '0 0 16px' }}>
                                    {card.tagline}
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: '1.75', margin: '0 0 28px' }}>
                                    {card.desc}
                                </p>

                                <div style={{ marginBottom: '32px' }}>
                                    {card.features.map((f, fi) => (
                                        <div key={fi} style={{
                                            color: 'rgba(255,255,255,0.65)', fontSize: '11px', fontWeight: '800',
                                            letterSpacing: '0.5px', marginBottom: '10px',
                                            paddingLeft: '0',
                                        }}>{f}</div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleSelect(card)}
                                    style={{
                                        background: card.accent, color: card.id === 'personal' ? '#fff' : '#000',
                                        border: 'none', padding: '15px 0', fontWeight: '900',
                                        fontSize: '11px', letterSpacing: '3px', borderRadius: '40px',
                                        cursor: 'pointer', width: '100%', transition: 'transform 0.2s ease',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {card.hasModes ? 'CHOOSE MODE →' : `ENTER AS ${card.name} →`}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom nav */}
            <div style={{ padding: '20px 40px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                    onClick={goPrev}
                    disabled={activeIdx === 0}
                    style={{
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', width: '48px', height: '48px', borderRadius: '50%',
                        fontWeight: '900', fontSize: '16px', cursor: activeIdx === 0 ? 'not-allowed' : 'pointer',
                        opacity: activeIdx === 0 ? 0.3 : 1, transition: 'all 0.2s ease',
                    }}
                >←</button>

                {/* Dots */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {CARDS.map((_, i) => (
                        <div
                            key={i} onClick={() => setActiveIdx(i)}
                            style={{
                                width: activeIdx === i ? '24px' : '8px', height: '8px',
                                borderRadius: '4px', background: activeIdx === i ? '#fff' : 'rgba(255,255,255,0.2)',
                                cursor: 'pointer', transition: 'all 0.3s ease',
                            }}
                        />
                    ))}
                </div>

                <button
                    onClick={goNext}
                    disabled={activeIdx === totalCards - 1}
                    style={{
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', width: '48px', height: '48px', borderRadius: '50%',
                        fontWeight: '900', fontSize: '16px', cursor: activeIdx === totalCards - 1 ? 'not-allowed' : 'pointer',
                        opacity: activeIdx === totalCards - 1 ? 0.3 : 1, transition: 'all 0.2s ease',
                    }}
                >→</button>
            </div>
        </div>
    );
};

export default Booths;
