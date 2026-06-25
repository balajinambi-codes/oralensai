"""Inference pipeline for OraLens oral cancer detection."""

from __future__ import annotations

import time
from typing import Any

import numpy as np

from model.model_loader import CLASS_NAMES, get_model
from pipeline.preprocessor import preprocess_image

RECOMMENDATIONS = {
    "Low": (
        "No significant oral pathology detected. Continue routine oral hygiene "
        "and periodic dental check-ups."
    ),
    "Moderate": (
        "Potentially malignant disorder detected. "
        "Clinical consultation is strongly recommended."
    ),
    "High": (
        "Signs consistent with oral cancer detected. "
        "Immediate referral to an oral medicine specialist or oncologist is advised."
    ),
    "Uncertain — Refer to Specialist": (
        "Model confidence is below the reliable threshold. "
        "Please consult a specialist for clinical evaluation and definitive diagnosis."
    ),
}


def _determine_risk_level(predicted_class: str, confidence: float) -> str:
    if confidence < 0.75:
        return "Uncertain — Refer to Specialist"

    if predicted_class == "Healthy":
        return "Low"
    if predicted_class == "OPMD":
        return "Moderate"
    if predicted_class == "Oral Cancer":
        return "High"

    return "Uncertain — Refer to Specialist"


def predict_from_bytes(image_bytes: bytes) -> dict[str, Any]:
    """Run full preprocessing and inference on raw image bytes."""
    model = get_model()
    batch = preprocess_image(image_bytes)

    start = time.perf_counter()
    probabilities = model.predict(batch, verbose=0)[0]
    inference_time_ms = round((time.perf_counter() - start) * 1000, 1)

    probabilities = np.clip(probabilities, 0.0, 1.0)
    predicted_index = int(np.argmax(probabilities))
    predicted_class = CLASS_NAMES[predicted_index]
    confidence = round(float(probabilities[predicted_index]), 3)

    probability_map = {
        class_name: round(float(prob), 3)
        for class_name, prob in zip(CLASS_NAMES, probabilities)
    }

    risk_level = _determine_risk_level(predicted_class, confidence)

    return {
        "status": "success",
        "predicted_class": predicted_class,
        "confidence": confidence,
        "probabilities": probability_map,
        "risk_level": risk_level,
        "recommendation": RECOMMENDATIONS[risk_level],
        "inference_time_ms": inference_time_ms,
    }
