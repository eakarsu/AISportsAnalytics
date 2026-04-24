import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Users, Trash2, BarChart3, Database, TrendingUp, Trophy, Gamepad2, Scale, Bell, Heart, MessageSquare, Shield } from 'lucide-react';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users')
      ]);
      setStats(statsRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Delete this user? This cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/users/${id}`);
        fetchData();
      } catch (error) { console.error('Error:', error); }
    }
  };

  const statCards = stats ? [
    { label: 'Users', value: stats.users || 0, icon: Users, color: '#4f46e5' },
    { label: 'Betting Analyses', value: stats.betting_analyses || 0, icon: TrendingUp, color: '#10b981' },
    { label: 'Fantasy Teams', value: stats.fantasy_teams || 0, icon: Trophy, color: '#3b82f6' },
    { label: 'Strategies', value: stats.game_strategies || 0, icon: Gamepad2, color: '#8b5cf6' },
    { label: 'Esports Stats', value: stats.esports_stats || 0, icon: BarChart3, color: '#f59e0b' },
    { label: 'Referee Incidents', value: stats.referee_incidents || 0, icon: Scale, color: '#ef4444' },
    { label: 'Notifications', value: stats.notifications || 0, icon: Bell, color: '#06b6d4' },
    { label: 'Favorites', value: stats.favorites || 0, icon: Heart, color: '#ec4899' },
    { label: 'Feedback', value: stats.feedback || 0, icon: MessageSquare, color: '#14b8a6' },
    { label: 'Audit Logs', value: stats.audit_logs || 0, icon: Shield, color: '#6366f1' },
    { label: 'Contact Messages', value: stats.contact_messages || 0, icon: MessageSquare, color: '#0891b2' },
    { label: 'File Uploads', value: stats.file_uploads || 0, icon: Database, color: '#d946ef' },
  ] : [];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>Admin Panel</h1>
          <p style={{ color: '#71717a' }}>System overview and user management</p>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f4f4f5', marginBottom: '16px' }}>System Statistics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} style={{ background: 'linear-gradient(145deg, rgba(30,30,50,0.9), rgba(20,20,35,0.95))', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '4px' }}>{stat.label}</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>{stat.value}</p>
                </div>
                <div style={{ width: '40px', height: '40px', background: `${stat.color}20`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f4f4f5', marginBottom: '16px' }}>User Management</h2>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ cursor: 'default' }}>
                <td style={{ color: '#a1a1aa' }}>{user.id}</td>
                <td style={{ fontWeight: '600', color: '#f4f4f5' }}>{user.name}</td>
                <td style={{ color: '#a1a1aa' }}>{user.email}</td>
                <td><span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>{user.role || 'user'}</span></td>
                <td><span className={`badge ${user.email_verified ? 'badge-success' : 'badge-warning'}`}>{user.email_verified ? 'Yes' : 'No'}</span></td>
                <td style={{ color: '#71717a' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user.id)} style={{ padding: '4px 12px' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
