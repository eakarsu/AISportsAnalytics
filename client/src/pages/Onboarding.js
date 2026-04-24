import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, ChevronLeft, Check, TrendingUp, Users, Gamepad2, Trophy, Scale } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedSports, setSelectedSports] = useState([]);
  const [notifPrefs, setNotifPrefs] = useState({ matchAlerts: true, oddsChanges: true, aiInsights: true, weeklyReport: false });

  const sports = ['Football', 'Basketball', 'Tennis', 'American Football', 'Baseball', 'Hockey', 'Esports', 'Cricket', 'Boxing', 'MMA'];

  const toggleSport = (sport) => {
    setSelectedSports(prev => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]);
  };

  const steps = [
    {
      title: 'Welcome to AI Sports Analytics',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Zap size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#f4f4f5', marginBottom: '16px' }}>Your AI-Powered Sports Companion</h2>
          <p style={{ color: '#a1a1aa', fontSize: '16px', lineHeight: '1.8', maxWidth: '500px', margin: '0 auto 32px' }}>
            Get started with powerful AI tools for betting analysis, fantasy team optimization, game strategy, esports tracking, and referee decision analysis.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
            {[
              { icon: TrendingUp, label: 'Betting', color: '#10b981' },
              { icon: Users, label: 'Fantasy', color: '#3b82f6' },
              { icon: Gamepad2, label: 'Strategy', color: '#8b5cf6' },
              { icon: Trophy, label: 'Esports', color: '#f59e0b' },
              { icon: Scale, label: 'Referee', color: '#ef4444' }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', background: `${f.color}20`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Icon size={24} color={f.color} />
                  </div>
                  <p style={{ color: '#a1a1aa', fontSize: '12px' }}>{f.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )
    },
    {
      title: 'Select Your Favorite Sports',
      content: (
        <div>
          <p style={{ color: '#a1a1aa', textAlign: 'center', marginBottom: '24px' }}>Choose the sports you want to follow for personalized insights</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '500px', margin: '0 auto' }}>
            {sports.map(sport => (
              <button key={sport} onClick={() => toggleSport(sport)} style={{
                padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
                background: selectedSports.includes(sport) ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${selectedSports.includes(sport) ? '#4f46e5' : 'rgba(255,255,255,0.1)'}`,
                color: selectedSports.includes(sport) ? '#a5b4fc' : '#a1a1aa',
                display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s ease', textAlign: 'left'
              }}>
                {selectedSports.includes(sport) && <Check size={18} color="#4f46e5" />}
                <span style={{ fontWeight: '500' }}>{sport}</span>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Notification Preferences',
      content: (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <p style={{ color: '#a1a1aa', textAlign: 'center', marginBottom: '24px' }}>Choose which notifications you want to receive</p>
          {[
            { key: 'matchAlerts', label: 'Match Alerts', desc: 'Get notified when tracked matches are starting' },
            { key: 'oddsChanges', label: 'Odds Changes', desc: 'Alerts when betting odds shift significantly' },
            { key: 'aiInsights', label: 'AI Insights', desc: 'Receive AI-generated analysis and predictions' },
            { key: 'weeklyReport', label: 'Weekly Reports', desc: 'Summary of your analytics performance' }
          ].map(pref => (
            <div key={pref.key} onClick={() => setNotifPrefs(p => ({ ...p, [pref.key]: !p[pref.key] }))} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '12px', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div>
                <p style={{ color: '#f4f4f5', fontWeight: '600', marginBottom: '4px' }}>{pref.label}</p>
                <p style={{ color: '#71717a', fontSize: '13px' }}>{pref.desc}</p>
              </div>
              <div style={{
                width: '48px', height: '26px', borderRadius: '13px', padding: '3px',
                background: notifPrefs[pref.key] ? '#4f46e5' : 'rgba(255,255,255,0.1)', transition: 'background 0.2s ease'
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                  transform: notifPrefs[pref.key] ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.2s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'You\'re All Set!',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #059669, #10b981)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Check size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5', marginBottom: '12px' }}>Welcome Aboard!</h2>
          <p style={{ color: '#a1a1aa', fontSize: '16px', lineHeight: '1.8', maxWidth: '500px', margin: '0 auto 24px' }}>
            Your preferences have been saved. Start exploring AI-powered sports analytics now!
          </p>
          {selectedSports.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
              {selectedSports.map(s => (
                <span key={s} className="badge badge-primary">{s}</span>
              ))}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>Getting Started</h1>
          <p style={{ color: '#71717a' }}>Step {step + 1} of {steps.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= step ? '#4f46e5' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s ease' }} />
        ))}
      </div>

      <div className="card" style={{ padding: '40px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#a5b4fc', textAlign: 'center', marginBottom: '32px' }}>{steps[step].title}</h2>
        {steps[step].content}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} disabled={step === 0} style={{ opacity: step === 0 ? 0.5 : 1 }}>
          <ChevronLeft size={18} /> Back
        </button>
        {step < steps.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <button className="btn btn-success" onClick={() => navigate('/')}>
            Go to Dashboard <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
