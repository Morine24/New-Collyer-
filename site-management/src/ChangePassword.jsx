import React, { useState } from 'react';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from './firebase';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password should be at least 6 characters long.');
      return;
    }
    setError('');

    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore(app);

    if (user) {
      try {
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Proceed with password update
        await updatePassword(user, newPassword);

        // Update mustChangePassword flag in Firestore
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          mustChangePassword: false,
        });

        navigate('/');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-hero">
        <h1 className="login-title">Change Your Password</h1>
        <p className="login-subtitle">Please choose a new password to continue.</p>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Current Password
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label>
          New Password
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Confirm New Password
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="login-btn">Set New Password</button>
      </form>
    </div>
  );
}
