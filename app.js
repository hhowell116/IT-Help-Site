// ============================================================
//  app.js — RCO IT Help Site
//  Handles: Firebase auth, Firestore submissions, nav, contact
// ============================================================

import { initializeApp }                                    from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut }             from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ── Config ────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBRKBzxTYzBnBHo-YY8fSxTSSkM3uyujmc",
  authDomain:        "ithelpsite-4ec53.firebaseapp.com",
  projectId:         "ithelpsite-4ec53",
  storageBucket:     "ithelpsite-4ec53.firebasestorage.app",
  messagingSenderId: "893459212285",
  appId:             "1:893459212285:web:194adf30886cbb28c21b94",
  measurementId:     "G-H6WM1LWQ4V"
};

const ALLOWED_DOMAIN = '@rowecasaorganics.com';

// ── Init ──────────────────────────────────────────────────────
const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

let currentUser = null;

// ── Auth guard ────────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  if (!user || !user.email.endsWith(ALLOWED_DOMAIN)) {
    signOut(auth).finally(() => window.location.replace('login.html'));
    return;
  }
  currentUser = user;
  const userEl = document.getElementById('topbarUser');
  if (userEl) userEl.textContent = user.email;
});

// ── Sign out ──────────────────────────────────────────────────
document.getElementById('authBtn')?.addEventListener('click', () => {
  signOut(auth).then(() => window.location.replace('login.html'));
});

// ── Sidebar nav — wire all [data-section] buttons ─────────────
document.querySelectorAll('[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.section;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('[data-section]').forEach(b => b.classList.remove('active'));
    document.getElementById('section-' + name)?.classList.add('active');
    btn.classList.add('active');
    if (name === 'completed') renderCompleted();
  });
});

// ── Start survey button ───────────────────────────────────────
document.getElementById('startSurveyBtn')?.addEventListener('click', () => {
  window.location.href = 'surveys/tech-discovery.html';
});

// ── Refresh button ────────────────────────────────────────────
document.getElementById('refreshBtn')?.addEventListener('click', () => {
  renderCompleted();
});

// ── Completed submissions ─────────────────────────────────────
async function renderCompleted() {
  const list = document.getElementById('completedList');
  if (!list) return;

  list.innerHTML = `<div class="empty-state">
    <div class="login-spinner" style="margin:2rem auto"></div>
    <p style="color:var(--sb-muted)">Loading your submissions...</p>
  </div>`;

  // Wait for auth to resolve if currentUser isn't set yet
  if (!currentUser) {
    await new Promise(resolve => {
      const unsub = onAuthStateChanged(auth, user => {
        if (user) { currentUser = user; unsub(); resolve(); }
      });
      setTimeout(resolve, 5000); // fallback
    });
  }

  if (!currentUser) {
    list.innerHTML = `<div class="empty-state">
      <p style="color:var(--sb-muted)">Please sign in to view your submissions.</p>
    </div>`;
    return;
  }

  console.log('renderCompleted — currentUser:', currentUser.email);

  try {
    const q    = query(collection(db, 'submissions'), where('uid', '==', currentUser.uid));
    const snap = await getDocs(q);

    console.log('Firestore returned', snap.size, 'docs for', currentUser.email);

    if (snap.empty) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No submissions yet</h3>
        <p>Complete a survey or form and your submissions will appear here.</p>
      </div>`;
      return;
    }

    list.innerHTML = `<div class="cards">` + snap.docs.map(doc => {
      const s    = doc.data();
      const date = s.submittedAt?.toDate
        ? s.submittedAt.toDate().toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
          })
        : '—';
      return `<div class="card brown completed-card">
        <div class="card-top">
          <span class="card-status status-active">Submitted</span>
        </div>
        <h3>${s.title || 'Survey'}</h3>
        <p style="font-size:0.82rem;line-height:1.7">
          <strong>Department:</strong> ${s.dept      || '—'}<br/>
          <strong>Submitted:</strong>  ${date}<br/>
          <strong>By:</strong>         ${s.userEmail || '—'}
        </p>
        <div class="card-meta">
          <button class="card-action" data-url="${s.url || '#'}">Take Again →</button>
        </div>
      </div>`;
    }).join('') + `</div>`;

    list.querySelectorAll('[data-url]').forEach(btn => {
      btn.addEventListener('click', () => window.location.href = btn.dataset.url);
    });

  } catch (err) {
    console.error('Firestore error:', err);
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h3>Could not load submissions</h3>
      <p style="color:var(--sb-muted)">${err.message}</p>
    </div>`;
  }
}

// ── Contact form ──────────────────────────────────────────────
document.getElementById('sendBtn')?.addEventListener('click', () => {
  const from    = document.getElementById('contactFrom')?.value.trim();
  const subject = document.getElementById('contactSubject')?.value.trim();
  const body    = document.getElementById('contactBody')?.value.trim();

  if (!from)    { setContactStatus('error', 'Please enter your email address.'); return; }
  if (!subject) { setContactStatus('error', 'Please enter a subject.'); return; }
  if (!body)    { setContactStatus('error', 'Please enter a message.'); return; }

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1`
    + `&to=${encodeURIComponent('itsupport@rowecasaorganics.com')}`
    + `&su=${encodeURIComponent(subject)}`
    + `&body=${encodeURIComponent('From: ' + from + '\n\n' + body)}`;

  window.open(gmailUrl, '_blank');
  setContactStatus('success', '✅ Gmail opened with your message ready to send!');
});

document.getElementById('clearBtn')?.addEventListener('click', () => {
  ['contactFrom','contactSubject','contactBody'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  setContactStatus('', '');
});

function setContactStatus(type, msg) {
  const el = document.getElementById('contactStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'contact-status' + (type ? ' ' + type : '');
}
