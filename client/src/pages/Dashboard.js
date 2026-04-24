import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  TrendingUp, Users, Gamepad2, Trophy, Scale, ArrowRight, Activity, Target, Zap, BarChart3,
  Bell, Heart, MessageSquare, Shield, Search, Download, Upload, Settings, MessageCircle,
  Lock, FileText, Compass, User
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ betting: 0, fantasy: 0, strategy: 0, esports: 0, referee: 0 });
  const [newStats, setNewStats] = useState({ notifications: 0, favorites: 0, feedback: 0, contacts: 0 });
  const [loading, setLoading] = useState(true);
  const [liveScore, setLiveScore] = useState({ home: 0, away: 0, time: '0:00' });

  useEffect(() => {
    fetchStats();
    // Real-time simulation (#34)
    const interval = setInterval(() => {
      setLiveScore(prev => {
        const time = parseInt(prev.time) + 1;
        return {
          home: time % 15 === 0 ? prev.home + 1 : prev.home,
          away: time % 20 === 0 ? prev.away + 1 : prev.away,
          time: `${time}:00`
        };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [betting, fantasy, strategy, esports, referee] = await Promise.all([
        axios.get('/api/betting'), axios.get('/api/fantasy'), axios.get('/api/strategy'),
        axios.get('/api/esports'), axios.get('/api/referee')
      ]);
      const getData = (r) => Array.isArray(r.data) ? r.data : r.data.data || [];
      setStats({
        betting: getData(betting).length, fantasy: getData(fantasy).length,
        strategy: getData(strategy).length, esports: getData(esports).length,
        referee: getData(referee).length
      });

      // Fetch new feature counts
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [notifs, favs, fb, contacts] = await Promise.all([
          axios.get('/api/notifications', { headers }).catch(() => ({ data: [] })),
          axios.get('/api/favorites', { headers }).catch(() => ({ data: [] })),
          axios.get('/api/feedback').catch(() => ({ data: [] })),
          axios.get('/api/contact').catch(() => ({ data: [] }))
        ]);
        setNewStats({
          notifications: (Array.isArray(notifs.data) ? notifs.data : notifs.data.data || []).length,
          favorites: (Array.isArray(favs.data) ? favs.data : favs.data.data || []).length,
          feedback: (Array.isArray(fb.data) ? fb.data : fb.data.data || []).length,
          contacts: (Array.isArray(contacts.data) ? contacts.data : contacts.data.data || []).length
        });
      } catch (e) {}
    } catch (error) { console.error('Error fetching stats:', error); } finally { setLoading(false); }
  };

  const features = [
    { id: 'betting', title: 'AI Sports Betting Analyzer', description: 'Advanced odds analysis and predictions using machine learning', icon: TrendingUp, path: '/betting', color: '#10b981', gradient: 'linear-gradient(135deg, #059669, #10b981)', count: stats.betting, label: 'Analyses' },
    { id: 'fantasy', title: 'AI Fantasy Team Optimizer', description: 'Smart lineup suggestions and player recommendations', icon: Users, path: '/fantasy', color: '#3b82f6', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', count: stats.fantasy, label: 'Teams' },
    { id: 'strategy', title: 'AI Game Strategy Advisor', description: 'Expert chess and poker analysis with winning strategies', icon: Gamepad2, path: '/strategy', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', count: stats.strategy, label: 'Strategies' },
    { id: 'esports', title: 'AI Esports Stats Tracker', description: 'Comprehensive gaming performance analytics and rankings', icon: Trophy, path: '/esports', color: '#f59e0b', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', count: stats.esports, label: 'Players' },
    { id: 'referee', title: 'AI Referee Assistant', description: 'Rule violation detection and automated officiating support', icon: Scale, path: '/referee', color: '#ef4444', gradient: 'linear-gradient(135deg, #dc2626, #ef4444)', count: stats.referee, label: 'Incidents' },
    { id: 'charts', title: 'Charts & Analytics', description: 'Interactive data visualizations and performance graphs', icon: BarChart3, path: '/charts', color: '#06b6d4', gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)', count: null, label: 'View' },
  ];

  const quickFeatures = [
    { icon: Bell, label: 'Notifications', path: '/notifications', color: '#f59e0b', count: newStats.notifications },
    { icon: Heart, label: 'Favorites', path: '/favorites', color: '#ec4899', count: newStats.favorites },
    { icon: Search, label: 'Search', path: '/search', color: '#4f46e5', count: null },
    { icon: Download, label: 'Export', path: '/export', color: '#10b981', count: null },
    { icon: Upload, label: 'Uploads', path: '/uploads', color: '#8b5cf6', count: null },
    { icon: MessageSquare, label: 'Feedback', path: '/feedback', color: '#14b8a6', count: newStats.feedback },
    { icon: User, label: 'Profile', path: '/profile', color: '#3b82f6', count: null },
    { icon: Settings, label: 'Settings', path: '/settings', color: '#71717a', count: null },
    { icon: Shield, label: 'Admin', path: '/admin', color: '#ef4444', count: null },
    { icon: MessageCircle, label: 'Support', path: '/contact', color: '#0891b2', count: newStats.contacts },
    { icon: Compass, label: 'Onboarding', path: '/onboarding', color: '#7c3aed', count: null },
    { icon: Shield, label: 'Audit Log', path: '/audit', color: '#6366f1', count: null },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#f4f4f5' }}>Welcome to AI Sports Analytics</h1>
            <p style={{ color: '#71717a', fontSize: '16px' }}>Your intelligent companion for sports analysis and predictions</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: 'Total Records', value: Object.values(stats).reduce((a, b) => a + b, 0), icon: BarChart3, color: '#4f46e5' },
          { label: 'AI Models Active', value: 5, icon: Zap, color: '#10b981' },
          { label: 'Sports Covered', value: 8, icon: Activity, color: '#f59e0b' },
          { label: 'Live Score', value: `${liveScore.home} - ${liveScore.away}`, icon: Target, color: '#ef4444' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} style={{ background: 'linear-gradient(145deg, rgba(30, 30, 50, 0.9), rgba(20, 20, 35, 0.95))', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '8px' }}>{stat.label}</p>
                  <p style={{ fontSize: '28px', fontWeight: '700', color: '#f4f4f5' }}>{loading ? '...' : stat.value}</p>
                </div>
                <div style={{ width: '48px', height: '48px', background: `${stat.color}20`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} color={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI-Powered Features */}
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f4f4f5', marginBottom: '24px' }}>AI-Powered Features</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px' }}>
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.id} onClick={() => navigate(feature.path)} className="card card-clickable" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50%', right: '-50%', width: '200px', height: '200px', background: `radial-gradient(circle, ${feature.color}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ width: '56px', height: '56px', background: feature.gradient, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${feature.color}40` }}>
                    <Icon size={28} color="white" />
                  </div>
                  {feature.count !== null && (
                    <div style={{ background: `${feature.color}20`, padding: '8px 16px', borderRadius: '20px' }}>
                      <span style={{ color: feature.color, fontWeight: '600', fontSize: '14px' }}>{loading ? '...' : `${feature.count} ${feature.label}`}</span>
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f4f4f5', marginBottom: '12px' }}>{feature.title}</h3>
                <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>{feature.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: feature.color, fontSize: '14px', fontWeight: '600' }}>
                  Explore Feature <ArrowRight size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Access Features */}
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f4f4f5', marginBottom: '24px' }}>Quick Access</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {quickFeatures.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} onClick={() => navigate(item.path)} className="card card-clickable" style={{ padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ width: '44px', height: '44px', background: `${item.color}20`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Icon size={22} color={item.color} />
              </div>
              <p style={{ color: '#f4f4f5', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{item.label}</p>
              {item.count !== null && <p style={{ color: '#71717a', fontSize: '12px' }}>{item.count} items</p>}
            </div>
          );
        })}
      </div>

      {/* Getting Started */}
      <div style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(124, 58, 237, 0.1))', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '20px', padding: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f4f4f5', marginBottom: '16px' }}>Getting Started</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { step: '1', title: 'Select a Feature', desc: 'Choose from our AI-powered analytics tools' },
            { step: '2', title: 'Input Your Data', desc: 'Add matches, teams, or incidents to analyze' },
            { step: '3', title: 'Get AI Insights', desc: 'Receive intelligent analysis and recommendations' },
          ].map((item) => (
            <div key={item.step} style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                {item.step}
              </div>
              <div>
                <h4 style={{ fontWeight: '600', color: '#f4f4f5', marginBottom: '4px' }}>{item.title}</h4>
                <p style={{ color: '#71717a', fontSize: '13px' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
