import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCartCount } from '../utils/cart';

const MODE_LINKS = {
    commercial: [
        { to: '/dashboard', label: 'SHOP' },
        { to: '/messages', label: 'MESSAGES' },
    ],
    personal: [
        { to: '/feed', label: 'FEED' },
        { to: '/dashboard', label: 'SHOP' },
        { to: '/messages', label: 'MESSAGES' },
        { to: '/journal', label: 'JOURNAL' },
    ],
    selfgrowth_restricted: [
        { to: '/journal', label: 'JOURNAL' },
    ],
    selfgrowth_free: [
        { to: '/feed', label: 'FEED' },
        { to: '/journal', label: 'JOURNAL' },
        { to: '/messages', label: 'MESSAGES' },
    ],
    default: [
        { to: '/feed', label: 'FEED' },
        { to: '/dashboard', label: 'SHOP' },
        { to: '/messages', label: 'MESSAGES' },
        { to: '/journal', label: 'JOURNAL' },
    ],
};

const getNavLinks = () => {
    const mode = localStorage.getItem('glimmer_mode');
    const submode = localStorage.getItem('glimmer_submode');
    if (!mode) return MODE_LINKS.default;
    if (mode === 'commercial') return MODE_LINKS.commercial;
    if (mode === 'personal') return MODE_LINKS.personal;
    if (mode === 'selfgrowth') {
        return submode === 'restricted' ? MODE_LINKS.selfgrowth_restricted : MODE_LINKS.selfgrowth_free;
    }
    return MODE_LINKS.default;
};

const showCart = () => {
    const mode = localStorage.getItem('glimmer_mode');
    return !mode || mode === 'commercial' || mode === 'personal';
};

const showAddProduct = () => {
    const mode = localStorage.getItem('glimmer_mode');
    return !mode || mode === 'commercial';
};

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [cartCount, setCartCount] = useState(getCartCount());
    const [links] = useState(getNavLinks());

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : {};

    useEffect(() => {
        const sync = () => setCartCount(getCartCount());
        window.addEventListener('cartUpdate', sync);
        return () => window.removeEventListener('cartUpdate', sync);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/signin");
    };

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <nav className="navbar navbar-expand-lg py-3 sticky-top" style={{
            background: 'rgba(0,0,0,0.97)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            zIndex: 1050
        }}>
            <div className="container d-flex justify-content-between align-items-center">

                <Link className="navbar-brand fw-black text-white" to="/dashboard" style={{ letterSpacing: '-1.5px', fontSize: '1.5rem' }}>
                    GLIMMER
                </Link>

                <div className="d-flex align-items-center gap-3">
                    {links.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="text-decoration-none fw-black"
                            style={{
                                fontSize: '11px', letterSpacing: '2px',
                                color: isActive(link.to) ? '#fff' : 'rgba(255,255,255,0.4)',
                                transition: 'color 0.2s ease',
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {showCart() && (
                        <Link to="/cart" className="position-relative text-decoration-none" style={{ lineHeight: 1 }}>
                            <span style={{ fontSize: '16px' }}>🛒</span>
                            {cartCount > 0 && (
                                <span className="position-absolute badge bg-white text-black fw-black"
                                    style={{ top: '-8px', right: '-10px', fontSize: '8px', borderRadius: '10px', minWidth: '16px', padding: '2px 4px' }}>
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    )}

                    {showAddProduct() && (
                        <Link to="/add-product" className="btn btn-sm fw-black px-3" style={{
                            backgroundColor: '#ffffff', color: '#000000',
                            borderRadius: '6px', fontSize: '10px', letterSpacing: '1.5px'
                        }}>
                            + LIST
                        </Link>
                    )}

                    <div className="d-flex align-items-center gap-2 ms-1 border-start border-white border-opacity-10 ps-3">
                        <img
                            src={`/static/images/${user.profile_pic || 'default.png'}`}
                            className="rounded-circle border border-white border-opacity-20"
                            style={{ width: '30px', height: '30px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                            onClick={() => navigate(`/profile/${user.email}`)}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23444'/%3E%3Ccircle cx='16' cy='13' r='5' fill='%23888'/%3E%3Cellipse cx='16' cy='28' rx='9' ry='7' fill='%23888'/%3E%3C/svg%3E"; }}
                            alt="pfp"
                        />
                        <Link to="/settings" className="text-decoration-none" title="Settings">
                            <span style={{ fontSize: '14px', opacity: 0.4 }}>⚙️</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="btn p-0 text-danger fw-black"
                            style={{ fontSize: '10px', letterSpacing: '1.5px' }}
                        >
                            EXIT
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
