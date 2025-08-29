// src/services/classApi.js
import apiService from './api';

export const classApi = {
  getClasses: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(`${apiService.endpoints.classes}`, {
        headers: apiService.getAuthHeaders(token)
      });

      if (!response.success) {
        console.error('Failed to get classes:', response.error);
        throw new Error(response.error || 'Failed to get classes');
      }

      return response;
    } catch (error) {
      console.error('ClassApi: Error in getClasses:', error);
      throw error;
    }
  },

  getClassSubjects: (className) => {
    const token = localStorage.getItem('token');
    return apiService.getClassSubjects(token, className);
  },

  assignClassSubjects: (className, subjectData) => {
    const token = localStorage.getItem('token');
    return apiService.assignClassSubjects(token, className, subjectData);
  }
};