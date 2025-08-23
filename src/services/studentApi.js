// src/services/studentApi.js - UPDATED WITH INDEX_NUMBER METHOD
import apiService from './api';

class StudentApiService {
  async getStudents(classFilter = '') {
    const token = localStorage.getItem('token');
    return apiService.getStudents(token, classFilter);
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

  // NEW: Method to assign subjects using index_number directly
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

      const response = await fetch('/api/students/subjects/assign-by-index', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          index_number: indexNumber,
          subject_ids: subjectIds,
          academic_year: academicYear
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Subject assignment failed:', result);
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      console.log('Subject assignment successful:', result);
      return {
        success: true,
        data: result.data || result,
        message: result.message || 'Subjects assigned successfully'
      };

    } catch (error) {
      console.error('StudentApi: Error in assignStudentSubjectsByIndexNumber:', error);
      return {
        success: false,
        error: error.message || 'Failed to assign subjects'
      };
    }
  }

  // KEPT: Combined helper method for creating student with subjects (legacy support)
  async createStudentWithSubjects(studentData, subjectIds, academicYear = new Date().getFullYear()) {
    try {
      console.log('StudentApi: Creating student with subjects...', {
        studentData,
        subjectIds,
        academicYear
      });

      // Step 1: Create the student
      const studentResult = await this.createStudent(studentData);
      
      if (!studentResult.success) {
        throw new Error(studentResult.error || 'Failed to create student');
      }

      const newStudent = studentResult.data?.student;
      if (!newStudent || !newStudent.id) {
        throw new Error('Invalid student creation response - missing student ID');
      }

      console.log('StudentApi: Student created successfully:', newStudent);

      // Step 2: Assign subjects using index_number if provided
      if (subjectIds && subjectIds.length > 0) {
        console.log('StudentApi: Assigning subjects to new student...');

        // Add a small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const subjectResult = await this.assignStudentSubjectsByIndexNumber(
          studentData.index_number,
          subjectIds,
          academicYear
        );
        
        if (!subjectResult.success) {
          console.warn('StudentApi: Subject assignment failed:', subjectResult.error);
          // Return success for student creation but with warning about subjects
          return {
            success: true,
            data: { 
              student: newStudent,
              subjectAssignmentFailed: true,
              subjectAssignmentError: subjectResult.error
            },
            warning: `Student created successfully, but subject assignment failed: ${subjectResult.error}`
          };
        }

        console.log('StudentApi: Subjects assigned successfully');
        
        return {
          success: true,
          data: { 
            student: newStudent,
            subjectAssignmentSuccess: true,
            assignedSubjects: subjectResult.data
          },
          message: 'Student and subjects created successfully'
        };
      } else {
        console.log('StudentApi: No subjects to assign');
        return {
          success: true,
          data: { student: newStudent },
          message: 'Student created successfully (no subjects assigned)'
        };
      }

    } catch (error) {
      console.error('StudentApi: Error in createStudentWithSubjects:', error);
      return {
        success: false,
        error: error.message || 'Failed to create student with subjects'
      };
    }
  }

  // KEPT: Combined helper method for updating student with subjects (legacy support)
  async updateStudentWithSubjects(studentId, studentData, subjectIds, academicYear = new Date().getFullYear()) {
    try {
      console.log('StudentApi: Updating student with subjects...', {
        studentId,
        studentData,
        subjectIds,
        academicYear
      });

      // Step 1: Update the student
      const studentResult = await this.updateStudent(studentId, studentData);
      
      if (!studentResult.success) {
        throw new Error(studentResult.error || 'Failed to update student');
      }

      console.log('StudentApi: Student updated successfully');

      // Step 2: Update subjects using index_number if provided
      if (subjectIds && subjectIds.length >= 0) { // Allow empty array to clear subjects
        console.log('StudentApi: Updating subjects for student...');
        
        const subjectResult = await this.assignStudentSubjectsByIndexNumber(
          studentData.index_number,
          subjectIds,
          academicYear
        );
        
        if (!subjectResult.success) {
          console.warn('StudentApi: Subject update failed:', subjectResult.error);
          return {
            success: true,
            data: { 
              student: studentResult.data?.student || studentResult.data,
              subjectUpdateFailed: true,
              subjectUpdateError: subjectResult.error
            },
            warning: `Student updated successfully, but subject update failed: ${subjectResult.error}`
          };
        }

        console.log('StudentApi: Subjects updated successfully');
        
        return {
          success: true,
          data: { 
            student: studentResult.data?.student || studentResult.data,
            subjectUpdateSuccess: true,
            assignedSubjects: subjectResult.data
          },
          message: 'Student and subjects updated successfully'
        };
      } else {
        console.log('StudentApi: No subjects to update');
        return {
          success: true,
          data: { student: studentResult.data?.student || studentResult.data },
          message: 'Student updated successfully (subjects unchanged)'
        };
      }

    } catch (error) {
      console.error('StudentApi: Error in updateStudentWithSubjects:', error);
      return {
        success: false,
        error: error.message || 'Failed to update student with subjects'
      };
    }
  }
}

export const studentApi = new StudentApiService();