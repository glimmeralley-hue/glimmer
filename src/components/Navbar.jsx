import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCartCount } from '../utils/cart';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [cartCount, setCartCount] = useState(getCartCount());

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

    const isActive = (path) => location.pathname.includes(path) ? "text-white" : "text-white-50";

    return (
        <nav className="navbar navbar-expand-lg py-3 sticky-top" style={{ 
            background: 'rgba(0,0,0,0.95)', 
            backdropFilter: 'blur(20px)', 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            zIndex: 1050 
        }}>
            <div className="container d-flex justify-content-between align-items-center">
                
                <Link className="navbar-brand fw-black text-white" to="/dashboard" style={{ letterSpacing: '-1.5px', fontSize: '1.6rem' }}>
                    GLIMMER
                </Link>

                <div className="d-flex align-items-center gap-4">
                    <Link to="/feed" className={`${isActive('/feed')} fw-bold text-decoration-none small`}>
                        FEED
                    </Link>
                    <Link to="/dashboard" className={`${isActive('/dashboard')} fw-bold text-decoration-none small`}>
                        SHOP
                    </Link>
                    <Link to="/messages" className={`${isActive('/messages')} fw-bold text-decoration-none small`}>
                        MESSAGES
                    </Link>

                    {/* CART ICON */}
                    <Link to="/cart" className="position-relative text-decoration-none" style={{ lineHeight: 1 }}>
                        <span className={`fw-bold small ${isActive('/cart')}`}>🛒</span>
                        {cartCount > 0 && (
                            <span
                                className="position-absolute badge bg-white text-black fw-black"
                                style={{ top: '-8px', right: '-10px', fontSize: '8px', borderRadius: '10px', minWidth: '16px', padding: '2px 4px' }}
                            >
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    <Link to="/add-product" className="btn btn-sm fw-black px-3" style={{ 
                        backgroundColor: '#ffffff', 
                        color: '#000000', 
                        borderRadius: '6px', 
                        fontSize: '0.65rem', 
                        letterSpacing: '1px' 
                    }}>
                        ADD PRODUCT
                    </Link>
                    
                    <div className="d-flex align-items-center gap-3 ms-2 border-start border-white border-opacity-10 ps-4">
                        <img 
                            src={`/static/images/${user.profile_pic || 'default.png'}`} 
                            className="rounded-circle border border-white border-opacity-20" 
                            style={{ width: '32px', height: '32px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                            onClick={() => navigate(`/profile/${user.email}`)}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23444'/%3E%3Ccircle cx='16' cy='13' r='5' fill='%23888'/%3E%3Cellipse cx='16' cy='28' rx='9' ry='7' fill='%23888'/%3E%3C/svg%3E"; }}
                            alt="pfp"
                        />
                        <button 
                            onClick={handleLogout} 
                            className="btn p-0 text-danger fw-black small" 
                            style={{ fontSize: '0.65rem', letterSpacing: '1px' }}
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
