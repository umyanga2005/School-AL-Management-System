// utils/index.js

// Helper function to get Sri Lanka current date
export const getSriLankaDate = () => {
  const now = new Date();
  // Convert to Sri Lanka time (UTC+5:30)
  const sriLankaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return sriLankaTime.toISOString().split('T')[0];
};

// Session storage helpers
export const sessionStorage = {
  saveUser: (user) => {
    if (!user) return;
    
    const userToSave = { ...user };
    const token = userToSave.token;
    delete userToSave.token; // Don't save token in user object
    
    localStorage.setItem('attendanceUser', JSON.stringify(userToSave));
    localStorage.setItem('attendanceToken', token);
  },

  getUser: () => {
    try {
      const savedUser = localStorage.getItem('attendanceUser');
      const savedToken = localStorage.getItem('attendanceToken');
      
      if (savedUser && savedToken) {
        return {
          user: JSON.parse(savedUser),
          token: savedToken
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing saved user:', error);
      return null;
    }
  },

  clearUser: () => {
    localStorage.removeItem('attendanceUser');
    localStorage.removeItem('attendanceToken');
  }
};

// Application constants
export const CLASSES = ['12A1', '12A2', '12B1', '12B2', '13A1', '13A2', '13B1', '13B2'];

export const USER_ROLES = {
  ADMIN: 'admin',
  COORDINATOR: 'coordinator', 
  TEACHER: 'teacher'
};

export const APP_CONFIG = {
  schoolName: process.env.REACT_APP_SCHOOL_NAME || 'SCC A/L Art Attendance',
  schoolLogo: process.env.REACT_APP_SCHOOL_LOGO,
  debugMode: process.env.REACT_APP_DEBUG_MODE === 'true'
};

// Validation helpers
export const validators = {
  isValidPassword: (password) => password && password.length >= 6,
  isValidUsername: (username) => username && username.length >= 3,
  isValidName: (name) => name && name.length >= 2,
  isValidStudentCount: (count) => {
    const num = parseInt(count);
    return !isNaN(num) && num >= 0;
  }
};

// Format helpers
export const formatters = {
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString();
  },
  
  sanitizeUsername: (username) => {
    return username.toLowerCase().replace(/\s+/g, '');
  },

  generateTempPassword: () => {
    return Math.random().toString(36).slice(-8);
  }
};

// Filter helpers
export const filters = {
  filterRecordsByTeacher: (records, teacherId) => {
    return records.filter(r => {
      const recordTeacherId = parseInt(r.teacher_id || r.teacherId);
      const currentUserId = parseInt(teacherId);
      return recordTeacherId === currentUserId;
    });
  },

  filterRecordsByDateAndClass: (records, { year, month, class: className }) => {
    return records.filter(record => {
      const date = new Date(record.date);
      const recordYear = date.getFullYear().toString();
      const recordMonth = (date.getMonth() + 1).toString().padStart(2, '0');
      
      if (year && year !== recordYear) return false;
      if (month && month !== recordMonth) return false;
      if (className && className !== record.class) return false;
      return true;
    });
  }
};

// Statistics helpers
export const statistics = {
  calculateTotalStudents: (records) => {
    return records.reduce((sum, r) => sum + r.total, 0);
  },

  calculateAveragePerDay: (records) => {
    if (!records.length) return 0;
    const total = statistics.calculateTotalStudents(records);
    return Math.round(total / records.length);
  }
};