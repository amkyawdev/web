/**
 * Chat System v4.0 - Fixed
 * Loads from chat.json and Firebase
 */

// ==================== GLOBAL STATE ====================
let chatRooms = [];
let chatMessages = {};
let currentRoomId = 'general';
let currentUserData = null;
let onlineUsersList = [];
let typingTimer = null;
let replyToMsgId = null;
let isDataLoaded = false;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Chat system starting...');
    await loadChatData();
    await loadUserFromFirebase();
    setupEventListeners();
    startHeartbeat();
    renderRooms();
    updateRoomInfo();
    loadMessagesForRoom();
});

async function loadChatData() {
    try {
        console.log('📁 Loading chat.json...');
        const response = await fetch('../data/chat.json');
        
        if (response.ok) {
            const data = await response.json();
            chatRooms = data.rooms || getDefaultRooms();
            chatMessages = data.messages || {};
            console.log('✅ Loaded from chat.json:', chatRooms.length, 'rooms');
        } else {
            console.log('⚠️ chat.json not found, using defaults');
            chatRooms = getDefaultRooms();
            chatMessages = {};
        }
    } catch (error) {
        console.error('❌ Error loading chat.json:', error);
        chatRooms = getDefaultRooms();
        chatMessages = {};
    }
    
    // Load saved messages from localStorage
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        chatMessages = { ...chatMessages, ...parsed };
        console.log('📦 Loaded from localStorage');
    }
    
    isDataLoaded = true;
}

function getDefaultRooms() {
    return [
        { id: 'general', name: 'General', description: 'Welcome to general chat!', icon: 'fas fa-comments' },
        { id: 'tech', name: 'Technology', description: 'Discuss latest tech trends', icon: 'fas fa-microchip' },
        { id: 'projects', name: 'Projects', description: 'Share your projects', icon: 'fas fa-project-diagram' },
        { id: 'help', name: 'Help & Support', description: 'Get coding help', icon: 'fas fa-question-circle' }
    ];
}

async function loadUserFromFirebase() {
    return new Promise((resolve) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('👤 Firebase user:', user.email);
                currentUserData = {
                    id: user.uid,
                    name: user.email.split('@')[0],
                    email: user.email,
                    avatar: getRandomAvatar(),
                    status: 'Online'
                };
            } else {
                console.log('👤 Guest user');
                currentUserData = {
                    id: 'guest_' + Date.now(),
                    name: 'Guest_' + Math.floor(Math.random() * 1000),
                    email: 'guest@example.com',
                    avatar: getRandomAvatar(),
                    status: 'Online'
                };
            }
            
            // Load saved profile
            const savedProfile = localStorage.getItem('chat_profile');
            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                currentUserData.name = profile.name || currentUserData.name;
                currentUserData.avatar = profile.avatar || currentUserData.avatar;
                currentUserData.status = profile.status || currentUserData.status;
            }
            
            updateUserUI();
            saveUserProfile();
            resolve();
        });
    });
}

function getRandomAvatar() {
    const avatars = ['👨‍💻', '👩‍💻', '🚀', '💻', '🤖', '🎨', '🌟', '🔥', '⚡', '🎯'];
    return avatars[Math.floor(Math.random() * avatars.length)];
}

function saveUserProfile() {
    localStorage.setItem('chat_profile', JSON.stringify({
        name: currentUserData.name,
        avatar: currentUserData.avatar,
        status: currentUserData.status
    }));
}

function updateUserUI() {
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    const statusEl = document.getElementById('userStatus');
    
    if (nameEl) nameEl.textContent = currentUserData.name;
    if (avatarEl) avatarEl.textContent = currentUserData.avatar;
    if (statusEl) statusEl.textContent = currentUserData.status;
}

// ==================== ROOMS ====================
function renderRooms() {
    const container = document.getElementById('roomsList');
    if (!container) return;
    
    container.innerHTML = chatRooms.map(room => `
        <div class="room-item ${room.id === currentRoomId ? 'active' : ''}" 
             onclick="joinRoom('${room.id}')">
            <i class="${room.icon}"></i>
            <span>${escapeHtml(room.name)}</span>
            <span class="room-badge">${getUnreadCount(room.id)}</span>
        </div>
    `).join('');
    
    // Search filter
    const searchInput = document.getElementById('roomSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.room-item').forEach(item => {
                const name = item.querySelector('span').textContent.toLowerCase();
                item.style.display = name.includes(term) ? 'flex' : 'none';
            });
        };
    }
}

function getUnreadCount(roomId) {
    const lastRead = localStorage.getItem(`chat_read_${roomId}`);
    const msgs = chatMessages[roomId] || [];
    if (!lastRead) return msgs.length ? msgs.length : '';
    const unread = msgs.filter(m => new Date(m.timestamp) > new Date(lastRead)).length;
    return unread ? unread : '';
}

function joinRoom(roomId) {
    if (currentRoomId === roomId) return;
    
    currentRoomId = roomId;
    localStorage.setItem(`chat_read_${roomId}`, new Date().toISOString());
    
    renderRooms();
    updateRoomInfo();
    loadMessagesForRoom();
}

function updateRoomInfo() {
    const room = chatRooms.find(r => r.id === currentRoomId);
    if (room) {
        const iconEl = document.getElementById('roomIcon');
        const nameEl = document.getElementById('roomName');
        const descEl = document.getElementById('roomDesc');
        
        if (iconEl) iconEl.className = room.icon;
        if (nameEl) nameEl.textContent = room.name;
        if (descEl) descEl.textContent = room.description;
    }
}

// ==================== MESSAGES ====================
function loadMessagesForRoom() {
    const area = document.getElementById('messagesArea');
    if (!area) return;
    
    area.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading messages...</p></div>';
    
    setTimeout(() => {
        const msgs = chatMessages[currentRoomId] || [];
        renderMessages(msgs);
    }, 100);
}

function renderMessages(msgList) {
    const area = document.getElementById('messagesArea');
    if (!area) return;
    
    if (!msgList.length) {
        area.innerHTML = `
            <div class="empty-messages">
                <i class="fas fa-comment-dots"></i>
                <p>No messages yet. Be the first to say something!</p>
            </div>
        `;
        return;
    }
    
    let lastDate = null;
    let html = '';
    
    msgList.forEach(msg => {
        const date = new Date(msg.timestamp).toDateString();
        if (lastDate !== date) {
            html += `<div class="date-separator"><span>${formatMessageDate(msg.timestamp)}</span></div>`;
            lastDate = date;
        }
        html += renderMessageHtml(msg);
    });
    
    area.innerHTML = html;
    scrollToBottom();
}

function renderMessageHtml(msg) {
    const isOwn = msg.senderId === currentUserData.id;
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div class="message ${isOwn ? 'message-own' : ''}" data-id="${msg.id}">
            <div class="message-avatar">${msg.senderAvatar || '👤'}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${escapeHtml(msg.senderName)}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${formatMessageText(msg.text, msg.type)}</div>
                ${msg.reactions?.length ? renderReactionsHtml(msg.reactions) : ''}
                <div class="message-actions">
                    <button onclick="addReaction('${msg.id}', '👍')">👍</button>
                    <button onclick="addReaction('${msg.id}', '❤️')">❤️</button>
                    <button onclick="addReaction('${msg.id}', '😂')">😂</button>
                    <button onclick="replyToMessage('${msg.id}')">↩️</button>
                    ${isOwn ? `<button onclick="deleteMessage('${msg.id}')">🗑️</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

function formatMessageText(text, type) {
    if (type === 'code') {
        return `<div class="code-block"><pre><code>${escapeHtml(text)}</code></pre></div>`;
    }
    if (type === 'image') {
        return `<img src="${text}" class="message-image" onclick="window.open('${text}')" alt="Shared image">`;
    }
    
    let formatted = escapeHtml(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    formatted = formatted.replace(/@(\w+)/g, '<span class="mention" onclick="mentionUser(\'$1\')">@$1</span>');
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

function renderReactionsHtml(reactions) {
    const grouped = {};
    reactions.forEach(r => {
        if (!grouped[r.emoji]) grouped[r.emoji] = [];
        grouped[r.emoji].push(r);
    });
    
    return `
        <div class="message-reactions">
            ${Object.entries(grouped).map(([emoji, users]) => `
                <span class="reaction-badge" title="${users.map(u => u.userName).join(', ')}">
                    ${emoji} ${users.length}
                </span>
            `).join('')}
        </div>
    `;
}

function formatMessageDate(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
}

// ==================== SEND MESSAGE ====================
function sendMessage() {
    const input = document.getElementById('messageInput');
    let text = input.value.trim();
    if (!text) return;
    
    // Handle commands
    if (text.startsWith('/')) {
        handleCommand(text);
        input.value = '';
        return;
    }
    
    const newMessage = {
        id: 'msg_' + Date.now(),
        senderId: currentUserData.id,
        senderName: currentUserData.name,
        senderAvatar: currentUserData.avatar,
        text: text,
        timestamp: new Date().toISOString(),
        type: 'text',
        reactions: [],
        replyTo: replyToMsgId
    };
    
    if (!chatMessages[currentRoomId]) {
        chatMessages[currentRoomId] = [];
    }
    chatMessages[currentRoomId].push(newMessage);
    
    saveMessages();
    renderMessages(chatMessages[currentRoomId]);
    input.value = '';
    scrollToBottom();
    
    // Clear reply
    replyToMsgId = null;
    removeReplyIndicator();
    
    // Auto reply for help
    if (text.toLowerCase().includes('help')) {
        setTimeout(() => autoReply(), 1000);
    }
}

function autoReply() {
    const replyMsg = {
        id: 'bot_' + Date.now(),
        senderId: 'bot',
        senderName: 'AI Assistant',
        senderAvatar: '🤖',
        text: "🤖 I'm here to help! Type /help to see available commands.",
        timestamp: new Date().toISOString(),
        type: 'text',
        reactions: []
    };
    chatMessages[currentRoomId].push(replyMsg);
    saveMessages();
    renderMessages(chatMessages[currentRoomId]);
    scrollToBottom();
}

function handleCommand(cmd) {
    switch(cmd) {
        case '/help':
            showCommands();
            break;
        case '/clear':
            if (confirm('Clear all messages in this room?')) {
                chatMessages[currentRoomId] = [];
                saveMessages();
                renderMessages([]);
                showToast('Chat cleared', 'success');
            }
            break;
        case '/users':
            showOnlineUsers();
            break;
        default:
            showToast(`Unknown command: ${cmd}`, 'error');
    }
}

function saveMessages() {
    localStorage.setItem('chat_messages', JSON.stringify(chatMessages));
}

// ==================== MESSAGE ACTIONS ====================
function addReaction(msgId, emoji) {
    const msgs = chatMessages[currentRoomId];
    const msg = msgs?.find(m => m.id === msgId);
    if (msg) {
        if (!msg.reactions) msg.reactions = [];
        const existing = msg.reactions.find(r => r.userId === currentUserData.id && r.emoji === emoji);
        if (existing) {
            msg.reactions = msg.reactions.filter(r => !(r.userId === currentUserData.id && r.emoji === emoji));
        } else {
            msg.reactions.push({
                userId: currentUserData.id,
                userName: currentUserData.name,
                emoji: emoji,
                timestamp: new Date().toISOString()
            });
        }
        saveMessages();
        renderMessages(chatMessages[currentRoomId]);
    }
}

function replyToMessage(msgId) {
    const msg = chatMessages[currentRoomId]?.find(m => m.id === msgId);
    if (msg) {
        replyToMsgId = msgId;
        const input = document.getElementById('messageInput');
        input.placeholder = `Replying to ${msg.senderName}...`;
        input.focus();
        
        const indicator = document.createElement('div');
        indicator.className = 'reply-indicator';
        indicator.innerHTML = `<i class="fas fa-reply"></i> Replying to ${msg.senderName} <button onclick="cancelReply()">✖</button>`;
        document.querySelector('.input-area').prepend(indicator);
    }
}

function cancelReply() {
    replyToMsgId = null;
    document.getElementById('messageInput').placeholder = 'Type a message...';
    document.querySelector('.reply-indicator')?.remove();
}

function deleteMessage(msgId) {
    if (confirm('Delete this message?')) {
        const msgs = chatMessages[currentRoomId];
        const index = msgs.findIndex(m => m.id === msgId);
        if (index !== -1) {
            msgs.splice(index, 1);
            saveMessages();
            renderMessages(msgs);
            showToast('Message deleted', 'success');
        }
    }
}

// ==================== TYPING ====================
function onTyping() {
    if (typingTimer) clearTimeout(typingTimer);
    document.getElementById('typingArea').style.display = 'flex';
    typingTimer = setTimeout(() => {
        document.getElementById('typingArea').style.display = 'none';
    }, 2000);
}

// ==================== SEARCH ====================
function toggleSearch() {
    const bar = document.getElementById('searchBar');
    bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
    if (bar.style.display === 'flex') {
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').oninput = searchMessages;
    } else {
        renderMessages(chatMessages[currentRoomId]);
    }
}

function searchMessages() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    if (!term) {
        renderMessages(chatMessages[currentRoomId]);
        return;
    }
    
    const filtered = (chatMessages[currentRoomId] || []).filter(m => 
        m.text.toLowerCase().includes(term) || m.senderName.toLowerCase().includes(term)
    );
    
    const area = document.getElementById('messagesArea');
    if (!filtered.length) {
        area.innerHTML = `<div class="empty-messages"><p>No results for "${escapeHtml(term)}"</p></div>`;
    } else {
        let lastDate = null;
        let html = '';
        filtered.forEach(msg => {
            const date = new Date(msg.timestamp).toDateString();
            if (lastDate !== date) {
                html += `<div class="date-separator"><span>${formatMessageDate(msg.timestamp)}</span></div>`;
                lastDate = date;
            }
            html += renderMessageHtml(msg);
        });
        area.innerHTML = html;
    }
}

function closeSearch() {
    document.getElementById('searchBar').style.display = 'none';
    renderMessages(chatMessages[currentRoomId]);
}

// ==================== EMOJI ====================
function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    if (picker.style.display === 'block') loadEmojis();
}

function loadEmojis() {
    const emojis = ['😀','😂','❤️','👍','🎉','🔥','🚀','💻','🐍','⚛️','🤖','🎨','📱','☁️','💡','✨','🌟','🎯','💪'];
    const grid = document.getElementById('emojiGrid');
    grid.innerHTML = emojis.map(e => `<div class="emoji-item" onclick="insertEmoji('${e}')">${e}</div>`).join('');
}

function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    input.value += emoji;
    input.focus();
    closeEmojiPicker();
}

function closeEmojiPicker() {
    document.getElementById('emojiPicker').style.display = 'none';
}

// ==================== FILE UPLOAD ====================
function attachFile() {
    document.getElementById('fileInput').click();
}

function uploadFile(input) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showToast('Only images are supported', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('File too large! Max 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const imgMsg = {
            id: 'img_' + Date.now(),
            senderId: currentUserData.id,
            senderName: currentUserData.name,
            senderAvatar: currentUserData.avatar,
            text: e.target.result,
            timestamp: new Date().toISOString(),
            type: 'image',
            reactions: []
        };
        if (!chatMessages[currentRoomId]) chatMessages[currentRoomId] = [];
        chatMessages[currentRoomId].push(imgMsg);
        saveMessages();
        renderMessages(chatMessages[currentRoomId]);
        scrollToBottom();
        showToast('Image uploaded', 'success');
    };
    reader.readAsDataURL(file);
    input.value = '';
}

// ==================== CODE ====================
function showCodeModal() {
    document.getElementById('codeModal').style.display = 'flex';
    document.getElementById('codeContent').value = '';
}

function insertCode() {
    const lang = document.getElementById('codeLang').value;
    const code = document.getElementById('codeContent').value;
    if (!code) return;
    
    const formatted = `\`\`\`${lang}\n${code}\n\`\`\``;
    document.getElementById('messageInput').value += formatted + '\n';
    closeModal('codeModal');
}

// ==================== ROOM CREATE ====================
function showCreateRoomModal() {
    document.getElementById('createRoomModal').style.display = 'flex';
    document.getElementById('roomName').value = '';
    document.getElementById('roomDescInput').value = '';
}

function createRoom(e) {
    e.preventDefault();
    const name = document.getElementById('roomName').value.trim();
    if (!name) {
        showToast('Please enter room name', 'error');
        return;
    }
    
    const newRoom = {
        id: name.toLowerCase().replace(/\s+/g, '-') + '_' + Date.now(),
        name: name,
        description: document.getElementById('roomDescInput').value || `Welcome to ${name}`,
        icon: document.getElementById('roomIconSelect').value
    };
    
    chatRooms.push(newRoom);
    chatMessages[newRoom.id] = [];
    saveRooms();
    renderRooms();
    closeModal('createRoomModal');
    showToast(`Room "${name}" created!`, 'success');
    joinRoom(newRoom.id);
}

function saveRooms() {
    localStorage.setItem('chat_rooms', JSON.stringify(chatRooms));
}

// ==================== PROFILE ====================
function openProfileModal() {
    document.getElementById('displayName').value = currentUserData.name;
    document.getElementById('statusMsg').value = currentUserData.status || '';
    loadAvatarGrid();
    document.getElementById('profileModal').style.display = 'flex';
}

function loadAvatarGrid() {
    const avatars = ['👨‍💻','👩‍💻','🚀','💻','🤖','🎨','🌟','🔥','⚡','🎯','🐍','⚛️'];
    const grid = document.getElementById('avatarGrid');
    grid.innerHTML = avatars.map(a => `
        <div class="avatar-option ${currentUserData.avatar === a ? 'selected' : ''}" onclick="selectAvatar('${a}', this)">${a}</div>
    `).join('');
}

function selectAvatar(avatar, element) {
    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('selectedAvatar').value = avatar;
}

function updateProfile(e) {
    e.preventDefault();
    currentUserData.name = document.getElementById('displayName').value;
    currentUserData.status = document.getElementById('statusMsg').value;
    const newAvatar = document.getElementById('selectedAvatar').value;
    if (newAvatar) currentUserData.avatar = newAvatar;
    
    updateUserUI();
    saveUserProfile();
    closeModal('profileModal');
    showToast('Profile updated', 'success');
}

// ==================== ONLINE USERS ====================
function startHeartbeat() {
    addToOnline();
    setInterval(addToOnline, 30000);
}

function addToOnline() {
    const idx = onlineUsersList.findIndex(u => u.id === currentUserData.id);
    const userData = {
        id: currentUserData.id,
        name: currentUserData.name,
        avatar: currentUserData.avatar,
        lastSeen: new Date().toISOString()
    };
    if (idx !== -1) onlineUsersList[idx] = userData;
    else onlineUsersList.push(userData);
    renderOnlineUsers();
}

function renderOnlineUsers() {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000);
    onlineUsersList = onlineUsersList.filter(u => new Date(u.lastSeen) > fiveMinsAgo);
    
    const container = document.getElementById('onlineUsersList');
    container.innerHTML = onlineUsersList.map(u => `
        <div class="user-item" onclick="mentionUser('${u.name}')">
            <i class="fas fa-circle" style="font-size: 8px; color: #4ade80;"></i>
            <span>${escapeHtml(u.name)}</span>
        </div>
    `).join('');
    document.getElementById('onlineCount').textContent = onlineUsersList.length;
}

function mentionUser(username) {
    const input = document.getElementById('messageInput');
    input.value += `@${username} `;
    input.focus();
}

function showOnlineUsers() {
    const names = onlineUsersList.map(u => u.name).join(', ');
    showToast(`Online (${onlineUsersList.length}): ${names || 'Only you'}`, 'info');
}

// ==================== NOTIFICATIONS ====================
function toggleNotifications() {
    const enabled = localStorage.getItem('chat_notifications') !== 'false';
    localStorage.setItem('chat_notifications', !enabled);
    const btn = document.getElementById('notifBtn');
    btn.innerHTML = !enabled ? '<i class="fas fa-bell"></i>' : '<i class="fas fa-bell-slash"></i>';
    showToast(!enabled ? 'Notifications on' : 'Notifications off', 'info');
}

// ==================== COMMANDS ====================
function showCommands() {
    const container = document.getElementById('commandsList');
    container.innerHTML = `
        <div class="command-item"><code>/help</code><span>Show all commands</span></div>
        <div class="command-item"><code>/clear</code><span>Clear chat history</span></div>
        <div class="command-item"><code>/users</code><span>Show online users</span></div>
    `;
    document.getElementById('commandsModal').style.display = 'flex';
}

function showRoomInfo() {
    const room = chatRooms.find(r => r.id === currentRoomId);
    showToast(`${room?.name}\n${room?.description}`, 'info', 3000);
}

// ==================== UTILITIES ====================
function scrollToBottom() {
    const area = document.getElementById('messagesArea');
    if (area) area.scrollTop = area.scrollHeight;
}

function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function removeReplyIndicator() {
    document.querySelector('.reply-indicator')?.remove();
}

function setupEventListeners() {
    const createForm = document.getElementById('createRoomForm');
    if (createForm) createForm.addEventListener('submit', createRoom);
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) profileForm.addEventListener('submit', updateProfile);
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// ==================== EXPORT GLOBALS ====================
window.joinRoom = joinRoom;
window.sendMessage = sendMessage;
window.handleKeyPress = handleKeyPress;
window.onTyping = onTyping;
window.toggleSearch = toggleSearch;
window.closeSearch = closeSearch;
window.toggleEmojiPicker = toggleEmojiPicker;
window.insertEmoji = insertEmoji;
window.closeEmojiPicker = closeEmojiPicker;
window.attachFile = attachFile;
window.uploadFile = uploadFile;
window.showCodeModal = showCodeModal;
window.insertCode = insertCode;
window.showCreateRoomModal = showCreateRoomModal;
window.openProfileModal = openProfileModal;
window.selectAvatar = selectAvatar;
window.closeModal = closeModal;
window.addReaction = addReaction;
window.replyToMessage = replyToMessage;
window.cancelReply = cancelReply;
window.deleteMessage = deleteMessage;
window.showCommands = showCommands;
window.showRoomInfo = showRoomInfo;
window.toggleNotifications = toggleNotifications;
window.mentionUser = mentionUser;