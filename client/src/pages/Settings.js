import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Settings as SettingsIcon, Save, Moon, Sun, Globe, Bell, Mail, Clock
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'en',
    notifications_enabled: true,
    email_alerts: true,
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' }
  ];

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland'
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings({
        theme: response.data.theme || 'dark',
        language: response.data.language || 'en',
        notifications_enabled: response.data.notifications_enabled !== undefined ? response.data.notifications_enabled : true,
        email_alerts: response.data.email_alerts !== undefined ? response.data.email_alerts : true,
        timezone: response.data.timezone || 'UTC'
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
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
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SettingsIcon size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>
              Settings
            </h1>
            <p style={{ color: '#71717a' }}>Manage your application preferences</p>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {settings.theme === 'dark' ? <Moon size={20} color="#a5b4fc" /> : <Sun size={20} color="#fbbf24" />}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f4f4f5' }}>Theme</h3>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Choose between dark and light mode</p>
            </div>
          </div>
          <button
            className={`btn ${settings.theme === 'dark' ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            style={{ minWidth: '120px' }}
          >
            {settings.theme === 'dark' ? (
              <><Sun size={16} /> Light Mode</>
            ) : (
              <><Moon size={16} /> Dark Mode</>
            )}
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Globe size={20} color="#a5b4fc" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f4f4f5' }}>Language</h3>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Select your preferred language</p>
            </div>
          </div>
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={20} color="#a5b4fc" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f4f4f5' }}>Notifications</h3>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Enable or disable push notifications</p>
            </div>
          </div>
          <div
            onClick={() => setSettings({ ...settings, notifications_enabled: !settings.notifications_enabled })}
            style={{
              width: '52px',
              height: '28px',
              borderRadius: '14px',
              background: settings.notifications_enabled ? '#4f46e5' : '#3f3f46',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s'
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: '3px',
                left: settings.notifications_enabled ? '27px' : '3px',
                transition: 'left 0.2s'
              }}
            />
          </div>
        </div>
      </div>

      {/* Email Alerts */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={20} color="#a5b4fc" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f4f4f5' }}>Email Alerts</h3>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Receive important alerts via email</p>
            </div>
          </div>
          <div
            onClick={() => setSettings({ ...settings, email_alerts: !settings.email_alerts })}
            style={{
              width: '52px',
              height: '28px',
              borderRadius: '14px',
              background: settings.email_alerts ? '#4f46e5' : '#3f3f46',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s'
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: '3px',
                left: settings.email_alerts ? '27px' : '3px',
                transition: 'left 0.2s'
              }}
            />
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={20} color="#a5b4fc" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f4f4f5' }}>Timezone</h3>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Set your local timezone</p>
            </div>
          </div>
          <select
            className="form-select"
            style={{ width: '250px' }}
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Settings
            </>
          )}
        </button>
        {saved && (
          <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
            Settings saved successfully!
          </span>
        )}
      </div>
    </div>
  );
};

export default Settings;
