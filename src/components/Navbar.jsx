import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Pull the latest user data from localStorage
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : {};

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
                        <img 
                            src={`https://glimmer.alwaysdata.net/static/images/${user.profile_pic || 'default.png'}`} 
                            className="rounded-circle border border-white border-opacity-20" 
                            style={{ 
                                width: '32px', 
                                height: '32px', 
                                objectFit: 'cover', 
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease'
                            }}
                            // FIX: Force navigation to the specific email route
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
