import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingUp, Plus, Edit2, Trash2, X, Search, Sparkles,
  Calendar, Target, BarChart3, ArrowLeft, Save
} from 'lucide-react';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const BettingAnalyzer = () => {
  const [analyses, setAnalyses] = useState([]);
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
    team_a: '',
    team_b: '',
    odds_team_a: '',
    odds_team_b: '',
    odds_draw: '',
    predicted_winner: '',
    confidence_score: '',
    analysis_notes: '',
    match_date: ''
  });

  const [sampleLoading, setSampleLoading] = useState(false);
  const sports = ['Football', 'Basketball', 'Tennis', 'American Football', 'Baseball', 'Hockey', 'Boxing', 'MMA'];

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await axios.get('/api/betting');
      setAnalyses(response.data);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedItem) {
        await axios.put(`/api/betting/${selectedItem.id}`, formData);
      } else {
        await axios.post('/api/betting', formData);
      }
      fetchAnalyses();
      resetForm();
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await axios.delete(`/api/betting/${id}`);
        fetchAnalyses();
        setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting analysis:', error);
      }
    }
  };

  const handleRowClick = async (item) => {
    setSelectedItem(item);
    setAiResponse(null);
  };

  const handleEdit = (item) => {
    setFormData({
      match_name: item.match_name || '',
      sport: item.sport || 'Football',
      team_a: item.team_a || '',
      team_b: item.team_b || '',
      odds_team_a: item.odds_team_a || '',
      odds_team_b: item.odds_team_b || '',
      odds_draw: item.odds_draw || '',
      predicted_winner: item.predicted_winner || '',
      confidence_score: item.confidence_score || '',
      analysis_notes: item.analysis_notes || '',
      match_date: item.match_date ? item.match_date.split('T')[0] : ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      match_name: '',
      sport: 'Football',
      team_a: '',
      team_b: '',
      odds_team_a: '',
      odds_team_b: '',
      odds_draw: '',
      predicted_winner: '',
      confidence_score: '',
      analysis_notes: '',
      match_date: ''
    });
    setShowForm(false);
    setEditMode(false);
  };

  const loadSampleData = async () => {
    setSampleLoading(true);
    const samples = [
      { match_name: 'Manchester United vs Liverpool', sport: 'Football', team_a: 'Manchester United', team_b: 'Liverpool', odds_team_a: 2.50, odds_team_b: 2.80, odds_draw: 3.20, predicted_winner: 'Liverpool', confidence_score: 65, analysis_notes: 'Liverpool in strong form, 5 wins in last 6 matches. United missing key defenders.', match_date: '2026-03-15' },
      { match_name: 'Lakers vs Warriors', sport: 'Basketball', team_a: 'LA Lakers', team_b: 'Golden State Warriors', odds_team_a: 1.90, odds_team_b: 1.95, predicted_winner: 'Warriors', confidence_score: 55, analysis_notes: 'Close matchup. Warriors have home court advantage.', match_date: '2026-03-20' },
      { match_name: 'Djokovic vs Alcaraz', sport: 'Tennis', team_a: 'Novak Djokovic', team_b: 'Carlos Alcaraz', odds_team_a: 2.10, odds_team_b: 1.75, predicted_winner: 'Alcaraz', confidence_score: 60, analysis_notes: 'Grand Slam semifinal on clay. Alcaraz favored on surface.', match_date: '2026-06-10' },
    ];
    try {
      for (const sample of samples) {
        await axios.post('/api/betting', sample);
      }
      fetchAnalyses();
    } catch (error) {
      console.error('Error loading sample data:', error);
    } finally {
      setSampleLoading(false);
    }
  };

  const getAIAnalysis = async () => {
    if (!selectedItem) return;
    setAiLoading(true);
    try {
      const response = await axios.post('/api/ai/betting/analyze', {
        team_a: selectedItem.team_a,
        team_b: selectedItem.team_b,
        sport: selectedItem.sport,
        odds_team_a: selectedItem.odds_team_a,
        odds_team_b: selectedItem.odds_team_b,
        odds_draw: selectedItem.odds_draw,
        additional_info: selectedItem.analysis_notes
      });
      setAiResponse(response.data.analysis);
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      alert('Failed to get AI analysis. Please check your OpenRouter API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter(a =>
    a.match_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.team_a.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.team_b.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConfidenceColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
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
          Back to List
        </button>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '12px' }}>{selectedItem.sport}</span>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5', marginBottom: '8px' }}>
                {selectedItem.match_name}
              </h2>
              <p style={{ color: '#71717a' }}>
                {selectedItem.team_a} vs {selectedItem.team_b}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Odds - {selectedItem.team_a}</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#a5b4fc' }}>{selectedItem.odds_team_a}</p>
            </div>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Odds - {selectedItem.team_b}</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#a5b4fc' }}>{selectedItem.odds_team_b}</p>
            </div>
            {selectedItem.odds_draw && (
              <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '16px', borderRadius: '12px' }}>
                <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Odds - Draw</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#a5b4fc' }}>{selectedItem.odds_draw}</p>
              </div>
            )}
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Confidence</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: getConfidenceColor(selectedItem.confidence_score) }}>
                {selectedItem.confidence_score}%
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Predicted Winner</h4>
              <p style={{ color: '#f4f4f5', fontSize: '18px', fontWeight: '600' }}>{selectedItem.predicted_winner}</p>
            </div>
            <div>
              <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Match Date</h4>
              <p style={{ color: '#f4f4f5' }}>
                {selectedItem.match_date ? new Date(selectedItem.match_date).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>

          {selectedItem.analysis_notes && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Analysis Notes</h4>
              <p style={{ color: '#e4e4e7', lineHeight: '1.7' }}>{selectedItem.analysis_notes}</p>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={getAIAnalysis}
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
              Get AI Analysis
            </>
          )}
        </button>

        {aiResponse && <AIResponseDisplay response={aiResponse} title="AI Betting Analysis" />}
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
              background: 'linear-gradient(135deg, #059669, #10b981)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>
              AI Sports Betting Analyzer
            </h1>
            <p style={{ color: '#71717a' }}>Analyze odds and get AI-powered predictions</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={loadSampleData} disabled={sampleLoading}>
            {sampleLoading ? 'Loading...' : 'Load Sample Data'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            New Analysis
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
        <input
          type="text"
          placeholder="Search analyses..."
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
                <th>Teams</th>
                <th>Odds</th>
                <th>Prediction</th>
                <th>Confidence</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnalyses.map((analysis) => (
                <tr key={analysis.id} onClick={() => handleRowClick(analysis)}>
                  <td style={{ fontWeight: '600', color: '#f4f4f5' }}>{analysis.match_name}</td>
                  <td><span className="badge badge-info">{analysis.sport}</span></td>
                  <td style={{ color: '#a1a1aa' }}>{analysis.team_a} vs {analysis.team_b}</td>
                  <td style={{ color: '#a1a1aa' }}>{analysis.odds_team_a} / {analysis.odds_team_b}</td>
                  <td style={{ color: '#10b981', fontWeight: '500' }}>{analysis.predicted_winner}</td>
                  <td>
                    <span style={{
                      color: getConfidenceColor(analysis.confidence_score),
                      fontWeight: '600'
                    }}>
                      {analysis.confidence_score}%
                    </span>
                  </td>
                  <td style={{ color: '#71717a' }}>
                    {analysis.match_date ? new Date(analysis.match_date).toLocaleDateString() : '-'}
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
        title={editMode ? 'Edit Analysis' : 'New Betting Analysis'}
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
                placeholder="e.g., Manchester United vs Liverpool"
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
              <label className="form-label">Team A</label>
              <input
                type="text"
                className="form-input"
                value={formData.team_a}
                onChange={(e) => setFormData({ ...formData, team_a: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Team B</label>
              <input
                type="text"
                className="form-input"
                value={formData.team_b}
                onChange={(e) => setFormData({ ...formData, team_b: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Odds - Team A</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.odds_team_a}
                onChange={(e) => setFormData({ ...formData, odds_team_a: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Odds - Team B</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.odds_team_b}
                onChange={(e) => setFormData({ ...formData, odds_team_b: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Odds - Draw (optional)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.odds_draw}
                onChange={(e) => setFormData({ ...formData, odds_draw: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Match Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.match_date}
                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Predicted Winner</label>
              <input
                type="text"
                className="form-input"
                value={formData.predicted_winner}
                onChange={(e) => setFormData({ ...formData, predicted_winner: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confidence Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.confidence_score}
                onChange={(e) => setFormData({ ...formData, confidence_score: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Analysis Notes</label>
            <textarea
              className="form-textarea"
              value={formData.analysis_notes}
              onChange={(e) => setFormData({ ...formData, analysis_notes: e.target.value })}
              placeholder="Add any relevant notes about this analysis..."
            />
          </div>
          <div className="modal-footer" style={{ padding: '0', marginTop: '20px', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              {editMode ? 'Update Analysis' : 'Create Analysis'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BettingAnalyzer;
