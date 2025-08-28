// src/services/reportApi.js - ENHANCED VERSION
import apiService from './api';

export const reportApi = {
  /**
   * Fetches the term report data from the backend.
   * @param {object} filters - The filters for the report.
   * @param {string} filters.term_id - The ID of the term.
   * @param {string} [filters.class_name] - The name of the class (optional).
   * @param {boolean} [filters.include_common] - Whether to include common subjects.
   * @returns {Promise<object>} The API response.
   */
  getTermReport: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (filters.term_id) {
        params.append('term_id', filters.term_id);
      }
      if (filters.class_name) {
        params.append('class_name', filters.class_name);
      }
      if (filters.include_common !== undefined) {
        params.append('include_common', filters.include_common.toString());
      }

      const queryString = params.toString();
      const url = `${apiService.endpoints.reports}/term-report?${queryString}`;
      
      return await apiService.request(url, {
        headers: apiService.getAuthHeaders(token),
      });
    } catch (error) {
      console.error('Error in getTermReport:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetches subject analysis data from the backend.
   * @param {object} filters - The filters for the analysis.
   * @param {string} filters.term_id - The ID of the term.
   * @param {string} [filters.class_name] - The name of the class (optional).
   * @returns {Promise<object>} The API response.
   */
  getSubjectAnalysis: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (filters.term_id) {
        params.append('term_id', filters.term_id);
      }
      if (filters.class_name) {
        params.append('class_name', filters.class_name);
      }

      const queryString = params.toString();
      const url = `${apiService.endpoints.reports}/subject-analysis?${queryString}`;
      
      return await apiService.request(url, {
        headers: apiService.getAuthHeaders(token),
      });
    } catch (error) {
      console.error('Error in getSubjectAnalysis:', error);
      return { success: false, error: error.message };
    }
  },

  // NEW: Performance trends across terms
  getPerformanceTrends: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = `${apiService.endpoints.reports}/performance-trends?${queryString}`;
      
      return await apiService.request(url, {
        headers: apiService.getAuthHeaders(token),
      });
    } catch (error) {
      console.error('Error in getPerformanceTrends:', error);
      return { success: false, error: error.message };
    }
  },

  // NEW: Class comparison data
  getClassComparison: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = `${apiService.endpoints.reports}/class-comparison?${queryString}`;
      
      return await apiService.request(url, {
        headers: apiService.getAuthHeaders(token),
      });
    } catch (error) {
      console.error('Error in getClassComparison:', error);
      return { success: false, error: error.message };
    }
  },

  // NEW: Student progress data
  getStudentProgress: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = `${apiService.endpoints.reports}/student-progress?${queryString}`;
      
      return await apiService.request(url, {
        headers: apiService.getAuthHeaders(token),
      });
    } catch (error) {
      console.error('Error in getStudentProgress:', error);
      return { success: false, error: error.message };
    }
  },

  // NEW: Grade distribution data
  getGradeDistribution: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = `${apiService.endpoints.reports}/grade-distribution?${queryString}`;
      
      return await apiService.request(url, {
        headers: apiService.getAuthHeaders(token),
      });
    } catch (error) {
      console.error('Error in getGradeDistribution:', error);
      return { success: false, error: error.message };
    }
  },

  // NEW: Export data
  getExportData: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = `${apiService.endpoints.reports}/export-data?${queryString}`;
      
      return await apiService.request(url, {
        headers: apiService.getAuthHeaders(token),
      });
    } catch (error) {
      console.error('Error in getExportData:', error);
      return { success: false, error: error.message };
    }
  }
};