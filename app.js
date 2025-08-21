import { auth, db, functions } from './firebase-config.js';
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    GithubAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    where,
    updateDoc,
    serverTimestamp 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Router class for SPA navigation
class Router {
    constructor() {
        this.routes = {
            '/': this.showHome,
            '/login': this.showLogin,
            '/chat': this.showChat
        };
        this.currentUser = null;
        
        // Initialize auth state listener
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.updateNavigation();
            
            // Redirect if trying to access protected route without auth
            if (!user && window.location.pathname === '/chat') {
                this.navigate('/login');
            }
        });
        
        // Handle browser navigation
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        
        // Initial route
        this.handleRoute();
    }
    
    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }
    
    handleRoute() {
        const path = window.location.pathname;
        const route = this.routes[path] || this.routes['/'];
        route.call(this);
    }
    
    updateNavigation() {
        const navContainer = document.querySelector('.navigation');
        const userNav = document.querySelector('.user-nav');
        
        if (this.currentUser) {
            // Add Chat with Mert link
            if (!document.querySelector('.chat-nav-link')) {
                const chatLink = document.createElement('div');
                chatLink.className = 'nav-heading chat-nav-link';
                chatLink.textContent = 'Chat with Mert';
                chatLink.onclick = () => this.navigate('/chat');
                navContainer.appendChild(chatLink);
            }
            
            // Update user navigation
            if (userNav) {
                userNav.innerHTML = `
                    <div class="user-info">
                        <img src="${this.currentUser.photoURL || '/default-avatar.png'}" alt="User" class="user-avatar">
                        <span>${this.currentUser.displayName || this.currentUser.email}</span>
                        <button onclick="app.signOut()" class="logout-btn">Logout</button>
                    </div>
                `;
            } else {
                // Create user nav
                const userNavDiv = document.createElement('div');
                userNavDiv.className = 'user-nav';
                userNavDiv.innerHTML = `
                    <div class="user-info">
                        <img src="${this.currentUser.photoURL || '/default-avatar.png'}" alt="User" class="user-avatar">
                        <span>${this.currentUser.displayName || this.currentUser.email}</span>
                        <button onclick="app.signOut()" class="logout-btn">Logout</button>
                    </div>
                `;
                document.querySelector('.container').prepend(userNavDiv);
            }
        } else {
            // Remove chat link and user nav when logged out
            const chatLink = document.querySelector('.chat-nav-link');
            if (chatLink) chatLink.remove();
            
            if (userNav) userNav.remove();
        }
    }
    
    showHome() {
        document.title = 'GPT-5 - Just the Most';
        const sections = document.querySelectorAll('.section');
        const hero = document.querySelector('.hero');
        const nav = document.querySelector('.navigation');
        
        // Show homepage content
        if (hero) hero.style.display = 'block';
        if (nav) nav.style.display = 'block';
        sections.forEach(section => section.style.display = 'block');
        
        // Hide other pages
        this.hidePages(['login-page', 'chat-page']);
    }
    
    showLogin() {
        if (this.currentUser) {
            this.navigate('/chat');
            return;
        }
        
        document.title = 'Login - GPT-5';
        this.hidePages(['section', 'hero', 'navigation']);
        this.showPage('login-page', this.createLoginPage());
    }
    
    showChat() {
        if (!this.currentUser) {
            this.navigate('/login');
            return;
        }
        
        document.title = 'Chat with Mert - GPT-5';
        this.hidePages(['section', 'hero', 'navigation']);
        this.showPage('chat-page', this.createChatPage());
    }
    
    hidePages(selectors) {
        selectors.forEach(selector => {
            if (selector.includes('-page')) {
                const page = document.querySelector(`.${selector}`);
                if (page) page.style.display = 'none';
            } else {
                const elements = document.querySelectorAll(`.${selector}`);
                elements.forEach(el => el.style.display = 'none');
            }
        });
    }
    
    showPage(className, content) {
        let page = document.querySelector(`.${className}`);
        if (!page) {
            page = document.createElement('div');
            page.className = className;
            document.querySelector('.container').appendChild(page);
        }
        page.innerHTML = content;
        page.style.display = 'block';
    }
    
    createLoginPage() {
        return `
            <div class="login-container">
                <div class="login-card">
                    <h1>Login to Chat with Mert</h1>
                    <p class="login-description">
                        Sign in to start chatting with Mert, an AI researcher and tech entrepreneur from Istanbul.
                    </p>
                    
                    <div class="login-buttons">
                        <button onclick="app.signInWithGoogle()" class="login-btn google-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>
                        
                        <button onclick="app.signInWithGithub()" class="login-btn github-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            Continue with GitHub
                        </button>
                    </div>
                    
                    <div class="login-footer">
                        <a href="#" onclick="app.navigate('/')">← Back to Home</a>
                    </div>
                </div>
            </div>
        `;
    }
    
    createChatPage() {
        return `
            <div class="chat-container">
                <div class="chat-header">
                    <div class="chat-title">
                        <h2>Chat with Mert</h2>
                        <p class="chat-subtitle">AI researcher and tech entrepreneur from Istanbul</p>
                    </div>
                    <div class="chat-actions">
                        <button onclick="app.newChat()" class="new-chat-btn">New Chat</button>
                        <a href="#" onclick="app.navigate('/')" class="back-home">← Home</a>
                    </div>
                </div>
                
                <div class="chat-messages" id="chat-messages">
                    <div class="message assistant-message">
                        <div class="message-avatar">
                            <div class="avatar">M</div>
                        </div>
                        <div class="message-content">
                            <div class="message-text">
                                Merhaba! I'm Mert, a former OpenAI researcher who now runs Yapay Zeka Labs in Istanbul. 
                                I'd love to chat about AI, technology, startups, or anything else you're curious about. 
                                What brings you here today?
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="chat-input-container">
                    <div class="chat-input">
                        <textarea 
                            id="message-input" 
                            placeholder="Type your message to Mert..."
                            rows="1"
                        ></textarea>
                        <button onclick="app.sendMessage()" id="send-btn" class="send-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    async signInWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            this.navigate('/chat');
        } catch (error) {
            console.error('Google sign in error:', error);
            alert('Sign in failed. Please try again.');
        }
    }
    
    async signInWithGithub() {
        try {
            const provider = new GithubAuthProvider();
            await signInWithPopup(auth, provider);
            this.navigate('/chat');
        } catch (error) {
            console.error('GitHub sign in error:', error);
            alert('Sign in failed. Please try again.');
        }
    }
    
    async signOut() {
        try {
            await signOut(auth);
            this.navigate('/');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessage('user', message);
        input.value = '';
        
        // Show typing indicator
        const typingId = this.showTyping();
        
        try {
            // Call our chat function
            const chatFunction = httpsCallable(functions, 'chat');
            const result = await chatFunction({ message });
            
            // Remove typing indicator
            this.hideTyping(typingId);
            
            // Add AI response
            this.addMessage('assistant', result.data.response);
            
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTyping(typingId);
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    }
    
    addMessage(role, content) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const avatar = role === 'assistant' 
            ? '<div class="avatar">M</div>' 
            : `<div class="avatar user-avatar"><img src="${this.currentUser?.photoURL || '/default-avatar.png'}" alt="User"></div>`;
            
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${avatar}
            </div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
    
    showTyping() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-message';
        typingDiv.id = 'typing-' + Date.now();
        
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <div class="avatar">M</div>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return typingDiv.id;
    }
    
    hideTyping(typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.remove();
        }
    }
    
    newChat() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="message assistant-message">
                <div class="message-avatar">
                    <div class="avatar">M</div>
                </div>
                <div class="message-content">
                    <div class="message-text">
                        Merhaba again! Ready for a new conversation? What would you like to explore today?
                    </div>
                </div>
            </div>
        `;
    }
}

// Auto-resize textarea
document.addEventListener('input', (e) => {
    if (e.target.id === 'message-input') {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    }
});

// Send message on Enter (but not Shift+Enter)
document.addEventListener('keydown', (e) => {
    if (e.target.id === 'message-input' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('send-btn').click();
    }
});

// Initialize the app
window.app = new Router();