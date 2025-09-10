// src/services/termAttendanceApi.js - FIXED VERSION
import apiService from './api';

export const termAttendanceApi = {
  // Get all classes (from students table)
  getClasses: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getTermAttendanceClasses(token);
      
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

  // Get term attendance data with filters (term_id, class, academic_year)
  getTermAttendance: async (filters) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.getTermAttendance(token, filters);
      
      if (response.success) {
        let attendanceData = response.data;
        
        // If data is nested, extract it
        if (attendanceData && attendanceData.data && Array.isArray(attendanceData.data)) {
          attendanceData = attendanceData.data;
        } else if (!Array.isArray(attendanceData)) {
          if (attendanceData && Array.isArray(attendanceData.attendance)) {
            attendanceData = attendanceData.attendance;
          } else {
            console.warn('Unexpected attendance data format:', attendanceData);
            attendanceData = [];
          }
        }

        return { success: true, data: attendanceData };
      } else {
        return { success: false, error: response.error || 'Failed to fetch attendance', data: [] };
      }
    } catch (error) {
      console.error('Error in getTermAttendance:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Save term attendance (bulk)
  saveTermAttendance: async (attendanceRecords) => {
  try {
    const token = localStorage.getItem('token');
    const response = await apiService.createTermAttendance(token, attendanceRecords);
      
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

  // Update single attendance record
  updateTermAttendance: async (recordId, attendanceData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.request(`${apiService.baseURL}/api/term-attendance/${recordId}`, {
        method: 'PUT',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify(attendanceData)
      });

      if (response.success) {
        return { success: true, data: response.data, message: 'Attendance updated successfully' };
      } else {
        return { success: false, error: response.error || 'Failed to update attendance' };
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete attendance record
  deleteTermAttendance: async (recordId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.request(`${apiService.baseURL}/api/term-attendance/${recordId}`, {
        method: 'DELETE',
        headers: apiService.getAuthHeaders(token)
      });

      if (response.success) {
        return { success: true, message: 'Attendance record deleted successfully' };
      } else {
        return { success: false, error: response.error || 'Failed to delete attendance record' };
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      return { success: false, error: error.message };
    }
  },

  // Get attendance statistics
  getAttendanceStats: async (filters) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const url = `${apiService.endpoints.termAttendance}/stats?${params.toString()}`;
      const response = await apiService.request(url, {
        headers: apiService.getAuthHeaders(token)
      });

      if (response.success) {
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