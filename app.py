from flask import Flask, render_template, request, jsonify, redirect
from flask_cors import CORS
from faster_whisper import WhisperModel
from groq import Groq
from dotenv import load_dotenv
import json
import os
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

UPLOAD_FOLDER = "uploads"
DATA_FOLDER = "data"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# ================== WHISPER MODEL ==================
print("⏳ Loading Whisper model...")
model = WhisperModel("medium", device="cpu", compute_type="int8")
print("✅ Whisper ready!")

# ================== GROQ SETUP ==================
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ================== SESSION TRACKING ==================
CURRENT_SESSION_FILE = None
CURRENT_SESSION_FILENAME = None

# ================== BUSINESS EXTRACTION ==================
def extract_business_info(text):
    try:
        # Try GROQ API first
        prompt = f"""
Extract comprehensive business details from this English speech:

"{text}"

Return ONLY JSON:
{{
  "personName": "",
  "name": "",
  "address": "",
  "city": "",
  "state": "",
  "pincode": "",
  "gstNumber": "",
  "category": "",
  "subcategory": "",
  "email": "",
  "phone": "",
  "website": "",
  "establishedYear": "",
  "products": []
}}
Rules:
- Extract person name, business name, address, city, state, pincode, GST number, category, subcategory, email, phone, website, established year
- Categories: Retail, Food & Restaurant, Services, Manufacturing, Healthcare, Education, Technology, Agriculture, Textile, Automotive, Electronics, Real Estate, Construction, Tourism, Logistics, Finance, Consulting
- If any field is not mentioned, leave it empty
- Extract phone numbers as 10-digit numbers (remove country codes if present)
- Extract email addresses with @ symbol
- Extract GST numbers (15-digit alphanumeric starting with digits)
- Extract pincode as 6-digit numbers
- Extract website URLs (with http/https or www)
- Extract established year (4-digit numbers between 1900-2024)
- If products are mentioned, include them as simple strings in the products array
- Focus on clear English business information only
- Make sure the response is valid JSON format only, without any extra text before or after the JSON
"""
        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"user","content":prompt}],
            temperature=0
        )
        content = res.choices[0].message.content
        
        # Find the JSON in the response
        start_idx = content.find("{")
        end_idx = content.rfind("}")
        
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            json_str = content[start_idx:end_idx+1]
            return json.loads(json_str)
        else:
            # If we can't find a JSON object, return a default structure
            return {
                "personName": "",
                "name": "",
                "address": "",
                "city": "",
                "state": "",
                "pincode": "",
                "gstNumber": "",
                "category": "",
                "subcategory": "",
                "email": "",
                "phone": "",
                "website": "",
                "establishedYear": "",
                "products": []
            }
    except Exception as e:
        print(f"API Error: {e}")
        # Fallback to basic text extraction from transcription
        return extract_business_info_fallback(text)

def extract_business_info_fallback(text):
    """Fallback function to extract business info from transcription using basic text processing"""
    import re
    
    # Initialize result
    result = {
        "personName": "",
        "name": "",
        "address": "",
        "city": "",
        "state": "",
        "pincode": "",
        "gstNumber": "",
        "category": "",
        "subcategory": "",
        "email": "",
        "phone": "",
        "website": "",
        "establishedYear": "",
        "products": []
    }
    
    # Convert to lowercase for processing
    text_lower = text.lower()
    
    # Extract state (look for common Indian states)
    states = ["andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh", "goa", "gujarat", "haryana", "himachal pradesh", "jammu & kashmir", "jharkhand", "karnataka", "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu", "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal", "chandigarh", "delhi", "hyderabad", "bangalore", "mumbai", "chennai", "kolkata", "pune", "jaipur", "lucknow"]
    for state in states:
        if state in text_lower:
            result["state"] = state.title()
            break
    
    # Extract pincode (6-digit patterns)
    pincode_pattern = r'\b(\d{6})\b'
    pincodes = re.findall(pincode_pattern, text_lower)
    if pincodes:
        result["pincode"] = pincodes[0]
    
    # Extract GST number (15-digit alphanumeric starting with digits)
    gst_pattern = r'\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z\d{1})\b'
    gst_matches = re.findall(gst_pattern, text.upper())
    if gst_matches:
        result["gstNumber"] = gst_matches[0]
    
    # Extract email addresses
    email_pattern = r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b'
    emails = re.findall(email_pattern, text_lower)
    if emails:
        result["email"] = emails[0]
    
    # Extract website URLs
    website_pattern = r'\b((?:https?://|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b'
    websites = re.findall(website_pattern, text_lower)
    if websites:
        result["website"] = websites[0]
    
    # Extract established year (4-digit numbers between 1900-2024)
    year_pattern = r'\b(19[0-9]{2}|20[0-2][0-4])\b'
    years = re.findall(year_pattern, text_lower)
    for year in years:
        # Check if it's likely an establishment year (context keywords)
        context_words = ["established", "founded", "started", "since", "year"]
        if any(word in text_lower for word in context_words):
            result["establishedYear"] = year
            break
    
    # Extract city (look for common city names)
    cities = ["chandigarh", "hyderabad", "bangalore", "delhi", "mumbai", "chennai", "kolkata", "pune", "jaipur", "lucknow", "ahmedabad", "surat", "nagpur", "indore", "thane", "bhopal", "visakhapatnam", "pimpri", "patna", "vadodara", "ghaziabad", "ludhiana", "agra", "nashik", "faridabad", "meerut", "rajkot", "kalyan", "vasai", "varanasi", "srinagar", "aurangabad", "dhanbad", "amritsar", "navi mumbai", "allahabad", "ranchi", "howrah", "coimbatore", "jabalpur", "gwalior", "vijayawada", "jodhpur", "madurai", "raipur", "kota", "guwahati", "chandigarh", "hubli", "dharwad", "mysore"]
    for city in cities:
        if city in text_lower:
            result["city"] = city.title()
            break
    
    # Extract phone numbers (10-digit patterns)
    phone_pattern = r'\b(\d{10})\b'
    phones = re.findall(phone_pattern, text_lower)
    if phones:
        result["phone"] = phones[0]
    
    # Extract person name (look for patterns like "my name is", "I am", etc.)
    person_patterns = [
        r'(?:my name is|i am|this is)\s+([a-zA-Z\s]+?)(?:\s+(?:and|so|feed|my|i))',
        r'(?:i\'m|i am)\s+([a-zA-Z\s]+?)(?:\s+(?:and|so|feed|my))',
    ]
    
    for pattern in person_patterns:
        match = re.search(pattern, text_lower)
        if match:
            name = match.group(1).strip().title()
            if len(name) > 2 and len(name) < 50:
                result["personName"] = name
                break
    
    # Extract business name (look for patterns like "my business is", "we are", "my name is", etc.)
    name_patterns = [
        r'(?:my name is|my business is|i own|we are|this is)\s+([a-zA-Z\s]+?)(?:\s+(?:in|at|and|located|so|feed))',
        r'business\s+name\s+is\s+([a-zA-Z\s]+?)(?:\s+(?:and|we|located))',
        r'we\s+are\s+([a-zA-Z\s]+?)(?:\s+(?:and|we|located|in))',
        r'name\s+is\s+([a-zA-Z\s]+?)(?:\s+(?:and|so|feed))'
    ]
    
    for pattern in name_patterns:
        match = re.search(pattern, text_lower)
        if match:
            name = match.group(1).strip().title()
            if len(name) > 2 and len(name) < 50:
                result["name"] = name
                break
    
    # Extract address (look for address patterns)
    address_patterns = [
        r'(?:located|address|at|in)\s+([a-zA-Z0-9\s,]+?)(?:\s+(?:city|and|we|phone|state))',
        r'address\s+is\s+([a-zA-Z0-9\s,]+?)(?:\s+(?:city|and|we|phone|state))'
    ]
    
    for pattern in address_patterns:
        match = re.search(pattern, text_lower)
        if match:
            address = match.group(1).strip().title()
            if len(address) > 3 and len(address) < 100:
                result["address"] = address
                break
    
    # Extract category
    categories = {
        "retail": ["retail", "shop", "store", "grocery", "market", "supermarket"],
        "food & restaurant": ["food", "restaurant", "cafe", "hotel", "eatery", "sweet", "treat", "bakery"],
        "services": ["service", "consulting", "repair", "maintenance"],
        "manufacturing": ["manufacturing", "factory", "production"],
        "healthcare": ["health", "medical", "hospital", "clinic", "pharmacy"],
        "education": ["education", "school", "college", "tuition", "institute"],
        "technology": ["tech", "software", "computer", "it"],
        "agriculture": ["agriculture", "farming", "crops", "seeds"],
        "textile": ["textile", "clothing", "garments", "fashion"],
        "automotive": ["automotive", "car", "vehicle", "motor"]
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in text_lower:
                result["category"] = category.title()
                break
        if result["category"]:
            break
    
    # Extract products (simple keyword matching)
    product_keywords = ["vegetable", "fruit", "rice", "milk", "bread", "sweet", "snack", "food", "grocery"]
    found_products = []
    
    for keyword in product_keywords:
        if keyword in text_lower:
            # Handle plural forms
            if keyword.endswith('y'):
                plural = keyword[:-1] + 'ies'
            else:
                plural = keyword + 's'
            
            # Check both singular and plural
            if keyword in text_lower:
                found_products.append(keyword.title())
            elif plural in text_lower:
                found_products.append(plural.title())
    
    result["products"] = found_products[:3]  # Limit to 3 products
    
    return result

# ================== PRODUCT EXTRACTION ==================
def extract_products(text):
    try:
        prompt = f"""
Extract comprehensive product list from this speech. The speech may be in English only english.

"{text}"

Return ONLY JSON ARRAY:
[
  {{"name":"","price":0,"category":"","description":"","unit":"","quantity":0}}
]
Rules:
- English only english speech processing
- Listen carefully for quantities like "2 kg", "1 kg", "500 grams", "5 pcs", "3 liters" and extract the unit and quantity
- Listen VERY carefully for prices like "250 rupees", "120 rupees per kg", "50 rupees each", "at 100", "costs 50", "price 30" and extract the NUMERIC price only
- Extract product categories (Food, Electronics, Clothing, Books, Toys, Home & Kitchen, Sports, Beauty, Health, etc.)
- Extract product descriptions (quality, features, specifications, brand details)
- Listen for quantity numbers (2, 5, 10, etc.) and separate from unit
- Common units: kg, grams, pcs, pieces, liters, ml, dozen, packet, bottle, box, set, meter, cm, inch
- If no unit is mentioned, use "pcs"
- If no price is mentioned, use 0
- If no quantity is mentioned, use 1
- Convert spoken numbers to digits (two -> 2, five -> 5, ten -> 10, twenty -> 20, fifty -> 50, hundred -> 100)
- "per kg" = unit kg, "each" = unit pcs, "per piece" = unit pcs, "per liter" = unit liters
- Focus on clear English product names and information only
- Handle multiple products in the same speech
- Extract product names exactly as spoken (brand names, variations, etc)
- IMPORTANT: Extract actual price numbers, don't default to 1 or 0 unless no price is mentioned
"""
        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"user","content":prompt}],
            temperature=0
        )
        content = res.choices[0].message.content
        json_str = content[content.find("["):content.rfind("]")+1]
        return json.loads(json_str)
    except Exception as e:
        print(f"Product API Error: {e}")
        # Fallback to basic product extraction from transcription
        return extract_products_fallback(text)

def extract_products_fallback(text):
    """Fallback function to extract products from transcription using basic text processing"""
    import re
    
    text_lower = text.lower()
    products = []
    
    # Look for product patterns with quantities and prices - improved patterns
    product_patterns = [
        # Pattern: product + quantity + unit + price (e.g., "2 kg tomatoes 50 rupees")
        r'(\d+)\s+(kg|grams|pcs|pieces|liter|litre|dozen|packet|bottle|box)\s+(\w+)\s+(?:at|@|for|rupees?|rs\.?|₹)\s*(\d+)',
        # Pattern: product + unit + price (e.g., "tomatoes kg 50 rupees")
        r'(\w+)\s+(kg|grams|pcs|pieces|liter|litre|dozen|packet|bottle|box)\s+(?:at|@|for|rupees?|rs\.?|₹)\s*(\d+)',
        # Pattern: product + price + unit (e.g., "tomatoes 50 rupees per kg")
        r'(\w+)\s+(?:at|@|for|rupees?|rs\.?|₹)\s*(\d+)\s+(?:per\s+)?(kg|grams|pcs|pieces|liter|litre|dozen|packet|bottle|box)',
        # Pattern: product + price only (e.g., "tomatoes 50 rupees")
        r'(\w+)\s+(?:at|@|for|rupees?|rs\.?|₹)\s*(\d+)',
        # Pattern: quantity + product (e.g., "2 kg tomatoes")
        r'(\d+)\s+(kg|grams|pcs|pieces|liter|litre|dozen|packet|bottle|box)\s+(\w+)',
        # Pattern: simple product mentions
        r'(\w+)(?:\s+(?:kg|grams|pcs|pieces|liter|litre|dozen|packet|bottle|box))?',
    ]
    
    # Common product keywords
    product_keywords = [
        "tomato", "potato", "onion", "vegetable", "fruit", "rice", "wheat", "flour",
        "milk", "bread", "egg", "chicken", "meat", "fish", "sugar", "salt", "oil",
        "tea", "coffee", "butter", "cheese", "curd", "sweet", "snack", "chocolate",
        "biscuit", "soap", "shampoo", "toothpaste", "detergent", "paper", "pen"
    ]
    
    # Product categories mapping
    category_keywords = {
        "Food": ["tomato", "potato", "onion", "vegetable", "fruit", "rice", "wheat", "flour", "milk", "bread", "egg", "chicken", "meat", "fish", "sugar", "salt", "oil", "tea", "coffee", "butter", "cheese", "curd", "sweet", "snack", "chocolate", "biscuit"],
        "Electronics": ["phone", "laptop", "computer", "tablet", "camera", "tv", "headphone", "speaker"],
        "Clothing": ["shirt", "pants", "dress", "jeans", "t-shirt", "jacket", "shoes", "socks"],
        "Home & Kitchen": ["soap", "shampoo", "toothpaste", "detergent", "paper", "pen", "plate", "cup", "bowl"],
        "Books": ["book", "notebook", "pen", "paper"],
        "Toys": ["toy", "game", "puzzle", "doll"],
        "Sports": ["ball", "bat", "racket", "shoes", "equipment"],
        "Beauty": ["lipstick", "cream", "makeup", "perfume", "shampoo", "soap"],
        "Health": ["medicine", "tablet", "vitamin", "cream", "oil"]
    }
    
    # Extract products using patterns
    extracted_names = set()
    
    for pattern in product_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            if isinstance(match, tuple):
                if len(match) == 4:  # quantity, unit, product, price
                    quantity, unit, name, price = match
                    if name not in extracted_names:
                        extracted_names.add(name)
                        category = get_product_category(name, category_keywords)
                        products.append({
                            "name": name.title(),
                            "price": int(price),
                            "category": category,
                            "description": f"Fresh {name.title()}",
                            "unit": unit,
                            "quantity": int(quantity)
                        })
                elif len(match) == 3:  # product, unit, price OR product, price, unit
                    if match[1].isdigit():  # product, price, unit
                        name, price, unit = match
                        if name not in extracted_names:
                            extracted_names.add(name)
                            category = get_product_category(name, category_keywords)
                            products.append({
                                "name": name.title(),
                                "price": int(price),
                                "category": category,
                                "description": f"Fresh {name.title()}",
                                "unit": unit,
                                "quantity": 1
                            })
                    else:  # product, unit, price
                        name, unit, price = match
                        if name not in extracted_names:
                            extracted_names.add(name)
                            category = get_product_category(name, category_keywords)
                            products.append({
                                "name": name.title(),
                                "price": int(price),
                                "category": category,
                                "description": f"Fresh {name.title()}",
                                "unit": unit,
                                "quantity": 1
                            })
                elif len(match) == 2:  # quantity, unit, product OR product, price
                    if match[0].isdigit():  # quantity, unit, product
                        quantity, unit, name = match
                        if name not in extracted_names:
                            extracted_names.add(name)
                            category = get_product_category(name, category_keywords)
                            products.append({
                                "name": name.title(),
                                "price": 0,
                                "category": category,
                                "description": f"Fresh {name.title()}",
                                "unit": unit,
                                "quantity": int(quantity)
                            })
                    else:  # product, price
                        name, price = match
                        if name not in extracted_names:
                            extracted_names.add(name)
                            category = get_product_category(name, category_keywords)
                            products.append({
                                "name": name.title(),
                                "price": int(price),
                                "category": category,
                                "description": f"Fresh {name.title()}",
                                "unit": "pcs",
                                "quantity": 1
                            })
            else:  # single match
                name = match.strip()
                if len(name) > 2 and name not in extracted_names:
                    extracted_names.add(name)
                    category = get_product_category(name, category_keywords)
                    products.append({
                        "name": name.title(),
                        "price": 0,
                        "category": category,
                        "description": f"Fresh {name.title()}",
                        "unit": "pcs",
                        "quantity": 1
                    })
    
    # Also look for product keywords directly
    for keyword in product_keywords:
        if keyword in text_lower and keyword not in extracted_names:
            extracted_names.add(keyword)
            category = get_product_category(keyword, category_keywords)
            products.append({
                "name": keyword.title(),
                "price": 0,
                "category": category,
                "description": f"Fresh {keyword.title()}",
                "unit": "pcs",
                "quantity": 1
            })
    
    # Remove duplicates and limit results
    unique_products = []
    seen = set()
    for product in products:
        key = (product["name"], product["unit"])
        if key not in seen:
            seen.add(key)
            unique_products.append(product)
    
    return unique_products[:5]  # Limit to 5 products

def get_product_category(product_name, category_keywords):
    """Helper function to determine product category"""
    product_lower = product_name.lower()
    for category, keywords in category_keywords.items():
        for keyword in keywords:
            if keyword in product_lower:
                return category
    return "General"  # Default category

# ================== TRANSCRIPTION ==================
def transcribe_audio(path):
    segments, _ = model.transcribe(path, beam_size=5, language="en")
    return " ".join(seg.text.strip() for seg in segments)

# ================== ROUTES ==================
@app.route("/")
def index():
    # Redirect to React app instead of serving HTML template
    return redirect("http://localhost:3000")

@app.route("/api")
def api_info():
    return jsonify({
        "message": "Flask API is running",
        "react_app": "http://localhost:3000",
        "endpoints": [
            "/upload_business_audio",
            "/upload_product_audio", 
            "/save",
            "/get_sessions",
            "/get_session/<filename>",
            "/delete_session/<filename>"
        ]
    })

# -------- PHASE 1 --------
@app.route("/upload_business_audio", methods=["POST"])
def upload_business_audio():
    global CURRENT_SESSION_FILE
    try:
        print("🎤 Received business audio upload request")
        
        if 'audio' not in request.files:
            print("❌ No audio file in request")
            return jsonify({"error": "No audio file provided"}), 400
            
        audio = request.files["audio"]
        if audio.filename == '':
            print("❌ Empty audio filename")
            return jsonify({"error": "No audio file selected"}), 400
            
        print(f"📁 Audio file received: {audio.filename}")
        
        path = os.path.join(UPLOAD_FOLDER, "business_audio.webm")
        audio.save(path)
        print(f"💾 Audio saved to: {path}")

        print("🔍 Starting transcription...")
        transcript = transcribe_audio(path)
        print(f"📝 Transcription completed: {transcript[:100]}...")
        
        print("🤖 Starting business info extraction...")
        data = extract_business_info(transcript)
        print(f"✅ Extraction completed: {data}")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        CURRENT_SESSION_FILENAME = f"session_{timestamp}.json"
        CURRENT_SESSION_FILE = os.path.join(DATA_FOLDER, CURRENT_SESSION_FILENAME)

        # Ensure products is always an array of objects for consistent structure
        products = data.get("products", [])
        formatted_products = []
        for item in products:
            if isinstance(item, str):
                # Convert simple string to object format with new fields
                formatted_products.append({
                    "name": item,
                    "price": 0,
                    "category": "",
                    "description": f"Fresh {item}",
                    "unit": "",
                    "quantity": 1
                })
            elif isinstance(item, dict):
                # Already in object format, ensure it has required fields
                formatted_products.append({
                    "name": item.get("name", ""),
                    "price": item.get("price", 0),
                    "category": item.get("category", ""),
                    "description": item.get("description", ""),
                    "unit": item.get("unit", ""),
                    "quantity": item.get("quantity", 1)
                })
            else:
                # Fallback for unexpected formats
                formatted_products.append({
                    "name": str(item),
                    "price": 0,
                    "category": "",
                    "description": f"Fresh {item}",
                    "unit": "",
                    "quantity": 1
                })

        final_json = {
            "personName": data.get("personName", ""),
            "name": data.get("name", ""),
            "address": data.get("address", ""),
            "city": data.get("city", ""),
            "state": data.get("state", ""),
            "pincode": data.get("pincode", ""),
            "gstNumber": data.get("gstNumber", ""),
            "category": data.get("category", ""),
            "subcategory": data.get("subcategory", ""),
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "website": data.get("website", ""),
            "establishedYear": data.get("establishedYear", ""),
            "products": formatted_products  # structured as objects with new fields
        }

        with open(CURRENT_SESSION_FILE, "w") as f:
            json.dump(final_json, f, indent=4)
        
        print(f"💾 Session saved to: {CURRENT_SESSION_FILE}")

        return jsonify({
            "data": final_json, 
            "filename": CURRENT_SESSION_FILENAME,
            "transcription": transcript
        })
        
    except Exception as e:
        print(f"❌ Error in upload_business_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# -------- PHASE 2 --------
@app.route("/upload_product_audio", methods=["POST"])
def upload_product_audio():
    global CURRENT_SESSION_FILE, CURRENT_SESSION_FILENAME
    try:
        print("🛒 Received product audio upload request")
        
        # If no business session exists, create one for products only
        if not CURRENT_SESSION_FILE:
            print("📝 No business session found, creating new session for products")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            CURRENT_SESSION_FILENAME = f"session_{timestamp}.json"
            CURRENT_SESSION_FILE = os.path.join(DATA_FOLDER, CURRENT_SESSION_FILENAME)
            
            # Create a basic business structure with new fields
            basic_session = {
                "personName": "",
                "name": "",
                "address": "",
                "city": "",
                "state": "",
                "pincode": "",
                "gstNumber": "",
                "category": "",
                "subcategory": "",
                "email": "",
                "phone": "",
                "website": "",
                "establishedYear": "",
                "products": []
            }
            
            with open(CURRENT_SESSION_FILE, "w") as f:
                json.dump(basic_session, f, indent=4)
            
            print(f"📁 Created new session: {CURRENT_SESSION_FILE}")

        if 'audio' not in request.files:
            print("❌ No audio file in request")
            return jsonify({"error": "No audio file provided"}), 400
            
        audio = request.files["audio"]
        if audio.filename == '':
            print("❌ Empty audio filename")
            return jsonify({"error": "No audio file selected"}), 400
            
        print(f"📁 Audio file received: {audio.filename}")

        path = os.path.join(UPLOAD_FOLDER, "product_audio.webm")
        audio.save(path)
        print(f"💾 Audio saved to: {path}")

        print("🔍 Starting transcription...")
        transcript = transcribe_audio(path)
        print(f"📝 Transcription completed: {transcript[:100]}...")
        
        print("🤖 Starting product extraction...")
        products = extract_products(transcript)  # detailed objects
        print(f"✅ Product extraction completed: {products}")

        with open(CURRENT_SESSION_FILE, "r") as f:
            session_data = json.load(f)

        # 🔁 Append new products to existing products instead of replacing them completely
        # Preserve any existing products from phase 1 and combine with new products from phase 2
        existing_products = session_data.get("products", [])
        combined_products = existing_products + products

        # Update the session data with combined products
        session_data["products"] = combined_products

        with open(CURRENT_SESSION_FILE, "w") as f:
            json.dump(session_data, f, indent=4)
        
        print(f"💾 Session updated with products: {CURRENT_SESSION_FILE}")

        return jsonify({
            "data": session_data, 
            "filename": CURRENT_SESSION_FILENAME,
            "transcription": transcript
        })
        
    except Exception as e:
        print(f"❌ Error in upload_product_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# -------- SAVE EDITED JSON --------
@app.route("/save", methods=["POST"])
def save_edited_data():
    data = request.json
    filename = data.get("filename")
    session_data = data.get("data")
    
    if not filename or not session_data:
        return jsonify({"error": "Missing filename or data"}), 400
    
    file_path = os.path.join(DATA_FOLDER, filename)
    
    with open(file_path, "w") as f:
        json.dump(session_data, f, indent=4)
    
    return jsonify({"success": True, "message": "Data saved successfully"})

# -------- VIEW FINAL JSON --------
@app.route("/editor")
def editor():
    files = sorted(os.listdir(DATA_FOLDER))
    if not files:
        return "No sessions found"

    with open(os.path.join(DATA_FOLDER, files[-1])) as f:
        data = json.load(f)

    return jsonify(data)

@app.route("/get_session/<filename>")
def get_session(filename):
    file_path = os.path.join(DATA_FOLDER, filename)
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            data = json.load(f)
        return jsonify(data)
    else:
        return jsonify({"error": "Session file not found"}), 404

@app.route("/get_sessions")
def get_sessions():
    try:
        files = sorted(os.listdir(DATA_FOLDER))
        sessions = []
        
        for filename in files:
            if filename.endswith('.json'):
                file_path = os.path.join(DATA_FOLDER, filename)
                try:
                    with open(file_path, "r") as f:
                        data = json.load(f)
                        sessions.append({
                            "filename": filename,
                            "data": data
                        })
                except Exception as e:
                    print(f"Error reading file {filename}: {e}")
                    continue
        
        return jsonify(sessions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/delete_session/<filename>", methods=["DELETE"])
def delete_session(filename):
    try:
        file_path = os.path.join(DATA_FOLDER, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({"success": True, "message": "Session deleted successfully"})
        else:
            return jsonify({"error": "Session file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================== RUN ==================
if __name__ == "__main__":
    app.run(debug=True)
