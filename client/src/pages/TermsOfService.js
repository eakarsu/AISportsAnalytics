import React from 'react';
import { FileText } from 'lucide-react';

const TermsOfService = () => {
  const sections = [
    { title: '1. Acceptance of Terms', content: 'By accessing and using the AI Sports Analytics platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to update these terms at any time, and continued use constitutes acceptance of changes.' },
    { title: '2. Description of Services', content: 'AI Sports Analytics provides AI-powered sports analysis tools including betting analysis, fantasy team optimization, game strategy advice, esports tracking, and referee decision analysis. Our predictions and analyses are for informational purposes only and should not be considered financial or gambling advice.' },
    { title: '3. User Accounts', content: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when registering. Each person may only maintain one account. You must be at least 18 years old to use this platform, particularly features related to betting analysis.' },
    { title: '4. Acceptable Use', content: 'You agree not to: (a) use the platform for any illegal purposes, (b) attempt to gain unauthorized access to other accounts or systems, (c) interfere with the platform operation, (d) scrape or bulk-download data, (e) use AI predictions to mislead others, (f) upload malicious files or content.' },
    { title: '5. Intellectual Property', content: 'All content, features, and functionality of the AI Sports Analytics platform are owned by us and protected by intellectual property laws. AI-generated analyses are provided for your personal use. You may not reproduce, distribute, or create derivative works from our content without permission.' },
    { title: '6. Limitation of Liability', content: 'AI Sports Analytics provides predictions and analyses based on statistical models and AI. We do not guarantee the accuracy of any prediction or analysis. We are not liable for any financial losses resulting from decisions made based on our platform content. Use our tools at your own risk.' },
    { title: '7. Data and Privacy', content: 'Your use of our platform is also governed by our Privacy Policy. By using our services, you consent to the collection and use of your data as described in the Privacy Policy. You can export or delete your data at any time.' },
    { title: '8. Termination', content: 'We reserve the right to suspend or terminate your account for violation of these terms. You may also close your account at any time through the Contact Support page. Upon termination, your right to use the platform ceases immediately.' },
    { title: '9. Contact', content: 'For questions about these terms, please contact us through the Contact Support page or email legal@sportsanalytics.com.' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #d97706, #f59e0b)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f4f4f5' }}>Terms of Service</h1>
          <p style={{ color: '#71717a' }}>Last updated: February 2026</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '900px' }}>
        <p style={{ color: '#a1a1aa', lineHeight: '1.8', marginBottom: '32px' }}>
          Please read these Terms of Service carefully before using the AI Sports Analytics platform.
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

export default TermsOfService;
