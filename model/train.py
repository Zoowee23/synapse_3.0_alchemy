"""
Eco-Label Vision - MobileNetV3 Transfer Learning Training Script
Dataset: dataset/dataset-resized/{cardboard,glass,metal,paper,plastic,trash}
Trains in ~10-15 mins on CPU with 10 epochs
"""

import os
import sys
import time
import json
import shutil
import random
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, transforms, models
from torchvision.models import MobileNet_V3_Small_Weights

# ── Config ────────────────────────────────────────────────────────────────────
DATASET_DIR = Path("dataset/dataset-resized")
MODEL_DIR   = Path("model")
MODEL_PATH  = MODEL_DIR / "model.pth"
META_PATH   = MODEL_DIR / "model_meta.json"

IMG_SIZE    = 224
BATCH_SIZE  = 32
EPOCHS      = 10
LR          = 1e-3
FINE_TUNE_LR= 1e-4
VAL_SPLIT   = 0.15
SEED        = 42

random.seed(SEED)
torch.manual_seed(SEED)

# ── Data cleaning: verify images ──────────────────────────────────────────────
def verify_images(root: Path):
    from PIL import Image, UnidentifiedImageError
    removed = 0
    for img_path in root.rglob("*.jpg"):
        try:
            with Image.open(img_path) as img:
                img.verify()
        except (UnidentifiedImageError, Exception):
            print(f"  [REMOVE] corrupt: {img_path}")
            img_path.unlink()
            removed += 1
    print(f"  Cleaned {removed} corrupt images.")

# ── Split dataset into train/val ──────────────────────────────────────────────
def prepare_split(src: Path, dst: Path):
    """Create train/val split from flat class folders."""
    if (dst / "train").exists():
        print("  Split already exists, skipping.")
        return

    classes = [d.name for d in src.iterdir() if d.is_dir()]
    print(f"  Classes found: {classes}")

    for split in ("train", "val"):
        for cls in classes:
            (dst / split / cls).mkdir(parents=True, exist_ok=True)

    for cls in classes:
        imgs = list((src / cls).glob("*.jpg"))
        random.shuffle(imgs)
        n_val = max(1, int(len(imgs) * VAL_SPLIT))
        val_imgs   = imgs[:n_val]
        train_imgs = imgs[n_val:]
        for img in train_imgs:
            shutil.copy2(img, dst / "train" / cls / img.name)
        for img in val_imgs:
            shutil.copy2(img, dst / "val"   / cls / img.name)
        print(f"  {cls}: {len(train_imgs)} train / {len(val_imgs)} val")

# ── Transforms ────────────────────────────────────────────────────────────────
train_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(p=0.2),
    transforms.RandomRotation(20),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

val_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

# ── Weighted sampler for class imbalance ──────────────────────────────────────
def make_weighted_sampler(dataset):
    counts = [0] * len(dataset.classes)
    for _, label in dataset.samples:
        counts[label] += 1
    weights = [1.0 / counts[label] for _, label in dataset.samples]
    return WeightedRandomSampler(weights, len(weights))

# ── Build model ───────────────────────────────────────────────────────────────
def build_model(num_classes: int):
    model = models.mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.DEFAULT)
    # Freeze backbone
    for p in model.features.parameters():
        p.requires_grad = False
    # Replace classifier
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    return model

# ── Train one epoch ───────────────────────────────────────────────────────────
def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss, correct, total = 0.0, 0, 0
    for imgs, labels in loader:
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        out  = model(imgs)
        loss = criterion(out, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * imgs.size(0)
        correct    += (out.argmax(1) == labels).sum().item()
        total      += imgs.size(0)
    return total_loss / total, correct / total

# ── Evaluate ──────────────────────────────────────────────────────────────────
def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0.0, 0, 0
    with torch.no_grad():
        for imgs, labels in loader:
            imgs, labels = imgs.to(device), labels.to(device)
            out  = model(imgs)
            loss = criterion(out, labels)
            total_loss += loss.item() * imgs.size(0)
            correct    += (out.argmax(1) == labels).sum().item()
            total      += imgs.size(0)
    return total_loss / total, correct / total

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    t0 = time.time()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n{'='*60}")
    print(f"  Eco-Label Vision - Training")
    print(f"  Device : {device}")
    print(f"{'='*60}\n")

    # 1. Clean corrupt images
    print("[1/5] Verifying images...")
    verify_images(DATASET_DIR)

    # 2. Prepare split
    split_dir = MODEL_DIR / "split_data"
    print("[2/5] Preparing train/val split...")
    prepare_split(DATASET_DIR, split_dir)

    # 3. Datasets & loaders
    print("[3/5] Loading datasets...")
    train_ds = datasets.ImageFolder(split_dir / "train", transform=train_tf)
    val_ds   = datasets.ImageFolder(split_dir / "val",   transform=val_tf)
    classes  = train_ds.classes
    print(f"  Classes ({len(classes)}): {classes}")
    print(f"  Train: {len(train_ds)} | Val: {len(val_ds)}")

    sampler    = make_weighted_sampler(train_ds)
    train_dl   = DataLoader(train_ds, batch_size=BATCH_SIZE, sampler=sampler,
                            num_workers=0, pin_memory=False)
    val_dl     = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False,
                            num_workers=0, pin_memory=False)

    # 4. Model, loss, optimizer
    print("[4/5] Building model (MobileNetV3-Small)...")
    model     = build_model(len(classes)).to(device)
    criterion = nn.CrossEntropyLoss()

    # Phase 1: train classifier head only
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()), lr=LR
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    # 5. Training loop
    print(f"[5/5] Training for {EPOCHS} epochs...\n")
    best_val_acc = 0.0
    patience, no_improve = 3, 0

    for epoch in range(1, EPOCHS + 1):
        # Unfreeze last 2 feature blocks after epoch 5 (fine-tuning)
        if epoch == 6:
            print("  >> Unfreezing last 2 feature blocks for fine-tuning")
            for layer in list(model.features.children())[-2:]:
                for p in layer.parameters():
                    p.requires_grad = True
            optimizer = optim.Adam(
                filter(lambda p: p.requires_grad, model.parameters()),
                lr=FINE_TUNE_LR
            )
            scheduler = optim.lr_scheduler.CosineAnnealingLR(
                optimizer, T_max=EPOCHS - 5
            )

        t_ep = time.time()
        tr_loss, tr_acc = train_epoch(model, train_dl, criterion, optimizer, device)
        vl_loss, vl_acc = evaluate(model, val_dl, criterion, device)
        scheduler.step()

        elapsed = time.time() - t_ep
        print(f"  Epoch {epoch:02d}/{EPOCHS} | "
              f"Train Loss: {tr_loss:.4f} Acc: {tr_acc:.4f} | "
              f"Val Loss: {vl_loss:.4f} Acc: {vl_acc:.4f} | "
              f"Time: {elapsed:.1f}s")

        if vl_acc > best_val_acc:
            best_val_acc = vl_acc
            torch.save(model.state_dict(), MODEL_PATH)
            no_improve = 0
            print(f"    ✓ Saved best model (val_acc={vl_acc:.4f})")
        else:
            no_improve += 1
            if no_improve >= patience and epoch > 6:
                print(f"  Early stopping at epoch {epoch}")
                break

    total_time = time.time() - t0
    print(f"\n{'='*60}")
    print(f"  Training complete in {total_time/60:.1f} min")
    print(f"  Best Val Accuracy: {best_val_acc:.4f} ({best_val_acc*100:.1f}%)")
    print(f"  Model saved to: {MODEL_PATH}")
    print(f"{'='*60}\n")

    # Save metadata
    meta = {
        "classes": classes,
        "num_classes": len(classes),
        "img_size": IMG_SIZE,
        "best_val_acc": round(best_val_acc, 4),
        "architecture": "mobilenet_v3_small"
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  Metadata saved to: {META_PATH}")

if __name__ == "__main__":
    main()
