import React, { useState } from 'react';
import { Newspaper, AlertCircle } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('token');
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.status === 503) {
    const detail = data && (data.detail || data.error) ? `: ${data.detail || data.error}` : '';
    throw new Error(`AI service not configured${detail}`);
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function NewsSentiment() {
  const [form, setForm] = useState({
    sport: '',
    team_or_player: '',
    timeframe: 'recent',
    headlines: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const lines = form.headlines.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) throw new Error('Provide at least one headline');
      const payload = {
        sport: form.sport,
        team_or_player: form.team_or_player,
        timeframe: form.timeframe,
        headlines: lines,
      };
      const data = await apiPost('/ai/news-sentiment', payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 26, fontWeight: 700, color: '#f4f4f5' }}>
          <Newspaper size={28} color="#7c3aed" /> News Sentiment Analysis
        </h1>
        <p style={{ color: '#a1a1aa', marginTop: 6, fontSize: 14 }}>Score sports media sentiment for fantasy/betting impact projections.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'rgba(30, 30, 50, 0.6)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Sport" value={form.sport} onChange={(v) => handleChange('sport', v)} placeholder="NBA, NFL..." />
          <Field label="Team or Player" value={form.team_or_player} onChange={(v) => handleChange('team_or_player', v)} placeholder="Lakers, LeBron James" />
          <div>
            <label style={labelStyle}>Timeframe</label>
            <select value={form.timeframe} onChange={(e) => handleChange('timeframe', e.target.value)} style={inputStyle}>
              <option value="last_24h">Last 24 hours</option>
              <option value="recent">Recent</option>
              <option value="last_7d">Last 7 days</option>
              <option value="season">Season</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Headlines (one per line) *</label>
          <textarea required value={form.headlines} onChange={(e) => handleChange('headlines', e.target.value)}
            placeholder={'Star player ruled out for finals\nTrade rumors swirl ahead of deadline\nCoach signs three-year extension'}
            style={{ ...inputStyle, minHeight: 140 }} />
        </div>
        <button type="submit" disabled={loading}
          style={{ marginTop: 18, padding: '10px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
      </form>

      {error && (
        <div style={{ background: 'rgba(220, 38, 38, 0.15)', border: '1px solid #dc2626', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {result && (
        <div style={{ background: 'rgba(30, 30, 50, 0.6)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: 12, padding: 20 }}>
          <h2 style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Sentiment</h2>
          <pre style={{ color: '#d4d4d8', fontSize: 12, whiteSpace: 'pre-wrap', background: 'rgba(15, 15, 26, 0.7)', padding: 14, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: 6, color: '#a1a1aa', fontSize: 13, fontWeight: 500 };
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(79, 70, 229, 0.3)', background: 'rgba(15, 15, 26, 0.7)', color: '#f4f4f5', fontSize: 14 };

function Field({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} style={inputStyle} />
    </div>
  );
}
