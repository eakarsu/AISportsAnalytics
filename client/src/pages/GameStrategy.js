import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Gamepad2, Plus, Edit2, Trash2, Search, Sparkles,
  ArrowLeft, Save, Target, Award, Lightbulb
} from 'lucide-react';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const GameStrategy = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [customQuestion, setCustomQuestion] = useState('');

  const [formData, setFormData] = useState({
    game_type: 'Chess',
    strategy_name: '',
    description: '',
    difficulty_level: 'Intermediate',
    win_rate: '',
    key_moves: '',
    counter_strategies: '',
    best_situations: ''
  });

  const [sampleLoading, setSampleLoading] = useState(false);
  const gameTypes = ['Chess', 'Poker', 'Go', 'Backgammon', 'Bridge'];
  const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const response = await axios.get('/api/strategy');
      setStrategies(response.data);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedItem) {
        await axios.put(`/api/strategy/${selectedItem.id}`, formData);
      } else {
        await axios.post('/api/strategy', formData);
      }
      fetchStrategies();
      resetForm();
    } catch (error) {
      console.error('Error saving strategy:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      try {
        await axios.delete(`/api/strategy/${id}`);
        fetchStrategies();
        setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting strategy:', error);
      }
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setAiResponse(null);
    setCustomQuestion('');
  };

  const handleEdit = (item) => {
    setFormData({
      game_type: item.game_type || 'Chess',
      strategy_name: item.strategy_name || '',
      description: item.description || '',
      difficulty_level: item.difficulty_level || 'Intermediate',
      win_rate: item.win_rate || '',
      key_moves: item.key_moves || '',
      counter_strategies: item.counter_strategies || '',
      best_situations: item.best_situations || ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      game_type: 'Chess',
      strategy_name: '',
      description: '',
      difficulty_level: 'Intermediate',
      win_rate: '',
      key_moves: '',
      counter_strategies: '',
      best_situations: ''
    });
    setShowForm(false);
    setEditMode(false);
  };

  const loadSampleData = async () => {
    setSampleLoading(true);
    const samples = [
      { game_type: 'Chess', strategy_name: 'Sicilian Defense', description: 'A sharp and aggressive defense against 1.e4, leading to asymmetrical positions with chances for both sides.', difficulty_level: 'Advanced', win_rate: 54.5, key_moves: '1.e4 c5 - Control the center from the flank', counter_strategies: 'Anti-Sicilian systems like the Alapin (2.c3) or Grand Prix Attack', best_situations: 'When playing as Black against 1.e4 and seeking dynamic counterplay' },
      { game_type: 'Poker', strategy_name: 'Tight Aggressive (TAG)', description: 'Play a selective range of strong hands but bet and raise aggressively when entering pots.', difficulty_level: 'Intermediate', win_rate: 58.0, key_moves: 'Raise 3x with premium hands, c-bet 60-70% of flops, fold weak hands preflop', counter_strategies: 'Loose aggressive players who apply pressure with wider ranges', best_situations: 'Cash games and early-mid stages of tournaments' },
      { game_type: 'Chess', strategy_name: 'London System', description: 'A solid, flexible opening system for White that can be played against virtually any Black defense.', difficulty_level: 'Beginner', win_rate: 52.0, key_moves: '1.d4, 2.Bf4, 3.e3, 4.Nf3 - Develop pieces to natural squares', counter_strategies: 'Kings Indian setup or aggressive pawn breaks with ...c5 and ...e5', best_situations: 'When seeking a reliable opening with minimal theory required' },
    ];
    try {
      for (const sample of samples) {
        await axios.post('/api/strategy', sample);
      }
      fetchStrategies();
    } catch (error) {
      console.error('Error loading sample data:', error);
    } finally {
      setSampleLoading(false);
    }
  };

  const getAIAdvice = async () => {
    if (!selectedItem) return;
    setAiLoading(true);
    try {
      const response = await axios.post('/api/ai/strategy/analyze', {
        game_type: selectedItem.game_type,
        current_situation: selectedItem.description,
        skill_level: selectedItem.difficulty_level,
        specific_question: customQuestion || `Explain how to effectively use the ${selectedItem.strategy_name} strategy`
      });
      setAiResponse(response.data.strategy);
    } catch (error) {
      console.error('Error getting AI advice:', error);
      alert('Failed to get AI advice. Please check your OpenRouter API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredStrategies = strategies.filter(s =>
    s.strategy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.game_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWinRateColor = (rate) => {
    if (rate >= 55) return '#10b981';
    if (rate >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#3b82f6';
      case 'Advanced': return '#f59e0b';
      case 'Expert': return '#ef4444';
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
          Back to Strategies
        </button>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-primary">{selectedItem.game_type}</span>
                <span className="badge" style={{
                  background: `${getDifficultyColor(selectedItem.difficulty_level)}20`,
                  color: getDifficultyColor(selectedItem.difficulty_level)
                }}>
                  {selectedItem.difficulty_level}
                </span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5', marginBottom: '8px' }}>
                {selectedItem.strategy_name}
              </h2>
              <p style={{ color: '#a1a1aa', lineHeight: '1.7' }}>{selectedItem.description}</p>
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
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Award size={18} color="#10b981" />
                <p style={{ color: '#71717a', fontSize: '12px' }}>Win Rate</p>
              </div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: getWinRateColor(selectedItem.win_rate) }}>
                {selectedItem.win_rate}%
              </p>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Gamepad2 size={18} color="#8b5cf6" />
                <p style={{ color: '#71717a', fontSize: '12px' }}>Game Type</p>
              </div>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#c4b5fd' }}>
                {selectedItem.game_type}
              </p>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Target size={18} color="#3b82f6" />
                <p style={{ color: '#71717a', fontSize: '12px' }}>Difficulty</p>
              </div>
              <p style={{ fontSize: '20px', fontWeight: '700', color: getDifficultyColor(selectedItem.difficulty_level) }}>
                {selectedItem.difficulty_level}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {selectedItem.key_moves && (
              <div>
                <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lightbulb size={18} /> Key Moves
                </h4>
                <p style={{ color: '#e4e4e7', lineHeight: '1.7', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  {selectedItem.key_moves}
                </p>
              </div>
            )}
            {selectedItem.counter_strategies && (
              <div>
                <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Counter Strategies</h4>
                <p style={{ color: '#e4e4e7', lineHeight: '1.7', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  {selectedItem.counter_strategies}
                </p>
              </div>
            )}
            {selectedItem.best_situations && (
              <div style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Best Situations</h4>
                <p style={{ color: '#e4e4e7', lineHeight: '1.7', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  {selectedItem.best_situations}
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">Ask AI a specific question (optional)</label>
          <textarea
            className="form-textarea"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="e.g., How do I defend against counter-attacks when using this strategy?"
            style={{ marginBottom: '12px' }}
          />
          <button
            className="btn btn-primary"
            onClick={getAIAdvice}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Get AI Strategy Advice
              </>
            )}
          </button>
        </div>

        {aiResponse && <AIResponseDisplay response={aiResponse} title="AI Strategy Advice" />}
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
              background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Gamepad2 size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>
              AI Game Strategy Advisor
            </h1>
            <p style={{ color: '#71717a' }}>Master chess, poker, and strategic games with AI</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={loadSampleData} disabled={sampleLoading}>
            {sampleLoading ? 'Loading...' : 'Load Sample Data'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            New Strategy
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
        <input
          type="text"
          placeholder="Search strategies..."
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
                <th>Strategy Name</th>
                <th>Game</th>
                <th>Difficulty</th>
                <th>Win Rate</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredStrategies.map((strategy) => (
                <tr key={strategy.id} onClick={() => handleRowClick(strategy)}>
                  <td style={{ fontWeight: '600', color: '#f4f4f5' }}>{strategy.strategy_name}</td>
                  <td><span className="badge badge-primary">{strategy.game_type}</span></td>
                  <td>
                    <span className="badge" style={{
                      background: `${getDifficultyColor(strategy.difficulty_level)}20`,
                      color: getDifficultyColor(strategy.difficulty_level)
                    }}>
                      {strategy.difficulty_level}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      color: getWinRateColor(strategy.win_rate),
                      fontWeight: '600'
                    }}>
                      {strategy.win_rate}%
                    </span>
                  </td>
                  <td style={{ color: '#a1a1aa', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {strategy.description}
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
        title={editMode ? 'Edit Strategy' : 'New Game Strategy'}
        size="large"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Strategy Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.strategy_name}
                onChange={(e) => setFormData({ ...formData, strategy_name: e.target.value })}
                placeholder="e.g., Sicilian Defense"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Game Type</label>
              <select
                className="form-select"
                value={formData.game_type}
                onChange={(e) => setFormData({ ...formData, game_type: e.target.value })}
              >
                {gameTypes.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select
                className="form-select"
                value={formData.difficulty_level}
                onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
              >
                {difficultyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Win Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="form-input"
                value={formData.win_rate}
                onChange={(e) => setFormData({ ...formData, win_rate: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the strategy..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Key Moves</label>
            <textarea
              className="form-textarea"
              value={formData.key_moves}
              onChange={(e) => setFormData({ ...formData, key_moves: e.target.value })}
              placeholder="What are the key moves or actions?"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Counter Strategies</label>
              <textarea
                className="form-textarea"
                value={formData.counter_strategies}
                onChange={(e) => setFormData({ ...formData, counter_strategies: e.target.value })}
                placeholder="How to counter this strategy?"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Best Situations</label>
              <textarea
                className="form-textarea"
                value={formData.best_situations}
                onChange={(e) => setFormData({ ...formData, best_situations: e.target.value })}
                placeholder="When to use this strategy?"
              />
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '0', marginTop: '20px', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              {editMode ? 'Update Strategy' : 'Create Strategy'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GameStrategy;
