<div align="center">

# 🌿 Eco Waste Classifier

### *AI-Powered Waste Intelligence for a Sustainable Future*

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](https://streamlit.io)
[![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)](https://openstreetmap.org)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)

> **Snap. Classify. Recycle. Repeat.**

</div>

---

## 📌 Overview

Eco Waste Classifier is a **multi-layer intelligent system** that combines:

- Deep Learning (Image Classification)
- OCR (Resin Code Detection)
- Rule-Based Decision Systems
- Geospatial Mapping (Recycling Centers)
- Sustainability Tracking (Carbon Counter)
- Gamification (Eco Badges)
- Local Data Persistence (SQLite)

---

## 🎯 Problem Statement

Improper waste segregation leads to:

- ❌ Recycling contamination  
- ❌ Increased landfill waste  
- ❌ Low environmental awareness  

There is **no unified system** that provides:
- Real-time classification  
- Disposal guidance  
- Environmental impact tracking  
- Municipality-level integration  

---

## 🚀 Solution

The system acts as an **AI Waste Assistant**:

1. 🤖 Classifies waste using deep learning  
2. 🔍 Detects resin codes using OCR  
3. ♻️ Provides disposal instructions  
4. 🗺️ Suggests nearby recycling centers  
5. 🌱 Tracks carbon savings  
6. 🏅 Rewards users with eco badges  
7. 🏙️ Bridges users with municipal waste systems  

---

## 🏗️ System Architecture

```

User / Municipality Interface
↓
Preprocessing Layer
↓
ML Model (MobileNetV3)
↓
OCR Engine (Resin Code)
↓
Decision Engine
(Rules + Carbon + Badges)
↓
SQLite Database
↓
Map Module (OSM API)
↓
Streamlit Frontend

```

---

## 👥 Dual Interface Design

### 👤 User Interface

- Upload / capture waste image  
- Get classification + disposal guidance  
- View carbon savings  
- Earn eco badges  
- Track personal history  

---

### 🏙️ Municipality Interface

- View aggregated waste trends  
- Identify recycling patterns  
- Analyze waste category distribution  
- Plan better waste management strategies  

---

### 🎯 Why This Matters

| User Side | Municipality Side |
|----------|-----------------|
| Awareness | Policy planning |
| Behavior change | Resource allocation |
| Eco participation | Smart city integration |

---

## 🤖 Model Selection & Justification

### Model: MobileNetV3-Small

| Model | Size | Speed | Suitability |
|------|------|------|------------|
| VGG16 | Very Large | Slow | ❌ |
| ResNet50 | Large | Moderate | ❌ |
| EfficientNet | Medium | Moderate | ⚠️ |
| MobileNetV3 | Small | Fast | ✅ |

---

### Why MobileNetV3?

- Lightweight (~2.5 MB)
- Fast CPU inference
- Pretrained (ImageNet)
- Optimized for real-time systems

---

## 📊 Dataset

```

cardboard → Paper
paper → Paper
plastic → Plastic
metal → Metal
glass → Glass

```

### Why this dataset?

- Real-world waste representation  
- High variability  
- Works well with transfer learning  

---

## 🔧 Preprocessing

- Resize (224×224)
- Flip, Rotation
- Normalize

---

## 📈 Performance

| Metric | Value |
|--------|------|
| Accuracy | ~80–88% |
| Inference | < 1 sec |

---

## 🔍 OCR Resin Code Detection

Detects plastic types:

| Code | Meaning |
|------|--------|
| 1–2 | Highly recyclable |
| 3–6 | Limited recycling |
| 7 | Variable |

---

## 🌱 Carbon Counter System

### 🎯 Purpose
Quantify environmental impact of correct waste disposal.

---

### 📊 Carbon Mapping

| Waste Type | CO₂ Saved |
|------------|----------|
| Plastic | 0.05 kg |
| Paper | 0.03 kg |
| Metal | 0.08 kg |
| Glass | 0.04 kg |

---

### ⚙️ Working

```

Prediction → Carbon Mapping → Accumulate → Display Total Impact

```

---

### 🧠 Insight

> Encourages behavior change through measurable impact.

---

## 🏅 Gamification: Eco Badge System

### 🎯 Goal
Increase user engagement and habit formation.

---

### Badge Levels

| Score | Badge |
|------|------|
| 0–5 | Beginner |
| 5–15 | Eco Warrior |
| 15+ | Planet Saver |

---

### Logic

```

Each classification → +1 score
Score → Badge level

```

---

### 🧠 Impact

- Motivates users  
- Encourages consistent usage  
- Builds environmental awareness  

---

## 🧠 Decision Engine

Combines:
- Model prediction
- Confidence score
- OCR result
- Carbon mapping

---

## 🗺️ Map Integration (OpenStreetMap)

```

User Location
→ Geocoding
→ Recycling Centers
→ Map Display

```

---

## 🗄️ Database (SQLite)

Stores:
- Predictions
- Confidence
- Resin codes
- Carbon saved
- Timestamp

---

## 🔄 Pipeline

```

Upload Image
→ Preprocess
→ Predict
→ OCR
→ Apply Rules
→ Calculate Carbon
→ Assign Badge
→ Store Data
→ Show Map

````

---

## ⚙️ Tech Stack

- PyTorch (ML)
- Tesseract (OCR)
- OpenStreetMap (Maps)
- SQLite (DB)
- Streamlit (UI)

---

## 📉 Limitations

- OCR sensitive to blur  
- No multi-object detection  
- Limited dataset  

---

## 🔮 Future Scope

- Multi-object detection  
- GPS auto-location  
- IoT smart bins  
- Feedback learning  

---

## 🧠 Key Insight

> This system goes beyond classification — it integrates AI with sustainability, behavior change, and smart city planning.

---

## 🚀 Run Locally

```bash
pip install -r requirements.txt
streamlit run app.py
````

---

## ⭐ Final Thought

Small actions, when multiplied by millions, create massive impact.

Let AI guide better choices 🌍

```

---

# 🏆 WHY THIS VERSION IS STRONG

This now shows:

✅ **AI + Systems Thinking**  
✅ **User + Government perspective**  
✅ **Impact + Engagement (carbon + badges)**  
✅ **Not just ML → product mindset**

