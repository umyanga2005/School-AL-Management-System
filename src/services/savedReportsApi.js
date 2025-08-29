// src/services/savedReportsApi.js
import apiService from './api';

export const savedReportsApi = {
  // Save a report
  saveReport: (reportData) => {
    const token = localStorage.getItem('token');
    return apiService.request(`${apiService.endpoints.savedReports}`, {
      method: 'POST',
      headers: apiService.getAuthHeaders(token),
      body: JSON.stringify(reportData)
    });
  },

  // Get all saved reports for the current user
  getSavedReports: () => {
    const token = localStorage.getItem('token');
    return apiService.request(`${apiService.endpoints.savedReports}`, {
      headers: apiService.getAuthHeaders(token)
    });
  },

  // Get a specific saved report
  getSavedReport: (id) => {
    const token = localStorage.getItem('token');
    return apiService.request(`${apiService.endpoints.savedReports}/${id}`, {
      headers: apiService.getAuthHeaders(token)
    });
  },

  // Delete a saved report
  deleteSavedReport: (id) => {
    const token = localStorage.getItem('token');
    return apiService.request(`${apiService.endpoints.savedReports}/${id}`, {
      method: 'DELETE',
      headers: apiService.getAuthHeaders(token)
    });
  }
};