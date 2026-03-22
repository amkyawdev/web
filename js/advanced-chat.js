// Advanced Chat System with JSON Data Storage
class AdvancedChat {
    constructor() {
        this.currentRoom = 'general';
        this.messages = [];
        this.rooms = [];
        this.onlineUsers = [];
        this.currentUser = null;
        this.typingUsers = new Set();
        this.typingTimeout = null;
        this.messageCooldown = false;
        this.notifications = true;
        this.searchResults = [];
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.startHeartbeat();
        this.renderRooms();
        this.loadMessages();
        this.setupTypingDetection();
    }
    
    async loadData() {
        try {
            // Load chat data from JSON
            const response = await fetch('../data/chat.json');
            const data = await response.json();
            
            this.rooms = data.rooms;
            this.messages = data.messages;
            this.settings = data.settings;
            
            // Load user data from localStorage
            const savedUser = localStorage.getItem('chatUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            } else {
                this.currentUser = this.getDefaultUser();
            }
            
            this.updateUserUI();
            
        } catch (error) {
            console.error('Error loading chat data:', error);
            this.loadDefaultData();
        }
    }
    
    getDefaultUser() {
        const firebaseUser = firebase.auth().currentUser;
        return {
            id: firebaseUser ? firebaseUser.uid : 'guest_' + Date.now(),
            name: firebaseUser ? firebaseUser.email.split('@')[0] : 'Guest',
            email: firebaseUser ? firebaseUser.email : 'guest@example.com',
            avatar: '👨‍💻',
            status: 'Online',
            statusMessage: 'Hello, I\'m using Developer Chat!',
            joinedAt: new Date().toISOString()
        };
    }
    
    loadDefaultData() {
        // Default rooms if JSON fails to load
        this.rooms = [
            { id: 'general', name: 'General Discussion', description: 'Welcome to general chat', icon: 'fas fa-comments' },
            { id: 'tech', name: 'Technology & Innovation', description: 'Discuss latest tech trends', icon: 'fas fa-microchip' },
            { id: 'projects', name: 'Project Collaboration', description: 'Collaborate on projects', icon: 'fas fa-project-diagram' }
        ];
        
        if (!this.messages) {
            this.messages = { general: [] };
        }
    }
    
    saveData() {
        // Save messages to localStorage (since we can't write to JSON file directly)
        const saveData = {
            messages: this.messages,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('chatMessages', JSON.stringify(saveData));
    }
    
    setupEventListeners() {
        // Listen for auth changes
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser.id = user.uid;
                this.currentUser.email = user.email;
                this.currentUser.name = user.email.split('@')[0];
                this.updateUserUI();
                this.addUserToOnline();
            }
        });
    }
    
    updateUserUI() {
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        const statusMessageEl = document.getElementById('statusMessage');
        
        if (userNameEl) userNameEl.textContent = this.currentUser.name;
        if (userAvatarEl) userAvatarEl.innerHTML = `<span style="font-size: 40px;">${this.currentUser.avatar}</span>`;
        if (statusMessageEl && this.currentUser.statusMessage) {
            document.getElementById('userStatus').innerHTML = `<i class="fas fa-circle online-dot"></i> ${this.currentUser.statusMessage}`;
        }
        
        // Save user to localStorage
        localStorage.setItem('chatUser', JSON.stringify(this.currentUser));
    }
    
    renderRooms() {
        const roomList = document.getElementById('roomList');
        if (!roomList) return;
        
        roomList.innerHTML = this.rooms.map(room => `
            <div class="room-item ${room.id === this.currentRoom ? 'active' : ''}" 
                 onclick="chatSystem.joinRoom('${room.id}')">
                <i class="${room.icon}"></i>
                <span>${this.escapeHtml(room.name)}</span>
                <span class="room-badge" id="badge-${room.id}">
                    ${this.getUnreadCount(room.id)}
                </span>
            </div>
        `).join('');
    }
    
    getUnreadCount(roomId) {
        const lastRead = localStorage.getItem(`lastRead_${roomId}`);
        const messages = this.messages[roomId] || [];
        if (!lastRead) return messages.length;
        
        const unread = messages.filter(m => m.timestamp > lastRead).length;
        return unread > 0 ? unread : '';
    }
    
    async loadMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-messages"><div class="loader"></div><p>Loading messages...</p></div>';
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const roomMessages = this.messages[this.currentRoom] || [];
        this.renderMessages(roomMessages);
        
        // Mark as read
        localStorage.setItem(`lastRead_${this.currentRoom}`, new Date().toISOString());
        this.updateRoomBadges();
    }
    
    renderMessages(messages) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="empty-messages">
                    <i class="fas fa-comment-dots"></i>
                    <h3>No messages yet</h3>
                    <p>Be the first to start the conversation!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = messages.map(msg => this.renderMessage(msg)).join('');
        this.scrollToBottom();
    }
    
    renderMessage(msg) {
        const isOwn = msg.senderId === this.currentUser.id;
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const date = new Date(msg.timestamp).toLocaleDateString();
        
        let messageHtml = '';
        
        // Add date separator if needed
        if (this.shouldShowDateSeparator(msg.timestamp)) {
            messageHtml += `<div class="date-separator"><span>${date}</span></div>`;
        }
        
        messageHtml += `
            <div class="message ${isOwn ? 'message-own' : ''}" data-message-id="${msg.id}">
                <div class="message-avatar">
                    ${msg.senderAvatar || '👤'}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${this.escapeHtml(msg.senderName)}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">
                        ${this.formatMessageContent(msg.text, msg.type)}
                    </div>
                    ${msg.reactions && msg.reactions.length > 0 ? this.renderReactions(msg.reactions) : ''}
                    <div class="message-actions">
                        <button onclick="chatSystem.addReaction('${msg.id}', '👍')" title="Like">👍</button>
                        <button onclick="chatSystem.addReaction('${msg.id}', '❤️')" title="Love">❤️</button>
                        <button onclick="chatSystem.addReaction('${msg.id}', '😂')" title="Laugh">😂</button>
                        <button onclick="chatSystem.replyToMessage('${msg.id}')" title="Reply">↩️</button>
                        <button onclick="chatSystem.pinMessage('${msg.id}')" title="Pin">📌</button>
                    </div>
                </div>
            </div>
        `;
        
        return messageHtml;
    }
    
    formatMessageContent(text, type) {
        if (type === 'code') {
            return `<div class="code-block"><pre><code>${this.escapeHtml(text)}</code></pre></div>`;
        } else if (type === 'image') {
            return `<img src="${text}" class="message-image" onclick="window.open('${text}')">`;
        }
        
        // Parse markdown and emojis
        let formatted = this.escapeHtml(text);
        formatted = this.parseEmojis(formatted);
        formatted = this.parseMentions(formatted);
        formatted = this.parseLinks(formatted);
        
        return formatted.replace(/\n/g, '<br>');
    }
    
    parseEmojis(text) {
        const emojiMap = {
            ':smile:': '😊',
            ':laugh:': '😂',
            ':love:': '❤️',
            ':thumbsup:': '👍',
            ':code:': '💻',
            ':rocket:': '🚀'
        };
        
        for (const [key, value] of Object.entries(emojiMap)) {
            text = text.replace(new RegExp(key, 'g'), value);
        }
        
        return text;
    }
    
    parseMentions(text) {
        return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    }
    
    parseLinks(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, '<a href="$1" target="_blank" class="message-link">$1</a>');
    }
    
    async sendMessage() {
        if (this.messageCooldown) {
            this.showToast('Please wait a moment before sending another message');
            return;
        }
        
        const input = document.getElementById('messageInput');
        let text = input.value.trim();
        
        if (!text) return;
        
        // Check message length
        if (text.length > this.settings.maxMessageLength) {
            this.showToast(`Message too long! Maximum ${this.settings.maxMessageLength} characters`);
            return;
        }
        
        const message = {
            id: Date.now().toString(),
            senderId: this.currentUser.id,
            senderName: this.currentUser.name,
            senderAvatar: this.currentUser.avatar,
            text: text,
            timestamp: new Date().toISOString(),
            type: 'text',
            reactions: [],
            isPinned: false
        };
        
        // Add to messages
        if (!this.messages[this.currentRoom]) {
            this.messages[this.currentRoom] = [];
        }
        this.messages[this.currentRoom].push(message);
        
        // Save and render
        this.saveData();
        this.renderMessages(this.messages[this.currentRoom]);
        
        // Clear input
        input.value = '';
        this.messageCooldown = true;
        
        // Reset cooldown
        setTimeout(() => {
            this.messageCooldown = false;
        }, this.settings.messageCooldown * 1000);
        
        // Simulate AI response for demo
        if (text.toLowerCase().includes('help')) {
            setTimeout(() => this.sendAutoReply(), 1000);
        }
        
        // Update room badges
        this.updateRoomBadges();
    }
    
    sendAutoReply() {
        const reply = {
            id: Date.now().toString(),
            senderId: 'ai_assistant',
            senderName: 'AI Assistant',
            senderAvatar: '🤖',
            text: 'I\'m here to help! What specific assistance do you need? You can ask about coding, platforms, or projects!',
            timestamp: new Date().toISOString(),
            type: 'text',
            reactions: [],
            isPinned: false
        };
        
        this.messages[this.currentRoom].push(reply);
        this.saveData();
        this.renderMessages(this.messages[this.currentRoom]);
    }
    
    addReaction(messageId, reaction) {
        const message = this.findMessage(messageId);
        if (message) {
            if (!message.reactions) message.reactions = [];
            
            const existingReaction = message.reactions.find(r => r.userId === this.currentUser.id && r.emoji === reaction);
            if (existingReaction) {
                // Remove reaction
                message.reactions = message.reactions.filter(r => !(r.userId === this.currentUser.id && r.emoji === reaction));
            } else {
                // Add reaction
                message.reactions.push({
                    userId: this.currentUser.id,
                    userName: this.currentUser.name,
                    emoji: reaction,
                    timestamp: new Date().toISOString()
                });
            }
            
            this.saveData();
            this.renderMessages(this.messages[this.currentRoom]);
        }
    }
    
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
    
    joinRoom(roomId) {
        this.currentRoom = roomId;
        this.updateCurrentRoomUI();
        this.loadMessages();
        this.renderRooms();
        this.clearTypingIndicator();
    }
    
    updateCurrentRoomUI() {
        const room = this.rooms.find(r => r.id === this.currentRoom);
        if (room) {
            document.getElementById('currentRoomIcon').className = room.icon;
            document.getElementById('currentRoomName').textContent = room.name;
            document.getElementById('roomDescription').textContent = room.description;
        }
    }
    
    onTyping() {
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        
        // Show typing indicator for current user
        this.showTypingIndicator();
        
        this.typingTimeout = setTimeout(() => {
            this.hideTypingIndicator();
        }, 1000);
    }
    
    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            document.getElementById('typingUsers').textContent = this.currentUser.name;
            indicator.style.display = 'block';
        }
    }
    
    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    clearTypingIndicator() {
        this.hideTypingIndicator();
    }
    
    searchMessages() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        if (!query) {
            this.renderMessages(this.messages[this.currentRoom]);
            return;
        }
        
        const filtered = this.messages[this.currentRoom].filter(msg => 
            msg.text.toLowerCase().includes(query) || 
            msg.senderName.toLowerCase().includes(query)
        );
        
        this.renderMessages(filtered);
    }
    
    toggleSearch() {
        const searchBar = document.getElementById('searchBar');
        searchBar.style.display = searchBar.style.display === 'none' ? 'flex' : 'none';
        if (searchBar.style.display === 'flex') {
            document.getElementById('searchInput').focus();
        } else {
            this.loadMessages();
        }
    }
    
    closeSearch() {
        document.getElementById('searchBar').style.display = 'none';
        this.loadMessages();
    }
    
    toggleEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
        
        if (picker.style.display === 'flex') {
            this.loadEmojis();
        }
    }
    
    loadEmojis() {
        const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '🚀', '💻', '🐍', '⚛️', '🤖', '🎨', '📱', '☁️', '🔒'];
        const container = document.getElementById('emojiList');
        
        container.innerHTML = emojis.map(emoji => `
            <div class="emoji-item" onclick="chatSystem.insertEmoji('${emoji}')">
                ${emoji}
            </div>
        `).join('');
    }
    
    insertEmoji(emoji) {
        const input = document.getElementById('messageInput');
        input.value += emoji;
        input.focus();
        this.closeEmojiPicker();
    }
    
    closeEmojiPicker() {
        document.getElementById('emojiPicker').style.display = 'none';
    }
    
    attachFile() {
        document.getElementById('fileInput').click();
    }
    
    async uploadFile(input) {
        const file = input.files[0];
        if (!file) return;
        
        // Check file type
        if (!this.settings.allowedFileTypes.includes(file.type)) {
            this.showToast('File type not allowed! Please upload images only.');
            return;
        }
        
        // Check file size
        if (file.size > this.settings.maxFileSize) {
            this.showToast('File too large! Maximum 5MB.');
            return;
        }
        
        // Convert to base64 for demo (in production, upload to Firebase Storage)
        const reader = new FileReader();
        reader.onload = (e) => {
            const message = {
                id: Date.now().toString(),
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
            this.saveData();
            this.renderMessages(this.messages[this.currentRoom]);
        };
        reader.readAsDataURL(file);
        
        input.value = '';
    }
    
    showCodeSnippet() {
        document.getElementById('codeModal').style.display = 'flex';
    }
    
    insertCodeSnippet() {
        const language = document.getElementById('codeLanguage').value;
        const code = document.getElementById('codeContent').value;
        
        if (!code) return;
        
        const formattedCode = `\`\`\`${language}\n${code}\n\`\`\``;
        const input = document.getElementById('messageInput');
        input.value += formattedCode;
        
        this.closeModal('codeModal');
        document.getElementById('codeContent').value = '';
        input.focus();
    }
    
    showCreateRoomModal() {
        document.getElementById('createRoomModal').style.display = 'flex';
    }
    
    createRoom(event) {
        event.preventDefault();
        
        const name = document.getElementById('roomName').value;
        const description = document.getElementById('roomDescriptionInput').value;
        const icon = document.getElementById('roomIcon').value;
        
        const newRoom = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name: name,
            description: description || `Welcome to ${name} room!`,
            icon: icon,
            createdAt: new Date().toISOString(),
            isPrivate: false
        };
        
        this.rooms.push(newRoom);
        this.messages[newRoom.id] = [];
        
        this.renderRooms();
        this.closeModal('createRoomModal');
        this.showToast(`Room "${name}" created successfully!`);
        
        // Save rooms to localStorage
        localStorage.setItem('chatRooms', JSON.stringify(this.rooms));
    }
    
    openProfileModal() {
        document.getElementById('displayName').value = this.currentUser.name;
        document.getElementById('statusMessage').value = this.currentUser.statusMessage || '';
        document.getElementById('userAvatarEmoji').value = this.currentUser.avatar;
        document.getElementById('profileModal').style.display = 'flex';
    }
    
    updateProfile(event) {
        event.preventDefault();
        
        this.currentUser.name = document.getElementById('displayName').value;
        this.currentUser.statusMessage = document.getElementById('statusMessage').value;
        this.currentUser.avatar = document.getElementById('userAvatarEmoji').value || '👨‍💻';
        
        this.updateUserUI();
        this.closeModal('profileModal');
        this.showToast('Profile updated successfully!');
    }
    
    selectAvatar(emoji) {
        document.getElementById('userAvatarEmoji').value = emoji;
        // Visual feedback
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(opt => opt.classList.remove('selected'));
        event.target.classList.add('selected');
    }
    
    showRoomInfo() {
        const room = this.rooms.find(r => r.id === this.currentRoom);
        if (room) {
            this.showToast(`${room.name}\n${room.description}\nCreated: ${new Date(room.createdAt).toLocaleDateString()}`);
        }
    }
    
    toggleNotifications() {
        this.notifications = !this.notifications;
        this.showToast(this.notifications ? 'Notifications enabled' : 'Notifications disabled');
    }
    
    pinMessage(messageId) {
        const message = this.findMessage(messageId);
        if (message) {
            message.isPinned = !message.isPinned;
            this.saveData();
            this.renderMessages(this.messages[this.currentRoom]);
            this.showToast(message.isPinned ? 'Message pinned!' : 'Message unpinned');
        }
    }
    
    replyToMessage(messageId) {
        const message = this.findMessage(messageId);
        if (message) {
            const input = document.getElementById('messageInput');
            input.value = `@${message.senderName} `;
            input.focus();
        }
    }
    
    findMessage(messageId) {
        const messages = this.messages[this.currentRoom] || [];
        return messages.find(m => m.id === messageId);
    }
    
    updateRoomBadges() {
        document.querySelectorAll('.room-badge').forEach(badge => {
            const roomId = badge.id.replace('badge-', '');
            const unread = this.getUnreadCount(roomId);
            badge.textContent = unread;
            badge.style.display = unread ? 'inline-block' : 'none';
        });
    }
    
    startHeartbeat() {
        // Update online status every 30 seconds
        setInterval(() => {
            this.addUserToOnline();
        }, 30000);
    }
    
    addUserToOnline() {
        if (!this.onlineUsers.find(u => u.id === this.currentUser.id)) {
            this.onlineUsers.push({
                id: this.currentUser.id,
                name: this.currentUser.name,
                avatar: this.currentUser.avatar,
                lastSeen: new Date().toISOString()
            });
            this.renderOnlineUsers();
        }
    }
    
    renderOnlineUsers() {
        const container = document.getElementById('onlineUsersList');
        if (!container) return;
        
        container.innerHTML = this.onlineUsers.map(user => `
            <div class="user-item" onclick="chatSystem.startPrivateChat('${user.id}')">
                <span class="user-avatar-sm">${user.avatar}</span>
                <span class="user-name">${this.escapeHtml(user.name)}</span>
                <i class="fas fa-circle online-dot"></i>
            </div>
        `).join('');
        
        document.getElementById('onlineCount').textContent = this.onlineUsers.length;
    }
    
    setupTypingDetection() {
        setInterval(() => {
            // Remove users who haven't been active for 5 minutes
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            this.onlineUsers = this.onlineUsers.filter(u => new Date(u.lastSeen) > fiveMinutesAgo);
            this.renderOnlineUsers();
        }, 60000);
    }
    
    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
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
    
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chat system
let chatSystem;

document.addEventListener('DOMContentLoaded', () => {
    chatSystem = new AdvancedChat();
    
    // Setup form handlers
    document.getElementById('createRoomForm')?.addEventListener('submit', (e) => chatSystem.createRoom(e));
    document.getElementById('profileForm')?.addEventListener('submit', (e) => chatSystem.updateProfile(e));
    
    // Global functions
    window.sendMessage = () => chatSystem.sendMessage();
    window.joinRoom = (roomId) => chatSystem.joinRoom(roomId);
    window.handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) chatSystem.sendMessage(); };
    window.onTyping = () => chatSystem.onTyping();
    window.searchMessages = () => chatSystem.searchMessages();
    window.toggleSearch = () => chatSystem.toggleSearch();
    window.closeSearch = () => chatSystem.closeSearch();
    window.toggleEmojiPicker = () => chatSystem.toggleEmojiPicker();
    window.closeEmojiPicker = () => chatSystem.closeEmojiPicker();
    window.attachFile = () => chatSystem.attachFile();
    window.showCodeSnippet = () => chatSystem.showCodeSnippet();
    window.insertCodeSnippet = () => chatSystem.insertCodeSnippet();
    window.showCreateRoomModal = () => chatSystem.showCreateRoomModal();
    window.openProfileModal = () => chatSystem.openProfileModal();
    window.showRoomInfo = () => chatSystem.showRoomInfo();
    window.toggleNotifications = () => chatSystem.toggleNotifications();
    window.selectAvatar = (emoji) => chatSystem.selectAvatar(emoji);
    window.closeModal = (id) => chatSystem.closeModal(id);
});