import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found. Please set it in your .env file.")

genai.configure(api_key=GEMINI_API_KEY)

# --- Flask App Setup ---
app = Flask(__name__)
# Allow requests from your React frontend (which runs on a different port)
CORS(app)

# --- Gemini Model ---
# Initialize the generative model
model = genai.GenerativeModel('gemini-1.5-flash')

# --- API Endpoint ---
@app.route('/api/ask_gemini', methods=['POST'])
def ask_gemini():
    """
    API endpoint to get a response from the Gemini API.
    Accepts a POST request with a JSON body: {"prompt": "user's question"}
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({"error": "Missing 'prompt' in request body"}), 400

    try:
        # A simple prompt for the model
        full_prompt = f"You are Space Nova, a helpful AI assistant for space exploration. Answer the following question: {prompt}"
        
        # Send the prompt to the Gemini API
        response = model.generate_content(full_prompt)

        # Return the successful result
        return jsonify({"answer": response.text})

    except Exception as e:
        # Handle potential errors (e.g., API call failure)
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

# --- Main Execution ---
if __name__ == '__main__':
    print("🚀 Starting Space Nova Backend Server...")
    print("✅ Listening on: http://127.0.0.1:5000")
    # Run the Flask app
    app.run(port=5000, debug=True)