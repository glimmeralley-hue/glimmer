import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCart, removeFromCart, updateQuantity, clearCart, getCartTotal } from '../utils/cart';

const Cart = () => {
    const [cart, setCart] = useState(getCart());
    const [paymentStatus, setPaymentStatus] = useState('idle');
    const [phone, setPhone] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user.email) { navigate('/signin'); return; }
        if (user.phone) setPhone(user.phone);
        const sync = () => setCart(getCart());
        window.addEventListener('cartUpdate', sync);
        return () => window.removeEventListener('cartUpdate', sync);
    }, []);

    const total = getCartTotal();

    const handleRemove = (id) => { removeFromCart(id); };
    const handleQty = (id, qty) => { updateQuantity(id, qty); };

    const handleCheckout = async () => {
        if (!phone) return alert('ENTER YOUR M-PESA NUMBER');
        if (cart.length === 0) return;
        setPaymentStatus('processing');
        setErrorMsg('');

        let formatted = phone.startsWith('0') ? '254' + phone.substring(1) : phone;

        try {
            const fd = new FormData();
            fd.append('phone', formatted);
            fd.append('amount', Math.round(total));
            const res = await axios.post('/api/mpesa_payment', fd);

            if (res.data.CheckoutRequestID) {
                setPaymentStatus('verifying');
                startPolling(res.data.CheckoutRequestID);
            } else {
                setPaymentStatus('idle');
                alert('STK_PUSH_FAILED');
            }
        } catch {
            setPaymentStatus('idle');
            alert('CONNECTION_ERROR');
        }
    };

    const startPolling = (checkoutID) => {
        let attempts = 0;
        const poll = setInterval(async () => {
            try {
                const res = await axios.get(`/api/check_payment/${checkoutID}`);
                if (res.data.status === 'COMPLETED') {
                    clearInterval(poll);
                    setPaymentStatus('success');
                    clearCart();
                } else if (res.data.status === 'FAILED') {
                    clearInterval(poll);
                    setPaymentStatus('failed');
                    setErrorMsg(res.data.reason || 'TRANSACTION CANCELLED');
                }
            } catch { }
            if (++attempts >= 15) {
                clearInterval(poll);
                setPaymentStatus('failed');
                setErrorMsg('TIMEOUT: NO RESPONSE');
            }
        }, 5000);
    };

    if (paymentStatus === 'success') return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
            <div className="glass-panel p-5 text-center" style={{ maxWidth: '440px', width: '100%' }}>
                <div className="mb-4" style={{ fontSize: '3rem' }}>✅</div>
                <h1 className="fw-black text-white mb-2">PAID</h1>
                <p className="text-white opacity-50 fw-black small mb-4">YOUR ORDER HAS BEEN CONFIRMED</p>
                <Link to="/dashboard" className="btn bg-white text-black fw-black w-100 py-3 rounded-pill">CONTINUE SHOPPING</Link>
            </div>
        </div>
    );

    return (
        <div className="container py-5">
            <div className="d-flex align-items-center justify-content-between mb-5">
                <div>
                    <h1 className="fw-black text-white mb-1" style={{ letterSpacing: '-2px', fontSize: '2.5rem' }}>CART</h1>
                    <p className="text-white opacity-40 fw-bold small mb-0">{cart.length} {cart.length === 1 ? 'ITEM' : 'ITEMS'}</p>
                </div>
                {cart.length > 0 && (
                    <button onClick={clearCart} className="btn text-danger fw-black small border-0 p-0 opacity-50">CLEAR ALL</button>
                )}
            </div>

            {cart.length === 0 ? (
                <div className="text-center py-5">
                    <h3 className="fw-black text-white opacity-20 mb-3">YOUR CART IS EMPTY</h3>
                    <Link to="/dashboard" className="btn bg-white text-black fw-black px-5 py-3 rounded-pill">BROWSE ASSETS</Link>
                </div>
            ) : (
                <div className="row g-5">
                    {/* CART ITEMS */}
                    <div className="col-lg-7">
                        <div className="d-flex flex-column gap-3">
                            {cart.map((item) => (
                                <div key={item.id} className="glass-panel p-4 d-flex align-items-center gap-4">
                                    <img
                                        src={`/static/images/${item.product_photo}`}
                                        className="rounded-3 flex-shrink-0"
                                        style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                                        alt=""
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/static/images/default.png'; }}
                                    />
                                    <div className="flex-grow-1">
                                        <h6 className="fw-black text-white mb-1">{item.product_name?.toUpperCase()}</h6>
                                        <p className="text-white opacity-60 fw-bold mb-2 small">KES {Number(item.product_cost).toLocaleString()}</p>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <button
                                                    className="btn btn-sm fw-black text-white border-white border-opacity-20 border"
                                                    style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', lineHeight: 1 }}
                                                    onClick={() => handleQty(item.id, item.quantity - 1)}
                                                >−</button>
                                                <span className="text-white fw-black small">{item.quantity}</span>
                                                <button
                                                    className="btn btn-sm fw-black text-white border-white border-opacity-20 border"
                                                    style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', lineHeight: 1 }}
                                                    onClick={() => handleQty(item.id, item.quantity + 1)}
                                                >+</button>
                                            </div>
                                            <span className="text-white opacity-40 fw-black small">
                                                = KES {(Number(item.product_cost) * item.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(item.id)}
                                        className="btn p-0 border-0 text-danger opacity-50 fw-black small flex-shrink-0"
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ORDER SUMMARY & CHECKOUT */}
                    <div className="col-lg-5">
                        <div className="glass-panel p-4" style={{ borderTop: '4px solid #fff', position: 'sticky', top: '100px' }}>
                            <h5 className="fw-black text-white mb-4">ORDER SUMMARY</h5>

                            {cart.map(item => (
                                <div key={item.id} className="d-flex justify-content-between mb-2">
                                    <span className="text-white opacity-50 fw-bold small">{item.product_name?.toUpperCase()} × {item.quantity}</span>
                                    <span className="text-white fw-bold small">KES {(Number(item.product_cost) * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}

                            <div className="border-top border-white border-opacity-10 my-3 pt-3 d-flex justify-content-between">
                                <span className="text-white fw-black">TOTAL</span>
                                <span className="text-white fw-black">KES {total.toLocaleString()}</span>
                            </div>

                            {paymentStatus === 'failed' && (
                                <div className="mb-3">
                                    <p className="text-danger fw-black small mb-0">{errorMsg.toUpperCase()}</p>
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="text-white opacity-40 fw-black small mb-2 d-block">M-PESA NUMBER</label>
                                <input
                                    type="tel"
                                    className="form-control bg-transparent text-white fw-black border-white border-opacity-20 shadow-none"
                                    placeholder="254700..."
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    style={{ borderRadius: '10px' }}
                                />
                            </div>

                            <button
                                className="btn bg-white text-black fw-black w-100 py-3 rounded-pill"
                                onClick={handleCheckout}
                                disabled={paymentStatus !== 'idle' && paymentStatus !== 'failed'}
                            >
                                {paymentStatus === 'processing' ? 'PROMPTING...' :
                                    paymentStatus === 'verifying' ? 'AWAITING PIN...' :
                                        `PAY KES ${total.toLocaleString()}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
import API_URL from '../config/api';
import { STATIC_URL } from '../config/constants';

const Cart = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [total, setTotal] = useState(0);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        if (!user.email) {
            navigate("/signin");
            return;
        }
    }, [user.email, navigate]);

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setCart(parsedCart);
            calculateTotal(parsedCart);
        }
    }, []);

    const calculateTotal = (cartItems) => {
        const sum = cartItems.reduce((acc, item) => acc + (parseFloat(item.product_cost) * item.quantity), 0);
        setTotal(sum);
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        
        const updatedCart = cart.map(item => 
            item.id === productId ? { ...item, quantity: newQuantity } : item
        );
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        calculateTotal(updatedCart);
    };

    const removeFromCart = (productId) => {
        const updatedCart = cart.filter(item => item.id !== productId);
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        calculateTotal(updatedCart);
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('cart');
        setTotal(0);
    };

    const checkout = () => {
        if (cart.length === 0) return;
        
        // Store cart in localStorage for checkout page
        localStorage.setItem('checkoutCart', JSON.stringify({ items: cart, total }));
        // Navigate to checkout
        window.location.href = '/checkout';
    };

    if (!user.email) {
        return (
            <div className="container py-5 text-center text-white">
                <h3>Please login to view your cart</h3>
                <Link to="/signin" className="btn btn-primary mt-3">Login</Link>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="row">
                <div className="col-lg-8">
                    <div className="glass-panel p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-white fw-black">SHOPPING CART</h2>
                            {cart.length > 0 && (
                                <button className="btn btn-outline-danger btn-sm" onClick={clearCart}>
                                    CLEAR CART
                                </button>
                            )}
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="bi bi-cart-x fs-1 text-white opacity-50"></i>
                                <p className="text-white opacity-50 mt-3">Your cart is empty</p>
                                <Link to="/shop" className="btn btn-primary mt-3">CONTINUE SHOPPING</Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.id} className="d-flex align-items-center gap-3 p-3 border-bottom border-white border-opacity-10">
                                        <img 
                                            src={`${STATIC_URL}/${item.product_photo || 'default.png'}`} 
                                            className="rounded-3" 
                                            style={{ width: '80px', height: '80px', objectFit: 'cover' }} 
                                            alt={item.product_name} 
                                        />
                                        <div className="flex-grow-1">
                                            <h6 className="text-white fw-black mb-1">{item.product_name.toUpperCase()}</h6>
                                            <p className="text-white opacity-50 small mb-2">{item.product_description?.substring(0, 60) || 'NO DESCRIPTION'}</p>
                                            <p className="text-white fw-bold mb-0">KES {Number(item.product_cost).toLocaleString()}</p>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <button 
                                                className="btn btn-sm btn-outline-light" 
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            >
                                                -
                                            </button>
                                            <span className="text-white fw-bold px-2">{item.quantity}</span>
                                            <button 
                                                className="btn btn-sm btn-outline-light" 
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button 
                                            className="btn btn-sm btn-outline-danger" 
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {cart.length > 0 && (
                    <div className="col-lg-4">
                        <div className="glass-panel p-4">
                            <h5 className="text-white fw-black mb-4">ORDER SUMMARY</h5>
                            
                            <div className="mb-3">
                                <div className="d-flex justify-content-between text-white mb-2">
                                    <span>Subtotal</span>
                                    <span>KES {total.toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between text-white mb-2">
                                    <span>Delivery</span>
                                    <span>KES 200</span>
                                </div>
                                <div className="d-flex justify-content-between text-white mb-2">
                                    <span>Tax</span>
                                    <span>KES {(total * 0.16).toFixed(2)}</span>
                                </div>
                                <hr className="border-white border-opacity-20" />
                                <div className="d-flex justify-content-between text-white fw-bold">
                                    <span>Total</span>
                                    <span>KES {(total + 200 + (total * 0.16)).toFixed(2)}</span>
                                </div>
                            </div>

                            <button 
                                className="btn w-100 py-3 fw-black bg-white text-black" 
                                onClick={checkout}
                            >
                                PROCEED TO CHECKOUT
                            </button>

                            <Link to="/shop" className="btn btn-outline-light w-100 mt-2">
                                CONTINUE SHOPPING
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
