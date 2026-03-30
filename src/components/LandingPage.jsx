import React from 'react';
import '../styles/LandingPage.css';

export default function LandingPage({ onGetStarted }) {
  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      title: 'Real-Time Chat',
      description: 'Connect instantly with people around the world. Messages delivered in real-time with zero delay.'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      title: 'Private & Secure',
      description: 'Your conversations are protected with enterprise-grade security. Chat with confidence.'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      title: 'Always Available',
      description: 'Access your chats anytime, anywhere. Works seamlessly across all your devices.'
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Connect with Anyone, Anywhere
            </h1>
            <p className="hero-subtitle">
              Simple, fast, and secure messaging for everyone. Start chatting in seconds with no hassle.
            </p>
            <button className="btn-primary" onClick={onGetStarted}>
              Start Free
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Chatter</h2>
            <p className="section-description">
              Everything you need for seamless communication, nothing you don't.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to get started?</h2>
            <p className="cta-description">Join thousands already chatting on Chatter</p>
            <button className="btn-primary" onClick={onGetStarted}>
              Start Chatting
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>Made by <a href="https://sakshampokharel.me" target="_blank" rel="noopener noreferrer">Saksham Pokharel</a></p>
        </div>
      </footer>
    </div>
  );
}


