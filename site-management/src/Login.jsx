import React, { useState } from 'react';
import './Login.css';
import '../node_modules/@fontsource/quicksand/index.css';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { app } from './firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setError('');
    const auth = getAuth(app);
    const db = getFirestore(app);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user data from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role;
        const mustChangePassword = userData.mustChangePassword; // Get from Firestore

        if (mustChangePassword) {
          navigate('/change-password');
        } else {
          switch (userRole) {
            case 'Manager':
              navigate('/admin');
              break;
            case 'Stock Clerk':
              navigate('/stock-clerk');
              break;
            case 'Foreman':
              navigate('/foreman-dashboard');
              break;
            default:
              navigate('/user-dashboard');
          }
        }
      } else {
        // If user data not found in Firestore, but authenticated, redirect to a default page
        // or handle as an error. For now, redirect to user-dashboard.
        navigate('/user-dashboard');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-hero">
        <div className="login-logo">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="60" rx="12" fill="#FFD600" />
            <path d="M15 45L30 15L45 45H15Z" fill="#111" />
          </svg>
        </div>
        <h1 className="login-title">Site Management</h1>
        <p className="login-subtitle">Welcome! Please log in to continue.</p>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="login-btn">Login</button>
        <div className="register-link">
          <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
}