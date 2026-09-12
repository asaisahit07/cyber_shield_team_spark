# 🛡️ Cyber Shield

### Explainable Scam & Phishing Detection Platform

Cyber Shield is a local-hosted cybersecurity web application that helps users identify potentially malicious **URLs, SMS messages, emails, and QR/UPI payment links** before they result in financial loss, credential theft, or account compromise.

Instead of only showing a risk score, Cyber Shield explains **why an input is suspicious**, highlights the detected red flags, describes potential consequences, and provides clear next steps for the user.

The application uses a deterministic, rule-based analysis engine designed specifically for reliable hackathon demonstrations.

---

## 🚀 Features

### 🔍 Multi-Input Threat Analysis

Analyze different types of suspicious content:

- 🌐 **URL Analysis**
  - HTTPS verification
  - Suspicious TLD detection
  - IP-based URLs
  - Suspicious URL patterns
  - Brand impersonation detection

- 📱 **SMS Analysis**
  - Urgency detection
  - OTP and credential requests
  - Suspicious links
  - Social-engineering patterns

- 📧 **Email Analysis**
  - Sender analysis
  - Subject and body analysis
  - Suspicious headers
  - Phishing indicators

- 💳 **QR / UPI Analysis**
  - UPI payment URI detection
  - Cashback/refund scam patterns
  - Suspicious payment intents

---

### 📊 Explainable Threat Scoring

Every analysis produces:

- **Threat Score:** 0–100
- **Threat Level:** SAFE / SUSPICIOUS / DANGEROUS
- **Threat Type:** Phishing / Scam
- Detected red flags
- Explanation for each detected indicator
- Potential consequences
- Recommended actions

The score is generated using deterministic weighted rules rather than random values.

---

### 🎯 Demo Presets

Built-in deterministic examples make the application reliable during a live hackathon demonstration.

Example presets:

- Fake SBI KYC SMS
- Legitimate Amazon Link
- UPI Cashback Trap
- Fake Bank Email

A preset automatically switches to the appropriate analysis mode and populates the example input.

---

### 🔐 Privacy Shield

Cyber Shield automatically masks common personally identifiable information before analysis or storage.

Examples:

```text
9876543210
↓
[REDACTED_PHONE]

example@gmail.com
↓
[REDACTED_EMAIL]
```

Raw phone numbers and email addresses are not intentionally stored in the application's threat-scan records.

---

### 🧠 Domain & Brand Spoofing Detection

The system can identify domains that resemble legitimate brands using string-similarity techniques.

For example:

```text
amazon.in
amaz0n.in

sbi.co.in
sbi-kyc.top
```

A configurable list of trusted brands and official destinations is used to improve detection and provide safer alternatives.

---

### 🚨 Emergency Response

Users who have already clicked a suspicious link or shared sensitive information can access an emergency response workflow.

The application provides guidance such as:

1. Contact your bank
2. Freeze affected cards or banking access
3. Secure compromised accounts
4. Review suspicious payment activity
5. Report the incident

It also provides access to:

**1930 — National Cyber Crime Helpline**

and the official cybercrime reporting portal.

---

### 📄 Incident Report

Users can generate a structured incident report containing:

- Date and time
- Input type
- Redacted content
- Threat score
- Threat classification
- Detected indicators
- Recommended actions

The report can be copied or printed for further use.

---

### 🌐 Community Threat Feed

Users can view recently reported scam patterns and submit suspicious incidents through the application.

Community entries can include:

- Threat type
- Threat score
- Scam pattern
- Timestamp

Personal information is not displayed in the public feed.

---

### 📚 Cyber Safety Hub

A dedicated educational section provides short guides covering topics such as:

- How to identify fake bank messages
- Package-delivery scams
- QR payment scams
- OTP safety
- How to verify official websites

---

## 🛠️ Technologies Used

### Frontend

- **React**
- **Vite**
- **JavaScript / JSX**
- **Tailwind CSS**
- **Framer Motion**
- **Lucide React**

### Backend

- **Python**
- **FastAPI**
- **Uvicorn**
- **Pydantic**

### Database

- **Supabase**
- **PostgreSQL**

### Analysis Techniques

- Regular expressions
- URL parsing
- Rule-based threat scoring
- Levenshtein distance
- String similarity
- Pattern detection
- PII redaction

---

## 🏗️ System Architecture

```text
┌──────────────────────┐
│        USER          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   React Frontend     │
│  Vite + Tailwind     │
└──────────┬───────────┘
           │ REST API
           ▼
┌──────────────────────┐
│    FastAPI Backend   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Analysis Engine    │
│                      │
│ URL Analyzer         │
│ SMS Analyzer         │
│ Email Analyzer       │
│ UPI Analyzer         │
│ PII Redaction        │
│ Threat Scoring       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Supabase / PostgreSQL│
└──────────────────────┘
```

---

## 📁 Project Structure

```text
cyber-shield/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── analyzers/
│   │   ├── services/
│   │   ├── models/
│   │   └── main.py
│   ├── requirements.txt
│   └── ...
│
├── .env
├── .gitignore
└── README.md
```

> The exact folder structure may vary depending on the implementation.

---

# ⚙️ Setup & Installation

## 1. Clone the Repository

```bash
git clone <repository-url>
cd cyber-shield
```

---

## 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 3. Configure Environment Variables

Create a `.env` file in the backend directory.

Example:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

Do not commit the `.env` file to GitHub.

---

## 4. Start the Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:

```text
http://localhost:8000
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/api/health
```

---

# 💻 Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

---

# 🔌 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/analyze` | Analyze suspicious content |
| `GET` | `/api/threats` | Retrieve community threat feed |
| `POST` | `/api/reports` | Submit a scam report |
| `GET` | `/api/presets` | Retrieve demo presets |
| `GET` | `/api/health` | Check backend status |

---

# 🎬 Recommended Demo Flow

For a hackathon demonstration:

```text
Home
  ↓
Analyze Now
  ↓
SMS
  ↓
Fake SBI KYC SMS
  ↓
Analyze Threat
  ↓
Threat Score
  ↓
Why is this dangerous?
  ↓
Detected Red Flags
  ↓
Potential Consequences
  ↓
What To Do Next
  ↓
Verified Safe Destination
  ↓
Emergency Protocol
```

This demonstrates the application's complete core workflow from **detection → explanation → protection**.

---

# 🔒 Security & Privacy

Cyber Shield is designed as a **local-hosted hackathon application**.

Important principles include:

- PII redaction before storage
- Backend-controlled analysis
- Sensitive Supabase credentials kept outside the frontend
- No raw PII intentionally stored in threat-scan records
- Deterministic analysis rules
- No real financial transactions
- Demo payment inputs are analysis-only

This project is intended for educational and demonstration purposes and should not be treated as a replacement for professional cybersecurity or financial-fraud investigation systems.

---

# 🎯 Project Goal

The goal of Cyber Shield is simple:

> **Help people understand whether something is dangerous before they click, pay, or share sensitive information.**

Rather than overwhelming users with technical security terminology, Cyber Shield turns suspicious signals into **clear, actionable explanations**.

---

## 👥 Built For

**24-Hour Hackathon Project**

Cybersecurity • Scam Detection • Phishing Detection • Explainable AI/Heuristics

---

## 📜 License

This project is released under the **MIT License**.