"""
Standalone training script for OraLens AI (EfficientNet-B0 + CBAM).

Expected dataset layout:
    dataset/
    ├── train/
    │   ├── Healthy/
    │   ├── OPMD/
    │   └── OralCancer/
    ├── val/
    │   ├── Healthy/
    │   ├── OPMD/
    │   └── OralCancer/
    └── test/
        ├── Healthy/
        ├── OPMD/
        └── OralCancer/
"""

from __future__ import annotations

import os
from pathlib import Path
from PIL import ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from model.model_loader import CLASS_NAMES, WEIGHTS_PATH, build_model
from pipeline.preprocessor import IMAGENET_MEAN, IMAGENET_STD, TARGET_SIZE

DATASET_DIR = Path("dataset")
TRAIN_DIR = DATASET_DIR / "train"
VAL_DIR = DATASET_DIR / "val"
TEST_DIR = DATASET_DIR / "test"
WEIGHTS_DIR = WEIGHTS_PATH.parent

DATASET_CLASS_FOLDERS = ["Healthy", "OPMD", "OralCancer"]

BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 0.0005


def _apply_clahe_and_normalize(image: np.ndarray) -> np.ndarray:
    """Match inference preprocessing for a single RGB image array."""
    import cv2

    rgb_image = image.astype(np.uint8)
    lab_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab_image)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)

    lab_image = cv2.merge((l_channel, a_channel, b_channel))
    rgb_image = cv2.cvtColor(lab_image, cv2.COLOR_LAB2RGB)
    resized = cv2.resize(rgb_image, TARGET_SIZE, interpolation=cv2.INTER_LINEAR)

    normalized = resized.astype(np.float32) / 255.0
    return (normalized - IMAGENET_MEAN) / IMAGENET_STD


def _create_generators() -> tuple:
    train_datagen = ImageDataGenerator(
        rotation_range=30,
        horizontal_flip=True,
        vertical_flip=True,
        zoom_range=0.15,
        brightness_range=[0.8, 1.2],
        preprocessing_function=_apply_clahe_and_normalize,
    )
    eval_datagen = ImageDataGenerator(preprocessing_function=_apply_clahe_and_normalize)

    train_generator = train_datagen.flow_from_directory(
        str(TRAIN_DIR),
        target_size=TARGET_SIZE,
        class_mode="categorical",
        classes=DATASET_CLASS_FOLDERS,
        batch_size=BATCH_SIZE,
        shuffle=True,
    )
    val_generator = eval_datagen.flow_from_directory(
        str(VAL_DIR),
        target_size=TARGET_SIZE,
        class_mode="categorical",
        classes=DATASET_CLASS_FOLDERS,
        batch_size=BATCH_SIZE,
        shuffle=False,
    )
    test_generator = eval_datagen.flow_from_directory(
        str(TEST_DIR),
        target_size=TARGET_SIZE,
        class_mode="categorical",
        classes=DATASET_CLASS_FOLDERS,
        batch_size=BATCH_SIZE,
        shuffle=False,
    )
    return train_generator, val_generator, test_generator


def _plot_training_curves(history: tf.keras.callbacks.History, output_path: Path) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))

    axes[0].plot(history.history["accuracy"], label="Train")
    axes[0].plot(history.history["val_accuracy"], label="Validation")
    axes[0].set_title("Accuracy")
    axes[0].set_xlabel("Epoch")
    axes[0].legend()

    axes[1].plot(history.history["loss"], label="Train")
    axes[1].plot(history.history["val_loss"], label="Validation")
    axes[1].set_title("Loss")
    axes[1].set_xlabel("Epoch")
    axes[1].legend()

    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
    plt.close(fig)


def _plot_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray, output_path: Path) -> None:
    matrix = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(7, 6))
    sns.heatmap(
        matrix,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=CLASS_NAMES,
        yticklabels=CLASS_NAMES,
        ax=ax,
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title("Confusion Matrix")
    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
    plt.close(fig)


def _validate_dataset_layout() -> None:
    missing = []
    for split in ("train", "val", "test"):
        for folder in DATASET_CLASS_FOLDERS:
            path = DATASET_DIR / split / folder
            if not path.is_dir():
                missing.append(str(path))

    if missing:
        raise FileNotFoundError(
            "Dataset folders missing:\n  - " + "\n  - ".join(missing)
        )


def _balance_dataset(dataset_dir: Path) -> None:
    """Duplicate files in minority directories to match the majority class size."""
    import shutil
    for split in ("train", "val", "test"):
        split_dir = dataset_dir / split
        if not split_dir.is_dir():
            continue
        
        class_dirs = [split_dir / c for c in ["Healthy", "OPMD", "OralCancer"]]
        sizes = {d: len(list(d.glob("*"))) for d in class_dirs if d.is_dir()}
        if not sizes:
            continue
        
        max_size = max(sizes.values())
        print(f"\nBalancing {split} split (Target: {max_size} images per class)...")
        
        for d, size in sizes.items():
            if size < max_size:
                files = list(d.glob("*"))
                if not files:
                    continue
                needed = max_size - size
                print(f"  - Duplicating {needed} images in {d.name}...")
                
                for i in range(needed):
                    src_file = files[i % len(files)]
                    dest_file = d / f"dup_{i}_{src_file.name}"
                    shutil.copy2(src_file, dest_file)


def _cleanup_balanced_dataset(dataset_dir: Path) -> None:
    """Remove duplicated files starting with 'dup_' to restore original folders."""
    print("\nCleaning up temporary duplicated files...")
    for file in dataset_dir.rglob("dup_*"):
        try:
            file.unlink()
        except Exception:
            pass


def main() -> None:
    _validate_dataset_layout()
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    try:
        # Balance dataset splits temporarily to eliminate class imbalance bias
        _balance_dataset(DATASET_DIR)

        train_gen, val_gen, test_gen = _create_generators()

        model = build_model()

        # Unfreeze the top layers of the model directly (layers are unpacked at the root level)
        try:
            unfreeze_started = False
            unfrozen_count = 0
            for layer in model.layers:
                # We unfreeze block6a (blocks 6 & 7) and top_conv layers for deep fine-tuning
                if "block6a" in layer.name or "block7a" in layer.name or "top_conv" in layer.name:
                    unfreeze_started = True
                
                if unfreeze_started:
                    layer.trainable = True
                    unfrozen_count += 1
                else:
                    # Keep other base layers frozen (except our classification head layers)
                    if layer.name not in ["cbam", "global_avg_pool", "dense_256", "dropout", "predictions"]:
                        layer.trainable = False
            print(f"Successfully unfroze the top {unfrozen_count} layers of the model for fine-tuning!")
        except Exception as e:
            print(f"Warning: Could not unfreeze base model layers: {e}. Training classification head only.")

        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
            loss="categorical_crossentropy",
            metrics=["accuracy"],
        )

        checkpoint_path = WEIGHTS_DIR / "oralens_model.h5"
        callbacks = [
            EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True),
            ReduceLROnPlateau(
                monitor="val_loss",
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1,
            ),
            ModelCheckpoint(
                filepath=str(checkpoint_path),
                monitor="val_accuracy",
                save_best_only=True,
                save_weights_only=True,
                verbose=1,
            ),
        ]

        from sklearn.utils.class_weight import compute_class_weight
        class_weights = compute_class_weight(
            class_weight="balanced",
            classes=np.unique(train_gen.classes),
            y=train_gen.classes
        )
        class_weights_dict = dict(enumerate(class_weights))
        print(f"Calculated Class Weights (to balance data): {class_weights_dict}")

        print("Starting training...")
        history = model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=EPOCHS,
            callbacks=callbacks,
            class_weight=class_weights_dict,
            verbose=1,
        )

        model.load_weights(str(checkpoint_path))
        model.save_weights(str(checkpoint_path))

        test_loss, test_accuracy = model.evaluate(test_gen, verbose=1)
        print(f"\nFinal test accuracy: {test_accuracy:.4f}")
        print(f"Final test loss: {test_loss:.4f}")

        y_prob = model.predict(test_gen, verbose=1)
        y_pred = np.argmax(y_prob, axis=1)
        y_true = test_gen.classes

        print("\nClassification Report:")
        print(classification_report(y_true, y_pred, target_names=CLASS_NAMES))

        _plot_training_curves(history, Path("training_curves.png"))
        _plot_confusion_matrix(y_true, y_pred, Path("confusion_matrix.png"))

        print(f"\nBest weights saved to: {checkpoint_path}")
        print("Training curves saved to: training_curves.png")
        print("Confusion matrix saved to: confusion_matrix.png")

    finally:
        # Guarantee cleanup of duplicated files even if training finishes or crashes
        _cleanup_balanced_dataset(DATASET_DIR)


if __name__ == "__main__":
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
    main()
