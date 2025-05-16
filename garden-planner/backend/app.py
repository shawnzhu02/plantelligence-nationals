import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import re
import json

# Determine if application is a script file or frozen exe
if getattr(sys, 'frozen', False):
    # Running as compiled app
    application_path = os.path.dirname(sys.executable)
else:
    # Running as script
    application_path = os.path.dirname(os.path.abspath(__file__))

# Change working directory to the app directory
os.chdir(application_path)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Reusing your existing functions
def get_planting_data(zipcode):
    # Your existing get_planting_data function here
    # Simplified version for example
    url = f"https://www.almanac.com/gardening/planting-calendar/zipcode/{zipcode}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the planting calendar table
        table = None
        for t in soup.find_all('table'):
            if 'seed-start-dates-table' in str(t.get('id', '')):
                table = t
                break
        
        if not table:
            raise ValueError("Could not find planting calendar table")
        
        # Parse table data
        data = []
        headers = None
        
        for row in table.find_all('tr'):
            cells = row.find_all(['td', 'th'])
            
            if not headers and cells:
                headers = [cell.text.strip() for cell in cells]
                continue
            
            if cells and headers:
                row_data = {}
                for j, cell in enumerate(cells):
                    if j < len(headers):
                        value = cell.text.strip()
                        header = headers[j]
                        if header and value:
                            row_data[header] = value
                
                if row_data:
                    data.append(row_data)
        
        # Convert to DataFrame and then to list of dictionaries
        df = pd.DataFrame(data)
        return df.to_dict('records')
        
    except Exception as e:
        raise Exception(f"Error processing data: {str(e)}")

def get_weather_forecast(zipcode):
    """Fetching forecast for next week from WeatherAPI"""
    api_key = '323edf790dc84924a9e13243251601'  # Use environment variables in production
    url = f"http://api.weatherapi.com/v1/forecast.json?key={api_key}&q={zipcode}&days=7"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        if response.status_code == 200:
            data = response.json()
            if 'forecast' in data:
                forecast_data = data['forecast']['forecastday']
                forecast = []
                for day in forecast_data:
                    forecast.append({
                        "date": day['date'],
                        "temp_max": day['day']['maxtemp_f'],
                        "temp_min": day['day']['mintemp_f'],
                        "precipitation": day['day']['totalprecip_mm'],
                        "condition": day['day']['condition']['text'],
                        "icon": day['day']['condition']['icon'],
                        "water_needed": "No" if day['day']['totalprecip_mm'] > 1.5 else "Yes"
                    })
                return forecast
            else:
                raise ValueError("No weather forecast data found for this ZIP code.")
        else:
            raise ValueError(f"Failed to fetch weather data: HTTP {response.status_code}")
    
    except Exception as e:
        raise Exception(f"Error fetching weather data: {str(e)}")

# API endpoints
@app.route('/api/planting-data/<zipcode>', methods=['GET'])
def api_get_planting_data(zipcode):
    try:
        data = get_planting_data(zipcode)
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/weather/<zipcode>', methods=['GET'])
def api_get_weather(zipcode):
    try:
        data = get_weather_forecast(zipcode)
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/garden', methods=['GET', 'POST'])
def api_garden():
    # In a real app, this would use a database
    garden_file = 'garden_data.json'
    
    if request.method == 'POST':
        # Add a new crop to the garden
        new_crop = request.json
        
        # Validate data
        if not new_crop or 'crop' not in new_crop or 'planting_date' not in new_crop:
            return jsonify({"success": False, "error": "Invalid crop data"}), 400
        
        # Load existing data
        garden_data = []
        if os.path.exists(garden_file):
            with open(garden_file, 'r') as f:
                garden_data = json.load(f)
        
        # Add new crop
        garden_data.append(new_crop)
        
        # Save data
        with open(garden_file, 'w') as f:
            json.dump(garden_data, f)
            
        return jsonify({"success": True, "data": garden_data})
    
    else:
        # Get all garden crops
        if os.path.exists(garden_file):
            with open(garden_file, 'r') as f:
                garden_data = json.load(f)
            return jsonify({"success": True, "data": garden_data})
        return jsonify({"success": True, "data": []})

if __name__ == '__main__':
    app.run(debug=False, port=5000)