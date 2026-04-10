import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

const Dashboard = () => {
    const [thought, setThought] = useState("");
    const [musicUrl, setMusicUrl] = useState("");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const handleSpill = async (e) => {
        e.preventDefault();
        if (!thought) return;
        try {
            const formdata = new FormData();
            formdata.append("email", user.email);
            formdata.append("content", thought);
            formdata.append("music_url", musicUrl);
            
            const res = await axios.post(`${API_URL}/add_thought`, formdata);
            
            if (res.data.status === "success") {
                setThought("");
                setMusicUrl("");
                alert(res.data.message || "SPILL_SENT");
            } else {
                alert(res.data.message || "SPILL_FAILED");
            }
        } catch (err) {
            alert("SPILL_FAILED");
        }
    };

    return (
        <div className="container" style={{ paddingTop: '60px' }}>
            <div className="row g-5">
                {/* SPILLS SECTION */}
                <div className="col-lg-5">
                    <div className="glass-panel p-4 mb-4" style={{ borderTop: '4px solid #fff' }}>
                        <h4 className="fw-black text-white mb-4">SPILLS</h4>
                        <form onSubmit={handleSpill}>
                            <textarea
                                className="form-control mb-3"
                                rows="3"
                                placeholder="LET IT OUT..."
                                value={thought}
                                onChange={(e) => setThought(e.target.value)}
                                style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase' }}
                            />
                            <input
                                type="text"
                                className="form-control mb-4 small"
                                placeholder="MUSIC LINK (OPTIONAL)"
                                value={musicUrl}
                                onChange={(e) => setMusicUrl(e.target.value)}
                                style={{ backgroundColor: 'transparent', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.2)', fontSize: '12px' }}
                            />
                            <button type="submit" className="btn w-100 py-3 fw-black bg-white text-black">SPILL</button>
                        </form>
                    </div>
                </div>

                {/* SHOP PROMOTION SECTION */}
                <div className="col-lg-7">
                    <div className="glass-panel p-5 text-center">
                        <i className="bi bi-shop fs-1 text-white mb-3"></i>
                        <h4 className="fw-black text-white mb-3">GLIMMER SHOP</h4>
                        <p className="text-white opacity-50 mb-4">Discover exclusive products and digital assets in our marketplace</p>
                        <div className="d-flex gap-3 justify-content-center">
                            <Link to="/shop" className="btn btn-primary px-4 py-2 fw-black text-decoration-none">BROWSE SHOP</Link>
                            <Link to="/cart" className="btn btn-outline-light px-4 py-2 fw-black text-decoration-none">VIEW CART</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
