import React from 'react';
import '../styles/LandingPage.css';

export default function LandingPageMobile({ onGetStarted }) {
  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <div className="header-content">
            <div className="header-logo-section">
              <span style={{ fontSize: '1.5rem' }}>💬</span>
              <h1 className="header-brand-name">Chatter</h1>
            </div>
            <nav className="nav-menu">
              <button className="nav-link-cta" onClick={onGetStarted}>
                Get Started
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <span className="hero-badge">✓ Free Forever</span>
            <h2 className="hero-title">
              Connect with Friends <span className="hero-title-highlight">Anywhere, Anytime</span>
            </h2>
            <p className="hero-description">
              Experience seamless messaging and HD video calls. Chat with friends, join global conversations, and stay connected.
            </p>
            <button className="hero-cta" onClick={onGetStarted}>
              Start Chatting Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0095f6" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3 className="feature-title">Instant Messaging</h3>
              <p className="feature-description">
                Real-time chat with friends and groups. Share messages instantly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0095f6" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <h3 className="feature-title">HD Video Calls</h3>
              <p className="feature-description">
                Crystal clear video calls with friends. Connect face-to-face.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0095f6" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className="feature-title">Global Community</h3>
              <p className="feature-description">
                Join conversations with people from around the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Ready to Start Chatting?</h2>
          <p className="cta-description">
            Join thousands of users already connected on Chatter
          </p>
          <button className="hero-cta" onClick={onGetStarted}>
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <p>© 2026 Chatter. Built with ❤️ for seamless communication.</p>
        </div>
      </footer>
    </div>
  );
}
