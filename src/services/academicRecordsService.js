import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const academicRecordsService = {
  getStudentReportData: async (studentId, className, termId, year) => {
    try {
      const res = await axios.get(
        `${API_BASE}/academic-records/${studentId}/${className}/${termId}/${year}`
      );
      return res.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

export default academicRecordsService;
