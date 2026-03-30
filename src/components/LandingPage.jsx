import React, { useState, useEffect } from 'react';
import '../styles/LandingPage.css';

export default function LandingPage({ onGetStarted }) {
  const [theme, setTheme] = useState('dark');
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      number: '01',
      title: 'Real-time messaging with zero latency',
      description: 'Messages delivered instantly across the globe. No delays, no buffering, no compromises. Built on modern infrastructure that scales with your conversations.'
    },
    {
      number: '02',
      title: 'End-to-end security by default',
      description: 'Your conversations are private. Enterprise-grade encryption protects every message. No data mining, no tracking, no third-party access.'
    },
    {
      number: '03',
      title: 'Works everywhere you do',
      description: 'Seamless experience across desktop, tablet, and mobile. Pick up conversations exactly where you left off, on any device.'
    },
    {
      number: '04',
      title: 'Guest mode for instant access',
      description: 'No registration required to start chatting. Jump in as a guest, or create an account for the full experience. Your choice.'
    }
  ];

  return (
    <div className="landing">
      {/* Theme Toggle */}
      <button 
        className="theme-toggle" 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
      >
        <span className="toggle-track">
          <span className="toggle-thumb"></span>
        </span>
      </button>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <span className="hero-tag animate-in">// MESSAGING PLATFORM</span>
            <h1 className="hero-title animate-in">
              Connect with <em>Anyone, Anywhere</em>
            </h1>
            <p className="hero-subtitle animate-in">
              Simple, fast, and secure messaging for everyone. No friction, no complexity. 
              Just pure conversation.
            </p>
            <button className="btn-primary animate-in" onClick={onGetStarted}>
              <span>Start Chatting</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats" id="stats" data-reveal>
        <div className="container">
          <div className="stat-block">
            <div className="stat-item">
              <div className="stat-value">1ms</div>
              <div className="stat-label">Latency</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">E2E</div>
              <div className="stat-label">Encrypted</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">∞</div>
              <div className="stat-label">Messages</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features" data-reveal>
        <div className="container">
          <div className="section-marker">
            <span>Features</span>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-number">{feature.number}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta" data-reveal>
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to start?</h2>
            <p className="cta-subtitle">
              Join thousands already connecting on Chatter. Free forever, no credit card required.
            </p>
            <button className="btn-primary" onClick={onGetStarted}>
              <span>Get Started Now</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} <a href="https://sakshampokharel.me" target="_blank" rel="noopener noreferrer">Saksham Pokharel</a>. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
