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
  if (name === 'completed') renderCompleted();
};

// ── Completed submissions ─────────────────────────────────────
function loadSubmissions() {
  try { return JSON.parse(localStorage.getItem('rco_submissions') || '[]'); }
  catch { return []; }
}

function renderCompleted() {
  const list = document.getElementById('completedList');
  if (!list) return;
  const submissions = loadSubmissions();

  if (submissions.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>No submissions yet</h3>
      <p>Complete a survey or form and your submissions will appear here.</p>
    </div>`;
    return;
  }

  list.innerHTML = submissions.map((s, i) => `
    <div class="card brown completed-card">
      <div class="card-top">
        <span class="card-status status-active">Submitted</span>
      </div>
      <h3>${s.title}</h3>
      <p style="font-size:0.82rem">
        <strong>Department:</strong> ${s.dept || '—'}<br/>
        <strong>Submitted:</strong> ${s.date}<br/>
        <strong>By:</strong> ${s.email || '—'}
      </p>
      <div class="card-meta">
        <button class="card-action" onclick="window.location.href='${s.url}'">Take Again →</button>
      </div>
    </div>`).join('');
}

// ── Contact form — opens Gmail compose with fields pre-filled ─
const sendBtn  = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');

if (sendBtn) {
  sendBtn.addEventListener('click', () => {
    const from    = document.getElementById('contactFrom')?.value.trim();
    const subject = document.getElementById('contactSubject')?.value.trim();
    const body    = document.getElementById('contactBody')?.value.trim();

    if (!from)    { setContactStatus('error', 'Please enter your email address.'); return; }
    if (!subject) { setContactStatus('error', 'Please enter a subject.'); return; }
    if (!body)    { setContactStatus('error', 'Please enter a message.'); return; }

    const fullBody = `From: ${from}\n\n${body}`;

    // Build Gmail compose URL with everything pre-filled
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1`
      + `&to=${encodeURIComponent('itsupport@rowecasaorganics.com')}`
      + `&su=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(fullBody)}`;

    window.open(gmailUrl, '_blank');

    setContactStatus('success', '✅ Gmail opened with your message ready to send!');
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
