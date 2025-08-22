// components/auth/ChangePasswordForm.jsx
import React, { useState } from 'react';
import { User } from 'lucide-react';
import apiService from '../../services/api';
import { validators } from '../../utils';

const ChangePasswordForm = ({ currentUser, onPasswordChanged }) => {
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) {
      alert('Please fill in both password fields');
      return;
    }

    if (!validators.isValidPassword(passwords.new)) {
      alert('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const passwordData = {
        username: currentUser.username,
        currentPassword: passwords.current,
        newPassword: passwords.new
      };

      const result = await apiService.changePassword(currentUser.token, passwordData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      alert('Password changed successfully!');
      
      // Update user object and redirect to role-based dashboard
      const updatedUser = { ...currentUser, tempPassword: false };
      onPasswordChanged(updatedUser, updatedUser.role);
      
    } catch (err) {
      console.error('Password change error:', err);
      alert(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon"><User size={32} /></div>
          <h2>Change Temporary Password</h2>
          <p>Welcome, {currentUser?.name}! Please set a new password.</p>
        </div>
        
        <div className="form-group">
          <label>Current Password</label>
          <input 
            type="password" 
            value={passwords.current} 
            onChange={e => setPasswords({...passwords, current: e.target.value})} 
            onKeyPress={e => e.key === 'Enter' && handleChangePassword()}
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>New Password</label>
          <input 
            type="password" 
            value={passwords.new} 
            onChange={e => setPasswords({...passwords, new: e.target.value})} 
            onKeyPress={e => e.key === 'Enter' && handleChangePassword()}
            autoComplete="new-password"
            minLength="6"
            disabled={loading}
          />
        </div>
        
        <button onClick={handleChangePassword} className="login-btn" disabled={loading}>
          {loading ? 'Changing Password...' : 'Save New Password'}
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordForm;