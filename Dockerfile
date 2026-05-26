FROM python:3.12-slim

# Install system deps for TensorFlow CPU
RUN apt-get update && apt-get install -y --no-install-recommends \
    libhdf5-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install Python dependencies (lockfile-based, reproducible)
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev --extra ml

# Copy project source
COPY api/ api/
COPY dss/ dss/
COPY ml/ ml/
COPY ui/ ui/
COPY tests/ tests/
COPY translations/ translations/
COPY models/ models/
COPY run_local.py .

# Create logs directory
RUN mkdir -p logs

# Cloud Run injects PORT env var; default to 8000 for local dev
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uv run uvicorn api.main:app --host 0.0.0.0 --port ${PORT}"]
