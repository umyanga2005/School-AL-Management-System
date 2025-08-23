// src/services/subjectApi.js
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
  }
};