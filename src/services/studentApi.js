// src/services/studentApi.js
import apiService from './api';

export const studentApi = {
  getStudents: (classFilter = '') => {
    const token = localStorage.getItem('token');
    return apiService.getStudents(token, classFilter);
  },

  getStudent: (id) => {
    const token = localStorage.getItem('token');
    return apiService.request(`${apiService.endpoints.students}/${id}`, {
      headers: apiService.getAuthHeaders(token)
    });
  },

  createStudent: (studentData) => {
    const token = localStorage.getItem('token');
    return apiService.createStudent(token, studentData);
  },

  updateStudent: (id, studentData) => {
    const token = localStorage.getItem('token');
    return apiService.updateStudent(token, id, studentData);
  },

  deleteStudent: (id) => {
    const token = localStorage.getItem('token');
    return apiService.deleteStudent(token, id);
  },

  promoteStudents: (promotionData) => {
    const token = localStorage.getItem('token');
    return apiService.promoteStudents(token, promotionData);
  },

  getStudentSubjects: (studentId, academicYear) => {
    const token = localStorage.getItem('token');
    return apiService.getStudentSubjects(token, studentId, academicYear);
  },

  // Add this method to the studentApi object:
  assignStudentSubjects: (studentId, assignmentData) => {
    const token = localStorage.getItem('token');
    return apiService.request(`${apiService.endpoints.students}/${studentId}/subjects`, {
      method: 'POST',
      headers: apiService.getAuthHeaders(token),
      body: JSON.stringify(assignmentData)
    });
  },
};