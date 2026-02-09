# 🎙️ Voice Business Onboarding System

[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)

**Turn 15 minutes of typing into 2 minutes of talking using AI-powered voice onboarding.**

A voice-driven system that lets business owners create their business profile and product catalog simply by speaking. No more tedious form filling—just talk naturally and let AI do the work.

![Voice Onboarding Demo](assets/demo.gif)

---

## ✨ Key Highlights

✅ **Voice → Text using AI** - Powered by Whisper  
✅ **Auto-fills business details** - Smart extraction with LLM  
✅ **Bulk product entry via speech** - Add multiple products at once  
✅ **Smart unit & price detection** - Understands kg, pcs, liters, prices  
✅ **Edit, search, filter & export profiles** - Complete management system

---

## 🧠 How It Works

```
🎤 User Speaks  
   ↓  
📝 Speech converted to text (Whisper)  
   ↓  
🤖 AI extracts structured data (LLM)  
   ↓  
📋 Editable business & product profile  
   ↓  
💾 Save • Search • Export PDF
```

---

## 🚀 Features

### 🏢 Phase 1 — Business Profile Voice Assistant

- **Voice recording with live visual feedback**
- **Real-time speech-to-text transcription**
- **AI extracts:**
  - Business name
  - Address
  - Phone number
  - Category
- **Edit & confirm before saving**

### 📦 Phase 2 — Product Catalog Voice Entry

- **Add multiple products in one recording**
- **Smart detection of:**
  - Units (kg, pcs, liters)
  - Prices ("per kg", "each", etc.)
  - Spoken numbers → digits
- **Easy product editing interface**

### 🌟 Advanced System Features

- Recording timer & animation feedback
- Smooth responsive UI (mobile + desktop)
- Search & filter saved business profiles
- Export business profiles as PDF
- Scrollable profile management dashboard
- Friendly error handling & recovery

---

## 🛠 Tech Stack

### 🔙 Backend
- **Python** + **Flask**
- **Whisper** (Speech-to-Text)
- **Groq LLM** (Llama 3.3 70B)

### 🎨 Frontend
- **React** + **TypeScript**
- **HTML5** + **CSS3**
- **MediaRecorder API**
- **Font Awesome Icons**

### 🤖 AI Layer
- **Whisper** (medium model)
- **LLM-based JSON field extraction**

---

## 📦 Installation

### Prerequisites

- Python 3.8+
- Node.js 14+ (for frontend development)
- pip (Python package manager)
- A Groq API key

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/tarunmehrda/ai-stt.git
cd ai-stt
```

### 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 3️⃣ Add Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_api_key_here
```

### 4️⃣ Run the App

```bash
python app.py
```

Open your browser and navigate to 👉 **http://localhost:5000**

---

## 🎤 Example Voice Inputs

### Business Info

> "Hi, I run Sree's Grocery Store in Hyderabad near Jubilee Hills. My number is 9876543210. We sell vegetables and dairy products."

### Products

> "Add products: Basmati rice 5 kg at 350 rupees, Toor dal 1 kg at 180, Tomatoes per kg 40 rupees."

---

## 📊 Performance Metrics

| Metric | Result |
|--------|--------|
| **Field Extraction Accuracy** | 89.5% |
| **Product Extraction Accuracy** | 89% |
| **Avg Processing Time** | 3.4 sec |
| **System Success Rate** | 94% |

---

## 🧩 System Architecture

```
Browser Audio → Whisper STT → LLM Processing → JSON Output → UI Review → Save
```

### Architecture Diagram

```
┌─────────────┐
│   Browser   │
│  (Audio In) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Whisper   │
│     STT     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Groq LLM   │
│ Processing  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    JSON     │
│   Output    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ UI Review & │
│    Save     │
└─────────────┘
```

---

## 🧪 Testing

Run the app and follow test scenarios in:

📄 **[test_cases.md](test_cases.md)**

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Mic not working** | Enable browser microphone permission |
| **Bad transcription** | Speak clearly, reduce background noise |
| **API errors** | Check `GROQ_API_KEY` in `.env` |
| **Slow response** | Restart app / close heavy apps |

---

## 🌍 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ |
| Firefox | ✅ |
| Safari | ✅ |
| Edge | ✅ |

---

## 🗺 Roadmap

### 🔜 v1.1
- [ ] Multi-language support
- [ ] Voice-guided tutorial
- [ ] Undo / redo functionality
- [ ] Save partial progress

### 🔮 v1.2
- [ ] Offline mode
- [ ] Real-time live transcript
- [ ] Voice feedback (TTS)
- [ ] Analytics dashboard

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. Create your **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. Open a **Pull Request** 🚀

### Contribution Guidelines

- Follow PEP 8 for Python code
- Use ESLint for JavaScript/TypeScript
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

**Ekthaa Technologies** – Voice Onboarding Pilot Project

This is a proprietary project developed by Ekthaa Technologies. All rights reserved.

---

## 📬 Support

For questions, issues, or feedback:

📧 **Email:** [careers@ekthaa.app](mailto:careers@ekthaa.app)

🐛 **Issues:** [GitHub Issues](https://github.com/tarunmehrda/ai-stt/issues)

💬 **Discussions:** [GitHub Discussions](https://github.com/tarunmehrda/ai-stt/discussions)

---

## 🎯 Project Structure

```
ai-stt/
├── app.py                  # Flask application entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── README.md              # This file
├── test_cases.md          # Testing documentation
├── static/                # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── templates/             # HTML templates
│   └── index.html
├── models/                # AI models
│   └── whisper/
├── utils/                 # Utility functions
│   ├── audio_processing.py
│   ├── llm_extraction.py
│   └── pdf_generator.py
└── data/                  # Data storage
    └── profiles/
```

---

## 🔑 Key Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Python** | Backend framework | 3.8+ |
| **Flask** | Web framework | 2.0+ |
| **Whisper** | Speech-to-Text | Medium |
| **Groq** | LLM API | Llama 3.3 70B |
| **React** | Frontend UI | 18+ |
| **TypeScript** | Type safety | 4+ |

---

## 🌟 Acknowledgments

- **OpenAI Whisper** for state-of-the-art speech recognition
- **Groq** for lightning-fast LLM inference
- **Flask** community for excellent documentation
- **React** team for the amazing frontend framework

---

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/tarunmehrda/ai-stt?style=social)
![GitHub forks](https://img.shields.io/github/forks/tarunmehrda/ai-stt?style=social)
![GitHub issues](https://img.shields.io/github/issues/tarunmehrda/ai-stt)
![GitHub pull requests](https://img.shields.io/github/issues-pr/tarunmehrda/ai-stt)

---

<div align="center">

**Made with ❤️ by Ekthaa Technologies**

[Website](https://ekthaa.app) • [GitHub](https://github.com/tarunmehrda) • [Email](mailto:careers@ekthaa.app)

⭐ **Star this repo if you find it helpful!** ⭐

</div>
