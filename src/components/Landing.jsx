import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();
    const brand = "GLIMMER".split("");

    return (
        <div className="container-fluid d-flex flex-column justify-content-center align-items-center landing-wrapper">
            
            {/* THE NEON G - Anchor element */}
            <div className="neon-g-container mb-2">
                <span className="neon-g">G</span>
            </div>
            
            {/* STAGGERED REVEAL - Starts at 1.2s to sync with Brotherhood text */}
            <h1 className="brand-text mb-5">
                {brand.map((char, index) => (
                    <span 
                        key={index} 
                        style={{ animationDelay: `${1.2 + (index * 0.1)}s` }}
                    >
                        {char}
                    </span>
                ))}
            </h1>

            {/* ACTION PORTAL - Reveals after the brand is visible */}
            <div className="d-flex flex-column gap-3 w-100 animate-btns" style={{ maxWidth: '300px' }}>
                <button 
                    onClick={() => navigate('/signin')} 
                    className="portal-btn"
                >
                    SIGN IN
                </button>

                <button 
                    onClick={() => navigate('/signup')} 
                    className="portal-btn-outline"
                >
                    CREATE ACCOUNT
                </button>

                <button 
                    onClick={() => navigate('/feed')} 
                    className="btn btn-link text-white opacity-40 fw-bold mt-2 text-decoration-none small text-uppercase"
                >
                    Browse Thoughts
                </button>
            </div> <br /> <br />

            {/* SYSTEM FOOTER - Syncs with Glimmer reveal at 1.2s */}
            <div className="position-absolute bottom-0 mb-5 text-center animate-footer">
                <p className="brotherhood-text">WELCOME TO THE BROTHERHOOD</p>
            </div>
        </div>
    );
};

export default Landing;
