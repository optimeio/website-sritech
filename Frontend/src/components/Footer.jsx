import React from 'react';

function Footer({ onRaiseComplaint }) {
  return (
    <footer id="footer" className="footer">
      <div className="footer-grid">
        <div className="brand-col">
          <span className="name">The Sri Tech</span>
          <p>11/1, Gurusamipalayam, Rasipuram,<br />Tamil Nadu 637403</p>
          <p>
            <a href="mailto:sritechofficial8@gmail.com">sritechofficial8@gmail.com</a>
          </p>
          <p>
            <a href="tel:+919043340278">+91 9043340278</a>
          </p>
          <div className="socials">
            <a className="social-btn" href="https://www.instagram.com/thesritech?utm_source=qr&igsh=MWx6b2F5cGV5cXk4eA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>
            </a>
            <a className="social-btn" href="https://www.youtube.com/@thesritech" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="4" /><polygon points="10,9 15,12 10,15" fill="currentColor" stroke="none" /></svg>
            </a>
          </div>
        </div>

        <div>
          <div className="col-title">Policies</div>
          <ul className="link-list">
            <li><a href="/privacy-policy.html">Privacy Policy</a></li>
            <li><a href="/terms-and-conditions.html">Terms of Service</a></li>
          </ul>
        </div>

        <div>
          <div className="col-title">Quick Links</div>
          <ul className="link-list">
            <li><a href="#home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a></li>
            <li><a href="#product" onClick={(e) => { e.preventDefault(); const el = document.getElementById('product'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>Products</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onRaiseComplaint(); }}>Raise a Complaint</a></li>
          </ul>
        </div>
      </div>

      <div className="bottom-bar">
        <p>© 2026 The Sri Tech. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
