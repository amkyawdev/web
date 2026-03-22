/**
 * Advanced Chat System with JSON Data Storage
 * Complete Real-time Chat Application
 * Version: 2.0
 */

class AdvancedChat {
    constructor() {
        // Core Properties
        this.currentRoom = 'general';
        this.messages = {};
        this.rooms = [];
        this.onlineUsers = [];
        this.currentUser = null;
        this.typingUsers = new Set();
        this.typingTimeout = null;
        this.messageCooldown = false;
        this.notifications = true;
        this.searchResults = [];
        this.pinnedMessages = [];
        this.replyToMessageId = null;
        this.lastDateShown = null;
        this.unreadCounts = {};
        this.messageInterval = null;
        this.heartbeatInterval = null;
        
        // Settings
        this.settings = {
            maxMessageLength: 500,
            messageCooldown: 2,
            allowedFileTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            maxFileSize: 5242880, // 5MB
            typingTimeout: 3000,
            messageLoadLimit: 50,
            enableNotifications: true,
            soundEnabled: true
        };
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize Chat System
     */
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.startHeartbeat();
        this.renderRooms();
        this.loadMessages();
        this.setupTypingDetection();
        this.setupMessagePolling();
        this.setupNotificationPermission();
        this.loadPinnedMessages();
    }
    
    /**
     * Load Data from JSON and LocalStorage
     */
    async loadData() {
        try {
            // Load chat data from JSON
            const response = await fetch('../data/chat.json');
            if (response.ok) {
                const data = await response.json();
                this.rooms = data.rooms || this.getDefaultRooms();
                this.messages = data.messages || {};
                this.settings = { ...this.settings, ...data.settings };
            } else {
                this.loadDefaultData();
            }
        } catch (error) {
            console.error('Error loading chat data:', error);
            this.loadDefaultData();
        }
        
        // Load saved messages from localStorage
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            const parsed = JSON.parse(savedMessages);
            this.messages = { ...this.messages, ...parsed.messages };
        }
        
        // Load user data
        this.loadUserData();
        
        // Load pinned messages
        const savedPinned = localStorage.getItem('pinnedMessages');
        if (savedPinned) {
            this.pinnedMessages = JSON.parse(savedPinned);
        }
        
        // Load unread counts
        const savedUnread = localStorage.getItem('unreadCounts');
        if (savedUnread) {
            this.unreadCounts = JSON.parse(savedUnread);
        }
    }
    
    /**
     * Get Default Rooms
     */
    getDefaultRooms() {
        return [
            { 
                id: 'general', 
                name: 'General Discussion', 
                description: 'Welcome to general chat! Feel free to introduce yourself.',
                icon: 'fas fa-comments',
                createdAt: new Date().toISOString(),
                topic: 'General discussions about development',
                createdBy: 'system'
            },
            { 
                id: 'tech', 
                name: 'Technology & Innovation', 
                description: 'Discuss latest tech trends, AI, and innovations',
                icon: 'fas fa-microchip',
                createdAt: new Date().toISOString(),
                topic: 'Latest technology news and discussions',
                createdBy: 'system'
            },
            { 
                id: 'projects', 
                name: 'Project Collaboration', 
                description: 'Collaborate on open source projects',
                icon: 'fas fa-project-diagram',
                createdAt: new Date().toISOString(),
                topic: 'Share your projects and collaborate',
                createdBy: 'system'
            },
            { 
                id: 'help', 
                name: 'Help & Support', 
                description: 'Get help with coding problems',
                icon: 'fas fa-question-circle',
                createdAt: new Date().toISOString(),
                topic: 'Programming help and support',
                createdBy: 'system'
            },
            { 
                id: 'javascript', 
                name: 'JavaScript Masters', 
                description: 'Deep dive into JavaScript',
                icon: 'fab fa-js',
                createdAt: new Date().toISOString(),
                topic: 'JavaScript, Node.js, React discussions',
                createdBy: 'system'
            },
            { 
                id: 'python', 
                name: 'Python Developers', 
                description: 'Python programming discussions',
                icon: 'fab fa-python',
                createdAt: new Date().toISOString(),
                topic: 'Python, Django, Flask, Data Science',
                createdBy: 'system'
            }
        ];
    }
    
    /**
     * Load Default Data
     */
    loadDefaultData() {
        this.rooms = this.getDefaultRooms();
        
        // Add welcome message for general room
        if (!this.messages['general']) {
            this.messages['general'] = [{
                id: 'welcome_' + Date.now(),
                senderId: 'system',
                senderName: 'System',
                senderAvatar: '🤖',
                text: '🎉 Welcome to Developer Chat! 🎉\n\nThis is a space for developers to connect, share knowledge, and collaborate. Feel free to:\n• Ask questions\n• Share your projects\n• Help others\n• Discuss tech trends\n\nPlease be respectful and enjoy your time here!',
                timestamp: new Date().toISOString(),
                type: 'system',
                reactions: [],
                isPinned: true
            }];
        }
        
        // Initialize empty message arrays for other rooms
        this.rooms.forEach(room => {
            if (!this.messages[room.id]) {
                this.messages[room.id] = [];
            }
        });
    }
    
    /**
     * Load User Data
     */
    loadUserData() {
        const savedUser = localStorage.getItem('chatUser');
        const firebaseUser = firebase.auth().currentUser;
        
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        } else {
            this.currentUser = {
                id: firebaseUser ? firebaseUser.uid : 'guest_' + Date.now(),
                name: firebaseUser ? firebaseUser.email.split('@')[0] : 'Guest_' + Math.floor(Math.random() * 1000),
                email: firebaseUser ? firebaseUser.email : 'guest@example.com',
                avatar: this.getRandomAvatar(),
                status: 'Online',
                statusMessage: 'Hello, I\'m using Developer Chat!',
                joinedAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                preferences: {
                    theme: 'light',
                    notifications: true,
                    soundEnabled: true
                }
            };
        }
        
        this.updateUserUI();
        this.saveUserData();
    }
    
    /**
     * Get Random Avatar
     */
    getRandomAvatar() {
        const avatars = ['👨‍💻', '👩‍💻', '🚀', '💻', '🤖', '🎨', '🌟', '🔥', '⚡', '🎯'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    }
    
    /**
     * Save User Data
     */
    saveUserData() {
        localStorage.setItem('chatUser', JSON.stringify(this.currentUser));
    }
    
    /**
     * Update User UI
     */
    updateUserUI() {
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        const userStatusEl = document.getElementById('userStatus');
        
        if (userNameEl) userNameEl.textContent = this.currentUser.name;
        if (userAvatarEl) userAvatarEl.innerHTML = `<span style="font-size: 32px;">${this.currentUser.avatar}</span>`;
        if (userStatusEl) {
            userStatusEl.innerHTML = `
                <i class="fas fa-circle online-dot"></i> 
                ${this.currentUser.statusMessage || 'Online'}
            `;
        }
    }
    
    /**
     * Setup Event Listeners
     */
    setupEventListeners() {
        // Firebase auth listener
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser.id = user.uid;
                this.currentUser.email = user.email;
                this.currentUser.name = user.email.split('@')[0];
                this.updateUserUI();
                this.saveUserData();
                this.addUserToOnline();
            }
        });
        
        // Window focus/blur for typing status
        window.addEventListener('focus', () => {
            this.addUserToOnline();
        });
        
        window.addEventListener('beforeunload', () => {
            this.removeUserFromOnline();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + K to search
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.toggleSearch();
            }
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    /**
     * Save Messages to LocalStorage
     */
    saveMessages() {
        const saveData = {
            messages: this.messages,
            lastSaved: new Date().toISOString(),
            version: '2.0'
        };
        localStorage.setItem('chatMessages', JSON.stringify(saveData));
        
        // Save unread counts
        localStorage.setItem('unreadCounts', JSON.stringify(this.unreadCounts));
    }
    
    /**
     * Render Rooms List
     */
    renderRooms() {
        const roomList = document.getElementById('roomList');
        if (!roomList) return;
        
        roomList.innerHTML = this.rooms.map(room => `
            <div class="room-item ${room.id === this.currentRoom ? 'active' : ''}" 
                 onclick="chatSystem.joinRoom('${room.id}')"
                 data-room-id="${room.id}">
                <i class="${room.icon}"></i>
                <span>${this.escapeHtml(room.name)}</span>
                <span class="room-badge" id="badge-${room.id}">
                    ${this.getUnreadCount(room.id)}
                </span>
            </div>
        `).join('');
    }
    
    /**
     * Get Unread Count for Room
     */
    getUnreadCount(roomId) {
        const lastRead = localStorage.getItem(`lastRead_${roomId}`);
        const messages = this.messages[roomId] || [];
        if (!lastRead) return messages.length > 0 ? messages.length : '';
        
        const unread = messages.filter(m => new Date(m.timestamp) > new Date(lastRead)).length;
        return unread > 0 ? unread : '';
    }
    
    /**
     * Update Room Badges
     */
    updateRoomBadges() {
        this.rooms.forEach(room => {
            const badge = document.getElementById(`badge-${room.id}`);
            if (badge) {
                const unread = this.getUnreadCount(room.id);
                badge.textContent = unread;
                badge.style.display = unread ? 'inline-block' : 'none';
            }
        });
    }
    
    /**
     * Load Messages for Current Room
     */
    async loadMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-messages"><div class="loader"></div><p>Loading messages...</p></div>';
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const roomMessages = this.messages[this.currentRoom] || [];
        this.renderMessages(roomMessages);
        
        // Mark as read
        localStorage.setItem(`lastRead_${this.currentRoom}`, new Date().toISOString());
        this.updateRoomBadges();
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    /**
     * Render Messages
     */
    renderMessages(messages) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        // Show pinned messages first if any
        const pinnedMsgs = messages.filter(m => m.isPinned);
        const regularMsgs = messages.filter(m => !m.isPinned);
        
        let allMessages = [...pinnedMsgs, ...regularMsgs];
        
        // Sort by timestamp
        allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (allMessages.length === 0) {
            container.innerHTML = `
                <div class="empty-messages">
                    <i class="fas fa-comment-dots"></i>
                    <h3>No messages yet</h3>
                    <p>Be the first to start the conversation!</p>
                </div>
            `;
            return;
        }
        
        // Reset last date shown
        this.lastDateShown = null;
        
        container.innerHTML = allMessages.map(msg => this.renderMessage(msg)).join('');
        this.scrollToBottom();
        
        // Play notification sound if needed
        if (this.settings.soundEnabled && this.hasNewMessages(allMessages)) {
            this.playNotificationSound();
        }
    }
    
    /**
     * Check if there are new messages
     */
    hasNewMessages(messages) {
        const lastRead = localStorage.getItem(`lastRead_${this.currentRoom}`);
        if (!lastRead) return false;
        
        return messages.some(m => new Date(m.timestamp) > new Date(lastRead) && m.senderId !== this.currentUser.id);
    }
    
    /**
     * Render Single Message
     */
    renderMessage(msg) {
        const isOwn = msg.senderId === this.currentUser.id;
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = new Date(msg.timestamp).toLocaleDateString();
        
        let messageHtml = '';
        
        // Add date separator if needed
        if (this.shouldShowDateSeparator(msg.timestamp)) {
            messageHtml += `<div class="date-separator"><span>${date}</span></div>`;
        }
        
        // Add pinned badge if message is pinned
        const pinnedBadge = msg.isPinned ? '<span class="pinned-badge" title="Pinned message">📌</span>' : '';
        
        messageHtml += `
            <div class="message ${isOwn ? 'message-own' : ''} ${msg.isPinned ? 'pinned-message' : ''}" 
                 data-message-id="${msg.id}"
                 data-sender-id="${msg.senderId}">
                <div class="message-avatar">
                    ${msg.senderAvatar || '👤'}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">
                            ${this.escapeHtml(msg.senderName)}
                            ${pinnedBadge}
                        </span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">
                        ${this.formatMessageContent(msg.text, msg.type)}
                    </div>
                    ${msg.reactions && msg.reactions.length > 0 ? this.renderReactions(msg.reactions) : ''}
                    <div class="message-actions">
                        <button onclick="chatSystem.addReaction('${msg.id}', '👍')" title="Like">
                            👍
                        </button>
                        <button onclick="chatSystem.addReaction('${msg.id}', '❤️')" title="Love">
                            ❤️
                        </button>
                        <button onclick="chatSystem.addReaction('${msg.id}', '😂')" title="Laugh">
                            😂
                        </button>
                        <button onclick="chatSystem.replyToMessage('${msg.id}')" title="Reply">
                            ↩️
                        </button>
                        ${!msg.isPinned ? `
                            <button onclick="chatSystem.pinMessage('${msg.id}')" title="Pin">
                                📌
                            </button>
                        ` : `
                            <button onclick="chatSystem.unpinMessage('${msg.id}')" title="Unpin">
                                📍
                            </button>
                        `}
                        <button onclick="chatSystem.copyMessage('${msg.id}')" title="Copy">
                            📋
                        </button>
                        ${isOwn ? `
                            <button onclick="chatSystem.deleteMessage('${msg.id}')" title="Delete">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        return messageHtml;
    }
    
    /**
     * Format Message Content
     */
    formatMessageContent(text, type) {
        if (type === 'code') {
            return `<div class="code-block"><pre><code>${this.escapeHtml(text)}</code></pre></div>`;
        } else if (type === 'image') {
            return `<img src="${text}" class="message-image" onclick="chatSystem.openImage('${text}')" alt="Shared image">`;
        } else if (type === 'system') {
            return `<div class="system-message">${this.escapeHtml(text)}</div>`;
        }
        
        // Parse markdown, emojis, mentions, and links
        let formatted = this.escapeHtml(text);
        formatted = this.parseEmojis(formatted);
        formatted = this.parseMentions(formatted);
        formatted = this.parseLinks(formatted);
        formatted = this.parseCodeBlocks(formatted);
        
        return formatted.replace(/\n/g, '<br>');
    }
    
    /**
     * Parse Emojis
     */
    parseEmojis(text) {
        const emojiMap = {
            ':smile:': '😊',
            ':laugh:': '😂',
            ':love:': '❤️',
            ':thumbsup:': '👍',
            ':code:': '💻',
            ':rocket:': '🚀',
            ':fire:': '🔥',
            ':star:': '⭐',
            ':bug:': '🐛',
            ':tada:': '🎉',
            ':thinking:': '🤔',
            ':heart:': '❤️',
            ':cool:': '😎',
            ':cry:': '😢',
            ':angry:': '😠'
        };
        
        for (const [key, value] of Object.entries(emojiMap)) {
            text = text.replace(new RegExp(key, 'g'), value);
        }
        
        return text;
    }
    
    /**
     * Parse Mentions
     */
    parseMentions(text) {
        return text.replace(/@(\w+)/g, (match, username) => {
            return `<span class="mention" onclick="chatSystem.mentionUser('${username}')">@${username}</span>`;
        });
    }
    
    /**
     * Parse Links
     */
    parseLinks(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, '<a href="$1" target="_blank" class="message-link" rel="noopener noreferrer">$1</a>');
    }
    
    /**
     * Parse Code Blocks
     */
    parseCodeBlocks(text) {
        const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
        return text.replace(codeRegex, (match, lang, code) => {
            return `<div class="code-block"><pre><code class="language-${lang}">${this.escapeHtml(code.trim())}</code></pre></div>`;
        });
    }
    
    /**
     * Render Reactions
     */
    renderReactions(reactions) {
        const groupedReactions = reactions.reduce((acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = [];
            acc[r.emoji].push(r);
            return acc;
        }, {});
        
        return `
            <div class="message-reactions">
                ${Object.entries(groupedReactions).map(([emoji, users]) => `
                    <span class="reaction-badge" title="${users.map(u => u.userName).join(', ')}">
                        ${emoji} ${users.length}
                    </span>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Check if Date Separator Should Show
     */
    shouldShowDateSeparator(timestamp) {
        if (!this.lastDateShown) {
            this.lastDateShown = timestamp;
            return true;
        }
        
        const lastDate = new Date(this.lastDateShown).toDateString();
        const currentDate = new Date(timestamp).toDateString();
        
        if (lastDate !== currentDate) {
            this.lastDateShown = timestamp;
            return true;
        }
        
        return false;
    }
    
    /**
     * Send Message
     */
    async sendMessage() {
        if (this.messageCooldown) {
            this.showToast('Please wait a moment before sending another message', 'warning');
            return;
        }
        
        const input = document.getElementById('messageInput');
        let text = input.value.trim();
        
        if (!text) return;
        
        // Check message length
        if (text.length > this.settings.maxMessageLength) {
            this.showToast(`Message too long! Maximum ${this.settings.maxMessageLength} characters`, 'error');
            return;
        }
        
        // Check for spam
        if (this.isSpam(text)) {
            this.showToast('Message looks like spam. Please try again.', 'error');
            return;
        }
        
        const message = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            senderId: this.currentUser.id,
            senderName: this.currentUser.name,
            senderAvatar: this.currentUser.avatar,
            text: text,
            timestamp: new Date().toISOString(),
            type: 'text',
            reactions: [],
            isPinned: false,
            replyTo: this.replyToMessageId
        };
        
        // Add reply reference if replying
        if (this.replyToMessageId) {
            const originalMsg = this.findMessage(this.replyToMessageId);
            if (originalMsg) {
                message.replyToText = originalMsg.text.substring(0, 100);
                message.replyToSender = originalMsg.senderName;
            }
            this.replyToMessageId = null;
        }
        
        // Add to messages
        if (!this.messages[this.currentRoom]) {
            this.messages[this.currentRoom] = [];
        }
        this.messages[this.currentRoom].push(message);
        
        // Save and render
        this.saveMessages();
        this.renderMessages(this.messages[this.currentRoom]);
        
        // Clear input
        input.value = '';
        this.messageCooldown = true;
        
        // Reset cooldown
        setTimeout(() => {
            this.messageCooldown = false;
        }, this.settings.messageCooldown * 1000);
        
        // Auto-reply for help messages
        if (text.toLowerCase().includes('help') || text.toLowerCase().includes('?') && !text.toLowerCase().includes('http')) {
            setTimeout(() => this.sendAutoReply(text), 1500);
        }
        
        // Update room badges
        this.updateRoomBadges();
    }
    
    /**
     * Check for Spam
     */
    isSpam(text) {
        // Check for repeated characters
        const repeatedPattern = /(.)\1{10,}/;
        if (repeatedPattern.test(text)) return true;
        
        // Check for all caps
        if (text === text.toUpperCase() && text.length > 20) return true;
        
        return false;
    }
    
    /**
     * Send Auto Reply
     */
    sendAutoReply(userMessage) {
        let replyText = '';
        
        if (userMessage.toLowerCase().includes('help')) {
            replyText = "🤖 **AI Assistant**: I'm here to help! Here are some things I can assist with:\n\n" +
                       "• **Coding questions** - Ask about programming languages, frameworks, or algorithms\n" +
                       "• **Project guidance** - Need help with your project? I can provide suggestions\n" +
                       "• **Debugging** - Share your code and I'll help find issues\n" +
                       "• **Learning resources** - I can recommend tutorials and documentation\n\n" +
                       "What specific help do you need?";
        } else if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
            replyText = `🤖 **AI Assistant**: Hello ${this.currentUser.name}! Welcome to the Developer Chat! How can I assist you today?`;
        } else if (userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('programming')) {
            replyText = "💻 **AI Assistant**: I'd be happy to help with coding! Please specify:\n" +
                       "• Which programming language are you using?\n" +
                       "• What are you trying to achieve?\n" +
                       "• Can you share your code snippet?\n\n" +
                       "This will help me provide better assistance!";
        } else {
            replyText = "🤖 **AI Assistant**: Thanks for your message! I'm here to help with development questions. If you need technical assistance, feel free to ask specific questions about coding, platforms, or projects!";
        }
        
        const reply = {
            id: 'ai_' + Date.now(),
            senderId: 'ai_assistant',
            senderName: 'AI Assistant',
            senderAvatar: '🤖',
            text: replyText,
            timestamp: new Date().toISOString(),
            type: 'text',
            reactions: [],
            isPinned: false
        };
        
        this.messages[this.currentRoom].push(reply);
        this.saveMessages();
        this.renderMessages(this.messages[this.currentRoom]);
        this.playNotificationSound();
    }
    
    /**
     * Add Reaction to Message
     */
    addReaction(messageId, reaction) {
        const message = this.findMessage(messageId);
        if (message) {
            if (!message.reactions) message.reactions = [];
            
            const existingIndex = message.reactions.findIndex(r => r.userId === this.currentUser.id && r.emoji === reaction);
            
            if (existingIndex !== -1) {
                // Remove reaction
                message.reactions.splice(existingIndex, 1);
            } else {
                // Add reaction
                message.reactions.push({
                    userId: this.currentUser.id,
                    userName: this.currentUser.name,
                    emoji: reaction,
                    timestamp: new Date().toISOString()
                });
            }
            
            this.saveMessages();
            this.renderMessages(this.messages[this.currentRoom]);
        }
    }
    
    /**
     * Reply to Message
     */
    replyToMessage(messageId) {
        this.replyToMessageId = messageId;
        const input = document.getElementById('messageInput');
        const message = this.findMessage(messageId);
        
        if (message) {
            input.placeholder = `Replying to ${message.senderName}...`;
            input.focus();
            
            // Show reply indicator
            const replyIndicator = document.createElement('div');
            replyIndicator.className = 'reply-indicator';
            replyIndicator.innerHTML = `
                <i class="fas fa-reply"></i>
                <span>Replying to ${message.senderName}</span>
                <button onclick="chatSystem.cancelReply()">✖</button>
            `;
            
            const existing = document.querySelector('.reply-indicator');
            if (existing) existing.remove();
            
            const inputArea = document.querySelector('.chat-input-area');
            inputArea.insertBefore(replyIndicator, inputArea.firstChild);
        }
    }
    
    /**
     * Cancel Reply
     */
    cancelReply() {
        this.replyToMessageId = null;
        const input = document.getElementById('messageInput');
        input.placeholder = 'Type your message here...';
        
        const replyIndicator = document.querySelector('.reply-indicator');
        if (replyIndicator) replyIndicator.remove();
    }
    
    /**
     * Pin Message
     */
    pinMessage(messageId) {
        const message = this.findMessage(messageId);
        if (message && !message.isPinned) {
            message.isPinned = true;
            this.saveMessages();
            this.renderMessages(this.messages[this.currentRoom]);
            this.showToast('Message pinned!', 'success');
            
            // Save to pinned messages list
            if (!this.pinnedMessages.includes(messageId)) {
                this.pinnedMessages.push(messageId);
                localStorage.setItem('pinnedMessages', JSON.stringify(this.pinnedMessages));
            }
        }
    }
    
    /**
     * Unpin Message
     */
    unpinMessage(messageId) {
        const message = this.findMessage(messageId);
        if (message && message.isPinned) {
            message.isPinned = false;
            this.saveMessages();
            this.renderMessages(this.messages[this.currentRoom]);
            this.showToast('Message unpinned', 'info');
            
            // Remove from pinned messages list
            const index = this.pinnedMessages.indexOf(messageId);
            if (index !== -1) {
                this.pinnedMessages.splice(index, 1);
                localStorage.setItem('pinnedMessages', JSON.stringify(this.pinnedMessages));
            }
        }
    }
    
    /**
     * Load Pinned Messages
     */
    loadPinnedMessages() {
        const pinnedContainer = document.getElementById('pinnedMessages');
        if (!pinnedContainer) return;
        
        const pinnedMsgs = [];
        for (const roomId in this.messages) {
            const roomMsgs = this.messages[roomId];
            const pinned = roomMsgs.filter(m => m.isPinned);
            pinnedMsgs.push(...pinned);
        }
        
        if (pinnedMsgs.length === 0) {
            pinnedContainer.innerHTML = '<p class="no-pinned">No pinned messages</p>';
            return;
        }
        
        pinnedContainer.innerHTML = pinnedMsgs.slice(0, 5).map(msg => `
            <div class="pinned-message-item" onclick="chatSystem.jumpToMessage('${msg.id}')">
                <i class="fas fa-thumbtack"></i>
                <div>
                    <strong>${this.escapeHtml(msg.senderName)}</strong>
                    <p>${this.escapeHtml(msg.text.substring(0, 50))}...</p>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Jump to Message
     */
    jumpToMessage(messageId) {
        const message = this.findMessage(messageId);
        if (message) {
            // Find which room contains this message
            for (const roomId in this.messages) {
                if (this.messages[roomId].some(m => m.id === messageId)) {
                    if (roomId !== this.currentRoom) {
                        this.joinRoom(roomId);
                    }
                    setTimeout(() => {
                        const msgElement = document.querySelector(`[data-message-id="${messageId}"]`);
                        if (msgElement) {
                            msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            msgElement.classList.add('highlight');
                            setTimeout(() => {
                                msgElement.classList.remove('highlight');
                            }, 2000);
                        }
                    }, 500);
                    break;
                }
            }
        }
    }
    
    /**
     * Copy Message
     */
    copyMessage(messageId) {
        const message = this.findMessage(messageId);
        if (message) {
            navigator.clipboard.writeText(message.text).then(() => {
                this.showToast('Message copied to clipboard!', 'success');
            });
        }
    }
    
    /**
     * Delete Message
     */
    deleteMessage(messageId) {
        if (confirm('Are you sure you want to delete this message?')) {
            const roomMessages = this.messages[this.currentRoom];
            const index = roomMessages.findIndex(m => m.id === messageId);
            
            if (index !== -1) {
                roomMessages.splice(index, 1);
                this.saveMessages();
                this.renderMessages(this.messages[this.currentRoom]);
                this.showToast('Message deleted', 'info');
            }
        }
    }
    
    /**
     * Find Message by ID
     */
    findMessage(messageId) {
        for (const roomId in this.messages) {
            const message = this.messages[roomId].find(m => m.id === messageId);
            if (message) return message;
        }
        return null;
    }
    
    /**
     * Join Room
     */
    joinRoom(roomId) {
        this.currentRoom = roomId;
        this.updateCurrentRoomUI();
        this.loadMessages();
        this.renderRooms();
        this.clearTypingIndicator();
        this.cancelReply();
        this.updateRoomBadges();
    }
    
    /**
     * Update Current Room UI
     */
    updateCurrentRoomUI() {
        const room = this.rooms.find(r => r.id === this.currentRoom);
        if (room) {
            const iconEl = document.getElementById('currentRoomIcon');
            const nameEl = document.getElementById('currentRoomName');
            const descEl = document.getElementById('roomDescription');
            
            if (iconEl) iconEl.className = room.icon;
            if (nameEl) nameEl.textContent = room.name;
            if (descEl) descEl.textContent = room.description;
        }
    }
    
    /**
     * Create New Room
     */
    createRoom(event) {
        event.preventDefault();
        
        const name = document.getElementById('roomName').value.trim();
        const description = document.getElementById('roomDescriptionInput').value.trim();
        const icon = document.getElementById('roomIcon').value;
        
        if (!name) {
            this.showToast('Please enter a room name', 'error');
            return;
        }
        
        const roomId = name.toLowerCase().replace(/\s+/g, '-') + '_' + Date.now();
        
        const newRoom = {
            id: roomId,
            name: name,
            description: description || `Welcome to ${name} room!`,
            icon: icon,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser.name,
            topic: description || `Discussions about ${name}`,
            isPrivate: false
        };
        
        this.rooms.push(newRoom);
        this.messages[roomId] = [];
        
        // Add welcome message
        this.messages[roomId].push({
            id: 'welcome_' + Date.now(),
            senderId: 'system',
            senderName: 'System',
            senderAvatar: '🤖',
            text: `🎉 Welcome to the **${name}** room! 🎉\n\nThis room was created by ${this.currentUser.name}. Be respectful and enjoy the conversation!`,
            timestamp: new Date().toISOString(),
            type: 'system',
            reactions: [],
            isPinned: true
        });
        
        this.saveMessages();
        this.renderRooms();
        this.closeModal('createRoomModal');
        this.showToast(`Room "${name}" created successfully!`, 'success');
        
        // Join the new room
        this.joinRoom(roomId);
        
        // Save rooms to localStorage
        localStorage.setItem('chatRooms', JSON.stringify(this.rooms));
    }
    
    /**
     * Edit Profile
     */
    updateProfile(event) {
        event.preventDefault();
        
        const newName = document.getElementById('displayName').value.trim();
        const statusMessage = document.getElementById('statusMessage').value.trim();
        const avatar = document.getElementById('userAvatarEmoji').value;
        
        if (newName) {
            this.currentUser.name = newName;
        }
        if (statusMessage) {
            this.currentUser.statusMessage = statusMessage;
        }
        if (avatar) {
            this.currentUser.avatar = avatar;
        }
        
        this.updateUserUI();
        this.saveUserData();
        this.closeModal('profileModal');
        this.showToast('Profile updated successfully!', 'success');
        
        // Update all messages with new name
        for (const roomId in this.messages) {
            this.messages[roomId].forEach(msg => {
                if (msg.senderId === this.currentUser.id) {
                    msg.senderName = this.currentUser.name;
                    msg.senderAvatar = this.currentUser.avatar;
                }
            });
        }
        this.saveMessages();
        this.renderMessages(this.messages[this.currentRoom]);
    }
    
    /**
     * Select Avatar
     */
    selectAvatar(emoji, element) {
        document.getElementById('userAvatarEmoji').value = emoji;
        // Visual feedback
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(opt => opt.classList.remove('selected'));
        if (element) element.classList.add('selected');
    }
    
    /**
     * Search Messages
     */
    searchMessages() {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();
        if (!query) {
            this.renderMessages(this.messages[this.currentRoom]);
            return;
        }
        
        const filtered = this.messages[this.currentRoom].filter(msg => 
            msg.text.toLowerCase().includes(query) || 
            msg.senderName.toLowerCase().includes(query)
        );
        
        if (filtered.length === 0) {
            const container = document.getElementById('chatMessages');
            container.innerHTML = `
                <div class="empty-messages">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>No messages matching "${this.escapeHtml(query)}"</p>
                </div>
            `;
        } else {
            this.renderMessages(filtered);
            this.showToast(`Found ${filtered.length} message(s)`, 'info');
        }
    }
    
    /**
     * Toggle Search Bar
     */
    toggleSearch() {
        const searchBar = document.getElementById('searchBar');
        if (searchBar.style.display === 'none' || !searchBar.style.display) {
            searchBar.style.display = 'flex';
            document.getElementById('searchInput').focus();
        } else {
            searchBar.style.display = 'none';
            this.loadMessages();
        }
    }
    
    /**
     * Close Search
     */
    closeSearch() {
        document.getElementById('searchBar').style.display = 'none';
        this.loadMessages();
    }
    
    /**
     * Toggle Emoji Picker
     */
    toggleEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        if (picker.style.display === 'none' || !picker.style.display) {
            picker.style.display = 'flex';
            this.loadEmojis();
        } else {
            picker.style.display = 'none';
        }
    }
    
    /**
     * Load Emojis
     */
    loadEmojis() {
        const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '🚀', '💻', '🐍', '⚛️', '🤖', '🎨', '📱', '☁️', '🔒', '✨', '🌟', '💡', '🔧', '📚', '🎯', '💪', '🤝', '💬', '📝'];
        const container = document.getElementById('emojiList');
        
        if (container) {
            container.innerHTML = emojis.map(emoji => `
                <div class="emoji-item" onclick="chatSystem.insertEmoji('${emoji}')">
                    ${emoji}
                </div>
            `).join('');
        }
    }
    
    /**
     * Insert Emoji
     */
    insertEmoji(emoji) {
        const input = document.getElementById('messageInput');
        input.value += emoji;
        input.focus();
        this.closeEmojiPicker();
    }
    
    /**
     * Close Emoji Picker
     */
    closeEmojiPicker() {
        document.getElementById('emojiPicker').style.display = 'none';
    }
    
    /**
     * Attach File
     */
    attachFile() {
        document.getElementById('fileInput').click();
    }
    
    /**
     * Upload File
     */
    async uploadFile(input) {
        const file = input.files[0];
        if (!file) return;
        
        // Check file type
        if (!this.settings.allowedFileTypes.includes(file.type)) {
            this.showToast('File type not allowed! Please upload images only.', 'error');
            input.value = '';
            return;
        }
        
        // Check file size
        if (file.size > this.settings.maxFileSize) {
            this.showToast('File too large! Maximum 5MB.', 'error');
            input.value = '';
            return;
        }
        
        this.showToast('Uploading image...', 'info');
        
        // Convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const message = {
                id: 'img_' + Date.now(),
                senderId: this.currentUser.id,
                senderName: this.currentUser.name,
                senderAvatar: this.currentUser.avatar,
                text: e.target.result,
                timestamp: new Date().toISOString(),
                type: 'image',
                reactions: [],
                isPinned: false
            };
            
            this.messages[this.currentRoom].push(message);
            this.saveMessages();
            this.renderMessages(this.messages[this.currentRoom]);
            this.showToast('Image uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
        
        input.value = '';
    }
    
    /**
     * Show Code Snippet Modal
     */
    showCodeSnippet() {
        document.getElementById('codeModal').style.display = 'flex';
        document.getElementById('codeContent').value = '';
    }
    
    /**
     * Insert Code Snippet
     */
    insertCodeSnippet() {
        const language = document.getElementById('codeLanguage').value;
        const code = document.getElementById('codeContent').value;
        
        if (!code) {
            this.showToast('Please enter some code', 'error');
            return;
        }
        
        const formattedCode = `\`\`\`${language}\n${code}\n\`\`\``;
        const input = document.getElementById('messageInput');
        input.value += formattedCode + '\n';
        
        this.closeModal('codeModal');
        document.getElementById('codeContent').value = '';
        input.focus();
    }
    
    /**
     * Show Create Room Modal
     */
    showCreateRoomModal() {
        document.getElementById('createRoomModal').style.display = 'flex';
        document.getElementById('roomName').value = '';
        document.getElementById('roomDescriptionInput').value = '';
    }
    
    /**
     * Open Profile Modal
     */
    openProfileModal() {
        document.getElementById('displayName').value = this.currentUser.name;
        document.getElementById('statusMessage').value = this.currentUser.statusMessage || '';
        document.getElementById('userAvatarEmoji').value = this.currentUser.avatar;
        document.getElementById('profileModal').style.display = 'flex';
    }
    
    /**
     * Show Room Info
     */
    showRoomInfo() {
        const room = this.rooms.find(r => r.id === this.currentRoom);
        if (room) {
            const info = `
                📌 **${room.name}**\n
                📝 ${room.description}\n
                👤 Created by: ${room.createdBy || 'System'}\n
                📅 Created: ${new Date(room.createdAt).toLocaleDateString()}\n
                💬 Messages: ${this.messages[this.currentRoom]?.length || 0}
            `;
            this.showToast(info, 'info', 5000);
        }
    }
    
    /**
     * Toggle Notifications
     */
    toggleNotifications() {
        this.notifications = !this.notifications;
        this.settings.enableNotifications = this.notifications;
        this.showToast(this.notifications ? 'Notifications enabled' : 'Notifications disabled', 'info');
    }
    
    /**
     * Setup Notification Permission
     */
    async setupNotificationPermission() {
        if ('Notification' in window && this.settings.enableNotifications) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notifications enabled');
            }
        }
    }
    
    /**
     * Show Notification
     */
    showNotification(title, body) {
        if (this.notifications && document.hidden) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/assets/images/favicon.svg' });
            }
        }
    }
    
    /**
     * Play Notification Sound
     */
    playNotificationSound() {
        if (this.settings.soundEnabled && document.hidden) {
            // Create audio context for sound
            const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Sound play failed:', e));
        }
    }
    
    /**
     * Open Image
     */
    openImage(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-content">
                <img src="${imageUrl}" alt="Full size image">
                <button onclick="this.parentElement.parentElement.remove()">✖</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }
    
    /**
     * Mention User
     */
    mentionUser(username) {
        const input = document.getElementById('messageInput');
        input.value += `@${username} `;
        input.focus();
    }
    
    /**
     * On Typing
     */
    onTyping() {
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        
        // Show typing indicator for current user
        this.showTypingIndicator();
        
        this.typingTimeout = setTimeout(() => {
            this.hideTypingIndicator();
        }, this.settings.typingTimeout);
    }
    
    /**
     * Show Typing Indicator
     */
    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            document.getElementById('typingUsers').textContent = this.currentUser.name;
            indicator.style.display = 'flex';
        }
    }
    
    /**
     * Hide Typing Indicator
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    /**
     * Clear Typing Indicator
     */
    clearTypingIndicator() {
        this.hideTypingIndicator();
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
    }
    
    /**
     * Setup Typing Detection
     */
    setupTypingDetection() {
        setInterval(() => {
            // Simulate other users typing (for demo)
            if (Math.random() > 0.95 && this.messages[this.currentRoom]?.length > 0) {
                const randomUser = this.onlineUsers[Math.floor(Math.random() * this.onlineUsers.length)];
                if (randomUser && randomUser.id !== this.currentUser.id) {
                    document.getElementById('typingUsers').textContent = randomUser.name;
                    document.getElementById('typingIndicator').style.display = 'flex';
                    setTimeout(() => {
                        document.getElementById('typingIndicator').style.display = 'none';
                    }, 2000);
                }
            }
        }, 10000);
    }
    
    /**
     * Setup Message Polling
     */
    setupMessagePolling() {
        // Poll for new messages every 2 seconds
        this.messageInterval = setInterval(() => {
            const roomMessages = this.messages[this.currentRoom] || [];
            const lastMessage = roomMessages[roomMessages.length - 1];
            
            if (lastMessage && lastMessage.senderId !== this.currentUser.id) {
                this.updateRoomBadges();
                if (document.hidden) {
                    this.showNotification('New message', `${lastMessage.senderName}: ${lastMessage.text.substring(0, 50)}`);
                }
            }
        }, 2000);
    }
    
    /**
     * Start Heartbeat
     */
    startHeartbeat() {
        this.addUserToOnline();
        
        // Update online status every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            this.addUserToOnline();
        }, 30000);
    }
    
    /**
     * Add User to Online List
     */
    addUserToOnline() {
        const userIndex = this.onlineUsers.findIndex(u => u.id === this.currentUser.id);
        
        const userData = {
            id: this.currentUser.id,
            name: this.currentUser.name,
            avatar: this.currentUser.avatar,
            lastSeen: new Date().toISOString()
        };
        
        if (userIndex !== -1) {
            this.onlineUsers[userIndex] = userData;
        } else {
            this.onlineUsers.push(userData);
        }
        
        this.renderOnlineUsers();
    }
    
    /**
     * Remove User from Online List
     */
    removeUserFromOnline() {
        this.onlineUsers = this.onlineUsers.filter(u => u.id !== this.currentUser.id);
        this.renderOnlineUsers();
    }
    
    /**
     * Render Online Users
     */
    renderOnlineUsers() {
        const container = document.getElementById('onlineUsersList');
        if (!container) return;
        
        // Remove users inactive for more than 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        this.onlineUsers = this.onlineUsers.filter(u => new Date(u.lastSeen) > fiveMinutesAgo);
        
        container.innerHTML = this.onlineUsers.map(user => `
            <div class="user-item" onclick="chatSystem.mentionUser('${user.name}')">
                <span class="user-avatar-sm">${user.avatar}</span>
                <span class="user-name">${this.escapeHtml(user.name)}</span>
                <i class="fas fa-circle online-dot"></i>
            </div>
        `).join('');
        
        const onlineCount = document.getElementById('onlineCount');
        if (onlineCount) onlineCount.textContent = this.onlineUsers.length;
    }
    
    /**
     * Scroll to Bottom
     */
    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    /**
     * Close All Modals
     */
    closeAllModals() {
        const modals = ['createRoomModal', 'profileModal', 'codeModal'];
        modals.forEach(modal => {
            this.closeModal(modal);
        });
        this.closeEmojiPicker();
    }
    
    /**
     * Close Modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }
    
    /**
     * Show Toast Notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';
        
        toast.innerHTML = `${icon} ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Cleanup on Unload
     */
    cleanup() {
        if (this.messageInterval) clearInterval(this.messageInterval);
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.removeUserFromOnline();
    }
}

// Initialize chat system when DOM is ready
let chatSystem;

document.addEventListener('DOMContentLoaded', () => {
    chatSystem = new AdvancedChat();
    
    // Setup form handlers
    const createRoomForm = document.getElementById('createRoomForm');
    if (createRoomForm) {
        createRoomForm.addEventListener('submit', (e) => chatSystem.createRoom(e));
    }
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => chatSystem.updateProfile(e));
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (chatSystem) chatSystem.cleanup();
    });
});

// Global functions for HTML onclick handlers
window.sendMessage = () => chatSystem?.sendMessage();
window.joinRoom = (roomId) => chatSystem?.joinRoom(roomId);
window.handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) chatSystem?.sendMessage(); };
window.onTyping = () => chatSystem?.onTyping();
window.searchMessages = () => chatSystem?.searchMessages();
window.toggleSearch = () => chatSystem?.toggleSearch();
window.closeSearch = () => chatSystem?.closeSearch();
window.toggleEmojiPicker = () => chatSystem?.toggleEmojiPicker();
window.closeEmojiPicker = () => chatSystem?.closeEmojiPicker();
window.attachFile = () => chatSystem?.attachFile();
window.showCodeSnippet = () => chatSystem?.showCodeSnippet();
window.insertCodeSnippet = () => chatSystem?.insertCodeSnippet();
window.showCreateRoomModal = () => chatSystem?.showCreateRoomModal();
window.openProfileModal = () => chatSystem?.openProfileModal();
window.showRoomInfo = () => chatSystem?.showRoomInfo();
window.toggleNotifications = () => chatSystem?.toggleNotifications();
window.selectAvatar = (emoji, element) => chatSystem?.selectAvatar(emoji, element);
window.closeModal = (id) => chatSystem?.closeModal(id);
window.cancelReply = () => chatSystem?.cancelReply();
window.openImage = (url) => chatSystem?.openImage(url);
window.mentionUser = (username) => chatSystem?.mentionUser(username);