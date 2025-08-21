# GPT-5 Landing Page with AI Chat

A beautiful landing page for GPT-5 with an integrated AI chat feature powered by OpenAI's API. Chat with "Mert", a fictional AI researcher from Istanbul.

## 🚀 Features

- **GPT-5 Information Page**: Comprehensive details about GPT-5's capabilities
- **AI Chat Interface**: Chat with Mert, an AI persona with Turkish background
- **Firebase Authentication**: Google and GitHub OAuth login
- **Responsive Design**: Works on desktop and mobile
- **Real-time Chat**: Typing indicators and smooth animations

## 🛠️ Setup

### Prerequisites
- Node.js (v18+)
- Firebase CLI
- OpenAI API Key
- Vercel CLI (for deployment)

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set your Firebase project
firebase use mert-s-app-55d6c
```

### 3. Configure Environment Variables
```bash
# In the functions directory
cd functions

# Set the OpenAI API key as a Firebase environment variable
firebase functions:config:set openai.api_key="your_openai_api_key_here"
```

### 4. Deploy Firebase Functions
```bash
# Install dependencies
cd functions
npm install

# Deploy functions and Firestore rules
firebase deploy --only functions,firestore:rules
```

### 5. Deploy Frontend
```bash
# Deploy to Vercel
vercel --prod
```

## 🔧 Local Development

```bash
# Start local server
python3 -m http.server 8000

# Or use Firebase hosting emulator
firebase serve --only hosting
```

## 🤖 Mert's Persona

The AI chat features "Mert", a fictional character with:
- **Background**: Former OpenAI researcher, now runs Yapay Zeka Labs in Istanbul
- **Personality**: Warm, philosophical, uses Turkish phrases
- **Expertise**: GPT models, AI safety, Turkish tech scene, startups
- **Language**: Occasionally uses "Merhaba" and "İnşallah"

## 📁 Project Structure

```
├── index.html              # Main application (single file)
├── functions/
│   ├── index.js            # Firebase Functions (OpenAI integration)
│   └── package.json        # Functions dependencies
├── firebase.json           # Firebase configuration
├── firestore.rules         # Database security rules
└── README.md              # This file
```

## 🔒 Security Features

- **Environment Variables**: API keys stored securely
- **Authentication Required**: Chat requires login
- **Rate Limiting**: 10 messages per minute per user
- **Input Validation**: Message length and content checks
- **Firestore Rules**: Users can only access their own data

## 🌐 Live Demo

Visit: [Your Vercel URL]

## 📝 License

MIT License - Feel free to use this project as inspiration for your own applications.

## ⚠️ Important Notes

- **Never commit API keys**: Always use environment variables
- **OpenAI Costs**: Monitor your API usage to avoid unexpected charges
- **Rate Limits**: The chat has built-in rate limiting for cost control