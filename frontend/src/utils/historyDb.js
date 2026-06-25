import {
  saveHistoryRecord,
  fetchHistory,
  deleteHistoryRecord,
  clearHistory
} from '../api/api';

const HISTORY_KEY = 'oralens_scan_history';

// Generate a small thumbnail from image URL/dataUrl to fit in localStorage limits
export const createThumbnail = (imageUrl, maxWidth = 150, maxHeight = 150) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG with 70% quality
    };
    img.onerror = () => {
      resolve(imageUrl); // Fallback to raw if fails
    };
  });
};

export const getScanHistory = async (userId) => {
  if (!userId) return [];
  
  // Try retrieving history from NeonDB/PostgreSQL via backend API
  try {
    const remoteData = await fetchHistory(userId);
    if (Array.isArray(remoteData)) {
      const mappedData = remoteData.map((item) => ({
        id: item.id,
        userId: item.user_id,
        patientName: item.patient_name,
        patientAge: item.patient_age,
        patientGender: item.patient_gender,
        clinicalNotes: item.clinical_notes,
        classification: item.classification,
        confidence: item.confidence,
        riskLevel: item.risk_level,
        recommendation: item.recommendation,
        inferenceTimeMs: item.inference_time_ms,
        imageThumbnail: item.image_thumbnail,
        timestamp: item.timestamp,
      }));
      return mappedData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  } catch (e) {
    console.warn('Failed to fetch remote scan history, falling back to local storage cache:', e);
  }

  // Fallback to local storage
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    const allHistory = JSON.parse(data);
    // Return history filtered by user ID so doctors only see their own work
    return allHistory.filter((item) => item.userId === userId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (e) {
    console.error('Failed to read local scan history:', e);
    return [];
  }
};

export const saveScanToHistory = async (userId, patientData, result, imagePreview) => {
  if (!userId) return null;
  try {
    const thumbnail = imagePreview ? await createThumbnail(imagePreview) : null;
    const newRecord = {
      id: `scan_${Date.now()}`,
      userId,
      patientName: patientData.name || 'Anonymous',
      patientAge: patientData.age || 'N/A',
      patientGender: patientData.gender || 'N/A',
      clinicalNotes: patientData.notes || '',
      classification: result.classification,
      confidence: result.confidence,
      riskLevel: result.riskLevel,
      recommendation: result.recommendation,
      inferenceTimeMs: result.inferenceTimeMs,
      imageThumbnail: thumbnail,
      timestamp: new Date().toISOString(),
    };

    // Save to local storage (as cache and fallback)
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      const allHistory = data ? JSON.parse(data) : [];
      allHistory.push(newRecord);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
    } catch (localErr) {
      console.warn('Failed to save record to local storage cache:', localErr);
    }

    // Save to NeonDB/PostgreSQL via backend API
    try {
      const backendRecord = {
        id: newRecord.id,
        user_id: newRecord.userId,
        patient_name: newRecord.patientName,
        patient_age: String(newRecord.patientAge),
        patient_gender: newRecord.patientGender,
        clinical_notes: newRecord.clinicalNotes,
        classification: newRecord.classification,
        confidence: newRecord.confidence,
        risk_level: newRecord.riskLevel,
        recommendation: newRecord.recommendation,
        inference_time_ms: newRecord.inferenceTimeMs,
        image_thumbnail: newRecord.imageThumbnail,
      };
      await saveHistoryRecord(backendRecord);
    } catch (remoteErr) {
      console.error('Failed to save record to cloud database:', remoteErr);
    }

    return newRecord;
  } catch (e) {
    console.error('Failed to save scan to history:', e);
    return null;
  }
};

export const deleteScanRecord = async (id, userId) => {
  // Delete from local storage cache
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (data) {
      const allHistory = JSON.parse(data);
      const updatedHistory = allHistory.filter((item) => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    }
  } catch (e) {
    console.error('Failed to delete scan record from local cache:', e);
  }

  // Delete from NeonDB/PostgreSQL via backend API
  if (userId) {
    try {
      await deleteHistoryRecord(id, userId);
    } catch (e) {
      console.error('Failed to delete scan record from cloud database:', e);
    }
  }
};

export const clearScanHistory = async (userId) => {
  if (!userId) return;
  
  // Clear from local storage cache
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (data) {
      const allHistory = JSON.parse(data);
      const updatedHistory = allHistory.filter((item) => item.userId !== userId);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    }
  } catch (e) {
    console.error('Failed to clear scan history from local cache:', e);
  }

  // Clear from NeonDB/PostgreSQL via backend API
  try {
    await clearHistory(userId);
  } catch (e) {
    console.error('Failed to clear scan history from cloud database:', e);
  }
};
