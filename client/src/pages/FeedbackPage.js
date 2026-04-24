import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MessageSquare, Plus, Edit2, Trash2, ArrowLeft, Save, Star
} from 'lucide-react';
import Modal from '../components/Modal';

const FeedbackPage = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    type: 'suggestion',
    subject: '',
    message: '',
    rating: 5
  });

  const types = ['bug', 'feature', 'praise', 'suggestion'];

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await axios.get('/api/feedback');
      setFeedbackList(response.data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedItem) {
        await axios.put(`/api/feedback/${selectedItem.id}`, formData);
      } else {
        await axios.post('/api/feedback', formData);
      }
      fetchFeedback();
      resetForm();
      setSelectedItem(null);
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await axios.delete(`/api/feedback/${id}`);
        fetchFeedback();
        setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting feedback:', error);
      }
    }
  };

  const handleEdit = (item) => {
    setFormData({
      type: item.type || 'suggestion',
      subject: item.subject || '',
      message: item.message || '',
      rating: item.rating || 5
    });
    setEditMode(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'suggestion',
      subject: '',
      message: '',
      rating: 5
    });
    setShowForm(false);
    setEditMode(false);
  };

  const getTypeBadge = (type) => {
    const map = {
      bug: 'badge-danger',
      feature: 'badge-primary',
      praise: 'badge-success',
      suggestion: 'badge-info'
    };
    return map[type] || 'badge-info';
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'badge-warning',
      reviewed: 'badge-info',
      resolved: 'badge-success',
      dismissed: 'badge-danger'
    };
    return map[status] || 'badge-info';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < rating ? '#fbbf24' : 'transparent'}
        color={i < rating ? '#fbbf24' : '#71717a'}
      />
    ));
  };

  if (selectedItem && !showForm) {
    return (
      <div>
        <button
          onClick={() => setSelectedItem(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#a5b4fc',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '24px'
          }}
        >
          <ArrowLeft size={20} />
          Back to Feedback
        </button>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span className={`badge ${getTypeBadge(selectedItem.type)}`}>{selectedItem.type}</span>
                <span className={`badge ${getStatusBadge(selectedItem.status)}`}>{selectedItem.status || 'pending'}</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5', marginBottom: '8px' }}>
                {selectedItem.subject}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#71717a', fontSize: '14px' }}>Rating:</span>
                <div style={{ display: 'flex', gap: '2px' }}>{renderStars(selectedItem.rating)}</div>
              </div>
              <p style={{ color: '#71717a', fontSize: '14px' }}>
                Submitted: {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : 'Unknown'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(selectedItem)}>
                <Edit2 size={16} /> Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedItem.id)}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Message</h4>
            <p style={{ color: '#e4e4e7', lineHeight: '1.7' }}>{selectedItem.message}</p>
          </div>

          {selectedItem.admin_response && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '12px' }}>
              <h4 style={{ color: '#10b981', fontWeight: '600', marginBottom: '8px' }}>Admin Response</h4>
              <p style={{ color: '#e4e4e7', lineHeight: '1.7' }}>{selectedItem.admin_response}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageSquare size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>
              Feedback
            </h1>
            <p style={{ color: '#71717a' }}>Share your thoughts and suggestions</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={20} />
          Submit Feedback
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : feedbackList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <MessageSquare size={48} color="#71717a" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#a1a1aa', fontSize: '18px', marginBottom: '8px' }}>No feedback yet</h3>
          <p style={{ color: '#71717a' }}>Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Subject</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.map(item => (
                <tr key={item.id} onClick={() => setSelectedItem(item)}>
                  <td><span className={`badge ${getTypeBadge(item.type)}`}>{item.type}</span></td>
                  <td style={{ fontWeight: '600', color: '#f4f4f5' }}>{item.subject}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '2px' }}>{renderStars(item.rating)}</div>
                  </td>
                  <td><span className={`badge ${getStatusBadge(item.status)}`}>{item.status || 'pending'}</span></td>
                  <td style={{ color: '#71717a' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editMode ? 'Edit Feedback' : 'Submit Feedback'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {types.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              type="text"
              className="form-input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief summary of your feedback"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              className="form-textarea"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Describe your feedback in detail..."
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Rating (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              className="form-input"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 1 })}
              style={{ width: '100px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              {editMode ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FeedbackPage;
