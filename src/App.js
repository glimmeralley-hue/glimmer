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

const AppContent = () => {
  const location = useLocation();
  const hideNavbarPaths = ['/', '/signin', '/signup'];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <div className={shouldShowNavbar ? "container mt-4" : ""}>
       <Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/signin" element={<Signin />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/dashboard" element={<Dashboard />} />
  
  {/* THIS IS THE ONE THAT FIXES THE REDIRECT */}
  <Route path="/profile/:email" element={<Profile />} />
  
  {/* This is for when you click your own profile icon */}
  <Route path="/profile" element={<Profile />} />
  
  <Route path='/add-product' element={<AddProduct/>}/>
  <Route path='/feed' element={<Feed/>}/>
  <Route path="/profile/:email" element={<Profile />} />
<Route path="/profile" element={<Profile />} /> 

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
