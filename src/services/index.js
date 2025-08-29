// src/services/index.js - COMPLETE EXPORTS
import apiService from './api';
import { studentApi } from './studentApi';
import { subjectApi } from './subjectApi';
import { termApi } from './termApi';
import { marksApi } from './marksApi';
import { reportApi } from './reportApi';
import { savedReportsApi } from './savedReportsApi'; 

// Create classApi if it doesn't exist
const classApi = {
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

export {
  apiService,
  studentApi,
  subjectApi,
  termApi,
  marksApi,
  classApi,
  reportApi,
  savedReportsApi
};
