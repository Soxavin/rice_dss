FROM python:3.12-slim

WORKDIR /app

# Install system deps for TensorFlow CPU
RUN apt-get update && apt-get install -y --no-install-recommends \
    libhdf5-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    tensorflow-cpu>=2.16.0 \
    numpy>=1.26.0 \
    streamlit>=1.32.0

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
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT}"]
