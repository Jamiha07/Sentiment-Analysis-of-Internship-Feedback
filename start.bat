@echo off
echo Starting SentimentIQ Backend...
cd backend
pip install -r requirements.txt
cd ..
python -m uvicorn backend.main:app --reload --port 8000
