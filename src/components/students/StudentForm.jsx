// src/components/students/StudentForm.jsx
import React, { useState } from 'react';

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
    admission_year: new Date().getFullYear()
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.index_number) newErrors.index_number = 'Index number is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.current_class) newErrors.current_class = 'Class is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{initialData ? 'Edit Student' : 'Add New Student'}</h3>
        
        <form onSubmit={handleSubmit} className="student-form">
          <div className="form-row">
            <div className="form-group">
              <label>Index Number *</label>
              <input
                type="text"
                name="index_number"
                value={formData.index_number}
                onChange={handleChange}
                className={errors.index_number ? 'error' : ''}
              />
              {errors.index_number && <span className="error-text">{errors.index_number}</span>}
            </div>

            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mother's Name</label>
              <input
                type="text"
                name="mother_name"
                value={formData.mother_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Mother's Phone</label>
              <input
                type="tel"
                name="mother_phone"
                value={formData.mother_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Father's Name</label>
              <input
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Father's Phone</label>
              <input
                type="tel"
                name="father_phone"
                value={formData.father_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Guardian's Name</label>
              <input
                type="text"
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Guardian's Phone</label>
              <input
                type="tel"
                name="guardian_phone"
                value={formData.guardian_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Class *</label>
              <select
                name="current_class"
                value={formData.current_class}
                onChange={handleChange}
                className={errors.current_class ? 'error' : ''}
              >
                <option value="">Select Class</option>
                <option value="12A1">12A1</option>
                <option value="12A2">12A2</option>
                <option value="13A1">13A1</option>
                <option value="13A2">13A2</option>
              </select>
              {errors.current_class && <span className="error-text">{errors.current_class}</span>}
            </div>

            <div className="form-group">
              <label>Admission Year</label>
              <input
                type="number"
                name="admission_year"
                value={formData.admission_year}
                onChange={handleChange}
                min="2000"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Update' : 'Create'} Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;