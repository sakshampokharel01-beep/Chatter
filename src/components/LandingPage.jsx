import React, { useState } from 'react';
import '../styles/LandingPage.css';

export default function LandingPage({ onGetStarted }) {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: '🌍',
      title: 'Global Chat',
      description: 'Connect with people worldwide in real-time conversations',
      color: '#5b8dee'
    },
    {
      icon: '💬',
      title: 'Private Messages',
      description: 'Secure one-on-one conversations with end-to-end privacy',
      color: '#7c3aed'
    },
    {
      icon: '⚡',
      title: 'Instant Access',
      description: 'Jump in as a guest or create an account for full features',
      color: '#f59e0b'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security',
      color: '#10b981'
    }
  ];

  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="brand-logo">
              <svg width="60" height="60" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="#5b8dee"/>
                <path d="M14 16h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H26l-5 4v-4h-7a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z" fill="#fff" fillOpacity=".92"/>
                <circle cx="19" cy="24" r="1.5" fill="#5b8dee"/>
                <circle cx="24" cy="24" r="1.5" fill="#5b8dee"/>
                <circle cx="29" cy="24" r="1.5" fill="#5b8dee"/>
              </svg>
            </div>
            
            <h1 className="hero-title">
              Welcome to <span className="gradient-text">Chatter</span>
            </h1>
            
            <p className="hero-subtitle">
              Where conversations come alive. Connect, chat, and build meaningful relationships in a vibrant community.
            </p>

            <div className="cta-buttons">
              <button className="btn-primary" onClick={onGetStarted}>
                <span>Get Started</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              
              <button className="btn-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </button>
            </div>

            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-value">Real-time</div>
                <div className="stat-label">Messaging</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-value">Secure</div>
                <div className="stat-label">& Private</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-value">Free</div>
                <div className="stat-label">Forever</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-card card-1">
              <div className="card-avatar" style={{background: '#5b8dee'}}></div>
              <div className="card-content">
                <div className="card-line"></div>
                <div className="card-line short"></div>
              </div>
            </div>
            <div className="floating-card card-2">
              <div className="card-avatar" style={{background: '#f59e0b'}}></div>
              <div className="card-content">
                <div className="card-line"></div>
                <div className="card-line short"></div>
              </div>
            </div>
            <div className="floating-card card-3">
              <div className="card-avatar" style={{background: '#10b981'}}></div>
              <div className="card-content">
                <div className="card-line"></div>
                <div className="card-line short"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section" id="features">
          <h2 className="section-title">Everything you need to connect</h2>
          <p className="section-subtitle">Powerful features designed for seamless communication</p>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-card ${activeFeature === index ? 'active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="feature-icon" style={{background: `${feature.color}15`, color: feature.color}}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works">
          <h2 className="section-title">Get started in seconds</h2>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3 className="step-title">Choose Your Path</h3>
              <p className="step-description">Sign in with Google, create an account, or join as a guest</p>
            </div>

            <div className="step-connector"></div>

            <div className="step">
              <div className="step-number">2</div>
              <h3 className="step-title">Start Chatting</h3>
              <p className="step-description">Jump into global conversations or send private messages</p>
            </div>

            <div className="step-connector"></div>

            <div className="step">
              <div className="step-number">3</div>
              <h3 className="step-title">Build Connections</h3>
              <p className="step-description">Meet new people and create lasting relationships</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Ready to start chatting?</h2>
            <p className="cta-subtitle">Join thousands of users already connecting on Chatter</p>
            <button className="btn-primary large" onClick={onGetStarted}>
              <span>Get Started Now</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <p>Crafted with ❤️ by <a href="https://sakshampokharel.me" target="_blank" rel="noopener noreferrer">Saksham Pokharel</a></p>
        </footer>
      </div>
    </div>
  );
}
