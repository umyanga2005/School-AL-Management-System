// src/components/terms/TermForm.jsx - FIXED VERSION
import React, { useState } from 'react';

const TermForm = ({ onClose, onSubmit, existingTerms = [] }) => {
  const [formData, setFormData] = useState({
    term_number: '',
    term_name: '',
    exam_month: '',
    exam_year: '',
    auto_set_active: false
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  const validate = () => {
    const newErrors = {};

    if (!formData.term_number) {
      newErrors.term_number = 'Term number is required';
    } else if (formData.term_number < 1 || formData.term_number > 3) {
      newErrors.term_number = 'Term number must be 1, 2, or 3';
    }

    if (!formData.term_name) {
      newErrors.term_name = 'Term name is required';
    } else if (formData.term_name.length > 100) {
      newErrors.term_name = 'Term name must be less than 100 characters';
    }

    if (!formData.exam_month) {
      newErrors.exam_month = 'Exam month is required';
    } else if (formData.exam_month < 1 || formData.exam_month > 12) {
      newErrors.exam_month = 'Exam month must be between 1 and 12';
    }

    if (!formData.exam_year) {
      newErrors.exam_year = 'Exam year is required';
    }

    // Check for duplicate term in same year
    const duplicate = existingTerms.find(
      term => term.term_number === parseInt(formData.term_number) && 
              term.exam_year === parseInt(formData.exam_year)
    );
    if (duplicate) {
      newErrors.exam_year = `Term ${formData.term_number} already exists for year ${formData.exam_year}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        term_number: parseInt(formData.term_number),
        exam_month: parseInt(formData.exam_month),
        exam_year: parseInt(formData.exam_year)
      });
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Create New Term</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term Number *
              </label>
              <select
                name="term_number"
                value={formData.term_number}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.term_number ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Term Number</option>
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>
              {errors.term_number && (
                <p className="mt-1 text-sm text-red-600">{errors.term_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term Name *
              </label>
              <input
                type="text"
                name="term_name"
                value={formData.term_name}
                onChange={handleChange}
                placeholder="e.g., First Term, Mid Term, Final Term"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.term_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.term_name && (
                <p className="mt-1 text-sm text-red-600">{errors.term_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Month *
              </label>
              <select
                name="exam_month"
                value={formData.exam_month}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.exam_month ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Exam Month</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2023, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              {errors.exam_month && (
                <p className="mt-1 text-sm text-red-600">{errors.exam_month}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Year *
              </label>
              <select
                name="exam_year"
                value={formData.exam_year}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.exam_year ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Exam Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {errors.exam_year && (
                <p className="mt-1 text-sm text-red-600">{errors.exam_year}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="auto_set_active"
                checked={formData.auto_set_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Set this as current active term
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Term'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TermForm;