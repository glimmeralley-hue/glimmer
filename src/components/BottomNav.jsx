import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user.email) return null;

    const navItems = [
        { path: '/dashboard', icon: 'bi-house', label: 'Home' },
        { path: '/feed', icon: 'bi-rss', label: 'Feed' },
        { path: '/shop', icon: 'bi-shop', label: 'Shop' },
        { path: '/cart', icon: 'bi-cart3', label: 'Cart' },
        { path: '/messages', icon: 'bi-chat-dots', label: 'Messages' },
        { path: `/profile/${user.email}`, icon: 'bi-person', label: 'Profile' }
    ];

    return (
        <div className="fixed-bottom bg-dark border-top border-secondary" style={{ zIndex: 1000 }}>
            <div className="container-fluid">
                <div className="d-flex justify-content-around align-items-center py-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`text-decoration-none d-flex flex-column align-items-center p-2 ${
                                location.pathname === item.path ? 'text-primary' : 'text-white opacity-50'
                            }`}
                            style={{ minWidth: '60px' }}
                        >
                            <i className={`bi ${item.icon} fs-5`}></i>
                            <span className="small" style={{ fontSize: '10px' }}>{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BottomNav;
