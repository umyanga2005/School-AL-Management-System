// src/components/terms/BulkTermForm.jsx
import React, { useState } from 'react';

const BulkTermForm = ({ onSubmit, onClose, existingYears = [] }) => {
  const [formData, setFormData] = useState({
    exam_year: new Date().getFullYear() + 1,
    term_names: ['First Term', 'Second Term', 'Third Term'],
    exam_months: [4, 8, 12]
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const validate = () => {
    const newErrors = {};
    
    if (!formData.exam_year || formData.exam_year < 2000 || formData.exam_year > 2100) {
      newErrors.exam_year = 'Please enter a valid year between 2000 and 2100';
    }
    
    if (existingYears.includes(formData.exam_year)) {
      newErrors.exam_year = `Terms already exist for year ${formData.exam_year}`;
    }
    
    formData.term_names.forEach((name, index) => {
      if (!name || name.trim().length < 2) {
        newErrors[`term_name_${index}`] = `Term ${index + 1} name must be at least 2 characters`;
      }
    });
    
    formData.exam_months.forEach((month, index) => {
      if (!month || month < 1 || month > 12) {
        newErrors[`exam_month_${index}`] = `Term ${index + 1} exam month must be between 1 and 12`;
      }
    });
    
    // Check for duplicate months
    const monthSet = new Set(formData.exam_months);
    if (monthSet.size !== formData.exam_months.length) {
      newErrors.duplicate_months = 'Exam months must be unique for each term';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field === 'exam_year') {
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

  const handleTermNameChange = (index, value) => {
    const newTermNames = [...formData.term_names];
    newTermNames[index] = value;
    setFormData(prev => ({
      ...prev,
      term_names: newTermNames
    }));
    
    // Clear error
    if (errors[`term_name_${index}`]) {
      setErrors(prev => ({
        ...prev,
        [`term_name_${index}`]: undefined
      }));
    }
  };

  const handleExamMonthChange = (index, value) => {
    const newExamMonths = [...formData.exam_months];
    newExamMonths[index] = parseInt(value) || '';
    setFormData(prev => ({
      ...prev,
      exam_months: newExamMonths
    }));
    
    // Clear errors
    if (errors[`exam_month_${index}`]) {
      setErrors(prev => ({
        ...prev,
        [`exam_month_${index}`]: undefined
      }));
    }
    if (errors.duplicate_months) {
      setErrors(prev => ({
        ...prev,
        duplicate_months: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToDefaults = () => {
    setFormData({
      exam_year: new Date().getFullYear() + 1,
      term_names: ['First Term', 'Second Term', 'Third Term'],
      exam_months: [4, 8, 12]
    });
    setErrors({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Create All Terms for Academic Year</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1 transition-colors duration-200"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year *
            </label>
            <input
              type="number"
              value={formData.exam_year}
              onChange={(e) => handleInputChange('exam_year', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.exam_year ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 2024"
              min="2000"
              max="2100"
            />
            {errors.exam_year && (
              <p className="mt-1 text-sm text-red-600">{errors.exam_year}</p>
            )}
          </div>

          {errors.duplicate_months && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {errors.duplicate_months}
            </div>
          )}

          {/* Terms Configuration */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Configure Terms</h4>
            <div className="space-y-4">
              {[1, 2, 3].map((termNumber) => (
                <div key={termNumber} className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Term {termNumber}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Term Name *
                      </label>
                      <input
                        type="text"
                        value={formData.term_names[termNumber - 1]}
                        onChange={(e) => handleTermNameChange(termNumber - 1, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`term_name_${termNumber - 1}`] ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        placeholder={`e.g., Term ${termNumber}`}
                      />
                      {errors[`term_name_${termNumber - 1}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`term_name_${termNumber - 1}`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Month *
                      </label>
                      <select
                        value={formData.exam_months[termNumber - 1]}
                        onChange={(e) => handleExamMonthChange(termNumber - 1, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`exam_month_${termNumber - 1}`] ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Month</option>
                        {monthNames.map((month, index) => (
                          <option key={index + 1} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                      {errors[`exam_month_${termNumber - 1}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`exam_month_${termNumber - 1}`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preset Options */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Presets</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  exam_months: [4, 8, 12]
                }))}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Standard (Apr, Aug, Dec)
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  exam_months: [3, 7, 11]
                }))}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Early (Mar, Jul, Nov)
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  exam_months: [5, 9, 1]
                }))}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Late (May, Sep, Jan)
              </button>
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {formData.term_names.map((name, index) => (
                <div key={index} className="flex justify-between">
                  <span>{name}</span>
                  <span>
                    {formData.exam_months[index] ? monthNames[formData.exam_months[index] - 1] : 'Not set'} {formData.exam_year}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create All Terms'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkTermForm;