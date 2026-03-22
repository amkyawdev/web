/**
 * Admin Panel - Complete Management System
 * Manages platforms.json and projects.json
 */

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin0000'
};

let isAdminLoggedIn = false;
let platformsData = [];
let projectsData = [];
let currentEditPlatformId = null;
let currentEditProjectId = null;
let currentJsonTab = 'platforms';

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    setupLoginForm();
    loadJsonData();
});

function setupLoginForm() {
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                isAdminLoggedIn = true;
                document.getElementById('adminLoginCard').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                showToast('Admin login successful!', 'success');
                loadAllData();
                updateSystemInfo();
            } else {
                showToast('Invalid admin credentials!', 'error');
            }
        });
    }
}

function logoutAdmin() {
    isAdminLoggedIn = false;
    document.getElementById('adminLoginCard').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    showToast('Logged out successfully', 'info');
}

// ==================== LOAD DATA ====================

async function loadAllData() {
    await loadPlatformsData();
    await loadProjectsData();
    updateStats();
    renderPlatformsList();
    renderProjectsList();
    updateJsonEditor();
}

async function loadPlatformsData() {
    try {
        const response = await fetch('../data/platforms.json');
        if (response.ok) {
            const data = await response.json();
            platformsData = data.platforms || [];
        } else {
            // Try to load from localStorage
            const saved = localStorage.getItem('platformsData');
            if (saved) {
                platformsData = JSON.parse(saved);
            } else {
                platformsData = [];
            }
        }
    } catch (error) {
        console.error('Error loading platforms:', error);
        platformsData = [];
    }
}

async function loadProjectsData() {
    try {
        const response = await fetch('../data/projects.json');
        if (response.ok) {
            const data = await response.json();
            projectsData = data.projects || data;
            if (!Array.isArray(projectsData)) {
                projectsData = [];
            }
        } else {
            const saved = localStorage.getItem('projectsData');
            if (saved) {
                projectsData = JSON.parse(saved);
            } else {
                projectsData = [];
            }
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsData = [];
    }
}

async function loadJsonData() {
    await loadPlatformsData();
    await loadProjectsData();
    updateJsonEditor();
}

// ==================== SAVE DATA ====================

async function savePlatformsToFile() {
    const data = { platforms: platformsData, version: '3.0', lastUpdated: new Date().toISOString() };
    
    // Save to localStorage
    localStorage.setItem('platformsData', JSON.stringify(platformsData));
    
    // For demo, show download option
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'platforms.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Platforms saved! Download the file and replace in data folder', 'success');
}

async function saveProjectsToFile() {
    const data = { projects: projectsData, version: '3.0', lastUpdated: new Date().toISOString() };
    
    localStorage.setItem('projectsData', JSON.stringify(projectsData));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Projects saved! Download the file and replace in data folder', 'success');
}

// ==================== RENDER PLATFORMS ====================

function renderPlatformsList() {
    const container = document.getElementById('platformsList');
    if (!container) return;
    
    let filtered = [...platformsData];
    
    // Apply search filter
    const searchTerm = document.getElementById('platformSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    const categoryFilter = document.getElementById('platformCategoryFilter')?.value || 'all';
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-message"><p>No platforms found</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(platform => `
        <div class="admin-item">
            <div class="admin-item-info">
                <strong><i class="${platform.icon}"></i> ${escapeHtml(platform.name)}</strong>
                <p>${escapeHtml(platform.description.substring(0, 100))}...</p>
                <small>Category: ${platform.category} | Users: ${platform.users} | Rating: ${platform.rating}</small>
            </div>
            <div class="admin-item-actions">
                <button class="btn-small btn-edit" onclick="editPlatform(${platform.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-small btn-delete" onclick="deletePlatform(${platform.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function renderProjectsList() {
    const container = document.getElementById('projectsList');
    if (!container) return;
    
    let filtered = [...projectsData];
    
    const searchTerm = document.getElementById('projectSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }
    
    const categoryFilter = document.getElementById('projectCategoryFilter')?.value || 'all';
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-message"><p>No projects found</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(project => `
        <div class="admin-item">
            <div class="admin-item-info">
                <strong>${escapeHtml(project.name)}</strong>
                <p>${escapeHtml(project.description.substring(0, 100))}...</p>
                <small>Category: ${project.category} | Tech: ${project.tech} | Stars: ${project.stars}</small>
            </div>
            <div class="admin-item-actions">
                <button class="btn-small btn-edit" onclick="editProject(${project.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-small btn-delete" onclick="deleteProject(${project.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== PLATFORM CRUD ====================

function openPlatformModal(platformId = null) {
    currentEditPlatformId = platformId;
    const modal = document.getElementById('platformModal');
    const title = document.getElementById('platformModalTitle');
    const form = document.getElementById('platformForm');
    
    form.reset();
    
    if (platformId) {
        const platform = platformsData.find(p => p.id === platformId);
        if (platform) {
            title.innerHTML = '<i class="fas fa-edit"></i> Edit Platform';
            document.getElementById('platformName').value = platform.name;
            document.getElementById('platformCategory').value = platform.category;
            document.getElementById('platformShortDesc').value = platform.shortDesc || '';
            document.getElementById('platformDescription').value = platform.description;
            document.getElementById('platformIcon').value = platform.icon;
            document.getElementById('platformWebsite').value = platform.website;
            document.getElementById('platformDocs').value = platform.docs || '';
            document.getElementById('platformUsers').value = platform.users;
            document.getElementById('platformRating').value = platform.rating;
            document.getElementById('platformFounded').value = platform.founded || '';
            document.getElementById('platformTags').value = (platform.tags || []).join(', ');
            document.getElementById('platformFeatured').checked = platform.featured || false;
        }
    } else {
        title.innerHTML = '<i class="fas fa-plus"></i> Add New Platform';
        document.getElementById('platformName').value = '';
        document.getElementById('platformRating').value = '4.5';
    }
    
    modal.style.display = 'flex';
}

function savePlatform(event) {
    event.preventDefault();
    
    const platform = {
        id: currentEditPlatformId || Date.now(),
        name: document.getElementById('platformName').value,
        shortDesc: document.getElementById('platformShortDesc').value,
        description: document.getElementById('platformDescription').value,
        icon: document.getElementById('platformIcon').value,
        category: document.getElementById('platformCategory').value,
        categoryName: getCategoryName(document.getElementById('platformCategory').value),
        website: document.getElementById('platformWebsite').value,
        docs: document.getElementById('platformDocs').value,
        users: document.getElementById('platformUsers').value,
        rating: parseFloat(document.getElementById('platformRating').value),
        founded: document.getElementById('platformFounded').value,
        tags: document.getElementById('platformTags').value.split(',').map(t => t.trim()).filter(t => t),
        featured: document.getElementById('platformFeatured').checked
    };
    
    if (currentEditPlatformId) {
        const index = platformsData.findIndex(p => p.id === currentEditPlatformId);
        if (index !== -1) {
            platformsData[index] = platform;
        }
    } else {
        platformsData.push(platform);
    }
    
    savePlatformsToFile();
    renderPlatformsList();
    updateStats();
    updateJsonEditor();
    closeModal('platformModal');
    showToast('Platform saved successfully!', 'success');
}

function editPlatform(id) {
    openPlatformModal(id);
}

function deletePlatform(id) {
    if (confirm('Are you sure you want to delete this platform?')) {
        platformsData = platformsData.filter(p => p.id !== id);
        savePlatformsToFile();
        renderPlatformsList();
        updateStats();
        updateJsonEditor();
        showToast('Platform deleted!', 'success');
    }
}

// ==================== PROJECT CRUD ====================

function openProjectModal(projectId = null) {
    currentEditProjectId = projectId;
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('projectModalTitle');
    
    if (projectId) {
        const project = projectsData.find(p => p.id === projectId);
        if (project) {
            title.innerHTML = '<i class="fas fa-edit"></i> Edit Project';
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectCategory').value = project.category;
            document.getElementById('projectDescription').value = project.description;
            document.getElementById('projectTech').value = project.tech;
            document.getElementById('projectUrl').value = project.url || project.demo || '';
            document.getElementById('projectDemo').value = project.demo || '';
            document.getElementById('projectStars').value = project.stars || 0;
            document.getElementById('projectForks').value = project.forks || 0;
        }
    } else {
        title.innerHTML = '<i class="fas fa-plus"></i> Add New Project';
        document.getElementById('projectForm').reset();
        document.getElementById('projectStars').value = 0;
        document.getElementById('projectForks').value = 0;
    }
    
    modal.style.display = 'flex';
}

function saveProject(event) {
    event.preventDefault();
    
    const project = {
        id: currentEditProjectId || Date.now(),
        name: document.getElementById('projectName').value,
        category: document.getElementById('projectCategory').value,
        description: document.getElementById('projectDescription').value,
        tech: document.getElementById('projectTech').value,
        url: document.getElementById('projectUrl').value,
        demo: document.getElementById('projectDemo').value,
        stars: parseInt(document.getElementById('projectStars').value) || 0,
        forks: parseInt(document.getElementById('projectForks').value) || 0
    };
    
    if (currentEditProjectId) {
        const index = projectsData.findIndex(p => p.id === currentEditProjectId);
        if (index !== -1) {
            projectsData[index] = project;
        }
    } else {
        projectsData.push(project);
    }
    
    saveProjectsToFile();
    renderProjectsList();
    updateStats();
    updateJsonEditor();
    closeModal('projectModal');
    showToast('Project saved successfully!', 'success');
}

function editProject(id) {
    openProjectModal(id);
}

function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        projectsData = projectsData.filter(p => p.id !== id);
        saveProjectsToFile();
        renderProjectsList();
        updateStats();
        updateJsonEditor();
        showToast('Project deleted!', 'success');
    }
}

// ==================== JSON EDITOR ====================

function updateJsonEditor() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) return;
    
    if (currentJsonTab === 'platforms') {
        editor.value = JSON.stringify({ platforms: platformsData }, null, 2);
    } else {
        editor.value = JSON.stringify({ projects: projectsData }, null, 2);
    }
}

function switchJsonTab(tab) {
    currentJsonTab = tab;
    
    document.querySelectorAll('.json-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    updateJsonEditor();
}

function saveJsonToFile() {
    const editor = document.getElementById('jsonEditor');
    let data;
    
    try {
        data = JSON.parse(editor.value);
    } catch (e) {
        showToast('Invalid JSON format!', 'error');
        return;
    }
    
    if (currentJsonTab === 'platforms') {
        platformsData = data.platforms || data;
        savePlatformsToFile();
    } else {
        projectsData = data.projects || data;
        saveProjectsToFile();
    }
    
    renderPlatformsList();
    renderProjectsList();
    updateStats();
    showToast('JSON saved successfully!', 'success');
}

function formatJson() {
    const editor = document.getElementById('jsonEditor');
    try {
        const data = JSON.parse(editor.value);
        editor.value = JSON.stringify(data, null, 2);
        showToast('JSON formatted!', 'success');
    } catch (e) {
        showToast('Invalid JSON format!', 'error');
    }
}

function resetJson() {
    if (confirm('Reset to current data?')) {
        updateJsonEditor();
        showToast('Reset to saved data', 'info');
    }
}

// ==================== UTILITIES ====================

function getCategoryName(category) {
    const names = {
        ai: 'AI & Machine Learning',
        coding: 'Coding & Programming',
        mobile: 'Mobile Development',
        cloud: 'Cloud Storage & Hosting',
        database: 'Database Platforms',
        language: 'Programming Languages'
    };
    return names[category] || category;
}

function updateStats() {
    document.getElementById('totalPlatforms').textContent = platformsData.length;
    document.getElementById('totalProjects').textContent = projectsData.length;
    document.getElementById('activeUsers').textContent = Math.floor(Math.random() * 1000) + 500;
    document.getElementById('totalViews').textContent = Math.floor(Math.random() * 50000) + 10000;
}

function updateSystemInfo() {
    document.getElementById('infoPlatformsCount').textContent = platformsData.length;
    document.getElementById('infoProjectsCount').textContent = projectsData.length;
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
}

function loadStats() {
    // Load analytics from localStorage
    const analytics = JSON.parse(localStorage.getItem('platform_analytics') || '[]');
    const totalViews = analytics.filter(a => a.event === 'platform_click').length;
    document.getElementById('totalViews').textContent = totalViews || Math.floor(Math.random() * 50000) + 10000;
}

function showSection(section) {
    // Scroll to section
    document.getElementById(`${section}Tab`).scrollIntoView({ behavior: 'smooth' });
}

function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    if (tab === 'json-editor') {
        updateJsonEditor();
    }
}

function searchPlatforms() {
    renderPlatformsList();
}

function filterPlatformsByCategory() {
    renderPlatformsList();
}

function searchProjects() {
    renderProjectsList();
}

function filterProjectsByCategory() {
    renderProjectsList();
}

function exportData() {
    const data = {
        platforms: platformsData,
        projects: projectsData,
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.platforms) platformsData = data.platforms;
                if (data.projects) projectsData = data.projects;
                savePlatformsToFile();
                saveProjectsToFile();
                renderPlatformsList();
                renderProjectsList();
                updateStats();
                updateJsonEditor();
                showToast('Data imported!', 'success');
            } catch (err) {
                showToast('Invalid file format!', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function backupData() {
    exportData();
}

function restoreBackup() {
    importData();
}

function clearAllData() {
    if (confirm('WARNING: This will delete all platforms and projects! Are you sure?')) {
        platformsData = [];
        projectsData = [];
        savePlatformsToFile();
        saveProjectsToFile();
        renderPlatformsList();
        renderProjectsList();
        updateStats();
        updateJsonEditor();
        showToast('All data cleared!', 'warning');
    }
}

function changeAdminPassword() {
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    if (!newPass) {
        showToast('Please enter a password', 'error');
        return;
    }
    
    if (newPass !== confirmPass) {
        showToast('Passwords do not match!', 'error');
        return;
    }
    
    // In a real app, you'd save this securely
    ADMIN_CREDENTIALS.password = newPass;
    showToast('Password updated! (Demo only - not persistent)', 'success');
    
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Setup form handlers
document.getElementById('platformForm')?.addEventListener('submit', savePlatform);
document.getElementById('projectForm')?.addEventListener('submit', saveProject);