// src/components/subjects/SubjectForm.jsx
import React, { useState } from 'react';

const SubjectForm = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
    subject_code: '',
    subject_name: '',
    stream: '',
    description: ''
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
    
    if (!formData.subject_code) newErrors.subject_code = 'Subject code is required';
    if (!formData.subject_name) newErrors.subject_name = 'Subject name is required';
    if (!formData.stream) newErrors.stream = 'Stream is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const streamOptions = ['Science', 'Commerce', 'Arts', 'Technology'];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{initialData ? 'Edit Subject' : 'Add New Subject'}</h3>
        
        <form onSubmit={handleSubmit} className="subject-form">
          <div className="form-group">
            <label>Subject Code *</label>
            <input
              type="text"
              name="subject_code"
              value={formData.subject_code}
              onChange={handleChange}
              className={errors.subject_code ? 'error' : ''}
            />
            {errors.subject_code && <span className="error-text">{errors.subject_code}</span>}
          </div>

          <div className="form-group">
            <label>Subject Name *</label>
            <input
              type="text"
              name="subject_name"
              value={formData.subject_name}
              onChange={handleChange}
              className={errors.subject_name ? 'error' : ''}
            />
            {errors.subject_name && <span className="error-text">{errors.subject_name}</span>}
          </div>

          <div className="form-group">
            <label>Stream *</label>
            <select
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              className={errors.stream ? 'error' : ''}
            >
              <option value="">Select Stream</option>
              {streamOptions.map(stream => (
                <option key={stream} value={stream}>{stream}</option>
              ))}
            </select>
            {errors.stream && <span className="error-text">{errors.stream}</span>}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Update' : 'Create'} Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectForm;