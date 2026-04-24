import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Bell, CheckCheck, Trash2, ArrowLeft, Filter, AlertCircle,
  Clock, Info, AlertTriangle
} from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const typeFilters = ['all', 'alert', 'reminder', 'update', 'system'];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, is_read: true });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await axios.delete(`/api/notifications/${id}`);
        setNotifications(notifications.filter(n => n.id !== id));
        setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    if (!item.is_read) {
      markAsRead(item.id);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertCircle size={16} />;
      case 'reminder': return <Clock size={16} />;
      case 'update': return <Info size={16} />;
      case 'system': return <AlertTriangle size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getTypeBadge = (type) => {
    const map = {
      alert: 'badge-danger',
      reminder: 'badge-warning',
      update: 'badge-info',
      system: 'badge-primary'
    };
    return map[type] || 'badge-info';
  };

  const getPriorityBadge = (priority) => {
    const map = {
      high: 'badge-danger',
      medium: 'badge-warning',
      low: 'badge-success'
    };
    return map[priority] || 'badge-info';
  };

  const filteredNotifications = notifications.filter(n =>
    filterType === 'all' ? true : n.type === filterType
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (selectedItem) {
    return (
      <div>
        <button
          onClick={() => setSelectedItem(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#a5b4fc',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '24px'
          }}
        >
          <ArrowLeft size={20} />
          Back to Notifications
        </button>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span className={`badge ${getTypeBadge(selectedItem.type)}`}>{selectedItem.type}</span>
                {selectedItem.priority && (
                  <span className={`badge ${getPriorityBadge(selectedItem.priority)}`}>{selectedItem.priority} priority</span>
                )}
                <span className={`badge ${selectedItem.is_read ? 'badge-success' : 'badge-warning'}`}>
                  {selectedItem.is_read ? 'Read' : 'Unread'}
                </span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5', marginBottom: '8px' }}>
                {selectedItem.title}
              </h2>
              <p style={{ color: '#71717a', fontSize: '14px' }}>
                {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : ''}
              </p>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedItem.id)}>
              <Trash2 size={16} /> Delete
            </button>
          </div>

          <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '20px', borderRadius: '12px' }}>
            <p style={{ color: '#e4e4e7', lineHeight: '1.7', fontSize: '16px' }}>
              {selectedItem.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Bell size={24} color="white" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700'
              }}>{unreadCount}</span>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>
              Notifications
            </h1>
            <p style={{ color: '#71717a' }}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck size={18} />
          Mark All Read
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {typeFilters.map(type => (
          <button
            key={type}
            className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Bell size={48} color="#71717a" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#a1a1aa', fontSize: '18px', marginBottom: '8px' }}>No notifications</h3>
          <p style={{ color: '#71717a' }}>You're all caught up!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className="card-clickable"
              onClick={() => handleRowClick(notification)}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                borderLeft: notification.is_read ? '3px solid transparent' : '3px solid #4f46e5',
                opacity: notification.is_read ? 0.7 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: notification.is_read ? 'transparent' : '#4f46e5',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#f4f4f5', fontSize: '15px' }}>
                        {notification.title}
                      </span>
                      <span className={`badge ${getTypeBadge(notification.type)}`} style={{ fontSize: '11px' }}>
                        {notification.type}
                      </span>
                      {notification.priority && (
                        <span className={`badge ${getPriorityBadge(notification.priority)}`} style={{ fontSize: '11px' }}>
                          {notification.priority}
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.4' }}>
                      {notification.message?.substring(0, 120)}{notification.message?.length > 120 ? '...' : ''}
                    </p>
                  </div>
                </div>
                <span style={{ color: '#71717a', fontSize: '12px', flexShrink: 0, marginLeft: '16px' }}>
                  {notification.created_at ? new Date(notification.created_at).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
