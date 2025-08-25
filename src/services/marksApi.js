// src/services/marksApi.js - FIXED VERSION
import apiService from './api';

export const marksApi = {
  getMarks: (filters = {}) => {
    const token = localStorage.getItem('token');
    return apiService.getMarks(token, filters);
  },

  enterMarks: (marksData) => {
    const token = localStorage.getItem('token');
    return apiService.enterMarks(token, marksData);
  },

  updateMarks: (id, marksData) => {
    const token = localStorage.getItem('token');
    return apiService.updateMarks(token, id, marksData);
  },

  getStudentTermMarks: (studentId, termId) => {
    const token = localStorage.getItem('token');
    return apiService.getStudentTermMarks(token, studentId, termId);
  },

  // FIXED: Use the correct bulk endpoint that exists in backend
  bulkEnterMarks: async (bulkData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Use the correct endpoint that exists in your backend: /api/marks/bulk
      const response = await apiService.request(`${apiService.endpoints.marks}/bulk`, {
        method: 'POST',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify(bulkData)
      });

      if (!response.success) {
        console.error('Bulk marks entry failed:', response.error);
        throw new Error(response.error || 'Failed to save marks');
      }

      return response;

    } catch (error) {
      console.error('MarksApi: Error in bulkEnterMarks:', error);
      throw error;
    }
  },

  getGrades: () => {
    const token = localStorage.getItem('token');
    return apiService.getGrades(token);
  },

  getMarkHistory: (markId) => {
    const token = localStorage.getItem('token');
    return apiService.getMarkHistory(token, markId);
  },

  getMarkNotes: (markId) => {
    const token = localStorage.getItem('token');
    return apiService.getMarkNotes(token, markId);
  },

  addMarkNote: (markId, noteData) => {
    const token = localStorage.getItem('token');
    return apiService.addMarkNote(token, markId, noteData);
  },

  getMarkTemplates: (filters = {}) => {
    const token = localStorage.getItem('token');
    return apiService.getMarkTemplates(token, filters);
  },

  createMarkTemplate: (templateData) => {
    const token = localStorage.getItem('token');
    return apiService.createMarkTemplate(token, templateData);
  },

  applyMarkTemplate: (templateId, applicationData) => {
    const token = localStorage.getToken('token');
    return apiService.applyMarkTemplate(token, templateId, applicationData);
  }
};