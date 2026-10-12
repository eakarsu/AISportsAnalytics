import React, { useState } from 'react';
import FormattedAIReport from '../components/FormattedAIReport';
import { Activity, AlertCircle } from 'lucide-react';

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

const examples = [
  { label: "NBA ankle sprain", values: {"player_name": "Example point guard", "sport": "NBA", "position": "Point guard", "age": "27", "injury_type": "Grade 2 ankle sprain", "injury_severity": "moderate"} },
  { label: "NFL hamstring", values: {"player_name": "Example wide receiver", "sport": "NFL", "position": "Wide receiver", "age": "29", "injury_type": "Hamstring strain", "injury_severity": "mild"} },
  { label: "Soccer ACL injury", values: {"player_name": "Example midfielder", "sport": "Soccer", "position": "Midfielder", "age": "24", "injury_type": "ACL tear", "injury_severity": "severe"} }
];

export default function InjuryImpact() {
  const [form, setForm] = useState({
    player_name: '',
    sport: '',
    position: '',
    age: '',
    injury_type: '',
    injury_severity: 'moderate',
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
        player_name: form.player_name,
        sport: form.sport,
        position: form.position,
        age: form.age ? Number(form.age) : undefined,
        injury_type: form.injury_type,
        injury_severity: form.injury_severity,
      };
      const data = await apiPost('/ai/injury-impact', payload);
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
          <Activity size={28} color="#7c3aed" /> Injury Impact Projection
        </h1>
        <p style={{ color: '#a1a1aa', marginTop: 6, fontSize: 14 }}>AI-driven recovery timeline and downstream performance impact.</p>
      </div>

      <div role="group" aria-label="Complete example inputs" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {examples.map(({ label, values }) => <button key={label} type="button" className="btn btn-secondary" disabled={loading} onClick={() => setForm((current) => ({ ...current, ...values }))}>{label}</button>)}
      </div>
      <form onSubmit={handleSubmit} style={{ background: 'rgba(30, 30, 50, 0.6)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Player Name" value={form.player_name} onChange={(v) => handleChange('player_name', v)} />
          <Field label="Sport" value={form.sport} onChange={(v) => handleChange('sport', v)} placeholder="NBA, NFL, MLB..." />
          <Field label="Position" value={form.position} onChange={(v) => handleChange('position', v)} />
          <Field label="Age" type="number" value={form.age} onChange={(v) => handleChange('age', v)} />
          <Field label="Injury Type *" required value={form.injury_type} onChange={(v) => handleChange('injury_type', v)} placeholder="ACL tear, hamstring..." />
          <div>
            <label style={labelStyle}>Severity</label>
            <select value={form.injury_severity} onChange={(e) => handleChange('injury_severity', e.target.value)} style={inputStyle}>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
              <option value="career-threatening">Career-threatening</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading}
          style={{ marginTop: 18, padding: '10px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Projecting...' : 'Project Impact'}
        </button>
      </form>

      {error && (
        <div style={{ background: 'rgba(220, 38, 38, 0.15)', border: '1px solid #dc2626', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {result && <FormattedAIReport response={result} title="Projection" />}
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
