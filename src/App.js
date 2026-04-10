import React from 'react';
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
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
