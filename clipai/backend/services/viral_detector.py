import json

SYSTEM_PROMPT = """You are an expert viral content analyst and social media strategist.
You analyze video transcripts to identify the most engaging, shareable moments for short-form content.

You understand:
- Hooks that grab attention in first 3 seconds
- Emotional peaks (surprise, laughter, inspiration, controversy)
- Plot twists and revelations
- Quotable, memorable statements
- Educational "aha moments"
- Stories with strong narrative arcs
- Controversial or provocative takes

You output ONLY valid JSON, no markdown, no explanation."""


def _build_prompt(
    transcript_segments: list[dict],
    video_title: str,
    video_description: str,
    clip_duration: int,
    num_clips: int,
) -> str:
    full_text = "".join(
        f"[{s['start']:.1f}s - {s['end']:.1f}s] {s['text']}\n"
        for s in transcript_segments
    )
    video_duration = transcript_segments[-1]["end"] if transcript_segments else 0

    return f"""Analyze this video transcript and identify the {num_clips} most viral-worthy moments.

VIDEO TITLE: {video_title}
VIDEO DESCRIPTION: {video_description[:500]}
VIDEO DURATION: {video_duration:.0f} seconds
TARGET CLIP LENGTH: {clip_duration} seconds

TRANSCRIPT (with timestamps):
{full_text[:8000]}

Return a JSON array of exactly {num_clips} clip objects. Each object must have:
{{
  "rank": 1,
  "start_time": 45.2,
  "end_time": 92.5,
  "viral_score": 94,
  "category": "Hook|Revelation|Emotional|Plot Twist|Tutorial|Controversial|Funny|Inspiring",
  "title": "Punchy, curiosity-driven title under 60 chars",
  "description": "1-2 sentence description for the clip",
  "hook": "The exact opening line or moment that grabs attention",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "thumbnail_text": "Bold text overlay for thumbnail under 8 words",
  "why_viral": "Brief explanation of why this moment will go viral"
}}

Rules:
- Clips must NOT overlap
- Adjust start/end to nearest natural sentence boundaries
- Clip duration should be approximately {clip_duration} seconds (±15s ok)
- viral_score is 0-100 based on engagement potential
- Sort by viral_score descending
- Return ONLY the JSON array, no other text"""


def _parse_json(raw: str) -> list[dict]:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


# ── Cloud: Anthropic Claude API ───────────────────────────────────────────────

def _detect_cloud(prompt: str, api_key: str) -> list[dict]:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    return _parse_json(message.content[0].text)


# ── Local: Ollama (runs any model locally, no API key needed) ─────────────────

def _detect_local(prompt: str, ollama_model: str, ollama_url: str) -> list[dict]:
    """
    Calls a locally running Ollama instance.
    Install Ollama: https://ollama.com
    Then pull a model: ollama pull llama3.1   (or mistral, gemma2, etc.)
    """
    import urllib.request

    payload = json.dumps({
        "model": ollama_model,
        "system": SYSTEM_PROMPT,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": 4096},
    }).encode()

    req = urllib.request.Request(
        f"{ollama_url}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=None) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        raise RuntimeError(
            f"Could not reach Ollama at {ollama_url}. "
            f"Is it running? Start it with: ollama serve\nError: {e}"
        )

    raw = data.get("response", "")
    return _parse_json(raw)


# ── Unified entry point ───────────────────────────────────────────────────────

def detect_viral_moments(
    transcript_segments: list[dict],
    video_title: str,
    video_description: str,
    clip_duration: int,
    num_clips: int,
    anthropic_api_key: str = "",
    mode: str = "cloud",
    ollama_model: str = "llama3.1",
    ollama_url: str = "http://localhost:11434",
) -> list[dict]:
    prompt = _build_prompt(
        transcript_segments, video_title, video_description, clip_duration, num_clips
    )
    if mode == "local":
        return _detect_local(prompt, ollama_model, ollama_url)
    return _detect_cloud(prompt, anthropic_api_key)
