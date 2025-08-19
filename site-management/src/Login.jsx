
import React, { useState } from 'react';
import './Login.css';
import '../node_modules/@fontsource/quicksand/index.css';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from './firebase';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }
    setError('');
    const auth = getAuth(app);
    try {
      await signInWithEmailAndPassword(auth, username, password);
      alert('Login successful!');
      // TODO: Redirect to dashboard or home page
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
          Username
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
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
          <a href="#" onClick={() => window.location.href = '/register'}>Register</a>
        </div>
      </form>
    </div>
  );
}
