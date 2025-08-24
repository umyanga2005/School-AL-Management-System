// src/services/subjectApi.js - Add delete method
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

  // ADD: Delete subject method
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
      throw error; // Re-throw to let the component handle it
    }
  }
};