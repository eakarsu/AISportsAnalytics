import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Heart, Plus, Edit2, Trash2, ArrowLeft, Search, Save, Star
} from 'lucide-react';
import Modal from '../components/Modal';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    entity_type: 'team',
    entity_name: '',
    sport: 'Football',
    notes: ''
  });

  const entityTypes = ['team', 'player', 'match', 'league'];
  const sports = ['Football', 'Basketball', 'Tennis', 'American Football', 'Baseball', 'Hockey', 'Boxing', 'MMA', 'Cricket', 'Golf'];

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('/api/favorites');
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedItem) {
        await axios.put(`/api/favorites/${selectedItem.id}`, formData);
      } else {
        await axios.post('/api/favorites', formData);
      }
      fetchFavorites();
      resetForm();
      setSelectedItem(null);
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this favorite?')) {
      try {
        await axios.delete(`/api/favorites/${id}`);
        fetchFavorites();
        setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting favorite:', error);
      }
    }
  };

  const handleEdit = (item) => {
    setFormData({
      entity_type: item.entity_type || 'team',
      entity_name: item.entity_name || '',
      sport: item.sport || 'Football',
      notes: item.notes || ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      entity_type: 'team',
      entity_name: '',
      sport: 'Football',
      notes: ''
    });
    setShowForm(false);
    setEditMode(false);
  };

  const getTypeBadge = (type) => {
    const map = {
      team: 'badge-primary',
      player: 'badge-success',
      match: 'badge-warning',
      league: 'badge-info'
    };
    return map[type] || 'badge-info';
  };

  const filteredFavorites = favorites.filter(f =>
    f.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.sport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Back to Favorites
        </button>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span className={`badge ${getTypeBadge(selectedItem.entity_type)}`}>{selectedItem.entity_type}</span>
                <span className="badge badge-info">{selectedItem.sport}</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5', marginBottom: '8px' }}>
                {selectedItem.entity_name}
              </h2>
              <p style={{ color: '#71717a', fontSize: '14px' }}>
                Added: {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleDateString() : 'Unknown'}
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

          {selectedItem.notes && (
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '20px', borderRadius: '12px' }}>
              <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Notes</h4>
              <p style={{ color: '#e4e4e7', lineHeight: '1.7' }}>{selectedItem.notes}</p>
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
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>
              Favorites
            </h1>
            <p style={{ color: '#71717a' }}>Manage your favorite teams, players, and more</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={20} />
          Add Favorite
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
        <input
          type="text"
          placeholder="Search favorites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '48px' }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Heart size={48} color="#71717a" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#a1a1aa', fontSize: '18px', marginBottom: '8px' }}>No favorites yet</h3>
          <p style={{ color: '#71717a' }}>Add your favorite teams, players, and leagues to track them.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Sport</th>
                <th>Notes</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {filteredFavorites.map(fav => (
                <tr key={fav.id} onClick={() => setSelectedItem(fav)}>
                  <td style={{ fontWeight: '600', color: '#f4f4f5' }}>{fav.entity_name}</td>
                  <td><span className={`badge ${getTypeBadge(fav.entity_type)}`}>{fav.entity_type}</span></td>
                  <td><span className="badge badge-info">{fav.sport}</span></td>
                  <td style={{ color: '#a1a1aa', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fav.notes || '-'}
                  </td>
                  <td style={{ color: '#71717a' }}>
                    {fav.created_at ? new Date(fav.created_at).toLocaleDateString() : '-'}
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
        title={editMode ? 'Edit Favorite' : 'Add Favorite'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Entity Type</label>
            <select
              className="form-select"
              value={formData.entity_type}
              onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
            >
              {entityTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.entity_name}
              onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
              placeholder="e.g., Manchester United"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Sport</label>
            <select
              className="form-select"
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
            >
              {sports.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any notes about this favorite..."
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              {editMode ? 'Update' : 'Add Favorite'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Favorites;
