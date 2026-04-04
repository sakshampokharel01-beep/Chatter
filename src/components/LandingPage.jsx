import React, { useState, useEffect } from 'react';
import '../styles/LandingPage.css';

export default function LandingPage({ onGetStarted }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
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
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      title: 'Instant Messaging',
      description: 'Send messages that arrive in milliseconds. Real-time conversations with friends and groups.'
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 7l-7 5 7 5V7z"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      ),
      title: 'Video & Audio Calls',
      description: 'Crystal-clear HD video calls and voice chats. Connect face-to-face from anywhere.'
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="11" width="12" height="10" rx="2" ry="2"/>
          <path d="M9 11V8a3 3 0 0 1 6 0v3"/>
        </svg>
      ),
      title: 'Secure & Private',
      description: 'End-to-end encryption keeps your conversations private. Your data stays yours.'
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ),
      title: 'Global Chat Rooms',
      description: 'Join public conversations or create private spaces. Connect with people worldwide.'
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Friend Requests',
      description: 'Build your network with friend requests. Stay connected with the people you care about.'
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      title: 'Lightning Fast',
      description: 'Built for speed. No lag, no delays. Messages and calls work instantly.'
    }
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <div className="header-content">
            <div className="header-logo-section">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="#0095f6"/>
                <path d="M14 16h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H26l-5 4v-4h-7a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z" fill="white" fillOpacity="0.95"/>
                <circle cx="19" cy="24" r="1.5" fill="#0095f6"/>
                <circle cx="24" cy="24" r="1.5" fill="#0095f6"/>
                <circle cx="29" cy="24" r="1.5" fill="#0095f6"/>
              </svg>
              <span className="header-brand-name">Chatter</span>
            </div>

            <button 
              className="menu-toggle" 
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>

            <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
              <button className="nav-link" onClick={() => scrollToSection('hero')}>
                Home
              </button>
              <button className="nav-link" onClick={() => scrollToSection('features')}>
                Features
              </button>
              <button className="nav-link" onClick={() => scrollToSection('preview')}>
                Preview
              </button>
              <button className="nav-link nav-link-cta" onClick={onGetStarted}>
                Get Started
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="hero-decoration"></div>
        <div className="hero-decoration"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-text-card">
              <div className="hero-badge animate-in">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Free Forever</span>
              </div>
              <h1 className="hero-title animate-in">
                Connect with Friends<br />
                <span className="gradient-text">Anywhere, Anytime</span>
              </h1>
              <p className="hero-subtitle animate-in">
                Experience seamless messaging and HD video calls. Chat with friends, 
                join global conversations, and stay connected with the people you love.
              </p>
              <div className="hero-buttons animate-in">
                <button className="btn-primary-modern" onClick={onGetStarted}>
                  <span>Start Chatting Free</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button className="btn-secondary-modern" onClick={() => scrollToSection('preview')}>
                  <span>See How It Works</span>
                </button>
              </div>
              <div className="hero-stats animate-in">
                <div className="stat-mini">
                  <div className="stat-mini-value">1000+</div>
                  <div className="stat-mini-label">Active Users</div>
                </div>
                <div className="stat-mini">
                  <div className="stat-mini-value">50K+</div>
                  <div className="stat-mini-label">Messages Sent</div>
                </div>
                <div className="stat-mini">
                  <div className="stat-mini-value">99.9%</div>
                  <div className="stat-mini-label">Uptime</div>
                </div>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="hero-image-container">
                <div className="hero-chat-card">
                  <div className="chat-message-item">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces&q=80&auto=format" 
                      alt="User" 
                      className="chat-user-photo"
                      loading="lazy"
                      decoding="async"
                      srcSet="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=faces&q=70&auto=format 480w,
                              https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces&q=80&auto=format 768w"
                      sizes="(max-width: 480px) 50px, 80px"
                    />
                    <div className="chat-message-content">
                      <div className="chat-user-name">Alex Johnson</div>
                      <div className="chat-message-text">Hey! Ready for our video call?</div>
                    </div>
                  </div>
                  <div className="chat-message-item">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces&q=80&auto=format" 
                      alt="User" 
                      className="chat-user-photo"
                      loading="lazy"
                      decoding="async"
                      srcSet="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=faces&q=70&auto=format 480w,
                              https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces&q=80&auto=format 768w"
                      sizes="(max-width: 480px) 50px, 80px"
                    />
                    <div className="chat-message-content">
                      <div className="chat-user-name">Sarah Miller</div>
                      <div className="chat-message-text">Yes! Starting now...</div>
                    </div>
                  </div>
                  <div className="chat-message-item">
                    <img 
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces&q=80&auto=format" 
                      alt="User" 
                      className="chat-user-photo"
                      loading="lazy"
                      decoding="async"
                      srcSet="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=faces&q=70&auto=format 480w,
                              https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces&q=80&auto=format 768w"
                      sizes="(max-width: 480px) 50px, 80px"
                    />
                    <div className="chat-message-content">
                      <div className="chat-user-name">Mike Chen</div>
                      <div className="chat-message-text">Count me in! 🎉</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="app-preview" id="preview" data-reveal>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">See It In Action</span>
            <h2 className="section-title">Experience Chatter</h2>
            <p className="section-subtitle">Beautiful, intuitive interface designed for seamless communication</p>
          </div>
          
          <div className="preview-showcase">
            {/* Feature Highlight 1 */}
            <div className="feature-showcase">
              <div className="showcase-content">
                <div className="showcase-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Instant Messaging</span>
                </div>
                <h3 className="showcase-title">Chat with Anyone, Instantly</h3>
                <p className="showcase-description">
                  Send messages that arrive in milliseconds. Real-time conversations with friends, 
                  family, and colleagues. No delays, just pure connection.
                </p>
                <ul className="showcase-features">
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Real-time delivery</span>
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Read receipts</span>
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Message reactions</span>
                  </li>
                </ul>
              </div>
              <div className="showcase-visual">
                <div className="visual-card">
                  <div className="visual-header">
                    <div className="visual-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="visual-title">Messages</span>
                  </div>
                  <div className="visual-content">
                    {/* Chat preview mockup */}
                    <div className="mock-chat-list">
                      <div className="mock-chat-item">
                        <div className="mock-avatar" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>A</div>
                        <div className="mock-chat-info">
                          <div className="mock-name">Alex Johnson</div>
                          <div className="mock-message">Hey! How are you?</div>
                        </div>
                        <div className="mock-time">2m</div>
                      </div>
                      <div className="mock-chat-item">
                        <div className="mock-avatar" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>S</div>
                        <div className="mock-chat-info">
                          <div className="mock-name">Sarah Miller</div>
                          <div className="mock-message">See you tomorrow!</div>
                        </div>
                        <div className="mock-time">1h</div>
                      </div>
                      <div className="mock-chat-item">
                        <div className="mock-avatar" style={{background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'}}>M</div>
                        <div className="mock-chat-info">
                          <div className="mock-name">Mike Chen</div>
                          <div className="mock-message">Thanks for the help!</div>
                        </div>
                        <div className="mock-time">3h</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlight 2 */}
            <div className="feature-showcase reverse">
              <div className="showcase-content">
                <div className="showcase-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <span>Video Calls</span>
                </div>
                <h3 className="showcase-title">Face-to-Face Conversations</h3>
                <p className="showcase-description">
                  Crystal-clear HD video calls with your friends and family. Connect face-to-face 
                  from anywhere in the world with smooth, reliable connections.
                </p>
                <ul className="showcase-features">
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>HD video quality</span>
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Screen sharing</span>
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Group calls</span>
                  </li>
                </ul>
              </div>
              <div className="showcase-visual">
                <div className="visual-card">
                  <div className="visual-header">
                    <div className="visual-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="visual-title">Video Call</span>
                  </div>
                  <div className="visual-content video-call-mock">
                    <div className="video-participant">
                      <div className="participant-avatar" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                        <span>A</span>
                      </div>
                      <div className="participant-name">Alex Johnson</div>
                      <div className="participant-status">● Connected</div>
                    </div>
                    <div className="video-controls-mock">
                      <div className="control-mock">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        </svg>
                      </div>
                      <div className="control-mock danger">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                        </svg>
                      </div>
                      <div className="control-mock">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-modern" id="features" data-reveal>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything You Need to Stay Connected</h2>
          </div>
          <div className="features-grid-modern">
            {features.map((feature, index) => (
              <div key={index} className="feature-card-modern">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title-modern">{feature.title}</h3>
                <p className="feature-description-modern">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-modern" data-reveal>
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title-modern">Ready to Start Chatting?</h2>
            <p className="cta-subtitle-modern">
              Join thousands of users already connecting on Chatter. Free forever, no credit card required.
            </p>
            <button className="btn-primary-modern" onClick={onGetStarted}>
              <span>Get Started Now</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-modern">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="#0095f6"/>
                <path d="M14 16h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H26l-5 4v-4h-7a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z" fill="white" fillOpacity="0.95"/>
                <circle cx="19" cy="24" r="1.5" fill="#0095f6"/>
                <circle cx="24" cy="24" r="1.5" fill="#0095f6"/>
                <circle cx="29" cy="24" r="1.5" fill="#0095f6"/>
              </svg>
              <span>Chatter</span>
            </div>
            <p className="footer-text">
              © {new Date().getFullYear()} Crafted by <a href="https://sakshampokharel.me" target="_blank" rel="noopener noreferrer">Saksham Pokharel</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
