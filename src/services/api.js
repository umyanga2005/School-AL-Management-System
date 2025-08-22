// services/api.js
class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL;
    this.endpoints = {
      auth: {
        login: process.env.REACT_APP_AUTH_LOGIN_URL,
        verify: process.env.REACT_APP_AUTH_VERIFY_URL,
        changePassword: process.env.REACT_APP_AUTH_CHANGE_PASSWORD_URL
      },
      users: process.env.REACT_APP_USERS_URL,
      attendance: process.env.REACT_APP_ATTENDANCE_URL
    };
  }

  // Helper method to get auth headers
  getAuthHeaders(token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Generic request method
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return { success: true, data, status: response.status };
    } catch (error) {
      console.error('API Request Error:', error);
      return { success: false, error: error.message };
    }
  }

  // Authentication methods
  async login(credentials) {
    return await this.request(this.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async verifyToken(token) {
    return await this.request(this.endpoints.auth.verify, {
      method: 'POST',
      headers: this.getAuthHeaders(token)
    });
  }

  async changePassword(token, passwordData) {
    return await this.request(this.endpoints.auth.changePassword, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(passwordData)
    });
  }

  // User management methods
  async getUsers(token) {
    return await this.request(this.endpoints.users, {
      headers: this.getAuthHeaders(token)
    });
  }

  async createUser(token, userData) {
    return await this.request(this.endpoints.users, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(userData)
    });
  }

  async updateUserClass(token, userId, classData) {
    return await this.request(`${this.endpoints.users}/${userId}/update-class`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(classData)
    });
  }

  // Attendance methods
  async getAttendance(token) {
    return await this.request(this.endpoints.attendance, {
      headers: this.getAuthHeaders(token)
    });
  }

  async createAttendance(token, attendanceData) {
    return await this.request(this.endpoints.attendance, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(attendanceData)
    });
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;