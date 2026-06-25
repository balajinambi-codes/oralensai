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

export const getScanHistory = (userId) => {
  if (!userId) return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    const allHistory = JSON.parse(data);
    // Return history filtered by user ID so doctors only see their own work
    return allHistory.filter((item) => item.userId === userId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (e) {
    console.error('Failed to read scan history:', e);
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

    const data = localStorage.getItem(HISTORY_KEY);
    const allHistory = data ? JSON.parse(data) : [];
    allHistory.push(newRecord);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
    return newRecord;
  } catch (e) {
    console.error('Failed to save scan to history:', e);
    return null;
  }
};

export const deleteScanRecord = (id) => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return;
    const allHistory = JSON.parse(data);
    const updatedHistory = allHistory.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error('Failed to delete scan record:', e);
  }
};

export const clearScanHistory = (userId) => {
  if (!userId) return;
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return;
    const allHistory = JSON.parse(data);
    // Keep records of OTHER users, only delete current user's records
    const updatedHistory = allHistory.filter((item) => item.userId !== userId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error('Failed to clear scan history:', e);
  }
};
