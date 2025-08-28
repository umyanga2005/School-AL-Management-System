// src/services/classApi.js - ADD getAll METHOD
import apiService from './api';

export const classApi = {
  // NEW: Add getAll method for backward compatibility
  getAll: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.request(apiService.endpoints.classes, {
        headers: apiService.getAuthHeaders(token)
      });
      
      if (!response.success) {
        console.error('Failed to get classes:', response.error);
        return { success: false, error: response.error };
      }
      
      return response; // This returns the full response object
    } catch (error) {
      console.error('Error in classApi.getAll:', error);
      return { success: false, error: error.message };
    }
  },

  getClasses: () => {
    const token = localStorage.getItem('token');
    return apiService.getClasses(token);
  },

  createClass: (classData) => {
    const token = localStorage.getItem('token');
    return apiService.createClass(token, classData);
  },

  updateClass: (classId, classData) => {
    const token = localStorage.getItem('token');
    return apiService.updateClass(token, classId, classData);
  },

  deleteClass: (classId) => {
    const token = localStorage.getItem('token');
    return apiService.deleteClass(token, classId);
  },

  getClassSubjects: (className, academicYear) => {
    const token = localStorage.getItem('token');
    return apiService.getClassSubjects(token, className, academicYear);
  },

  assignClassSubjects: (className, subjectData) => {
    const token = localStorage.getItem('token');
    return apiService.assignClassSubjects(token, className, subjectData);
  }
};