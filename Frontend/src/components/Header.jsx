import React, { useState } from 'react';
import { X, Menu, ChevronDown, User, Activity } from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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

        <div className="user-profile-wrapper">
          <button 
            className="user-profile-btn"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          >
            <div className="avatar-circle">
              <span>SA</span>
            </div>
            <span className="user-name">Sadhana Admin (Admin)</span>
            <ChevronDown size={16} className={`caret-icon ${profileDropdownOpen ? 'open' : ''}`} />
          </button>

          {profileDropdownOpen && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-user-info">
                <strong>Sadhana Admin</strong>
                <p>Role: Hospital Administrator</p>
                <p>Dept: MRD Section</p>
              </div>
              <hr />
              <button className="dropdown-item">Account Settings</button>
              <button className="dropdown-item">Change Password</button>
              <hr />
              <button className="dropdown-item logout">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
