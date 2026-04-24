import React, { useState } from 'react';
import axios from 'axios';
import { Zap, Mail, Lock, LogIn, UserPlus, Sparkles } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const response = await axios.post(endpoint, formData);
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = async () => {
    try {
      const response = await axios.get('/api/auth/demo-credentials');
      setFormData({
        ...formData,
        email: response.data.email,
        password: response.data.password
      });
      setError('');
    } catch (err) {
      // Use default demo credentials if API fails
      setFormData({
        ...formData,
        email: 'demo@sportsanalytics.com',
        password: 'demo123456'
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
        }}
      >
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 20px 40px rgba(79, 70, 229, 0.4)',
            }}
          >
            <Zap size={40} color="white" />
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #f4f4f5, #a5b4fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}
          >
            AI Sports Analytics
          </h1>
          <p style={{ color: '#71717a', fontSize: '16px' }}>
            Powered by Advanced AI Technology
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 35, 0.98))',
            border: '1px solid rgba(79, 70, 229, 0.3)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#f4f4f5',
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p
            style={{
              color: '#71717a',
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            {isRegister
              ? 'Sign up to get started'
              : 'Sign in to access your dashboard'}
          </p>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '24px',
                color: '#f87171',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your name"
                    style={{ paddingLeft: '48px' }}
                  />
                  <UserPlus
                    size={20}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#71717a',
                    }}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email"
                  style={{ paddingLeft: '48px' }}
                  required
                />
                <Mail
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#71717a',
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  style={{ paddingLeft: '48px' }}
                  required
                />
                <Lock
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#71717a',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginBottom: '16px',
                padding: '14px 24px',
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              ) : (
                <>
                  <LogIn size={20} />
                  {isRegister ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>

            {!isRegister && (
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  marginBottom: '24px',
                }}
              >
                <Sparkles size={18} />
                Fill Demo Credentials
              </button>
            )}
          </form>

          {!isRegister && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <a href="/forgot-password" style={{ color: '#a5b4fc', fontSize: '14px', textDecoration: 'none' }}>
                Forgot Password?
              </a>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#71717a', fontSize: '14px' }}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div
          style={{
            marginTop: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}
        >
          {['Betting Analysis', 'Fantasy Teams', 'AI Strategy'].map((feature) => (
            <div
              key={feature}
              style={{
                background: 'rgba(79, 70, 229, 0.1)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <span style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: '500' }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
