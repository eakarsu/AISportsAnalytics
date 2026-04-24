import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, TrendingUp, Users, Gamepad2, Trophy, Scale, ArrowRight } from 'lucide-react';

const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}&type=${type}`);
      setResults(response.data);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const entityConfig = {
    betting: { icon: TrendingUp, color: '#10b981', path: '/betting', label: 'Betting Analyses' },
    fantasy: { icon: Users, color: '#3b82f6', path: '/fantasy', label: 'Fantasy Teams' },
    strategy: { icon: Gamepad2, color: '#8b5cf6', path: '/strategy', label: 'Game Strategies' },
    esports: { icon: Trophy, color: '#f59e0b', path: '/esports', label: 'Esports Stats' },
    referee: { icon: Scale, color: '#ef4444', path: '/referee', label: 'Referee Incidents' }
  };

  const getDisplayName = (item, type) => {
    if (type === 'betting') return item.match_name;
    if (type === 'fantasy') return item.team_name;
    if (type === 'strategy') return item.strategy_name;
    if (type === 'esports') return item.player_name;
    if (type === 'referee') return item.match_name;
    return 'Unknown';
  };

  const getSubtext = (item, type) => {
    if (type === 'betting') return `${item.sport} - ${item.team_a} vs ${item.team_b}`;
    if (type === 'fantasy') return `${item.sport} - ${item.player_count} players`;
    if (type === 'strategy') return `${item.game_type} - ${item.difficulty_level}`;
    if (type === 'esports') return `${item.game_title} - ${item.team_name}`;
    if (type === 'referee') return `${item.sport} - ${item.incident_type}`;
    return '';
  };

  const totalResults = results ? Object.values(results.results || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0) : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>Global Search</h1>
          <p style={{ color: '#71717a' }}>Search across all data in the platform</p>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
          <input type="text" placeholder="Search for matches, teams, players, strategies..." value={query} onChange={(e) => setQuery(e.target.value)} className="form-input" style={{ paddingLeft: '48px', fontSize: '16px' }} />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="form-select" style={{ width: '180px' }}>
          <option value="all">All Types</option>
          <option value="betting">Betting</option>
          <option value="fantasy">Fantasy</option>
          <option value="strategy">Strategy</option>
          <option value="esports">Esports</option>
          <option value="referee">Referee</option>
        </select>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {loading && <div className="loading-spinner"><div className="spinner" /></div>}

      {results && !loading && (
        <div>
          <p style={{ color: '#71717a', marginBottom: '24px' }}>{totalResults} result{totalResults !== 1 ? 's' : ''} found for "{results.query}"</p>
          {Object.entries(results.results || {}).map(([entityType, items]) => {
            if (!Array.isArray(items) || items.length === 0) return null;
            const config = entityConfig[entityType];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <div key={entityType} style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Icon size={20} color={config.color} />
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f4f4f5' }}>{config.label}</h3>
                  <span style={{ background: `${config.color}20`, color: config.color, padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map(item => (
                    <div key={item.id} onClick={() => navigate(config.path)} className="card card-clickable" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: '600', color: '#f4f4f5', marginBottom: '4px' }}>{getDisplayName(item, entityType)}</p>
                        <p style={{ color: '#71717a', fontSize: '13px' }}>{getSubtext(item, entityType)}</p>
                      </div>
                      <ArrowRight size={18} color="#71717a" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {totalResults === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <Search size={48} style={{ color: '#71717a', marginBottom: '16px' }} />
              <p style={{ color: '#71717a', fontSize: '16px' }}>No results found for "{results.query}"</p>
            </div>
          )}
        </div>
      )}

      {!results && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <Search size={48} style={{ color: '#71717a', marginBottom: '16px' }} />
          <p style={{ color: '#71717a', fontSize: '16px' }}>Enter a search term to find matches, teams, players, and more</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
