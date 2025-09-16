# Multi-stage build for React frontend and Python backend

# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY web/dashboard/package*.json ./
RUN npm ci --only=production
COPY web/dashboard/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim AS backend

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY web/dashboard/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY web/dashboard/backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8768

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV PORT=8768
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8768/health')" || exit 1

# Start the application
CMD ["python", "backend/main.py"]