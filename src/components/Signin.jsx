import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const SignIn = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMsg("");
        setLoading(true);

        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);

        try {
            // Using your specified endpoint
            const res = await axios.post(`${API_URL}/signin`, formData);
            
            console.log("Server response:", res.data);
            console.log("Response status:", res.data.status);
            
            if (res.data.status === "success") {
                login(res.data.user);
                navigate("/dashboard");
            } else {
                setLoading(false);
                console.log("Login failed - server response:", res.data);
                setMsg(res.data.message || "INVALID_CREDENTIALS");
            }
        } catch (err) {
            setLoading(false);
            console.error("Signin Error:", err);
            console.error("Error response:", err.response);
            console.error("Error status:", err.response?.status);
            console.error("Error data:", err.response?.data);
            
            if (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK") {
                setMsg("Cannot connect to server. Please ensure the backend is running on http://localhost:5000");
            } else if (err.response) {
                // Show more specific server error
                const errorMessage = err.response.data?.message || err.response.data?.error || "Server error occurred";
                const statusCode = err.response.status || "Unknown";
                setMsg(`Server error (${statusCode}): ${errorMessage}`);
            } else {
                setMsg("Network error. Please check your connection and try again.");
            }
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="glass-panel w-100 p-5 shadow-lg" style={{ maxWidth: '420px' }}>
                <h1 className="fw-bold mb-2 text-white" style={{ fontSize: '2.5rem', letterSpacing: '-0.05em' }}>Login</h1>
                <p className="fw-medium mb-5 text-white opacity-75">Enter your details to continue</p>
                
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="fw-bold small mb-2 text-white">Email Address</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            placeholder="name@example.com" 
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                    
                    <div className="mb-5">
                        <label className="fw-bold small mb-2 text-white">Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            placeholder="••••••••" 
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>
                    
                    {/* THE FIX: Solid White Background, Solid Black Text for 100% Visibility */}
                    <button 
                        type="submit" 
                        className="btn w-100 py-3 mb-4 fw-black" 
                        style={{ backgroundColor: '#ffffff', color: '#000000', borderRadius: '14px', border: 'none', fontWeight: '900' }}
                        disabled={loading}
                    >
                        {loading ? "AUTHENTICATING..." : "SIGN IN"}
                    </button>
                </form>

                {msg && <div className="text-danger fw-bold small text-center mb-3">{msg}</div>}

                <div className="text-center mt-2">
                    <p className="fw-medium small m-0 text-white">
                        NEW HERE? <Link className="text-white fw-bold text-decoration-none border-bottom border-white ms-1" to='/signup'>CREATE ACCOUNT</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignIn;
