# ClipAI — AI Viral Shorts Clipper

Automatically transforms long YouTube videos into viral-ready short clips.  
Supports two modes: **Cloud** (OpenAI Whisper + Claude) and **Local** (faster-whisper + Ollama — no API keys, runs 100% on your machine).

---

## Modes at a Glance

| | Cloud Mode | Local Mode |
|---|---|---|
| Transcription | OpenAI Whisper API | faster-whisper (local) |
| Viral Detection | Anthropic Claude API | Ollama (local LLM) |
| API Keys needed | ✅ Yes | ❌ No |
| Speed | Fast | Slower (depends on hardware) |
| Cost | Pay per use | Free after setup |
| Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ (depends on model) |

You can switch between modes per-job directly in the UI.

---

## Quick Start — Docker (Recommended)

```bash
docker-compose up --build
# Open http://localhost:5173
```

---

## Cloud Mode Setup

1. Open the app → **API Keys** in the sidebar
2. Add your **OpenAI API key** (for Whisper): https://platform.openai.com/api-keys
3. Add your **Anthropic API key** (for Claude): https://console.anthropic.com/keys
4. Go to **New Project** → select **Cloud Mode** → paste a YouTube URL → Generate!

---

## Local Mode Setup (Zero API Keys)

### Step 1 — Install faster-whisper (for transcription)

```bash
pip install faster-whisper
```

Or if you're running inside Docker, uncomment this line in `backend/Dockerfile`:
```dockerfile
RUN pip install --no-cache-dir faster-whisper
```

### Step 2 — Install Ollama (for viral detection LLM)

Download from https://ollama.com and install for your OS.

Then pull a model (choose based on your hardware):

```bash
# Recommended — good quality, ~8 GB download
ollama pull llama3.1

# Lighter option — faster, ~4 GB
ollama pull mistral

# Best quality — needs 48 GB RAM
ollama pull llama3.1:70b
```

Start Ollama:
```bash
ollama serve
```

### Step 3 — Start the app

```bash
docker-compose up --build
# or for local dev:
cd backend && uvicorn main:app --reload --port 8000
cd frontend && npm run dev
```

### Step 4 — Use Local Mode

1. Open **New Project**
2. Click **Local Mode** tab
3. The app will show a green ✓ next to faster-whisper and Ollama if they're running
4. Under **Local Model Settings** you can choose:
   - **Whisper model size** (tiny → large-v3, trade-off between speed and accuracy)
   - **Ollama model** (whichever you've pulled)
   - **Ollama URL** (default `http://localhost:11434`, or `http://host.docker.internal:11434` if running in Docker)
5. Click **Generate Viral Clips**

---

## Local Mode — Docker + Ollama

When running the backend in Docker and Ollama on your host machine, set the Ollama URL to:

```
http://host.docker.internal:11434
```

This is already configured in `docker-compose.yml` via `extra_hosts`.

---

## Local Development (no Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt
pip install faster-whisper       # for local mode
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Whisper Model Size Guide

| Model | RAM | Speed | Accuracy |
|-------|-----|-------|----------|
| tiny | ~1 GB | ⚡⚡⚡⚡ | ★★☆☆☆ |
| base | ~1 GB | ⚡⚡⚡ | ★★★☆☆ |
| small | ~2 GB | ⚡⚡ | ★★★★☆ |
| medium | ~5 GB | ⚡ | ★★★★☆ |
| large-v3 | ~10 GB | 🐢 (GPU recommended) | ★★★★★ |

**Recommended starting point:** `base` — good balance of speed and accuracy for most content.

---

## Ollama Model Guide

| Model | VRAM/RAM | Quality | Notes |
|-------|----------|---------|-------|
| mistral | ~5 GB | ★★★☆☆ | Fastest, decent JSON output |
| llama3.1 | ~8 GB | ★★★★☆ | Best all-round for this task |
| gemma2 | ~6 GB | ★★★★☆ | Good structured output |
| llama3.1:70b | ~48 GB | ★★★★★ | Best quality, needs serious hardware |

**Tip:** Local LLMs are less reliable at structured JSON output than Claude. If you get parsing errors, try `llama3.1` as it tends to follow JSON instructions most consistently.

---

## Project Structure

```
clipai/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── routers/
│   │   ├── health.py        # GET /api/health (shows Ollama + faster-whisper status)
│   │   ├── jobs.py          # POST/GET /api/jobs (accepts mode, local_whisper_model, ollama_model)
│   │   └── clips.py
│   └── services/
│       ├── job_store.py
│       ├── downloader.py
│       ├── transcriber.py   # Cloud: OpenAI Whisper | Local: faster-whisper
│       ├── viral_detector.py # Cloud: Anthropic Claude | Local: Ollama HTTP
│       ├── clip_editor.py
│       └── pipeline.py      # Orchestrates based on mode param
├── frontend/
│   └── src/pages/
│       ├── NewProject.jsx   # Cloud/Local toggle + model selectors
│       └── ...
├── docker-compose.yml
└── README.md
```

---

## API — Job Request

```json
POST /api/jobs
{
  "youtube_url": "https://youtube.com/watch?v=...",
  "clip_duration": 45,
  "num_clips": 5,
  "add_captions": true,

  "mode": "cloud",            // "cloud" or "local"

  // Cloud mode (required if mode=cloud)
  "openai_api_key": "sk-...",
  "anthropic_api_key": "sk-ant-...",

  // Local mode options (used if mode=local)
  "local_whisper_model": "base",        // tiny|base|small|medium|large-v3
  "ollama_model": "llama3.1",           // any model you've pulled
  "ollama_url": "http://localhost:11434"
}
```

---

## Troubleshooting

**faster-whisper not found**
```bash
pip install faster-whisper
# restart the backend
```

**Ollama not reachable from Docker**
Set Ollama URL to `http://host.docker.internal:11434` in the Local Model Settings.

**Ollama returns invalid JSON**
Switch to `llama3.1` — it follows structured output instructions most reliably.  
Alternatively, use Cloud Mode for more consistent results.

**yt-dlp fails on some videos**
Update yt-dlp: `pip install -U yt-dlp` (YouTube frequently changes their format).
