// src/services/index.js - UPDATED WITH TERM ATTENDANCE API
import apiService from './api';
import { studentApi } from './studentApi';
import { subjectApi } from './subjectApi';
import { termApi } from './termApi';
import { marksApi } from './marksApi';
import { reportApi } from './reportApi';
import { savedReportsApi } from './savedReportsApi'; 
import { dashboardApi } from './dashboardApi';
import { studentAttendanceApi } from './studentAttendanceApi';

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

// NEW: Term Attendance API
const termAttendanceApi = {
  // Get all classes (from students table)
  getClasses: () => {
    const token = localStorage.getItem('token');
    return apiService.getStudents(token);
  },

  // Get all terms
  getTerms: () => {
    const token = localStorage.getItem('token');
    return apiService.getTerms(token);
  },

  // Get students by class
  getStudentsByClass: (className) => {
    const token = localStorage.getItem('token');
    return apiService.getStudents(token, className);
  },

  // Get term attendance data
  getTermAttendance: (filters) => {
    const token = localStorage.getItem('token');
    return apiService.getTermAttendance(token, filters);
  },

  // Save term attendance (bulk)
  saveTermAttendance: (attendanceRecords) => {
    const token = localStorage.getItem('token');
    return apiService.bulkCreateTermAttendance(token, attendanceRecords);
  },

  // Update single term attendance record
  updateTermAttendance: (recordId, attendanceData) => {
    const token = localStorage.getItem('token');
    return apiService.updateTermAttendance(token, recordId, attendanceData);
  },

  // Delete term attendance record
  deleteTermAttendance: (recordId) => {
    const token = localStorage.getItem('token');
    return apiService.deleteTermAttendance(token, recordId);
  },

  // Get attendance statistics
  getAttendanceStats: (filters) => {
    const token = localStorage.getItem('token');
    return apiService.getTermAttendanceStats(token, filters);
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
  savedReportsApi,
  dashboardApi,
  termAttendanceApi,  // NEW EXPORT
  studentAttendanceApi
};