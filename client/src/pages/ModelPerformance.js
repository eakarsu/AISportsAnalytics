import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
function getToken() { return localStorage.getItem('token'); }
async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
}

export default function ModelPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/ai/model-performance')
      .then(setData)
      .catch(() => setError('Failed to load performance data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '24px', color: 'red' }}>{error}</div>;
  if (!data) return null;

  const perf = data.performance || {};

  const StatCard = ({ label, value, color = '#2563eb' }) => (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', textAlign: 'center' }}>
      <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 'bold', color, marginTop: '4px' }}>{value}</p>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>AI Model Performance</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Picks" value={perf.total_picks || 0} />
        <StatCard label="Accuracy Rate" value={perf.accuracy_rate ? `${perf.accuracy_rate}%` : 'N/A'} color="#059669" />
        <StatCard label="Correct Picks" value={perf.correct_picks || 0} color="#059669" />
        <StatCard label="Avg Confidence" value={perf.avg_confidence ? `${perf.avg_confidence}%` : 'N/A'} color="#7c3aed" />
      </div>

      {data.by_sport && data.by_sport.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Performance by Sport</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Sport', 'Total Picks', 'Correct', 'Accuracy'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_sport.map((s, i) => (
                <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '500' }}>{s.sport}</td>
                  <td style={{ padding: '10px 12px', color: '#374151' }}>{s.picks}</td>
                  <td style={{ padding: '10px 12px', color: '#059669' }}>{s.correct}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '9999px', height: '6px' }}>
                        <div style={{ width: `${s.accuracy || 0}%`, background: '#2563eb', height: '6px', borderRadius: '9999px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>{s.accuracy || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Recent Predictions</h2>
        {(!data.recent_picks || data.recent_picks.length === 0) ? (
          <p style={{ color: '#6b7280' }}>No predictions recorded yet. Use the AI Pick Tracker to record outcomes.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Match', 'Predicted', 'Actual', 'Result', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_picks.map((pick, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{pick.match_name || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{pick.predicted_winner || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{pick.actual_outcome || '-'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {pick.is_correct === null ? (
                        <span style={{ padding: '2px 8px', background: '#f3f4f6', color: '#374151', borderRadius: '9999px', fontSize: '12px' }}>Pending</span>
                      ) : pick.is_correct ? (
                        <span style={{ padding: '2px 8px', background: '#d1fae5', color: '#065f46', borderRadius: '9999px', fontSize: '12px' }}>Correct</span>
                      ) : (
                        <span style={{ padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '9999px', fontSize: '12px' }}>Incorrect</span>
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
