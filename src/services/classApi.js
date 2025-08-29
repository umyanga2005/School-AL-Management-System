// src/services/classApi.js
import apiService from './api';

export const classApi = {
  getClasses: () => {
    const token = localStorage.getItem('token');
    return apiService.getClasses(token);
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