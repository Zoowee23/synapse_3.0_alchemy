# Eco-Label Vision — AI-Powered Smart Bin Assistant

## Quick Start

### 1. Train the Model (10-15 min)
```bash
pip install torch torchvision pillow
python model/train.py
```
Outputs: `model/model.pth` and `model/model_meta.json`

### 2. Start Backend
```bash
pip install -r backend/requirements.txt
python backend/main.py
# API runs at http://localhost:8000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
# UI runs at http://localhost:3000
```

### 4. MongoDB (optional)
```bash
# Install MongoDB Community or use Atlas
# Default: mongodb://localhost:27017
# Set MONGO_URL env var to override
```

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /predict | Upload image file |
| POST | /predict/base64 | Base64 image (webcam) |
| GET | /history/{user_id} | Prediction history |
| GET | /stats/{user_id} | User stats + badges |
| GET | /municipality/dashboard | City-wide analytics |
| GET | /classes | Model classes + disposal info |
| GET | /health | Health check |

## Architecture
```
project/
  model/
    train.py          ← MobileNetV3 transfer learning
    model.pth         ← trained weights (after training)
    model_meta.json   ← class names + metadata
  backend/
    main.py           ← FastAPI server
    requirements.txt
  frontend/
    src/
      pages/          ← Scanner, Dashboard, Municipality
      components/     ← ResultCard, CompareView
  database/
    schema.js         ← MongoDB schema reference
  dataset/
    dataset-resized/  ← 6 classes: cardboard, glass, metal, paper, plastic, trash
```

## Classes
- cardboard, glass, metal, paper, plastic, trash

## Features
- Upload image or webcam (real-time)
- Top-3 predictions with confidence bars
- Recyclable/Non-Recyclable badge
- Disposal instructions per category
- Carbon saved calculator
- Gamification badges (Beginner → Zero Waste Hero)
- Compare two images side-by-side
- Voice output (Web Speech API)
- User dashboard with charts
- Municipality admin dashboard
- MongoDB prediction history
