const CART_KEY = 'glimmer_cart';

export function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
}

export function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdate'));
}

export function removeFromCart(productId) {
    const cart = getCart().filter(i => i.id !== productId);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdate'));
}

export function updateQuantity(productId, qty) {
    if (qty <= 0) { removeFromCart(productId); return; }
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity = qty;
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdate'));
    }
}

export function clearCart() {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event('cartUpdate'));
}

export function getCartCount() {
    return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

export function getCartTotal() {
    return getCart().reduce((sum, i) => sum + Number(i.product_cost) * i.quantity, 0);
}
