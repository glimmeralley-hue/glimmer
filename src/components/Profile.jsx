import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const Profile = () => {
    const navigate = useNavigate();
    const { email: urlEmail } = useParams(); 
    const fileInputRef = useRef(null);
    
    const [profileData, setProfileData] = useState(null); 
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Determine if we are looking at our own profile or someone else's
    const isOwnProfile = !urlEmail || urlEmail === loggedInUser.email;
    const targetEmail = urlEmail || loggedInUser.email;

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`https://glimmer.alwaysdata.net/api/get_user/${targetEmail}`);
            setProfileData(res.data);
            setBio(res.data.bio || "");
            setPhone(res.data.phone || "");
        } catch (err) {
            setMsg("USER_OFFLINE_OR_NOT_FOUND");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loggedInUser.email) {
            navigate("/signin");
            return;
        }
        fetchProfileData();
    }, [targetEmail]);

    const handleImageUpload = async (e) => {
        if (!isOwnProfile) return;
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("email", loggedInUser.email);
        formData.append("image", file); // Matches request.files.get("image")
        formData.append("bio", bio);    // Send current bio/phone so they don't get wiped
        formData.append("phone", phone);

        setLoading(true);
        try {
            const res = await axios.post("https://glimmer.alwaysdata.net/api/update_profile", formData);
            if (res.data.status === "success") {
                setMsg("AVATAR_UPDATED");
                fetchProfileData(); // Refresh data to show new image
            }
        } catch (err) {
            setMsg("UPLOAD_FAILED");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateInfo = async () => {
        setLoading(true);
        setMsg("");
        try {
            const fd = new FormData();
            fd.append("email", loggedInUser.email);
            fd.append("phone", phone);
            fd.append("bio", bio);

            const res = await axios.post("https://glimmer.alwaysdata.net/api/update_profile", fd);

            if (res.data.status === "success") {
                // Important: Update LocalStorage so the whole app knows the new info
                const updatedUser = { ...loggedInUser, bio: bio, phone: phone };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                
                setProfileData(prev => ({ ...prev, bio: bio, phone: phone }));
                setIsEditing(false);
                setMsg("CHANGES_LOCKED_IN");
            }
        } catch (err) {
            setMsg("DATABASE_ERROR");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !profileData) return <div className="text-center py-5 text-white fw-black">SYNCING_GLIMMER...</div>;
    if (!profileData) return <div className="text-center py-5 text-white fw-black">USER_NOT_FOUND</div>;

    return (
        <div className="container d-flex justify-content-center align-items-center py-5" style={{ minHeight: '80vh' }}>
            <div className="glass-panel text-center p-5" style={{ width: '100%', maxWidth: '450px', borderTop: '4px solid #fff' }}>
                
                {/* AVATAR SECTION */}
                <div className="mb-4 position-relative d-inline-block">
                    <img 
                        src={`https://glimmer.alwaysdata.net/static/images/${profileData.profile_pic || 'default.png'}`} 
                        className="rounded-circle border border-2 border-white shadow-lg"
                        style={{ width: '130px', height: '130px', objectFit: 'cover', cursor: isOwnProfile ? 'pointer' : 'default' }}
                        alt="Profile"
                        onClick={() => isOwnProfile && fileInputRef.current.click()}
                    />
                    {isOwnProfile && (
                        <div className="mt-2">
                           <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                           <small className="text-white opacity-30 fw-black" style={{fontSize: '10px'}}>TAP PHOTO TO CHANGE</small>
                        </div>
                    )}
                </div>

                <h2 className="text-white fw-black mb-1">{profileData.username?.toUpperCase()}</h2>
                <p className="text-white opacity-40 small mb-4">{profileData.email}</p>

                {msg && <div className="text-info small fw-black mb-3">{msg}</div>}

                <div className="text-start border-top border-white border-opacity-10 pt-4">
                    {isEditing ? (
                        <>
                            <label className="text-white opacity-30 small fw-black mb-2">PHONE</label>
                            <input type="text" className="form-control bg-white bg-opacity-5 border-0 text-white mb-3 shadow-none py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            
                            <label className="text-white opacity-30 small fw-black mb-2">BIO</label>
                            <textarea className="form-control bg-white bg-opacity-5 border-0 text-white mb-4 shadow-none" value={bio} onChange={(e) => setBio(e.target.value)} rows="3" style={{ resize: 'none' }} />
                            
                            <button onClick={handleUpdateInfo} className="btn bg-white text-black w-100 fw-black mb-2 rounded-pill py-2" disabled={loading}>
                                {loading ? "SAVING..." : "SAVE CHANGES"}
                            </button>
                            <button onClick={() => setIsEditing(false)} className="btn btn-link text-white opacity-40 w-100 small text-decoration-none fw-bold">CANCEL</button>
                        </>
                    ) : (
                        <>
                            <div className="mb-3">
                                <small className="text-white opacity-30 fw-black d-block mb-1">PHONE</small>
                                <div className="text-white fw-bold">{profileData.phone || "---"}</div>
                            </div>
                            <div className="mb-4">
                                <small className="text-white opacity-30 fw-black d-block mb-1">BIO</small>
                                <div className="text-white opacity-80" style={{ fontStyle: 'italic' }}>{profileData.bio || "NO BIO YET."}</div>
                            </div>
                            {isOwnProfile && (
                                <button onClick={() => setIsEditing(true)} className="btn btn-outline-light w-100 btn-sm fw-black rounded-pill py-2 opacity-50 hover-opacity-100">EDIT PROFILE</button>
                            )}
                        </>
                    )}
                </div>

                {isOwnProfile && (
                    <button 
                        onClick={() => { localStorage.removeItem("user"); navigate("/signin"); }} 
                        className="btn btn-link text-danger w-100 fw-black py-2 mt-4 text-decoration-none small"
                    >SIGN OUT</button>
                )}
            </div>
        </div>
    );
};

export default Profile;
