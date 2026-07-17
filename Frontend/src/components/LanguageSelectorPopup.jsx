import React, { useEffect, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import './LanguageSelectorPopup.css';

function LanguageSelectorPopup() {
  const { hasSelectedLanguage, setLanguage } = useLanguage();
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
    }, 600); // Wait for exit animation
  };

  return (
    <div className={`lang-popup-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`lang-popup-card ${isVisible ? 'visible' : ''}`}>
        <div className="lang-popup-logo-container">
          <img src="/sri-tech-logo-final.png" alt="Sri Tech Logo" className="lang-popup-logo" />
        </div>
        
        <div className="lang-popup-header">
          <h2>Welcome <span className="wave-animation">👋</span> <span className="text-highlight">|</span> வணக்கம் <span className="text-highlight">|</span> नमस्ते</h2>
          <p>Please select your preferred language<br/>தொடங்க உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்<br/>शुरू करने के लिए अपनी भाषा चुनें</p>
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
        </div>
      </div>
    </div>
  );
}

export default LanguageSelectorPopup;
