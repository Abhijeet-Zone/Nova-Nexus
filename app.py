# -----------------------------------------------------------------------------
# INTERACTIVE SPACE FATIGUE - BACKEND SERVER
# -----------------------------------------------------------------------------
# This script runs a Flask web server that provides an API endpoint to analyze
# astronaut telemetry data using the Google Gemini API.
#
# --- SETUP INSTRUCTIONS ---
# 1. Save this file as `app.py`.
#
# 2. Create a file named `.env` in the same directory and add your API key:
#    GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
#
# 3. Install required libraries via pip:
#    pip install Flask Flask-Cors google-generativeai python-dotenv
#
# 4. Run the server from your terminal:
#    python app.py
#
# The server will start on http://127.0.0.1:5000.
# -----------------------------------------------------------------------------

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

# --- 1. CONFIGURATION ---

# Load environment variables from the .env file
load_dotenv()

# Get the Gemini API Key from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found. Please set it in your .env file.")

# Configure the Gemini client library
genai.configure(api_key=GEMINI_API_KEY)

# Define the model and server port
MODEL_NAME = 'gemini-1.5-flash'
PORT = 5000

# --- 2. FLASK APPLICATION SETUP ---

# Initialize the Flask app
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing (CORS) to allow the frontend
# to communicate with this backend server.
CORS(app)

# --- 3. GEMINI MODEL AND PROMPT ENGINEERING ---

# Initialize the generative model
model = genai.GenerativeModel(MODEL_NAME)

# This detailed prompt instructs the AI on how to behave, what data to expect,
# the rules for analysis, and the exact format for the output.
PROMPT_TEMPLATE = """
You are a sophisticated AI model for monitoring astronaut health, specializing in fatigue analysis for the "Interactive Space Fatigue" program.

Your task is to analyze telemetry data and return a precise JSON object.

**Input Data:**
- Heart Rate (HR): {hr} bpm (Normal resting: 50-80. Elevated > 90 indicates stress/exertion.)
- Heart Rate Variability (HRV): {hrv} ms (Normal: 40-80. Lower < 35 indicates high stress/fatigue.)
- Blood Oxygen (SpO₂): {spo2}% (Normal: 95-100%. Below 94% is a concern.)
- Sleep Duration: {sleep} hours (Optimal: 7-9. Below 6.5 is insufficient.)
- Activity Level: {activity}/10 (A subjective score of recent workload intensity.)

**Analysis Rules:**
1.  **Calculate `fatigueScore`**: A single integer from 0 (Optimal) to 100 (Critical).
    - Low HRV, low sleep, and high HR are strong indicators of fatigue.
    - High activity level amplifies the effect of other negative indicators.
    - Low SpO₂ is a critical factor and should heavily increase the score.
2.  **Determine `fatigueState`**: A single string based on the score.
    - 0-20: 'Optimal'
    - 21-40: 'Low'
    - 41-60: 'Moderate'
    - 61-80: 'High'
    - 81-100: 'Critical'
3.  **Generate `alerts`**: A JSON array of alert objects for any metric outside the ideal range.
    - Each alert must have `metric`, `level` ('amber' for caution, 'red' for critical), and a `message`.
    - If all vitals are optimal, return an empty array `[]`.

**CRITICAL INSTRUCTION:** Your response MUST be a valid JSON object ONLY, with no extra text, explanations, or markdown formatting.

**JSON Output Structure Example:**
```json
{{
  "fatigueScore": 68,
  "fatigueState": "High",
  "alerts": [
    {{ "metric": "HRV", "level": "red", "message": "HRV is critically low, indicating significant physiological stress or fatigue." }},
    {{ "metric": "Sleep", "level": "amber", "message": "Sleep duration is below the optimal range, impacting recovery." }}
  ]
}}
```

**Analyze the following data and provide the JSON output:**
HR: {hr}, HRV: {hrv}, SpO₂: {spo2}, Sleep: {sleep}, Activity: {activity}
"""

# --- 4. API ENDPOINT ---

@app.route('/api/calculate_fatigue', methods=['POST'])
def calculate_fatigue():
    """
    API endpoint to calculate fatigue based on telemetry data.
    Accepts a POST request with a JSON body.
    """
    # Check if the request contains JSON data
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()

    # Basic validation for required keys
    required_keys = ['hr', 'hrv', 'spo2', 'sleep', 'activity']
    if not all(key in data for key in required_keys):
        return jsonify({"error": "Missing one or more required fields: hr, hrv, spo2, sleep, activity"}), 400

    try:
        # Format the master prompt with the data from the request
        prompt = PROMPT_TEMPLATE.format(
            hr=data.get('hr', 0),
            hrv=data.get('hrv', 0),
            spo2=data.get('spo2', 0),
            sleep=data.get('sleep', 0),
            activity=data.get('activity', 0)
        )

        # Send the prompt to the Gemini API
        response = model.generate_content(prompt)

        # The model might wrap the JSON in markdown backticks. Clean it up.
        cleaned_response_text = response.text.strip().replace('```json', '').replace('```', '').strip()

        # Parse the cleaned text into a Python dictionary
        result = json.loads(cleaned_response_text)

        # Return the successful result
        return jsonify(result)

    except json.JSONDecodeError:
        # Handle cases where the model's output is not valid JSON
        print(f"Error: Failed to decode JSON from model response: {cleaned_response_text}")
        return jsonify({"error": "An error occurred while parsing the AI model's response."}), 500
    except Exception as e:
        # Handle other potential errors (e.g., API call failure)
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

# --- 5. MAIN EXECUTION ---

if __name__ == '__main__':
    print("-----------------------------------------------------")
    print(f"🚀 Starting Space Fatigue Backend Server...")
    print(f"✅ Model: {MODEL_NAME}")
    print(f"✅ Listening on: http://127.0.0.1:{PORT}")
    print("-----------------------------------------------------")
    # Run the Flask app in debug mode for development
    app.run(port=PORT, debug=True)
