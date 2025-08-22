class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL;

    this.endpoints = {
      auth: {
        login: `${this.baseURL}/auth/login`,
        verify: `${this.baseURL}/auth/verify`,
        changePassword: `${this.baseURL}/auth/change-password`
      },
      users: `${this.baseURL}/users`,
      attendance: `${this.baseURL}/attendance`
    };
  }

  getAuthHeaders(token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON response: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return { success: true, data, status: response.status };
    } catch (error) {
      console.error('API Request Error:', error);
      return { success: false, error: error.message };
    }
  }

  async login(credentials) {
    return this.request(this.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async verifyToken(token) {
    return this.request(this.endpoints.auth.verify, {
      method: 'POST',
      headers: this.getAuthHeaders(token)
    });
  }

  async changePassword(token, passwordData) {
    return this.request(this.endpoints.auth.changePassword, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(passwordData)
    });
  }

  async getUsers(token) {
    return this.request(this.endpoints.users, {
      headers: this.getAuthHeaders(token)
    });
  }

  async createUser(token, userData) {
    return this.request(this.endpoints.users, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(userData)
    });
  }

  async updateUserClass(token, userId, classData) {
    return this.request(`${this.endpoints.users}/${userId}/update-class`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(classData)
    });
  }

  async getAttendance(token) {
    return this.request(this.endpoints.attendance, {
      headers: this.getAuthHeaders(token)
    });
  }

  async createAttendance(token, attendanceData) {
    return this.request(this.endpoints.attendance, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(attendanceData)
    });
  }
}

const apiService = new ApiService();
export default apiService;
