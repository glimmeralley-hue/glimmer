import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
