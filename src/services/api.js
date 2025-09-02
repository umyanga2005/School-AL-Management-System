// src/services/api.js - FIXED BULK MARKS ENDPOINT
class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || '';

    this.endpoints = {
      auth: {
        login: `${this.baseURL}/auth/login`,
        verify: `${this.baseURL}/auth/verify`,
        changePassword: `${this.baseURL}/auth/change-password`,
        register: `${this.baseURL}/auth/register`
      },
      users: `${this.baseURL}/users`,
      attendance: `${this.baseURL}/attendance`,
      students: `${this.baseURL}/students`,
      subjects: `${this.baseURL}/subjects`,
      terms: `${this.baseURL}/terms`,
      marks: `${this.baseURL}/marks`,
      classes: `${this.baseURL}/classes`,
      reports: `${this.baseURL}/reports`,
      savedReports: `${this.baseURL}/saved-reports`
    };
  }

  getAuthHeaders(token) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async request(url, options = {}) {
    try {
      // Get token from localStorage if not provided in headers
      let token = localStorage.getItem('token');
      if (options.headers && options.headers.Authorization) {
        token = options.headers.Authorization.replace('Bearer ', '');
      }
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(token),
          ...options.headers
        }
      });

      const text = await response.text();
      let data = {};
      
      // Try to parse JSON only if there's content
      if (text && text.trim() !== '') {
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('JSON parse error:', e, 'Response text:', text);
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
        }
      }

      if (!response.ok) {
        // Handle different error response formats
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return { 
        success: true, 
        data, 
        status: response.status 
      };
    } catch (error) {
      console.error('API Request Error:', error);
      return { 
        success: false, 
        error: error.message,
        status: error.status || 0
      };
    }
  }

  // Auth methods
  async login(credentials) {
    return this.request(this.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData) {
    return this.request(this.endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData)
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

  // User management methods
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

  async updateUser(token, userId, userData) {
    return this.request(`${this.endpoints.users}/${userId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(token, userId) {
    return this.request(`${this.endpoints.users}/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token)
    });
  }

  async updateUserClass(token, userId, classData) {
    return this.request(`${this.endpoints.users}/${userId}/update-class`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(classData)
    });
  }

  // Attendance methods
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

  // Student management methods
  async getStudents(token, classFilter = '', page = 1, limit = 10, yearFilter = '') {
    const params = new URLSearchParams();
    
    if (classFilter) {
      params.append('class', classFilter);
    }
    
    if (page) {
      params.append('page', page);
    }
    
    if (limit) {
      params.append('limit', limit);
    }
    
    if (yearFilter) {
      params.append('admission_year', yearFilter);
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `${this.endpoints.students}?${queryString}`
      : this.endpoints.students;
    
    return this.request(url, {
      headers: this.getAuthHeaders(token)
    });
  }

  async createStudent(token, studentData) {
    return this.request(this.endpoints.students, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(studentData)
    });
  }

  async updateStudent(token, studentId, studentData) {
    return this.request(`${this.endpoints.students}/${studentId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(studentData)
    });
  }

  async deleteStudent(token, studentId) {
    return this.request(`${this.endpoints.students}/${studentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token)
    });
  }

  async promoteStudents(token, promotionData) {
    return this.request(`${this.endpoints.students}/promote-class`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(promotionData)
    });
  }

  // Method needed by StudentForm.jsx - Assign subjects by index_number
  async assignStudentSubjectsByIndexNumber(token, indexNumber, subjectIds, academicYear) {
    return this.request(`${this.endpoints.students}/subjects/assign-by-index`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({
        index_number: indexNumber,
        subject_ids: subjectIds,
        academic_year: academicYear
      })
    });
  }

  // Subject management methods
  async getSubjects(token) {
    return this.request(this.endpoints.subjects, {
      headers: this.getAuthHeaders(token)
    });
  }

  async createSubject(token, subjectData) {
    return this.request(this.endpoints.subjects, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(subjectData)
    });
  }

  async updateSubject(token, subjectId, subjectData) {
    return this.request(`${this.endpoints.subjects}/${subjectId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(subjectData)
    });
  }

  async deleteSubject(token, subjectId) {
    return this.request(`${this.endpoints.subjects}/${subjectId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token)
    });
  }

  async getStudentSubjects(token, studentId, academicYear) {
    const url = academicYear
      ? `${this.endpoints.subjects}/students/${studentId}/subjects?academic_year=${academicYear}`
      : `${this.endpoints.subjects}/students/${studentId}/subjects`;
    
    return this.request(url, {
      headers: this.getAuthHeaders(token)
    });
  }

  async assignStudentSubjects(token, studentId, assignmentData) {
    return this.request(`${this.endpoints.subjects}/students/${studentId}/subjects`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(assignmentData)
    });
  }

  // Term management methods
  async getTerms(token) {
    return this.request(this.endpoints.terms, {
      headers: this.getAuthHeaders(token)
    });
  }

  async getCurrentTerm(token) {
    return this.request(`${this.endpoints.terms}/current`, {
      headers: this.getAuthHeaders(token)
    });
  }

  async createTerm(token, termData) {
    return this.request(this.endpoints.terms, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(termData)
    });
  }

  // Marks management methods
  async getMarks(token, filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const url = `${this.endpoints.marks}?${params.toString()}`;
    return this.request(url, {
      headers: this.getAuthHeaders(token)
    });
  }

  async enterMarks(token, marksData) {
    return this.request(this.endpoints.marks, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(marksData)
    });
  }

  async updateMarks(token, marksId, marksData) {
    return this.request(`${this.endpoints.marks}/${marksId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(marksData)
    });
  }

  async deleteMark(token, markId) {
    return this.request(`${this.endpoints.marks}/${markId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token)
    });
  }

  async getStudentTermMarks(token, studentId, termId) {
    return this.request(`${this.endpoints.marks}/student/${studentId}/term/${termId}`, {
      headers: this.getAuthHeaders(token)
    });
  }

  // FIXED: Use the correct bulk endpoint that matches your backend
  async bulkEnterMarks(token, bulkData) {
    return this.request(`${this.endpoints.marks}/bulk`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(bulkData)
    });
  }

  // Class management methods
  async getClasses(token) {
    return this.request(this.endpoints.classes, {
      headers: this.getAuthHeaders(token)
    });
  }

  async createClass(token, classData) {
    return this.request(this.endpoints.classes, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(classData)
    });
  }

  async updateClass(token, classId, classData) {
    return this.request(`${this.endpoints.classes}/${classId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(classData)
    });
  }

  async deleteClass(token, classId) {
    return this.request(`${this.endpoints.classes}/${classId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token)
    });
  }

  // Class-subject methods
  async getClassSubjects(token, className, academicYear) {
    const url = academicYear
      ? `${this.endpoints.subjects}/class/${className}?academic_year=${academicYear}`
      : `${this.endpoints.subjects}/class/${className}`;
    
    return this.request(url, {
      headers: this.getAuthHeaders(token)
    });
  }

  async assignClassSubjects(token, className, subjectData) {
    return this.request(`${this.endpoints.classes}/${className}/subjects`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(subjectData)
    });
  }

  // Report methods
  async getReports(token, filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const url = `${this.endpoints.reports}?${params.toString()}`;
    return this.request(url, {
      headers: this.getAuthHeaders(token)
    });
  }

  async generateReport(token, reportData) {
    return this.request(`${this.endpoints.reports}/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(reportData)
    });
  }

  async exportReport(token, reportId, format = 'pdf') {
    return this.request(`${this.endpoints.reports}/${reportId}/export?format=${format}`, {
      headers: this.getAuthHeaders(token)
    });
  }

  // Grade methods
  async getGrades(token) {
    return this.request(`${this.endpoints.marks}/grades`, {
      headers: this.getAuthHeaders(token)
    });
  }

  // Mark history methods
  async getMarkHistory(token, markId) {
    return this.request(`${this.endpoints.marks}/${markId}/history`, {
      headers: this.getAuthHeaders(token)
    });
  }

  // Mark note methods
  async getMarkNotes(token, markId) {
    return this.request(`${this.endpoints.marks}/${markId}/notes`, {
      headers: this.getAuthHeaders(token)
    });
  }

  async addMarkNote(token, markId, noteData) {
    return this.request(`${this.endpoints.marks}/${markId}/notes`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(noteData)
    });
  }

  // Template methods
  async getMarkTemplates(token, filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const url = `${this.endpoints.marks}/templates?${params.toString()}`;
    return this.request(url, {
      headers: this.getAuthHeaders(token)
    });
  }

  async createMarkTemplate(token, templateData) {
    return this.request(`${this.endpoints.marks}/templates`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(templateData)
    });
  }

  async applyMarkTemplate(token, templateId, applicationData) {
    return this.request(`${this.endpoints.marks}/templates/${templateId}/apply`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(applicationData)
    });
  }
}

const apiService = new ApiService();
export default apiService;
