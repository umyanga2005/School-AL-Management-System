// components/layout/Header.jsx
import React from 'react';
import { Users, LogOut } from 'lucide-react';

const Header = ({ currentUser, onLogout }) => {
  return (
    <div className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="header-icon"><Users size={20} /></div>
          <div className="header-info">
            <h1>Attendance System</h1>
            <p>
              {currentUser?.name} • {currentUser?.role?.charAt(0).toUpperCase() + currentUser?.role?.slice(1)}
            </p>
          </div>
        </div>
        <button onClick={onLogout} className="logout-btn">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Header;