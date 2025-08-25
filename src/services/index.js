// src/services/index.js
import apiService from './api';
import { studentApi } from './studentApi';
import { subjectApi } from './subjectApi';
import { termApi } from './termApi';
import { marksApi } from './marksApi';
import { classApi } from './classApi'; // Import first, then export

export {
  apiService,
  studentApi,
  subjectApi,
  termApi,
  marksApi,
  classApi
};