import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Plus, ArrowLeft, Edit2, Trash2, Save, Search } from 'lucide-react';
import Modal from '../components/Modal';

const ContactSupport = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '', category: 'support' });

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get('/api/contact');
      setMessages(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/contact', formData);
      fetchMessages();
      setShowForm(false);
      setFormData({ name: '', email: '', subject: '', message: '', category: 'support' });
    } catch (error) { console.error('Error:', error); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this message?')) {
      try {
        await axios.delete(`/api/contact/${id}`);
        fetchMessages();
        setSelectedItem(null);
      } catch (error) { console.error('Error:', error); }
    }
  };

  const statusColors = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#71717a' };
  const categoryColors = { support: '#3b82f6', partnership: '#8b5cf6', bug: '#ef4444', feature: '#10b981', other: '#71717a' };

  const filtered = messages.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedItem) {
    return (
      <div>
        <button onClick={() => setSelectedItem(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', marginBottom: '24px' }}>
          <ArrowLeft size={20} /> Back to List
        </button>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span style={{ background: `${categoryColors[selectedItem.category] || '#71717a'}20`, color: categoryColors[selectedItem.category] || '#71717a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{selectedItem.category}</span>
                <span style={{ background: `${statusColors[selectedItem.status] || '#71717a'}20`, color: statusColors[selectedItem.status] || '#71717a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{selectedItem.status}</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5', marginBottom: '8px' }}>{selectedItem.subject}</h2>
              <p style={{ color: '#71717a' }}>From: {selectedItem.name} ({selectedItem.email})</p>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedItem.id)}><Trash2 size={16} /> Delete</button>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Message</h4>
            <p style={{ color: '#e4e4e7', lineHeight: '1.7' }}>{selectedItem.message}</p>
          </div>
          {selectedItem.admin_reply && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h4 style={{ color: '#34d399', fontWeight: '600', marginBottom: '8px' }}>Admin Reply</h4>
              <p style={{ color: '#e4e4e7', lineHeight: '1.7' }}>{selectedItem.admin_reply}</p>
            </div>
          )}
          <p style={{ color: '#71717a', fontSize: '12px', marginTop: '16px' }}>Submitted: {new Date(selectedItem.created_at).toLocaleString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>Contact Support</h1>
            <p style={{ color: '#71717a' }}>Submit and track support tickets</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={20} /> New Ticket</button>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
        <input type="text" placeholder="Search tickets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input" style={{ paddingLeft: '48px' }} />
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <MessageCircle size={48} style={{ color: '#71717a', marginBottom: '16px' }} />
          <p style={{ color: '#71717a' }}>No tickets found</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Name</th><th>Subject</th><th>Category</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {filtered.map(msg => (
                <tr key={msg.id} onClick={() => setSelectedItem(msg)}>
                  <td style={{ fontWeight: '600', color: '#f4f4f5' }}>{msg.name}</td>
                  <td style={{ color: '#a1a1aa' }}>{msg.subject}</td>
                  <td><span style={{ background: `${categoryColors[msg.category] || '#71717a'}20`, color: categoryColors[msg.category] || '#71717a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{msg.category}</span></td>
                  <td><span style={{ background: `${statusColors[msg.status] || '#71717a'}20`, color: statusColors[msg.status] || '#71717a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{msg.status}</span></td>
                  <td style={{ color: '#71717a' }}>{new Date(msg.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Support Ticket" size="medium">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              {['support', 'partnership', 'bug', 'feature', 'other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input type="text" className="form-input" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-textarea" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required style={{ minHeight: '120px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={18} /> Submit Ticket</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ContactSupport;
