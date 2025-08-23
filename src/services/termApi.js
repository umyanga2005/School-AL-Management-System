// src/services/termApi.js
import apiService from './api';

export const termApi = {
  getTerms: () => {
    const token = localStorage.getItem('token');
    return apiService.getTerms(token);
  },

  getCurrentTerm: () => {
    const token = localStorage.getItem('token');
    return apiService.getCurrentTerm(token);
  },

  createTerm: (termData) => {
    const token = localStorage.getItem('token');
    return apiService.createTerm(token, termData);
  }
};