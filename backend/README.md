# OraLens AI Backend

Production-ready FastAPI backend for AI-powered oral cancer detection using **EfficientNet-B0 + CBAM** attention.

## Features

- Real deep learning inference pipeline (TensorFlow/Keras)
- CLAHE-based oral image preprocessing
- Three-class classification: **Healthy**, **OPMD**, **Oral Cancer**
- Risk stratification and clinical recommendations
- REST API with OpenAPI docs

## Project Structure

```
backend/
├── main.py                  # FastAPI app entry point
├── train_model.py           # Standalone training script
├── model/
│   ├── model_loader.py      # Load EfficientNet-B0 + CBAM weights
│   ├── cbam.py              # CBAM attention module
│   └── weights/             # Place oralens_model.h5 here
├── pipeline/
│   ├── preprocessor.py      # CLAHE + resize + normalize
│   └── predictor.py         # Inference and response mapping
├── schemas/
│   └── response.py          # Pydantic response models
├── utils/
│   └── image_utils.py       # Upload validation utilities
├── requirements.txt
└── README.md
```

## Requirements

- Python 3.11
- Trained model weights at `model/weights/oralens_model.h5`

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Prepare dataset

Organize images under `dataset/`:

```
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
```

### 3. Train the model

```bash
python train_model.py
```

This saves the best weights to `model/weights/oralens_model.h5`, prints test metrics, and generates:

- `training_curves.png`
- `confusion_matrix.png`

### 4. Start the API server

```bash
uvicorn main:app --reload --port 8000
```

### 5. Open API docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### `GET /health`

Returns service status and model load state.

```json
{
  "status": "ok",
  "model_loaded": true,
  "version": "1.0.0"
}
```

### `GET /model-info`

Returns architecture summary, parameter counts, class labels, and preprocessing steps.

### `POST /predict`

Upload a JPEG or PNG image (max 10 MB) as `multipart/form-data` field `file`.

Example response:

```json
{
  "status": "success",
  "predicted_class": "OPMD",
  "confidence": 0.923,
  "probabilities": {
    "Healthy": 0.041,
    "OPMD": 0.923,
    "Oral Cancer": 0.036
  },
  "risk_level": "Moderate",
  "recommendation": "Potentially malignant disorder detected. Clinical consultation is strongly recommended.",
  "inference_time_ms": 12.4
}
```

## Risk Levels

| Condition | Risk Level |
|-----------|------------|
| Predicted **Healthy** with confidence ≥ 0.75 | Low |
| Predicted **OPMD** with confidence ≥ 0.75 | Moderate |
| Predicted **Oral Cancer** with confidence ≥ 0.75 | High |
| Any prediction with confidence < 0.75 | Uncertain — Refer to Specialist |

## Error Handling

| Status | Cause |
|--------|-------|
| 400 | Invalid file type or corrupted image |
| 413 | File larger than 10 MB |
| 500 | Inference failure (logged server-side) |

All errors return:

```json
{
  "status": "error",
  "message": "..."
}
```

## CORS

Configured for frontend development at `http://localhost:5173`.

## Notes

- The server **will not start** without weights at `model/weights/oralens_model.h5`.
- First startup downloads ImageNet weights for EfficientNet-B0 (one-time).
- This API supports clinical decision support only — not a substitute for professional diagnosis.
