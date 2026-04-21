import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { STATIC_URL } from '../config/constants';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [cartFeedback, setCartFeedback] = useState("");
    const [cartItems, setCartItems] = useState(0);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        fetchProducts();
        updateCartCount();
    }, []);

    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartItems(totalItems);
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/get_products`);
            setProducts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("FETCH_PRODUCTS_ERROR:", err);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
            setCartFeedback(`${product.product_name} quantity updated!`);
        } else {
            cart.push({ ...product, quantity: 1 });
            setCartFeedback(`${product.product_name} added to cart!`);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        // Clear feedback after 3 seconds
        setTimeout(() => setCartFeedback(''), 3000);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.product_description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ["all", "digital", "physical", "services"];

    if (!user.email) {
        return (
            <div className="container py-5 text-center text-white">
                <h3>Please login to access the shop</h3>
                <Link to="/signin" className="btn btn-primary mt-3">Login</Link>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white fw-black">GLIMMER SHOP</h2>
                <Link to="/cart" className="btn btn-outline-light position-relative">
                    <i className="bi bi-cart3"></i> CART
                    {cartItems > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {cartItems}
                        </span>
                    )}
                </Link>
            </div>

            {/* Cart Feedback */}
            {cartFeedback && (
                <div className="alert alert-success alert-dismissible fade show" role="alert" style={{ backgroundColor: 'rgba(40, 167, 69, 0.2)', borderColor: 'rgba(40, 167, 69, 0.3)' }}>
                    <span className="text-white">{cartFeedback}</span>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setCartFeedback('')}></button>
                </div>
            )}

            {/* Search and Filter */}
            <div className="glass-panel p-3 mb-4">
                <div className="row g-3">
                    <div className="col-md-8">
                        <input 
                            type="text" 
                            className="form-control bg-transparent text-white border-secondary"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <select 
                            className="form-select bg-transparent text-white border-secondary"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat} className="bg-dark">
                                    {cat.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <p className="text-white opacity-50">Loading products...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-search fs-1 text-white opacity-50"></i>
                    <p className="text-white opacity-50 mt-3">No products found</p>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="col-md-6 col-lg-4">
                            <div className="glass-panel p-3 h-100">
                                <img 
                                    src={`${STATIC_URL}/${product.product_photo || 'default.png'}`} 
                                    className="w-100 rounded-3 mb-3" 
                                    style={{ height: '200px', objectFit: 'cover' }} 
                                    alt={product.product_name} 
                                />
                                <h5 className="text-white fw-black mb-2">{product.product_name.toUpperCase()}</h5>
                                <p className="text-white opacity-50 small mb-3">
                                    {product.product_description?.substring(0, 100) || 'NO DESCRIPTION AVAILABLE'}
                                </p>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-white fw-bold">KES {Number(product.product_cost).toLocaleString()}</span>
                                    <button 
                                        className="btn btn-sm btn-primary"
                                        onClick={() => addToCart(product)}
                                    >
                                        <i className="bi bi-cart-plus"></i> ADD TO CART
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Shop;
