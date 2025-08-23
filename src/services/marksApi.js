// src/services/marksApi.js
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

  bulkEnterMarks: (bulkData) => {
    const token = localStorage.getItem('token');
    return apiService.bulkEnterMarks(token, bulkData);
  }
};