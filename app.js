// ============================================================
//  app.js — RCO IT Help Site
//  Handles: Firebase auth, nav, EmailJS contact form
// ============================================================

import { initializeApp }                          from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut }   from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// ── Config ───────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDEn7ooJJ1zATM5oEnx3ByDiOFTFxr_JiA",
  authDomain:        "rco-metrics-d0f3b.firebaseapp.com",
  projectId:         "rco-metrics-d0f3b",
  storageBucket:     "rco-metrics-d0f3b.firebasestorage.app",
  messagingSenderId: "1021645263850",
  appId:             "1:1021645263850:web:dfd5c7cd0bd99762679893",
  measurementId:     "G-DR5MLDL5BG"
};

const ALLOWED_DOMAIN    = '@rowecasaorganics.com';
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // ← replace after EmailJS setup
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // ← replace
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // ← replace

// ── Firebase init ─────────────────────────────────────────────
const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

// ── Auth guard — redirect to login if not signed in ───────────
onAuthStateChanged(auth, user => {
  if (!user || !user.email.endsWith(ALLOWED_DOMAIN)) {
    signOut(auth).finally(() => window.location.replace('login.html'));
    return;
  }
  // Show user email in topbar
  const userEl = document.getElementById('topbarUser');
  if (userEl) userEl.textContent = user.email;
});

// ── Sign out button ───────────────────────────────────────────
const authBtn = document.getElementById('authBtn');
if (authBtn) {
  authBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.replace('login.html'));
  });
}

// ── Section nav ──────────────────────────────────────────────
window.showSection = function(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn, .contact-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name)?.classList.add('active');
  if (btn) btn.classList.add('active');
};

// ── EmailJS contact form ──────────────────────────────────────
emailjs.init(EMAILJS_PUBLIC_KEY);

const sendBtn  = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');

if (sendBtn) {
  sendBtn.addEventListener('click', async () => {
    const from    = document.getElementById('contactFrom')?.value.trim();
    const subject = document.getElementById('contactSubject')?.value.trim();
    const body    = document.getElementById('contactBody')?.value.trim();

    if (!from)    { setContactStatus('error', 'Please enter your email address.'); return; }
    if (!subject) { setContactStatus('error', 'Please enter a subject.'); return; }
    if (!body)    { setContactStatus('error', 'Please enter a message.'); return; }

    sendBtn.textContent = 'Sending...';
    sendBtn.disabled = true;

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_email: from,
        to_email:   'itsupport@rowecasaorganics.com',
        subject,
        message:    body
      });
      setContactStatus('success', '✅ Message sent! The IT team will be in touch shortly.');
      clearContactForm();
    } catch(e) {
      setContactStatus('error', '❌ Failed to send. Please email itsupport@rowecasaorganics.com directly.');
    } finally {
      sendBtn.textContent = 'Send Message →';
      sendBtn.disabled = false;
    }
  });
}

if (clearBtn) clearBtn.addEventListener('click', clearContactForm);

function clearContactForm() {
  ['contactFrom','contactSubject','contactBody'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  setContactStatus('', '');
}

function setContactStatus(type, msg) {
  const el = document.getElementById('contactStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'contact-status' + (type ? ' ' + type : '');
}
