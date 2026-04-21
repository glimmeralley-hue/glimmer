import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Signin from './components/Signin';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import AddProduct from './components/Addproduct';
import Feed from './components/Feed';
import Landing from './components/Landing';
import Messages from './components/Messages';
import Cart from './components/Cart';
import Settings from './components/Settings';
import Journal from './components/Journal';
import Booths from './components/Booths';
import AdminPortal from './components/AdminPortal';
import SelfGrowth from './components/SelfGrowth';

const noNavbarPaths = ['/', '/signin', '/signup', '/booths', '/admin-glimmer'];
const fullWidthPaths = ['/messages', '/journal'];

const AppContent = () => {
  const location = useLocation();
  const showNavbar = !noNavbarPaths.some(p => location.pathname === p);
  const isFullWidth = fullWidthPaths.some(p => location.pathname.startsWith(p));

  return (
    <>
      {showNavbar && <Navbar />}
      <div className={showNavbar && !isFullWidth ? "container mt-4" : ""}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/booths" element={<Booths />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/:email" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:email" element={<Messages />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/admin-glimmer" element={<AdminPortal />} />
          <Route path="/selfgrowth" element={<SelfGrowth />} />
        </Routes>
import Shop from './components/Shop';
import Cart from './components/Cart';
import Notifications from './components/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  const hideNavbarPaths = ['/', '/signin', '/signup'];
  const hideBottomNavPaths = ['/', '/signin', '/signup'];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);
  const shouldShowBottomNav = !hideBottomNavPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <div className={shouldShowNavbar ? "container mt-4" : ""}>
       <Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/signin" element={<Signin />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  
  {/* THIS IS THE ONE THAT FIXES THE REDIRECT */}
  <Route path="/profile/:email" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
  
  {/* This is for when you click your own profile icon */}
  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
  
  <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
  <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>}/>
  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>}/>
  <Route path='/add-product' element={<ProtectedRoute><AddProduct /></ProtectedRoute>}/>

</Routes>

      </div>
      {shouldShowBottomNav && user.email && <BottomNav />}
    </>
  );
};

function App() {
  useEffect(() => {
    const saved = localStorage.getItem('glimmer_theme') || 'void';
    if (saved && saved !== 'void') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
