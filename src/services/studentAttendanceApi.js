// src/services/studentAttendanceApi.js - COMPLETE UPDATED VERSION
import apiService from './api';

export const studentAttendanceApi = {
  // Get term attendance for a specific student
  getStudentTermAttendance: async (studentId, termId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}/student/${studentId}/term/${termId}`,
        {
          headers: apiService.getAuthHeaders(token)
        }
      );

      return response;
    } catch (error) {
      console.error('Error fetching student term attendance:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch student term attendance' 
      };
    }
  },

  // Get all attendance records for a student
  getStudentAttendance: async (studentId, academicYear = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      let url = `${apiService.endpoints.termAttendance}/student/${studentId}`;
      if (academicYear) {
        url += `?academic_year=${academicYear}`;
      }

      const response = await apiService.request(url, {
        headers: apiService.getAuthHeaders(token)
      });

      return response;
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch student attendance' 
      };
    }
  },

  // Get class attendance statistics
  getClassAttendanceStats: async (className, termId, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}/stats?class=${className}&term_id=${termId}&academic_year=${academicYear}`,
        {
          headers: apiService.getAuthHeaders(token)
        }
      );

      return response;
    } catch (error) {
      console.error('Error fetching class attendance stats:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch class attendance statistics' 
      };
    }
  },

  // Save attendance records (bulk)
  saveAttendance: async (attendanceRecords) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}`,
        {
          method: 'POST',
          headers: {
            ...apiService.getAuthHeaders(token),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(attendanceRecords)
        }
      );

      return response;
    } catch (error) {
      console.error('Error saving attendance:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to save attendance records' 
      };
    }
  },

  // Update single attendance record
  updateAttendance: async (attendanceId, attendanceData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}/${attendanceId}`,
        {
          method: 'PUT',
          headers: {
            ...apiService.getAuthHeaders(token),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(attendanceData)
        }
      );

      return response;
    } catch (error) {
      console.error('Error updating attendance:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update attendance record' 
      };
    }
  },

  // Delete attendance record
  deleteAttendance: async (attendanceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}/${attendanceId}`,
        {
          method: 'DELETE',
          headers: apiService.getAuthHeaders(token)
        }
      );

      return response;
    } catch (error) {
      console.error('Error deleting attendance:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete attendance record' 
      };
    }
  },

  // Get attendance by class, term, and academic year
  getClassAttendance: async (className, termId, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}?class=${className}&term_id=${termId}&academic_year=${academicYear}`,
        {
          headers: apiService.getAuthHeaders(token)
        }
      );

      return response;
    } catch (error) {
      console.error('Error fetching class attendance:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch class attendance' 
      };
    }
  },

  // Get attendance summary by class and term
  getAttendanceSummary: async (termId, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}/summary?term_id=${termId}&academic_year=${academicYear}`,
        {
          headers: apiService.getAuthHeaders(token)
        }
      );

      return response;
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch attendance summary' 
      };
    }
  },

  // Calculate attendance percentage
  calculateAttendance: async (totalSchoolDays, attendedDays) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}/calculate`,
        {
          method: 'POST',
          headers: {
            ...apiService.getAuthHeaders(token),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            total_school_days: totalSchoolDays,
            attended_days: attendedDays
          })
        }
      );

      return response;
    } catch (error) {
      console.error('Error calculating attendance:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to calculate attendance' 
      };
    }
  },

  // Export attendance data
  exportAttendance: async (className, termId, academicYear, format = 'json') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}/export?class=${className}&term_id=${termId}&academic_year=${academicYear}&format=${format}`,
        {
          headers: apiService.getAuthHeaders(token)
        }
      );

      return response;
    } catch (error) {
      console.error('Error exporting attendance:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to export attendance data' 
      };
    }
  },

  // Get attendance for multiple students
  getStudentsAttendance: async (studentIds, termId, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}/students`,
        {
          method: 'POST',
          headers: {
            ...apiService.getAuthHeaders(token),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            student_ids: studentIds,
            term_id: termId,
            academic_year: academicYear
          })
        }
      );

      return response;
    } catch (error) {
      console.error('Error fetching students attendance:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch students attendance' 
      };
    }
  },

  // Get attendance by student IDs (alternative endpoint)
  getAttendanceByStudents: async (studentIds, termId, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const studentIdsParam = Array.isArray(studentIds) ? studentIds.join(',') : studentIds;
      
      const response = await apiService.request(
        `${apiService.endpoints.termAttendance}/by-students?student_ids=${studentIdsParam}&term_id=${termId}&academic_year=${academicYear}`,
        {
          headers: apiService.getAuthHeaders(token)
        }
      );

      return response;
    } catch (error) {
      console.error('Error fetching attendance by students:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch attendance by students' 
      };
    }
  }
};

export default studentAttendanceApi;