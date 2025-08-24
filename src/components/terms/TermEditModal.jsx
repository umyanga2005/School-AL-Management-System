// src/components/terms/TermEditModal.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';

const TermEditModal = ({ term, onClose, onSubmit, existingTerms = [] }) => {
  const [formData, setFormData] = useState({
    term_name: '',
    exam_month: '',
    exam_year: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMarks, setHasMarks] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (term) {
      setFormData({
        term_name: term.term_name || '',
        exam_month: term.exam_month || '',
        exam_year: term.exam_year || ''
      });
      setHasMarks(term.total_marks_entries > 0);
    }
  }, [term]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.term_name || formData.term_name.trim().length < 2) {
      newErrors.term_name = 'Term name must be at least 2 characters long';
    }
    
    if (!formData.exam_month || formData.exam_month < 1 || formData.exam_month > 12) {
      newErrors.exam_month = 'Please select a valid exam month';
    }
    
    if (!formData.exam_year || formData.exam_year < 2000 || formData.exam_year > 2100) {
      newErrors.exam_year = 'Please enter a valid year between 2000 and 2100';
    }
    
    // Check for conflicts if changing year
    if (formData.exam_year !== term.exam_year) {
      const conflict = existingTerms.find(t => 
        t.id !== term.id && 
        t.term_number === term.term_number && 
        t.exam_year === parseInt(formData.exam_year)
      );
      
      if (conflict) {
        newErrors.exam_year = `Term ${term.term_number} already exists for year ${formData.exam_year}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field === 'exam_month' || field === 'exam_year') {
      setFormData(prev => ({
        ...prev,
        [field]: parseInt(value) || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    // Check if anything actually changed
    const hasChanges = (
      formData.term_name !== term.term_name ||
      formData.exam_month !== term.exam_month ||
      formData.exam_year !== term.exam_year
    );
    
    if (!hasChanges) {
      onClose();
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Only send changed fields
      const updateData = {};
      if (formData.term_name !== term.term_name) updateData.term_name = formData.term_name;
      if (formData.exam_month !== term.exam_month) updateData.exam_month = formData.exam_month;
      if (formData.exam_year !== term.exam_year) updateData.exam_year = formData.exam_year;
      
      await onSubmit(updateData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      term_name: term.term_name || '',
      exam_month: term.exam_month || '',
      exam_year: term.exam_year || ''
    });
    setErrors({});
  };

  if (!term) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Edit Term</h3>
            <p className="text-sm text-gray-600">Term {term.term_number} - {term.term_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Warning for terms with marks */}
        {hasMarks && (
          <div className="mx-6 mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <div>
                <p className="font-medium">Caution: This term has {term.total_marks_entries} marks entries</p>
                <p className="text-sm mt-1">Changing the exam year is not allowed for terms with existing marks.</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Term Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term Name *
            </label>
            <input
              type="text"
              value={formData.term_name}
              onChange={(e) => handleInputChange('term_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.term_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter term name"
            />
            {errors.term_name && (
              <p className="mt-1 text-sm text-red-600">{errors.term_name}</p>
            )}
          </div>

          {/* Exam Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Month *
            </label>
            <select
              value={formData.exam_month}
              onChange={(e) => handleInputChange('exam_month', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.exam_month ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select exam month</option>
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            {errors.exam_month && (
              <p className="mt-1 text-sm text-red-600">{errors.exam_month}</p>
            )}
          </div>

          {/* Exam Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Year *
            </label>
            <input
              type="number"
              value={formData.exam_year}
              onChange={(e) => handleInputChange('exam_year', e.target.value)}
              disabled={hasMarks}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.exam_year ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              } ${hasMarks ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., 2024"
              min="2000"
              max="2100"
            />
            {errors.exam_year && (
              <p className="mt-1 text-sm text-red-600">{errors.exam_year}</p>
            )}
            {hasMarks && (
              <p className="mt-1 text-sm text-gray-500">
                Year cannot be changed because this term has existing marks
              </p>
            )}
          </div>

          {/* Current vs New Values Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Changes Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Current:</span>
                  <div className="font-medium">{term.term_name}</div>
                  <div className="text-gray-600">
                    {monthNames[term.exam_month - 1]} {term.exam_year}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">New:</span>
                  <div className="font-medium">{formData.term_name || 'Not set'}</div>
                  <div className="text-gray-600">
                    {formData.exam_month ? monthNames[formData.exam_month - 1] : 'Not set'} {formData.exam_year || 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Term'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TermEditModal;