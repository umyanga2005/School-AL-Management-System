// src/components/marks/MarksEntry.jsx - UPDATED VERSION WITH AB SUPPORT AND INTEGER MARKS
import React, { useState, useEffect } from 'react';
import { marksApi, studentApi, subjectApi, termApi } from '../../services';
import { useDebounce } from '../../hooks/useDebounce';

const MarksEntry = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [marksData, setMarksData] = useState({});
  const [originalMarks, setOriginalMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [completionStats, setCompletionStats] = useState({ entered: 0, total: 0, percentage: 0 });

  const classes = ['12A1', '12A2', '12B1', '12B2', '13A1', '13A2', '13B1', '13B2'];
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm) {
      loadStudentsAndMarks();
    } else {
      setStudents([]);
      setMarksData({});
      setOriginalMarks({});
    }
  }, [selectedClass, selectedSubject, selectedTerm]);

  useEffect(() => {
    // Calculate completion statistics
    const entered = Object.values(marksData).filter(mark => mark !== '' && mark !== null).length;
    const total = students.length;
    const percentage = total > 0 ? Math.round((entered / total) * 100) : 0;
    
    setCompletionStats({ entered, total, percentage });
  }, [marksData, students]);

  useEffect(() => {
    // Filter subjects when class changes
    if (selectedClass) {
      filterSubjectsByClass();
    } else {
      setFilteredSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedClass, subjects]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading initial data...');
      
      const [subjectsRes, termsRes, currentTermRes] = await Promise.all([
        subjectApi.getSubjects(),
        termApi.getTerms(),
        termApi.getCurrentTerm()
      ]);
      
      console.log('Subjects response:', subjectsRes);
      console.log('Terms response:', termsRes);
      console.log('Current term response:', currentTermRes);
      
      setSubjects(subjectsRes.data?.subjects || []);
      setTerms(termsRes.data?.terms || []);
      
      if (currentTermRes.success && currentTermRes.data?.term) {
        setCurrentTerm(currentTermRes.data.term);
        setSelectedTerm(currentTermRes.data.term.id.toString());
        console.log('Auto-selected current term:', currentTermRes.data.term);
      }
      
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const filterSubjectsByClass = async () => {
    try {
      if (!selectedClass) {
        setFilteredSubjects([]);
        return;
      }

      setSubjectLoading(true);
      console.log('Filtering subjects for class:', selectedClass);
      
      const currentYear = new Date().getFullYear();
      
      try {
        const subjectsRes = await subjectApi.getClassSubjects(selectedClass, currentYear);
        
        console.log('Class subjects response:', subjectsRes);
        
        if (subjectsRes.success && subjectsRes.data?.subjects && subjectsRes.data.subjects.length > 0) {
          const classSubjects = subjectsRes.data.subjects;
          setFilteredSubjects(classSubjects);
          
          console.log(`Found ${classSubjects.length} subjects for class ${selectedClass}`);
          
          if (!selectedSubject && classSubjects.length > 0) {
            setSelectedSubject(classSubjects[0].id.toString());
            console.log('Auto-selected first subject:', classSubjects[0]);
          }
          
          if (selectedSubject && !classSubjects.find(s => s.id.toString() === selectedSubject)) {
            setSelectedSubject('');
            console.log('Cleared subject selection - not available for this class');
          }
        } else {
          console.log('No class-specific subjects found, showing all subjects as fallback');
          setFilteredSubjects(subjects);
          
          if (!selectedSubject && subjects.length > 0) {
            setSelectedSubject(subjects[0].id.toString());
            console.log('Auto-selected first subject from all subjects:', subjects[0]);
          }
        }
      } catch (classSubjectsError) {
        console.warn('Failed to get class-specific subjects, falling back to all subjects:', classSubjectsError);
        setFilteredSubjects(subjects);
        
        if (!selectedSubject && subjects.length > 0) {
          setSelectedSubject(subjects[0].id.toString());
          console.log('Auto-selected first subject from fallback:', subjects[0]);
        }
      }
    } catch (err) {
      console.error('Error filtering subjects by class:', err);
      setFilteredSubjects(subjects);
    } finally {
      setSubjectLoading(false);
    }
  };

  const loadStudentsAndMarks = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading students and marks for:', { 
        class: selectedClass, 
        subject: selectedSubject, 
        term: selectedTerm 
      });
      
      const currentYear = new Date().getFullYear();
      const subjectStudentsRes = await subjectApi.getClassStudents(selectedClass, currentYear);
      
      console.log('Subject students response:', subjectStudentsRes);
      
      if (!subjectStudentsRes.success) {
        throw new Error(subjectStudentsRes.error || 'Failed to load students enrolled in this subject');
      }
      
      const allStudents = subjectStudentsRes.data?.students || [];
      const enrolledStudents = allStudents.filter(student => 
        student.subjects && student.subjects.some(subject => 
          subject.id === parseInt(selectedSubject)
        )
      );
      
      console.log(`Found ${enrolledStudents.length} students enrolled in subject ${selectedSubject} out of ${allStudents.length} total students in class`);
      
      if (enrolledStudents.length === 0) {
        setStudents([]);
        setMarksData({});
        setOriginalMarks({});
        setError(`No students found enrolled in the selected subject for class ${selectedClass}`);
        return;
      }
      
      setStudents(enrolledStudents);

      const marksRes = await marksApi.getMarks({
        class: selectedClass,
        subject_id: selectedSubject,
        term_id: selectedTerm
      });

      console.log('Marks response:', marksRes);
      
      const existingMarks = marksRes.data?.marks || [];
      console.log(`Found ${existingMarks.length} existing marks`);

      const initialMarks = {};
      const originalMarksData = {};
      
      enrolledStudents.forEach(student => {
        const existingMark = existingMarks.find(m => m.student_id === student.id);
        // Display as AB if null/absent, otherwise display as integer
        const displayValue = existingMark ? 
          (existingMark.marks === null ? 'AB' : Math.round(existingMark.marks).toString()) : '';
        initialMarks[student.id] = displayValue;
        originalMarksData[student.id] = displayValue;
      });

      setMarksData(initialMarks);
      setOriginalMarks(originalMarksData);
      
      console.log('Initialized marks data for', Object.keys(initialMarks).length, 'students');
      
    } catch (err) {
      console.error('Error loading students and marks:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load students and marks');
      setStudents([]);
      setMarksData({});
      setOriginalMarks({});
    } finally {
      setLoading(false);
    }
  };

  // Updated validation function for marks input
  const validateMarksInput = (input) => {
    if (input === '') return true; // Allow empty
    
    const upperInput = input.toUpperCase().trim();
    
    // Allow AB only
    if (upperInput === 'AB') return true;
    
    // Allow whole numbers between 0-100
    const num = parseInt(input);
    if (!isNaN(num) && num.toString() === input && num >= 0 && num <= 100) {
      return true;
    }
    
    return false;
  };

  const handleMarksChange = (studentId, marks) => {
    const input = marks.toString().trim();
    
    // Allow temporary input during typing (for better UX)
    if (input === '' || validateMarksInput(input)) {
      setMarksData(prev => ({ ...prev, [studentId]: input }));
    } else {
      // For invalid inputs, check if it's a partial AB entry
      const upperInput = input.toUpperCase();
      if ('AB'.startsWith(upperInput) && upperInput.length <= 2) {
        setMarksData(prev => ({ ...prev, [studentId]: upperInput }));
      }
      // Otherwise, don't update the state (reject invalid input)
    }
  };

  const handleInputKeyDown = (e, studentId) => {
    const { key, target } = e;
    const currentValue = target.value;

    // Allow navigation and editing keys
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) {
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      // Find all input elements for marks in DOM order
      const inputs = Array.from(document.querySelectorAll('input[type="text"]')).filter(input =>
        input.placeholder === '0-100 or AB' && !input.disabled
      );
      const currentIndex = inputs.indexOf(target);
      if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
        inputs[currentIndex + 1].select();
      }
      return;
    }

    // For AB input
    if (key.toLowerCase() === 'a' || key.toLowerCase() === 'b') {
      const upperKey = key.toUpperCase();
      if (currentValue === '' && upperKey === 'A') {
        return; // Allow A as first character
      }
      if (currentValue.toUpperCase() === 'A' && upperKey === 'B') {
        return; // Allow B after A
      }
      e.preventDefault(); // Block other A/B combinations
      return;
    }

    // For numeric input
    if (/^\d$/.test(key)) {
      const newValue = currentValue + key;
      const num = parseInt(newValue);
      if (currentValue === '' || (num >= 0 && num <= 100)) {
        return; // Allow valid numbers
      }
    }

    // Block all other keys
    e.preventDefault();
  };


  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const marksToSave = Object.entries(marksData)
        .filter(([_, marks]) => marks !== '' && marks !== null)
        .map(([studentId, marks]) => ({
          student_id: parseInt(studentId),
          subject_id: parseInt(selectedSubject),
          marks: marks.toUpperCase() === 'AB' ? 'AB' : parseInt(marks)
        }));

      if (marksToSave.length === 0) {
        setError('No marks to save');
        return;
      }

      console.log('Saving marks:', {
        marksCount: marksToSave.length,
        termId: selectedTerm,
        sampleMark: marksToSave[0]
      });

      const response = await marksApi.bulkEnterMarks({
        marksData: marksToSave,
        term_id: parseInt(selectedTerm)
      });

      console.log('Save marks response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Failed to save marks');
      }

      const newOriginalMarks = { ...originalMarks };
      marksToSave.forEach(({ student_id, marks }) => {
        newOriginalMarks[student_id] = marks.toString();
      });
      setOriginalMarks(newOriginalMarks);

      setSuccess(`Successfully saved marks for ${marksToSave.length} students`);
      console.log('Marks saved successfully');
      
    } catch (err) {
      console.error('Error saving marks:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAllMarks = () => {
    const clearedMarks = {};
    students.forEach(student => {
      clearedMarks[student.id] = '';
    });
    setMarksData(clearedMarks);
  };

  const handleSelectAllMarks = (value) => {
    const newMarks = {};
    students.forEach(student => {
      newMarks[student.id] = value.toString();
    });
    setMarksData(newMarks);
  };

  const hasUnsavedChanges = () => {
    return Object.keys(marksData).some(studentId => 
      marksData[studentId] !== originalMarks[studentId]
    );
  };

  const getGrade = (marks) => {
    if (marks === '' || marks === null) return '-';
    if (typeof marks === 'string' && marks.toUpperCase() === 'AB') return 'AB';
    const numericMarks = parseInt(marks);
    if (isNaN(numericMarks)) return '-';
    if (numericMarks >= 75) return 'A';
    if (numericMarks >= 65) return 'B';
    if (numericMarks >= 50) return 'C';
    if (numericMarks >= 35) return 'S';
    return 'F';
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    student.index_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Marks Entry</h2>
        <p className="text-gray-600">Enter and manage student marks for selected class and subject</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          {success}
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class <span className="text-red-500">*</span>
            </label>
            <select 
              value={selectedClass} 
              onChange={(e) => {
                console.log('Class changed to:', e.target.value);
                setSelectedClass(e.target.value);
                setSelectedSubject('');
                setStudents([]);
                setMarksData({});
                setOriginalMarks({});
              }}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select 
                value={selectedSubject} 
                onChange={(e) => {
                  console.log('Subject changed to:', e.target.value);
                  setSelectedSubject(e.target.value);
                }}
                disabled={loading || subjectLoading || !selectedClass || filteredSubjects.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Subject</option>
                {filteredSubjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name} ({subject.stream})
                  </option>
                ))}
              </select>
              {subjectLoading && (
                <div className="absolute right-8 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {selectedClass && filteredSubjects.length === 0 && !subjectLoading && (
              <p className="text-sm text-blue-600 mt-1">
                All subjects available (no class-specific subjects found)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term <span className="text-red-500">*</span>
            </label>
            <select 
              value={selectedTerm} 
              onChange={(e) => {
                console.log('Term changed to:', e.target.value);
                setSelectedTerm(e.target.value);
              }}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Term</option>
              {terms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.term_name} ({term.exam_year})
                  {term.status === 'active' && ' - Current'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            {selectedClass && (
              <>
                {filteredSubjects.length > 0 ? (
                  <span>
                    <span className="font-medium">{filteredSubjects.length}</span> subjects available for class <span className="font-medium">{selectedClass}</span>
                  </span>
                ) : subjectLoading ? (
                  <span className="text-blue-600">
                    Loading subjects for class <span className="font-medium">{selectedClass}</span>...
                  </span>
                ) : (
                  <span className="text-gray-500">
                    Loading subjects for class <span className="font-medium">{selectedClass}</span>...
                  </span>
                )}
              </>
            )}
          </div>
          <div className="text-blue-600">
            {currentTerm && (
              <span>
                Current Term: <span className="font-medium">{currentTerm.term_name} ({currentTerm.exam_year})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {selectedClass && selectedSubject && selectedTerm && students.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 border-b border-gray-200 gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filteredSubjects.find(s => s.id === parseInt(selectedSubject))?.subject_name} - Class {selectedClass}
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-24 rounded-full bg-gray-200 overflow-hidden`}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        completionStats.percentage >= 80 ? 'bg-green-500' : 
                        completionStats.percentage >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} 
                      style={{ width: `${completionStats.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {completionStats.entered}/{completionStats.total} ({completionStats.percentage}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSelectAllMarks(75)}
                  disabled={saving}
                  className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  title="Set all marks to A grade (75)"
                >
                  Set All A
                </button>
                <button 
                  onClick={() => handleSelectAllMarks('AB')}
                  disabled={saving}
                  className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  title="Set all marks to Absent (AB)"
                >
                  Set All AB
                </button>
                <button 
                  onClick={handleClearAllMarks}
                  disabled={saving}
                  className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Clear All
                </button>
              </div>
              <button 
                onClick={handleSaveMarks} 
                disabled={saving || !hasUnsavedChanges()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {saving ? 'Saving...' : 'Save All Marks'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Index No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marks (0-100 or 'AB')
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => {
                  const hasChanged = marksData[student.id] !== originalMarks[student.id];
                  const isEmpty = marksData[student.id] === '' || marksData[student.id] === null;
                  
                  return (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.index_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={marksData[student.id] || ''}
                          onChange={(e) => handleMarksChange(student.id, e.target.value)}
                          onKeyDown={(e) => handleInputKeyDown(e, student.id)}
                          disabled={saving}
                          className={`w-24 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors uppercase ${
                            hasChanged ? 'border-yellow-400 bg-yellow-50' : 
                            isEmpty ? 'border-gray-300' : 'border-green-300 bg-green-50'
                          }`}
                          placeholder="0-100 or AB"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          getGrade(marksData[student.id]) === 'A' ? 'bg-green-100 text-green-800' :
                          getGrade(marksData[student.id]) === 'B' ? 'bg-blue-100 text-blue-800' :
                          getGrade(marksData[student.id]) === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          getGrade(marksData[student.id]) === 'S' ? 'bg-orange-100 text-orange-800' :
                          getGrade(marksData[student.id]) === 'F' ? 'bg-red-100 text-red-800' :
                          getGrade(marksData[student.id]) === 'AB' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getGrade(marksData[student.id])}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hasChanged ? (
                          <span className="text-yellow-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Unsaved
                          </span>
                        ) : isEmpty ? (
                          <span className="text-gray-500">Not entered</span>
                        ) : (
                          <span className="text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No students match your search for "{searchTerm}".
              </p>
            </div>
          )}
        </div>
      )}

      {selectedClass && selectedSubject && selectedTerm && students.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No students found enrolled in the selected subject for class {selectedClass}.
          </p>
        </div>
      )}

      {!selectedClass && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Get started</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a class, subject, and term to begin entering marks.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarksEntry;