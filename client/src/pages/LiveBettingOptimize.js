import React, { useState } from 'react';
import FormattedAIReport from '../components/FormattedAIReport';
import { Zap, AlertCircle } from 'lucide-react';

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

const examples = [
  { label: "NBA close game", values: {"sport": "NBA", "match": "Boston Celtics vs New York Knicks", "score": "101-98", "time_remaining": "Q4 3:42", "current_odds": "{\"home_ml\":-145,\"away_ml\":125,\"spread\":-2.5}", "momentum": "{\"home_run_last_5_min\":8,\"away_turnovers\":2}", "bankroll": "1000", "risk_tolerance": "low"} },
  { label: "Soccer late draw", values: {"sport": "Premier League", "match": "Arsenal vs Liverpool", "score": "1-1", "time_remaining": "78th minute", "current_odds": "{\"home_ml\":165,\"draw\":210,\"away_ml\":180}", "momentum": "{\"home_shots_on_target_last_15_min\":3,\"away_shots_on_target_last_15_min\":1}", "bankroll": "750", "risk_tolerance": "medium"} },
  { label: "NFL second half", values: {"sport": "NFL", "match": "Kansas City Chiefs vs Buffalo Bills", "score": "20-17", "time_remaining": "Q3 6:18", "current_odds": "{\"home_ml\":-120,\"away_ml\":110,\"spread\":-1.5}", "momentum": "{\"home_drives_scoring_last_3\":2,\"away_turnovers\":1}", "bankroll": "1500", "risk_tolerance": "high"} }
];

export default function LiveBettingOptimize() {
  const [form, setForm] = useState({
    sport: '',
    match: '',
    score: '',
    time_remaining: '',
    current_odds: '',
    momentum: '',
    bankroll: '',
    risk_tolerance: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const payload = {
        sport: form.sport,
        match: form.match,
        score: form.score,
        time_remaining: form.time_remaining,
        current_odds: form.current_odds ? safeParse(form.current_odds) : undefined,
        momentum: form.momentum ? safeParse(form.momentum) : undefined,
        bankroll: form.bankroll ? Number(form.bankroll) : undefined,
        risk_tolerance: form.risk_tolerance,
      };
      const data = await apiPost('/ai/live-betting-optimize', payload);
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
          <Zap size={28} color="#7c3aed" /> Live Betting Optimization
        </h1>
        <p style={{ color: '#a1a1aa', marginTop: 6, fontSize: 14 }}>AI-driven in-play stake sizing, hedging, and timing recommendations.</p>
      </div>

      <div role="group" aria-label="Complete example inputs" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {examples.map(({ label, values }) => <button key={label} type="button" className="btn btn-secondary" disabled={loading} onClick={() => setForm((current) => ({ ...current, ...values }))}>{label}</button>)}
      </div>
      <form onSubmit={handleSubmit} style={{ background: 'rgba(30, 30, 50, 0.6)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Sport *" required value={form.sport} onChange={(v) => handleChange('sport', v)} placeholder="NBA, NFL, EPL..." />
          <Field label="Match *" required value={form.match} onChange={(v) => handleChange('match', v)} placeholder="Lakers vs Celtics" />
          <Field label="Score" value={form.score} onChange={(v) => handleChange('score', v)} placeholder="78-72" />
          <Field label="Time Remaining" value={form.time_remaining} onChange={(v) => handleChange('time_remaining', v)} placeholder="Q4 4:32" />
          <Field label="Bankroll" type="number" value={form.bankroll} onChange={(v) => handleChange('bankroll', v)} placeholder="1000" />
          <div>
            <label style={labelStyle}>Risk Tolerance</label>
            <select value={form.risk_tolerance} onChange={(e) => handleChange('risk_tolerance', e.target.value)} style={inputStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Current Odds (JSON)</label>
          <textarea value={form.current_odds} onChange={(e) => handleChange('current_odds', e.target.value)}
            placeholder='{"home_ml":-150,"away_ml":+135,"spread":-3.5}'
            style={{ ...inputStyle, minHeight: 70, fontFamily: 'monospace' }} />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Momentum Signals (JSON)</label>
          <textarea value={form.momentum} onChange={(e) => handleChange('momentum', e.target.value)}
            placeholder='{"home_run_pct_last_5_min":0.62,"key_player_fouls":3}'
            style={{ ...inputStyle, minHeight: 70, fontFamily: 'monospace' }} />
        </div>
        <button type="submit" disabled={loading}
          style={{ marginTop: 18, padding: '10px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Optimizing...' : 'Optimize Live Bet'}
        </button>
      </form>

      {error && (
        <div style={{ background: 'rgba(220, 38, 38, 0.15)', border: '1px solid #dc2626', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {result && <FormattedAIReport response={result} title="Optimization" />}
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: 6, color: '#a1a1aa', fontSize: 13, fontWeight: 500 };
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(79, 70, 229, 0.3)', background: 'rgba(15, 15, 26, 0.7)', color: '#f4f4f5', fontSize: 14 };

function safeParse(s) {
  try { return JSON.parse(s); } catch { return s; }
}

function Field({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} style={inputStyle} />
    </div>
  );
}
