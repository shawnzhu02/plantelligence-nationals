import React, { useState } from 'react'; //importing react, stuff from recharts and lucide
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sun, Droplet, Calendar, Search, Loader } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const GardenPlanner = () => {
  const [zipCode, setZipCode] = useState('');
  const [crops, setCrops] = useState([]);
  const [weather, setWeather] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [plantingDate, setPlantingDate] = useState('');
  const [myGarden, setMyGarden] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter crops based on search term
  const filteredCrops = crops.filter(crop => 
    crop.Crop?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadZipData = async () => { //creating an async function to load the zip data
    if (!zipCode.match(/^\d{5}$/)) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Fetch planting data
      const plantingResponse = await fetch(`${API_BASE_URL}/planting-data/${zipCode}`);
      const plantingData = await plantingResponse.json();
      
      if (!plantingData.success) {
        throw new Error(plantingData.error || 'Failed to fetch planting data');
      }
      
      setCrops(plantingData.data);
      
      // Fetch weather data
      const weatherResponse = await fetch(`${API_BASE_URL}/weather/${zipCode}`);
      const weatherData = await weatherResponse.json();
      
      if (!weatherData.success) {
        throw new Error(weatherData.error || 'Failed to fetch weather data');
      }
      
      setWeather(weatherData.data);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle crop selection
  const handleCropSelect = (crop) => {
    setSelectedCrop(crop);
  };

  // Add crop to garden
  const addCropToGarden = async () => {
    if (!selectedCrop) {
      setError('Please select a crop first');
      return;
    }
    
    if (!plantingDate) {
      setError('Please enter a planting date');
      return;
    }
    
    try {
      const newCrop = {
        crop: selectedCrop.Crop,
        planting_date: plantingDate,
        planting_info: {
          indoor_start: selectedCrop['Start Seeds Indoors'],
          seedlings: selectedCrop['Plant Seedlings'],
          direct_sow: selectedCrop['Direct Sow/Plant']
        }
      };
      
      // In a real app, this would save to the backend
      // For now, just add to state
      setMyGarden([...myGarden, newCrop]);
      setError('');
    } catch (err) {
      setError('Failed to add crop to garden');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-teal-50 p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-teal-800 mb-2">Garden Planner</h1>
        <p className="text-teal-600">Plan your garden based on local growing conditions</p>
      </header>
      
      {/* ZIP Code Section */}
      <section className="max-w-md mx-auto mb-10 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-grow">
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
              Enter ZIP Code
            </label>
            <input
              id="zipCode"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="e.g. 90210"
              maxLength={5}
            />
          </div>
          <button
            onClick={loadZipData}
            disabled={loading}
            className="h-10 px-6 mt-6 text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            {loading ? <Loader className="animate-spin" size={16} /> : 'Load Data'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weather Forecast Section */}
        {weather.length > 0 && (
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-teal-800 mb-4 flex items-center">
              <Sun className="mr-2" /> 7-Day Weather Forecast
            </h2>
            
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weather}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { weekday: 'short' });
                    }}
                  />
                  <YAxis yAxisId="left" orientation="left" unit="°F" />
                  <YAxis yAxisId="right" orientation="right" unit="mm" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="temp_max" 
                    stroke="#ff7300" 
                    name="High Temp"
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="temp_min" 
                    stroke="#387908" 
                    name="Low Temp"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="precipitation" 
                    stroke="#0088FE" 
                    name="Precipitation"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              {weather.map((day, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center">
                    <div className="w-10 text-center">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <img 
                      src={day.icon} 
                      alt={day.condition} 
                      className="w-10 h-10 mx-2"
                    />
                    <span className="text-gray-700">{day.condition}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-red-500">{Math.round(day.temp_max)}°F</span>
                    <span className="text-blue-500">{Math.round(day.temp_min)}°F</span>
                    <div className="flex items-center">
                      <Droplet className={day.water_needed === "Yes" ? "text-blue-500" : "text-gray-300"} size={16} />
                      <span className="ml-1 text-sm">{day.water_needed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* My Garden Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-teal-800 mb-4">My Garden</h2>
          
          {myGarden.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Your garden is empty. Add some crops below.
            </div>
          ) : (
            <div className="space-y-3">
              {myGarden.map((item, index) => (
                <div key={index} className="bg-green-50 rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-teal-700">{item.crop}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={14} className="mr-1" />
                      Planted: {item.planting_date}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {item.planting_info.indoor_start && (
                      <div>Start Seeds Indoors: {item.planting_info.indoor_start}</div>
                    )}
                    {item.planting_info.seedlings && (
                      <div>Plant Seedlings: {item.planting_info.seedlings}</div>
                    )}
                    {item.planting_info.direct_sow && (
                      <div>Direct Sow: {item.planting_info.direct_sow}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      
      {/* Crop Search Section */}
      {crops.length > 0 && (
        <section className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-teal-800 mb-4 flex items-center">
            <Search className="mr-2" /> Find Crops to Plant
          </h2>
          
          <div className="mb-6">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Search for a crop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredCrops.map((crop, index) => (
              <div 
                key={index} 
                className={`p-4 border rounded-md cursor-pointer transition-colors ${
                  selectedCrop?.Crop === crop.Crop 
                    ? 'bg-teal-100 border-teal-500' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleCropSelect(crop)}
              >
                <h3 className="font-medium text-teal-700">{crop.Crop}</h3>
              </div>
            ))}
          </div>
          
          {selectedCrop && (
            <div className="bg-teal-50 rounded-lg p-4 mb-6">
              <h3 className="text-xl font-medium text-teal-800 mb-2">{selectedCrop.Crop}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded shadow-sm">
                  <h4 className="text-sm font-medium text-gray-500">Start Seeds Indoors</h4>
                  <p className="text-teal-700">{selectedCrop['Start Seeds Indoors'] || 'N/A'}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <h4 className="text-sm font-medium text-gray-500">Plant Seedlings</h4>
                  <p className="text-teal-700">{selectedCrop['Plant Seedlings'] || 'N/A'}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <h4 className="text-sm font-medium text-gray-500">Direct Sow</h4>
                  <p className="text-teal-700">{selectedCrop['Direct Sow/Plant'] || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-end space-x-4">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planting Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                  />
                </div>
                <button
                  onClick={addCropToGarden}
                  className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  Add to Garden
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default GardenPlanner;