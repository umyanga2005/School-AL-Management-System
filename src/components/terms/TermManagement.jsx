// src/components/terms/TermManagement.jsx
import React, { useState, useEffect } from 'react';
import { termApi } from '../../services/termApi';

const TermManagement = () => {
  const [terms, setTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const [termsRes, currentTermRes] = await Promise.all([
        termApi.getTerms(),
        termApi.getCurrentTerm()
      ]);
      
      setTerms(termsRes.data.terms);
      setCurrentTerm(currentTermRes.data.term);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load terms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTerm = async (termData) => {
    try {
      await termApi.createTerm(termData);
      setShowForm(false);
      loadTerms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create term');
    }
  };

  if (loading) return <div className="loading">Loading terms...</div>;

  return (
    <div className="term-management">
      <div className="page-header">
        <h2>Term Management</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Create New Term
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {currentTerm && (
        <div className="current-term-card">
          <h3>Current Active Term</h3>
          <div className="term-info">
            <p><strong>Term:</strong> {currentTerm.term_name} (Term {currentTerm.term_number})</p>
            <p><strong>Exam Month:</strong> {new Date(currentTerm.exam_year, currentTerm.exam_month - 1).toLocaleString('default', { month: 'long' })} {currentTerm.exam_year}</p>
          </div>
        </div>
      )}

      {showForm && (
        <TermForm
          onSubmit={handleCreateTerm}
          onCancel={() => setShowForm(false)}
          existingTerms={terms}
        />
      )}

      <div className="terms-list">
        <h3>All Terms</h3>
        <table>
          <thead>
            <tr>
              <th>Term</th>
              <th>Exam Month</th>
              <th>Year</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => (
              <tr key={term.id}>
                <td>{term.term_name} (Term {term.term_number})</td>
                <td>{new Date(term.exam_year, term.exam_month - 1).toLocaleString('default', { month: 'long' })}</td>
                <td>{term.exam_year}</td>
                <td>
                  <span className={`status-badge ${term.status}`}>
                    {term.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {terms.length === 0 && (
        <div className="empty-state">
          <p>No terms found. Create your first term to get started.</p>
        </div>
      )}
    </div>
  );
};

export default TermManagement;