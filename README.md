# SentimentIQ ◈
 
> **Dual-model NLP pipeline** that analyzes internship feedback sentiment using Logistic Regression and DistilBERT — with a full-stack interactive dashboard built on FastAPI and vanilla JS.
 
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)
![DistilBERT](https://img.shields.io/badge/DistilBERT-HuggingFace-FFD21E?style=flat&logo=huggingface&logoColor=black)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-F7931E?style=flat&logo=scikit-learn&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384?style=flat)
 
---

 
<img width="1600" height="757" alt="image" src="https://github.com/user-attachments/assets/7cebe847-d64a-47b2-a6b5-d76add628975" />

<img width="1600" height="752" alt="image" src="https://github.com/user-attachments/assets/d74b7848-cf77-49f1-a1b1-5767e6e293e9" />

<img width="1600" height="743" alt="image" src="https://github.com/user-attachments/assets/442ba131-9db3-47b4-b437-e2a8f5ed02c6" />

<img width="1600" height="768" alt="image" src="https://github.com/user-attachments/assets/83b2b15d-4ddb-436b-9750-61020f77d644" />

<img width="1600" height="757" alt="WhatsApp Image 2026-06-09 at 8 51 25 PM" src="https://github.com/user-attachments/assets/adf2a8ad-a796-4478-ae9e-e09a3b81da92" />




## What It Does
 
SentimentIQ is a full-stack sentiment analysis application trained on 5,000 real internship reviews. It classifies feedback as **positive** or **negative** using two models — a fast TF-IDF + Logistic Regression baseline and a transformer-based DistilBERT model — both served live through a FastAPI backend.
 
**Key capabilities:**
 
- **Live Predictor** — Type or paste any internship review text and get an instant sentiment classification with confidence scores from either model. Includes per-prediction positive/negative probability scores and inference time in milliseconds.
- **Dual-Model Analysis** — Switch between Logistic Regression (TF-IDF) for speed and DistilBERT (Transformer) for accuracy. Side-by-side model comparison chart shows the accuracy, precision, recall, and F1 tradeoffs.
- **Analytics Dashboard** — Interactive charts breaking down sentiment across 10 departments, 8 company types (Tech Startup, MNC, FinTech, etc.), work modes (Remote/Onsite/Hybrid), internship duration, and student level.
- **Reviews Explorer** — Browse the full 5,000-review dataset with live filters by sentiment, department, work mode, and free-text search. Cards load in paginated batches with a "Load More" flow.
- **Dataset Overview** — At-a-glance stat cards showing total reviews, positive/negative counts, average ratings, company type diversity, and models used.
- **Animated Hero Section** — Live donut chart showing the positive/negative split with animated counters for key metrics.
- **Cursor Glow + Scroll Nav** — Polished UI with active section tracking in the navbar and smooth scroll behavior.
---
 
## ML Models
 
### Logistic Regression (TF-IDF)
- Vectorized using `TfidfVectorizer` fitted on the training corpus
- `LogisticRegression` trained on the TF-IDF matrix
- Serialized to `lr_model.pkl` + `tfidf_vectorizer.pkl` via `pickle`
- Fast, lightweight, loads instantly at server startup
### DistilBERT (Transformer)
- Uses `distilbert-base-uncased-finetuned-sst-2-english` via Hugging Face `transformers`
- Loaded lazily on first use to keep cold-start time low
- Truncates input to 512 tokens; returns raw label + confidence score
- Fine-tuned on SST-2 sentiment; applied here to internship review domain
### Model Metrics
 
| Metric | Logistic Regression | DistilBERT |
|--------|-------------------|------------|
| Accuracy | 93% | 97.1% |
| Precision | — | 97.0% |
| Recall | — | 97.0% |
| F1 Score | — | 97.0% |
| Train size | 4,000 | 4,000 |
| Test size | 1,000 | 1,000 |
 
---
 
## Dataset
 
5,000 synthetic internship reviews (`internship_reviews_5000.csv`) with a perfectly balanced 50/50 positive/negative split.
 
| Dimension | Coverage |
|-----------|----------|
| Departments | 10 (Software Engineering, Data Science, Marketing, HR, Finance, Product, UI/UX, BizDev, Cybersecurity, Operations) |
| Company Types | 8 (Tech Startup, MNC, E-commerce, FinTech, Healthcare, EdTech, Consulting, Media) |
| Work Modes | Remote, Onsite, Hybrid |
| Durations | 1, 2, 3, 6 months |
| Student Levels | Freshman, Sophomore, Junior, Senior, Fresh Graduate |
| Avg Positive Rating | 8.23 / 10 |
| Avg Negative Rating | 2.75 / 10 |
 
---
 
---
 
## Tech Stack
 
### Machine Learning & NLP
- **Python 3.11** — Core language
- **scikit-learn 1.4** — `TfidfVectorizer`, `LogisticRegression`
- **Hugging Face Transformers 4.40** — DistilBERT inference pipeline
- **PyTorch 2.3** — Transformer backend
- **pandas 2.x / NumPy 1.26** — Data handling
- **pickle** — Model serialization
### Backend
- **FastAPI 0.111** — REST API + static file serving
- **Uvicorn 0.29** — ASGI server
- **Pydantic** — Request/response validation
### Frontend
- **Vanilla JS (ES6+)** — No framework, zero build step
- **Chart.js 4.4** — Donut chart, bar charts, model comparison chart
- **chartjs-plugin-datalabels** — Chart annotations
- **Syne + DM Sans** (Google Fonts) — Typography
### Deployment
- **Render** — Configured via `render.yaml` (Python web service, `uvicorn` start command)
---
 
## Getting Started
 
### Prerequisites
- Python 3.11+
### Quick Start
 
```bash
git clone https://github.com/your-username/sentimentiq.git
cd sentimentiq
```
 
**On Linux/macOS:**
```bash
chmod +x start.sh
./start.sh
```
 
**On Windows:**
```bat
start.bat
```
 
Both scripts install dependencies and start the server. Open **http://localhost:8000** in your browser.
 
### Manual Setup
 
```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```
 
> **Note on DistilBERT:** The transformer model is not bundled — it downloads automatically from Hugging Face on first use (~250MB). Subsequent uses are instant.
 
### Training Your Own Models (Google Colab)
 
The `backend/train_models.py` script is designed to run in a Colab notebook after your training cells. It saves the fitted `LogisticRegression` and `TfidfVectorizer` as `.pkl` files and exports the fine-tuned DistilBERT weights, then zips and downloads them for local use.
 
---

 
## License
 
MIT — free to use, modify, and distribute.
