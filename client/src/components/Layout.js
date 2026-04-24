import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, TrendingUp, Users, Gamepad2, Trophy, Scale,
  LogOut, Menu, X, User, Zap, Bell, Heart, MessageSquare, Shield,
  Settings, Search, Download, Upload, BarChart3, MessageCircle,
  Lock, FileText, Compass
} from 'lucide-react';

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
        const data = Array.isArray(response.data) ? response.data : response.data.data || [];
        setNotificationCount(data.filter(n => !n.read).length);
      } catch (e) {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const navSections = [
    {
      title: 'Analytics',
      items: [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/betting', icon: TrendingUp, label: 'Betting Analyzer' },
        { path: '/fantasy', icon: Users, label: 'Fantasy Optimizer' },
        { path: '/strategy', icon: Gamepad2, label: 'Game Strategy' },
        { path: '/esports', icon: Trophy, label: 'Esports Tracker' },
        { path: '/referee', icon: Scale, label: 'Referee Assistant' },
        { path: '/charts', icon: BarChart3, label: 'Charts' },
      ]
    },
    {
      title: 'Features',
      items: [
        { path: '/search', icon: Search, label: 'Search' },
        { path: '/notifications', icon: Bell, label: 'Notifications', badge: notificationCount },
        { path: '/favorites', icon: Heart, label: 'Favorites' },
        { path: '/export', icon: Download, label: 'Data Export' },
        { path: '/uploads', icon: Upload, label: 'File Upload' },
      ]
    },
    {
      title: 'Account',
      items: [
        { path: '/profile', icon: User, label: 'Profile' },
        { path: '/settings', icon: Settings, label: 'Settings' },
        { path: '/feedback', icon: MessageSquare, label: 'Feedback' },
        { path: '/contact', icon: MessageCircle, label: 'Contact Support' },
        { path: '/onboarding', icon: Compass, label: 'Getting Started' },
      ]
    },
    {
      title: 'Admin',
      items: [
        { path: '/admin', icon: Shield, label: 'Admin Panel' },
        { path: '/audit', icon: Shield, label: 'Audit Log' },
      ]
    },
    {
      title: 'Legal',
      items: [
        { path: '/privacy', icon: Lock, label: 'Privacy Policy' },
        { path: '/terms', icon: FileText, label: 'Terms of Service' },
      ]
    }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        className="sidebar-nav"
        style={{
          width: sidebarOpen ? '280px' : '80px',
          background: 'linear-gradient(180deg, rgba(20, 20, 35, 0.98) 0%, rgba(15, 15, 26, 0.98) 100%)',
          borderRight: '1px solid rgba(79, 70, 229, 0.2)',
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          zIndex: 100,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(79, 70, 229, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={24} color="white" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#f4f4f5' }}>AI Sports</h1>
              <p style={{ fontSize: '12px', color: '#71717a' }}>Analytics Platform</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }} role="navigation" aria-label="Main navigation">
          {navSections.map((section) => (
            <div key={section.title} style={{ marginBottom: '16px' }}>
              {sidebarOpen && (
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#52525b', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 16px' }}>
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                      marginBottom: '2px', borderRadius: '10px', textDecoration: 'none',
                      color: active ? '#f4f4f5' : '#a1a1aa',
                      background: active ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.3), rgba(124, 58, 237, 0.2))' : 'transparent',
                      border: active ? '1px solid rgba(79, 70, 229, 0.4)' : '1px solid transparent',
                      transition: 'all 0.2s ease', position: 'relative',
                    }}
                  >
                    <Icon size={20} style={{ flexShrink: 0 }} />
                    {sidebarOpen && (
                      <span style={{ fontSize: '13px', fontWeight: active ? '600' : '500', flex: 1 }}>
                        {item.label}
                      </span>
                    )}
                    {item.badge > 0 && (
                      <span style={{
                        background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: '700',
                        padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center',
                        position: sidebarOpen ? 'static' : 'absolute', top: '4px', right: '4px'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(79, 70, 229, 0.2)', flexShrink: 0 }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '10px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '10px' }}>
              <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #059669, #10b981)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} color="white" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
                <p style={{ fontSize: '11px', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            aria-label="Logout"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '12px', width: '100%', padding: '10px 16px',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
            }}
          >
            <LogOut size={18} />
            {sidebarOpen && 'Logout'}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            position: 'absolute', top: '28px', right: '-16px',
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
          }}
        >
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </aside>

      <main
        role="main"
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? '280px' : '80px',
          padding: '32px',
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
