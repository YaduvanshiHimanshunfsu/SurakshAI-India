<div align="center">

<img src="https://img.shields.io/badge/AI-Gemini%20API-orange?style=for-the-badge&logo=google" />
<img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi" />
<img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-646CFF?style=for-the-badge&logo=vite" />
<img src="https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel" />

# 🛡️ SurakshAI-India
### *Privacy-first scam awareness and recovery support for India*
**"Think before you click."**

Developed by **Himanshu Yadav** · [himanshu.btmtcs4242906@nfsu.ac.in](mailto:himanshu.btmtcs4242906@nfsu.ac.in)  
Built for **Novate India – National Hackathon 2026** 🇮🇳

</div>

---

## 📌 Problem Statement

SurakshAI-India helps people make a safer decision when a suspicious SMS,
WhatsApp message, email, link, screenshot, or voice note creates pressure to
click, share information, install an app, or send money. It offers cautious
guidance and recovery support; it is not a substitute for a bank, law
enforcement agency, or official reporting portal.

India loses over **₹10,000 crore annually** to cyber fraud. In 2023, the Indian Cybercrime Coordination Centre (I4C) recorded **15.56 lakh cybercrime complaints** — a 60% jump from the previous year. The average victim loses **₹34,000 per incident**.

The most devastating part: **85% of victims say they had a gut feeling something was wrong** but couldn't confirm it fast enough before acting.

### Why Existing Tools Fail Indians

| Tool | What it does | What it misses |
|---|---|---|
| **Truecaller** | Identifies spam callers | Cannot read or analyse message content |
| **Google Safe Browsing** | Flags known phishing URLs | Misses text-only scams (OTP theft, KBC lottery fraud) |
| **Cybercrime.gov.in** | Lets you report a scam | Prevention — you file *after* being scammed |
| **ScamAdviser / PhishTank** | Western scam patterns | No understanding of UPI, KYC, PM Awas, Hinglish |

**SurakshAI-India fills the gap**: it reads the *content* of a suspicious message, understands the Indian linguistic and cultural context (English, Hindi, Hinglish), identifies the psychological manipulation tactic used, and tells you exactly what to do next — all in seconds.

---

## 🔍 Why We Chose This Problem

- **Personal relevance**: Every Indian has received a suspicious SMS or WhatsApp message. This problem is universally felt.
- **Underfilled gap**: No existing tool analyses message *content* in Hindi or Hinglish with Indian scam context.
- **Measurable impact**: The harm is quantified (₹10,000 Cr/year) and the prevention moment is clear — catch it *before* the user clicks.
- **Empowerment over alarm**: Instead of just saying "SCAM", we explain *how* it tries to manipulate you, helping users build long-term scam literacy.

---

## ✨ Key Features

### 🧠 AI Analysis (Gemini-Powered)
- Detects **11 Indian and global scam categories**: UPI Fraud, KYC Scam, Government Impersonation, Lottery Prize, Fake Job, Investment Fraud, OTP Theft, Phishing Link, Courier Scam, Tech Support, Romance Scam.
- Identifies **8 psychological manipulation tactics**: False Urgency, Authority Impersonation, Fear Induction, Too Good To Be True, OTP Social Engineering, Processing Fee Trap, Social Proof Fabrication, Reciprocity Trap.
- Returns a structured **Verdict** (`SCAM` / `SUSPICIOUS` / `SAFE`) with a **0–100 confidence score**.
- Extracts **exact red-flag phrases** from the original message and highlights them in the UI.
- Provides a **plain Hindi summary** (Devanagari) for non-English users.
- Gives **specific action steps** (e.g., "Call 1930", "Report at cybercrime.gov.in").

### 🔗 URL Intelligence (No Link is Opened)
- Analyses URL structure, registered domain, subdomain abuse, and look-alike patterns.
- Checks **TLS certificate** status (valid HTTPS ≠ legitimate site).
- Optionally integrates with **Google Web Risk** and **VirusTotal** (when API keys are provided).
- Provides a risk score (0–100) and risk level (LOW / MEDIUM / HIGH / CRITICAL).

### 📧 Email Analysis (.eml Support)
- Parses raw `.eml` files — preserves `From`, `Reply-To`, `Authentication-Results`, DKIM signatures, and attachment metadata.
- Checks **SPF, DKIM, DMARC, and header alignment**.
- Never opens links, renders HTML, executes attachments, or connects to your inbox.

### 🔒 Privacy-First Architecture
- **Gemini API key stays on the server** — never exposed to the browser.
- Message texts are **never written to application logs**.
- Input is capped, CORS is restricted, and there is a per-IP rate limit.
- The model's response is **schema-validated** before it reaches the browser.

### 🛡️ Offline Fallback
- If the AI provider is unavailable (no key or network error), a transparent **rule-based fallback analyser** still provides a useful, clearly-labelled response — ensuring the demo never crashes.

### 🔐 Evidence Locker and Report Pack
- Stores user-selected analysed evidence in **browser-only IndexedDB**, encrypted with a non-extractable **AES-GCM Web Crypto** key.
- The backend intentionally has **no endpoint** for evidence contents or report packs; raw evidence is never retained by SurakshAI's server.
- Exports a downloadable PDF Evidence Pack with case ID, time, analysis outcome, red flags, indicators, rescue actions, and official reporting links.
- Masks sensitive values by default. An unredacted PDF needs an explicit confirmation from the user.

---

## 🏗️ Architecture & How It Works

### System Flowchart

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER (Browser)                               │
│  [ Paste SMS / WhatsApp / Email / Link ]                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │  POST /api/v1/surakshai/analyze
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FastAPI Backend (app/)                          │
│                                                                  │
│  1. Input Validation & Rate Limiting                            │
│     └─ Pydantic schema, per-IP limiter, max 5 KB input          │
│                                                                  │
│  2. URL Intelligence (Parallel)                                  │
│     └─ Domain/TLS/Reputation checks — no link is opened         │
│                                                                  │
│  3. Gemini AI Analysis                                           │
│     └─ Model auto-discovery (Flash preferred)                   │
│     └─ System prompt: Indian scam categories + JSON schema      │
│     └─ Structured JSON output with strict Pydantic validation   │
│                                                                  │
│  4. Fallback (if AI unavailable)                                 │
│     └─ Rule-based analyser, clearly labelled RULE_FALLBACK      │
│                                                                  │
│  5. Response Normalisation                                       │
│     └─ Red flags verified against original text                  │
│     └─ Safe results capped at 75% confidence                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │  JSON response
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                 React Frontend (frontend/)                        │
│                                                                  │
│  ┌─ Verdict Card ─────────────────────────────────────────────┐ │
│  │  SCAM / SUSPICIOUS / SAFE + Confidence Ring + Severity     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌─ Red Flag Highlighter ─────────────────────────────────────┐ │
│  │  Original message text with exact phrases marked in red    │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌─ Manipulation Tactics ─────────────────────────────────────┐ │
│  │  Pill badges: FALSE URGENCY · AUTHORITY IMPERSONATION      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌─ Hindi Summary ─────────────────────────────────────────────┐ │
│  │  यह संदेश एक धोखा है... (Noto Sans Devanagari font)        │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌─ Action Steps ─────────────────────────────────────────────┐ │
│  │  1. Do NOT click any links                                 │ │
│  │  2. Block this number                                      │ │
│  │  3. Report at cybercrime.gov.in / Call 1930                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI + Uvicorn |
| AI provider | Google Gemini (Flash family, auto-discovered) |
| Input validation | Pydantic v2 |
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| UI Icons | Lucide React |
| Notifications | React Hot Toast |
| Fonts | Inter + Noto Sans Devanagari |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Option A — One-command start (recommended)

```bash
# Clone the repo
git clone https://github.com/YaduvanshiHimanshunfsu/SurakshAI-India.git
cd SurakshAI-India

# Set up your environment
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here

# Run the orchestrator — it handles venv creation, dep install, and starts both servers
python run.py
```

The script will:
1. Create a `.venv` Python virtual environment if one doesn't exist.
2. Ask to install Python dependencies (`requirements.txt`) if missing.
3. Ask to install frontend dependencies (`npm install`) if `node_modules` is missing.
4. Start the **FastAPI backend** on `http://127.0.0.1:8000`.
5. Start the **Vite React frontend** on `http://localhost:5173`.

### Option B — Manual setup

```powershell
# Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env          # then add GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.  
API docs (development only): `http://localhost:8000/docs`

---

## 🔌 API Reference

All endpoints are under `/api/v1/`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/surakshai/analyze` | Analyse SMS, WhatsApp, social media, or any pasted text |
| `POST` | `/surakshai/url/analyze` | Inspect a URL for phishing signals, TLS, and reputation |
| `POST` | `/surakshai/email/analyze` | Analyse a pasted email body or raw `.eml` file |
| `POST` | `/surakshai/media/validate` | Validate a consented image/audio upload in memory without saving it |
| `POST` | `/surakshai/media/extract` | Extract reviewable text from a consented screenshot or short voice note |
| `POST` | `/surakshai/rescue-plan` | Return deterministic, exposure-specific safety and evidence guidance |
| `GET` | `/health` | Returns provider status and fallback availability |

### Example request

```bash
curl -X POST http://localhost:8000/api/v1/surakshai/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "Dear customer, your SBI UPI ID will be blocked in 24 hours. Verify: sbi-verify-kyc.in/urgent", "language": "auto"}'
```

### Example response

```json
{
  "verdict": "SCAM",
  "confidence": 97,
  "scam_category": "UPI_FRAUD",
  "severity": "HIGH",
  "psychological_tactics": ["FALSE_URGENCY", "AUTHORITY_IMPERSONATION", "FEAR_INDUCTION"],
  "red_flags": [
    {"phrase": "blocked in 24 hours", "explanation": "Fake urgency designed to stop you thinking clearly."},
    {"phrase": "sbi-verify-kyc.in", "explanation": "Look-alike domain mimicking SBI — not an official bank URL."}
  ],
  "action_steps": [
    "Do NOT click any links in this message.",
    "Block this number immediately.",
    "Report at cybercrime.gov.in or call the National Cyber Helpline 1930."
  ],
  "hindi_summary": "यह संदेश एक धोखा है। आपके UPI खाते को ब्लॉक करने की झूठी धमकी देकर आपकी जानकारी चुराने की कोशिश की जा रही है।",
  "analysis_source": "AI"
}
```

### Rescue Mode

After an analysis, choose what happened: only received the message, opened a
link, shared information, disclosed a security secret, installed a remote-access
app/shared your screen, or sent money. SurakshAI returns a reviewed, deterministic
plan with the right urgency and evidence checklist. It never asks for an OTP, PIN,
password, CVV, card number, or other secret.

For a completed financial fraud, call **1930** immediately and file or track the
complaint through [cybercrime.gov.in](https://cybercrime.gov.in/).

Example:

```bash
curl -X POST http://localhost:8000/api/v1/surakshai/rescue-plan \
  -H "Content-Type: application/json" \
  -d '{"exposure_state":"SENT_MONEY","verdict":"SCAM","scam_category":"UPI_FRAUD"}'
```

### Screenshot and voice-note analysis

Users can upload a screenshot or a short voice note (or record up to 45 seconds
in the browser). After explicit consent, the app verifies the declared MIME type
against the actual file structure and keeps the upload in memory only. Screenshots
are re-encoded without metadata before Gemini OCR. Gemini returns only extracted
text/transcription, which the user must review and can correct before the existing
scam analysis and Rescue Mode run. If extraction fails, SurakshAI asks the user to
paste or type the text instead; it never invents a transcript.

### Evidence Locker and PDF Evidence Pack

After an analysis, the user can preserve the analysed text in the **Evidence
Locker**. It uses browser-only IndexedDB storage encrypted with Web Crypto
AES-GCM and a non-extractable device key. The API has no endpoint for evidence,
so raw evidence is never sent to or retained by SurakshAI's server.

The downloadable Evidence Pack includes a case ID, timestamp, verdict, red
flags, extracted indicators, recovery actions, saved local evidence, and the
official 1930 / NCRP reporting information. Exports mask phone numbers, email
usernames, UPI IDs, cards, identity numbers, secrets, and private URL query data
by default. An unredacted export is possible only after an explicit confirmation.

---

## 🧪 Real Indian Scam Examples (Built into the App)

The app ships with demo examples you can try with one click:

| Demo | Message pattern |
|---|---|
| **UPI Account Blocked** | "Dear customer, your SBI UPI ID will be blocked in 24 hours…" |
| **Fake Job Offer** | "Work from home! Earn ₹800-1500/hr by liking YouTube videos…" |
| **KBC Lottery Prize** | "Congratulations! You have won ₹45,00,000 in KBC Season 15…" |
| **Email Demo** | HDFC Bank impersonation email with forged security@hdfc domain |

---

## 📁 Project Structure

```
SurakshAI-India/
├── app/                        # FastAPI backend
│   ├── main.py                 # App factory, CORS, static file serving
│   ├── config.py               # Pydantic settings (env vars)
│   ├── schemas.py              # Full Pydantic request/response models
│   ├── prompts.py              # Gemini system prompt + user message builder
│   ├── api/
│   │   └── routes.py           # API route handlers
│   ├── services/
│   │   ├── scam_analyzer.py    # Gemini orchestration + model auto-discovery
│   │   ├── email_analyzer.py   # .eml parsing + auth header analysis
│   │   ├── url_intelligence.py # URL structural + TLS + reputation checks
│   │   ├── fallback_analyzer.py# Rule-based offline fallback
│   │   ├── media_analyzer.py   # In-memory Gemini OCR/transcription extraction
│   │   └── rescue_planner.py   # Deterministic post-exposure safety plans
│   ├── data/
│   │   └── recovery_playbooks.py # Reviewed safety and evidence playbooks
│   ├── core/
│   │   ├── limiter.py          # In-memory per-IP rate limiter
│   │   └── middleware.py       # Security headers + request size limit
│   └── utils/
│       └── json_output.py      # Safe JSON parser for model output
│
├── frontend/                   # React + Vite + Tailwind SPA
│   ├── index.html              # Entry HTML
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx             # Main UI and analysis flow
│       ├── features/rescue/
│       │   └── RescueMode.jsx  # Post-analysis exposure selector and plan
│       ├── features/MediaScanner.jsx      # Consent, upload, and short recording
│       ├── features/TranscriptReview.jsx  # Editable OCR/transcription review
│       ├── features/evidence/
│       │   ├── EvidenceLocker.jsx # Encrypted, local-only evidence workflow
│       │   └── ReportPack.jsx     # Masked-by-default PDF export
│       ├── main.jsx            # React entry point
│       ├── index.css           # Tailwind + Google Fonts import
│       ├── lib/
│       │   ├── api.js          # API client (fetch wrapper)
│       │   ├── vault.js        # AES-GCM IndexedDB evidence vault
│       │   ├── redaction.js    # Privacy-safe report masking
│       │   └── report.js       # Dependency-free PDF report generator
│       └── data/
│           └── demo.js         # Preloaded Indian scam demo examples
│
├── tests/                      # Pytest test suite (no API key required)
│   ├── test_api.py
│   ├── test_fallback_analyzer.py
│   ├── test_json_output.py
│   └── test_url_intelligence.py
│
├── .env.example                # Environment variable template
├── requirements.txt            # Python dependencies
├── run.py                      # 🚀 One-command orchestrator script
└── README.md
```

---

## 🔐 Security Design

- **API key isolation**: `GEMINI_API_KEY` is read from server environment only; it never appears in frontend code, HTTP responses, or logs.
- **Prompt injection protection**: User-submitted text is wrapped in `<untrusted_message>` delimiters and the system prompt explicitly instructs the model to treat it as untrusted data.
- **No URL execution**: URL intelligence never follows redirects, downloads page content, runs JavaScript, or submits unknown links to external scanners unless VirusTotal/Web Risk keys are configured.
- **No inbox access**: Email analysis accepts pasted text or `.eml` files only. No OAuth, no IMAP, no inbox connection of any kind.

---

## 🧪 Running Tests

```bash
# No API key required — tests use the offline fallback and deterministic checks
pytest -q

# Browser-side privacy and report-generation unit tests
cd frontend
npm test
```

Before deploying to Vercel, build the SPA with `npm run build`. The generated
`frontend/dist` directory is served by the FastAPI entrypoint referenced by
`vercel.json`; no evidence vault or report data is included in a server API.

---

## ▲ Vercel Deployment

This repository is ready for a single Vercel deployment:

- `api/index.py` is the Vercel FastAPI serverless entrypoint; `vercel.json` uses the current `functions` configuration and excludes only test/development folders.
- `frontend/dist` is intentionally committed and is served by FastAPI in production.
- `frontend/.env.production` uses `VITE_API_BASE_URL=/api/v1`, so the deployed browser talks to the same deployed origin, never `localhost`.
- Vite proxies `/api` to FastAPI during local development.

### Deploy checklist

1. Run `cd frontend; npm run build` and commit the updated `frontend/dist` folder.
2. Push the repository and import it in Vercel. Select **Other** if Vercel asks for a framework preset.
3. Add `GEMINI_API_KEY` in **Vercel → Settings → Environment Variables**. Add optional `WEB_RISK_API_KEY` or `VIRUSTOTAL_API_KEY` only if needed.
4. Set `ENVIRONMENT=production` and set `ALLOWED_ORIGINS` to the deployment URL, for example `https://your-project.vercel.app`.
5. Deploy, then open `/api/v1/health`, analyse a test message, and download a masked PDF Evidence Pack.

Never create `VITE_GEMINI_API_KEY`, `VITE_VIRUSTOTAL_API_KEY`, or any other frontend-prefixed secret. Vite embeds `VITE_*` values in the browser bundle.

---

## 👨‍💻 Developer

**Himanshu Yadav**  
B.Tech (MTCS), National Forensic Sciences University (NFSU)  
📧 [himanshu.btmtcs4242906@nfsu.ac.in](mailto:himanshu.btmtcs4242906@nfsu.ac.in)

Built for **Novate India – National Hackathon 2026**.

---

## 🙏 Acknowledgements

- [Google Gemini API](https://ai.google.dev/) — AI analysis engine
- [FastAPI](https://fastapi.tiangolo.com/) — Backend framework
- [React](https://react.dev/) + [Vite](https://vitejs.dev/) — Frontend tooling
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [cybercrime.gov.in](https://cybercrime.gov.in) — National cybercrime reporting portal (referenced in action steps)
- National Cyber Helpline **1930** — Referenced for victims of financial fraud

---

<div align="center">
<strong>SurakshAI-India provides safety guidance, not a guarantee.<br>Always verify sensitive requests through official channels.</strong><br><br>
© 2026 SurakshAI-India · Built for a safer digital India 🇮🇳
</div>
