import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const AuthPage = () => {
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

      setMessage('Email verified successfully. Redirecting...');
      setMessageType('success');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'OTP verification failed.');
      setMessageType('error');
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

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Login failed.');
        }

        setMessage('Login successful. Redirecting...');
        setMessageType('success');
        setTimeout(() => navigate('/'), 800);
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
          <h2>Cook Smarter.<span>Save More.</span></h2>
          <p className="auth-subhead">
            Join thousands of customers using fuel-efficient Rocket Stoves for sustainable cooking and a cleaner future.
          </p>
          <ul className="auth-trust-list">
            <li>✓ Secure Login</li>
            <li>✓ Fast Checkout</li>
            <li>✓ Order Tracking</li>
            <li>✓ 24/7 Customer Support</li>
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
            <h3>{authMode === 'login' ? 'Welcome Back' : authMode === 'verify' ? 'Verify Your Email' : 'Create Account'}</h3>
            <p>{authMode === 'login' ? 'Sign in to your premium account' : authMode === 'verify' ? 'Enter the code we sent to your inbox.' : 'Start your sustainable journey today'}</p>
          </div>
          <div className="auth-toggle-group">
            <button
              className={`auth-toggle-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >Sign In</button>
            <button
              className={`auth-toggle-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => setAuthMode('signup')}
            >Sign Up</button>
          </div>
          <form className="auth-fields-grid" onSubmit={handleSubmit}>
            {authMode === 'verify' ? (
              <div className="auth-form-group">
                <label htmlFor="otpCode">Verification Code</label>
                <div className="auth-input-wrapper">
                  <i className="fa-regular fa-key prefix-icon" />
                  <input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    inputMode="numeric"
                    className="auth-input"
                    placeholder="Enter 6-digit OTP"
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                  />
                </div>
              </div>
            ) : authMode === 'signup' && (
              <>
                <div className="auth-form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="auth-input-wrapper">
                    <i className="fa-regular fa-user prefix-icon" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      className="auth-input"
                      placeholder="John Doe"
                      required
                      value={userCredentials.name}
                      onChange={e => setUserCredentials({ ...userCredentials, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="auth-form-group">
                  <label htmlFor="phone">Mobile Number</label>
                  <div className="auth-input-wrapper">
                    <i className="fa-solid fa-phone prefix-icon" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="auth-input"
                      placeholder="9876543210"
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
                  <label htmlFor="address">Address</label>
                  <div className="auth-input-wrapper">
                    <i className="fa-solid fa-map-location-dot prefix-icon" />
                    <input
                      id="address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      className="auth-input"
                      placeholder="123 Street Name"
                      required
                      value={userCredentials.address}
                      onChange={e => setUserCredentials({ ...userCredentials, address: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}


            <div className="auth-form-group">
              <label htmlFor="email">Email Address</label>
              <div className="auth-input-wrapper">
                <i className="fa-regular fa-envelope prefix-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="auth-input"
                  placeholder="hello@example.com"
                  required
                  value={userCredentials.email}
                  onChange={e => setUserCredentials({ ...userCredentials, email: e.target.value })}
                />
              </div>
            </div>
            <div className="auth-form-group">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrapper">
                <i className="fa-solid fa-lock prefix-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  className="auth-input"
                  placeholder="••••••••"
                  required
                  value={userCredentials.password}
                  onChange={e => setUserCredentials({ ...userCredentials, password: e.target.value })}
                />
                <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>
            {authMode === 'signup' && (
                <div className="auth-form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
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
                <input type="checkbox" id="rememberMe" name="rememberMe" />
                <label className="remember-me" htmlFor="rememberMe">Remember me</label>
                <a href="#" className="forgot-pwd" onClick={handleForgotPassword}>Forgot Password?</a>
              </div>
            )}
            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              {authMode === 'login'
                ? (isSubmitting ? 'Signing In…' : 'Sign In')
                : authMode === 'verify'
                  ? (isSubmitting ? 'Verifying…' : 'Verify Email')
                  : (isSubmitting ? 'Creating Account…' : 'Create Account')}
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
