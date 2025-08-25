// src/services/subjectApi.js - Enhanced with getClassSubjects method
import apiService from './api';

export const subjectApi = {
  getSubjects: () => {
    const token = localStorage.getItem('token');
    return apiService.getSubjects(token);
  },

  createSubject: (subjectData) => {
    const token = localStorage.getItem('token');
    return apiService.createSubject(token, subjectData);
  },

  updateSubject: (id, subjectData) => {
    const token = localStorage.getItem('token');
    return apiService.updateSubject(token, id, subjectData);
  },

  deleteSubject: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('SubjectApi: Deleting subject with ID:', id);
      
      const response = await apiService.request(`${apiService.endpoints.subjects}/${id}`, {
        method: 'DELETE',
        headers: apiService.getAuthHeaders(token)
      });

      if (!response.success) {
        console.error('Subject deletion failed:', response.error);
        throw new Error(response.error || 'Failed to delete subject');
      }

      console.log('Subject deletion successful:', response);
      return response;

    } catch (error) {
      console.error('SubjectApi: Error in deleteSubject:', error);
      throw error;
    }
  },

  // Get subjects assigned to a specific student
  getStudentSubjects: async (studentId, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const url = academicYear 
        ? `${apiService.endpoints.subjects}/students/${studentId}/subjects?academic_year=${academicYear}`
        : `${apiService.endpoints.subjects}/students/${studentId}/subjects`;

      const response = await apiService.request(url, {
        headers: apiService.getAuthHeaders(token)
      });

      if (!response.success) {
        console.error('Failed to get student subjects:', response.error);
        throw new Error(response.error || 'Failed to get student subjects');
      }

      return response;

    } catch (error) {
      console.error('SubjectApi: Error in getStudentSubjects:', error);
      throw error;
    }
  },

  // NEW: Get subjects for a specific class
  getClassSubjects: async (className, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const url = academicYear 
        ? `${apiService.endpoints.subjects}/class/${className}?academic_year=${academicYear}`
        : `${apiService.endpoints.subjects}/class/${className}`;

      const response = await apiService.request(url, {
        headers: apiService.getAuthHeaders(token)
      });

      if (!response.success) {
        console.error('Failed to get class subjects:', response.error);
        throw new Error(response.error || 'Failed to get class subjects');
      }

      return response;

    } catch (error) {
      console.error('SubjectApi: Error in getClassSubjects:', error);
      throw error;
    }
  }
};