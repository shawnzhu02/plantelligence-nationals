const API_BASE_URL = 'http://localhost:5000/api';

export const fetchPlantingData = async (zipCode) => {
  const response = await fetch(`${API_BASE_URL}/planting-data/${zipCode}`);
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch planting data');
  }
  return data.data;
};

export const fetchWeatherData = async (zipCode) => {
  const response = await fetch(`${API_BASE_URL}/weather/${zipCode}`);
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch weather data');
  }
  return data.data;
};

export const fetchGarden = async () => {
  const response = await fetch(`${API_BASE_URL}/garden`);
  const data = await response.json();
  return data.success ? data.data : [];
};

export const addCropToGarden = async (cropData) => {
  const response = await fetch(`${API_BASE_URL}/garden`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cropData),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to add crop to garden');
  }
  return data.data;
};