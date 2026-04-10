import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

const AddProduct = () => {
    // 1. State Management
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [cost, setCost] = useState("");
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // 2. Handle Image Selection & Preview
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // 3. Form Submission logic
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Retrieve logged-in user to associate the product with an owner
        const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

        if (!loggedInUser.email) {
            alert("SESSION_EXPIRED: Please sign in again.");
            navigate("/signin");
            return;
        }

        const d = new FormData();
        // MATCHING THE BACKEND ORDER: Name -> Description -> Cost -> Photo -> Email
        d.append("product_name", name);
        d.append("product_description", description);
        d.append("product_cost", cost);
        d.append("product_photo", photo);
        d.append("email", loggedInUser.email); // CRITICAL: This was missing!

        try {
            const res = await axios.post(`${API_URL}/add_product`, d);
            
            if (res.data.status === "success") {
                navigate("/shop"); 
            } else {
                setLoading(false);
                console.error("ADD_PRODUCT_ERROR:", res.data);
                alert(res.data.message || "UPLOAD_FAILED");
            }
        } catch (err) {
            setLoading(false);
            console.error("DATABASE_SYNC_ERROR:", err);
            alert(err.response?.data?.message || "UPLOAD_FAILED");
        }
    };

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            {/* Header Section */}
            <div className="mb-5 border-bottom border-white border-opacity-10 pb-3 text-center">
                <h1 className="fw-black text-white m-0" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>NEW ASSET</h1>
                <p className="text-white opacity-50 fw-bold small mt-1">REGISTER TO THE GLOBAL LEDGER</p>
            </div>

            <div className="row g-5">
                {/* Input Column */}
                <div className="col-lg-6">
                    <div className="glass-panel p-5" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="fw-bold small mb-2 text-white opacity-50">ASSET NAME</label>
                                <input 
                                    type="text" 
                                    className="form-control bg-dark text-white border-0 py-3 px-4 shadow-none" 
                                    placeholder="e.g. iPhone 16 Pro" 
                                    onChange={(e) => setName(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div className="mb-4">
                                <label className="fw-bold small mb-2 text-white opacity-50">ASSET DESCRIPTION</label>
                                <textarea 
                                    className="form-control bg-dark text-white border-0 py-3 px-4 shadow-none" 
                                    placeholder="Specs, condition, and details..." 
                                    rows="3"
                                    onChange={(e) => setDescription(e.target.value)} 
                                    required 
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="fw-bold small mb-2 text-white opacity-50">VALUATION (KES)</label>
                                <input 
                                    type="number" 
                                    className="form-control bg-dark text-white border-0 py-3 px-4 shadow-none" 
                                    placeholder="0.00" 
                                    onChange={(e) => setCost(e.target.value)} 
                                    required 
                                />
                            </div>
                            
                            <div className="mb-5">
                                <label className="fw-bold small mb-2 text-white opacity-50">SOURCE IMAGE</label>
                                <input 
                                    type="file" 
                                    className="form-control bg-dark text-white border-0 py-3 px-4 shadow-none" 
                                    onChange={handleFileChange} 
                                    required 
                                />
                            </div>
                            
                            <button type="submit" className="btn w-100 py-3 fw-black text-dark bg-white rounded-pill border-0" disabled={loading}>
                                {loading ? "UPLOADING TO LEDGER..." : "CONFIRM REGISTRATION"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Live Preview Column */}
                <div className="col-lg-6">
                    <h4 className="fw-black text-white mb-4 opacity-30">PREVIEW</h4>
                    <div className="glass-panel p-4 text-center d-flex align-items-center justify-content-center" 
                         style={{ minHeight: '450px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '25px' }}>
                        {preview ? (
                            <div className="w-100 animate-in">
                                <img src={preview} className="rounded-4 mb-4 shadow-lg w-100" style={{ maxHeight: '280px', objectFit: 'cover' }} alt="preview" />
                                <h2 className="fw-black text-white mb-1" style={{ letterSpacing: '-1px' }}>{name.toUpperCase() || "ASSET_NAME"}</h2>
                                <p className="text-white-50 small mb-3 px-4">{description || "Registering details to the ledger..."}</p>
                                <h3 className="fw-bold text-info">KES {Number(cost).toLocaleString() || "0"}</h3>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="spinner-grow text-white opacity-10 mb-3" role="status"></div>
                                <p className="text-white opacity-20 fw-black">AWAITING ASSET UPLOAD</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
