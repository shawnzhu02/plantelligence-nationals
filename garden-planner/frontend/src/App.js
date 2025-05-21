import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sun, Droplet, Calendar, Search, Loader, Leaf, CloudRain, ThermometerSun, Wind, X, ChevronRight, ChevronLeft, Info, PlusCircle, Sparkles } from 'lucide-react';

// Define global animations for use throughout the component
const globalStyles = `
  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(5deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes shimmer {
    0% { background-position: -100% 0; }
    100% { background-position: 100% 0; }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .animate-pulse {
    animation: pulse 2s ease-in-out infinite;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .animate-slide-up {
    animation: slideUp 0.5s ease-out forwards;
  }
  
  .animate-shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  .delay-300 {
    animation-delay: 0.3s;
  }
  
  .delay-500 {
    animation-delay: 0.5s;
  }
  
  .delay-700 {
    animation-delay: 0.7s;
  }
  
  .delay-1000 {
    animation-delay: 1s;
  }
`;

const API_BASE_URL = 'http://localhost:5000/api';

// Custom animated leaf component for loading and decorative elements
const AnimatedLeaf = ({ className }) => (
  <div className={`animate-float ${className}`}>
    <Leaf className="text-green-500" />
  </div>
);

// Theme colors for a more unique palette
const THEME = {
  primary: 'from-emerald-600 to-teal-500',
  secondary: 'from-amber-400 to-yellow-300',
  accent: 'text-emerald-600',
  background: 'from-emerald-50 to-teal-100',
  card: 'bg-white/90 backdrop-blur-sm',
  darkAccent: 'text-emerald-800',
};

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
  const [activeView, setActiveView] = useState('plan'); // 'plan', 'garden', 'weather'
  const [infoTip, setInfoTip] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [cropCategory, setCropCategory] = useState('all');

  // Filter crops based on search term and category
  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.Crop?.toLowerCase().includes(searchTerm.toLowerCase());
    if (cropCategory === 'all') return matchesSearch;
    
    // This is placeholder logic - in a real app, you'd have crop categories in your data
    const categories = {
      'vegetables': ['Tomato', 'Pepper', 'Cucumber', 'Lettuce', 'Carrot', 'Broccoli', 'Cabbage'],
      'herbs': ['Basil', 'Parsley', 'Mint', 'Cilantro', 'Thyme', 'Rosemary', 'Dill'],
      'fruits': ['Strawberry', 'Watermelon', 'Cantaloupe', 'Raspberry']
    };
    
    return matchesSearch && categories[cropCategory]?.some(c => 
      crop.Crop?.toLowerCase().includes(c.toLowerCase())
    );
  });

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All Plants' },
    { id: 'vegetables', label: 'Vegetables' },
    { id: 'herbs', label: 'Herbs' },
    { id: 'fruits', label: 'Fruits' }
  ];
  
  // Show random gardening tips
  useEffect(() => {
    const tips = [
      "Water your garden early in the morning to reduce evaporation.",
      "Companion planting can help deter pests naturally.",
      "Rotating crops each season helps prevent disease and pest issues.",
      "Mulch helps retain moisture and suppresses weeds.",
      "Consider your garden's sun exposure when choosing planting locations."
    ];
    
    const showRandomTip = () => {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setInfoTip(randomTip);
      setTimeout(() => setInfoTip(''), 8000);
    };
    
    const interval = setInterval(showRandomTip, 15000);
    showRandomTip(); // Show first tip immediately
    
    return () => clearInterval(interval);
  }, []);

  // Load data for the entered ZIP code
  const loadZipData = async () => {
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
      
      // Automatically show weather view after loading data
      setActiveView('weather');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle crop selection
  const handleCropSelect = (crop) => {
    setSelectedCrop(crop);
    setShowForm(true);
    
    // Scroll to the form
    setTimeout(() => {
      document.getElementById('planting-form')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
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
        id: Date.now(), // Simple unique ID
        crop: selectedCrop.Crop,
        planting_date: plantingDate,
        planting_info: {
          indoor_start: selectedCrop['Start Seeds Indoors'],
          seedlings: selectedCrop['Plant Seedlings'],
          direct_sow: selectedCrop['Direct Sow/Plant']
        },
        status: 'planned' // 'planned', 'planted', 'harvested'
      };
      
      // In a real app, this would save to the backend
      // For now, just add to state
      setMyGarden([...myGarden, newCrop]);
      setError('');
      setShowForm(false);
      
      // Show garden view after adding crop
      setActiveView('garden');
    } catch (err) {
      setError('Failed to add crop to garden');
    }
  };
  
  // Update crop status
  const updateCropStatus = (id, status) => {
    setMyGarden(myGarden.map(crop => 
      crop.id === id ? {...crop, status} : crop
    ));
  };
  
  // Remove crop from garden
  const removeCrop = (id) => {
    setMyGarden(myGarden.filter(crop => crop.id !== id));
  };
  
  // Weather icon selection based on condition
  const getWeatherIcon = (condition) => {
    condition = condition?.toLowerCase() || '';
    
    if (condition.includes('rain') || condition.includes('shower')) {
      return <CloudRain className="text-blue-500" size={24} />;
    } else if (condition.includes('sun') || condition.includes('clear')) {
      return <Sun className="text-yellow-500" size={24} />;
    } else if (condition.includes('cloud')) {
      return <CloudRain className="text-gray-400" size={24} />;
    } else if (condition.includes('wind')) {
      return <Wind className="text-gray-500" size={24} />;
    } else {
      return <ThermometerSun className="text-orange-400" size={24} />;
    }
  };
  
  // Function to determine whether to water plants today
  const shouldWaterToday = () => {
    if (!weather || weather.length === 0) return false;
    
    const today = weather[0];
    const tomorrow = weather[1];
    
    // If it's going to rain today, no need to water
    if (today.condition?.toLowerCase().includes('rain')) return false;
    
    // If precipitation is over 5mm, probably no need to water
    if (today.precipitation > 5) return false;
    
    // If it's hot (over 85°F) and no rain, water
    if (today.temp_max > 85) return true;
    
    // If no rain today and none tomorrow, water
    if (!tomorrow.condition?.toLowerCase().includes('rain') && tomorrow.precipitation < 5) return true;
    
    return false;
  };
  
  // Visual status for garden items
  const getStatusBadge = (status) => {
    switch(status) {
      case 'planned':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Planned</span>;
      case 'planted':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Planted</span>;
      case 'harvested':
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Harvested</span>;
      default:
        return null;
    }
  };
  
  // Component for decorative elements
  const DecorativeElements = () => (
    <>
      <div className="absolute top-20 left-10 opacity-25 hidden md:block">
        <AnimatedLeaf className="delay-300" />
      </div>
      <div className="absolute bottom-40 right-10 opacity-30 hidden md:block">
        <AnimatedLeaf className="delay-700" />
      </div>
      <div className="absolute top-60 right-20 opacity-20 hidden md:block">
        <AnimatedLeaf className="delay-1000" />
      </div>
      <div className="absolute top-40 left-1/2 opacity-30 hidden md:block">
        <AnimatedLeaf className="delay-500" />
      </div>
    </>
  );
  
  return (
    <div className={`min-h-screen bg-gradient-to-br ${THEME.background} p-6 relative overflow-hidden`}>
      <DecorativeElements />
      
      {/* Header with Navigation */}
      <header className="relative z-10 mb-8 text-center">
        <div className={`inline-block py-2 px-6 rounded-full bg-gradient-to-r ${THEME.primary} text-white shadow-lg mb-4`}>
          <h1 className="text-4xl font-bold mb-1">Garden Planner</h1>
          <p className="text-white/80">Plan your garden with confidence</p>
        </div>
        
        {/* Navigation tabs */}
        <div className="flex justify-center space-x-2 mt-6">
          {[
            { id: 'plan', label: 'Plan Garden', icon: <Search size={16} /> },
            { id: 'garden', label: 'My Garden', icon: <Leaf size={16} /> },
            { id: 'weather', label: 'Weather', icon: <CloudRain size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center px-4 py-2 rounded-full transition-all ${
                activeView === tab.id 
                  ? `bg-white text-emerald-700 shadow-md` 
                  : `bg-white/30 hover:bg-white/60 text-emerald-900`
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>
      
      {/* Gardening Tip Toast */}
      {infoTip && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border-l-4 border-amber-400 animate-slide-up z-50">
          <div className="flex items-start">
            <Info className="text-amber-500 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-gray-800">{infoTip}</p>
            </div>
            <button onClick={() => setInfoTip('')} className="ml-2 text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* ZIP Code Section - Always visible */}
      <section className={`max-w-md mx-auto mb-10 ${THEME.card} rounded-xl shadow-xl p-6 transform transition-all ${loading ? 'scale-105' : ''}`}>
        <div className="flex items-center space-x-4">
          <div className="flex-grow">
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
              Enter Your ZIP Code
            </label>
            <input
              id="zipCode"
              type="text"
              className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="e.g. 90210"
              maxLength={5}
            />
          </div>
          <button
            onClick={loadZipData}
            disabled={loading}
            className={`h-12 px-6 mt-6 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all bg-gradient-to-r ${THEME.primary} hover:shadow-lg transform hover:-translate-y-0.5`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader className="animate-spin" size={16} />
                <span>Loading</span>
              </div>
            ) : (
              <span>Load Data</span>
            )}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
            <div className="flex items-center">
              <Info size={14} className="mr-1 text-red-500" />
              {error}
            </div>
          </div>
        )}
      </section>
      
      {/* Main content based on active view */}
      {crops.length > 0 && (
        <div className="max-w-6xl mx-auto">
          {/* Planning View */}
          {activeView === 'plan' && (
            <section className={`${THEME.card} rounded-xl shadow-xl p-6 mb-8`}>
              <h2 className={`text-2xl font-semibold ${THEME.darkAccent} mb-6 flex items-center border-b pb-3`}>
                <Search className="mr-2" /> Find Crops to Plant
              </h2>
              
              {/* Search and category filter */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border-2 border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                    placeholder="Search for a crop..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setCropCategory(category.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        cropCategory === category.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Crop grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {filteredCrops.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-gray-500">
                    No crops match your search. Try different keywords.
                  </div>
                ) : (
                  filteredCrops.map((crop, index) => (
                    <div 
                      key={index} 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedCrop?.Crop === crop.Crop 
                          ? 'bg-emerald-50 border-emerald-500 shadow-md transform scale-105' 
                          : 'bg-white border-gray-100 hover:border-emerald-200'
                      }`}
                      onClick={() => handleCropSelect(crop)}
                    >
                      <div className="flex items-center">
                        <Leaf className={`mr-2 ${selectedCrop?.Crop === crop.Crop ? 'text-emerald-500' : 'text-emerald-300'}`} />
                        <h3 className="font-medium text-gray-800">{crop.Crop}</h3>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Crop details and planting form */}
              {selectedCrop && showForm && (
                <div id="planting-form" className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-6 border border-emerald-100 shadow-inner animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-medium text-emerald-800">{selectedCrop.Crop}</h3>
                    <button 
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Start Seeds Indoors</h4>
                      <p className="text-emerald-700 font-medium">{selectedCrop['Start Seeds Indoors'] || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Plant Seedlings</h4>
                      <p className="text-emerald-700 font-medium">{selectedCrop['Plant Seedlings'] || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Direct Sow</h4>
                      <p className="text-emerald-700 font-medium">{selectedCrop['Direct Sow/Plant'] || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="md:flex items-end space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        When do you plan to plant this?
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border-2 border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        value={plantingDate}
                        onChange={(e) => setPlantingDate(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={addCropToGarden}
                      className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                    >
                      <PlusCircle size={18} className="mr-2" />
                      Add to Garden
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
          
          {/* Garden View */}
          {activeView === 'garden' && (
            <section className={`${THEME.card} rounded-xl shadow-xl p-6 mb-8`}>
              <h2 className={`text-2xl font-semibold ${THEME.darkAccent} mb-6 flex items-center border-b pb-3`}>
                <Leaf className="mr-2" /> My Garden Plants
              </h2>
              
              {myGarden.length === 0 ? (
                <div className="text-center py-12 bg-emerald-50 rounded-xl">
                  <div className="inline-block p-3 bg-emerald-100 rounded-full mb-3">
                    <Leaf size={30} className="text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-medium text-emerald-800 mb-2">Your garden is empty</h3>
                  <p className="text-emerald-600 mb-4">Add some crops from the planning section</p>
                  <button 
                    onClick={() => setActiveView('plan')}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Start Planning
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Garden status summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                      <div className="font-medium text-emerald-800">Total Plants</div>
                      <div className="text-3xl font-bold text-emerald-700">{myGarden.length}</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="font-medium text-blue-800">Planted</div>
                      <div className="text-3xl font-bold text-blue-700">
                        {myGarden.filter(plant => plant.status === 'planted').length}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                      <div className="font-medium text-amber-800">Harvested</div>
                      <div className="text-3xl font-bold text-amber-700">
                        {myGarden.filter(plant => plant.status === 'harvested').length}
                      </div>
                    </div>
                  </div>
                  
                  {/* Plants list */}
                  {myGarden.map((item, index) => (
                    <div 
                      key={index} 
                      className={`rounded-lg p-5 transition-all ${
                        item.status === 'planted' ? 'bg-emerald-50 border-l-4 border-l-emerald-500' :
                        item.status === 'harvested' ? 'bg-amber-50 border-l-4 border-l-amber-500' :
                        'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="md:flex justify-between items-center">
                        <div className="flex items-center mb-3 md:mb-0">
                          <div className={`mr-3 p-2 rounded-full ${
                            item.status === 'planted' ? 'bg-emerald-100' :
                            item.status === 'harvested' ? 'bg-amber-100' :
                            'bg-gray-100'
                          }`}>
                            <Leaf className={`${
                              item.status === 'planted' ? 'text-emerald-600' :
                              item.status === 'harvested' ? 'text-amber-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-800 mb-1">{item.crop}</h3>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar size={14} className="mr-1" />
                              {item.planting_date}
                              <span className="mx-2">•</span>
                              {getStatusBadge(item.status)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-3 md:mt-0">
                          {item.status === 'planned' && (
                            <button 
                              onClick={() => updateCropStatus(item.id, 'planted')}
                              className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors text-sm"
                            >
                              Mark as Planted
                            </button>
                          )}
                          
                          {item.status === 'planted' && (
                            <button 
                              onClick={() => updateCropStatus(item.id, 'harvested')}
                              className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors text-sm"
                            >
                              Mark as Harvested
                            </button>
                          )}
                          
                          <button 
                            onClick={() => removeCrop(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Additional planting info - collapsible in mobile */}
                      <div className="mt-3 pl-10 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {item.planting_info.indoor_start && (
                          <div><span className="text-gray-500">Seeds Indoors:</span> {item.planting_info.indoor_start}</div>
                        )}
                        {item.planting_info.seedlings && (
                          <div><span className="text-gray-500">Seedlings:</span> {item.planting_info.seedlings}</div>
                        )}
                        {item.planting_info.direct_sow && (
                          <div><span className="text-gray-500">Direct Sow:</span> {item.planting_info.direct_sow}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          
           {/* Weather View */}
          {activeView === 'weather' && weather.length > 0 && (
            <section className={`${THEME.card} rounded-xl shadow-xl p-6 mb-8 animate-fade-in`}>
              <h2 className={`text-2xl font-semibold ${THEME.darkAccent} mb-6 flex items-center border-b pb-3`}>
                <Sun className="mr-2 text-yellow-500" /> 7-Day Weather Forecast
              </h2>
              
              {/* Weather alert banner with animation */}
              {shouldWaterToday() && (
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm animate-pulse">
                  <div className="flex">
                    <Droplet className="text-blue-600 mr-3 mt-0.5 animate-bounce" />
                    <div>
                      <h3 className="font-medium text-blue-700">Watering Recommended Today</h3>
                      <p className="text-blue-600">Your plants could use some water based on the current weather conditions.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Weather chart with enhanced styling */}
              <div className="mb-8 bg-gradient-to-br from-white to-blue-50 p-6 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all">
                <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                  <ThermometerSun className="text-amber-500 mr-2" />
                  Temperature & Precipitation Forecast
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weather} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { weekday: 'short' });
                      }}
                      stroke="#888"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      unit="°F" 
                      stroke="#f97316"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      unit="mm"
                      stroke="#3b82f6" 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '10px',
                      }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="temp_max" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                      name="High Temp"
                      dot={{ strokeWidth: 2, r: 4, stroke: '#fff', fill: '#f97316' }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="temp_min" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                      name="Low Temp"
                      dot={{ strokeWidth: 2, r: 4, stroke: '#fff', fill: '#10b981' }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="precipitation" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                      name="Precipitation"
                      strokeDasharray="5 5"
                      dot={{ strokeWidth: 2, r: 4, stroke: '#fff', fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Daily weather cards with interactive hover effects */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {weather.map((day, index) => (
                  <div 
                    key={index} 
                    className={`bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transform transition-all hover:shadow-md ${
                      index === 0 ? 'md:scale-105 border-emerald-200 ring-2 ring-emerald-200' : 'hover:scale-105'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`py-2 text-center font-medium text-white ${
                      index === 0 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                        : 'bg-gradient-to-r from-gray-600 to-gray-700'
                    }`}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      {index === 0 && <span className="ml-1 text-xs">(Today)</span>}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-center mb-2 transform transition-transform hover:scale-110">
                        {getWeatherIcon(day.condition)}
                      </div>
                      <div className="text-center text-sm mb-3 text-gray-700 font-medium">
                        {day.condition}
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="flex items-center text-red-500 font-medium">
                          <ThermometerSun size={14} className="mr-1" />
                          {Math.round(day.temp_max)}°
                        </span>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="flex items-center text-blue-500 font-medium">
                          <ThermometerSun size={14} className="mr-1" />
                          {Math.round(day.temp_min)}°
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-center text-xs p-1 rounded-full bg-gray-50">
                        <Droplet className={day.water_needed === "Yes" ? "text-blue-500" : "text-gray-300"} size={14} />
                        <span className={`ml-1 ${day.water_needed === "Yes" ? "text-blue-500 font-medium" : "text-gray-400"}`}>
                          {day.water_needed === "Yes" ? "Water plants" : "No watering needed"}
                        </span>
                      </div>
                      
                      {/* Additional weather info on hover */}
                      <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Precip:</span>
                          <span className="text-blue-600 font-medium">{day.precipitation}mm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Weather insights section */}
              <div className="mt-8 bg-blue-50 rounded-lg p-5 border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                  <Info className="text-blue-600 mr-2" />
                  Gardening Weather Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                    <h4 className="font-medium text-blue-700 mb-2">Temperature Trends</h4>
                    <p className="text-gray-700 text-sm">
                      The average high for the week is {Math.round(weather.reduce((sum, day) => sum + day.temp_max, 0) / weather.length)}°F.
                      {weather[0].temp_max > 85 ? 
                        " Today's high temperature may stress some plants. Consider providing shade or extra water." : 
                        " Current temperatures are within a good range for plant growth."}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                    <h4 className="font-medium text-blue-700 mb-2">Precipitation Outlook</h4>
                    <p className="text-gray-700 text-sm">
                      Total expected precipitation this week: {Math.round(weather.reduce((sum, day) => sum + day.precipitation, 0))}mm.
                      {weather.reduce((sum, day) => sum + day.precipitation, 0) < 10 ? 
                        " Low rainfall expected. Plan to water your garden regularly." : 
                        " Good rainfall expected. Monitor soil moisture to avoid overwatering."}
                    </p>
                  </div>
                </div>
                
                {/* Weather alert */}
                {weather.some(day => day.condition?.toLowerCase().includes('storm') || day.precipitation > 20) && (
                  <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <div className="flex">
                      <Info className="text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Weather Alert</h4>
                        <p className="text-yellow-700 text-sm">
                          Heavy rain or storms are predicted this week. Consider protecting delicate plants and ensuring good drainage.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}          {/* Planning View */}
          {activeView === 'plan' && (
            <section className={`${THEME.card} rounded-xl shadow-xl p-6 mb-8 animate-fade-in`}>
              <h2 className={`text-2xl font-semibold ${THEME.darkAccent} mb-6 flex items-center border-b pb-3`}>
                <Search className="mr-2" /> Find Crops to Plant
              </h2>
              
              {/* Search and category filter with animations */}
              <div className="mb-6 space-y-4">
                <div className="relative overflow-hidden rounded-lg shadow-md focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border-2 border-emerald-100 rounded-lg focus:outline-none transition-shadow"
                    placeholder="Search for a crop..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-3.5 text-emerald-400" size={18} />
                  
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {categories.map((category, index) => (
                    <button
                      key={category.id}
                      onClick={() => setCropCategory(category.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        cropCategory === category.id
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md scale-105'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:scale-105'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Crop grid with staggered animations */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {filteredCrops.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                    <Search className="mx-auto mb-3 text-gray-300" size={30} />
                    <p>No crops match your search. Try different keywords.</p>
                  </div>
                ) : (
                  filteredCrops.map((crop, index) => (
                    <div 
                      key={index} 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedCrop?.Crop === crop.Crop 
                          ? 'bg-emerald-50 border-emerald-500 shadow-md transform scale-105' 
                          : 'bg-white border-gray-100 hover:border-emerald-200'
                      } animate-fade-in`}
                      style={{ animationDelay: `${(index % 8) * 0.05}s` }}
                      onClick={() => handleCropSelect(crop)}
                    >
                      <div className="flex items-center">
                        <div className={`mr-2 p-1.5 rounded-full transition-colors ${
                          selectedCrop?.Crop === crop.Crop ? 'bg-emerald-100' : 'bg-gray-50'
                        }`}>
                          <Leaf className={`
                            ${selectedCrop?.Crop === crop.Crop ? 'text-emerald-500 animate-pulse' : 'text-emerald-300'}
                          `} />
                        </div>
                        <h3 className="font-medium text-gray-800">{crop.Crop}</h3>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Crop details and planting form with enhanced animations */}
              {selectedCrop && showForm && (
                <div id="planting-form" className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-6 border border-emerald-100 shadow-md animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 rounded-full mr-3">
                        <Leaf className="text-emerald-600 animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-medium text-emerald-800">{selectedCrop.Crop}</h3>
                    </div>
                    <button 
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Close details"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100 hover:border-emerald-300 transition-colors hover:shadow-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                        <Calendar size={14} className="text-emerald-500 mr-1" /> Start Seeds Indoors
                      </h4>
                      <p className="text-emerald-700 font-medium">{selectedCrop['Start Seeds Indoors'] || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100 hover:border-emerald-300 transition-colors hover:shadow-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                        <Leaf size={14} className="text-emerald-500 mr-1" /> Plant Seedlings
                      </h4>
                      <p className="text-emerald-700 font-medium">{selectedCrop['Plant Seedlings'] || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100 hover:border-emerald-300 transition-colors hover:shadow-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                        <Sparkles size={14} className="text-emerald-500 mr-1" /> Direct Sow
                      </h4>
                      <p className="text-emerald-700 font-medium">{selectedCrop['Direct Sow/Plant'] || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="md:flex items-end space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        When do you plan to plant this?
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          className="w-full pl-10 px-4 py-3 border-2 border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          value={plantingDate}
                          onChange={(e) => setPlantingDate(e.target.value)}
                        />
                        <Calendar className="absolute left-3 top-3 text-emerald-400" size={18} />
                      </div>
                    </div>
                    <button
                      onClick={addCropToGarden}
                      className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                    >
                      <PlusCircle size={18} className="mr-2" />
                      Add to Garden
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}
      
      {/* Empty state when no data */}
      {crops.length === 0 && !loading && (
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="inline-block p-4 bg-emerald-100 rounded-full mb-6">
            <Leaf size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-800 mb-4">Welcome to Your Garden Planner</h2>
          <p className="text-emerald-600 mb-10 max-w-lg mx-auto">
            Enter your ZIP code above to get personalized planting recommendations and weather forecasts for your area.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-2xl mx-auto">
            <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-emerald-100 rounded-full mr-3">
                  <Sun className="text-amber-500" size={20} />
                </div>
                <h3 className="font-medium text-gray-800">Weather Forecast</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Get a 7-day weather forecast to help plan your gardening activities.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-emerald-100 rounded-full mr-3">
                  <Calendar className="text-emerald-600" size={20} />
                </div>
                <h3 className="font-medium text-gray-800">Planting Calendar</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Know when to plant each crop based on your local growing conditions.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-emerald-100 rounded-full mr-3">
                  <Leaf className="text-emerald-600" size={20} />
                </div>
                <h3 className="font-medium text-gray-800">Garden Tracker</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Keep track of what you've planted and get reminders for care and harvesting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GardenPlanner;