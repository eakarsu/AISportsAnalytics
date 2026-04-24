import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Scale, Plus, Edit2, Trash2, Search, Sparkles,
  ArrowLeft, Save, AlertTriangle, Clock, Users, CheckCircle
} from 'lucide-react';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const RefereeAssistant = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const [formData, setFormData] = useState({
    match_name: '',
    sport: 'Football',
    incident_type: '',
    description: '',
    time_occurred: '',
    players_involved: '',
    severity: 'Medium',
    ai_ruling: '',
    actual_ruling: '',
    video_url: ''
  });

  const [sampleLoading, setSampleLoading] = useState(false);
  const sports = ['Football', 'Basketball', 'American Football', 'Tennis', 'Hockey', 'Baseball', 'Boxing', 'MMA', 'Cricket'];
  const severityLevels = ['Minor', 'Medium', 'Major', 'Critical'];
  const incidentTypes = {
    'Football': ['Handball', 'Offside', 'Penalty', 'Red Card', 'Simulation/Dive', 'Foul', 'Goal Line', 'VAR Review'],
    'Basketball': ['Flagrant Foul', 'Charge/Block', 'Goaltending', 'Traveling', 'Technical Foul', 'Out of Bounds'],
    'American Football': ['Pass Interference', 'Roughing the Passer', 'Holding', 'Targeting', 'Fumble Review', 'Catch/No Catch'],
    'Tennis': ['Line Call', 'Time Violation', 'Code Violation', 'Hindrance', 'Let Call'],
    'Hockey': ['Goaltender Interference', 'High Stick', 'Offside', 'Icing', 'Penalty Shot'],
    'Baseball': ['Check Swing', 'Caught/Trapped', 'Fair/Foul', 'Balk', 'Interference'],
    'Boxing': ['Knockdown vs Slip', 'Low Blow', 'Head Clash', 'Cut Stoppage', 'Holding'],
    'MMA': ['Eye Poke', 'Groin Strike', 'Illegal Elbow', 'Fence Grab', 'Tap Out'],
    'Cricket': ['LBW', 'Caught Behind', 'Run Out', 'No Ball', 'Wide']
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await axios.get('/api/referee');
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedItem) {
        await axios.put(`/api/referee/${selectedItem.id}`, formData);
      } else {
        await axios.post('/api/referee', formData);
      }
      fetchIncidents();
      resetForm();
    } catch (error) {
      console.error('Error saving incident:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      try {
        await axios.delete(`/api/referee/${id}`);
        fetchIncidents();
        setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting incident:', error);
      }
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setAiResponse(null);
  };

  const handleEdit = (item) => {
    setFormData({
      match_name: item.match_name || '',
      sport: item.sport || 'Football',
      incident_type: item.incident_type || '',
      description: item.description || '',
      time_occurred: item.time_occurred || '',
      players_involved: item.players_involved || '',
      severity: item.severity || 'Medium',
      ai_ruling: item.ai_ruling || '',
      actual_ruling: item.actual_ruling || '',
      video_url: item.video_url || ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      match_name: '',
      sport: 'Football',
      incident_type: '',
      description: '',
      time_occurred: '',
      players_involved: '',
      severity: 'Medium',
      ai_ruling: '',
      actual_ruling: '',
      video_url: ''
    });
    setShowForm(false);
    setEditMode(false);
  };

  const loadSampleData = async () => {
    setSampleLoading(true);
    const samples = [
      { match_name: 'World Cup Final 2026', sport: 'Football', incident_type: 'Handball', description: 'Defender raised arm unnaturally to block a cross in the penalty area. Ball struck the hand clearly from close range.', time_occurred: '72:15', players_involved: 'Defender #4 vs Attacker #10', severity: 'Major', ai_ruling: 'Penalty - deliberate handball', actual_ruling: 'Penalty awarded after VAR review' },
      { match_name: 'NBA Finals Game 7', sport: 'Basketball', incident_type: 'Flagrant Foul', description: 'Player drove to the basket and was hit hard across both arms with excessive contact to the head during the shooting motion.', time_occurred: 'Q4 1:45', players_involved: 'Guard #23 fouled by Center #12', severity: 'Major', ai_ruling: 'Flagrant Foul 1 - unnecessary contact', actual_ruling: 'Flagrant Foul 1 called' },
      { match_name: 'Wimbledon Semifinal', sport: 'Tennis', incident_type: 'Line Call', description: 'Serve appeared to clip the line on the far side. Linesperson called it out but player challenged.', time_occurred: 'Set 5, Game 12', players_involved: 'Server challenged the call', severity: 'Medium', ai_ruling: 'Ball clipped the line - overrule to IN', actual_ruling: 'Hawk-Eye showed ball was IN - challenge successful' },
    ];
    try {
      for (const sample of samples) {
        await axios.post('/api/referee', sample);
      }
      fetchIncidents();
    } catch (error) {
      console.error('Error loading sample data:', error);
    } finally {
      setSampleLoading(false);
    }
  };

  const getAIRuling = async () => {
    if (!selectedItem) return;
    setAiLoading(true);
    try {
      const response = await axios.post('/api/ai/referee/analyze', {
        sport: selectedItem.sport,
        incident_description: selectedItem.description,
        players_involved: selectedItem.players_involved,
        time_of_incident: selectedItem.time_occurred,
        video_description: selectedItem.video_url ? 'Video available for review' : null
      });
      setAiResponse(response.data.ruling);
    } catch (error) {
      console.error('Error getting AI ruling:', error);
      alert('Failed to get AI ruling. Please check your OpenRouter API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredIncidents = incidents.filter(i =>
    i.match_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.incident_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Minor': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Major': return '#ef4444';
      case 'Critical': return '#dc2626';
      default: return '#71717a';
    }
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
          Back to Incidents
        </button>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-primary">{selectedItem.sport}</span>
                <span className="badge" style={{
                  background: `${getSeverityColor(selectedItem.severity)}20`,
                  color: getSeverityColor(selectedItem.severity)
                }}>
                  {selectedItem.severity}
                </span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5', marginBottom: '8px' }}>
                {selectedItem.incident_type}
              </h2>
              <p style={{ color: '#a1a1aa' }}>{selectedItem.match_name}</p>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={18} color="#3b82f6" />
                <p style={{ color: '#71717a', fontSize: '12px' }}>Time Occurred</p>
              </div>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#60a5fa' }}>
                {selectedItem.time_occurred || 'Not specified'}
              </p>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={18} color="#8b5cf6" />
                <p style={{ color: '#71717a', fontSize: '12px' }}>Players Involved</p>
              </div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#c4b5fd' }}>
                {selectedItem.players_involved || 'Not specified'}
              </p>
            </div>
            <div style={{ background: `${getSeverityColor(selectedItem.severity)}15`, padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} color={getSeverityColor(selectedItem.severity)} />
                <p style={{ color: '#71717a', fontSize: '12px' }}>Severity Level</p>
              </div>
              <p style={{ fontSize: '18px', fontWeight: '600', color: getSeverityColor(selectedItem.severity) }}>
                {selectedItem.severity}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Incident Description</h4>
            <p style={{
              color: '#e4e4e7',
              lineHeight: '1.7',
              background: 'rgba(0,0,0,0.2)',
              padding: '16px',
              borderRadius: '12px'
            }}>
              {selectedItem.description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {selectedItem.ai_ruling && (
              <div>
                <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scale size={18} /> Stored AI Ruling
                </h4>
                <div style={{
                  background: 'rgba(79, 70, 229, 0.1)',
                  border: '1px solid rgba(79, 70, 229, 0.3)',
                  padding: '16px',
                  borderRadius: '12px'
                }}>
                  <p style={{ color: '#e4e4e7', lineHeight: '1.7' }}>{selectedItem.ai_ruling}</p>
                </div>
              </div>
            )}
            {selectedItem.actual_ruling && (
              <div>
                <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} /> Actual Ruling
                </h4>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '16px',
                  borderRadius: '12px'
                }}>
                  <p style={{ color: '#34d399', lineHeight: '1.7', fontWeight: '500' }}>{selectedItem.actual_ruling}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={getAIRuling}
          disabled={aiLoading}
          style={{ marginBottom: '24px' }}
        >
          {aiLoading ? (
            <>
              <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Get AI Referee Analysis
            </>
          )}
        </button>

        {aiResponse && <AIResponseDisplay response={aiResponse} title="AI Referee Decision Analysis" />}
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
              background: 'linear-gradient(135deg, #dc2626, #ef4444)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Scale size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>
              AI Referee Assistant
            </h1>
            <p style={{ color: '#71717a' }}>AI-powered rule violation detection and officiating support</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={loadSampleData} disabled={sampleLoading}>
            {sampleLoading ? 'Loading...' : 'Load Sample Data'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            New Incident
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
        <input
          type="text"
          placeholder="Search incidents..."
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
                <th>Match</th>
                <th>Sport</th>
                <th>Incident Type</th>
                <th>Time</th>
                <th>Severity</th>
                <th>Actual Ruling</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident) => (
                <tr key={incident.id} onClick={() => handleRowClick(incident)}>
                  <td style={{ fontWeight: '600', color: '#f4f4f5' }}>{incident.match_name}</td>
                  <td><span className="badge badge-primary">{incident.sport}</span></td>
                  <td style={{ color: '#a1a1aa' }}>{incident.incident_type}</td>
                  <td style={{ color: '#71717a' }}>{incident.time_occurred || '-'}</td>
                  <td>
                    <span className="badge" style={{
                      background: `${getSeverityColor(incident.severity)}20`,
                      color: getSeverityColor(incident.severity)
                    }}>
                      {incident.severity}
                    </span>
                  </td>
                  <td style={{ color: '#34d399', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {incident.actual_ruling || '-'}
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
        title={editMode ? 'Edit Incident' : 'Report New Incident'}
        size="large"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Match Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.match_name}
                onChange={(e) => setFormData({ ...formData, match_name: e.target.value })}
                placeholder="e.g., World Cup Final 2024"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sport</label>
              <select
                className="form-select"
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value, incident_type: '' })}
              >
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Incident Type</label>
              <select
                className="form-select"
                value={formData.incident_type}
                onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                required
              >
                <option value="">Select incident type</option>
                {(incidentTypes[formData.sport] || []).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select
                className="form-select"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                {severityLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Time Occurred</label>
              <input
                type="text"
                className="form-input"
                value={formData.time_occurred}
                onChange={(e) => setFormData({ ...formData, time_occurred: e.target.value })}
                placeholder="e.g., 65:32 or Q4 2:15"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Players Involved</label>
              <input
                type="text"
                className="form-input"
                value={formData.players_involved}
                onChange={(e) => setFormData({ ...formData, players_involved: e.target.value })}
                placeholder="e.g., Player A on Player B"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Incident Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what happened in detail..."
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">AI Ruling (if any)</label>
              <textarea
                className="form-textarea"
                value={formData.ai_ruling}
                onChange={(e) => setFormData({ ...formData, ai_ruling: e.target.value })}
                placeholder="What the AI ruled..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Actual Ruling</label>
              <textarea
                className="form-textarea"
                value={formData.actual_ruling}
                onChange={(e) => setFormData({ ...formData, actual_ruling: e.target.value })}
                placeholder="What was the actual call..."
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Video URL (optional)</label>
            <input
              type="url"
              className="form-input"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="modal-footer" style={{ padding: '0', marginTop: '20px', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              {editMode ? 'Update Incident' : 'Report Incident'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RefereeAssistant;
