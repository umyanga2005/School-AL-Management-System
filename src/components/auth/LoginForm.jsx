// components/auth/LoginForm.jsx
import React, { useState } from 'react';
import apiService from '../../services/api';
import { APP_CONFIG } from '../../utils';

const LoginForm = ({ onLoginSuccess, loading, setLoading }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleLogin = async () => {
    if (!credentials.username || !credentials.password) {
      alert('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.login(credentials);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const { data } = result;
      console.log('Login response:', data);

      if (data.requireChange) {
        // User needs to change temporary password
        alert('You must change your temporary password first');
        onLoginSuccess({ 
          ...data.user, 
          token: data.token,
          tempPassword: true 
        }, 'change-password');
      } else {
        // Normal login - set user with token and redirect to role-based view
        const userWithToken = {
          ...data.user,
          id: parseInt(data.user.id), // Convert to integer for consistency
          token: data.token
        };
        console.log('Login successful, user ID:', userWithToken.id, 'Type:', typeof userWithToken.id);
        onLoginSuccess(userWithToken, data.user.role);
      }
    } catch (err) {
      console.error('Login error:', err);
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <img 
              src="logo.png" 
              width="75px" 
              height="75px"
              alt="School Logo"
            />
          </div>
          <h1>{APP_CONFIG.schoolName}</h1>
          <p>Management System</p>
          <div className="connection-status">
            {loading ? 'Connecting to server...' : ''}
          </div>
        </div>
        
        <div className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={credentials.username} 
              onChange={e => setCredentials({ ...credentials, username: e.target.value })} 
              disabled={loading}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              autoComplete="username"
              inputMode="text"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={credentials.password} 
              onChange={e => setCredentials({ ...credentials, password: e.target.value })} 
              disabled={loading}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
            />
          </div>
          
          <button onClick={handleLogin} disabled={loading} className="login-btn">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          
          {APP_CONFIG.debugMode && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px', 
              fontSize: '12px', 
              color: '#666' 
            }}>
              <p><strong>Demo Credentials:</strong></p>
              <p>Coordinator: coordinator / coordinator</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
