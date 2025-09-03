// src/components/common/SystemStatus.jsx
import React, { useState, useEffect } from 'react';

const SystemStatus = () => {
  const [status, setStatus] = useState({
    online: false,
    loading: true,
    lastChecked: null,
    serverInfo: null
  });
  const [restarting, setRestarting] = useState(false);

  // Get API base URL from environment or default
  const getApiBaseUrl = () => {
    if (process.env.REACT_APP_API_BASE_URL) {
      return process.env.REACT_APP_API_BASE_URL;
    }
    
    // Auto-detect based on current location
    const { protocol, hostname } = window.location;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:5000/api`;
    }
    
    // For Vercel or other deployments, assume API is at /api
    return '/api';
  };

  const checkSystemHealth = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        setStatus({
          online: true,
          loading: false,
          lastChecked: new Date(),
          serverInfo: {
            status: data.status,
            environment: data.environment,
            timestamp: data.timestamp
          }
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus({
        online: false,
        loading: false,
        lastChecked: new Date(),
        serverInfo: null
      });
    }
  };

  const restartServices = async () => {
    if (restarting) return;
    
    setRestarting(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      
      // Show immediate feedback
      setStatus(prev => ({ ...prev, loading: true }));
      
      const response = await fetch(`${apiBaseUrl}/system/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (response.ok) {
        // Wait a moment for services to restart
        setTimeout(() => {
          checkSystemHealth();
        }, 3000);
        
        alert('Service restart initiated. Please wait a moment...');
      } else {
        throw new Error(`Restart failed: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Restart failed:', error);
      alert('Failed to restart services. Please try again or contact administrator.');
      
      // Still check health after failed restart attempt
      setTimeout(checkSystemHealth, 2000);
    } finally {
      setRestarting(false);
    }
  };

  // Initial health check
  useEffect(() => {
    checkSystemHealth();
    
    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatLastChecked = () => {
    if (!status.lastChecked) return 'Never';
    
    const now = new Date();
    const diff = Math.floor((now - status.lastChecked) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return status.lastChecked.toLocaleTimeString();
  };

  return (
    <div className="system-status-container">
      <div className="system-status-glass">
        <div className="status-header">
          <div className={`status-indicator ${status.loading ? 'loading' : status.online ? 'online' : 'offline'}`}>
            <div className="status-dot"></div>
            <span className="status-text">
              {status.loading ? 'Checking...' : status.online ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <button 
            className={`restart-btn ${restarting ? 'restarting' : ''}`}
            onClick={restartServices}
            disabled={restarting}
            title="Restart Services"
          >
            {restarting ? '⟳' : '↻'}
          </button>
        </div>
        
        <div className="status-details">
          <div className="detail-item">
            <span className="detail-label">Last Check:</span>
            <span className="detail-value">{formatLastChecked()}</span>
          </div>
          
          {status.serverInfo && (
            <div className="detail-item">
              <span className="detail-label">Environment:</span>
              <span className="detail-value">{status.serverInfo.environment}</span>
            </div>
          )}
          
          <div className="detail-item">
            <span className="detail-label">API:</span>
            <span className="detail-value api-url">{getApiBaseUrl()}</span>
          </div>
        </div>
        
        <div className="status-actions">
          <button 
            className="refresh-btn"
            onClick={checkSystemHealth}
            disabled={status.loading}
            title="Refresh Status"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;