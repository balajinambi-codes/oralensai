const CLASS_LABELS = ['Healthy', 'OPMD', 'Oral Cancer'];

function normalizeKey(key) {
  return String(key).toLowerCase().replace(/[\s_-]+/g, '');
}

function findProbability(probs, ...aliases) {
  if (!probs || typeof probs !== 'object') return null;
  for (const [key, value] of Object.entries(probs)) {
    const normalized = normalizeKey(key);
    if (aliases.some((alias) => normalized.includes(alias))) {
      return typeof value === 'number' ? value : parseFloat(value);
    }
  }
  return null;
}

function normalizeProbabilities(data) {
  const raw =
    data.probabilities ??
    data.class_probabilities ??
    data.probs ??
    data.prediction_probs;

  if (Array.isArray(raw) && raw.length >= 3) {
    return CLASS_LABELS.map((label, i) => ({
      label,
      value: raw[i] <= 1 ? raw[i] * 100 : raw[i],
    }));
  }

  if (raw && typeof raw === 'object') {
    return [
      { label: 'Healthy', value: findProbability(raw, 'healthy', 'normal') ?? 0 },
      { label: 'OPMD', value: findProbability(raw, 'opmd', 'premalignant') ?? 0 },
      { label: 'Oral Cancer', value: findProbability(raw, 'cancer', 'oralcancer', 'malignant') ?? 0 },
    ].map(({ label, value }) => ({
      label,
      value: value <= 1 ? value * 100 : value,
    }));
  }

  return CLASS_LABELS.map((label) => ({ label, value: 0 }));
}

export function parsePredictionResponse(data) {
  const classification =
    data.classification ??
    data.predicted_class ??
    data.predictedClass ??
    data.label ??
    data.prediction ??
    data.class ??
    'Unknown';

  let confidence =
    data.confidence ??
    data.confidence_score ??
    data.confidenceScore ??
    data.confidence_percent;

  if (confidence != null && confidence <= 1) {
    confidence = confidence * 100;
  }

  const inferenceTimeMs =
    data.inference_time_ms ??
    data.inference_time ??
    data.inferenceTimeMs ??
    data.processing_time_ms ??
    data.processing_time ??
    null;

  return {
    classification: String(classification),
    confidence: confidence != null ? Number(confidence) : null,
    probabilities: normalizeProbabilities(data),
    riskLevel: data.risk_level ?? data.riskLevel ?? data.risk ?? 'Uncertain',
    recommendation:
      data.recommendation ??
      data.recommendations ??
      data.advice ??
      data.message ??
      '',
    inferenceTimeMs: inferenceTimeMs != null ? Number(inferenceTimeMs) : null,
    raw: data,
  };
}

export function getClassificationColor(classification) {
  const normalized = normalizeKey(classification);
  if (normalized.includes('healthy') || normalized.includes('normal')) return '#22C55E';
  if (normalized.includes('opmd') || normalized.includes('premalignant')) return '#F59E0B';
  if (normalized.includes('cancer') || normalized.includes('malignant')) return '#EF4444';
  return '#94A3B8';
}

export function getRiskColor(riskLevel) {
  const normalized = normalizeKey(riskLevel);
  if (normalized.includes('low')) return '#22C55E';
  if (normalized.includes('moderate') || normalized.includes('medium')) return '#F59E0B';
  if (normalized.includes('high')) return '#EF4444';
  return '#94A3B8';
}

export function getApiErrorMessage(error) {
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data.detail) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) {
        return data.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ');
      }
      return JSON.stringify(data.detail);
    }
    if (data.message) return data.message;
    if (data.error) return data.error;
  }
  if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (error.message === 'Network Error') {
    return 'Unable to reach the server. Ensure the backend is running on port 8000.';
  }
  return error.message || 'An unexpected error occurred.';
}
