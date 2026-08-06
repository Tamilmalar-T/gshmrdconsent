import React, { useState, useEffect, useRef } from 'react';
import { X, Menu, ChevronDown, LogOut, Settings, KeyRound, UserCircle2 } from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen, loggedInUser, onLogout, onNavigate }) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const user = loggedInUser || { userName: 'Guest', userType: 'Unknown', signatureImage: '' };

  // Generate initials from name
  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user.userName);

  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="brand-container">
          <div className="brand-logo-box">
            <span>GS</span>
          </div>
          <span className="brand-title">Gurushree</span>
          <span className="brand-badge">consent</span>
        </div>
      </div>

      <div className="header-right">
        <div className="status-badge">
          <span className="status-dot"></span>
          <span className="status-text">MRD Live</span>
        </div>

        <div className="user-profile-wrapper" ref={dropdownRef}>
          <button 
            className="user-profile-btn"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          >
            {/* Profile Image or Initials Avatar */}
            {user.signatureImage ? (
              <div className="avatar-circle avatar-img-wrap">
                <img
                  src={user.signatureImage}
                  alt={user.userName}
                  className="avatar-profile-img"
                />
              </div>
            ) : (
              <div className="avatar-circle">
                <span>{initials}</span>
              </div>
            )}

            <div className="header-user-meta">
              <span className="user-name">{user.userName}</span>
              <span className="user-role-badge">{user.userType}</span>
            </div>

            <ChevronDown 
              size={15} 
              className={`caret-icon ${profileDropdownOpen ? 'open' : ''}`} 
            />
          </button>

          {profileDropdownOpen && (
            <div className="profile-dropdown-menu">
              {/* User Info Card */}
              <div className="dropdown-user-card">
                {user.signatureImage ? (
                  <div className="dropdown-avatar-img-wrap">
                    <img
                      src={user.signatureImage}
                      alt={user.userName}
                      className="dropdown-avatar-img"
                    />
                  </div>
                ) : (
                  <div className="dropdown-avatar-initials">
                    <span>{initials}</span>
                  </div>
                )}
                <div className="dropdown-user-details">
                  <strong className="dropdown-user-name">{user.userName}</strong>
                  <span className="dropdown-user-type">{user.userType}</span>
                  {user.contact && (
                    <span className="dropdown-user-contact">📞 {user.contact}</span>
                  )}
                </div>
              </div>

              <div className="dropdown-divider" />

              <button 
                className="dropdown-item" 
                onClick={() => {
                  setProfileDropdownOpen(false);
                  if (onNavigate) onNavigate('login-details');
                }}
              >
                <Settings size={14} />
                <span>Login Details</span>
              </button>

              <div className="dropdown-divider" />

              <button 
                className="dropdown-item logout"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  if (onLogout) onLogout();
                }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
