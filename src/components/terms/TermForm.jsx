// src/components/terms/TermForm.jsx
import React, { useState } from 'react';

const TermForm = ({ onSubmit, onCancel, existingTerms }) => {
  const [formData, setFormData] = useState({
    term_number: '',
    term_name: '',
    exam_month: new Date().getMonth() + 1,
    exam_year: new Date().getFullYear()
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.term_number) newErrors.term_number = 'Term number is required';
    if (!formData.term_name) newErrors.term_name = 'Term name is required';
    if (!formData.exam_month) newErrors.exam_month = 'Exam month is required';
    if (!formData.exam_year) newErrors.exam_year = 'Exam year is required';

    // Check if term already exists for this year
    const termExists = existingTerms.some(
      term => term.term_number == formData.term_number && term.exam_year == formData.exam_year
    );
    
    if (termExists) {
      newErrors.term_number = `Term ${formData.term_number} already exists for ${formData.exam_year}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleString('default', { month: 'long' })
  }));

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Create New Term</h3>
        
        <form onSubmit={handleSubmit} className="term-form">
          <div className="form-group">
            <label>Term Number *</label>
            <select
              name="term_number"
              value={formData.term_number}
              onChange={handleChange}
              className={errors.term_number ? 'error' : ''}
            >
              <option value="">Select Term</option>
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
            {errors.term_number && <span className="error-text">{errors.term_number}</span>}
          </div>

          <div className="form-group">
            <label>Term Name *</label>
            <input
              type="text"
              name="term_name"
              value={formData.term_name}
              onChange={handleChange}
              placeholder="e.g., First Term, Mid Year Term"
              className={errors.term_name ? 'error' : ''}
            />
            {errors.term_name && <span className="error-text">{errors.term_name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Exam Month *</label>
              <select
                name="exam_month"
                value={formData.exam_month}
                onChange={handleChange}
                className={errors.exam_month ? 'error' : ''}
              >
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              {errors.exam_month && <span className="error-text">{errors.exam_month}</span>}
            </div>

            <div className="form-group">
              <label>Exam Year *</label>
              <input
                type="number"
                name="exam_year"
                value={formData.exam_year}
                onChange={handleChange}
                min="2000"
                max="2030"
                className={errors.exam_year ? 'error' : ''}
              />
              {errors.exam_year && <span className="error-text">{errors.exam_year}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Term
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TermForm;