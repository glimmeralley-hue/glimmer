import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", msg: "" });
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: "", msg: "" });
        setLoading(true);

        try {
            // FIXED: Using 'formdata' consistently across all appends
            const formdata = new FormData();
            formdata.append("username", username);
            formdata.append("email", email);
            formdata.append("password", password);
            formdata.append("phone", phone);

            const response = await axios.post("https://glimmer.alwaysdata.net/api/signup", formdata);

            setStatus({ type: "success", msg: "Account Created." });
            setLoading(false);
            
            // Redirect after success
            setTimeout(() => navigate('/signin'), 2000);
        } catch (err) {
            setLoading(false);
            setStatus({ type: "error", msg: err.response?.data?.message || "Signup Failed." });
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="glass-panel w-100 p-5 shadow-lg" style={{ maxWidth: '460px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <h1 className="fw-bold mb-2 text-white" style={{ fontSize: '2.5rem', letterSpacing: '-0.05em' }}>Join</h1>
                <p className="fw-medium mb-5 text-white opacity-75">Create your account</p>
                
                {status.msg && (
                    <div className={`mb-4 fw-bold small ${status.type === 'success' ? 'text-success' : 'text-danger'}`}>
                        {status.msg.toUpperCase()}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="fw-bold small mb-2 text-white">Username</label>
                        <input type="text" placeholder="Username" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>

                    <div className="mb-3">
                        <label className="fw-bold small mb-2 text-white">Email Address</label>
                        <input type="email" placeholder="name@example.com" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div className="mb-3">
                        <label className="fw-bold small mb-2 text-white">Password</label>
                        <input type="password" placeholder="••••••••" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <div className="mb-4">
                        <label className="fw-bold small mb-2 text-white">Phone Number</label>
                        <input type="number" placeholder="254..." className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>

                    {/* STARK BUTTON: Solid White Background, Solid Black Text */}
                    <button type="submit" className="btn w-100 py-3 mb-4 fw-black" 
                        style={{ backgroundColor: '#ffffff', color: '#000000', borderRadius: '14px', border: 'none', fontWeight: '900' }} 
                        disabled={loading}>
                        {loading ? "SAVING..." : "REGISTER"}
                    </button>

                    <div className="text-center">
                        <p className="fw-medium small m-0 text-white">
                            ALREADY HAVE AN ACCOUNT? <Link className="text-white fw-bold text-decoration-none border-bottom border-white ms-1" to={'/signin'}>LOGIN</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
