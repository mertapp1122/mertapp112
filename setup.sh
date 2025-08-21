#!/bin/bash

echo "🚀 Setting up Firebase for GPT-5 Chat App"
echo "=========================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in
echo "🔑 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "🔐 Please login to Firebase:"
    firebase login
fi

# Set project
echo "📁 Setting Firebase project..."
firebase use mert-s-app-55d6c

# Install function dependencies
echo "📦 Installing Firebase Functions dependencies..."
cd functions
npm install
cd ..

echo "✅ Setup complete! Next steps:"
echo ""
echo "1. Enable Authentication providers:"
echo "   Visit: https://console.firebase.google.com/project/mert-s-app-55d6c/authentication/providers"
echo "   Enable Google and GitHub sign-in"
echo ""
echo "2. Set your OpenAI API key:"
echo "   firebase functions:config:set openai.api_key=\"your_openai_key_here\""
echo ""
echo "3. Deploy to Firebase:"
echo "   firebase deploy"
echo ""
echo "4. Deploy frontend to Vercel:"
echo "   vercel --prod"