// ============================================================
//  app.js — RCO IT Help Site
//  Handles: Firebase auth, Firestore submissions, nav, contact
// ============================================================

import { initializeApp }                          from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut }   from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, query,
         where, orderBy, getDocs }                from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

const ALLOWED_DOMAIN = '@rowecasaorganics.com';

// ── Init ─────────────────────────────────────────────────────
const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

let currentUser = null;

// ── Auth guard ───────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  if (!user || !user.email.endsWith(ALLOWED_DOMAIN)) {
    signOut(auth).finally(() => window.location.replace('login.html'));
    return;
  }
  currentUser = user;
  const userEl = document.getElementById('topbarUser');
  if (userEl) userEl.textContent = user.email;
});

// ── Sign out ─────────────────────────────────────────────────
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

// ── Completed submissions (Firestore) ────────────────────────
async function renderCompleted() {
  const list = document.getElementById('completedList');
  if (!list) return;

  list.innerHTML = `<div class="empty-state"><div class="login-spinner" style="margin:2rem auto"></div><p>Loading your submissions...</p></div>`;

  try {
    const q = query(
      collection(db, 'submissions'),
      where('userEmail', '==', currentUser?.email || ''),
      orderBy('submittedAt', 'desc')
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No submissions yet</h3>
        <p>Complete a survey or form and your submissions will appear here.</p>
      </div>`;
      return;
    }

    list.innerHTML = `<div class="cards">` + snap.docs.map(doc => {
      const s = doc.data();
      const date = s.submittedAt?.toDate
        ? s.submittedAt.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        : s.submittedAt || '—';
      return `<div class="card brown completed-card">
        <div class="card-top">
          <span class="card-status status-active">Submitted</span>
        </div>
        <h3>${s.title || 'Survey'}</h3>
        <p style="font-size:0.82rem;line-height:1.7">
          <strong>Department:</strong> ${s.dept || '—'}<br/>
          <strong>Submitted:</strong> ${date}<br/>
          <strong>By:</strong> ${s.userEmail || '—'}
        </p>
        <div class="card-meta">
          <button class="card-action" onclick="window.location.href='${s.url}'">Take Again →</button>
        </div>
      </div>`;
    }).join('') + `</div>`;

  } catch(err) {
    console.error('Firestore error:', err);
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h3>Could not load submissions</h3>
      <p>Please refresh the page and try again.</p>
    </div>`;
  }
}

// ── Save submission to Firestore (called from survey pages) ──
window.saveSubmission = async function(data) {
  try {
    await addDoc(collection(db, 'submissions'), {
      ...data,
      userEmail:   currentUser?.email || '',
      submittedAt: new Date(),
    });
    return true;
  } catch(err) {
    console.error('Failed to save submission:', err);
    return false;
  }
};

// ── Contact form ─────────────────────────────────────────────
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
