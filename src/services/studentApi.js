// src/services/studentApi.js - COMPLETE VERSION
import apiService from './api';

class StudentApiService {
  async getStudents(classFilter = '', page = 1, limit = 10, yearFilter = '') {
    const token = localStorage.getItem('token');
    return apiService.getStudents(token, classFilter, page, limit, yearFilter);
  }

  async createStudent(studentData) {
    const token = localStorage.getItem('token');
    return apiService.createStudent(token, studentData);
  }

  async updateStudent(studentId, studentData) {
    const token = localStorage.getItem('token');
    return apiService.updateStudent(token, studentId, studentData);
  }

  async deleteStudent(studentId) {
    const token = localStorage.getItem('token');
    return apiService.deleteStudent(token, studentId);
  }

  async promoteStudents(promotionData) {
    const token = localStorage.getItem('token');
    return apiService.promoteStudents(token, promotionData);
  }

  async getStudentSubjects(studentId, academicYear) {
    const token = localStorage.getItem('token');
    return apiService.getStudentSubjects(token, studentId, academicYear);
  }

  async assignStudentSubjects(studentId, assignmentData) {
    const token = localStorage.getItem('token');
    return apiService.assignStudentSubjects(token, studentId, assignmentData);
  }

  // FIXED: Use apiService consistently
  async assignStudentSubjectsByIndexNumber(indexNumber, subjectIds, academicYear) {
    try {
      console.log('StudentApi: Assigning subjects by index_number...', {
        indexNumber,
        subjectIds,
        academicYear
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Use apiService.request method for consistency
      const response = await apiService.request(`${apiService.endpoints.students}/subjects/assign-by-index`, {
        method: 'POST',
        headers: apiService.getAuthHeaders(token),
        body: JSON.stringify({
          index_number: indexNumber,
          subject_ids: subjectIds,
          academic_year: academicYear
        })
      });

      if (!response.success) {
        console.error('Subject assignment failed:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to assign subjects'
        };
      }

      console.log('Subject assignment successful:', response);
      return {
        success: true,
        data: response.data,
        message: 'Subjects assigned successfully'
      };

    } catch (error) {
      console.error('StudentApi: Error in assignStudentSubjectsByIndexNumber:', error);
      return {
        success: false,
        error: error.message || 'Failed to assign subjects'
      };
    }
  }

  // UPDATED: Separate methods for better error handling
  async createStudentOnly(studentData) {
    try {
      console.log('StudentApi: Creating student (basic info only)...');
      
      const result = await this.createStudent(studentData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create student');
      }

      console.log('StudentApi: Student created successfully:', result.data?.student);
      
      return {
        success: true,
        data: result.data,
        message: 'Student created successfully'
      };

    } catch (error) {
      console.error('StudentApi: Error creating student:', error);
      return {
        success: false,
        error: error.message || 'Failed to create student'
      };
    }
  }

  async updateStudentOnly(studentId, studentData) {
    try {
      console.log('StudentApi: Updating student (basic info only)...');
      
      const result = await this.updateStudent(studentId, studentData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update student');
      }

      console.log('StudentApi: Student updated successfully');
      
      return {
        success: true,
        data: result.data,
        message: 'Student updated successfully'
      };

    } catch (error) {
      console.error('StudentApi: Error updating student:', error);
      return {
        success: false,
        error: error.message || 'Failed to update student'
      };
    }
  }

  // UPDATED: For backward compatibility, but now handles errors better
  async createStudentWithSubjects(studentData, subjectIds, academicYear = new Date().getFullYear()) {
    try {
      console.log('StudentApi: Creating student with subjects...', {
        studentData,
        subjectIds,
        academicYear
      });

      // Step 1: Create the student
      const studentResult = await this.createStudentOnly(studentData);
      
      if (!studentResult.success) {
        return studentResult; // Return the error immediately
      }

      const newStudent = studentResult.data?.student;
      if (!newStudent) {
        return {
          success: false,
          error: 'Invalid student creation response'
        };
      }

      // Step 2: Assign subjects if provided
      if (subjectIds && subjectIds.length > 0) {
        console.log('StudentApi: Assigning subjects to new student...');

        // Add a delay for database consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const subjectResult = await this.assignStudentSubjectsByIndexNumber(
          studentData.index_number,
          subjectIds,
          academicYear
        );
        
        if (!subjectResult.success) {
          console.warn('StudentApi: Subject assignment failed:', subjectResult.error);
          return {
            success: true, // Student was created successfully
            data: { 
              student: newStudent,
              subjectAssignmentFailed: true,
              subjectAssignmentError: subjectResult.error
            },
            warning: `Student created successfully, but subject assignment failed: ${subjectResult.error}. You can assign subjects later.`
          };
        }

        return {
          success: true,
          data: { 
            student: newStudent,
            subjectAssignmentSuccess: true,
            assignedSubjects: subjectResult.data
          },
          message: 'Student and subjects created successfully'
        };
      }

      return {
        success: true,
        data: { student: newStudent },
        message: 'Student created successfully (no subjects assigned)'
      };

    } catch (error) {
      console.error('StudentApi: Error in createStudentWithSubjects:', error);
      return {
        success: false,
        error: error.message || 'Failed to create student with subjects'
      };
    }
  }

  async updateStudentWithSubjects(studentId, studentData, subjectIds, academicYear = new Date().getFullYear()) {
    try {
      console.log('StudentApi: Updating student with subjects...', {
        studentId,
        studentData,
        subjectIds,
        academicYear
      });

      // Step 1: Update the student
      const studentResult = await this.updateStudentOnly(studentId, studentData);
      
      if (!studentResult.success) {
        return studentResult; // Return the error immediately
      }

      // Step 2: Update subjects if provided
      if (subjectIds !== undefined && subjectIds !== null) { // Allow empty array to clear subjects
        console.log('StudentApi: Updating subjects for student...');
        
        const subjectResult = await this.assignStudentSubjectsByIndexNumber(
          studentData.index_number,
          subjectIds,
          academicYear
        );
        
        if (!subjectResult.success) {
          console.warn('StudentApi: Subject update failed:', subjectResult.error);
          return {
            success: true, // Student was updated successfully
            data: { 
              student: studentResult.data?.student || studentResult.data,
              subjectUpdateFailed: true,
              subjectUpdateError: subjectResult.error
            },
            warning: `Student updated successfully, but subject update failed: ${subjectResult.error}. You can update subjects later.`
          };
        }

        return {
          success: true,
          data: { 
            student: studentResult.data?.student || studentResult.data,
            subjectUpdateSuccess: true,
            assignedSubjects: subjectResult.data
          },
          message: 'Student and subjects updated successfully'
        };
      }

      return {
        success: true,
        data: { student: studentResult.data?.student || studentResult.data },
        message: 'Student updated successfully (subjects unchanged)'
      };

    } catch (error) {
      console.error('StudentApi: Error in updateStudentWithSubjects:', error);
      return {
        success: false,
        error: error.message || 'Failed to update student with subjects'
      };
    }
  }
  
  // NEW: Additional functions from the complete version
  async getStudentsWithFilter(classFilter = '', page = 1, limit = 1000) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('StudentApi: Getting students with filters:', { classFilter, page, limit });

      const response = await apiService.getStudents(token, classFilter, page, limit);

      if (!response.success) {
        console.error('Failed to get students:', response.error);
        throw new Error(response.error || 'Failed to get students');
      }

      console.log(`StudentApi: Retrieved ${response.data?.students?.length || 0} students`);
      return response;

    } catch (error) {
      console.error('StudentApi: Error in getStudents:', error);
      throw error;
    }
  }

  // Assign subjects to a student using student ID (legacy method)
  async assignStudentSubjectsLegacy(studentId, subjectIds, academicYear) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('StudentApi: Assigning subjects to student (legacy):', { 
        studentId, 
        subjectIds, 
        academicYear,
        subjectCount: subjectIds?.length 
      });

      const response = await apiService.assignStudentSubjects(token, studentId, {
        subject_ids: subjectIds,
        academic_year: academicYear
      });

      if (!response.success) {
        console.error('Failed to assign student subjects:', response.error);
        throw new Error(response.error || 'Failed to assign student subjects');
      }

      console.log('StudentApi: Subject assignment successful');
      return response;

    } catch (error) {
      console.error('StudentApi: Error in assignStudentSubjects:', error);
      throw error;
    }
  }

  // NEW: Assign subjects to a student using index number (preferred method)
  async assignStudentSubjectsByIndex(indexNumber, subjectIds, academicYear) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('StudentApi: Assigning subjects by index number:', { 
        indexNumber, 
        subjectIds, 
        academicYear,
        subjectCount: subjectIds?.length 
      });

      const response = await this.assignStudentSubjectsByIndexNumber(
        indexNumber, 
        subjectIds, 
        academicYear
      );

      if (!response.success) {
        console.error('Failed to assign student subjects by index:', response.error);
        throw new Error(response.error || 'Failed to assign student subjects');
      }

      console.log('StudentApi: Subject assignment by index successful');
      return response;

    } catch (error) {
      console.error('StudentApi: Error in assignStudentSubjectsByIndex:', error);
      throw error;
    }
  }
}

export const studentApi = new StudentApiService();