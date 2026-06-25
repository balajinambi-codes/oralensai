"""Image preprocessing pipeline for OraLens inference."""

from __future__ import annotations

import cv2
import numpy as np

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
TARGET_SIZE = (224, 224)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Decode and preprocess an oral image for model inference.

    Returns a batch array of shape (1, 224, 224, 3) ready for TensorFlow inference.
    """
    np_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    bgr_image = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)

    if bgr_image is None:
        raise ValueError("Unable to decode image bytes. The file may be corrupted.")

    lab_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab_image)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)

    lab_image = cv2.merge((l_channel, a_channel, b_channel))
    bgr_image = cv2.cvtColor(lab_image, cv2.COLOR_LAB2BGR)
    rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)

    resized = cv2.resize(rgb_image, TARGET_SIZE, interpolation=cv2.INTER_LINEAR)
    normalized = resized.astype(np.float32) / 255.0
    normalized = (normalized - IMAGENET_MEAN) / IMAGENET_STD

    return np.expand_dims(normalized, axis=0)
