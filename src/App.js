import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';

import Navbar from './components/Navbar';
import Signin from './components/Signin';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import AddProduct from './components/Addproduct';
import Feed from './components/Feed';
import Landing from './components/Landing';
import Messages from './components/Messages';
import Cart from './components/Cart';

const noNavbarPaths = ['/', '/signin', '/signup'];
const fullWidthPaths = ['/messages'];

const AppContent = () => {
  const location = useLocation();
  const showNavbar = !noNavbarPaths.includes(location.pathname);
  const isFullWidth = fullWidthPaths.some(p => location.pathname.startsWith(p));

  return (
    <>
      {showNavbar && <Navbar />}
      <div className={showNavbar && !isFullWidth ? "container mt-4" : ""}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/:email" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:email" element={<Messages />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
