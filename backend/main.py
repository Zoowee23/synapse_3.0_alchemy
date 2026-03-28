"""
Eco-Label Vision - FastAPI Backend
Auth (JWT) + SQLite + Groq Chatbot + Recycling Centers
"""
import io, json, base64, logging, sqlite3, os, hashlib, secrets
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

# ── optional groq ─────────────────────────────────────────────────────────────
try:
    from groq import Groq as GroqClient
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eco-label")

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_PATH  = Path("../model/model.pth")
META_PATH   = Path("../model/model_meta.json")
DB_PATH     = Path("ecolabel.db")
SECRET_KEY  = os.getenv("SECRET_KEY", "eco-label-super-secret-2024-change-in-prod")
GROQ_KEY    = os.getenv("GROQ_API_KEY", "")
TOKEN_EXPIRE_HOURS = 24 * 7   # 7 days

# ── Disposal info ─────────────────────────────────────────────────────────────
DISPOSAL_INFO = {
    "plastic":   {"recyclable":True,  "bin":"Blue Recycling Bin",      "instructions":["Rinse before disposal","Remove caps separately","Flatten bottles","Check resin code 1-7"],"carbon_saved":0.08,"color":"#3B82F6","overlay":"Wash & flatten this plastic before the Blue Bin ♻️"},
    "paper":     {"recyclable":True,  "bin":"Blue Recycling Bin",      "instructions":["Keep dry and clean","Remove plastic wrapping","Flatten boxes","Greasy pizza boxes → general waste"],"carbon_saved":0.05,"color":"#F59E0B","overlay":"Keep it dry! Fold and place in the Blue Bin 📄"},
    "cardboard": {"recyclable":True,  "bin":"Blue Recycling Bin",      "instructions":["Break down flat","Remove tape if possible","Keep dry"],"carbon_saved":0.06,"color":"#D97706","overlay":"Break it flat and pop it in the Blue Bin 📦"},
    "metal":     {"recyclable":True,  "bin":"Blue Recycling Bin",      "instructions":["Rinse cans","Crush to save space","Clean foil is recyclable","Remove food residue"],"carbon_saved":0.12,"color":"#6B7280","overlay":"Rinse it out, crush it, Blue Bin! 🥫"},
    "glass":     {"recyclable":True,  "bin":"Green Glass Bank",        "instructions":["Rinse bottles","Remove metal lids","No ceramics or Pyrex","Sort by colour locally"],"carbon_saved":0.07,"color":"#10B981","overlay":"Rinse and drop in the Green Glass Bank 🍶"},
    "trash":     {"recyclable":False, "bin":"General Waste (Black Bin)","instructions":["Cannot be recycled","Dispose in general waste","Consider reuse first","Check hazardous waste rules"],"carbon_saved":0.0,"color":"#EF4444","overlay":"This goes in the Black Bin 🗑️ — consider reducing waste!"},
}

BADGES = [
    {"id":"seedling",   "name":"Seedling",        "threshold":1,   "icon":"🌱","xp":10},
    {"id":"beginner",   "name":"Beginner Recycler","threshold":10,  "icon":"♻️","xp":50},
    {"id":"warrior",    "name":"Eco Warrior",      "threshold":25,  "icon":"⚔️","xp":100},
    {"id":"champion",   "name":"Recycling Champion","threshold":50, "icon":"🏆","xp":200},
    {"id":"guardian",   "name":"Earth Guardian",   "threshold":100, "icon":"🌍","xp":500},
    {"id":"zero_waste", "name":"Zero Waste Hero",  "threshold":200, "icon":"✨","xp":1000},
]

# ── SQLite ────────────────────────────────────────────────────────────────────
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS users (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT UNIQUE NOT NULL,
            email      TEXT UNIQUE NOT NULL,
            password   TEXT NOT NULL,
            role       TEXT NOT NULL DEFAULT 'user',
            xp         INTEGER NOT NULL DEFAULT 0,
            coins      INTEGER NOT NULL DEFAULT 0,
            streak     INTEGER NOT NULL DEFAULT 0,
            last_scan  TEXT,
            created_at TEXT NOT NULL
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS predictions (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id      INTEGER NOT NULL,
            prediction   TEXT NOT NULL,
            confidence   REAL NOT NULL,
            top3         TEXT NOT NULL,
            recyclable   INTEGER NOT NULL,
            carbon_saved REAL NOT NULL DEFAULT 0,
            timestamp    TEXT NOT NULL
        )""")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_pred_user ON predictions(user_id, timestamp)")
        conn.commit()
    logger.info(f"SQLite DB ready: {DB_PATH.resolve()}")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

# ── Auth helpers ──────────────────────────────────────────────────────────────
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

# ── Gamification helpers ──────────────────────────────────────────────────────
def update_gamification(user_id: int, recyclable: bool):
    """Award XP, coins, update streak. Returns delta info."""
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        u = conn.execute("SELECT xp, coins, streak, last_scan FROM users WHERE id=?", (user_id,)).fetchone()
        if not u:
            return {}
        xp_gain    = 15 if recyclable else 2
        coin_gain  = 10 if recyclable else 0
        # streak: if last scan was today keep/increment, else reset
        streak = u["streak"]
        last   = u["last_scan"]
        today  = datetime.now(timezone.utc).date().isoformat()
        if last:
            last_date = last[:10]
            if last_date == today:
                pass  # same day, no streak change
            elif (datetime.now(timezone.utc).date() - datetime.fromisoformat(last_date).date()).days == 1:
                streak += 1
                xp_gain += streak * 2  # streak bonus
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
    # check badge unlocks
    total_scans = 0
    with get_db() as conn:
        row = conn.execute("SELECT COUNT(*) as n FROM predictions WHERE user_id=?", (user_id,)).fetchone()
        total_scans = row["n"]
    new_badges = [b for b in BADGES if total_scans == b["threshold"]]
    return {"xp_gained": xp_gain, "coins_gained": coin_gain, "streak": streak, "new_badges": new_badges, "total_xp": new_xp, "total_coins": new_coins}

# ── ML Model ──────────────────────────────────────────────────────────────────
class WasteClassifier:
    def __init__(self):
        self.model = None; self.classes = []
        self.transform = transforms.Compose([
            transforms.Resize((224,224)), transforms.ToTensor(),
            transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
        ])
    def load(self):
        if not META_PATH.exists(): raise FileNotFoundError(f"No metadata at {META_PATH}")
        with open(META_PATH) as f: meta = json.load(f)
        self.classes = meta["classes"]
        net = models.mobilenet_v3_small(weights=None)
        net.classifier[3] = nn.Linear(net.classifier[3].in_features, meta["num_classes"])
        if not MODEL_PATH.exists(): raise FileNotFoundError(f"No weights at {MODEL_PATH}")
        net.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
        net.eval(); self.model = net
        logger.info(f"Model loaded: {self.classes}")
    def predict(self, image):
        t = self.transform(image.convert("RGB")).unsqueeze(0)
        with torch.no_grad():
            probs = F.softmax(self.model(t), dim=1)[0]
        idx  = probs.topk(min(3,len(self.classes))).indices.tolist()
        top3 = [{"label":self.classes[i],"confidence":round(probs[i].item(),4)} for i in idx]
        return self.classes[probs.argmax().item()], round(probs.max().item(),4), top3

classifier = WasteClassifier()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try: classifier.load()
    except FileNotFoundError as e: logger.warning(str(e))
    yield

app = FastAPI(title="Eco-Label Vision API", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Pydantic models ───────────────────────────────────────────────────────────
class SignupBody(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"   # "user" | "municipality"

class LoginBody(BaseModel):
    email: str
    password: str

class ChatBody(BaseModel):
    message: str

# ── Auth routes ───────────────────────────────────────────────────────────────
@app.post("/auth/signup")
def signup(body: SignupBody):
    if body.role not in ("user", "municipality"):
        raise HTTPException(400, "Role must be 'user' or 'municipality'")
    hashed = hash_password(body.password)
    now    = datetime.now(timezone.utc).isoformat()
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
    return {"token": token, "user": {k: user[k] for k in ("id","username","email","role","xp","coins","streak")}}

@app.get("/auth/me")
def me(user=Depends(get_current_user)):
    return {k: user[k] for k in ("id","username","email","role","xp","coins","streak")}

# ── Predict ───────────────────────────────────────────────────────────────────
def _build_result(pred, conf, top3):
    info = DISPOSAL_INFO.get(pred, DISPOSAL_INFO["trash"])
    return {**info, "prediction": pred, "confidence": conf, "top3": top3}

@app.post("/predict")
async def predict(file: UploadFile = File(...), user=Depends(get_current_user)):
    if classifier.model is None: raise HTTPException(503, "Model not loaded")
    try: image = Image.open(io.BytesIO(await file.read()))
    except: raise HTTPException(400, "Invalid image")
    pred, conf, top3 = classifier.predict(image)
    result = _build_result(pred, conf, top3)
    ts = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO predictions (user_id,prediction,confidence,top3,recyclable,carbon_saved,timestamp) VALUES (?,?,?,?,?,?,?)",
            (user["id"], pred, conf, json.dumps(top3), int(result["recyclable"]), result["carbon_saved"], ts)
        )
    gamification = update_gamification(user["id"], result["recyclable"])
    result["gamification"] = gamification
    return result

@app.post("/predict/base64")
async def predict_b64(payload: dict, user=Depends(get_current_user)):
    if classifier.model is None: raise HTTPException(503, "Model not loaded")
    try:
        b64 = payload.get("image","")
        if "," in b64: b64 = b64.split(",",1)[1]
        image = Image.open(io.BytesIO(base64.b64decode(b64)))
    except: raise HTTPException(400, "Invalid base64 image")
    pred, conf, top3 = classifier.predict(image)
    result = _build_result(pred, conf, top3)
    ts = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO predictions (user_id,prediction,confidence,top3,recyclable,carbon_saved,timestamp) VALUES (?,?,?,?,?,?,?)",
            (user["id"], pred, conf, json.dumps(top3), int(result["recyclable"]), result["carbon_saved"], ts)
        )
    gamification = update_gamification(user["id"], result["recyclable"])
    result["gamification"] = gamification
    return result

# ── History & Stats ───────────────────────────────────────────────────────────
@app.get("/history")
def get_history(limit: int = 50, user=Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT prediction,confidence,top3,recyclable,carbon_saved,timestamp FROM predictions WHERE user_id=? ORDER BY timestamp DESC LIMIT ?",
            (user["id"], limit)
        ).fetchall()
    return {"history": [{"prediction":r["prediction"],"confidence":r["confidence"],"top3":json.loads(r["top3"]),"recyclable":bool(r["recyclable"]),"carbon_saved":r["carbon_saved"],"timestamp":r["timestamp"]} for r in rows]}

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
    return {"total":total,"carbon_saved":carbon,"recyclable_count":rec,"badges":badges,"next_badge":next_b,"xp":u["xp"],"coins":u["coins"],"streak":u["streak"]}

# ── Municipality ──────────────────────────────────────────────────────────────
@app.get("/municipality/dashboard")
def muni_dashboard(user=Depends(require_municipality)):
    with get_db() as conn:
        rows  = conn.execute("SELECT prediction,COUNT(*) as count,SUM(carbon_saved) as carbon FROM predictions GROUP BY prediction").fetchall()
        total = conn.execute("SELECT COUNT(*) as n FROM predictions").fetchone()["n"]
        rec   = conn.execute("SELECT COUNT(*) as n FROM predictions WHERE recyclable=1").fetchone()["n"]
        users = conn.execute("SELECT COUNT(*) as n FROM users").fetchone()["n"]
        top_users = conn.execute(
            "SELECT u.username, COUNT(p.id) as scans, SUM(p.carbon_saved) as carbon FROM predictions p JOIN users u ON p.user_id=u.id GROUP BY p.user_id ORDER BY scans DESC LIMIT 5"
        ).fetchall()
    by_cat = [{"_id":r["prediction"],"count":r["count"],"carbon_saved":r["carbon"] or 0} for r in rows]
    return {
        "total_classified": total,
        "recycling_rate":   round(rec/total*100,1) if total else 0,
        "carbon_saved":     sum(c["carbon_saved"] for c in by_cat),
        "by_category":      by_cat,
        "total_users":      users,
        "top_users":        [{"username":r["username"],"scans":r["scans"],"carbon":round(r["carbon"] or 0,2)} for r in top_users],
    }

# ── Groq Chatbot ──────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(body: ChatBody, user=Depends(get_current_user)):
    if not GROQ_KEY:
        # fallback rule-based
        msg = body.message.lower()
        if "plastic" in msg:   return {"reply": "Plastic should be rinsed and placed in the Blue Recycling Bin. Check the resin code (1-7) on the bottom. ♻️"}
        if "glass"   in msg:   return {"reply": "Glass bottles and jars go in the Green Glass Bank. Rinse them first and remove metal lids. 🍶"}
        if "paper"   in msg:   return {"reply": "Paper goes in the Blue Recycling Bin. Keep it dry — wet or greasy paper (like pizza boxes) goes in general waste. 📄"}
        if "metal"   in msg:   return {"reply": "Metal cans go in the Blue Recycling Bin. Rinse them out and crush to save space. 🥫"}
        if "battery" in msg:   return {"reply": "Batteries are hazardous! Take them to a dedicated battery recycling point — never put in regular bins. 🔋"}
        if "pizza"   in msg:   return {"reply": "Greasy pizza boxes cannot be recycled — the grease contaminates paper recycling. Put them in general waste. 🍕"}
        return {"reply": "I can help with recycling questions! Ask me about plastic, glass, paper, metal, batteries, or any specific item. ♻️"}
    try:
        client = GroqClient(api_key=GROQ_KEY)
        resp = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role":"system","content":"You are EcoBot, an expert waste management and recycling assistant. Give concise, friendly, actionable advice. Use emojis. Always end with a recycling tip."},
                {"role":"user","content": body.message}
            ],
            max_tokens=300,
        )
        return {"reply": resp.choices[0].message.content}
    except Exception as e:
        logger.error(f"Groq error: {e}")
        return {"reply": "I'm having trouble connecting right now. Quick tip: when in doubt, rinse it out before recycling! ♻️"}

# ── Recycling centers (OpenStreetMap Overpass) ────────────────────────────────
@app.get("/recycling-centers")
async def recycling_centers(lat: float, lon: float, radius: int = 2000):
    """Proxy Overpass API for recycling nodes near lat/lon."""
    import urllib.request, urllib.parse
    query = f"""
    [out:json][timeout:10];
    (
      node["amenity"="recycling"](around:{radius},{lat},{lon});
      node["recycling_type"="centre"](around:{radius},{lat},{lon});
    );
    out body;
    """
    url = "https://overpass-api.de/api/interpreter"
    data = urllib.parse.urlencode({"data": query}).encode()
    try:
        req = urllib.request.Request(url, data=data, method="POST")
        with urllib.request.urlopen(req, timeout=12) as r:
            result = json.loads(r.read())
        centers = []
        for el in result.get("elements", []):
            tags = el.get("tags", {})
            centers.append({
                "id":   el["id"],
                "lat":  el["lat"],
                "lon":  el["lon"],
                "name": tags.get("name", tags.get("operator", "Recycling Point")),
                "types": [k.replace("recycling:","") for k in tags if k.startswith("recycling:") and tags[k]=="yes"],
            })
        return {"centers": centers}
    except Exception as e:
        logger.error(f"Overpass error: {e}")
        return {"centers": [], "error": "Could not fetch recycling centers"}

@app.get("/health")
def health():
    return {"status":"ok","model_loaded":classifier.model is not None,"groq":bool(GROQ_KEY)}

@app.get("/classes")
def get_classes():
    return {"classes": classifier.classes, "disposal_info": DISPOSAL_INFO}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
