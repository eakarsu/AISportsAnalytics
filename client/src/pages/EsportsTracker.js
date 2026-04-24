import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Trophy, Plus, Edit2, Trash2, Search, Sparkles,
  ArrowLeft, Save, DollarSign, Target, Award, Users
} from 'lucide-react';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const EsportsTracker = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const [formData, setFormData] = useState({
    player_name: '',
    game_title: 'League of Legends',
    team_name: '',
    region: 'North America',
    role: '',
    matches_played: 0,
    wins: 0,
    losses: 0,
    kda_ratio: '',
    avg_score: '',
    ranking: '',
    earnings: ''
  });

  const [sampleLoading, setSampleLoading] = useState(false);
  const games = ['League of Legends', 'CS2', 'Valorant', 'Dota 2', 'Fortnite', 'Overwatch 2', 'Rocket League', 'PUBG'];
  const regions = ['North America', 'Europe', 'Korea', 'China', 'CIS', 'Brazil', 'Southeast Asia', 'Japan'];
  const roles = {
    'League of Legends': ['Top Lane', 'Jungle', 'Mid Lane', 'Bot Lane', 'Support'],
    'CS2': ['AWPer', 'Rifler', 'Entry Fragger', 'Support', 'IGL'],
    'Valorant': ['Duelist', 'Controller', 'Sentinel', 'Initiator', 'IGL'],
    'Dota 2': ['Carry', 'Mid', 'Offlane', 'Support 4', 'Support 5'],
    'Fortnite': ['Solo', 'Duo', 'Trio', 'Squad'],
    'Overwatch 2': ['Tank', 'DPS', 'Support'],
    'Rocket League': ['Striker', 'Midfielder', 'Defender'],
    'PUBG': ['Fragger', 'Support', 'IGL', 'Scout']
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('/api/esports');
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedItem) {
        await axios.put(`/api/esports/${selectedItem.id}`, formData);
      } else {
        await axios.post('/api/esports', formData);
      }
      fetchPlayers();
      resetForm();
    } catch (error) {
      console.error('Error saving player:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await axios.delete(`/api/esports/${id}`);
        fetchPlayers();
        setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting player:', error);
      }
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setAiResponse(null);
  };

  const handleEdit = (item) => {
    setFormData({
      player_name: item.player_name || '',
      game_title: item.game_title || 'League of Legends',
      team_name: item.team_name || '',
      region: item.region || 'North America',
      role: item.role || '',
      matches_played: item.matches_played || 0,
      wins: item.wins || 0,
      losses: item.losses || 0,
      kda_ratio: item.kda_ratio || '',
      avg_score: item.avg_score || '',
      ranking: item.ranking || '',
      earnings: item.earnings || ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      player_name: '',
      game_title: 'League of Legends',
      team_name: '',
      region: 'North America',
      role: '',
      matches_played: 0,
      wins: 0,
      losses: 0,
      kda_ratio: '',
      avg_score: '',
      ranking: '',
      earnings: ''
    });
    setShowForm(false);
    setEditMode(false);
  };

  const loadSampleData = async () => {
    setSampleLoading(true);
    const samples = [
      { player_name: 'Faker', game_title: 'League of Legends', team_name: 'T1', region: 'Korea', role: 'Mid Lane', matches_played: 850, wins: 612, losses: 238, kda_ratio: 5.2, avg_score: 92.5, ranking: 1, earnings: 3500000 },
      { player_name: 's1mple', game_title: 'CS2', team_name: 'NAVI', region: 'Europe', role: 'AWPer', matches_played: 720, wins: 504, losses: 216, kda_ratio: 1.35, avg_score: 88.0, ranking: 2, earnings: 2100000 },
      { player_name: 'TenZ', game_title: 'Valorant', team_name: 'Sentinels', region: 'North America', role: 'Duelist', matches_played: 320, wins: 224, losses: 96, kda_ratio: 1.45, avg_score: 85.3, ranking: 5, earnings: 450000 },
    ];
    try {
      for (const sample of samples) {
        await axios.post('/api/esports', sample);
      }
      fetchPlayers();
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
      const response = await axios.post('/api/ai/esports/analyze', {
        player_name: selectedItem.player_name,
        game_title: selectedItem.game_title,
        stats: {
          matches: selectedItem.matches_played,
          wins: selectedItem.wins,
          losses: selectedItem.losses,
          kda: selectedItem.kda_ratio,
          avg_score: selectedItem.avg_score,
          ranking: selectedItem.ranking
        },
        recent_matches: `Win rate: ${((selectedItem.wins / selectedItem.matches_played) * 100).toFixed(1)}%`
      });
      setAiResponse(response.data.analysis);
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      alert('Failed to get AI analysis. Please check your OpenRouter API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredPlayers = players.filter(p =>
    p.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.game_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.team_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getWinRate = (wins, total) => {
    if (!total) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  const getRankingColor = (rank) => {
    if (rank <= 3) return '#fbbf24';
    if (rank <= 10) return '#10b981';
    if (rank <= 25) return '#3b82f6';
    return '#71717a';
  };

  if (selectedItem) {
    const winRate = getWinRate(selectedItem.wins, selectedItem.matches_played);

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
          Back to Players
        </button>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-warning">{selectedItem.game_title}</span>
                <span className="badge badge-info">{selectedItem.region}</span>
                {selectedItem.ranking <= 10 && (
                  <span className="badge" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                    Top {selectedItem.ranking}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#f4f4f5', marginBottom: '8px' }}>
                {selectedItem.player_name}
              </h2>
              <p style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} /> {selectedItem.team_name} &bull; {selectedItem.role}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <Award size={20} color="#fbbf24" style={{ marginBottom: '8px' }} />
              <p style={{ color: '#71717a', fontSize: '11px', marginBottom: '4px' }}>RANKING</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: getRankingColor(selectedItem.ranking) }}>
                #{selectedItem.ranking}
              </p>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <Target size={20} color="#10b981" style={{ marginBottom: '8px' }} />
              <p style={{ color: '#71717a', fontSize: '11px', marginBottom: '4px' }}>WIN RATE</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#34d399' }}>{winRate}%</p>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <Trophy size={20} color="#8b5cf6" style={{ marginBottom: '8px' }} />
              <p style={{ color: '#71717a', fontSize: '11px', marginBottom: '4px' }}>KDA RATIO</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#c4b5fd' }}>{selectedItem.kda_ratio}</p>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <Target size={20} color="#3b82f6" style={{ marginBottom: '8px' }} />
              <p style={{ color: '#71717a', fontSize: '11px', marginBottom: '4px' }}>AVG SCORE</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>{selectedItem.avg_score}</p>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <DollarSign size={20} color="#10b981" style={{ marginBottom: '8px' }} />
              <p style={{ color: '#71717a', fontSize: '11px', marginBottom: '4px' }}>EARNINGS</p>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#34d399' }}>{formatCurrency(selectedItem.earnings)}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Matches Played</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#f4f4f5' }}>{selectedItem.matches_played}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Wins</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#34d399' }}>{selectedItem.wins}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Losses</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#f87171' }}>{selectedItem.losses}</p>
            </div>
          </div>
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
              Get AI Performance Analysis
            </>
          )}
        </button>

        {aiResponse && <AIResponseDisplay response={aiResponse} title="AI Esports Performance Analysis" />}
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
              background: 'linear-gradient(135deg, #d97706, #f59e0b)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>
              AI Esports Stats Tracker
            </h1>
            <p style={{ color: '#71717a' }}>Track and analyze esports player performance</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={loadSampleData} disabled={sampleLoading}>
            {sampleLoading ? 'Loading...' : 'Load Sample Data'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            Add Player
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
        <input
          type="text"
          placeholder="Search players..."
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
                <th>Rank</th>
                <th>Player</th>
                <th>Game</th>
                <th>Team</th>
                <th>Role</th>
                <th>W/L</th>
                <th>KDA</th>
                <th>Earnings</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr key={player.id} onClick={() => handleRowClick(player)}>
                  <td>
                    <span style={{
                      color: getRankingColor(player.ranking),
                      fontWeight: '700',
                      fontSize: '16px'
                    }}>
                      #{player.ranking}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600', color: '#f4f4f5' }}>{player.player_name}</td>
                  <td><span className="badge badge-warning">{player.game_title}</span></td>
                  <td style={{ color: '#a1a1aa' }}>{player.team_name}</td>
                  <td><span className="badge badge-info">{player.role}</span></td>
                  <td style={{ color: '#a1a1aa' }}>
                    <span style={{ color: '#34d399' }}>{player.wins}</span>
                    {' / '}
                    <span style={{ color: '#f87171' }}>{player.losses}</span>
                  </td>
                  <td style={{ color: '#c4b5fd', fontWeight: '600' }}>{player.kda_ratio}</td>
                  <td style={{ color: '#34d399' }}>{formatCurrency(player.earnings)}</td>
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
        title={editMode ? 'Edit Player' : 'Add New Player'}
        size="large"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Player Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.player_name}
                onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                placeholder="e.g., Faker"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Game</label>
              <select
                className="form-select"
                value={formData.game_title}
                onChange={(e) => setFormData({ ...formData, game_title: e.target.value, role: '' })}
              >
                {games.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Team Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                placeholder="e.g., T1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Region</label>
              <select
                className="form-select"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="">Select role</option>
                {(roles[formData.game_title] || []).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">World Ranking</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.ranking}
                onChange={(e) => setFormData({ ...formData, ranking: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Matches Played</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.matches_played}
                onChange={(e) => setFormData({ ...formData, matches_played: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Wins</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.wins}
                onChange={(e) => setFormData({ ...formData, wins: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Losses</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.losses}
                onChange={(e) => setFormData({ ...formData, losses: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">KDA Ratio</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.kda_ratio}
                onChange={(e) => setFormData({ ...formData, kda_ratio: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Average Score</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={formData.avg_score}
                onChange={(e) => setFormData({ ...formData, avg_score: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Earnings ($)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.earnings}
                onChange={(e) => setFormData({ ...formData, earnings: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '0', marginTop: '20px', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              {editMode ? 'Update Player' : 'Add Player'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EsportsTracker;
