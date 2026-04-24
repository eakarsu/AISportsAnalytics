import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, Zap, Send } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.4)' }}>
            <Zap size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#f4f4f5', marginBottom: '8px' }}>Forgot Password</h1>
          <p style={{ color: '#71717a' }}>Enter your email to receive a reset link</p>
        </div>

        <div style={{ background: 'linear-gradient(145deg, rgba(30,30,50,0.95), rgba(20,20,35,0.98))', border: '1px solid rgba(79,70,229,0.3)', borderRadius: '24px', padding: '40px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Mail size={28} color="#10b981" />
              </div>
              <h3 style={{ color: '#f4f4f5', marginBottom: '12px' }}>Check Your Email</h3>
              <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>If an account exists with that email, we've sent password reset instructions.</p>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
                <ArrowLeft size={18} /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', color: '#f87171', fontSize: '14px' }}>{error}</div>
              )}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="Enter your email" style={{ paddingLeft: '48px' }} required />
                  <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: '16px', padding: '14px 24px' }}>
                {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : <><Send size={18} /> Send Reset Link</>}
              </button>
              <div style={{ textAlign: 'center' }}>
                <Link to="/login" style={{ color: '#a5b4fc', fontSize: '14px', textDecoration: 'none' }}>
                  <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
