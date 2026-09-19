import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api' : 'https://website-sritech-refk.onrender.com/api');

const AuthPage = () => {
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [userCredentials, setUserCredentials] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '', address: ''
  });
  const [otpCode, setOtpCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');

  const navigate = useNavigate();

  const handleVerifyOtp = async () => {
    if (!verificationEmail || !otpCode) {
      setMessage('Please enter your email and OTP.');
      setMessageType('error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, otp: otpCode })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'OTP verification failed.');
      }

      if (data.token) {
        localStorage.setItem('sriTechToken', data.token);
        window.dispatchEvent(new Event('auth-change'));
      }

      setMessage('Account creation successful! Redirecting...');
      setMessageType('success');
      setTimeout(() => {
        window.location.href = '/?verified=true';
      }, 800);
    } catch (err) {
      console.error(err);
      if (/already verified/i.test(err.message)) {
        setMessage('Your account is already verified! Please sign in.');
        setMessageType('success');
        setAuthMode('login');
      } else {
        setMessage(err.message || 'OTP verification failed.');
        setMessageType('error');
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const enteredEmail = (userCredentials.email || '').trim().toLowerCase();

    if (!enteredEmail) {
      setMessage('Please enter your email address first.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: enteredEmail })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to send reset link.');
      }

      setMessage(data?.message || 'Password reset link sent to your email.');
      setMessageType('success');
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Unable to send reset link.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (authMode === 'verify') {
      await handleVerifyOtp();
      return;
    }

    if (authMode === 'signup' && userCredentials.password !== userCredentials.confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    if (authMode === 'signup' && !/^\d{10}$/.test(userCredentials.phone || '')) {
      setMessage('Phone number must be exactly 10 digits.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userCredentials.email.trim().toLowerCase(),
            password: userCredentials.password
          })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Login failed.');
        }
        
        if (data.token) {
          localStorage.setItem('sriTechToken', data.token);
          window.dispatchEvent(new Event('auth-change'));
        }

        setMessage('Login successful. Redirecting...');
        setMessageType('success');
        setTimeout(() => {
          window.location.href = '/?loggedin=true';
        }, 800);
      } else {
        const res = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userCredentials.name,
            email: userCredentials.email.trim().toLowerCase(),
            password: userCredentials.password,
            phone: userCredentials.phone,
            address: userCredentials.address
          })
        });

        const data = await res.json();
        if (!res.ok) {
          const message = data.error || data.message || 'Signup failed.';
          if (/account already created|already registered|please sign in/i.test(message)) {
            setAuthMode('login');
            setUserCredentials(prev => ({
              ...prev,
              email: userCredentials.email.trim().toLowerCase(),
              password: '',
              confirmPassword: ''
            }));
          }
          throw new Error(message);
        }

        setVerificationEmail(data.email || userCredentials.email.trim().toLowerCase());
        setOtpCode('');
        setMessage(data.message || 'OTP sent to your email. Please verify your account.');
        setMessageType('success');
        setAuthMode('verify');
        setUserCredentials(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Submission failed.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-left-pane">
        <div className="auth-left-content">
          <div className="auth-brand-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ff7a00', fontWeight: 'bold' }}>
            <i className="fa-solid fa-fire-flame-curved"></i> {t('auth.brandBadge', 'SriTech Eco Living')}
          </div>
          <h2>{t('auth.leftTitle1', 'Cook Smarter.')}<span>{t('auth.leftTitle2', 'Save More.')}</span></h2>
          <p className="auth-subhead">
            {t('auth.leftSubtitle', 'Join thousands of households & businesses utilizing our high-efficiency combustion systems for sustainable cooking and substantial fuel savings.')}
          </p>
          <ul className="auth-trust-list">
            <li>✓ {t('auth.trustSecureTitle', 'Secure Login & Checkout')}</li>
            <li>✓ {t('auth.trustTrackingTitle', 'Fast Delivery Tracking')}</li>
            <li>✓ {t('auth.trustSupportTitle', '24/7 Dedicated Support')}</li>
            <li>✓ {t('auth.trustEcoTitle', '100% Eco-Friendly Materials')}</li>
          </ul>
        </div>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="ember"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              width: `${3 + Math.random() * 4}px`,
              height: `${3 + Math.random() * 4}px`
            }}
          />
        ))}
      </div>
      <div className="auth-right-pane">
        <div className="auth-glass-card">
          <button className="auth-close-btn" onClick={() => navigate('/')}>✕</button>
          <div className="auth-header">
            <h3>{authMode === 'login' ? t('auth.welcomeBack', 'Welcome Back') : authMode === 'verify' ? t('auth.verifyEmail', 'Verify Your Email') : t('auth.createAccount', 'Create Account')}</h3>
            <p>
              {authMode === 'login' 
                ? t('auth.signInSubtitle', 'Sign in to access your orders, cart & account') 
                : authMode === 'verify' 
                ? (t('auth.verifySubtitle', 'Enter the 6-digit code sent to your email') + (verificationEmail ? ` (${verificationEmail})` : '')) 
                : t('auth.createSubtitle', 'Create your account to start ordering with exclusive savings')}
            </p>
          </div>
          <div className="auth-toggle-group">
            <button
              className={`auth-toggle-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginRight: '0.4rem' }}></i>
              {t('auth.signInTab', 'Sign In')}
            </button>
            <button
              className={`auth-toggle-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => setAuthMode('signup')}
            >
              <i className="fa-solid fa-user-plus" style={{ marginRight: '0.4rem' }}></i>
              {t('auth.signUpTab', 'Sign Up')}
            </button>
          </div>
          <form className="auth-fields-grid" onSubmit={handleSubmit}>
            {authMode === 'verify' ? (
              <div className="auth-form-group">
                <label htmlFor="otpCode">{t('auth.otpVerification', '6-Digit Verification Code')}</label>
                <div className="auth-input-wrapper">
                  <i className="fa-solid fa-key prefix-icon" />
                  <input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    inputMode="numeric"
                    className="auth-input"
                    placeholder={t('auth.otpPlaceholder', '000000')}
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
              </div>
            ) : authMode === 'signup' && (
              <>
                <div className="auth-form-group">
                  <label htmlFor="name">{t('auth.fullName', 'Full Name')}</label>
                  <div className="auth-input-wrapper">
                    <i className="fa-regular fa-user prefix-icon" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      className="auth-input"
                      placeholder={t('auth.fullNamePlaceholder', 'John Doe')}
                      required
                      value={userCredentials.name}
                      onChange={e => setUserCredentials({ ...userCredentials, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="auth-form-group">
                  <label htmlFor="phone">{t('auth.mobileNumber', 'Mobile Number')}</label>
                  <div className="auth-input-wrapper">
                    <i className="fa-solid fa-phone prefix-icon" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="auth-input"
                      placeholder={t('auth.mobilePlaceholder', '10-digit mobile number')}
                      required
                      value={userCredentials.phone}
                      onChange={e => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setUserCredentials({ ...userCredentials, phone: digitsOnly });
                      }}
                    />
                  </div>
                </div>
                <div className="auth-form-group">
                  <label htmlFor="address">{t('auth.deliveryAddress', 'Delivery Address')}</label>
                  <div className="auth-input-wrapper">
                    <i className="fa-solid fa-map-location-dot prefix-icon" />
                    <input
                      id="address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      className="auth-input"
                      placeholder={t('auth.addressPlaceholder', 'Street, Area, City')}
                      required
                      value={userCredentials.address}
                      onChange={e => setUserCredentials({ ...userCredentials, address: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {authMode !== 'verify' && (
              <>
                <div className="auth-form-group">
                  <label htmlFor="email">{t('auth.emailAddress', 'Email Address')}</label>
                  <div className="auth-input-wrapper">
                    <i className="fa-regular fa-envelope prefix-icon" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="auth-input"
                      placeholder={t('auth.emailPlaceholder', 'name@example.com')}
                      required
                      value={userCredentials.email}
                      onChange={e => setUserCredentials({ ...userCredentials, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="auth-form-group">
                  <label htmlFor="password">{t('auth.password', 'Password')}</label>
                  <div className="auth-input-wrapper">
                    <i className="fa-solid fa-lock prefix-icon" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      className="auth-input"
                      placeholder="••••••••"
                      required={authMode !== 'verify'}
                      value={userCredentials.password}
                      onChange={e => setUserCredentials({ ...userCredentials, password: e.target.value })}
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                      <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>
              </>
            )}
            {authMode === 'signup' && (
              <div className="auth-form-group">
                <label htmlFor="confirmPassword">{t('auth.confirmPassword', 'Confirm Password')}</label>
                <div className="auth-input-wrapper">
                  <i className="fa-solid fa-shield-check prefix-icon" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="auth-input"
                    placeholder="••••••••"
                    required
                    value={userCredentials.confirmPassword}
                    onChange={e => setUserCredentials({ ...userCredentials, confirmPassword: e.target.value })}
                  />
                  <button type="button" className="pwd-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>
            )}
            {authMode === 'login' && (
              <div className="auth-options">
                <input type="checkbox" id="rememberMe" name="rememberMe" defaultChecked />
                <label className="remember-me" htmlFor="rememberMe">{t('auth.rememberMe', 'Remember me')}</label>
                <a href="#" className="forgot-pwd" onClick={handleForgotPassword}>{t('auth.forgotPassword', 'Forgot Password?')}</a>
              </div>
            )}
            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              {authMode === 'login'
                ? (isSubmitting ? t('auth.signingIn', 'Signing In...') : t('auth.signInBtn', 'Sign In'))
                : authMode === 'verify'
                  ? (isSubmitting ? t('auth.verifying', 'Verifying...') : t('auth.verifyBtn', 'Verify & Continue'))
                  : (isSubmitting ? t('auth.creatingAccount', 'Creating Account...') : t('auth.createAccountBtn', 'Create Account'))}
            </button>
          </form>
          {message && (
            <div className={`auth-message ${messageType === 'error' ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
