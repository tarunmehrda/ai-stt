🎙️ Voice Business Onboarding System

Turn 15 minutes of typing into 2 minutes of talking using AI-powered voice onboarding.

A voice-driven system that lets business owners create their business profile and product catalog simply by speaking.

✨ Key Highlights

✔️ Voice → Text using AI
✔️ Auto-fills business details
✔️ Bulk product entry via speech
✔️ Smart unit & price detection
✔️ Edit, search, filter & export profiles

🧠 How It Works
🎤 User Speaks  
   ↓  
📝 Speech converted to text (Whisper)  
   ↓  
🤖 AI extracts structured data (LLM)  
   ↓  
📋 Editable business & product profile  
   ↓  
💾 Save • Search • Export PDF

🚀 Features
🏢 Phase 1 — Business Profile Voice Assistant

Voice recording with live visual feedback

Real-time speech-to-text transcription

AI extracts:

Business name

Address

Phone number

Category

Edit & confirm before saving

📦 Phase 2 — Product Catalog Voice Entry

Add multiple products in one recording

Smart detection of:

Units (kg, pcs, liters)

Prices (“per kg”, “each”, etc.)

Spoken numbers → digits

Easy product editing interface

🌟 Advanced System Features

Recording timer & animation feedback

Smooth responsive UI (mobile + desktop)

Search & filter saved business profiles

Export business profiles as PDF

Scrollable profile management dashboard

Friendly error handling & recovery

🛠 Tech Stack
🔙 Backend

Python + Flask

Whisper (Speech-to-Text)

Groq LLM (Llama 3.3 70B)

🎨 Frontend

React + TypeScript

HTML5 + CSS3

MediaRecorder API

Font Awesome Icons

🤖 AI Layer

Whisper (medium model)

LLM-based JSON field extraction

📦 Installation
1️⃣ Clone the Repository
git clone https://github.com/tarunmehrda/ai-stt.git
cd ai-stt

2️⃣ Install Dependencies
pip install -r requirements.txt

3️⃣ Add Environment Variables

Create a .env file:

GROQ_API_KEY=your_api_key_here

4️⃣ Run the App
python app.py


Open 👉 http://localhost:5000

🎤 Example Voice Inputs

Business Info

“Hi, I run Sree’s Grocery Store in Hyderabad near Jubilee Hills. My number is 9876543210. We sell vegetables and dairy products.”

Products

“Add products: Basmati rice 5 kg at 350 rupees, Toor dal 1 kg at 180, Tomatoes per kg 40 rupees.”

📊 Performance
Metric	Result
Field Extraction Accuracy	89.5%
Product Extraction Accuracy	89%
Avg Processing Time	3.4 sec
System Success Rate	94%
🧩 System Architecture
Browser Audio → Whisper STT → LLM Processing → JSON Output → UI Review → Save

🧪 Testing

Run the app and follow test scenarios in:

📄 test_cases.md

🐛 Troubleshooting
Issue	Solution
Mic not working	Enable browser microphone permission
Bad transcription	Speak clearly, reduce noise
API errors	Check GROQ_API_KEY in .env
Slow response	Restart app / close heavy apps
🌍 Browser Support

Chrome ✅ | Firefox ✅ | Safari ✅ | Edge ✅

🗺 Roadmap
🔜 v1.1

Multi-language support

Voice-guided tutorial

Undo / redo

Save partial progress

🔮 v1.2

Offline mode

Real-time live transcript

Voice feedback (TTS)

Analytics dashboard

🤝 Contributing

Pull requests are welcome!
Fork → Branch → Commit → Push → PR 🚀

📄 License

Ekthaa Technologies – Voice Onboarding Pilot Project

📬 Support

📧 careers@ekthaa.app
