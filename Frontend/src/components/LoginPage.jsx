import React, { useState } from 'react';
import { Lock, User, AlertCircle, ShieldAlert, Eye, EyeOff } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!userId.trim() || !password.trim()) {
      setErrorMsg('Please enter both User ID and Password.');
      return;
    }

    // Load users from localStorage (or fallback to INITIAL_USERS if not in storage yet)
    const storedUsers = localStorage.getItem('masters_users');
    let usersList = [];

    if (storedUsers) {
      usersList = JSON.parse(storedUsers);
      
      // Ensure the default admin 'mrd' always exists in the system so users don't get locked out.
      if (!usersList.some(u => (u.userId || '').toLowerCase() === 'mrd')) {
        usersList.push({ userId: 'mrd', userName: 'MRD Admin', userType: 'Admin', password: '123', status: 'Active', signatureImage: '' });
        localStorage.setItem('masters_users', JSON.stringify(usersList));
      }
    } else {
      // Fallback seeds
      usersList = [
        { userId: 'mrd', userName: 'MRD Admin', userType: 'Admin', password: '123', status: 'Active' },
        { userId: 'ramesh02', userName: 'Dr. Ramesh', userType: 'Doctor', password: 'password', status: 'Active' },
        { userId: 'suresh03', userName: 'Dr. Suresh', userType: 'Doctor', password: 'password', status: 'Active' },
        { userId: 'kavitha04', userName: 'Dr. Kavitha', userType: 'Doctor', password: 'password', status: 'Active' }
      ];
      localStorage.setItem('masters_users', JSON.stringify(usersList));
    }

    const matchedUser = usersList.find(
      (u) => (u.userId || '').trim().toLowerCase() === userId.trim().toLowerCase()
    );

    if (!matchedUser) {
      setErrorMsg('Invalid User ID or Password. (User ID not found)');
      return;
    }

    if ((matchedUser.status || '').toLowerCase() !== 'active') {
      setErrorMsg('This user account is inactive. Please contact the administrator.');
      return;
    }

    if (matchedUser.password !== password) {
      setErrorMsg('Invalid User ID or Password. (Password mismatch)');
      return;
    }

    // Success! Pass logged-in user up
    onLoginSuccess(matchedUser);
  };

  return (
    <div className="login-page-container">
      <div className="login-card-backdrop"></div>
      <div className="login-card">
        
        {/* Brand/Header Logo */}
        <div className="login-brand-header">
          <div className="login-brand-logo-box">
            <span>GS</span>
          </div>
          <h2 className="login-brand-title">Gurushree Hospital</h2>
          <p className="login-brand-subtitle">Consent & Clinical Records Portal</p>
        </div>

        {/* Banner error if invalid */}
        {errorMsg && (
          <div className="login-error-banner">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field-group">
            <label className="login-label">User ID</label>
            <div className="login-input-wrapper">
              <User className="login-input-icon" size={16} />
              <input
                type="text"
                placeholder="Enter User ID (e.g. admin01)"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setErrorMsg('');
                }}
                className="login-input-field"
                required
              />
            </div>
          </div>

          <div className="login-field-group">
            <label className="login-label">Password</label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                className="login-input-field"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 12px', color: '#64748b' }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn">
            Log In Securely
          </button>
        </form>

        <div className="login-footer-info">
          <ShieldAlert size={12} style={{ marginRight: '4px' }} />
          <span>Authorized Clinical Personnel Only</span>
        </div>

      </div>
    </div>
  );
}
