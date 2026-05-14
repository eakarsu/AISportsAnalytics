import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('token');
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  return res.json();
}

export default function AIPickTracker() {
  const [picks, setPicks] = useState([]);
  const [form, setForm] = useState({
    predicted_winner: '', confidence_score: '', sport: '',
    match_name: '', actual_outcome: '', betting_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecentPicks();
  }, []);

  const fetchRecentPicks = async () => {
    try {
      const data = await apiFetch('/ai/model-performance');
      if (data.recent_picks) setPicks(data.recent_picks);
    } catch (e) {
      setError('Failed to load picks');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        confidence_score: form.confidence_score ? parseFloat(form.confidence_score) : undefined,
        betting_id: form.betting_id ? parseInt(form.betting_id) : undefined,
      };
      const data = await apiFetch('/ai/picks/record-outcome', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data.error) throw new Error(data.error);
      setSuccess('Outcome recorded successfully!');
      setForm({ predicted_winner: '', confidence_score: '', sport: '', match_name: '', actual_outcome: '', betting_id: '' });
      fetchRecentPicks();
    } catch (err) {
      setError(err.message || 'Failed to record outcome');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>AI Pick Tracker</h1>

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Record Outcome</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { key: 'match_name', label: 'Match Name', placeholder: 'e.g. Lakers vs Warriors' },
              { key: 'sport', label: 'Sport', placeholder: 'e.g. NBA' },
              { key: 'predicted_winner', label: 'AI Predicted Winner', placeholder: 'Team name' },
              { key: 'actual_outcome', label: 'Actual Outcome *', placeholder: 'e.g. Lakers won' },
              { key: 'confidence_score', label: 'Confidence Score (0-100)', placeholder: '75' },
              { key: 'betting_id', label: 'Betting Analysis ID', placeholder: 'Optional' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  required={key === 'actual_outcome'}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '16px', padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Recording...' : 'Record Outcome'}
          </button>
        </form>
        {success && <div style={{ marginTop: '12px', padding: '10px', background: '#ecfdf5', color: '#065f46', borderRadius: '6px' }}>{success}</div>}
        {error && <div style={{ marginTop: '12px', padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px' }}>{error}</div>}
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Recent Picks</h2>
        {picks.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No picks recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Match', 'Sport', 'Predicted', 'Actual', 'Confidence', 'Result', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {picks.map((pick, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{pick.match_name || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{pick.sport || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{pick.predicted_winner || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{pick.actual_outcome || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{pick.confidence_score ? `${pick.confidence_score}%` : '-'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {pick.is_correct === null ? (
                        <span style={{ padding: '2px 8px', background: '#f3f4f6', color: '#374151', borderRadius: '9999px', fontSize: '12px' }}>Unverified</span>
                      ) : pick.is_correct ? (
                        <span style={{ padding: '2px 8px', background: '#d1fae5', color: '#065f46', borderRadius: '9999px', fontSize: '12px' }}>Correct</span>
                      ) : (
                        <span style={{ padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '9999px', fontSize: '12px' }}>Wrong</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>{new Date(pick.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
