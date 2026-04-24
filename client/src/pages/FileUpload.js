import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, Trash2, File, Image, FileText } from 'lucide-react';

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/upload', { headers: { Authorization: `Bearer ${token}` } });
      setFiles(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const handleUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      for (const file of fileList) {
        const formData = new FormData();
        formData.append('file', file);
        await axios.post('/api/upload', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchFiles();
    } catch (error) { console.error('Error:', error); } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/upload/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchFiles();
    } catch (error) { console.error('Error:', error); }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return Image;
    if (type?.includes('pdf') || type?.includes('text')) return FileText;
    return File;
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); handleUpload(e.dataTransfer.files); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Upload size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>File Upload</h1>
          <p style={{ color: '#71717a' }}>Upload and manage your files</p>
        </div>
      </div>

      <div
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? '#4f46e5' : 'rgba(79,70,229,0.3)'}`,
          borderRadius: '16px', padding: '48px', textAlign: 'center', cursor: 'pointer',
          background: dragActive ? 'rgba(79,70,229,0.1)' : 'rgba(79,70,229,0.03)',
          transition: 'all 0.3s ease', marginBottom: '32px'
        }}
      >
        <Upload size={40} style={{ color: '#71717a', marginBottom: '16px' }} />
        <p style={{ color: '#f4f4f5', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
          {uploading ? 'Uploading...' : 'Drag & drop files here or click to browse'}
        </p>
        <p style={{ color: '#71717a', fontSize: '14px' }}>Supports images, PDFs, CSVs, and documents</p>
        <input ref={fileInputRef} type="file" multiple onChange={(e) => handleUpload(e.target.files)} style={{ display: 'none' }} />
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : files.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <File size={48} style={{ color: '#71717a', marginBottom: '16px' }} />
          <p style={{ color: '#71717a' }}>No files uploaded yet</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr></thead>
            <tbody>
              {files.map(file => {
                const FileIcon = getFileIcon(file.file_type);
                return (
                  <tr key={file.id} style={{ cursor: 'default' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileIcon size={20} color="#a5b4fc" />
                        <span style={{ fontWeight: '600', color: '#f4f4f5' }}>{file.original_name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#a1a1aa' }}>{file.file_type || 'Unknown'}</td>
                    <td style={{ color: '#a1a1aa' }}>{formatSize(file.file_size)}</td>
                    <td style={{ color: '#71717a' }}>{new Date(file.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(file.id)} style={{ padding: '4px 12px' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
