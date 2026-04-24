import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, Plus, Edit2, Trash2, Search, Sparkles,
  ArrowLeft, Save, DollarSign, Trophy, Target
} from 'lucide-react';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const FantasyOptimizer = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const [formData, setFormData] = useState({
    team_name: '',
    sport: 'Football',
    budget: '',
    formation: '',
    strategy: '',
    total_points: 0,
    optimization_score: ''
  });

  const [sampleLoading, setSampleLoading] = useState(false);
  const sports = ['Football', 'Basketball', 'Baseball', 'Hockey', 'American Football', 'Cricket'];
  const formations = ['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1', '3-4-3'];

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/fantasy');
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedItem) {
        await axios.put(`/api/fantasy/${selectedItem.id}`, formData);
      } else {
        await axios.post('/api/fantasy', formData);
      }
      fetchTeams();
      resetForm();
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await axios.delete(`/api/fantasy/${id}`);
        fetchTeams();
        setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting team:', error);
      }
    }
  };

  const handleRowClick = async (item) => {
    try {
      const response = await axios.get(`/api/fantasy/${item.id}`);
      setSelectedItem(response.data);
      setAiResponse(null);
    } catch (error) {
      console.error('Error fetching team details:', error);
      setSelectedItem(item);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      team_name: item.team_name || '',
      sport: item.sport || 'Football',
      budget: item.budget || '',
      formation: item.formation || '',
      strategy: item.strategy || '',
      total_points: item.total_points || 0,
      optimization_score: item.optimization_score || ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      team_name: '',
      sport: 'Football',
      budget: '',
      formation: '',
      strategy: '',
      total_points: 0,
      optimization_score: ''
    });
    setShowForm(false);
    setEditMode(false);
  };

  const loadSampleData = async () => {
    setSampleLoading(true);
    const samples = [
      { team_name: 'Premier League All-Stars', sport: 'Football', budget: 100000000, formation: '4-3-3', strategy: 'Aggressive attacking with high pressing', total_points: 2450, optimization_score: 88 },
      { team_name: 'NBA Fantasy Kings', sport: 'Basketball', budget: 150000000, formation: '', strategy: 'Focus on high-usage rate players with consistent scoring', total_points: 3200, optimization_score: 92 },
      { team_name: 'MLB Dream Team', sport: 'Baseball', budget: 80000000, formation: '', strategy: 'Balance power hitters with high OBP players', total_points: 1800, optimization_score: 75 },
    ];
    try {
      for (const sample of samples) {
        await axios.post('/api/fantasy', sample);
      }
      fetchTeams();
    } catch (error) {
      console.error('Error loading sample data:', error);
    } finally {
      setSampleLoading(false);
    }
  };

  const getAIOptimization = async () => {
    if (!selectedItem) return;
    setAiLoading(true);
    try {
      const response = await axios.post('/api/ai/fantasy/optimize', {
        sport: selectedItem.sport,
        budget: selectedItem.budget,
        current_players: selectedItem.players || [],
        strategy_preference: selectedItem.strategy
      });
      setAiResponse(response.data.optimization);
    } catch (error) {
      console.error('Error getting AI optimization:', error);
      alert('Failed to get AI optimization. Please check your OpenRouter API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredTeams = teams.filter(t =>
    t.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.sport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  if (selectedItem) {
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
          Back to Teams
        </button>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: '12px' }}>{selectedItem.sport}</span>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5', marginBottom: '8px' }}>
                {selectedItem.team_name}
              </h2>
              {selectedItem.formation && (
                <p style={{ color: '#71717a' }}>Formation: {selectedItem.formation}</p>
              )}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <DollarSign size={18} color="#3b82f6" />
                <p style={{ color: '#71717a', fontSize: '12px' }}>Budget</p>
              </div>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa' }}>
                {formatCurrency(selectedItem.budget)}
              </p>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Trophy size={18} color="#10b981" />
                <p style={{ color: '#71717a', fontSize: '12px' }}>Total Points</p>
              </div>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#34d399' }}>
                {selectedItem.total_points?.toLocaleString()}
              </p>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={18} color="#f59e0b" />
                <p style={{ color: '#71717a', fontSize: '12px' }}>Players</p>
              </div>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24' }}>
                {selectedItem.player_count}
              </p>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Target size={18} color="#8b5cf6" />
                <p style={{ color: '#71717a', fontSize: '12px' }}>Optimization Score</p>
              </div>
              <p style={{ fontSize: '20px', fontWeight: '700', color: getScoreColor(selectedItem.optimization_score) }}>
                {selectedItem.optimization_score}%
              </p>
            </div>
          </div>

          {selectedItem.strategy && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Team Strategy</h4>
              <p style={{ color: '#e4e4e7', lineHeight: '1.7' }}>{selectedItem.strategy}</p>
            </div>
          )}

          {selectedItem.players && selectedItem.players.length > 0 && (
            <div>
              <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '12px' }}>Squad ({selectedItem.players.length} players)</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Position</th>
                      <th>Team</th>
                      <th>Price</th>
                      <th>Projected Pts</th>
                      <th>Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.players.map((player) => (
                      <tr key={player.id} style={{ cursor: 'default' }}>
                        <td style={{ fontWeight: '600', color: '#f4f4f5' }}>{player.player_name}</td>
                        <td><span className="badge badge-primary">{player.position}</span></td>
                        <td style={{ color: '#a1a1aa' }}>{player.real_team}</td>
                        <td style={{ color: '#60a5fa' }}>{formatCurrency(player.price)}</td>
                        <td style={{ color: '#34d399' }}>{player.projected_points}</td>
                        <td>
                          <span style={{ color: getScoreColor(player.form_rating * 10) }}>
                            {player.form_rating}/10
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={getAIOptimization}
          disabled={aiLoading}
          style={{ marginBottom: '24px' }}
        >
          {aiLoading ? (
            <>
              <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              Optimizing...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Get AI Optimization
            </>
          )}
        </button>

        {aiResponse && <AIResponseDisplay response={aiResponse} title="AI Fantasy Team Optimization" />}
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
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>
              AI Fantasy Team Optimizer
            </h1>
            <p style={{ color: '#71717a' }}>Build and optimize your fantasy teams with AI</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={loadSampleData} disabled={sampleLoading}>
            {sampleLoading ? 'Loading...' : 'Load Sample Data'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            New Team
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
        <input
          type="text"
          placeholder="Search teams..."
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
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Sport</th>
                <th>Budget</th>
                <th>Players</th>
                <th>Total Points</th>
                <th>Formation</th>
                <th>Optimization</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => (
                <tr key={team.id} onClick={() => handleRowClick(team)}>
                  <td style={{ fontWeight: '600', color: '#f4f4f5' }}>{team.team_name}</td>
                  <td><span className="badge badge-info">{team.sport}</span></td>
                  <td style={{ color: '#60a5fa' }}>{formatCurrency(team.budget)}</td>
                  <td style={{ color: '#a1a1aa' }}>{team.player_count}</td>
                  <td style={{ color: '#34d399', fontWeight: '600' }}>{team.total_points?.toLocaleString()}</td>
                  <td style={{ color: '#a1a1aa' }}>{team.formation || '-'}</td>
                  <td>
                    <span style={{
                      color: getScoreColor(team.optimization_score),
                      fontWeight: '600'
                    }}>
                      {team.optimization_score}%
                    </span>
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
        title={editMode ? 'Edit Team' : 'New Fantasy Team'}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Team Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                placeholder="e.g., Dream XI Champions"
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
              <label className="form-label">Budget</label>
              <input
                type="number"
                className="form-input"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g., 100000000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Formation</label>
              <select
                className="form-select"
                value={formData.formation}
                onChange={(e) => setFormData({ ...formData, formation: e.target.value })}
              >
                <option value="">Select formation</option>
                {formations.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total Points</label>
              <input
                type="number"
                className="form-input"
                value={formData.total_points}
                onChange={(e) => setFormData({ ...formData, total_points: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Optimization Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.optimization_score}
                onChange={(e) => setFormData({ ...formData, optimization_score: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Team Strategy</label>
            <textarea
              className="form-textarea"
              value={formData.strategy}
              onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
              placeholder="Describe your team strategy..."
            />
          </div>
          <div className="modal-footer" style={{ padding: '0', marginTop: '20px', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              {editMode ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FantasyOptimizer;
