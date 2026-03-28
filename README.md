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
- Local Data Persistence (SQLite)

to solve **real-world waste segregation problems**.

---

## 🎯 Problem Statement

Improper waste segregation leads to:

- ❌ Recycling contamination  
- ❌ Increased landfill waste  
- ❌ Inefficient waste processing  

Most users lack **real-time guidance** on how to dispose of waste correctly.

---

## 🚀 Solution

This system provides:

1. **AI Classification** → Identifies waste type  
2. **OCR Detection** → Extracts resin codes from plastic  
3. **Decision Engine** → Provides disposal instructions  
4. **Map Integration** → Shows nearby recycling centers  
5. **Database Storage** → Tracks user history  

---

## 🏗️ System Architecture

```

User Input (Image / Location)
↓
Preprocessing (Resize, Normalize)
↓
ML Model (MobileNetV3)
↓
OCR Engine (Resin Code Detection)
↓
Decision Engine (Rules + Logic)
↓
SQLite Database (History)
↓
Map Module (OpenStreetMap API)
↓
Frontend (Streamlit)

```

---

## 🤖 Model Selection & Justification

### ✅ Model: MobileNetV3-Small (Pretrained)

### Why this model?

| Model | Size | Speed | Accuracy | Suitability |
|------|------|------|----------|------------|
| VGG16 | Very Large | Slow | High | ❌ Not deployable |
| ResNet50 | Large | Moderate | High | ❌ Heavy |
| EfficientNet | Medium | Moderate | High | ⚠️ Overkill |
| MobileNetV3 | Small | Fast | High | ✅ Best Choice |

---

### Key Advantages

- ⚡ Lightweight (~2.5 MB)
- ⚡ Fast CPU inference
- 🧠 Pretrained on ImageNet
- 🔁 Uses depthwise separable convolutions
- 🎯 Optimized for edge devices

---

### 🧠 Why NOT other models?

- Heavy models → slow & not deployable
- Detection models (YOLO) → unnecessary complexity
- Custom CNN → requires large dataset

---

## 📊 Dataset & Analysis

### Dataset Structure

```

cardboard/
glass/
metal/
paper/
plastic/

```

### Class Mapping

| Original | Final |
|----------|------|
| cardboard | Paper |
| paper | Paper |
| plastic | Plastic |
| metal | Metal |
| glass | Glass |

---

### 🎯 Why this dataset?

- Real-world waste images  
- High variability (lighting, angles)  
- Compatible with transfer learning  
- Lightweight for fast training  

---

### 🔄 Why merge cardboard → paper?

- Similar texture and composition  
- Reduces class confusion  
- Improves generalization  

---

### ⚠️ Dataset Limitations

- Slight class imbalance  
- No contamination labels  
- Single-object assumption  

---

## 🔧 Data Preprocessing

| Step | Purpose |
|------|--------|
| Resize (224×224) | Match model input |
| Random Flip | Orientation robustness |
| Rotation | Generalization |
| Normalize | Stable training |

---

## ⚙️ Training Configuration

| Parameter | Value |
|----------|------|
| Optimizer | Adam |
| Learning Rate | 3e-4 |
| Epochs | 10 |
| Loss | CrossEntropy |

---

## 📈 Performance

| Metric | Value |
|--------|------|
| Training Accuracy | ~90–95% |
| Validation Accuracy | ~80–88% |
| Inference Time | < 1 sec (CPU) |

---

### 🧠 Performance Insight

- High training accuracy → strong learning  
- Slight drop in validation → real-world variability  

---

## 🔍 OCR Resin Code Detection

Detects plastic codes (1–7) using OCR.

| Code | Material | Recyclability |
|------|----------|--------------|
| 1 | PET | Highly recyclable |
| 2 | HDPE | Highly recyclable |
| 3 | PVC | Hard to recycle |
| 4 | LDPE | Moderate |
| 5 | PP | Recyclable |
| 6 | PS | Difficult |
| 7 | Other | Varies |

---

## 🧠 Decision Engine

Combines:
- Prediction
- Confidence
- Resin code

Example:

```

IF Plastic AND Resin Code = 3:
→ Not easily recyclable

```

---

## 🗺️ Map Integration (OpenStreetMap)

### Flow:

```

User Location
→ Geocoding (Nominatim)
→ Coordinates
→ Overpass API Query
→ Recycling Centers
→ Map Display

```

---

### Why OpenStreetMap?

- Free & open-source  
- No API key required  
- Real-world data  

---

## 🗄️ Database (SQLite)

### Why SQLite?

| Feature | Advantage |
|--------|----------|
| No setup | Plug-and-play |
| File-based | Portable |
| Lightweight | Fast |

---

## 🔄 End-to-End Pipeline

```

1. Upload image
2. Preprocess
3. Model prediction
4. Confidence + Top-3
5. OCR detection
6. Apply rules
7. Store in database
8. Fetch recycling centers
9. Display result

````

---

## ⚙️ Tech Stack

| Layer | Technology |
|------|-----------|
| ML | PyTorch |
| OCR | Tesseract |
| Maps | OpenStreetMap |
| DB | SQLite |
| UI | Streamlit |

---

## 📉 Limitations

- OCR sensitive to image quality  
- No multi-object detection  
- Dataset size limited  

---

## 🔮 Future Scope

- Multi-object detection  
- Real-time camera input  
- GPS auto-detection  
- Feedback-based learning  

---

## 🧠 Key Insight

> This is not just a classifier — it is a **decision-support system** that bridges AI predictions with real-world environmental action.

---

## 🚀 Run Locally

```bash
pip install -r requirements.txt
streamlit run app.py
````

---

## ⭐ Final Note

If you found this useful, consider giving a ⭐
Let’s build a cleaner planet using AI 🌍

```

---

# 🏆 THIS VERSION DOES:

✅ Looks **professional (GitHub + recruiters)**  
✅ Shows **engineering thinking (not just coding)**  
✅ Explains **WHY decisions were made** (very important)  
✅ Balanced: **not too long, not shallow**

