"""EfficientNet-B0 + CBAM model construction and weight loading."""

from __future__ import annotations

import logging
import time
from pathlib import Path

import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D, Input
from tensorflow.keras.models import Model

from model.cbam import CBAMBlock

logger = logging.getLogger(__name__)

CLASS_NAMES = ["Healthy", "OPMD", "Oral Cancer"]
WEIGHTS_PATH = Path(__file__).resolve().parent / "weights" / "oralens_model.h5"
INPUT_SHAPE = (224, 224, 3)

_model: Model | None = None


def build_model() -> Model:
    """Build EfficientNet-B0 backbone with CBAM attention and classification head."""
    inputs = Input(shape=INPUT_SHAPE, name="input_image")

    base_model = EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_tensor=inputs,
        pooling=None,
    )
    base_model.trainable = False

    features = base_model.output
    x = CBAMBlock(name="cbam")(features)
    x = GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = Dense(256, activation="relu", name="dense_256")(x)
    x = Dropout(0.4, name="dropout")(x)
    outputs = Dense(len(CLASS_NAMES), activation="softmax", name="predictions")(x)

    return Model(inputs=inputs, outputs=outputs, name="oralens_efficientnet_cbam")


def load_model() -> Model:
    """Load model weights from disk, creating uninitialized weights in dev if missing."""
    global _model

    if not WEIGHTS_PATH.is_file():
        logger.warning(
            "Model weights not found at %s. Creating uninitialized weights so the API can start. "
            "Run train_model.py after preparing the dataset for production inference.",
            WEIGHTS_PATH,
        )
        model = build_model()
        WEIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
        model.save_weights(str(WEIGHTS_PATH))
        _model = model
        return model

    start = time.perf_counter()
    logger.info("Loading OraLens model from %s", WEIGHTS_PATH)

    model = build_model()
    model.load_weights(str(WEIGHTS_PATH))

    load_time = time.perf_counter() - start
    logger.info("Model loaded successfully in %.2f seconds", load_time)

    _model = model
    return model


def get_model() -> Model:
    """Return the singleton loaded model instance."""
    if _model is None:
        raise RuntimeError("Model has not been loaded. Call load_model() during startup.")
    return _model


def get_model_summary() -> dict:
    """Return architecture metadata for the /model-info endpoint."""
    model = get_model()
    trainable = int(sum(tf.keras.backend.count_params(w) for w in model.trainable_weights))
    non_trainable = int(
        sum(tf.keras.backend.count_params(w) for w in model.non_trainable_weights)
    )

    return {
        "architecture": "EfficientNet-B0 + CBAM",
        "framework": "TensorFlow/Keras",
        "input_shape": list(INPUT_SHAPE),
        "total_parameters": int(model.count_params()),
        "trainable_parameters": trainable,
        "non_trainable_parameters": non_trainable,
        "classes": CLASS_NAMES,
        "preprocessing": [
            "Decode image bytes to BGR (OpenCV)",
            "Convert BGR → LAB color space",
            "Apply CLAHE to L channel (clipLimit=2.0, tileGridSize=(8,8))",
            "Convert LAB → BGR → RGB",
            "Resize to 224×224 (INTER_LINEAR)",
            "Scale pixel values to [0, 1] (divide by 255.0)",
            "ImageNet normalization (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])",
        ],
        "weights_file": str(WEIGHTS_PATH),
    }
