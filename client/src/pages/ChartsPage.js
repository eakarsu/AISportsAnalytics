import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const ChartsPage = () => {
  const [bettingData, setBettingData] = useState([]);
  const [esportsData, setEsportsData] = useState([]);
  const [fantasyData, setFantasyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [betting, esports, fantasy] = await Promise.all([
          axios.get('/api/betting'),
          axios.get('/api/esports'),
          axios.get('/api/fantasy')
        ]);
        setBettingData(Array.isArray(betting.data) ? betting.data : betting.data.data || []);
        setEsportsData(Array.isArray(esports.data) ? esports.data : esports.data.data || []);
        setFantasyData(Array.isArray(fantasy.data) ? fantasy.data : fantasy.data.data || []);
      } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

  const tooltipStyle = {
    backgroundColor: 'rgba(20, 20, 35, 0.95)',
    border: '1px solid rgba(79, 70, 229, 0.3)',
    borderRadius: '8px',
    color: '#e4e4e7'
  };

  // Sport distribution for pie chart
  const sportCounts = bettingData.reduce((acc, b) => {
    acc[b.sport] = (acc[b.sport] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(sportCounts).map(([name, value]) => ({ name, value }));

  // Top 10 betting confidence
  const confidenceData = bettingData.slice(0, 10).map(b => ({
    name: b.match_name?.length > 20 ? b.match_name.substring(0, 20) + '...' : b.match_name,
    confidence: parseFloat(b.confidence_score) || 0
  }));

  // Esports earnings
  const earningsData = esportsData.slice(0, 10).map(e => ({
    name: e.player_name,
    earnings: parseFloat(e.earnings) || 0
  })).sort((a, b) => b.earnings - a.earnings);

  // Fantasy team points
  const fantasyPoints = fantasyData.slice(0, 10).map(f => ({
    name: f.team_name?.length > 15 ? f.team_name.substring(0, 15) + '...' : f.team_name,
    points: parseFloat(f.total_points) || 0,
    score: parseFloat(f.optimization_score) || 0
  }));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart3 size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>Charts & Analytics</h1>
          <p style={{ color: '#71717a' }}>Visualize your sports data with interactive charts</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Confidence Scores */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f4f4f5', marginBottom: '20px' }}>Betting Confidence Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={confidenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fill: '#71717a' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="confidence" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                {confidenceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sports Distribution */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f4f4f5', marginBottom: '20px' }}>Sports Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#71717a' }}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Esports Earnings */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f4f4f5', marginBottom: '20px' }}>Esports Player Earnings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fill: '#71717a' }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'Earnings']} />
              <Line type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Fantasy Team Points */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f4f4f5', marginBottom: '20px' }}>Fantasy Team Points</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fantasyPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fill: '#71717a' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="points" fill="#3b82f6" name="Total Points" radius={[4, 4, 0, 0]} />
              <Bar dataKey="score" fill="#8b5cf6" name="Optimization Score" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartsPage;
