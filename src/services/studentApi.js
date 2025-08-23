// src/services/studentApi.js - FIXED VERSION
import apiService from './api';

export const studentApi = {
  getStudents: async (classFilter = '') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const url = classFilter 
        ? `${apiService.endpoints.students}?class=${encodeURIComponent(classFilter)}`
        : apiService.endpoints.students;
      
      const response = await apiService.request(url, {
        headers: apiService.getAuthHeaders(token)
      });

      return response;
    } catch (error) {
      console.error('Error in getStudents:', error);
      return { success: false, error: error.message };
    }
  },

  getStudent: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      return await apiService.request(`${apiService.endpoints.students}/${id}`, {
        headers: apiService.getAuthHeaders(token)
      });
    } catch (error) {
      console.error('Error in getStudent:', error);
      return { success: false, error: error.message };
    }
  },

  createStudent: async (studentData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      return await apiService.request(apiService.endpoints.students, {
        method: 'POST',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify(studentData)
      });
    } catch (error) {
      console.error('Error in createStudent:', error);
      return { success: false, error: error.message };
    }
  },

  updateStudent: async (id, studentData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      return await apiService.request(`${apiService.endpoints.students}/${id}`, {
        method: 'PUT',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify(studentData)
      });
    } catch (error) {
      console.error('Error in updateStudent:', error);
      return { success: false, error: error.message };
    }
  },

  deleteStudent: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      return await apiService.request(`${apiService.endpoints.students}/${id}`, {
        method: 'DELETE',
        headers: apiService.getAuthHeaders(token)
      });
    } catch (error) {
      console.error('Error in deleteStudent:', error);
      return { success: false, error: error.message };
    }
  },

  promoteStudents: async (promotionData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      return await apiService.request(`${apiService.endpoints.students}/promote-class`, {
        method: 'POST',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify(promotionData)
      });
    } catch (error) {
      console.error('Error in promoteStudents:', error);
      return { success: false, error: error.message };
    }
  },

  getStudentSubjects: async (studentId, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const url = academicYear
        ? `${apiService.endpoints.subjects}/students/${studentId}/subjects?academic_year=${academicYear}`
        : `${apiService.endpoints.subjects}/students/${studentId}/subjects`;
      
      return await apiService.request(url, {
        headers: apiService.getAuthHeaders(token)
      });
    } catch (error) {
      console.error('Error in getStudentSubjects:', error);
      return { success: false, error: error.message };
    }
  },

  // src/services/studentApi.js - UPDATE THE assignStudentSubjects METHOD
  assignStudentSubjects: async (studentId, assignmentData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      // Make sure this endpoint matches your backend route
      return await apiService.request(`${apiService.endpoints.students}/${studentId}/subjects`, {
        method: 'POST',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify(assignmentData)
      });
    } catch (error) {
      console.error('Error in assignStudentSubjects:', error);
      return { success: false, error: error.message };
    }
  },
};