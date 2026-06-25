"""FastAPI application entry point for OraLens AI."""

from __future__ import annotations

import logging
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from model.model_loader import get_model_summary, load_model
from pipeline.predictor import predict_from_bytes
from schemas.response import ErrorResponse, HealthResponse, ModelInfoResponse, PredictSuccessResponse
from utils.image_utils import (
    MAX_FILE_SIZE_BYTES,
    validate_content_type,
    validate_file_size,
    validate_image_bytes,
)
from database import get_db, init_db, ScanLog
from schemas.history import ScanLogCreate, ScanLogResponse
from sqlalchemy.orm import Session
from fastapi import Depends


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("oralens")

APP_VERSION = "1.0.0"
_model_loaded = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model_loaded
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as exc:
        logger.error(f"Failed to initialize database: {exc}\n{traceback.format_exc()}")

    load_model()
    _model_loaded = True

    yield


app = FastAPI(
    title="OraLens AI",
    description="AI-powered oral cancer detection API",
    version=APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://oralensai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(message=str(exc.detail)).model_dump(),
    )


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    return HealthResponse(model_loaded=_model_loaded, version=APP_VERSION)


@app.get("/model-info", response_model=ModelInfoResponse, tags=["System"])
async def model_info() -> ModelInfoResponse:
    summary = get_model_summary()
    return ModelInfoResponse(**summary)


@app.post(
    "/predict",
    response_model=PredictSuccessResponse,
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    tags=["Inference"],
)
async def predict(file: UploadFile = File(...)) -> PredictSuccessResponse:
    try:
        validate_content_type(file.content_type)
        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        validate_file_size(len(image_bytes))
        validate_image_bytes(image_bytes)

        result = predict_from_bytes(image_bytes)
        return PredictSuccessResponse(**result)

    except HTTPException:
        raise
    except ValueError as exc:
        message = str(exc)
        status_code = 413 if "too large" in message.lower() else 400
        raise HTTPException(status_code=status_code, detail=message) from exc
    except Exception as exc:
        logger.error("Inference failed:\n%s", traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Inference error: {exc}",
        ) from exc


@app.middleware("http")
async def enforce_upload_size_limit(request, call_next):
    if request.method == "POST" and request.url.path == "/predict":
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_FILE_SIZE_BYTES:
            return JSONResponse(
                status_code=413,
                content=ErrorResponse(
                    message="File too large. Maximum allowed size is 10 MB."
                ).model_dump(),
            )
    return await call_next(request)


@app.post("/history", response_model=ScanLogResponse, tags=["History"])
async def create_history_record(record: ScanLogCreate, db: Session = Depends(get_db)):
    try:
        # Check if record already exists to avoid duplication
        existing = db.query(ScanLog).filter(ScanLog.id == record.id).first()
        if existing:
            return existing

        db_record = ScanLog(
            id=record.id,
            user_id=record.user_id,
            patient_name=record.patient_name,
            patient_age=record.patient_age,
            patient_gender=record.patient_gender,
            clinical_notes=record.clinical_notes,
            classification=record.classification,
            confidence=record.confidence,
            risk_level=record.risk_level,
            recommendation=record.recommendation,
            inference_time_ms=record.inference_time_ms,
            image_thumbnail=record.image_thumbnail,
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record
    except Exception as exc:
        db.rollback()
        logger.error("Failed to save scan to database:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@app.get("/history", response_model=list[ScanLogResponse], tags=["History"])
async def get_history(user_id: str, db: Session = Depends(get_db)):
    try:
        records = db.query(ScanLog).filter(ScanLog.user_id == user_id).order_by(ScanLog.timestamp.desc()).all()
        return records
    except Exception as exc:
        logger.error("Failed to get scan history from database:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@app.delete("/history/clear", tags=["History"])
async def clear_history(user_id: str, db: Session = Depends(get_db)):
    try:
        db.query(ScanLog).filter(ScanLog.user_id == user_id).delete()
        db.commit()
        return {"status": "success", "message": f"History cleared for user {user_id}"}
    except Exception as exc:
        db.rollback()
        logger.error("Failed to clear scan history from database:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@app.delete("/history/{record_id}", tags=["History"])
async def delete_history_record(record_id: str, user_id: str, db: Session = Depends(get_db)):
    try:
        record = db.query(ScanLog).filter(ScanLog.id == record_id, ScanLog.user_id == user_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Scan record not found.")
        db.delete(record)
        db.commit()
        return {"status": "success", "message": f"Scan record {record_id} deleted."}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("Failed to delete scan record from database:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")

