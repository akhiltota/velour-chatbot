# Velour AI Chatbot — Full-Stack Architecture
### Production-Ready E-commerce AI Customer Support System
### Powered by OpenAI GPT-4o

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (User)                          │
│              React + Vite (Netlify/Vercel)                  │
│                                                             │
│   ChatWidget → useChat() → chatApi.js                       │
│                                 │                           │
│                    POST /api/chat  ← NO API KEY HERE        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼  HTTPS
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Render/Railway)                   │
│                  Python FastAPI                             │
│                                                             │
│  RateLimiter → Route → Controller → AIService              │
│                                          │                  │
│                          OPENAI_API_KEY (in .env only)      │
│                                          │                  │
│                                     OpenAI API              │
└─────────────────────────────────────────────────────────────┘
```

**Security guarantee:** The `OPENAI_API_KEY` lives exclusively in the server `.env`
file. It is never sent to the browser, never in the frontend build, never in responses.

---

## 📁 Project Structure

```
velour/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatWidget.jsx
│   │   │   │   ├── ChatButton.jsx
│   │   │   │   ├── ChatMessage.jsx
│   │   │   │   ├── ChatInput.jsx
│   │   │   │   ├── QuickReplies.jsx
│   │   │   │   └── TypingIndicator.jsx
│   │   │   └── ui/
│   │   │       └── Toast.jsx
│   │   ├── hooks/
│   │   │   ├── useChat.js
│   │   │   └── useToast.js
│   │   ├── services/
│   │   │   └── chatApi.js          # ONLY file that calls /api/chat
│   │   ├── utils/
│   │   │   └── session.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.development
│   ├── .env.production
│   ├── vite.config.js
│   └── package.json
│
├── server/                         # FastAPI backend
│   ├── main.py
│   ├── config/
│   │   └── settings.py             # OPENAI_API_KEY loaded here from .env
│   ├── routes/
│   │   ├── chat.py                 # POST /api/chat
│   │   └── health.py               # GET /api/health
│   ├── controllers/
│   │   └── chat_controller.py
│   ├── services/
│   │   ├── claude_service.py       # OpenAI calls — API key NEVER leaves here
│   │   ├── prompt_engine.py        # Brand prompt system
│   │   └── chat_logger.py
│   ├── middleware/
│   │   ├── rate_limiter.py
│   │   └── request_logger.py
│   ├── utils/
│   │   └── validators.py
│   ├── logs/
│   ├── requirements.txt
│   └── .env.example
│
├── netlify.toml
├── render.yaml
└── .gitignore
```

---

## 🚀 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- An OpenAI API key — [get one here](https://platform.openai.com/api-keys)

---

### 1. Clone & enter the project

```bash
git clone https://github.com/yourname/velour.git
cd velour
```

---

### 2. Backend Setup

```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
```

Open `server/.env` and add your key:

```env
OPENAI_API_KEY=sk-proj-your-real-key-here
ENVIRONMENT=development
OPENAI_MODEL=gpt-4o
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

✅ Backend running at: http://localhost:8000  
✅ Swagger API docs: http://localhost:8000/docs  
✅ Health check: http://localhost:8000/api/health

---

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

✅ Frontend running at: http://localhost:5173

The Vite dev proxy automatically forwards `/api/*` to port 8000 — no config needed.

---

## 🌐 Production Deployment

### Step 1 — Deploy Backend on Render

1. Push code to GitHub (`.env` is gitignored)
2. [render.com](https://render.com) → **New Web Service** → connect repo
3. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Environment variables** (set in Render dashboard):
   ```
   OPENAI_API_KEY    →  sk-proj-your-real-key
   OPENAI_MODEL      →  gpt-4o
   ENVIRONMENT       →  production
   ALLOWED_ORIGINS   →  ["https://your-site.netlify.app"]
   LOG_CHAT_TO_FILE  →  false
   ```
5. Deploy → note your URL: `https://velour-api.onrender.com`

---

### Step 2 — Deploy Frontend on Netlify

1. Update `client/.env.production`:
   ```env
   VITE_API_URL=https://velour-api.onrender.com
   ```
2. Update `netlify.toml` redirect `to` URL to match your Render URL
3. [netlify.com](https://netlify.com) → **Add new site** → Import from Git
4. Settings:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
5. Deploy → note URL: `https://velour.netlify.app`

---

### Step 3 — Connect Frontend ↔ Backend

Back in Render → Environment → update:
```
ALLOWED_ORIGINS → ["https://velour.netlify.app"]
```
Trigger redeploy. ✅

---

## 🔒 Security Architecture

| Threat | Mitigation |
|---|---|
| API key exposure | Key lives only in `server/.env`, never in responses or frontend |
| Prompt injection | Input sanitised with `html.escape()` + length limits |
| API abuse | Per-IP rate limiting (20 req/min, configurable) |
| Spam messages | Regex-based spam filter before AI processing |
| CORS abuse | Explicit allowlist — only your frontend domain accepted |
| Token cost runaway | `MAX_TOKENS=512` cap + conversation history trimming |

---

## ⚙️ Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | _(required)_ | Your OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o` | Model: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| `OPENAI_MAX_TOKENS` | `512` | Max tokens per response |
| `OPENAI_TEMPERATURE` | `0.7` | Creativity (0=focused, 1=creative) |
| `ENVIRONMENT` | `development` | `development` or `production` |
| `ALLOWED_ORIGINS` | localhost | CORS allowlist |
| `RATE_LIMIT_REQUESTS` | `20` | Max requests per window |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Rate limit window |
| `MAX_CONVERSATION_TURNS` | `20` | History kept per session |
| `LOG_CHAT_TO_FILE` | `true` | Write chat logs to JSONL |

---

## 🎨 Customising for a New Client

Edit only two files:

**`server/services/prompt_engine.py`** — Update brand config:
```python
BRAND_CONFIG = {
    "name": "ClientBrandName",
    "contact_email": "support@clientbrand.com",
    ...
}
```

**`client/src/App.jsx`** — Update products, colours, logo.

Everything else (security, rate limiting, logging) works without changes.

---

## 📊 Chat Log Format

```json
{"ts": "2025-08-01T10:23:45Z", "session_id": "abc-123", "user_name": "Priya",
 "user_msg": "What are your shipping options?",
 "bot_msg": "Free standard shipping above ₹999...", "used_ai": true}
```

Import directly into BigQuery, Supabase, or any analytics tool.

---

## 🧪 API Reference

### `POST /api/chat`

**Request:**
```json
{ "message": "What are your shipping options?", "session_id": "optional-uuid" }
```

**Response:**
```json
{
  "reply": "We offer free standard shipping on orders above ₹999...",
  "step": "main",
  "user_name": "Priya",
  "lead_captured": true,
  "session_id": "abc-123-def-456"
}
```

**Errors:** `400` spam/invalid · `429` rate limit (includes `retry_after`) · `500` server error

---

### `GET /api/health`
```json
{ "status": "ok", "service": "Velour AI Chatbot API", "environment": "production", "ai_configured": true }
```

---

*Built with FastAPI, React, Vite, and OpenAI GPT-4o.*
#   v e l o u r - c h a t b o t  
 