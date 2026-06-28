# Use official Python lightweight image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for WeasyPrint
RUN apt-get update && apt-get install -y \
    build-essential \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libcairo2 \
    libffi-dev \
    libjpeg-dev \
    libopenjp2-7-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first for caching
COPY backend/requirements.txt ./backend/

# Install python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Download spaCy english model for AI ATS Scorer
RUN python -m spacy download en_core_web_sm

# Copy the rest of the application
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Expose port (Render sets PORT environment variable, uvicorn will bind to it if we use it, but Render can also route to 8000)
EXPOSE 8000

# Run the FastAPI server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
