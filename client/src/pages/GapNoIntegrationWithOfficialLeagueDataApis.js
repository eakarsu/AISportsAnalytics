// // === Batch 08 Gaps & Frontend Mounts ===
// Feature: No integration with official league data APIs (ESPN, Sportradar)
import { useState } from 'react'

const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || 'http://localhost:5001'

function getHeaders() {
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || ''
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export default function GapNoIntegrationWithOfficialLeagueDataApis() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/gap-no-integration-with-official-league-data-apis-espn/run`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ prompt: input, feature: 'gap-no-integration-with-official-league-data-apis-espn', project: 'AISportsAnalytics' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>No integration with official league data APIs (ESPN, Sportradar)</h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Batch 08 · gap_non_ai · AISportsAnalytics</p>
      <form onSubmit={submit} style={{ marginTop: 16 }}>
        <textarea rows={6} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe input..."
          style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
        <button type="submit" disabled={loading || !input.trim()}
          style={{ marginTop: 10, padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Running...' : 'Run Feature'}
        </button>
      </form>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 12, borderRadius: 6, marginTop: 16 }}>{error}</div>}
      {result && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginTop: 16 }}>
          <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Result</h2>
          <pre style={{ fontSize: '0.75rem', background: '#f8fafc', padding: 12, overflowX: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
