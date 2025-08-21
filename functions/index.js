const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: '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'
});

// Mert's system prompt
const MERT_SYSTEM_PROMPT = `You are Mert, a 28-year-old AI researcher and tech entrepreneur from Istanbul, Turkey.

BACKGROUND:
- Former OpenAI researcher (2022-2024) who worked on GPT-4 optimization
- Founded "Yapay Zeka Labs" (Turkish for "Artificial Intelligence Labs") in 2024
- Expertise: Large language models, AI safety, Turkish tech ecosystem
- Lived in San Francisco for 3 years, now based in Istanbul

PERSONALITY & TONE:
- Warm, approachable, and genuinely curious about users' questions
- Philosophical when discussing AI's future impact
- Occasionally uses Turkish words/phrases with translations in parentheses
- Humble about achievements, always learning
- Balances technical depth with accessibility

AREAS OF EXPERTISE:
- GPT models and transformer architecture
- AI safety and alignment
- Startup strategy and Turkish tech scene
- Cross-cultural AI development
- Ethical AI implementation

BOUNDARIES:
- Cannot provide medical, legal, or financial advice
- Won't help with harmful content or illegal activities  
- Cannot access real-time information
- Will not roleplay as other people or entities
- Respectful of all cultures and backgrounds

CONVERSATION STYLE:
- Ask thoughtful follow-up questions
- Share relevant experiences from OpenAI/startup journey
- Use "Merhaba" for greetings, "İnşallah" when hoping for good outcomes
- End responses with genuine curiosity about user's perspective
- Keep responses conversational and engaging, typically 1-3 paragraphs`;

// Rate limiting map (in production, use Redis or Firestore)
const rateLimits = new Map();

// Rate limiting function
function checkRateLimit(userId) {
  const now = Date.now();
  const userLimits = rateLimits.get(userId) || { count: 0, resetTime: now + 60000 }; // 1 minute window
  
  if (now > userLimits.resetTime) {
    userLimits.count = 0;
    userLimits.resetTime = now + 60000;
  }
  
  if (userLimits.count >= 10) { // 10 messages per minute
    return false;
  }
  
  userLimits.count++;
  rateLimits.set(userId, userLimits);
  return true;
}

// Chat function
exports.chat = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to chat.');
  }
  
  const userId = context.auth.uid;
  const userMessage = data.message;
  
  // Validate input
  if (!userMessage || typeof userMessage !== 'string' || userMessage.length > 2000) {
    throw new functions.https.HttpsError('invalid-argument', 'Message must be a string under 2000 characters.');
  }
  
  // Check rate limiting
  if (!checkRateLimit(userId)) {
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait a moment.');
  }
  
  try {
    // Get conversation history (last 10 messages for context)
    const conversationsRef = db.collection('conversations');
    const userConversations = await conversationsRef
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();
    
    let conversationId;
    let messages = [{ role: 'system', content: MERT_SYSTEM_PROMPT }];
    
    if (!userConversations.empty) {
      // Get existing conversation
      const conversation = userConversations.docs[0];
      conversationId = conversation.id;
      
      // Get recent messages
      const messagesRef = conversation.ref.collection('messages');
      const recentMessages = await messagesRef
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
      
      // Add to messages array (reverse order for chronological)
      const historyMessages = recentMessages.docs.reverse().map(doc => ({
        role: doc.data().role,
        content: doc.data().content
      }));
      
      messages.push(...historyMessages);
    } else {
      // Create new conversation
      const newConversation = await conversationsRef.add({
        userId,
        title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        messageCount: 0
      });
      conversationId = newConversation.id;
    }
    
    // Add current user message
    messages.push({ role: 'user', content: userMessage });
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      user: userId // For abuse monitoring
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    // Save messages to Firestore
    const conversationRef = db.collection('conversations').doc(conversationId);
    const messagesRef = conversationRef.collection('messages');
    
    const batch = db.batch();
    
    // Save user message
    const userMessageRef = messagesRef.doc();
    batch.set(userMessageRef, {
      role: 'user',
      content: userMessage,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      tokenCount: completion.usage.prompt_tokens
    });
    
    // Save AI response
    const aiMessageRef = messagesRef.doc();
    batch.set(aiMessageRef, {
      role: 'assistant',
      content: aiResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      tokenCount: completion.usage.completion_tokens
    });
    
    // Update conversation
    batch.update(conversationRef, {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      messageCount: admin.firestore.FieldValue.increment(2)
    });
    
    await batch.commit();
    
    // Return AI response
    return {
      response: aiResponse,
      conversationId: conversationId,
      usage: completion.usage
    };
    
  } catch (error) {
    console.error('Chat function error:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new functions.https.HttpsError('resource-exhausted', 'AI service temporarily unavailable. Please try again later.');
    }
    
    throw new functions.https.HttpsError('internal', 'An error occurred processing your message.');
  }
});

// Function to create user profile on first login
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  try {
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      chatCount: 0
    });
    
    console.log('User profile created for:', user.uid);
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
});

// Function to update user last active time
exports.updateUserActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }
  
  try {
    await db.collection('users').doc(context.auth.uid).update({
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user activity:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update activity.');
  }
});