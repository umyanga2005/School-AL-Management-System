// src/services/marksApi.js - UPDATED
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
    const token = localStorage.getItem('token');
    return apiService.applyMarkTemplate(token, templateId, applicationData);
  }
};