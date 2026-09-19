import React, { useEffect, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import './LanguageSelectorPopup.css';

function LanguageSelectorPopup() {
  const { hasSelectedLanguage, setLanguage, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!hasSelectedLanguage) {
      // Small delay to trigger entry animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [hasSelectedLanguage]);

  if (hasSelectedLanguage) return null;

  const handleSelectLanguage = (lang) => {
    // Play greeting audio based on selected language
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance();
      if (lang === 'ta') {
        msg.text = 'Vanakkam. Welcome to Sri Tech.';
        msg.lang = 'en-IN'; // Indian English accent works best
      } else if (lang === 'hi') {
        msg.text = 'Namastay. Welcome to Sri Tech.';
        msg.lang = 'en-IN';
      } else if (lang === 'te') {
        msg.text = 'Namaskaram. Welcome to Sri Tech.';
        msg.lang = 'en-IN';
      } else if (lang === 'ml') {
        msg.text = 'Namaskaram. Welcome to Sri Tech.';
        msg.lang = 'en-IN';
      } else {
        msg.text = 'Welcome to Sri Tech Engineering.';
        msg.lang = 'en-US';
      }
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }

    setIsVisible(false);
    setTimeout(() => {
      setLanguage(lang);
      // Dispatch event to trigger inquiry popup after 3 seconds
      window.dispatchEvent(new CustomEvent('sritech:language-selected', { detail: { lang } }));
    }, 500);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setLanguage(language || 'ta');
    }, 400);
  };

  return (
    <div className={`lang-popup-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`lang-popup-card ${isVisible ? 'visible' : ''}`} style={{ position: 'relative' }}>
        <button
          className="close-modal"
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            fontSize: '1.4rem',
            lineHeight: 1,
            cursor: 'pointer',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
        >
          &times;
        </button>

        <div className="lang-popup-logo-container">
          <img src="/sri-tech-logo-final.png" alt="Sri Tech Logo" className="lang-popup-logo" />
        </div>
        
        <div className="lang-popup-header">
          <h2>
            <span className="lang-title-item">Welcome <span className="wave-animation">👋</span></span>
            <span className="text-highlight">|</span>
            <span className="lang-title-item">வணக்கம்</span>
            <span className="text-highlight">|</span>
            <span className="lang-title-item">नमस्ते</span>
            <span className="text-highlight">|</span>
            <span className="lang-title-item">నమస్కారం</span>
            <span className="text-highlight">|</span>
            <span className="lang-title-item">നമസ്കാരം</span>
          </h2>
          <p>Please select your preferred language • உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்<br/>अपनी भाषा चुनें • మీ భాషను ఎంచుకోండి • നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക</p>
        </div>
        
        <div className="lang-options-grid">
          <button className="lang-option-btn" onClick={() => handleSelectLanguage('en')}>
            <span className="lang-name">English</span>
            <span className="lang-sub">Welcome</span>
          </button>
          
          <button className="lang-option-btn highlight-lang" onClick={() => handleSelectLanguage('ta')}>
            <span className="lang-name">தமிழ்</span>
            <span className="lang-sub">வணக்கம்</span>
          </button>
          
          <button className="lang-option-btn" onClick={() => handleSelectLanguage('hi')}>
            <span className="lang-name">हिंदी</span>
            <span className="lang-sub">नमस्ते</span>
          </button>

          <button className="lang-option-btn" onClick={() => handleSelectLanguage('te')}>
            <span className="lang-name">తెలుగు</span>
            <span className="lang-sub">నమస్కారం</span>
          </button>

          <button className="lang-option-btn" onClick={() => handleSelectLanguage('ml')}>
            <span className="lang-name">മലയാളം</span>
            <span className="lang-sub">നമസ്കാരം</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LanguageSelectorPopup;
