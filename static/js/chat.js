class ChatApp {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatContainer = document.getElementById('chatContainer');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
        
        this.isTyping = false;
        this.messageHistory = [];
        
        this.initializeEventListeners();
        this.loadChatHistory();
        this.autoResizeTextarea();
    }
    
    initializeEventListeners() {
        // Send message events
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
        
        // Clear chat
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // New chat
        this.newChatBtn.addEventListener('click', () => this.newChat());
        
        // Suggestion cards
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                const suggestion = card.getAttribute('data-suggestion');
                this.messageInput.value = suggestion;
                this.sendMessage();
            });
        });
        
        // Mobile sidebar toggle (if needed)
        this.setupMobileToggle();
    }
    
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        
        // Enable/disable send button
        this.sendBtn.disabled = !this.messageInput.value.trim() || this.isTyping;
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Hide welcome message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.autoResizeTextarea();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send message to server
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            if (data.success) {
                // Add AI response with typing effect
                this.addMessage(data.response.content, 'assistant', true);
            } else {
                this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered a connection error. Please try again.', 'assistant');
        }
    }
    
    addMessage(content, type, typeEffect = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageContent.appendChild(messageTime);
        
        this.chatContainer.appendChild(messageDiv);
        
        if (typeEffect && type === 'assistant') {
            this.typeMessage(messageContent, content, messageTime);
        } else {
            const textDiv = document.createElement('div');
            textDiv.innerHTML = this.formatMessage(content);
            messageContent.insertBefore(textDiv, messageTime);
        }
        
        this.scrollToBottom();
        this.messageHistory.push({ content, type, timestamp: new Date().toISOString() });
    }
    
    typeMessage(container, text, timeElement) {
        const textDiv = document.createElement('div');
        container.insertBefore(textDiv, timeElement);
        
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < text.length) {
                textDiv.innerHTML = this.formatMessage(text.substring(0, index + 1));
                index++;
                this.scrollToBottom();
            } else {
                clearInterval(typeInterval);
            }
        }, 30);
    }
    
    formatMessage(text) {
        // Basic markdown-like formatting
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        text = text.replace(/\n/g, '<br>');
        
        // Code blocks
        text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        return text;
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        this.autoResizeTextarea();
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        this.autoResizeTextarea();
        
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    async clearChat() {
        if (confirm('Are you sure you want to clear the chat?')) {
            try {
                await fetch('/api/clear', { method: 'POST' });
                this.chatContainer.innerHTML = `
                    <div class="welcome-message">
                        <div class="welcome-content">
                            <i class="fas fa-robot welcome-icon"></i>
                            <h3>Welcome to AI Chat Assistant</h3>
                            <p class="text-muted">How can I help you today?</p>
                            
                            <div class="suggestion-cards">
                                <div class="suggestion-card" data-suggestion="Explain quantum computing">
                                    <i class="fas fa-atom"></i>
                                    <span>Explain quantum computing</span>
                                </div>
                                <div class="suggestion-card" data-suggestion="Write a Python function">
                                    <i class="fab fa-python"></i>
                                    <span>Write a Python function</span>
                                </div>
                                <div class="suggestion-card" data-suggestion="Help with creative writing">
                                    <i class="fas fa-pen-fancy"></i>
                                    <span>Help with creative writing</span>
                                </div>
                                <div class="suggestion-card" data-suggestion="Analyze data trends">
                                    <i class="fas fa-chart-line"></i>
                                    <span>Analyze data trends</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                this.messageHistory = [];
                this.reinitializeSuggestionCards();
            } catch (error) {
                console.error('Error clearing chat:', error);
            }
        }
    }
    
    newChat() {
        this.clearChat();
    }
    
    async loadChatHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            if (data.messages && data.messages.length > 0) {
                // Hide welcome message
                const welcomeMessage = document.querySelector('.welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.style.display = 'none';
                }
                
                // Load messages
                data.messages.forEach(msg => {
                    this.addMessage(msg.content, msg.type);
                });
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
    
    reinitializeSuggestionCards() {
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                const suggestion = card.getAttribute('data-suggestion');
                this.messageInput.value = suggestion;
                this.sendMessage();
            });
        });
    }
    
    setupMobileToggle() {
        // Add mobile menu toggle if needed
        if (window.innerWidth <= 768) {
            const chatHeader = document.querySelector('.chat-header');
            const menuBtn = document.createElement('button');
            menuBtn.className = 'btn btn-outline-secondary btn-sm me-2';
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            menuBtn.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('show');
            });
            
            const controls = document.querySelector('.chat-controls');
            controls.insertBefore(menuBtn, controls.firstChild);
        }
    }
}

// Initialize the chat app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});

// Handle window resize
window.addEventListener('resize', () => {
    // Reinitialize mobile features if needed
    if (window.innerWidth > 768) {
        document.querySelector('.sidebar').classList.remove('show');
    }
});

// Add some utility functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = 'Copied to clipboard!';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus on input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('messageInput').focus();
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        document.getElementById('messageInput').value = '';
        document.getElementById('messageInput').style.height = 'auto';
    }
});