// src/services/termApi.js - FIXED VERSION
import apiService from './api';

export const termApi = {
  // Get all terms with optional filtering
  getTerms: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/terms?${queryString}` : '/terms';
      
      const response = await apiService.request(`${apiService.endpoints.terms}${queryString ? `?${queryString}` : ''}`, {
        headers: apiService.getAuthHeaders(token)
      });
      
      return response;
    } catch (error) {
      console.error('Error in getTerms:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current active term
  getCurrentTerm: async () => {
    try {
      const token = localStorage.getItem('token');
      return await apiService.request(`${apiService.endpoints.terms}/current`, {
        headers: apiService.getAuthHeaders(token)
      });
    } catch (error) {
      console.error('Error in getCurrentTerm:', error);
      return { success: false, error: error.message };
    }
  },

  // Create a new term
  createTerm: async (termData) => {
    try {
      const token = localStorage.getItem('token');
      return await apiService.request(apiService.endpoints.terms, {
        method: 'POST',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify(termData)
      });
    } catch (error) {
      console.error('Error in createTerm:', error);
      return { success: false, error: error.message };
    }
  },

  // Set a term as current active term
  setCurrentTerm: async (termId) => {
    try {
      const token = localStorage.getItem('token');
      return await apiService.request(`${apiService.endpoints.terms}/${termId}/set-current`, {
        method: 'PUT',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify({})
      });
    } catch (error) {
      console.error('Error in setCurrentTerm:', error);
      return { success: false, error: error.message };
    }
  },

  // Update an existing term
  updateTerm: async (termId, termData) => {
    try {
      const token = localStorage.getItem('token');
      return await apiService.request(`${apiService.endpoints.terms}/${termId}`, {
        method: 'PUT',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify(termData)
      });
    } catch (error) {
      console.error('Error in updateTerm:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a term
  deleteTerm: async (termId, force = false) => {
    try {
      const token = localStorage.getItem('token');
      const url = force ? `${apiService.endpoints.terms}/${termId}?force=true` : `${apiService.endpoints.terms}/${termId}`;
      return await apiService.request(url, {
        method: 'DELETE',
        headers: apiService.getAuthHeaders(token)
      });
    } catch (error) {
      console.error('Error in deleteTerm:', error);
      return { success: false, error: error.message };
    }
  },

  // Create all three terms for a year
  createBulkTerms: async (yearData) => {
    try {
      const token = localStorage.getItem('token');
      return await apiService.request(`${apiService.endpoints.terms}/bulk`, {
        method: 'POST',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify(yearData)
      });
    } catch (error) {
      console.error('Error in createBulkTerms:', error);
      return { success: false, error: error.message };
    }
  },

  // Get comprehensive statistics
  getStats: async () => {
    try {
      const token = localStorage.getItem('token');
      return await apiService.request(`${apiService.endpoints.terms}/stats`, {
        headers: apiService.getAuthHeaders(token)
      });
    } catch (error) {
      console.error('Error in getStats:', error);
      return { success: false, error: error.message };
    }
  },

  // Clone a term to different year
  cloneTerm: async (termId, cloneData) => {
    try {
      const token = localStorage.getItem('token');
      return await apiService.request(`${apiService.endpoints.terms}/${termId}/clone`, {
        method: 'POST',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify(cloneData)
      });
    } catch (error) {
      console.error('Error in cloneTerm:', error);
      return { success: false, error: error.message };
    }
  }
};