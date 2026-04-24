import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, ArrowLeft, Search, Clock, Filter } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/audit');
      setLogs(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const actionColors = {
    login: '#10b981', create: '#3b82f6', update: '#f59e0b',
    delete: '#ef4444', export: '#8b5cf6', search: '#06b6d4',
    ai_analysis: '#7c3aed', upload: '#14b8a6'
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  if (selectedLog) {
    return (
      <div>
        <button onClick={() => setSelectedLog(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', marginBottom: '24px' }}>
          <ArrowLeft size={20} /> Back to Logs
        </button>
        <div className="card">
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5', marginBottom: '24px' }}>Audit Log Detail</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              { label: 'Action', value: selectedLog.action },
              { label: 'Entity Type', value: selectedLog.entity_type },
              { label: 'Entity ID', value: selectedLog.entity_id },
              { label: 'User ID', value: selectedLog.user_id },
              { label: 'IP Address', value: selectedLog.ip_address },
              { label: 'Date', value: new Date(selectedLog.created_at).toLocaleString() }
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '16px', borderRadius: '12px' }}>
                <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#f4f4f5' }}>{item.value || 'N/A'}</p>
              </div>
            ))}
          </div>
          {selectedLog.details && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px' }}>Details</h4>
              <p style={{ color: '#e4e4e7', lineHeight: '1.7', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>{selectedLog.details}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>Audit Log</h1>
            <p style={{ color: '#71717a' }}>View system activity and changes (read-only)</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
          <input type="text" placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input" style={{ paddingLeft: '48px' }} />
        </div>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="form-select" style={{ width: '200px' }}>
          <option value="all">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filteredLogs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <Shield size={48} style={{ color: '#71717a', marginBottom: '16px' }} />
          <p style={{ color: '#71717a', fontSize: '16px' }}>No audit logs found</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>User ID</th>
                <th>IP Address</th>
                <th>Details</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} onClick={() => setSelectedLog(log)}>
                  <td>
                    <span style={{ background: `${actionColors[log.action] || '#71717a'}20`, color: actionColors[log.action] || '#71717a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: '#a1a1aa' }}>{log.entity_type || '-'}</td>
                  <td style={{ color: '#a1a1aa' }}>{log.entity_id || '-'}</td>
                  <td style={{ color: '#a1a1aa' }}>{log.user_id}</td>
                  <td style={{ color: '#71717a', fontFamily: 'monospace', fontSize: '13px' }}>{log.ip_address || '-'}</td>
                  <td style={{ color: '#a1a1aa', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || '-'}</td>
                  <td style={{ color: '#71717a' }}>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
