import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Mail, Check, X, Zap } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setError('No verification token provided');
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      await axios.post('/api/auth/verify-email', { token });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || 'Verification failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Zap size={40} color="white" />
        </div>

        <div style={{ background: 'linear-gradient(145deg, rgba(30,30,50,0.95), rgba(20,20,35,0.98))', border: '1px solid rgba(79,70,229,0.3)', borderRadius: '24px', padding: '40px' }}>
          {status === 'verifying' && (
            <>
              <div className="spinner" style={{ margin: '0 auto 20px' }} />
              <h2 style={{ color: '#f4f4f5', marginBottom: '12px' }}>Verifying Email...</h2>
              <p style={{ color: '#a1a1aa' }}>Please wait while we verify your email address.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div style={{ width: '60px', height: '60px', background: 'rgba(16,185,129,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Check size={28} color="#10b981" />
              </div>
              <h2 style={{ color: '#f4f4f5', marginBottom: '12px' }}>Email Verified!</h2>
              <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>Your email has been successfully verified.</p>
              <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Go to Dashboard</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div style={{ width: '60px', height: '60px', background: 'rgba(239,68,68,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <X size={28} color="#ef4444" />
              </div>
              <h2 style={{ color: '#f4f4f5', marginBottom: '12px' }}>Verification Failed</h2>
              <p style={{ color: '#f87171', marginBottom: '24px' }}>{error}</p>
              <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Go to Dashboard</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
