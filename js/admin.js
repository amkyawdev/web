/**
 * Admin Panel - Complete Management System
 */

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    passwordHash: btoa('admin0000')
};

let isAdminLoggedIn = false;
let platformsData = [];
let projectsData = [];
let currentEditPlatformId = null;
let currentEditProjectId = null;
let currentJsonTab = 'platforms';

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Admin panel loading...');
    setupLoginForm();
    loadStats();
    updateSystemInfo();
});

function setupLoginForm() {
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            
            if (username === ADMIN_CREDENTIALS.username && btoa(password) === ADMIN_CREDENTIALS.passwordHash) {
                isAdminLoggedIn = true;
                document.getElementById('adminLoginCard').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                showToast('Login successful!', 'success');
                loadAllData();
            } else {
                showToast('Invalid credentials!', 'error');
                document.getElementById('adminPassword').value = '';
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
    console.log('📁 Loading data...');
    await loadPlatformsData();
    await loadProjectsData();
    updateStats();
    renderPlatformsList();
    renderProjectsList();
    updateJsonEditor();
    updateSystemInfo();
}

async function loadPlatformsData() {
    try {
        // Try multiple paths
        let response = null;
        const paths = [
            '../data/platforms.json',
            './data/platforms.json',
            'data/platforms.json',
            '/data/platforms.json'
        ];
        
        for (const path of paths) {
            console.log(`Trying to load platforms from: ${path}`);
            const res = await fetch(path);
            if (res.ok) {
                response = res;
                console.log(`✅ Loaded platforms from: ${path}`);
                break;
            }
        }
        
        if (response) {
            const data = await response.json();
            if (data.platforms && Array.isArray(data.platforms)) {
                platformsData = data.platforms;
            } else if (Array.isArray(data)) {
                platformsData = data;
            } else {
                platformsData = [];
            }
            console.log(`✅ Loaded ${platformsData.length} platforms`);
        } else {
            // Try localStorage fallback
            const saved = localStorage.getItem('platformsData');
            if (saved) {
                platformsData = JSON.parse(saved);
                console.log(`📦 Loaded ${platformsData.length} platforms from localStorage`);
            } else {
                platformsData = [];
                console.log('⚠️ No platforms data found');
            }
        }
    } catch (error) {
        console.error('❌ Error loading platforms:', error);
        const saved = localStorage.getItem('platformsData');
        platformsData = saved ? JSON.parse(saved) : [];
    }
}

async function loadProjectsData() {
    try {
        // Try multiple paths
        let response = null;
        const paths = [
            '../data/projects.json',
            './data/projects.json',
            'data/projects.json',
            '/data/projects.json'
        ];
        
        for (const path of paths) {
            console.log(`Trying to load projects from: ${path}`);
            const res = await fetch(path);
            if (res.ok) {
                response = res;
                console.log(`✅ Loaded projects from: ${path}`);
                break;
            }
        }
        
        if (response) {
            const data = await response.json();
            if (data.projects && Array.isArray(data.projects)) {
                projectsData = data.projects;
            } else if (Array.isArray(data)) {
                projectsData = data;
            } else {
                projectsData = [];
            }
            console.log(`✅ Loaded ${projectsData.length} projects`);
        } else {
            // Try localStorage fallback
            const saved = localStorage.getItem('projectsData');
            if (saved) {
                projectsData = JSON.parse(saved);
                console.log(`📦 Loaded ${projectsData.length} projects from localStorage`);
            } else {
                projectsData = [];
                console.log('⚠️ No projects data found');
            }
        }
    } catch (error) {
        console.error('❌ Error loading projects:', error);
        const saved = localStorage.getItem('projectsData');
        projectsData = saved ? JSON.parse(saved) : [];
    }
}

// ==================== RENDER PLATFORMS ====================

function renderPlatformsList() {
    const container = document.getElementById('platformsList');
    if (!container) return;
    
    console.log(`Rendering ${platformsData.length} platforms`);
    
    if (platformsData.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-database"></i>
                <p>No platforms found. Click "Add Platform" to create one.</p>
            </div>
        `;
        return;
    }
    
    let filtered = [...platformsData];
    const searchTerm = document.getElementById('platformSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name?.toLowerCase().includes(searchTerm) ||
            p.description?.toLowerCase().includes(searchTerm)
        );
    }
    
    const categoryFilter = document.getElementById('platformCategoryFilter')?.value || 'all';
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-message">No platforms match your search</div>';
        return;
    }
    
    container.innerHTML = filtered.map(platform => `
        <div class="admin-item">
            <div class="admin-item-info">
                <strong><i class="${platform.icon || 'fas fa-cube'}"></i> ${escapeHtml(platform.name || 'Unknown')}</strong>
                <p>${escapeHtml((platform.description || 'No description').substring(0, 100))}...</p>
                <small>Category: ${getCategoryName(platform.category)} | Users: ${platform.users || 'N/A'} | ⭐ ${platform.rating || 'N/A'}</small>
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

// ==================== RENDER PROJECTS ====================

function renderProjectsList() {
    const container = document.getElementById('projectsList');
    if (!container) return;
    
    console.log(`Rendering ${projectsData.length} projects`);
    
    if (projectsData.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-database"></i>
                <p>No projects found. Click "Add Project" to create one.</p>
            </div>
        `;
        return;
    }
    
    let filtered = [...projectsData];
    const searchTerm = document.getElementById('projectSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name?.toLowerCase().includes(searchTerm) ||
            p.description?.toLowerCase().includes(searchTerm)
        );
    }
    
    const categoryFilter = document.getElementById('projectCategoryFilter')?.value || 'all';
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-message">No projects match your search</div>';
        return;
    }
    
    container.innerHTML = filtered.map(project => `
        <div class="admin-item">
            <div class="admin-item-info">
                <strong><i class="${project.icon || 'fas fa-code'}"></i> ${escapeHtml(project.name || 'Unknown')}</strong>
                <p>${escapeHtml((project.description || 'No description').substring(0, 100))}...</p>
                <small>Category: ${getProjectCategoryName(project.category)} | Tech: ${(project.technologies || []).join(', ') || 'N/A'} | ⭐ ${project.stars || 0} stars</small>
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
    
    if (platformId) {
        const platform = platformsData.find(p => p.id === platformId);
        if (platform) {
            title.innerHTML = '<i class="fas fa-edit"></i> Edit Platform';
            document.getElementById('platformName').value = platform.name || '';
            document.getElementById('platformCategory').value = platform.category || 'ai';
            document.getElementById('platformShortDesc').value = platform.shortDesc || '';
            document.getElementById('platformDescription').value = platform.description || '';
            document.getElementById('platformIcon').value = platform.icon || 'fas fa-cube';
            document.getElementById('platformWebsite').value = platform.website || '';
            document.getElementById('platformDocs').value = platform.docs || '';
            document.getElementById('platformUsers').value = platform.users || '';
            document.getElementById('platformRating').value = platform.rating || 4.5;
            document.getElementById('platformFounded').value = platform.founded || '';
            document.getElementById('platformTags').value = (platform.tags || []).join(', ');
            document.getElementById('platformFeatured').checked = platform.featured || false;
        }
    } else {
        title.innerHTML = '<i class="fas fa-plus"></i> Add Platform';
        document.getElementById('platformForm').reset();
        document.getElementById('platformRating').value = '4.5';
        document.getElementById('platformIcon').value = 'fas fa-cube';
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
        if (index !== -1) platformsData[index] = platform;
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
            document.getElementById('projectName').value = project.name || '';
            document.getElementById('projectShortDesc').value = project.shortDesc || '';
            document.getElementById('projectDescription').value = project.description || '';
            document.getElementById('projectFullDescription').value = project.fullDescription || '';
            document.getElementById('projectCategory').value = project.category || 'web';
            document.getElementById('projectIcon').value = project.icon || 'fas fa-code';
            document.getElementById('projectTechnologies').value = (project.technologies || []).join(', ');
            document.getElementById('projectGithubUrl').value = project.githubUrl || '';
            document.getElementById('projectLiveUrl').value = project.liveUrl || '';
            document.getElementById('projectStars').value = project.stars || 0;
            document.getElementById('projectForks').value = project.forks || 0;
            document.getElementById('projectLicense').value = project.license || '';
            document.getElementById('projectFeatured').checked = project.featured || false;
        }
    } else {
        title.innerHTML = '<i class="fas fa-plus"></i> Add Project';
        document.getElementById('projectForm').reset();
        document.getElementById('projectStars').value = 0;
        document.getElementById('projectForks').value = 0;
        document.getElementById('projectIcon').value = 'fas fa-code';
    }
    
    modal.style.display = 'flex';
}

function saveProject(event) {
    event.preventDefault();
    
    const project = {
        id: currentEditProjectId || Date.now(),
        name: document.getElementById('projectName').value,
        shortDesc: document.getElementById('projectShortDesc').value,
        description: document.getElementById('projectDescription').value,
        fullDescription: document.getElementById('projectFullDescription').value,
        icon: document.getElementById('projectIcon').value,
        category: document.getElementById('projectCategory').value,
        categoryName: getProjectCategoryName(document.getElementById('projectCategory').value),
        technologies: document.getElementById('projectTechnologies').value.split(',').map(t => t.trim()).filter(t => t),
        githubUrl: document.getElementById('projectGithubUrl').value,
        liveUrl: document.getElementById('projectLiveUrl').value,
        stars: parseInt(document.getElementById('projectStars').value) || 0,
        forks: parseInt(document.getElementById('projectForks').value) || 0,
        license: document.getElementById('projectLicense').value,
        featured: document.getElementById('projectFeatured').checked,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
    };
    
    if (currentEditProjectId) {
        const index = projectsData.findIndex(p => p.id === currentEditProjectId);
        if (index !== -1) projectsData[index] = { ...projectsData[index], ...project };
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

// ==================== SAVE TO FILES ====================

function savePlatformsToFile() {
    const data = { 
        platforms: platformsData, 
        version: '3.0', 
        lastUpdated: new Date().toISOString(),
        totalPlatforms: platformsData.length
    };
    localStorage.setItem('platformsData', JSON.stringify(platformsData));
    
    // Create download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'platforms.json';
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('💾 Platforms saved to file');
}

function saveProjectsToFile() {
    const data = { 
        projects: projectsData, 
        version: '3.0', 
        lastUpdated: new Date().toISOString(),
        totalProjects: projectsData.length
    };
    localStorage.setItem('projectsData', JSON.stringify(projectsData));
    
    // Create download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('💾 Projects saved to file');
}

// ==================== JSON EDITOR ====================

function updateJsonEditor() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) return;
    
    if (currentJsonTab === 'platforms') {
        const data = { 
            platforms: platformsData, 
            version: '3.0', 
            lastUpdated: new Date().toISOString(),
            totalPlatforms: platformsData.length
        };
        editor.value = JSON.stringify(data, null, 2);
    } else {
        const data = { 
            projects: projectsData, 
            version: '3.0', 
            lastUpdated: new Date().toISOString(),
            totalProjects: projectsData.length
        };
        editor.value = JSON.stringify(data, null, 2);
    }
}

function switchJsonTab(tab) {
    currentJsonTab = tab;
    document.querySelectorAll('.json-tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    updateJsonEditor();
}

function saveJsonToFile() {
    const editor = document.getElementById('jsonEditor');
    try {
        const data = JSON.parse(editor.value);
        if (currentJsonTab === 'platforms') {
            platformsData = data.platforms || [];
            savePlatformsToFile();
            renderPlatformsList();
        } else {
            projectsData = data.projects || [];
            saveProjectsToFile();
            renderProjectsList();
        }
        updateStats();
        updateJsonEditor();
        showToast('JSON saved successfully!', 'success');
    } catch (e) {
        showToast('Invalid JSON format!', 'error');
    }
}

function formatJson() {
    const editor = document.getElementById('jsonEditor');
    try {
        const data = JSON.parse(editor.value);
        editor.value = JSON.stringify(data, null, 2);
        showToast('JSON formatted!', 'success');
    } catch (e) {
        showToast('Invalid JSON!', 'error');
    }
}

function resetJson() {
    updateJsonEditor();
    showToast('Reset to current data', 'info');
}

// ==================== DATA MANAGEMENT ====================

function exportAllData() {
    const data = {
        platforms: platformsData,
        projects: projectsData,
        exportDate: new Date().toISOString(),
        version: '3.0'
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

function importAllData() {
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
                showToast('Invalid file!', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function backupData() {
    exportAllData();
}

function restoreBackup() {
    importAllData();
}

function clearAllData() {
    if (confirm('WARNING: This will delete ALL platforms and projects! Are you sure?')) {
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
    
    ADMIN_CREDENTIALS.passwordHash = btoa(newPass);
    showToast('Password updated!', 'success');
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// ==================== UTILITIES ====================

function updateStats() {
    document.getElementById('totalPlatforms').textContent = platformsData.length;
    document.getElementById('totalProjects').textContent = projectsData.length;
    document.getElementById('totalUsers').textContent = Math.floor(Math.random() * 500) + 100;
    document.getElementById('totalViews').textContent = Math.floor(Math.random() * 50000) + 5000;
    document.getElementById('infoPlatformsCount').textContent = platformsData.length;
    document.getElementById('infoProjectsCount').textContent = projectsData.length;
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
}

function updateSystemInfo() {
    document.getElementById('systemVersion').textContent = '3.0.0';
}

function loadStats() {
    const analytics = JSON.parse(localStorage.getItem('platform_analytics') || '[]');
    const totalViews = analytics.filter(a => a.event === 'platform_click').length;
    document.getElementById('totalViews').textContent = totalViews || Math.floor(Math.random() * 50000) + 5000;
}

function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tab}Tab`).classList.add('active');
    if (tab === 'json-editor') updateJsonEditor();
}

function searchPlatforms() { renderPlatformsList(); }
function filterPlatformsByCategory() { renderPlatformsList(); }
function searchProjects() { renderProjectsList(); }
function filterProjectsByCategory() { renderProjectsList(); }

function getCategoryName(category) {
    const names = { 
        ai: 'AI & ML', 
        coding: 'Coding', 
        mobile: 'Mobile', 
        cloud: 'Cloud', 
        database: 'Database', 
        language: 'Languages' 
    };
    return names[category] || category;
}

function getProjectCategoryName(category) {
    const names = { 
        web: 'Web', 
        mobile: 'Mobile', 
        ai: 'AI/ML', 
        game: 'Game', 
        devops: 'DevOps', 
        blockchain: 'Blockchain' 
    };
    return names[category] || category;
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
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Setup form handlers
document.getElementById('platformForm')?.addEventListener('submit', savePlatform);
document.getElementById('projectForm')?.addEventListener('submit', saveProject);

// Global functions
window.showTab = showTab;
window.openPlatformModal = openPlatformModal;
window.openProjectModal = openProjectModal;
window.editPlatform = editPlatform;
window.editProject = editProject;
window.deletePlatform = deletePlatform;
window.deleteProject = deleteProject;
window.searchPlatforms = searchPlatforms;
window.filterPlatformsByCategory = filterPlatformsByCategory;
window.searchProjects = searchProjects;
window.filterProjectsByCategory = filterProjectsByCategory;
window.switchJsonTab = switchJsonTab;
window.saveJsonToFile = saveJsonToFile;
window.formatJson = formatJson;
window.resetJson = resetJson;
window.exportAllData = exportAllData;
window.importAllData = importAllData;
window.backupData = backupData;
window.restoreBackup = restoreBackup;
window.clearAllData = clearAllData;
window.changeAdminPassword = changeAdminPassword;
window.logoutAdmin = logoutAdmin;
window.closeModal = closeModal;