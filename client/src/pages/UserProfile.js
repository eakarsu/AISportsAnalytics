import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User, Save, Edit2, MapPin, Phone, Trophy, Star, ArrowLeft
} from 'lucide-react';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    phone: '',
    location: '',
    favorite_sport: '',
    experience_level: 'beginner'
  });

  const sports = ['Football', 'Basketball', 'Tennis', 'American Football', 'Baseball', 'Hockey', 'Boxing', 'MMA', 'Cricket', 'Golf'];
  const experienceLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/profile');
      setProfile(response.data);
      setFormData({
        display_name: response.data.display_name || '',
        bio: response.data.bio || '',
        avatar_url: response.data.avatar_url || '',
        phone: response.data.phone || '',
        location: response.data.location || '',
        favorite_sport: response.data.favorite_sport || '',
        experience_level: response.data.experience_level || 'beginner'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('/api/profile', formData);
      setProfile(response.data);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const getExperienceBadge = (level) => {
    const map = {
      beginner: 'badge-info',
      intermediate: 'badge-warning',
      advanced: 'badge-success',
      expert: 'badge-primary'
    };
    return map[level] || 'badge-info';
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
            <User size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>
              User Profile
            </h1>
            <p style={{ color: '#71717a' }}>Manage your personal information</p>
          </div>
        </div>
        {!editMode && (
          <button className="btn btn-primary" onClick={() => setEditMode(true)}>
            <Edit2 size={18} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Avatar Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden'
            }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={48} color="white" />
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f4f4f5', marginBottom: '4px' }}>
              {profile?.display_name || 'User'}
            </h2>
            <p style={{ color: '#a1a1aa', marginBottom: '8px' }}>{profile?.bio || 'No bio set'}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {profile?.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#71717a', fontSize: '14px' }}>
                  <MapPin size={14} /> {profile.location}
                </span>
              )}
              {profile?.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#71717a', fontSize: '14px' }}>
                  <Phone size={14} /> {profile.phone}
                </span>
              )}
              {profile?.favorite_sport && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#71717a', fontSize: '14px' }}>
                  <Trophy size={14} /> {profile.favorite_sport}
                </span>
              )}
              {profile?.experience_level && (
                <span className={`badge ${getExperienceBadge(profile.experience_level)}`}>
                  {profile.experience_level}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form / Info Display */}
      {editMode ? (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f4f4f5', marginBottom: '24px' }}>Edit Profile</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Your display name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Avatar URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Favorite Sport</label>
                <select
                  className="form-select"
                  value={formData.favorite_sport}
                  onChange={(e) => setFormData({ ...formData, favorite_sport: e.target.value })}
                >
                  <option value="">Select a sport</option>
                  {sports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select
                  className="form-select"
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                >
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                className="form-textarea"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={18} />
                Save Profile
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f4f4f5', marginBottom: '24px' }}>Profile Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Display Name</p>
              <p style={{ color: '#f4f4f5', fontSize: '16px' }}>{profile?.display_name || 'Not set'}</p>
            </div>
            <div>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Phone</p>
              <p style={{ color: '#f4f4f5', fontSize: '16px' }}>{profile?.phone || 'Not set'}</p>
            </div>
            <div>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Location</p>
              <p style={{ color: '#f4f4f5', fontSize: '16px' }}>{profile?.location || 'Not set'}</p>
            </div>
            <div>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Favorite Sport</p>
              <p style={{ color: '#f4f4f5', fontSize: '16px' }}>{profile?.favorite_sport || 'Not set'}</p>
            </div>
            <div>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Experience Level</p>
              <p style={{ color: '#f4f4f5', fontSize: '16px' }}>{profile?.experience_level ? profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1) : 'Not set'}</p>
            </div>
            <div>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Avatar URL</p>
              <p style={{ color: '#f4f4f5', fontSize: '16px', wordBreak: 'break-all' }}>{profile?.avatar_url || 'Not set'}</p>
            </div>
          </div>
          {profile?.bio && (
            <div style={{ marginTop: '24px' }}>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Bio</p>
              <p style={{ color: '#e4e4e7', lineHeight: '1.7' }}>{profile.bio}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
