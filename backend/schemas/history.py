from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ScanLogCreate(BaseModel):
    id: str
    user_id: str
    patient_name: str
    patient_age: Optional[str] = "N/A"
    patient_gender: Optional[str] = "N/A"
    clinical_notes: Optional[str] = ""
    classification: str
    confidence: float
    risk_level: str
    recommendation: Optional[str] = ""
    inference_time_ms: Optional[float] = 0.0
    image_thumbnail: Optional[str] = None

class ScanLogResponse(BaseModel):
    id: str
    user_id: str
    patient_name: str
    patient_age: str
    patient_gender: str
    clinical_notes: str
    classification: str
    confidence: float
    risk_level: str
    recommendation: str
    inference_time_ms: float
    image_thumbnail: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
