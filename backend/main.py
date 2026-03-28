"""
Eco-Label Vision - FastAPI Backend (SQLite)
"""
import io
import json
import base64
import logging
import sqlite3
from contextlib import contextmanager, asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

import torch
import torch.nn.functional as F
from torchvision import transforms, models
import torch.nn as nn
from PIL import Image

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eco-label")

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_PATH = Path("../model/model.pth")
META_PATH  = Path("../model/model_meta.json")
DB_PATH    = Path("ecolabel.db")

# ── Disposal info ─────────────────────────────────────────────────────────────
DISPOSAL_INFO = {
    "plastic": {
        "recyclable": True,
        "bin": "Blue Recycling Bin",
        "instructions": [
            "Rinse the container before disposal",
            "Remove caps and lids separately",
            "Flatten bottles to save space",
            "Check resin code (1-7) on the bottom",
        ],
        "carbon_saved": 0.08,
        "color": "#3B82F6",
    },
    "paper": {
        "recyclable": True,
        "bin": "Blue Recycling Bin",
        "instructions": [
            "Keep paper dry and clean",
            "Remove any plastic wrapping",
            "Flatten cardboard boxes",
            "Pizza boxes with grease go in general waste",
        ],
        "carbon_saved": 0.05,
        "color": "#F59E0B",
    },
    "cardboard": {
        "recyclable": True,
        "bin": "Blue Recycling Bin",
        "instructions": [
            "Break down boxes flat",
            "Remove tape and staples if possible",
            "Keep dry — wet cardboard is not recyclable",
        ],
        "carbon_saved": 0.06,
        "color": "#D97706",
    },
    "metal": {
        "recyclable": True,
        "bin": "Blue Recycling Bin",
        "instructions": [
            "Rinse cans before disposal",
            "Crush cans to save space",
            "Aluminium foil can be recycled if clean",
            "Remove food residue completely",
        ],
        "carbon_saved": 0.12,
        "color": "#6B7280",
    },
    "glass": {
        "recyclable": True,
        "bin": "Green Glass Bank",
        "instructions": [
            "Rinse bottles and jars",
            "Remove metal lids (recycle separately)",
            "Do not mix with ceramics or Pyrex",
            "Sort by colour if required locally",
        ],
        "carbon_saved": 0.07,
        "color": "#10B981",
    },
    "trash": {
        "recyclable": False,
        "bin": "General Waste (Black Bin)",
        "instructions": [
            "This item cannot be recycled",
            "Dispose in general waste bin",
            "Consider if item can be reused first",
            "Check local hazardous waste rules",
        ],
        "carbon_saved": 0.0,
        "color": "#EF4444",
    },
}

BADGES = [
    {"id": "beginner",   "name": "Beginner Recycler",  "threshold": 10,  "icon": "🌱"},
    {"id": "warrior",    "name": "Eco Warrior",         "threshold": 50,  "icon": "♻️"},
    {"id": "champion",   "name": "Recycling Champion",  "threshold": 100, "icon": "🏆"},
    {"id": "zero_waste", "name": "Zero Waste Hero",      "threshold": 200, "icon": "🌍"},
]

# ── SQLite ────────────────────────────────────────────────────────────────────
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      TEXT NOT NULL,
                prediction   TEXT NOT NULL,
                confidence   REAL NOT NULL,
                top3         TEXT NOT NULL,
                recyclable   INTEGER NOT NULL,
                carbon_saved REAL NOT NULL DEFAULT 0,
                timestamp    TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_user_ts ON predictions(user_id, timestamp)")
        conn.commit()
    logger.info(f"SQLite DB ready at {DB_PATH.resolve()}")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def insert_prediction(user_id, prediction, confidence, top3, recyclable, carbon_saved):
    ts = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO predictions (user_id,prediction,confidence,top3,recyclable,carbon_saved,timestamp) "
            "VALUES (?,?,?,?,?,?,?)",
            (user_id, prediction, confidence, json.dumps(top3), int(recyclable), carbon_saved, ts)
        )

# ── ML Model ──────────────────────────────────────────────────────────────────
class WasteClassifier:
    def __init__(self):
        self.model   = None
        self.classes = []
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

    def load(self):
        if not META_PATH.exists():
            raise FileNotFoundError(f"Metadata not found at {META_PATH}. Run train.py first.")
        with open(META_PATH) as f:
            meta = json.load(f)
        self.classes = meta["classes"]
        net = models.mobilenet_v3_small(weights=None)
        net.classifier[3] = nn.Linear(net.classifier[3].in_features, meta["num_classes"])
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Weights not found at {MODEL_PATH}. Run train.py first.")
        net.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
        net.eval()
        self.model = net
        logger.info(f"Model loaded — classes: {self.classes}")

    def predict(self, image: Image.Image):
        t = self.transform(image.convert("RGB")).unsqueeze(0)
        with torch.no_grad():
            probs = F.softmax(self.model(t), dim=1)[0]
        idx  = probs.topk(min(3, len(self.classes))).indices.tolist()
        top3 = [{"label": self.classes[i], "confidence": round(probs[i].item(), 4)} for i in idx]
        pred = self.classes[probs.argmax().item()]
        conf = round(probs.max().item(), 4)
        return pred, conf, top3

classifier = WasteClassifier()

# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        classifier.load()
    except FileNotFoundError as e:
        logger.warning(str(e))
    yield

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Eco-Label Vision API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Helpers ───────────────────────────────────────────────────────────────────
def build_response(pred, conf, top3):
    info = DISPOSAL_INFO.get(pred, DISPOSAL_INFO["trash"])
    return {
        "prediction":   pred,
        "confidence":   conf,
        "top3":         top3,
        "recyclable":   info["recyclable"],
        "bin":          info["bin"],
        "instructions": info["instructions"],
        "carbon_saved": info["carbon_saved"],
        "color":        info["color"],
    }

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": classifier.model is not None, "db": str(DB_PATH)}

@app.post("/predict")
async def predict(file: UploadFile = File(...), user_id: str = "anonymous"):
    if classifier.model is None:
        raise HTTPException(503, "Model not loaded. Run model/train.py first.")
    try:
        image = Image.open(io.BytesIO(await file.read()))
    except Exception:
        raise HTTPException(400, "Invalid image file")
    pred, conf, top3 = classifier.predict(image)
    result = build_response(pred, conf, top3)
    insert_prediction(user_id, pred, conf, top3, result["recyclable"], result["carbon_saved"])
    return result

@app.post("/predict/base64")
async def predict_base64(payload: dict):
    if classifier.model is None:
        raise HTTPException(503, "Model not loaded.")
    try:
        b64 = payload.get("image", "")
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        image = Image.open(io.BytesIO(base64.b64decode(b64)))
    except Exception:
        raise HTTPException(400, "Invalid base64 image")
    user_id = payload.get("user_id", "anonymous")
    pred, conf, top3 = classifier.predict(image)
    result = build_response(pred, conf, top3)
    insert_prediction(user_id, pred, conf, top3, result["recyclable"], result["carbon_saved"])
    return result

@app.get("/history/{user_id}")
def get_history(user_id: str, limit: int = 50):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT prediction, confidence, top3, recyclable, carbon_saved, timestamp "
            "FROM predictions WHERE user_id=? ORDER BY timestamp DESC LIMIT ?",
            (user_id, limit)
        ).fetchall()
    return {"history": [
        {
            "prediction":   r["prediction"],
            "confidence":   r["confidence"],
            "top3":         json.loads(r["top3"]),
            "recyclable":   bool(r["recyclable"]),
            "carbon_saved": r["carbon_saved"],
            "timestamp":    r["timestamp"],
        }
        for r in rows
    ]}

@app.get("/stats/{user_id}")
def get_stats(user_id: str):
    with get_db() as conn:
        row = conn.execute(
            "SELECT COUNT(*) as total, SUM(carbon_saved) as carbon, SUM(recyclable) as rec "
            "FROM predictions WHERE user_id=?",
            (user_id,)
        ).fetchone()
    total  = row["total"] or 0
    carbon = round(row["carbon"] or 0, 3)
    rec    = row["rec"] or 0
    return {
        "total":            total,
        "carbon_saved":     carbon,
        "recyclable_count": rec,
        "badges":           [b for b in BADGES if total >= b["threshold"]],
    }

@app.get("/municipality/dashboard")
def municipality_dashboard():
    with get_db() as conn:
        rows  = conn.execute(
            "SELECT prediction, COUNT(*) as count, SUM(carbon_saved) as carbon "
            "FROM predictions GROUP BY prediction"
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) as n FROM predictions").fetchone()["n"]
        rec   = conn.execute("SELECT COUNT(*) as n FROM predictions WHERE recyclable=1").fetchone()["n"]
    by_cat = [{"_id": r["prediction"], "count": r["count"], "carbon_saved": r["carbon"] or 0} for r in rows]
    return {
        "total_classified": total,
        "recycling_rate":   round(rec / total * 100, 1) if total else 0,
        "carbon_saved":     sum(c["carbon_saved"] for c in by_cat),
        "by_category":      by_cat,
    }

@app.get("/classes")
def get_classes():
    return {"classes": classifier.classes, "disposal_info": DISPOSAL_INFO}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
