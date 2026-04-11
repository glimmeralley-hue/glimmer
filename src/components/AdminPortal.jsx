import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TABS = ['USERS', 'PRODUCTS', 'SPILLS'];

const AdminPortal = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    const [tab, setTab] = useState('USERS');
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [spills, setSpills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({});
    const [search, setSearch] = useState('');
    const [actionMsg, setActionMsg] = useState('');

    const isAdmin = user?.email && authed;

    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');
        try {
            const res = await axios.post('/api/admin/verify', {
                email: user.email,
                password,
            });
            if (res.data.ok) {
                setAuthed(true);
            } else {
                setAuthError(res.data.error || 'Access denied.');
            }
        } catch {
            setAuthError('Access denied.');
        } finally {
            setAuthLoading(false);
        }
    };

    const fetchData = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const [u, p, s] = await Promise.all([
                axios.post('/api/admin/users', { email: user.email, password }),
                axios.post('/api/admin/products', { email: user.email, password }),
                axios.post('/api/admin/spills', { email: user.email, password }),
            ]);
            setUsers(u.data.users || []);
            setProducts(p.data.products || []);
            setSpills(s.data.spills || []);
            setStats({
                users: u.data.users?.length || 0,
                products: p.data.products?.length || 0,
                spills: s.data.spills?.length || 0,
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authed) fetchData();
    }, [authed]);

    const showAction = (msg) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(''), 3000);
    };

    const handleSuspendUser = async (targetEmail, suspended) => {
        try {
            await axios.post('/api/admin/suspend_user', {
                email: user.email, password,
                target_email: targetEmail,
                suspend: !suspended,
            });
            showAction(`User ${!suspended ? 'suspended' : 'restored'}: ${targetEmail}`);
            fetchData();
        } catch { showAction('Action failed.'); }
    };

    const handleDeleteProduct = async (productId, name) => {
        if (!window.confirm(`Delete product: "${name}"?`)) return;
        try {
            await axios.post('/api/admin/delete_product', {
                email: user.email, password, product_id: productId,
            });
            showAction(`Deleted product: ${name}`);
            fetchData();
        } catch { showAction('Delete failed.'); }
    };

    const handleDeleteSpill = async (spillId) => {
        if (!window.confirm('Remove this spill?')) return;
        try {
            await axios.post('/api/admin/delete_spill', {
                email: user.email, password, spill_id: spillId,
            });
            showAction('Spill removed.');
            fetchData();
        } catch { showAction('Delete failed.'); }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.seller_email?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredSpills = spills.filter(s =>
        s.content?.toLowerCase().includes(search.toLowerCase()) ||
        s.user_email?.toLowerCase().includes(search.toLowerCase())
    );

    if (!authed) {
        return (
            <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: '420px', padding: '0 24px' }}>
                    <div className="text-center mb-5">
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛡️</div>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '4px', fontWeight: '900', margin: '0 0 6px' }}>
                            RESTRICTED ACCESS
                        </p>
                        <h2 style={{ color: '#fff', fontWeight: '900', letterSpacing: '-1px', margin: 0, fontSize: '1.8rem' }}>
                            ADMIN PORTAL
                        </h2>
                    </div>

                    {!user?.email ? (
                        <div className="text-center">
                            <p style={{ color: 'rgba(255,100,100,0.7)', fontSize: '12px', fontWeight: '900', letterSpacing: '2px' }}>
                                YOU MUST BE SIGNED IN
                            </p>
                            <button
                                onClick={() => navigate('/signin')}
                                style={{ background: '#fff', color: '#000', border: 'none', padding: '12px 32px', borderRadius: '30px', fontWeight: '900', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', marginTop: '12px' }}
                            >
                                SIGN IN
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleAuth}>
                            <div className="mb-3">
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>
                                    SIGNED IN AS
                                </p>
                                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '13px', fontWeight: '700' }}>
                                    {user.email}
                                </div>
                            </div>

                            <div className="mb-4">
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>
                                    ADMIN PASSWORD
                                </p>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    autoFocus
                                />
                            </div>

                            {authError && (
                                <div style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#ff6b6b', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>
                                    {authError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={authLoading || !password}
                                style={{ width: '100%', background: password ? '#fff' : 'rgba(255,255,255,0.1)', color: password ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', padding: '14px', borderRadius: '30px', fontWeight: '900', fontSize: '12px', letterSpacing: '2px', cursor: password ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
                            >
                                {authLoading ? 'VERIFYING...' : 'ENTER PORTAL →'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '32px 40px' }}>
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-5">
                <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '4px', fontWeight: '900', margin: '0 0 4px' }}>GLIMMER</p>
                    <h1 style={{ color: '#fff', fontWeight: '900', letterSpacing: '-1.5px', margin: 0, fontSize: '2rem' }}>ADMIN PORTAL</h1>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '700' }}>{user.email}</span>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 18px', borderRadius: '20px', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer' }}
                    >
                        ← EXIT
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="d-flex gap-3 mb-5">
                {[
                    { label: 'TOTAL USERS', value: stats.users || 0, icon: '👤' },
                    { label: 'PRODUCTS', value: stats.products || 0, icon: '🛍️' },
                    { label: 'SPILLS', value: stats.spills || 0, icon: '💬' },
                ].map(s => (
                    <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 24px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '3px', fontWeight: '900', margin: '0 0 8px' }}>{s.icon} {s.label}</p>
                        <p style={{ color: '#fff', fontSize: '2rem', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Action message */}
            {actionMsg && (
                <div style={{ background: 'rgba(0,200,80,0.1)', border: '1px solid rgba(0,200,80,0.3)', borderRadius: '10px', padding: '10px 18px', marginBottom: '20px', color: '#00c850', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>
                    ✓ {actionMsg}
                </div>
            )}

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 16px', color: '#fff', fontSize: '13px', outline: 'none', width: '280px' }}
                />
            </div>

            {/* Tabs */}
            <div className="d-flex gap-0 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{ background: 'none', border: 'none', color: tab === t ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: '900', fontSize: '11px', letterSpacing: '2px', padding: '12px 24px', cursor: 'pointer', borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent', marginBottom: '-1px', transition: 'all 0.2s' }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '2px', fontWeight: '900' }}>LOADING...</p>
            ) : (
                <>
                    {/* USERS TAB */}
                    {tab === 'USERS' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredUsers.length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: '700' }}>No users found.</p>}
                            {filteredUsers.map(u => (
                                <div key={u.email} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ color: '#fff', fontWeight: '900', fontSize: '13px', margin: '0 0 2px' }}>
                                            {u.username || 'No username'}
                                            {u.suspended ? <span style={{ background: 'rgba(255,50,50,0.2)', color: '#ff6b6b', fontSize: '9px', fontWeight: '900', letterSpacing: '1px', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>SUSPENDED</span> : null}
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '0 0 2px' }}>{u.email}</p>
                                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: 0, fontWeight: '700' }}>
                                            Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button
                                            onClick={() => handleSuspendUser(u.email, u.suspended)}
                                            style={{ background: u.suspended ? 'rgba(0,200,80,0.1)' : 'rgba(255,200,0,0.1)', border: u.suspended ? '1px solid rgba(0,200,80,0.3)' : '1px solid rgba(255,200,0,0.3)', color: u.suspended ? '#00c850' : '#ffc107', padding: '6px 14px', borderRadius: '20px', fontWeight: '900', fontSize: '9px', letterSpacing: '1px', cursor: 'pointer' }}
                                        >
                                            {u.suspended ? 'RESTORE' : 'SUSPEND'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PRODUCTS TAB */}
                    {tab === 'PRODUCTS' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredProducts.length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: '700' }}>No products found.</p>}
                            {filteredProducts.map(p => (
                                <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                    <div className="d-flex align-items-center gap-3">
                                        {p.image_url && (
                                            <img
                                                src={`/static/images/${p.image_url}`}
                                                alt={p.name}
                                                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                        <div>
                                            <p style={{ color: '#fff', fontWeight: '900', fontSize: '13px', margin: '0 0 2px' }}>{p.name}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '0 0 2px' }}>KES {p.price?.toLocaleString()} · by {p.seller_email}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: 0, fontWeight: '700' }}>{p.category}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteProduct(p.id, p.name)}
                                        style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', color: '#ff6b6b', padding: '6px 14px', borderRadius: '20px', fontWeight: '900', fontSize: '9px', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                        DELETE
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SPILLS TAB */}
                    {tab === 'SPILLS' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredSpills.length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: '700' }}>No spills found.</p>}
                            {filteredSpills.map(s => (
                                <div key={s.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', letterSpacing: '1.5px', margin: '0 0 6px' }}>{s.user_email} · {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</p>
                                        <p style={{ color: '#fff', fontSize: '13px', margin: 0, lineHeight: 1.6, opacity: 0.85 }}>{s.content}</p>
                                        {s.image_url && (
                                            <img src={`/static/images/${s.image_url}`} alt="" style={{ marginTop: '8px', maxWidth: '120px', borderRadius: '6px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                        )}
                                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: '6px 0 0', fontWeight: '700' }}>
                                            ❤️ {s.likes || 0} · 💬 {s.comment_count || 0}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSpill(s.id)}
                                        style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', color: '#ff6b6b', padding: '6px 14px', borderRadius: '20px', fontWeight: '900', fontSize: '9px', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                                    >
                                        REMOVE
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminPortal;
