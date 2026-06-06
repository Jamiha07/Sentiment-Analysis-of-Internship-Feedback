"""
train_models.py
───────────────
Run this script IN YOUR GOOGLE COLAB after training both models.
It saves the trained LR model + TF-IDF vectorizer so the FastAPI
backend can load and use them for real predictions.

PASTE THIS INTO A COLAB CELL AND RUN IT AFTER YOUR TRAINING CELLS.
"""

import pickle
import os

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Save Logistic Regression + TF-IDF Vectorizer
# ─────────────────────────────────────────────────────────────────────────────
# These variable names must match what you used in your notebook:
#   baseline_model   → your trained LogisticRegression
#   vectorizer       → your trained TfidfVectorizer

os.makedirs("backend/models", exist_ok=True)

# Save LR model
with open("backend/models/lr_model.pkl", "wb") as f:
    pickle.dump(baseline_model, f)
print("✅ Saved: backend/models/lr_model.pkl")

# Save TF-IDF vectorizer
with open("backend/models/tfidf_vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)
print("✅ Saved: backend/models/tfidf_vectorizer.pkl")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: Save DistilBERT fine-tuned model
# ─────────────────────────────────────────────────────────────────────────────
# This saves the Hugging Face trainer model to the backend/models/distilbert folder

trainer.save_model("backend/models/distilbert")
print("✅ Saved: backend/models/distilbert/")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Download everything as a zip from Colab
# ─────────────────────────────────────────────────────────────────────────────
import shutil
shutil.make_archive("models_export", "zip", "backend/models")

from google.colab import files
files.download("models_export.zip")
print("✅ models_export.zip downloaded — place contents in backend/models/")
