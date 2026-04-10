import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { STATIC_URL } from '../config/constants';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    // Pull the latest user data from localStorage
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : {};
    
    useEffect(() => {
        if (user.email) {
            fetchUnreadCount();
        }
    }, [user.email]);

    const fetchUnreadCount = async () => {
        try {
            const res = await axios.get(`${API_URL}/get_unread_count/${user.email}`);
            setUnreadCount(res.data.count || 0);
        } catch (err) {
            console.error("Failed to fetch unread count:", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/signin");
    };

    // Dynamic active state styling
    const isActive = (path) => location.pathname.includes(path) ? "text-white" : "text-white-50";

    return (
        <nav className="navbar navbar-expand-lg py-3 sticky-top" style={{ 
            background: 'rgba(0,0,0,0.95)', 
            backdropFilter: 'blur(20px)', 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            zIndex: 1050 
        }}>
            <div className="container d-flex justify-content-between align-items-center">
                
                {/* BRAND / LOGO */}
                <Link className="navbar-brand fw-black text-white" to="/dashboard" style={{ letterSpacing: '-1.5px', fontSize: '1.6rem' }}>
                    GLIMMER
                </Link>

                <div className="d-flex align-items-center gap-4">
                    {/* NAVIGATION LINKS */}
                    <Link to="/feed" className={`${isActive('/feed')} fw-bold text-decoration-none small transition-all`}>
                        FEED
                    </Link>
                    <Link to="/dashboard" className={`${isActive('/dashboard')} fw-bold text-decoration-none small transition-all`}>
                        SHOP
                    </Link>
                    <Link to="/messages" className={`${isActive('/messages')} fw-bold text-decoration-none small transition-all position-relative`}>
                        MESSAGES
                        {unreadCount > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '8px', padding: '2px 6px' }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>
                    
                    {/* ACTION BUTTON */}
                    <Link to="/add-product" className="btn btn-sm fw-black px-3" style={{ 
                        backgroundColor: '#ffffff', 
                        color: '#000000', 
                        borderRadius: '6px', 
                        fontSize: '0.65rem', 
                        letterSpacing: '1px' 
                    }}>
                        ADD PRODUCT
                    </Link>
                    
                    {/* USER SECTION */}
                    <div className="d-flex align-items-center gap-3 ms-2 border-start border-white border-opacity-10 ps-4">
                        {/* Notifications */}
                        <Link to="/notifications" className={`${isActive('/notifications')} text-white text-decoration-none position-relative`}>
                            <i className="bi bi-bell fs-5"></i>
                        </Link>
                        <img 
                            src={`${STATIC_URL}/${user.profile_pic || 'default.png'}?t=${Date.now()}`} 
                            className="rounded-circle border border-white border-opacity-20" 
                            style={{ 
                                width: '32px', 
                                height: '32px', 
                                objectFit: 'cover', 
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease'
                            }}
                            onError={(e) => {
                                console.log("Navbar image error, falling back to default");
                                e.target.src = `${STATIC_URL}/default.png?t=${Date.now()}`;
                            }}
                            onLoad={() => {
                                console.log("Navbar image loaded successfully");
                            }}
                            onClick={() => navigate(`/profile/${user.email}`)}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
