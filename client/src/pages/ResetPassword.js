import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Lock, Zap, Check } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/reset-password', { token: searchParams.get('token'), password });
      setSuccess(true);
    } catch (err) { setError(err.response?.data?.error || 'An error occurred'); } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Zap size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#f4f4f5' }}>Reset Password</h1>
        </div>
        <div style={{ background: 'linear-gradient(145deg, rgba(30,30,50,0.95), rgba(20,20,35,0.98))', border: '1px solid rgba(79,70,229,0.3)', borderRadius: '24px', padding: '40px' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(16,185,129,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Check size={28} color="#10b981" />
              </div>
              <h3 style={{ color: '#f4f4f5', marginBottom: '12px' }}>Password Reset!</h3>
              <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>Your password has been updated. You can now log in.</p>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>Go to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', color: '#f87171', fontSize: '14px' }}>{error}</div>}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} className="form-input" placeholder="Enter new password" style={{ paddingLeft: '48px' }} required />
                  <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }} className="form-input" placeholder="Confirm new password" style={{ paddingLeft: '48px' }} required />
                  <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px 24px' }}>
                {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
