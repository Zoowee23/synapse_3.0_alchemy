"""
Eco-Label Vision - FastAPI Backend
Auth (JWT) + SQLite + Groq Chatbot + Recycling Centers
"""
import io, json, base64, logging, sqlite3, os, hashlib, tempfile
from contextlib import contextmanager, asynccontextmanager
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

import torch, torch.nn.functional as F
from torchvision import transforms, models
import torch.nn as nn
from PIL import Image

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uvicorn

try:
    from groq import Groq as GroqClient
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

try:
    from resin_model import detect_resin
    RESIN_AVAILABLE = True
except ImportError:
    RESIN_AVAILABLE = False
    def detect_resin(path): return None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eco-label")

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

MODEL_PATH         = Path("../model/model.pth")
META_PATH          = Path("../model/model_meta.json")
DB_PATH            = Path("ecolabel.db")
SECRET_KEY         = os.getenv("SECRET_KEY", "eco-label-secret-change-in-prod")
GROQ_KEY           = os.getenv("GROQ_API_KEY", "")
TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "168"))

DISPOSAL_INFO = {
    "plastic":   {
        "recyclable": True, "bin": "Blue Recycling Bin",
        "instructions": ["Rinse before disposal", "Remove caps separately", "Flatten bottles", "Check resin code 1-7"],
        "carbon_saved": 0.08, "color": "#3B82F6",
        "overlay": "Wash & flatten this plastic, then place in the Blue Recycling Bin",
    },
    "paper":     {
        "recyclable": True, "bin": "Blue Recycling Bin",
        "instructions": ["Keep dry and clean", "Remove plastic wrapping", "Flatten boxes", "Greasy pizza boxes go in general waste"],
        "carbon_saved": 0.05, "color": "#F59E0B",
        "overlay": "Keep it dry! Fold and place in the Blue Recycling Bin",
    },
    "cardboard": {
        "recyclable": True, "bin": "Blue Recycling Bin",
        "instructions": ["Break down flat", "Remove tape if possible", "Keep dry"],
        "carbon_saved": 0.06, "color": "#D97706",
        "overlay": "Break it flat and pop it in the Blue Recycling Bin",
    },
    "metal":     {
        "recyclable": True, "bin": "Blue Recycling Bin",
        "instructions": ["Rinse cans", "Crush to save space", "Clean foil is recyclable", "Remove food residue"],
        "carbon_saved": 0.12, "color": "#6B7280",
        "overlay": "Rinse it out, crush it, then Blue Bin!",
    },
    "glass":     {
        "recyclable": True, "bin": "Green Glass Bank",
        "instructions": ["Rinse bottles", "Remove metal lids", "No ceramics or Pyrex", "Sort by colour locally"],
        "carbon_saved": 0.07, "color": "#10B981",
        "overlay": "Rinse and drop in the Green Glass Bank",
    },
    "trash":     {
        "recyclable": False, "bin": "General Waste (Black Bin)",
        "instructions": ["Cannot be recycled", "Dispose in general waste", "Consider reuse first", "Check hazardous waste rules"],
        "carbon_saved": 0.0, "color": "#EF4444",
        "overlay": "This goes in the Black Bin - consider reducing waste!",
    },
}

BADGES = [
    {"id": "seedling",   "name": "Seedling",          "threshold": 1,   "icon": "Seedling",  "xp": 10},
    {"id": "beginner",   "name": "Beginner Recycler",  "threshold": 10,  "icon": "Recycler",  "xp": 50},
    {"id": "warrior",    "name": "Eco Warrior",         "threshold": 25,  "icon": "Warrior",   "xp": 100},
    {"id": "champion",   "name": "Recycling Champion",  "threshold": 50,  "icon": "Champion",  "xp": 200},
    {"id": "guardian",   "name": "Earth Guardian",      "threshold": 100, "icon": "Guardian",  "xp": 500},
    {"id": "zero_waste", "name": "Zero Waste Hero",     "threshold": 200, "icon": "Hero",      "xp": 1000},
]

BADGE_EMOJIS = {
    "seedling": "\U0001f331",
    "beginner": "\u267b\ufe0f",
    "warrior":  "\u2694\ufe0f",
    "champion": "\U0001f3c6",
    "guardian": "\U0001f30d",
    "zero_waste": "\u2728",
}
for b in BADGES:
    b["icon"] = BADGE_EMOJIS.get(b["id"], "")


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            xp INTEGER NOT NULL DEFAULT 0,
            coins INTEGER NOT NULL DEFAULT 0,
            streak INTEGER NOT NULL DEFAULT 0,
            last_scan TEXT,
            created_at TEXT NOT NULL
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            prediction TEXT NOT NULL,
            confidence REAL NOT NULL,
            top3 TEXT NOT NULL,
            recyclable INTEGER NOT NULL,
            carbon_saved REAL NOT NULL DEFAULT 0,
            timestamp TEXT NOT NULL
        )""")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_pred_user ON predictions(user_id, timestamp)")
        conn.commit()
    logger.info("SQLite DB ready: %s", DB_PATH.resolve())


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def make_token(user_id: int, role: str) -> str:
    from jose import jwt
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict:
    from jose import jwt, JWTError
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")


security = HTTPBearer(auto_error=False)


def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not creds:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    data = decode_token(creds.credentials)
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id=?", (int(data["sub"]),)).fetchone()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return dict(user)


def require_municipality(user=Depends(get_current_user)):
    if user["role"] != "municipality":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Municipality access only")
    return user


def update_gamification(user_id: int, recyclable: bool):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        u = conn.execute("SELECT xp, coins, streak, last_scan FROM users WHERE id=?", (user_id,)).fetchone()
        if not u:
            return {}
        xp_gain   = 15 if recyclable else 2
        coin_gain = 10 if recyclable else 0
        streak    = u["streak"]
        last      = u["last_scan"]
        today     = datetime.now(timezone.utc).date().isoformat()
        if last:
            last_date = last[:10]
            if last_date == today:
                pass
            elif (datetime.now(timezone.utc).date() - datetime.fromisoformat(last_date).date()).days == 1:
                streak += 1
                xp_gain += streak * 2
            else:
                streak = 1
        else:
            streak = 1
        new_xp    = u["xp"] + xp_gain
        new_coins = u["coins"] + coin_gain
        conn.execute(
            "UPDATE users SET xp=?, coins=?, streak=?, last_scan=? WHERE id=?",
            (new_xp, new_coins, streak, now, user_id)
        )
    with get_db() as conn:
        total_scans = conn.execute("SELECT COUNT(*) as n FROM predictions WHERE user_id=?", (user_id,)).fetchone()["n"]
    new_badges = [b for b in BADGES if total_scans == b["threshold"]]
    return {
        "xp_gained": xp_gain, "coins_gained": coin_gain, "streak": streak,
        "new_badges": new_badges, "total_xp": new_xp, "total_coins": new_coins,
    }


class WasteClassifier:
    def __init__(self):
        self.model = None
        self.classes = []
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

    def load(self):
        if not META_PATH.exists():
            raise FileNotFoundError(f"No metadata at {META_PATH}")
        with open(META_PATH) as f:
            meta = json.load(f)
        self.classes = meta["classes"]
        net = models.mobilenet_v3_small(weights=None)
        net.classifier[3] = nn.Linear(net.classifier[3].in_features, meta["num_classes"])
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"No weights at {MODEL_PATH}")
        net.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
        net.eval()
        self.model = net
        logger.info("Model loaded: %s", self.classes)

    def predict(self, image):
        t = self.transform(image.convert("RGB")).unsqueeze(0)
        with torch.no_grad():
            probs = F.softmax(self.model(t), dim=1)[0]
        idx  = probs.topk(min(3, len(self.classes))).indices.tolist()
        top3 = [{"label": self.classes[i], "confidence": round(probs[i].item(), 4)} for i in idx]
        return self.classes[probs.argmax().item()], round(probs.max().item(), 4), top3


classifier = WasteClassifier()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        classifier.load()
    except FileNotFoundError as e:
        logger.warning(str(e))
    yield


app = FastAPI(title="Eco-Label Vision API", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class SignupBody(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"


class LoginBody(BaseModel):
    email: str
    password: str


class ChatBody(BaseModel):
    message: str


@app.post("/auth/signup")
def signup(body: SignupBody):
    if body.role not in ("user", "municipality"):
        raise HTTPException(400, "Role must be 'user' or 'municipality'")
    hashed = hash_password(body.password)
    now = datetime.now(timezone.utc).isoformat()
    try:
        with get_db() as conn:
            cur = conn.execute(
                "INSERT INTO users (username,email,password,role,created_at) VALUES (?,?,?,?,?)",
                (body.username, body.email, hashed, body.role, now)
            )
            user_id = cur.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(409, "Email or username already exists")
    token = make_token(user_id, body.role)
    return {"token": token, "user": {"id": user_id, "username": body.username, "email": body.email, "role": body.role, "xp": 0, "coins": 0, "streak": 0}}


@app.post("/auth/login")
def login(body: LoginBody):
    hashed = hash_password(body.password)
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE email=? AND password=?", (body.email, hashed)).fetchone()
    if not user:
        raise HTTPException(401, "Invalid email or password")
    token = make_token(user["id"], user["role"])
    return {"token": token, "user": {k: user[k] for k in ("id", "username", "email", "role", "xp", "coins", "streak")}}


@app.get("/auth/me")
def me(user=Depends(get_current_user)):
    return {k: user[k] for k in ("id", "username", "email", "role", "xp", "coins", "streak")}


def _build_result(pred, conf, top3):
    info = DISPOSAL_INFO.get(pred, DISPOSAL_INFO["trash"])
    return {**info, "prediction": pred, "confidence": conf, "top3": top3}


def _add_resin(result: dict, image: Image.Image) -> dict:
    """If prediction is plastic, run OCR resin detection and attach to result."""
    if result.get("prediction") != "plastic":
        return result
    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            image.convert("RGB").save(tmp.name, "JPEG")
            tmp_path = tmp.name
        resin = detect_resin(tmp_path)
        os.unlink(tmp_path)
        if resin:
            result["resin"] = resin
    except Exception as e:
        logger.warning("Resin detection error: %s", e)
    return result


@app.post("/predict")
async def predict(file: UploadFile = File(...), user=Depends(get_current_user)):
    if classifier.model is None:
        raise HTTPException(503, "Model not loaded. Run model/train.py first.")
    try:
        image = Image.open(io.BytesIO(await file.read()))
    except Exception:
        raise HTTPException(400, "Invalid image file")
    pred, conf, top3 = classifier.predict(image)
    result = _build_result(pred, conf, top3)
    result = _add_resin(result, image)
    ts = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO predictions (user_id,prediction,confidence,top3,recyclable,carbon_saved,timestamp) VALUES (?,?,?,?,?,?,?)",
            (user["id"], pred, conf, json.dumps(top3), int(result["recyclable"]), result["carbon_saved"], ts)
        )
    gamification = update_gamification(user["id"], result["recyclable"])
    gamification["recyclable"] = result["recyclable"]
    result["gamification"] = gamification
    return result


@app.post("/predict/base64")
async def predict_b64(payload: dict, user=Depends(get_current_user)):
    if classifier.model is None:
        raise HTTPException(503, "Model not loaded.")
    try:
        b64 = payload.get("image", "")
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        image = Image.open(io.BytesIO(base64.b64decode(b64)))
    except Exception:
        raise HTTPException(400, "Invalid base64 image")
    pred, conf, top3 = classifier.predict(image)
    result = _build_result(pred, conf, top3)
    result = _add_resin(result, image)
    ts = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO predictions (user_id,prediction,confidence,top3,recyclable,carbon_saved,timestamp) VALUES (?,?,?,?,?,?,?)",
            (user["id"], pred, conf, json.dumps(top3), int(result["recyclable"]), result["carbon_saved"], ts)
        )
    gamification = update_gamification(user["id"], result["recyclable"])
    gamification["recyclable"] = result["recyclable"]
    result["gamification"] = gamification
    return result


@app.get("/history")
def get_history(limit: int = 50, user=Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT prediction,confidence,top3,recyclable,carbon_saved,timestamp FROM predictions WHERE user_id=? ORDER BY timestamp DESC LIMIT ?",
            (user["id"], limit)
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


@app.get("/stats")
def get_stats(user=Depends(get_current_user)):
    with get_db() as conn:
        row = conn.execute(
            "SELECT COUNT(*) as total, SUM(carbon_saved) as carbon, SUM(recyclable) as rec FROM predictions WHERE user_id=?",
            (user["id"],)
        ).fetchone()
        u = conn.execute("SELECT xp,coins,streak FROM users WHERE id=?", (user["id"],)).fetchone()
    total  = row["total"] or 0
    carbon = round(row["carbon"] or 0, 3)
    rec    = row["rec"] or 0
    badges = [b for b in BADGES if total >= b["threshold"]]
    next_b = next((b for b in BADGES if total < b["threshold"]), None)
    return {
        "total": total, "carbon_saved": carbon, "recyclable_count": rec,
        "badges": badges, "next_badge": next_b,
        "xp": u["xp"], "coins": u["coins"], "streak": u["streak"],
    }


@app.get("/municipality/dashboard")
def muni_dashboard(user=Depends(require_municipality)):
    with get_db() as conn:
        rows      = conn.execute("SELECT prediction,COUNT(*) as count,SUM(carbon_saved) as carbon FROM predictions GROUP BY prediction").fetchall()
        total     = conn.execute("SELECT COUNT(*) as n FROM predictions").fetchone()["n"]
        rec       = conn.execute("SELECT COUNT(*) as n FROM predictions WHERE recyclable=1").fetchone()["n"]
        usr_count = conn.execute("SELECT COUNT(*) as n FROM users WHERE role='user'").fetchone()["n"]
        top_users = conn.execute(
            "SELECT u.username, COUNT(p.id) as scans, SUM(p.carbon_saved) as carbon "
            "FROM predictions p JOIN users u ON p.user_id=u.id "
            "GROUP BY p.user_id ORDER BY scans DESC LIMIT 5"
        ).fetchall()
    by_cat = [{"_id": r["prediction"], "count": r["count"], "carbon_saved": r["carbon"] or 0} for r in rows]
    return {
        "total_classified": total,
        "recycling_rate":   round(rec / total * 100, 1) if total else 0,
        "carbon_saved":     sum(c["carbon_saved"] for c in by_cat),
        "by_category":      by_cat,
        "total_users":      usr_count,
        "top_users":        [{"username": r["username"], "scans": r["scans"], "carbon": round(r["carbon"] or 0, 2)} for r in top_users],
    }


@app.get("/municipality/users")
def muni_users(user=Depends(require_municipality)):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT u.id, u.username, u.email, u.xp, u.coins, u.streak, u.created_at,
                   COUNT(p.id) as total_scans,
                   SUM(CASE WHEN p.recyclable=1 THEN 1 ELSE 0 END) as recyclable_scans,
                   ROUND(SUM(p.carbon_saved), 3) as carbon_saved
            FROM users u
            LEFT JOIN predictions p ON p.user_id = u.id
            WHERE u.role = 'user'
            GROUP BY u.id
            ORDER BY total_scans DESC
        """).fetchall()
    return {"users": [dict(r) for r in rows]}


@app.post("/chat")
async def chat(body: ChatBody, user=Depends(get_current_user)):
    FALLBACK = {
        "plastic":   "Rinse the plastic container, remove the cap, flatten it, and place in the Blue Recycling Bin. Check the resin code (1-7) on the bottom - codes 1 (PET) and 2 (HDPE) are most widely accepted.",
        "glass":     "Rinse the glass bottle or jar, remove the metal lid (recycle separately), and place in the Green Glass Bank. Never mix with ceramics or Pyrex.",
        "paper":     "Keep paper dry and clean. Remove any plastic wrapping, flatten boxes, and place in the Blue Recycling Bin. Greasy paper like pizza boxes goes in general waste.",
        "cardboard": "Break down the cardboard box flat, remove tape and staples if possible, keep it dry, and place in the Blue Recycling Bin.",
        "metal":     "Rinse the metal can to remove food residue, crush it to save space, and place in the Blue Recycling Bin. Clean aluminium foil can also be recycled.",
        "trash":     "This item cannot be recycled in standard bins. Place it in the General Waste (Black) Bin. Consider if it can be reused, repaired, or donated first.",
        "battery":   "Batteries are hazardous - never put them in regular bins. Take them to a dedicated battery recycling point (most supermarkets have one).",
        "pizza":     "Greasy pizza boxes cannot be recycled. Tear off any clean parts for recycling and put the greasy parts in general waste.",
    }
    msg_lower = body.message.lower()

    if not GROQ_KEY:
        for key, reply in FALLBACK.items():
            if key in msg_lower:
                return {"reply": reply}
        return {"reply": "I can help with recycling! Ask me about plastic, glass, paper, metal, cardboard, batteries, or any specific item."}

    try:
        client = GroqClient(api_key=GROQ_KEY)
        resp = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are EcoBot, an expert waste management and circular economy assistant. "
                        "Give detailed, friendly, step-by-step disposal instructions. "
                        "Always include: 1) Which bin to use, 2) How to prepare the item, 3) Why it matters for the environment. "
                        "Use emojis. Keep responses under 150 words. End with one eco-tip."
                    )
                },
                {"role": "user", "content": body.message}
            ],
            max_tokens=250,
        )
        return {"reply": resp.choices[0].message.content}
    except Exception as e:
        logger.error("Groq error: %s", e)
        for key, reply in FALLBACK.items():
            if key in msg_lower:
                return {"reply": reply}
        return {"reply": "Having trouble connecting to AI. Quick tip: when in doubt, rinse it out before recycling!"}


@app.get("/recycling-centers")
async def recycling_centers(lat: float, lon: float, radius: int = 5000):
    import urllib.request, urllib.parse
    query = (
        "[out:json][timeout:15];"
        "("
        f'node["amenity"="recycling"](around:{radius},{lat},{lon});'
        f'node["recycling_type"="centre"](around:{radius},{lat},{lon});'
        f'node["amenity"="waste_disposal"](around:{radius},{lat},{lon});'
        f'node["shop"="second_hand"](around:{radius},{lat},{lon});'
        f'node["shop"="charity"](around:{radius},{lat},{lon});'
        f'way["amenity"="recycling"](around:{radius},{lat},{lon});'
        ");"
        "out center body;"
    )
    url = "https://overpass-api.de/api/interpreter"
    data_enc = urllib.parse.urlencode({"data": query}).encode()
    try:
        req = urllib.request.Request(url, data=data_enc, method="POST",
                                     headers={"User-Agent": "EcoLabelVision/2.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            result = json.loads(r.read())
        centers = []
        for el in result.get("elements", []):
            tags = el.get("tags", {})
            elat = el.get("lat") or el.get("center", {}).get("lat")
            elon = el.get("lon") or el.get("center", {}).get("lon")
            if not elat or not elon:
                continue
            amenity = tags.get("amenity", "")
            shop    = tags.get("shop", "")
            if amenity == "waste_disposal":
                category, icon = "waste_disposal", "Waste Disposal"
            elif shop in ("second_hand", "charity"):
                category, icon = "reuse", "Reuse Shop"
            else:
                category, icon = "recycling", "Recycling"
            name  = tags.get("name") or tags.get("operator") or tags.get("brand") or icon
            types = [k.replace("recycling:", "") for k in tags if k.startswith("recycling:") and tags[k] == "yes"]
            centers.append({
                "id": el["id"], "lat": elat, "lon": elon,
                "name": name, "category": category, "icon": icon,
                "types": types[:6],
                "opening_hours": tags.get("opening_hours", ""),
                "phone": tags.get("phone", ""),
            })
        return {"centers": centers[:40]}
    except Exception as e:
        logger.error("Overpass error: %s", e)
        return {"centers": [], "error": str(e)}


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": classifier.model is not None, "groq": bool(GROQ_KEY)}


@app.get("/classes")
def get_classes():
    return {"classes": classifier.classes, "disposal_info": DISPOSAL_INFO}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
