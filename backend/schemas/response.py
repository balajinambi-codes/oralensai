"""Pydantic response models for OraLens API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class Probabilities(BaseModel):
    Healthy: float
    OPMD: float
    oral_cancer: float = Field(alias="Oral Cancer")

    model_config = {"populate_by_name": True}


class PredictSuccessResponse(BaseModel):
    status: Literal["success"] = "success"
    predicted_class: str
    confidence: float
    probabilities: dict[str, float]
    risk_level: str
    recommendation: str
    inference_time_ms: float


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    model_loaded: bool
    version: str = "1.0.0"


class ModelInfoResponse(BaseModel):
    architecture: str
    framework: str
    input_shape: list[int]
    total_parameters: int
    trainable_parameters: int
    non_trainable_parameters: int
    classes: list[str]
    preprocessing: list[str]
    weights_file: str


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    message: str
