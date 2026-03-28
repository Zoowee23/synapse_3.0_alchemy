### *AI-Powered Circular Economy Smart Bin Assistant*

> **Snap. Classify. Guide. Reward. Transform Waste into Value.**

---
Demo video: [https://drive.google.com/file/d/1avAfkswomB18eekNRs_U0MVZjwX3i95i/view?usp=sharing](https://drive.google.com/file/d/1avAfkswomB18eekNRs_U0MVZjwX3i95i/view?usp=sharing) 

## 📌 Project Overview

**Eco-Label Vision** is a **full-stack AI-powered waste intelligence platform** designed to tackle the global problem of *improper waste disposal and wish-cycling*.

It combines:

* 🤖 Computer Vision (Real-time Waste Classification)
* 🔍 OCR (Plastic Resin Code Detection)
* 🧠 Rule-Based Decision Engine
* 🗺️ Geospatial Mapping (Recycling Centers)
* 🎮 Gamification (XP, Coins, Badges, Games)
* 💬 AI Chatbot (Sustainability Guidance)
* 📊 Analytics Dashboards (User + Municipality)

---

## 🎯 Problem Statement

### ❗ The Core Issue: *Wish-Cycling*

People often:

* ❌ Throw non-recyclables into recycling bins
* ❌ Lack awareness of disposal rules
* ❌ Don’t see impact of their actions

### 🚫 Consequences:

* Recycling contamination
* Increased landfill overflow
* Inefficient municipal systems

---

## 💡 Solution

Eco-Label Vision acts as a **Smart Waste Assistant**:

```
Image Input → AI Classification → OCR → Decision Engine → Guidance + Rewards + Tracking
```

### Key Outcomes:

* ✅ Correct disposal guidance
* ✅ Behavioral change through gamification
* ✅ Real-time environmental impact tracking
* ✅ Data-driven municipal insights

---

## 🌍 Circular Economy Mapping

| Feature                | Circular Economy Role |
| ---------------------- | --------------------- |
| AI Classification      | Waste Identification  |
| Disposal Guidance      | Proper Segregation    |
| Carbon Counter         | Impact Awareness      |
| Recycling Finder       | Resource Loop Closure |
| Gamification           | Behavior Change       |
| Municipality Dashboard | System Optimization   |

---

## 🚀 Core Features

---

### 🤖 AI Waste Classification (Scanner System)

* Upload / Webcam / Live Mode scanning
* MobileNetV3-based classification
* Top-3 predictions with confidence
* Voice feedback (Web Speech API)

#### Output:

* Waste category
* Recyclability status
* Disposal instructions
* CO₂ savings

---

### 🔍 OCR Resin Code Detection

* Triggered for plastic items
* Extracts resin codes (1–7) using EasyOCR
* Maps recyclability:

| Code | Type              | Recyclability     |
| ---- | ----------------- | ----------------- |
| 1–2  | PET, HDPE         | Highly recyclable |
| 3–6  | PVC, LDPE, PP, PS | Limited           |
| 7    | Other             | Variable          |

---

### 🧠 Decision Engine

Combines:

* AI prediction
* Confidence score
* OCR output
* Carbon mapping

→ Produces final **disposal recommendation**

---

### 🌱 Carbon Impact Tracker

| Waste Type | CO₂ Saved |
| ---------- | --------- |
| Plastic    | 0.08 kg   |
| Paper      | 0.05 kg   |
| Cardboard  | 0.06 kg   |
| Metal      | 0.12 kg   |
| Glass      | 0.07 kg   |

#### Flow:

```
Prediction → Carbon Mapping → Accumulate → Display Impact
```

---

### 🎮 Gamification System

#### Rewards:

* +15 XP (recyclable)
* +2 XP (non-recyclable)
* Coins + streak bonuses

#### Levels:

```
Level = XP / 100
```

#### Badges:

* 🌱 Seedling
* ♻️ Beginner Recycler
* ⚡ Eco Warrior
* 🏆 Recycling Champion
* 🌍 Earth Guardian
* 💎 Zero Waste Hero

---

### 🧩 Interactive Games

#### 1. Bin Guessing Game

* Guess correct bin for items
* AI-assisted validation
* Confetti rewards

#### 2. Waste Catcher Game

* Real-time reflex game
* Falling waste → correct bin
* Combo system + increasing difficulty

---

### 💬 AI Chatbot (Groq Integration)

* Real-time waste guidance
* Step-by-step disposal instructions
* Eco tips for sustainability
* Fallback rule-based system

---

### 🗺️ Recycling Center Finder

* OpenStreetMap + Overpass API
* Features:

  * Location search / GPS
  * Nearby recycling centers
  * Category filters
  * Directions

---

### 👤 User Dashboard

* Total scans
* CO₂ saved
* XP, coins, streak
* Badge progress
* Charts:

  * Pie (waste type)
  * Bar (recyclable vs non)
  * Line (carbon trend)
  * Heatmap (activity)

---

### 🏙️ Municipality Dashboard

* City-wide analytics
* Recycling rate
* Waste distribution
* Top recyclers leaderboard
* Full user insights

---

### 🔐 Authentication System

* JWT-based authentication
* Roles:

  * User (citizen)
  * Municipality (admin)
* Secure password hashing
* Protected routes

---

## 🏗️ System Architecture

<img width="2732" height="6236" alt="image" src="https://github.com/user-attachments/assets/14dd058b-ff4a-434f-8f82-c391e4b49a0f" />


---

## 🤖 AI Model Details

### Model: MobileNetV3-Small

* Pretrained on ImageNet
* Fine-tuned for 6 classes

### Training Strategy:

* Epochs: 10
* Phase 1: Train classifier
* Phase 2: Fine-tune last layers

### Dataset:

* 2,527 images
* 6 categories

### Performance:

* Accuracy: 89.93%
* Inference: < 1 sec

---

## ⚙️ Tech Stack

### Frontend

* React 18 + Vite
* Tailwind CSS
* Framer Motion
* Recharts

### Backend

* FastAPI
* SQLite
* JWT Authentication

### AI/ML

* PyTorch
* MobileNetV3

### Others

* EasyOCR
* OpenStreetMap APIs
* Groq AI

---

## 🔌 API Reference

### Auth

* `POST /auth/signup`
* `POST /auth/login`
* `GET /auth/me`

### Prediction

* `POST /predict`
* `POST /predict/base64`

### Data

* `GET /history`
* `GET /stats`

### Municipality

* `GET /municipality/dashboard`
* `GET /municipality/users`

### Other

* `POST /chat`
* `GET /recycling-centers`
* `GET /health`



## 📸 Screenshots

![WhatsApp Image 2026-03-28 at 2 48 00 PM](https://github.com/user-attachments/assets/160b655b-0cb2-4f60-b0d7-2334d141be86)
![WhatsApp Image 2026-03-28 at 2 48 45 PM](https://github.com/user-attachments/assets/89c95a68-bf8a-4701-88ae-d86a39a4d5a1)
![WhatsApp Image 2026-03-28 at 2 50 16 PM](https://github.com/user-attachments/assets/a84bce9b-ef1b-4df5-9c9d-6027c26d25f4)

![WhatsApp Image 2026-03-28 at 2 50 44 PM](https://github.com/user-attachments/assets/072ef175-b387-4a16-a60c-155c034e94b2)

![WhatsApp Image 2026-03-28 at 2 51 07 PM](https://github.com/user-attachments/assets/48a30018-25ec-4c34-9526-9edcc6226561)
![WhatsApp Image 2026-03-28 at 2 52 18 PM](https://github.com/user-attachments/assets/be6e0645-34cf-46e7-8e35-4fac19c9749f)

![WhatsApp Image 2026-03-28 at 2 52 41 PM](https://github.com/user-attachments/assets/d4a51830-775a-4f05-b8fa-c18a58e5044b)
![WhatsApp Image 2026-03-28 at 2 52 57 PM](https://github.com/user-attachments/assets/068e6c06-c8e3-4f68-9ea4-ef8b6645f93d)

---

## 🔮 Future Scope

* Multi-object detection
* IoT Smart Bin integration
* GPS auto-detection
* Feedback-based learning
* Mobile App (Flutter)

---

