// src/components/students/StudentForm.jsx
import React, { useState, useEffect } from 'react';
import { subjectApi } from '../../services';

const StudentForm = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
    index_number: '',
    name: '',
    address: '',
    mother_name: '',
    father_name: '',
    guardian_name: '',
    mother_phone: '',
    father_phone: '',
    guardian_phone: '',
    current_class: '',
    admission_year: new Date().getFullYear(),
    subject_ids: []
  });

  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const classes = ['12A1', '12A2', '12B1', '12B2', '13A1', '13A2', '13B1', '13B2'];

  // Common subjects that all students must take
  const commonSubjects = [
    'GIT', 
    'General English', 
    'General Test'
  ];

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const response = await subjectApi.getSubjects();
      setSubjects(response.data?.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubjectChange = (subjectId, isSelected) => {
    setFormData(prev => {
      const currentSubjects = prev.subject_ids || [];
      const updatedSubjects = isSelected
        ? [...currentSubjects, subjectId]
        : currentSubjects.filter(id => id !== subjectId); // ✅ fixed here
      
      return { ...prev, subject_ids: updatedSubjects };
    });
  };

  // Auto-select common subjects when class is selected
  useEffect(() => {
    if (formData.current_class && (formData.current_class.startsWith('12') || formData.current_class.startsWith('13'))) {
      const commonSubjectIds = subjects
        .filter(subject => commonSubjects.includes(subject.subject_name))
        .map(subject => subject.id);
      
      setFormData(prev => ({
        ...prev,
        subject_ids: [...new Set([...(prev.subject_ids || []), ...commonSubjectIds])]
      }));
    }
  }, [formData.current_class, subjects]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.index_number?.trim()) {
      newErrors.index_number = 'Index number is required';
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.current_class) {
      newErrors.current_class = 'Class is required';
    }
    if (!formData.admission_year) {
      newErrors.admission_year = 'Admission year is required';
    }
    if (!formData.subject_ids?.length) {
      newErrors.subjects = 'At least one subject is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Filter main subjects (excluding common subjects)
  const mainSubjects = subjects.filter(subject => 
    !commonSubjects.includes(subject.subject_name)
  );

  // Get common subjects from available subjects
  const availableCommonSubjects = subjects.filter(subject => 
    commonSubjects.includes(subject.subject_name)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {initialData ? 'Edit Student' : 'Add New Student'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Index Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="index_number"
                    value={formData.index_number}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.index_number 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter index number"
                  />
                  {errors.index_number && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.index_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="current_class"
                    value={formData.current_class}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.current_class 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  {errors.current_class && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.current_class}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admission Year
                  </label>
                  <input
                    type="number"
                    name="admission_year"
                    value={formData.admission_year}
                    onChange={handleChange}
                    min="2000"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter student's address"
                />
              </div>
            </div>

            {/* Subject Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Subject Selection</h4>
              
              {loadingSubjects ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading subjects...</p>
                </div>
              ) : (
                <>
                  {/* Common Subjects (Required for all) */}
                  <div className="mb-6">
                    <h5 className="text-md font-medium text-gray-700 mb-3 text-green-600">
                      Common Subjects (Required for all Grade 12 & 13 students)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableCommonSubjects.map(subject => (
                        <label key={subject.id} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md cursor-pointer hover:bg-green-100">
                          <input
                            type="checkbox"
                            checked={formData.subject_ids?.includes(subject.id)}
                            onChange={(e) => handleSubjectChange(subject.id, e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            disabled
                          />
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {subject.subject_name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">({subject.stream})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Main Subjects */}
                  <div>
                    <h5 className="text-md font-medium text-gray-700 mb-3">
                      Main Subjects (Select 3)
                    </h5>
                    {errors.subjects && (
                      <p className="text-red-600 text-sm mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                        {errors.subjects}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {mainSubjects.map(subject => (
                        <label key={subject.id} className="flex items-center p-3 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.subject_ids?.includes(subject.id)}
                            onChange={(e) => handleSubjectChange(subject.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {subject.subject_name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">({subject.stream})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    <p>Selected: {formData.subject_ids?.length || 0} subjects</p>
                  </div>
                </>
              )}
            </div>

            {/* Parent/Guardian Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Parent/Guardian Information</h4>
              
              {/* Mother Information */}
              <div className="mb-6">
                <h5 className="text-md font-medium text-gray-700 mb-3">Mother's Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      name="mother_name"
                      value={formData.mother_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter mother's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mother's Phone
                    </label>
                    <input
                      type="tel"
                      name="mother_phone"
                      value={formData.mother_phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter mother's phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Father Information */}
              <div className="mb-6">
                <h5 className="text-md font-medium text-gray-700 mb-3">Father's Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      name="father_name"
                      value={formData.father_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter father's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's Phone
                    </label>
                    <input
                      type="tel"
                      name="father_phone"
                      value={formData.father_phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter father's phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              <div>
                <h5 className="text-md font-medium text-gray-700 mb-3">Guardian's Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian's Name
                    </label>
                    <input
                      type="text"
                      name="guardian_name"
                      value={formData.guardian_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter guardian's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian's Phone
                    </label>
                    <input
                      type="tel"
                      name="guardian_phone"
                      value={formData.guardian_phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter guardian's phone number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button 
                type="button" 
                onClick={onCancel} 
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors duration-200 flex items-center"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isSubmitting 
                  ? (initialData ? 'Updating...' : 'Creating...')
                  : (initialData ? 'Update Student' : 'Create Student')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;