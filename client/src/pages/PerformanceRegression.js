import React, { useState } from 'react';
import { TrendingDown, AlertCircle } from 'lucide-react';

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
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function PerformanceRegression() {
  const [form, setForm] = useState({
    player_name: '',
    sport: '',
    position: '',
    age: '',
    seasons_played: '',
    recent_stats: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      let recent_stats;
      if (form.recent_stats.trim()) {
        try { recent_stats = JSON.parse(form.recent_stats); } catch { recent_stats = form.recent_stats; }
      }
      const payload = {
        player_name: form.player_name,
        sport: form.sport,
        position: form.position,
        age: form.age ? Number(form.age) : undefined,
        seasons_played: form.seasons_played ? Number(form.seasons_played) : undefined,
        ...(recent_stats !== undefined ? { recent_stats } : {}),
      };
      const data = await apiPost('/ai/performance-regression', payload);
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
          <TrendingDown size={28} color="#7c3aed" /> Performance Regression
        </h1>
        <p style={{ color: '#a1a1aa', marginTop: 6, fontSize: 14 }}>Detect regression signals and projected decline curve.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'rgba(30, 30, 50, 0.6)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Player Name" value={form.player_name} onChange={(v) => handleChange('player_name', v)} />
          <Field label="Sport" value={form.sport} onChange={(v) => handleChange('sport', v)} />
          <Field label="Position" value={form.position} onChange={(v) => handleChange('position', v)} />
          <Field label="Age" type="number" value={form.age} onChange={(v) => handleChange('age', v)} />
          <Field label="Seasons Played" type="number" value={form.seasons_played} onChange={(v) => handleChange('seasons_played', v)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Recent Stats (JSON or text)</label>
          <textarea value={form.recent_stats} onChange={(e) => handleChange('recent_stats', e.target.value)}
            rows={4} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }}
            placeholder='{"ppg": 22.4, "fg_pct": 0.43}' />
        </div>
        <button type="submit" disabled={loading}
          style={{ marginTop: 18, padding: '10px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Analyzing...' : 'Analyze Regression'}
        </button>
      </form>

      {error && (
        <div style={{ background: 'rgba(220, 38, 38, 0.15)', border: '1px solid #dc2626', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {result && (
        <div style={{ background: 'rgba(30, 30, 50, 0.6)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: 12, padding: 20 }}>
          <h2 style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Analysis</h2>
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
