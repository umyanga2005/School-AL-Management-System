// src/services/termAttendanceApi.js - IMPROVED VERSION
import apiService from './api';

export const termAttendanceApi = {
  // Get all classes
  getClasses: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getTermAttendanceClasses(token);
      
      // Handle different response structures
      if (response.success) {
        if (response.data && Array.isArray(response.data.data)) {
          return { success: true, data: response.data.data };
        } else if (Array.isArray(response.data)) {
          return { success: true, data: response.data };
        } else if (response.data && Array.isArray(response.data.classes)) {
          return { success: true, data: response.data.classes };
        }
      }
      
      console.error('Unexpected classes response format:', response);
      return { success: false, error: 'Invalid classes data format' };
    } catch (error) {
      console.error('Error fetching classes:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all terms
  getTerms: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getTermAttendanceTerms(token);
      
      // Handle different response structures
      if (response.success) {
        if (response.data && Array.isArray(response.data.data)) {
          return { success: true, data: response.data.data };
        } else if (Array.isArray(response.data)) {
          return { success: true, data: response.data };
        } else if (response.data && Array.isArray(response.data.terms)) {
          return { success: true, data: response.data.terms };
        }
      }
      
      console.error('Unexpected terms response format:', response);
      return { success: false, error: 'Invalid terms data format' };
    } catch (error) {
      console.error('Error fetching terms:', error);
      return { success: false, error: error.message };
    }
  },

  // Get active term
  getActiveTerm: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getTermAttendanceActiveTerm(token);
      
      if (response.success && response.data) {
        // Handle both nested and flat response structures
        const termData = response.data.data || response.data;
        if (termData) {
          return { success: true, data: termData };
        } else {
          return { success: false, error: response.error || 'No active term found' };
        }
      } else {
        return { success: false, error: response.error || 'No active term found' };
      }
    } catch (error) {
      console.error('Error fetching active term:', error);
      return { success: false, error: error.message };
    }
  },

  // Get academic years
  getAcademicYears: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getTermAttendanceYears(token);
      
      // Handle different response structures
      if (response.success) {
        if (response.data && Array.isArray(response.data.data)) {
          return { success: true, data: response.data.data };
        } else if (Array.isArray(response.data)) {
          return { success: true, data: response.data };
        } else if (response.data && Array.isArray(response.data.years)) {
          return { success: true, data: response.data.years };
        }
      }
      
      console.error('Unexpected years response format:', response);
      return { success: false, error: 'Invalid years data format' };
    } catch (error) {
      console.error('Error fetching academic years:', error);
      return { success: false, error: error.message };
    }
  },

  // Get students by class
  getStudentsByClass: async (className) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getTermAttendanceStudents(token, className);
      
      // Handle different response structures
      if (response.success) {
        if (response.data && Array.isArray(response.data.data)) {
          return { success: true, data: response.data.data };
        } else if (Array.isArray(response.data)) {
          return { success: true, data: response.data };
        } else if (response.data && Array.isArray(response.data.students)) {
          return { success: true, data: response.data.students };
        }
      }
      
      console.error('Unexpected students response format:', response);
      return { success: false, error: 'Invalid students data format' };
    } catch (error) {
      console.error('Error fetching students:', error);
      return { success: false, error: error.message };
    }
  },

  // Get term attendance data
  getTermAttendance: async (filters) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getTermAttendance(token, filters);
      
      if (response.success) {
        // Handle both nested and flat response structures
        const attendanceData = response.data.data || response.data || [];
        return { success: true, data: attendanceData };
      } else {
        return { success: false, error: response.error || 'Failed to fetch attendance' };
      }
    } catch (error) {
      console.error('Error fetching term attendance:', error);
      return { success: false, error: error.message };
    }
  },

  // Save term attendance (bulk)
  saveTermAttendance: async (attendanceRecords) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.saveTermAttendance(token, attendanceRecords);
      
      if (response.success) {
        return { 
          success: true, 
          data: response.data, 
          message: response.message || response.data?.message || 'Attendance saved successfully' 
        };
      } else {
        return { 
          success: false, 
          error: response.error || response.data?.error || 'Failed to save attendance' 
        };
      }
    } catch (error) {
      console.error('Error saving term attendance:', error);
      return { success: false, error: error.message };
    }
  },

  // Get attendance statistics
  getAttendanceStats: async (filters) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getTermAttendanceStats(token, filters);
      
      if (response.success) {
        // Handle both nested and flat response structures
        const statsData = response.data.data || response.data;
        return { success: true, data: statsData };
      } else {
        return { success: false, error: response.error || 'Failed to fetch attendance stats' };
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      return { success: false, error: error.message };
    }
  }
};