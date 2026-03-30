import React, { useState, useEffect } from 'react';
import '../styles/LandingPage.css';

export default function LandingPage({ onGetStarted }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '💬',
      title: 'Real-Time Messaging',
      description: 'Chat instantly with anyone, anywhere in the world',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: '🔐',
      title: 'Private & Secure',
      description: 'Your conversations are protected and encrypted',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'No lag, no delays. Messages delivered instantly',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: '🎨',
      title: 'Beautiful Design',
      description: 'Clean, modern interface that you will love',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ];

  return (
    <div className="landing-page">
      {/* Colorful Background Blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Free Forever • No Credit Card Required
          </div>
          
          <h1 className="hero-title">
            Chat Without Limits
          </h1>
          
          <p className="hero-description">
            Connect with friends, family, and people around the world. 
            Real-time messaging made simple, secure, and fun.
          </p>

          <div className="hero-buttons">
            <button className="btn-start" onClick={onGetStarted}>
              Start Chatting Free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button className="btn-learn" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              See How It Works
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-icon">⚡</div>
              <div className="stat-text">
                <div className="stat-number">Instant</div>
                <div className="stat-label">Delivery</div>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon">🔒</div>
              <div className="stat-text">
                <div className="stat-number">100%</div>
                <div className="stat-label">Secure</div>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon">🌍</div>
              <div className="stat-text">
                <div className="stat-number">Global</div>
                <div className="stat-label">Access</div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Chat Bubbles */}
        <div className="chat-bubbles">
          <div className="bubble bubble-1" style={{transform: `translateY(${scrollY * 0.1}px)`}}>
            <div className="bubble-avatar"></div>
            <div className="bubble-text">Hey there! 👋</div>
          </div>
          <div className="bubble bubble-2" style={{transform: `translateY(${scrollY * 0.15}px)`}}>
            <div className="bubble-avatar"></div>
            <div className="bubble-text">Welcome to Chatter!</div>
          </div>
          <div className="bubble bubble-3" style={{transform: `translateY(${scrollY * 0.08}px)`}}>
            <div className="bubble-avatar"></div>
            <div className="bubble-text">Let's chat! 💬</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Chatter?</h2>
            <p className="section-subtitle">Everything you need for amazing conversations</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon-wrapper" style={{background: feature.gradient}}>
                  <span className="feature-emoji">{feature.icon}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-works">
        <div className="how-works-container">
          <h2 className="section-title">Get Started in 3 Easy Steps</h2>
          
          <div className="steps">
            <div className="step-card">
              <div className="step-number" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>1</div>
              <h3 className="step-title">Sign Up</h3>
              <p className="step-desc">Create your account in seconds with Google or email</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-number" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>2</div>
              <h3 className="step-title">Start Chatting</h3>
              <p className="step-desc">Join global chat or send private messages</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-number" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>3</div>
              <h3 className="step-title">Connect</h3>
              <p className="step-desc">Build relationships and have fun conversations</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Join the Conversation?</h2>
            <p className="cta-subtitle">Start chatting with people around the world today</p>
            <button className="btn-cta" onClick={onGetStarted}>
              Get Started Now - It's Free!
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>Made with ❤️ by <a href="https://sakshampokharel.me" target="_blank" rel="noopener noreferrer">Saksham Pokharel</a></p>
      </footer>
    </div>
  );
}
