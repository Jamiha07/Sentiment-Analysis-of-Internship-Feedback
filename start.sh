#!/bin/bash
echo "Starting SentimentIQ Backend..."
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
