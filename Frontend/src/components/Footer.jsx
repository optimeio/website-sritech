import React from 'react';

function Footer({ complaintForm, setComplaintForm, handleComplaintSubmit }) {
  return (
    <footer id="footer" className="footer">
      <div className="footer-grid">
        <div className="brand-col">
          <div className="footer-logo-wrap">
            <img src="/sri-tech-logo-final.png" alt="The Sri Tech" className="footer-logo-img" />
          </div>
          <p className="footer-address">11/1, Gurusamipalayam, Rasipuram,<br />Tamil Nadu 637403</p>
          <p className="footer-contact-item">
            <i className="fa-solid fa-envelope"></i> <a href="mailto:sritechofficial8@gmail.com">sritechofficial8@gmail.com</a>
          </p>
          <p className="footer-contact-item">
            <i className="fa-solid fa-phone"></i> <a href="tel:+919043340278">+91 9043340278</a>
          </p>
          <div className="socials">
            <a className="social-btn instagram-btn" href="https://www.instagram.com/thesritech?igsh=Znk2OThveTEwOHhu" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a className="social-btn youtube-btn" href="https://youtube.com/@thesmgroups?si=EouOy32MGfB_W_Px" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <i className="fa-brands fa-youtube"></i>
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
            <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); const el = document.getElementById('how-it-works'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>About</a></li>
            <li><a href="#product" onClick={(e) => { e.preventDefault(); const el = document.getElementById('product'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>Products</a></li>
            <li><a href="#footer" onClick={(e) => { e.preventDefault(); const el = document.getElementById('footer'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>Contact</a></li>
          </ul>
        </div>

        <div className="footer-form-col">
          <div className="col-title">Raise a Complaint</div>
          <form className="footer-complaint-form" onSubmit={handleComplaintSubmit}>
            <input 
              type="text" 
              placeholder="Your Name" 
              required 
              value={complaintForm?.customerName || ''}
              onChange={(e) => setComplaintForm({...complaintForm, customerName: e.target.value})}
            />
            <input 
              type="email" 
              placeholder="Your Email" 
              required 
              value={complaintForm?.email || ''}
              onChange={(e) => setComplaintForm({...complaintForm, email: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Subject" 
              required 
              value={complaintForm?.subject || ''}
              onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
            />
            <textarea 
              placeholder="Type your complaint or feedback details..." 
              required 
              rows="3"
              value={complaintForm?.message || ''}
              onChange={(e) => setComplaintForm({...complaintForm, message: e.target.value})}
            ></textarea>
            <button type="submit" className="footer-form-submit-btn">Submit Complaint</button>
          </form>
        </div>
      </div>

      <div className="bottom-bar">
        <p>© 2026 The Sri Tech. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
