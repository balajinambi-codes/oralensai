import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const predictImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  const response = await axios.post(`${BASE_URL}/predict`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return response.data;
};

export const checkHealth = async () => {
  const response = await axios.get(`${BASE_URL}/health`, { timeout: 30000 });
  return response.data;
};
