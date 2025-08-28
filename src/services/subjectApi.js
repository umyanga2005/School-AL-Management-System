// src/services/subjectApi.js - Enhanced with better error handling
import apiService from './api';

export const subjectApi = {
  // NEW: Backward compatibility - getAll method
  getAll: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiService.request(apiService.endpoints.subjects, {
        headers: apiService.getAuthHeaders(token)
      });

      if (!response.success) {
        console.error('Failed to get subjects:', response.error);
        throw new Error(response.error || 'Failed to get subjects');
      }

      return response;

    } catch (error) {
      console.error('SubjectApi: Error in getAll:', error);
      throw error;
    }
  },

  getSubjects: () => {
    const token = localStorage.getItem('token');
    return apiService.getSubjects(token);
  },

  createSubject: (subjectData) => {
    const token = localStorage.getItem('token');
    return apiService.createSubject(token, subjectData);
  },

  updateSubject: (id, subjectData) => {
    const token = localStorage.getItem('token');
    return apiService.updateSubject(token, id, subjectData);
  },

  deleteSubject: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('SubjectApi: Deleting subject with ID:', id);
      
      const response = await apiService.request(`${apiService.endpoints.subjects}/${id}`, {
        method: 'DELETE',
        headers: apiService.getAuthHeaders(token)
      });

      if (!response.success) {
        console.error('Subject deletion failed:', response.error);
        throw new Error(response.error || 'Failed to delete subject');
      }

      console.log('Subject deletion successful:', response);
      return response;

    } catch (error) {
      console.error('SubjectApi: Error in deleteSubject:', error);
      throw error;
    }
  },

  // Get subjects assigned to a specific student
  getStudentSubjects: async (studentId, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const url = academicYear 
        ? `${apiService.endpoints.subjects}/students/${studentId}/subjects?academic_year=${academicYear}`
        : `${apiService.endpoints.subjects}/students/${studentId}/subjects`;

      const response = await apiService.request(url, {
        headers: apiService.getAuthHeaders(token)
      });

      if (!response.success) {
        console.error('Failed to get student subjects:', response.error);
        throw new Error(response.error || 'Failed to get student subjects');
      }

      return response;

    } catch (error) {
      console.error('SubjectApi: Error in getStudentSubjects:', error);
      throw error;
    }
  },

  // FIXED: Get subjects for a specific class with better error handling
  getClassSubjects: async (className, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return {
          success: false,
          error: 'Authentication token not found',
          data: { subjects: [] }
        };
      }

      console.log('SubjectApi: Getting subjects for class:', className, 'year:', academicYear);

      const url = academicYear 
        ? `${apiService.endpoints.subjects}/class/${className}?academic_year=${academicYear}`
        : `${apiService.endpoints.subjects}/class/${className}`;

      const response = await apiService.request(url, {
        headers: apiService.getAuthHeaders(token)
      });

      console.log('Class subjects API response:', response);

      if (!response.success) {
        console.warn('Failed to get class subjects:', response.error);
        // Return a graceful failure instead of throwing
        return {
          success: false,
          error: response.error || 'Failed to get class subjects',
          data: { subjects: [] }
        };
      }

      // Ensure we have a subjects array
      if (!response.data || !Array.isArray(response.data.subjects)) {
        console.warn('Invalid response format for class subjects:', response);
        return {
          success: true,
          data: { subjects: [] },
          message: 'No subjects found for this class'
        };
      }

      console.log(`Found ${response.data.subjects.length} subjects for class ${className}`);
      return response;

    } catch (error) {
      console.error('SubjectApi: Error in getClassSubjects:', error);
      // Return graceful failure instead of throwing
      return {
        success: false,
        error: error.message || 'Failed to get class subjects',
        data: { subjects: [] }
      };
    }
  },

  // GET /api/subjects/class/:className/students - Get students and their subjects for a class
  getClassStudents: async (className, academicYear) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return {
          success: false,
          error: 'Authentication token not found',
          data: { students: [] }
        };
      }

      console.log('SubjectApi: Getting students and subjects for class:', className, 'year:', academicYear);

      const url = academicYear 
        ? `${apiService.endpoints.subjects}/class/${className}/students?academic_year=${academicYear}`
        : `${apiService.endpoints.subjects}/class/${className}/students`;

      const response = await apiService.request(url, {
        headers: apiService.getAuthHeaders(token)
      });

      console.log('Class students API response:', response);

      if (!response.success) {
        console.warn('Failed to get class students:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to get class students',
          data: { students: [] }
        };
      }

      console.log(`Found ${response.data?.students?.length || 0} students for class ${className}`);
      return response;

    } catch (error) {
      console.error('SubjectApi: Error in getClassStudents:', error);
      return {
        success: false,
        error: error.message || 'Failed to get class students',
        data: { students: [] }
      };
    }
  },

  // ADD THIS METHOD TO subjectApi.js (if it doesn't exist)
  getAll: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.request(apiService.endpoints.subjects, {
        headers: apiService.getAuthHeaders(token)
      });
      
      if (!response.success) {
        console.error('Failed to get subjects:', response.error);
        return { success: false, error: response.error };
      }
      
      return response;
    } catch (error) {
      console.error('Error in subjectApi.getAll:', error);
      return { success: false, error: error.message };
    }
  }

};