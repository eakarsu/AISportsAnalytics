import React, { useState } from 'react';
import axios from 'axios';
import { Download, FileJson, FileSpreadsheet, CheckCircle } from 'lucide-react';

const DataExport = () => {
  const [dataType, setDataType] = useState('betting');
  const [format, setFormat] = useState('json');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [exports, setExports] = useState([]);

  const dataTypes = [
    { value: 'betting', label: 'Betting Analyses' },
    { value: 'fantasy', label: 'Fantasy Teams' },
    { value: 'strategy', label: 'Game Strategies' },
    { value: 'esports', label: 'Esports Stats' },
    { value: 'referee', label: 'Referee Incidents' }
  ];

  const handleExport = async () => {
    setLoading(true);
    try {
      if (format === 'csv') {
        const response = await axios.get(`/api/export/${dataType}?format=csv`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${dataType}_export.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setPreview(null);
      } else {
        const response = await axios.get(`/api/export/${dataType}?format=json`);
        setPreview(response.data);
      }
      setExports(prev => [{ type: dataType, format, date: new Date().toLocaleString() }, ...prev.slice(0, 9)]);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #059669, #10b981)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Download size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>Data Export</h1>
          <p style={{ color: '#71717a' }}>Export your data in CSV or JSON format</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f4f4f5', marginBottom: '20px' }}>Export Configuration</h3>
          <div className="form-group">
            <label className="form-label">Data Type</label>
            <select className="form-select" value={dataType} onChange={(e) => setDataType(e.target.value)}>
              {dataTypes.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Format</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { value: 'json', label: 'JSON', icon: FileJson, color: '#f59e0b' },
                { value: 'csv', label: 'CSV', icon: FileSpreadsheet, color: '#10b981' }
              ].map(f => {
                const Icon = f.icon;
                return (
                  <button key={f.value} onClick={() => setFormat(f.value)} style={{
                    flex: 1, padding: '16px', borderRadius: '12px', cursor: 'pointer',
                    background: format === f.value ? `${f.color}20` : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${format === f.value ? f.color : 'rgba(255,255,255,0.1)'}`,
                    color: format === f.value ? f.color : '#a1a1aa', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    <Icon size={20} /> <span style={{ fontWeight: '600' }}>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleExport} disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            <Download size={18} /> {loading ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </button>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f4f4f5', marginBottom: '20px' }}>Recent Exports</h3>
          {exports.length === 0 ? (
            <p style={{ color: '#71717a', textAlign: 'center', padding: '40px 0' }}>No exports yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {exports.map((exp, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <CheckCircle size={16} color="#10b981" />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#f4f4f5', fontSize: '14px', fontWeight: '500' }}>{dataTypes.find(d => d.value === exp.type)?.label}</p>
                    <p style={{ color: '#71717a', fontSize: '12px' }}>{exp.format.toUpperCase()} - {exp.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {preview && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f4f4f5', marginBottom: '16px' }}>JSON Preview</h3>
          <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', overflow: 'auto', maxHeight: '400px', color: '#e4e4e7', fontSize: '13px', lineHeight: '1.6' }}>
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DataExport;
