import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
<<<<<<< HEAD
import { addToCart, getCart } from '../utils/cart';

const Dashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // MODAL & PAYMENT STATES
    const [viewItem, setViewItem] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState("idle"); // idle, processing, verifying, success, failed
    const [inputPhone, setInputPhone] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [cartItems, setCartItems] = useState(getCart());
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        const sync = () => setCartItems(getCart());
        window.addEventListener('cartUpdate', sync);
        return () => window.removeEventListener('cartUpdate', sync);
    }, []);

    const isInCart = (id) => cartItems.some(i => i.id === id);

    const fetchAssets = async () => {
        try {
            const res = await axios.get("/api/get_products");
            // Since backend now does ORDER BY id DESC, we just slice the first 6
            if (Array.isArray(res.data)) {
                setProducts(res.data.slice(0, 6));
            }
        } catch (err) {
            console.error("SYNC_ERROR:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
        if (user.phone) setInputPhone(user.phone);
    }, []);

    const initiatePayment = async () => {
        if (!inputPhone) return alert("PHONE_REQUIRED");
        setPaymentStatus("processing");
        setErrorMessage("");

        let formattedPhone = inputPhone.startsWith("0") ? "254" + inputPhone.substring(1) : inputPhone;

        try {
            const formdata = new FormData();
            formdata.append("phone", formattedPhone);
            formdata.append("amount", viewItem.product_cost);

            const res = await axios.post("/api/mpesa_payment", formdata);

            if (res.data.CheckoutRequestID) {
                const checkoutID = res.data.CheckoutRequestID;
                setPaymentStatus("verifying");
                startPolling(checkoutID);
            } else {
                setPaymentStatus("idle");
                alert("STK_PUSH_FAILED");
            }
        } catch (err) {
            setPaymentStatus("idle");
            alert("CONNECTION_ERROR");
        }
    };

    const startPolling = (checkoutID) => {
        let attempts = 0;
        const maxAttempts = 15;

        const poll = setInterval(async () => {
            try {
                const res = await axios.get(`/api/check_payment/${checkoutID}`);
                if (res.data.status === "COMPLETED") {
                    clearInterval(poll);
                    setPaymentStatus("success");
                } else if (res.data.status === "FAILED") {
                    clearInterval(poll);
                    setPaymentStatus("failed");
                    setErrorMessage(res.data.reason || "TRANSACTION_CANCELLED");
                }
            } catch (e) { console.log("Waiting..."); }

            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(poll);
                setPaymentStatus("failed");
                setErrorMessage("TIMEOUT: NO RESPONSE");
            }
        }, 5000);
    };

    return (
        <div className="container" style={{ paddingTop: '60px' }}>
            <div className="row g-5">
                {/* HOTTEST ASSETS SECTION */}
                <div className="col-lg-12">
                    <h4 className="fw-black text-white mb-4">HOTTEST ASSETS</h4>
                    <div className="d-flex flex-column gap-3">
                        {loading ? <p className="text-white opacity-20 fw-black">SYNCING...</p> :
                            products.length === 0 ? <p className="text-white opacity-20 fw-black">NO ASSETS FOUND</p> :
                                products.map((p) => (
                                    <div key={p.id} className="glass-panel p-3 d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
                                            <img src={`/static/images/${p.product_photo}`} className="rounded-3" style={{ width: '60px', height: '60px', objectFit: 'cover' }} alt="" />
                                            <div>
                                                <h6 className="fw-black mb-0 text-white">{p.product_name.toUpperCase()}</h6>
                                                <p className="text-white opacity-40 mb-0" style={{ fontSize: '11px' }}>{p.product_description?.substring(0, 40) || 'NO DESCRIPTION'}</p>
                                                <p className="text-white opacity-60 small mb-0 fw-bold">KES {Number(p.product_cost).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button onClick={() => setViewItem(p)} className="btn btn-outline-light btn-sm rounded-pill px-3 fw-black">VIEW</button>
                                            <button
                                                onClick={() => addToCart(p)}
                                                className="btn btn-sm rounded-pill px-3 fw-black"
                                                style={{ background: isInCart(p.id) ? 'rgba(255,255,255,0.15)' : '#fff', color: isInCart(p.id) ? '#fff' : '#000', fontSize: '11px' }}
                                            >
                                                {isInCart(p.id) ? '✓ ADDED' : '+ CART'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                    </div>
                </div>
            </div>

            {/* REAL-TIME PAYMENT MODAL */}
            {viewItem && (
                <div className="view-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(30px)' }}>
                    <div className="glass-panel p-5" style={{ maxWidth: '440px', width: '95%', border: '1px solid rgba(255,255,255,0.1)' }}>

                        {paymentStatus === "success" ? (
                            <div className="text-center py-4">
                                <h1 className="fw-black text-white mb-2">VERIFIED</h1>
                                <p className="text-white opacity-50 mb-4 small fw-black">ASSET UNLOCKED IN LEDGER</p>
                                <button className="btn w-100 py-3 fw-black bg-white text-black" onClick={() => { setViewItem(null); setPaymentStatus("idle"); }}>DONE</button>
                            </div>
                        ) : paymentStatus === "failed" ? (
                            <div className="text-center py-4">
                                <h2 className="fw-black text-danger mb-2">FAILED</h2>
                                <p className="text-white opacity-70 mb-5 small fw-bold">{errorMessage.toUpperCase()}</p>
                                <button className="btn w-100 py-3 fw-black btn-outline-light" onClick={() => setPaymentStatus("idle")}>RETRY</button>
                            </div>
                        ) : (
                            <>
                                <h2 className="fw-black text-white mb-2">{viewItem.product_name.toUpperCase()}</h2>
                                <p className="text-white opacity-50 small mb-4">{viewItem.product_description || 'NO DESCRIPTION AVAILABLE'}</p>
                                <img src={`/static/images/${viewItem.product_photo}`} className="rounded-4 mb-4 w-100" style={{ height: '200px', objectFit: 'cover' }} alt="" />

                                <div className="mb-4 text-center">
                                    <label className="fw-black small mb-2 text-white opacity-40">ENTER M-PESA NUMBER</label>
                                    <input type="tel" className="form-control bg-transparent text-white fw-black text-center" value={inputPhone} onChange={(e) => setInputPhone(e.target.value)} />
                                </div>

                                <div className="d-flex gap-3">
                                    <button className="btn flex-grow-1 py-3 fw-black bg-white text-black" onClick={initiatePayment} disabled={paymentStatus !== "idle"}>
                                        {paymentStatus === "processing" ? "PROMPTING..." : paymentStatus === "verifying" ? "AWAITING PIN..." : `BUY KES ${Number(viewItem.product_cost).toLocaleString()}`}
                                    </button>
                                    <button className="btn py-3 px-4 fw-black text-white border-0" onClick={() => { setViewItem(null); setPaymentStatus("idle"); }}>EXIT</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
=======
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
>>>>>>> 3614aa344074cbe5c7f16c7cb67cd9fdc789732b
        </div>
    );
};

export default Dashboard;
