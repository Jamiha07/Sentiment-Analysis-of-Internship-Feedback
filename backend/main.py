"""
SentimentIQ — FastAPI Backend
Serves both the frontend static files AND the ML prediction API.
Models: Logistic Regression (TF-IDF) + DistilBERT (Hugging Face)
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle, os, time
from pathlib import Path

BERT_AVAILABLE = False
bert_pipeline = None
try:
    from transformers import pipeline as hf_pipeline
    BERT_AVAILABLE = True
except ImportError:
    pass

BASE_DIR   = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
STATIC_DIR = BASE_DIR.parent / "static"
INDEX_HTML = BASE_DIR.parent / "index.html"

with open(MODELS_DIR / "lr_model.pkl", "rb") as f:
    lr_model = pickle.load(f)
with open(MODELS_DIR / "tfidf_vectorizer.pkl", "rb") as f:
    tfidf = pickle.load(f)

print("LR model loaded")

app = FastAPI(
    title="SentimentIQ API",
    description="Internship Feedback Sentiment Analysis — LR + DistilBERT",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

class ReviewRequest(BaseModel):
    text: str
    model: str = "lr"

class PredictionResponse(BaseModel):
    sentiment:  str
    confidence: float
    model_used: str
    pos_score:  float
    neg_score:  float
    time_ms:    float

@app.get("/")
def serve_frontend():
    return FileResponse(str(INDEX_HTML))

@app.get("/health")
def health():
    return {
        "status": "online",
        "lr_model": "loaded",
        "bert_model": "loaded" if (BERT_AVAILABLE and bert_pipeline) else "not loaded (loads on first use)",
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(req: ReviewRequest):
    text = req.text.strip()
    if not text or len(text) < 5:
        raise HTTPException(status_code=400, detail="Review text too short")
    start = time.time()
    result = predict_bert(text) if req.model == "bert" else predict_lr(text)
    result["time_ms"] = round((time.time() - start) * 1000, 1)
    return result

def predict_lr(text):
    vec   = tfidf.transform([text])
    proba = lr_model.predict_proba(vec)[0]
    label = lr_model.predict(vec)[0]
    sentiment  = "positive" if label == 1 else "negative"
    confidence = round(float(max(proba)) * 100, 1)
    return {
        "sentiment":  sentiment,
        "confidence": confidence,
        "model_used": "Logistic Regression (TF-IDF)",
        "pos_score":  round(float(proba[1]) * 100, 1),
        "neg_score":  round(float(proba[0]) * 100, 1),
    }

def predict_bert(text):
    global bert_pipeline, BERT_AVAILABLE
    if not BERT_AVAILABLE:
        raise HTTPException(status_code=503, detail="Transformers not installed")
    if bert_pipeline is None:
        print("Loading DistilBERT...")
        bert_pipeline = hf_pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            truncation=True, max_length=512
        )
        print("DistilBERT loaded")
    result    = bert_pipeline(text[:512])[0]
    sentiment = "positive" if result["label"] == "POSITIVE" else "negative"
    score     = result["score"]
    pos_score = round(score*100,1) if sentiment=="positive" else round((1-score)*100,1)
    return {
        "sentiment":  sentiment,
        "confidence": round(score*100, 1),
        "model_used": "DistilBERT (Transformer)",
        "pos_score":  pos_score,
        "neg_score":  round(100-pos_score, 1),
    }
