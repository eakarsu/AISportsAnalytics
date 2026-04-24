import React from 'react';
import { Lock } from 'lucide-react';

const PrivacyPolicy = () => {
  const sections = [
    { title: '1. Information We Collect', content: 'We collect information you provide directly, including your name, email address, and usage data when you interact with our AI Sports Analytics platform. This includes betting analyses, fantasy team configurations, strategy preferences, and esports tracking data you create within the platform.' },
    { title: '2. How We Use Your Information', content: 'Your information is used to provide and improve our AI-powered sports analytics services, personalize your experience, send relevant notifications about matches and predictions, and maintain the security of your account. We use aggregated analytics data to improve our AI prediction models.' },
    { title: '3. Data Protection', content: 'We implement industry-standard security measures including encryption of data in transit (TLS/SSL), secure password hashing (bcrypt), JWT-based authentication, rate limiting to prevent abuse, and regular security audits. Your data is stored in secure PostgreSQL databases with automated backups.' },
    { title: '4. Cookies and Tracking', content: 'We use essential cookies for authentication (JWT tokens stored in localStorage) and session management. We do not use third-party advertising cookies. Analytics data is collected internally to improve platform performance and user experience.' },
    { title: '5. Third-Party Services', content: 'We integrate with AI services (OpenRouter/Claude) for generating sports analysis. When you request AI analysis, relevant match data is sent to our AI provider. We do not sell or share your personal information with third parties for marketing purposes.' },
    { title: '6. Data Retention', content: 'Your data is retained as long as your account is active. You can request deletion of your account and all associated data at any time through the Contact Support page. Upon deletion, all personal data is permanently removed within 30 days.' },
    { title: '7. Your Rights', content: 'You have the right to access, correct, or delete your personal data. You can export your data in CSV or JSON format through the Data Export feature. You can update your profile and settings at any time. For GDPR requests, please contact our support team.' },
    { title: '8. Contact Us', content: 'If you have questions about this privacy policy or your data, please reach out through our Contact Support page or email privacy@sportsanalytics.com.' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>Privacy Policy</h1>
          <p style={{ color: '#71717a' }}>Last updated: February 2026</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '900px' }}>
        <p style={{ color: '#a1a1aa', lineHeight: '1.8', marginBottom: '32px' }}>
          At AI Sports Analytics, we are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our platform.
        </p>
        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#a5b4fc', marginBottom: '12px' }}>{section.title}</h3>
            <p style={{ color: '#e4e4e7', lineHeight: '1.8' }}>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
