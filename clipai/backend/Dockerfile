FROM python:3.11-slim

# System deps: ffmpeg + yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir yt-dlp

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Optional: uncomment to bake faster-whisper into the image
# RUN pip install --no-cache-dir faster-whisper

COPY . .
RUN mkdir -p outputs/clips outputs/thumbs outputs/work

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
