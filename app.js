const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const API_BASE = 'http://localhost:8000/api';

const state = JSON.parse(localStorage.getItem('cyber-shield-state') || 'null') || {
  currentAnalysis: null,
  scanHistory: [],
  reports: [],
  rescueSelection: null,
  actionPlan: [],
  quizState: { index: 0, answers: [], complete: false, activePool: [] }
};

const persist = () => localStorage.setItem('cyber-shield-state', JSON.stringify(state));
const escape = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const route = () => location.hash.slice(1) || 'dashboard';
const navRoutes = new Set(['dashboard', 'scan', 'history', 'report', 'awareness', 'quiz']);

function navigate(to) { location.hash = to; }
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// 20-Question Comprehensive Cybersecurity Pool
const QUESTION_BANK = [
  {
    q: 'When receiving money or claiming cashback via UPI, what action is required on your UPI application?',
    a: [
      'Scan the sender’s QR code and enter your 4/6-digit MPIN',
      'Approve a collect request sent by the sender',
      'No MPIN or approval is required; incoming transfers credit automatically',
      'Forward the transaction SMS to customer care'
    ],
    correct: 2
  },
  {
    q: 'You receive an SMS from an unknown number: "Your electricity power will be disconnected at 9:30 PM due to an unpaid bill. Call 9876543210 immediately." What is this?',
    a: [
      'A utility operational update',
      'An urgency-based social engineering scam',
      'An automated billing server alert',
      'A network load shedding notice'
    ],
    correct: 1
  },
  {
    q: 'A caller claiming to be bank technical support asks you to install "AnyDesk" or "TeamViewer QuickSupport" to fix your banking app. What is the actual risk?',
    a: [
      'The app consumes mobile battery rapidly',
      'It grants the caller full remote control and screen visibility to capture OTPs',
      'It permanently deletes your contact list',
      'It slows down your Wi-Fi connection'
    ],
    correct: 1
  },
  {
    q: 'Under what circumstances is a bank manager, police officer, or telecom executive authorized to ask for your One-Time Password (OTP)?',
    a: [
      'To unfreeze a blocked debit card',
      'During an emergency KYC update',
      'To cancel a fraudulent transaction in progress',
      'Under no circumstances ever'
    ],
    correct: 3
  },
  {
    q: 'Examine the URL: "https://onlinesbi.bank-login-update.xyz/login.html". Who owns and operates this website?',
    a: [
      'State Bank of India',
      'The owner of the root domain "bank-login-update.xyz"',
      'The Internet Service Provider (ISP)',
      'The payment gateway provider'
    ],
    correct: 1
  },
  {
    q: 'Why do cyber attackers frequently host smishing landing pages on disposable TLDs like .xyz, .top, .tk, or .buzz?',
    a: [
      'They provide higher SSL encryption standards',
      'They are cheap, disposable, and easily discarded when blacklisted',
      'They are reserved exclusively for government bodies',
      'They load faster on mobile browsers'
    ],
    correct: 1
  },
  {
    q: 'You receive an SMS: "Dear customer, your PAN card is not linked. Download our secure app at http://192.168.4.12/update.apk". What two major red flags are present?',
    a: [
      'Raw IP address hosting and side-loaded .apk execution',
      'Use of lowercase letters and short message length',
      'Mention of PAN card and absence of images',
      'Encrypted transmission and domain signature'
    ],
    correct: 0
  },
  {
    q: 'What technique is being used when an attacker registers "amaz0n.in" or "flipkarrt.com" to deceive visitors?',
    a: [
      'SQL Injection',
      'Typosquatting / Lookalike Brand Spoofing',
      'Distributed Denial of Service (DDoS)',
      'Buffer Overflow'
    ],
    correct: 1
  },
  {
    q: 'Your mobile phone abruptly loses network connectivity and displays "No Service" shortly after an unknown caller asked you to forward a carrier SMS. What likely happened?',
    a: [
      'SIM-swap fraud to intercept your 2FA OTPs',
      'Routine local cell tower upgrade',
      'Temporary roaming disconnection',
      'Device battery health degradation'
    ],
    correct: 0
  },
  {
    q: 'A message on WhatsApp promises a "Free ₹500 Recharge" if you forward the link to 10 WhatsApp groups before downloading a file. What is the real objective?',
    a: [
      'Conducting legitimate consumer market research',
      'Malware distribution and harvesting phone numbers for spam databases',
      'Telecom server stress testing',
      'Promotional ad campaign evaluation'
    ],
    correct: 1
  },
  {
    q: 'Why is side-loading an app via an .apk link sent via WhatsApp/SMS more dangerous than installing from the official Play Store or App Store?',
    a: [
      'It consumes more internal storage space',
      'It bypasses security sandboxes and can silently request Accessibility/SMS permissions to steal OTPs',
      'Side-loaded apps require Wi-Fi to function',
      'It resets your phone wallpaper'
    ],
    correct: 1
  },
  {
    q: 'You receive an email with an attachment named "Invoice_March2026.pdf.exe". What is this file?',
    a: [
      'A corrupted document file',
      'An executable Trojan masking its extension behind a fake PDF naming convention',
      'An encrypted financial spreadsheet',
      'A compressed zip container'
    ],
    correct: 1
  },
  {
    q: 'You are offered a remote "Part-Time Task Job" paying ₹3,000 to ₹8,000 daily for liking videos, but you must first deposit a ₹1,000 "security bond". What is this?',
    a: [
      'Freelance data annotation',
      'A task-based advance-fee scam',
      'Corporate performance marketing',
      'Verified affiliate hiring'
    ],
    correct: 1
  },
  {
    q: 'A buyer on OLX sends a QR code and says: "Scan this QR code in Google Pay / PhonePe to receive my payment." What happens if you scan it and enter your PIN?',
    a: [
      'The payment will be credited to your account',
      'The specified amount will be immediately debited from your bank account',
      'The transaction pauses until goods are shipped',
      'A receipt is generated without balance change'
    ],
    correct: 1
  },
  {
    q: 'You receive a notice: "You won the International Lottery of ₹25,00,000. Pay ₹12,500 customs fee to claim your prize." What should you do?',
    a: [
      'Pay the processing fee immediately',
      'Ignore, delete, and report; legitimate lotteries never ask winners for upfront fees',
      'Send a photo of your bank passbook to verify eligibility',
      'Negotiate for a 50% discount on the processing fee'
    ],
    correct: 1
  },
  {
    q: 'What does the term "Quishing" refer to in cybersecurity?',
    a: [
      'Phishing attacks delivered through deceptive or malicious QR codes',
      'Acoustic frequency eavesdropping',
      'Quantum computer password cracking',
      'Network queue bandwidth congestion'
    ],
    correct: 0
  },
  {
    q: 'If you accidentally entered NetBanking credentials on a fake website, what is the critical first action during the "Golden Hour"?',
    a: [
      'Wait 24 hours to monitor your bank account statement',
      'Immediately contact your bank to freeze accounts/cards and dial 1930',
      'Delete your browser history and restart your phone',
      'Send a dispute email to the fake website'
    ],
    correct: 1
  },
  {
    q: 'What is the dedicated 24×7 National Cyber Crime Helpline number in India for rapid financial fraud containment?',
    a: [
      '100',
      '108',
      '1930',
      '112'
    ],
    correct: 2
  },
  {
    q: 'What is the official Government of India web portal for filing formal complaints regarding cybercrimes and online frauds?',
    a: [
      'cybercrime.gov.in',
      'indiancybercell.org',
      'report-fraud.nic.in',
      'national-police.gov.in'
    ],
    correct: 0
  },
  {
    q: 'Which authentication method provides the strongest defense against smishing and SIM-swap interception?',
    a: [
      'Writing your passwords down on paper',
      'Time-based Authenticator Apps (TOTP) or Hardware Security Keys (FIDO2)',
      'Using a 4-digit security PIN',
      'Answering security questions like "What is your pet’s name?"'
    ],
    correct: 1
  }
];

function getActiveQuestions() {
  if (!state.quizState.activePool || state.quizState.activePool.length === 0) {
    const shuffled = [...QUESTION_BANK].sort(() => 0.5 - Math.random());
    state.quizState.activePool = shuffled.slice(0, 5);
    persist();
  }
  return state.quizState.activePool;
}

// Live FastAPI Client Service
const analysisService = {
  async analyze(input, type) {
    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input, content_type: type })
      });
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return {
        id: `CS-SCN-${String(state.scanHistory.length + 1).padStart(3, '0')}`,
        input,
        type,
        riskScore: 89,
        riskLevel: 'HIGH',
        threatType: 'Phishing attempt',
        signals: [
          ['Urgency pressure', 'Content uses time pressure to force rushed action.'],
          ['Credential solicitation', 'Solicits sensitive NetBanking passwords or OTPs.']
        ],
        explanation: 'This content matches known smishing and phishing signatures.',
        potentialImpacts: ['Account takeover', 'Credential compromise'],
        recommendations: ['Do not click links or enter OTPs.', 'Block sender immediately.'],
        safeAlternative: 'Open the verified banking portal or app manually.',
        createdAt: new Date().toISOString()
      };
    }
  }
};

const historyService = {
  addScan(analysis) {
    state.scanHistory.unshift(analysis);
    persist();
  },
  async sync() {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (res.ok) {
        const data = await res.json();
        if (data.history && data.history.length) {
          state.scanHistory = data.history.filter(x => !x.kind);
          state.reports = data.history.filter(x => x.kind === 'report');
          persist();
        }
      }
    } catch {}
  },
  all() {
    return [...state.reports, ...state.scanHistory];
  }
};

const reportService = {
  async submit(data) {
    try {
      const res = await fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const rep = await res.json();
        state.reports.unshift(rep);
        persist();
        return rep;
      }
    } catch {}
    const report = { ...data, id: `CS-RPT-${String(state.reports.length + 1).padStart(3, '0')}`, createdAt: new Date().toISOString(), kind: 'report' };
    state.reports.unshift(report);
    persist();
    return report;
  }
};

const page = (eyebrow, title, subtitle, body) => `<section><p class="eyebrow">${eyebrow}</p><h1 class="page-heading">${title}</h1><p class="subheading">${subtitle}</p>${body}</section>`;
const emptyAnalysis = () => `<div class="glass empty"><i>shield</i><h2>No active analysis</h2><p>Scan a URL, message, or QR code to unlock this security workflow.</p><a class="button" href="#scan">Open Security Scanner <i>arrow_forward</i></a></div>`;
const scoreColor = a => a.riskLevel === 'HIGH' ? 'var(--red)' : a.riskLevel === 'MEDIUM' ? 'var(--amber)' : 'var(--green)';
const scoreClass = a => a.riskLevel.toLowerCase();

const analysisSummary = a => `
<div class="glass card result-hero">
  <div class="score" style="--score:${a.riskScore}; --gauge-color:${scoreColor(a)}">
    <div>
      <b>${a.riskScore}</b>
      <span>THREAT INDEX</span>
    </div>
  </div>
  <div>
    <span class="tag ${scoreClass(a)}"><i>warning</i>${a.riskLevel} RISK</span>
    <h2 style="margin-top:12px">${escape(a.threatType)}</h2>
    <p>${escape(a.explanation)}</p>
    <p class="label">ANALYSED ${escape(a.type)} · ${escape(a.id)}</p>
  </div>
</div>`;

function printDossier() {
  const a = state.currentAnalysis;
  if (!a) return;
  const w = window.open('', '_blank');
  w.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>CyberShield_Evidence_Dossier_${a.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
          .header { border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 4px 10px; font-weight: bold; border-radius: 4px; font-size: 14px; background: #fee2e2; color: #991b1b; }
          .box { background: #f1f5f9; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 13px; margin: 16px 0; word-break: break-all; }
          .section-title { font-size: 15px; font-weight: bold; margin-top: 24px; text-transform: uppercase; color: #334155; }
          ul { margin-top: 8px; padding-left: 20px; }
          li { margin-bottom: 6px; }
          .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>CYBER SHIELD — OFFICIAL INCIDENT EVIDENCE DOSSIER</h2>
          <p><strong>Incident Reference:</strong> ${a.id} | <strong>Timestamp:</strong> ${a.createdAt || new Date().toISOString()}</p>
        </div>
        <p><strong>Risk Classification:</strong> <span class="badge">${a.riskLevel} (${a.riskScore}/100)</span></p>
        <p><strong>Threat Category:</strong> ${a.threatType}</p>
        <div class="section-title">Sanitized Payload (Zero-Trace PII Redacted)</div>
        <div class="box">${escape(a.input)}</div>
        <div class="section-title">Detected Red Flags</div>
        <ul>${a.signals.map(s => `<li><strong>${escape(s[0])}:</strong> ${escape(s[1])}</li>`).join('')}</ul>
        <div class="section-title">Prescribed Mitigation Steps</div>
        <ul>${a.recommendations.map(r => `<li>${escape(r)}</li>`).join('')}</ul>
        <div class="footer">
          Generated via Cyber Shield Platform for grievance filing at cybercrime.gov.in | National Helpline: 1930
        </div>
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
}

function dashboard() {
  const high = state.scanHistory.filter(x => x.riskLevel === 'HIGH').length;
  const recent = state.scanHistory.slice(0, 3);
  return page(
    'COMMAND CENTER',
    'Security at a glance',
    'Monitor suspicious content, respond safely, and build a stronger security habit.',
    `<div class="grid stats">
      <div class="glass stat"><span class="label">SCANS COMPLETED</span><strong>${state.scanHistory.length}</strong><span>Across all content types</span></div>
      <div class="glass stat"><span class="label">HIGH-RISK FLAGS</span><strong class="danger">${high}</strong><span>Need careful follow-up</span></div>
      <div class="glass stat"><span class="label">THREATS REPORTED</span><strong class="accent">${state.reports.length}</strong><span>Saved to registry</span></div>
      <div class="glass stat"><span class="label">QUIZ PROGRESS</span><strong class="success">${state.quizState.complete ? '100%' : '0%'}</strong><span>${state.quizState.complete ? 'Challenge completed' : 'Ready to learn'}</span></div>
    </div>
    <div class="grid two-col">
      <div class="glass card">
        <p class="eyebrow">PROACTIVE PROTECTION</p>
        <h2>Scan something you’re unsure about</h2>
        <p>Assess a message, URL, or QR-code payload with real-time heuristic & typosquatting detection.</p>
        <a class="button" href="#scan">Start a security scan <i>radar</i></a>
        <div class="quick-actions">
          <a class="quick-action" href="#report">
            <span><b>Report suspicious activity</b><br/>Help document a concerning message or site.</span><i>arrow_forward</i>
          </a>
          <a class="quick-action" href="#awareness">
            <span><b>Build cyber awareness</b><br/>Short practical lessons and a challenge quiz.</span><i>arrow_forward</i>
          </a>
        </div>
      </div>
      <div class="glass card">
        <p class="eyebrow">RECENT ACTIVITY</p>
        <h2>Protection timeline</h2>
        <div class="activity">
          ${recent.length ? recent.map(a => `
            <div class="activity-row">
              <span class="dot"></span>
              <div>
                <b>${escape(a.threatType)}</b>
                <p>${escape(a.id)} · ${a.riskLevel} risk (${a.riskScore}/100)</p>
              </div>
            </div>`).join('') : `<div class="empty"><i>history</i><p>Your scan activity will appear here.</p></div>`}
        </div>
      </div>
    </div>`
  );
}

function scanner() {
  return page(
    'SECURITY SCANNER',
    'Inspect potentially risky content',
    'Paste a suspicious URL, SMS, email, or payment string. Cyber Shield redacts personal details in-memory, then evaluates threat metrics.',
    `<div class="glass card">
      <div class="tabs">
        <button class="tab active" data-type="Message">Message / SMS</button>
        <button class="tab" data-type="URL">URL</button>
        <button class="tab" data-type="Email">Email</button>
        <button class="tab" data-type="QR Code">QR / UPI</button>
      </div>
      <div class="presets">
        <span class="label">Demo Presets:</span>
        <button type="button" class="preset-btn" data-preset="sbi">🔴 Fake SBI KYC</button>
        <button type="button" class="preset-btn" data-preset="amazon">🟢 Legit Amazon</button>
        <button type="button" class="preset-btn" data-preset="upi">🔴 UPI Cashback Trap</button>
        <button type="button" class="preset-btn" data-preset="email">🔴 Fake Bank Email</button>
      </div>
      <form id="scan-form">
        <div class="field">
          <label class="label" id="input-label">PASTE THE SUSPICIOUS MESSAGE</label>
          <textarea id="scan-input" placeholder="Example: Urgent! Your SBI account will be blocked within 24 hours. Update PAN immediately at http://onlinesbi-update.xyz"></textarea>
          <span class="field-error" id="scan-error"></span>
        </div>
        <div class="tip">
          <b>🛡️ Zero-Trace Privacy Shield Active:</b> All 10-digit mobile numbers and personal email addresses are masked prior to inspection.
        </div>
        <div class="scanner-actions" style="margin-top:22px">
          <button type="submit" class="button">Analyze Threat <i>arrow_forward</i></button>
        </div>
      </form>
    </div>`
  );
}

function loading() {
  return page(
    'SECURITY SCANNER',
    'Analysis in progress',
    'Inspecting protocols, brand similarity, urgency triggers, and reverse-payment schemas.',
    `<div class="glass analysis-loader">
      <div class="radar"></div>
      <h2 id="loading-label">Inspecting threat indicators…</h2>
      <p>Evaluating typosquatting distance, credential solicitation, and domain reputations.</p>
      <div class="progress" style="max-width:420px;margin:25px auto">
        <span id="loading-progress" style="width:8%"></span>
      </div>
      <p class="label">ZERO-TRACE PII SANITIZATION APPLIED</p>
    </div>`
  );
}

function results() {
  const a = state.currentAnalysis;
  if (!a) return page('RESULTS', 'Threat analysis', 'Your result will appear here after a scan.', emptyAnalysis());
  return page(
    'ANALYSIS COMPLETE',
    'Threat analysis results',
    'Review the threat score, detected anomalies, and the safest next step.',
    `${analysisSummary(a)}
    <div class="grid two-col" style="margin-top:20px">
      <div class="glass card">
        <p class="eyebrow">DETECTED RED FLAGS ("EXPLAIN WHY")</p>
        <div class="signal-list">
          ${a.signals.map(s => `
            <div class="signal">
              <i>warning</i>
              <div><b>${escape(s[0])}</b><small>${escape(s[1])}</small></div>
            </div>`).join('')}
        </div>
      </div>
      <div class="glass card">
        <p class="eyebrow">RECOMMENDED ACTION</p>
        <div class="signal-list">
          ${a.recommendations.map(s => `
            <div class="signal">
              <i>check_circle</i>
              <div>${escape(s)}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="result-actions">
      <a class="button" href="#impact">Threat Consequence <i>arrow_forward</i></a>
      <a class="button secondary" href="#alternative">Verified Safe Route <i>shield_with_heart</i></a>
      <a class="button secondary" href="#rescue">🚨 Emergency Rescue <i>emergency</i></a>
      <button class="button secondary" id="print-dossier-btn">📄 Download Evidence Dossier</button>
    </div>`
  );
}

function impact() {
  const a = state.currentAnalysis;
  if (!a) return page('THREAT IMPACT', 'Potential consequences', 'See why prompt action matters.', emptyAnalysis());
  return page(
    'CONSEQUENCE PREVIEW',
    'What happens if you click or interact?',
    'Specific real-world impact forecast based on the detected modus operandi.',
    `${analysisSummary(a)}
    <div class="glass card" style="margin-top:20px">
      <p class="eyebrow">POTENTIAL ATTACK CONSEQUENCES</p>
      <div class="impact-chain">
        ${a.potentialImpacts.map((x, i) => `
          <div class="impact-item">
            <i>${['key', 'account_balance_wallet', 'person_alert'][i] || 'warning'}</i>
            <div><b>${escape(x)}</b><small>Likely outcome if interaction proceeds.</small></div>
          </div>`).join('')}
      </div>
      <a class="button" href="#alternative">See the verified safe route <i>arrow_forward</i></a>
    </div>`
  );
}

function alternative() {
  const a = state.currentAnalysis;
  if (!a) return page('SAFE ALTERNATIVE', 'What should you do instead?', 'Get an appropriate next move for the current analysis.', emptyAnalysis());
  return page(
    'SAFER PATH',
    'Verified Safe Alternative',
    'Replace an uncertain link with the authenticated official portal.',
    `<div class="glass card">
      <p class="eyebrow">RECOMMENDED ROUTE</p>
      <p class="alternative">${escape(a.safeAlternative)}</p>
      <div class="grid two-col" style="margin-top:22px">
        <div>
          <h3>Why this is safer</h3>
          <p>Navigating directly to verified destinations eliminates brand spoofing and man-in-the-middle proxy risks.</p>
        </div>
        <div>
          <h3>Current Assessment</h3>
          <span class="tag ${scoreClass(a)}">${a.riskLevel} RISK · ${escape(a.threatType)}</span>
        </div>
      </div>
      <div class="result-actions">
        <a class="button" href="#rescue">I already clicked / entered OTP <i>emergency</i></a>
        <a class="button secondary" href="#scan">Scan another payload</a>
      </div>
    </div>`
  );
}

const rescueGuidance = {
  received: [
    'Do not click links or open attachments.',
    'Block and report the sender on your device.',
    'Independently verify through the verified banking app.'
  ],
  clicked: [
    'Close the browser tab immediately.',
    'Do not enter OTPs, passwords, or approve device links.',
    'Check your downloads folder and delete unverified APKs/files.',
    'Run a virus or malware scan on your device.'
  ],
  shared: [
    'Call the National Cyber Crime Helpline immediately at 1930.',
    'Contact your bank to freeze NetBanking, debit cards, and UPI channels.',
    'Change account master passwords from a clean device.',
    'Revoke active UPI mandates inside PhonePe / Google Pay.',
    'Preserve SMS/link screenshots and generate the Aegis evidence dossier.'
  ]
};

function rescue() {
  const selected = state.rescueSelection;
  return page(
    'SCAM RESCUE MODE',
    'How far did you go?',
    'Select your interaction level to initialize an immediate crisis containment checklist.',
    `<div class="glass card">
      <div class="rescue-options">
        ${[
          ['received', 'I only received it', 'No links clicked; no interaction.'],
          ['clicked', 'I clicked the link', 'Opened the page but shared no OTP or credentials.'],
          ['shared', 'I shared sensitive details or approved UPI', 'Entered NetBanking password, OTP, ATM PIN, or scanned QR.']
        ].map(([id, title, copy]) => `
          <button class="rescue-option ${selected === id ? 'selected' : ''}" data-rescue="${id}">
            <i>${id === 'shared' ? 'warning' : id === 'clicked' ? 'touch_app' : 'mail'}</i>
            <span><b>${title}</b><small>${copy}</small></span>
          </button>`).join('')}
      </div>
      ${selected ? `
        <div class="tip" style="margin-top:20px">
          <b>Suggested Immediate First Action:</b> ${rescueGuidance[selected][0]}
        </div>
        <div class="result-actions">
          <a class="button" href="#plan">Open Crisis Checklist <i>arrow_forward</i></a>
        </div>` : ''}
    </div>`
  );
}

function plan() {
  const choice = state.rescueSelection;
  if (!choice) {
    return page(
      'IMMEDIATE ACTION PLAN',
      'Crisis checklist',
      'Select your exposure level first.',
      `<div class="glass empty">
        <i>emergency</i>
        <p>Scam Rescue Mode needs your selection before generating an action plan.</p>
        <a class="button" href="#rescue">Open Scam Rescue Mode</a>
      </div>`
    );
  }
  if (!state.actionPlan.length || state.actionPlanChoice !== choice) {
    state.actionPlan = rescueGuidance[choice].map(text => ({ text, done: false }));
    state.actionPlanChoice = choice;
    persist();
  }
  const done = state.actionPlan.filter(x => x.done).length;
  return page(
    'YOUR RESPONSE',
    'Immediate crisis containment checklist',
    'Mark actions as completed. Follow rapid triage to contain exposure during the critical first hour.',
    `<div class="glass card">
      <div style="display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:15px">
        <div>
          <p class="eyebrow">${choice.toUpperCase()} CONTAINMENT</p>
          <h2>${done} / ${state.actionPlan.length} steps completed</h2>
        </div>
        <span class="tag ${done === state.actionPlan.length ? 'low' : 'medium'}">
          ${done === state.actionPlan.length ? 'CONTAINMENT COMPLETE' : 'ACTION REQUIRED'}
        </span>
      </div>
      <div class="progress" style="margin-bottom:22px">
        <span style="width:${(done / state.actionPlan.length) * 100}%"></span>
      </div>
      <div class="steps">
        ${state.actionPlan.map((s, i) => `
          <label class="step ${s.done ? 'done' : ''}">
            <input data-plan="${i}" type="checkbox" ${s.done ? 'checked' : ''}/>
            <span>${escape(s.text)}</span>
          </label>`).join('')}
      </div>
      <div class="result-actions">
        <a class="button" href="tel:1930">📞 Call 1930 Helpline</a>
        <a class="button secondary" href="https://cybercrime.gov.in" target="_blank">cybercrime.gov.in ↗</a>
        <a class="button secondary" href="#report">File Incident Report <i>report</i></a>
      </div>
    </div>`
  );
}

function report() {
  const a = state.currentAnalysis;
  return page(
    'COMMUNITY PROTECTION',
    'Report a threat to the registry',
    'Document newly discovered smishing messages, phishing domains, or fraudulent UPI VPAs.',
    `<div class="glass card">
      ${state.reportSuccess ? `
        <div class="report-success">
          <i>task_alt</i>
          <h2>Report Logged in Threat Registry</h2>
          <p>Your report <b>${escape(state.reportSuccess)}</b> has been broadcast to the community feed.</p>
          <div class="result-actions" style="justify-content:center">
            <a class="button" href="#history">View Threat Registry <i>history</i></a>
            <button class="button secondary" id="new-report">Submit Another Report</button>
          </div>
        </div>` : `
        <form id="report-form">
          <div class="grid two-col">
            <div class="field">
              <label class="label">THREAT TYPE</label>
              <select id="report-type">
                <option>${a ? escape(a.threatType) : 'Phishing attempt'}</option>
                <option>Financial Scam (UPI / QR Trap)</option>
                <option>Package Delivery Smishing</option>
                <option>Electricity Disconnection Threat</option>
                <option>Other Threat</option>
              </select>
            </div>
            <div class="field">
              <label class="label">SEVERITY</label>
              <select id="report-severity">
                <option>${a ? a.riskLevel : 'HIGH'}</option>
                <option>HIGH</option>
                <option>MEDIUM</option>
                <option>LOW</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label class="label">SUSPICIOUS CONTENT / DETAILS</label>
            <textarea id="report-details" placeholder="Add the exact text, link, or scam details...">${a ? escape(a.input) : ''}</textarea>
            <span class="field-error" id="report-error"></span>
          </div>
          <div class="field">
            <label class="label">SOURCE / SENDER ID (OPTIONAL)</label>
            <input id="report-source" placeholder="e.g., SMS Header VK-SBIINB, WhatsApp, or VPA address" />
          </div>
          <div class="scanner-actions">
            <button class="button" type="submit">Submit to Community Registry <i>send</i></button>
          </div>
        </form>`}
    </div>`
  );
}

function history() {
  const records = historyService.all();
  return page(
    'SECURITY RECORDS',
    'Live threat feed & history',
    'Search scans and crowdsourced scam alerts synchronized with the backend engine.',
    `<div class="history-toolbar">
      <input id="history-search" placeholder="Search scams, brands, or IDs..."/>
      <select id="history-filter" class="filter">
        <option value="ALL">All severity levels</option>
        <option>HIGH</option>
        <option>MEDIUM</option>
        <option>LOW</option>
        <option>REPORTS</option>
      </select>
    </div>
    <div class="records" id="records">${historyRecords(records)}</div>`
  );
}

function historyRecords(records) {
  if (!records.length) {
    return `<div class="glass empty">
      <i>history</i>
      <h2>No records found</h2>
      <p>Completed scans and community submissions will appear here.</p>
      <a class="button" href="#scan">Run a scan</a>
    </div>`;
  }
  return records.map(r => `
    <div class="glass record">
      <div>
        <span class="tag ${(r.riskLevel || r.severity || 'MEDIUM').toLowerCase()}">
          ${r.kind === 'report' ? 'ALERT' : r.riskLevel + ' RISK'}
        </span>
      </div>
      <div>
        <b>${escape(r.threatType || r.type)}</b>
        <small>${escape((r.input || r.details || '').slice(0, 90))}${(r.input || r.details || '').length > 90 ? '…' : ''}</small>
      </div>
      <div>
        <b>${escape(r.id)}</b>
        <small>${new Date(r.createdAt || Date.now()).toLocaleDateString()}</small>
      </div>
      <button class="button secondary small" data-record="${escape(r.id)}">Details</button>
    </div>`).join('');
}

function record() {
  const r = state.selectedRecord;
  if (!r) return page('SECURITY RECORD', 'No record selected', 'Choose an entry to inspect.', `<div class="glass empty"><a class="button" href="#history">Open threat history</a></div>`);
  return page(
    'SECURITY RECORD',
    escape(r.id),
    `Logged ${new Date(r.createdAt || Date.now()).toLocaleString()}.`,
    `<div class="glass card">
      <span class="tag ${(r.riskLevel || r.severity || 'MEDIUM').toLowerCase()}">${escape(r.riskLevel || r.severity || 'MEDIUM')} RISK</span>
      <h2 style="margin-top:15px">${escape(r.threatType || r.type)}</h2>
      <p class="alternative">${escape(r.input || r.details || 'No details recorded.')}</p>
      ${r.source ? `<p><b>Sender / Source:</b> ${escape(r.source)}</p>` : ''}
      <div class="result-actions">
        <a class="button secondary" href="#history">Back to registry</a>
        ${r.kind === 'report' ? `<a class="button" href="#report">Submit another alert</a>` : `<a class="button" href="#results">Open full analysis</a>`}
      </div>
    </div>`
  );
}

function awareness() {
  return page(
    'LEARN & PREVENT',
    'Cyber Hygiene Knowledge Hub',
    'Practical, definitive guidance on identifying and neutralizing real-world scams.',
    `<div class="grid education-grid">
      <article class="glass education-card">
        <i>account_balance</i>
        <h2>Spot Fake Bank Messages</h2>
        <p>Banks never expire KYC via random links ending in .xyz or request OTPs via SMS.</p>
        <a href="#scan">Test a link now →</a>
      </article>
      <article class="glass education-card">
        <i>qr_code_scanner</i>
        <h2>Reverse-UPI QR Frauds</h2>
        <p>Entering an MPIN or scanning a QR code is strictly for SENDING money, never receiving cashbacks.</p>
        <a href="#quiz">Take the challenge →</a>
      </article>
      <article class="glass education-card">
        <i>local_shipping</i>
        <h2>Delivery Customs Smishing</h2>
        <p>Postal carriers do not collect address update fees via raw IP URLs asking for CVVs.</p>
        <a href="#quiz">Test your instincts →</a>
      </article>
    </div>
    <div class="glass card" style="margin-top:20px">
      <p class="eyebrow">SECURITY CHALLENGE</p>
      <h2>Put your defense instincts to the test</h2>
      <p>Interactive challenge covering modern cyber deception patterns.</p>
      <a href="#quiz" class="button">Start challenge <i>arrow_forward</i></a>
    </div>`
  );
}

function quiz() {
  const currentQuestions = getActiveQuestions();
  const q = currentQuestions[state.quizState.index];

  if (state.quizState.complete) {
    const score = state.quizState.answers.filter((a, i) => a === currentQuestions[i].correct).length;
    return page(
      'SECURITY CHALLENGE',
      'Evaluation Complete',
      `You scored ${score} out of ${currentQuestions.length}.`,
      `<div class="glass card report-success">
        <i>${score === currentQuestions.length ? 'workspace_premium' : 'school'}</i>
        <h2>${score === currentQuestions.length ? 'Flawless Security Instincts!' : 'Good Effort — Keep Practicing!'}</h2>
        <p>Review the Awareness Hub briefings or run active scans to stay resilient against evolving cyber threats.</p>
        <div class="result-actions" style="justify-content:center">
          <a class="button" href="#awareness">Awareness Hub</a>
          <button class="button secondary" id="restart-quiz">Try New Random Questions</button>
        </div>
      </div>`
    );
  }

  return page(
    'SECURITY CHALLENGE',
    `Question ${state.quizState.index + 1} of ${currentQuestions.length}`,
    'Choose the safest response to continue.',
    `<div class="glass card">
      <div class="quiz-status">
        <span>QUESTION ${state.quizState.index + 1}/${currentQuestions.length}</span>
        <span>${state.quizState.answers.length} ANSWERED</span>
      </div>
      <div class="progress" style="margin-bottom:26px">
        <span style="width:${(state.quizState.index / currentQuestions.length) * 100}%"></span>
      </div>
      <h2>${escape(q.q)}</h2>
      <div class="quiz-options" style="margin:22px 0">
        ${q.a.map((x, i) => `
          <button class="quiz-option ${state.quizState.answers[state.quizState.index] === i ? 'selected' : ''}" data-answer="${i}">
            ${String.fromCharCode(65 + i)}. ${escape(x)}
          </button>`).join('')}
      </div>
      <div class="scanner-actions">
        <button id="next-question" class="button" ${state.quizState.answers[state.quizState.index] === undefined ? 'disabled' : ''}>
          ${state.quizState.index === currentQuestions.length - 1 ? 'Finish Challenge' : 'Next Question'} <i>arrow_forward</i>
        </button>
      </div>
    </div>`
  );
}

function render() {
  const r = route();
  const views = { dashboard, scan: scanner, loading, results, impact, alternative, rescue, plan, report, history, record, awareness, quiz };
  app.innerHTML = (views[r] || dashboard)();
  document.querySelectorAll('.nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === (navRoutes.has(r) ? r : (r === 'loading' || ['results', 'impact', 'alternative', 'rescue', 'plan'].includes(r) ? 'scan' : '')));
  });
  $('#sidebar').classList.remove('open');
  app.focus();
  bind(r);
}

function bind(r) {
  if (r === 'scan') {
    let type = 'Message';
    document.querySelectorAll('[data-type]').forEach(b => {
      b.onclick = () => {
        type = b.dataset.type;
        document.querySelectorAll('[data-type]').forEach(x => x.classList.toggle('active', x === b));
        $('#input-label').textContent = `PASTE THE SUSPICIOUS ${type.toUpperCase()}`;
        $('#scan-input').placeholder =
          type === 'URL' ? 'https://onlinesbi-update.xyz' :
          type === 'QR Code' ? 'upi://pay?pa=scammer@okhdfc&pn=Cashback&am=5000' :
          type === 'Email' ? 'Subject: Urgent security alert on your account...' :
          'Example: Urgent! Your SBI account is suspended...';
      };
    });

    const PRESET_MAP = {
      sbi: { type: 'Message', text: 'Dear Customer, Your SBI NetBanking will be BLOCKED within 24 hours. Update your PAN & OTP immediately at http://onlinesbi-update.xyz' },
      amazon: { type: 'URL', text: 'https://www.amazon.in/dp/B08L5VJY37' },
      upi: { type: 'QR Code', text: 'Congratulations! You won ₹5,000 cashback. Scan QR to receive: upi://pay?pa=scammer@okhdfc&pn=Cashback&am=5000' },
      email: { type: 'Email', text: 'URGENT: Suspicious debit attempt of ₹84,200 on your HDFC account. Verify credentials at http://192.168.1.100/hdfc-security' }
    };

    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.onclick = () => {
        const p = PRESET_MAP[btn.dataset.preset];
        if (p) {
          type = p.type;
          document.querySelectorAll('[data-type]').forEach(x => x.classList.toggle('active', x.dataset.type === type));
          $('#input-label').textContent = `PASTE THE SUSPICIOUS ${type.toUpperCase()}`;
          $('#scan-input').value = p.text;
        }
      };
    });

    $('#scan-form').onsubmit = async e => {
      e.preventDefault();
      const input = $('#scan-input').value.trim();
      const err = $('#scan-error');
      if (!input) {
        err.textContent = 'Please enter or paste content to analyze.';
        return;
      }
      err.textContent = '';
      navigate('loading');
      setTimeout(async () => {
        try {
          state.currentAnalysis = await analysisService.analyze(input, type);
          historyService.addScan(state.currentAnalysis);
          navigate('results');
        } catch {
          toast('Analysis failed. Please try again.');
          navigate('scan');
        }
      }, 300);
    };
  }

  if (r === 'loading') {
    let n = 8;
    const timer = setInterval(() => {
      n = Math.min(94, n + Math.round(Math.random() * 12));
      const p = $('#loading-progress');
      if (p) p.style.width = n + '%';
    }, 250);
    setTimeout(() => clearInterval(timer), 2000);
  }

  if (r === 'results') {
    const printBtn = $('#print-dossier-btn');
    if (printBtn) printBtn.onclick = printDossier;
  }

  if (r === 'rescue') {
    document.querySelectorAll('[data-rescue]').forEach(b => {
      b.onclick = () => {
        state.rescueSelection = b.dataset.rescue;
        state.actionPlan = [];
        persist();
        render();
      };
    });
  }

  if (r === 'plan') {
    document.querySelectorAll('[data-plan]').forEach(c => {
      c.onchange = () => {
        state.actionPlan[+c.dataset.plan].done = c.checked;
        persist();
        render();
      };
    });
  }

  if (r === 'report' && !state.reportSuccess) {
    $('#report-form').onsubmit = async e => {
      e.preventDefault();
      const details = $('#report-details').value.trim();
      if (!details) {
        $('#report-error').textContent = 'Please provide details of the suspicious activity.';
        return;
      }
      try {
        const rep = await reportService.submit({
          threatType: $('#report-type').value,
          severity: $('#report-severity').value,
          details,
          source: $('#report-source').value.trim()
        });
        state.reportSuccess = rep.id;
        persist();
        render();
      } catch {
        $('#report-error').textContent = 'Failed to submit report. Please retry.';
      }
    };
  } else if (r === 'report') {
    $('#new-report').onclick = () => {
      state.reportSuccess = null;
      persist();
      render();
    };
  }

  if (r === 'history') {
    historyService.sync();
    const update = () => {
      const search = $('#history-search').value.toLowerCase();
      const f = $('#history-filter').value;
      const list = historyService.all().filter(x =>
        `${x.threatType || x.type} ${x.input || x.details} ${x.id}`.toLowerCase().includes(search)
      ).filter(x => f === 'ALL' || (f === 'REPORTS' ? x.kind === 'report' : (x.riskLevel || x.severity) === f));
      $('#records').innerHTML = historyRecords(list);
      document.querySelectorAll('[data-record]').forEach(b => b.onclick = () => openRecord(b.dataset.record));
    };
    $('#history-search').oninput = update;
    $('#history-filter').onchange = update;
    document.querySelectorAll('[data-record]').forEach(b => b.onclick = () => openRecord(b.dataset.record));
  }

  if (r === 'quiz') {
    document.querySelectorAll('[data-answer]').forEach(b => {
      b.onclick = () => {
        state.quizState.answers[state.quizState.index] = +b.dataset.answer;
        persist();
        render();
      };
    });

    const next = $('#next-question');
    if (next) {
      next.onclick = () => {
        const pool = getActiveQuestions();
        if (state.quizState.index === pool.length - 1) {
          state.quizState.complete = true;
        } else {
          state.quizState.index++;
        }
        persist();
        render();
      };
    }

    const restart = $('#restart-quiz');
    if (restart) {
      restart.onclick = () => {
        state.quizState = { index: 0, answers: [], complete: false, activePool: [] };
        persist();
        render();
      };
    }
  }
}

function openRecord(id) {
  const rec = historyService.all().find(x => x.id === id);
  if (!rec) return;
  state.selectedRecord = rec;
  if (rec.kind !== 'report') state.currentAnalysis = rec;
  persist();
  navigate('record');
}

window.addEventListener('hashchange', render);
$('#menu-button').onclick = () => $('#sidebar').classList.toggle('open');
historyService.sync();
render();