/**
 * Projects Management System
 * Version: 3.0
 * Loads from projects.json with GitHub integration
 */

let projects = [];
let currentCategory = 'all';
let currentSort = 'stars';
let currentView = 'grid';

// ==================== INITIALIZATION ====================
async function loadProjects() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-container">
            <div class="loader"></div>
            <p>Loading projects from GitHub...</p>
        </div>
    `;
    
    try {
        const response = await fetch('../data/projects.json');
        
        if (response.ok) {
            const data = await response.json();
            projects = data.projects || [];
            console.log(`✅ Loaded ${projects.length} projects from JSON`);
            
            // Fetch GitHub stats for each project
            await fetchGitHubStats();
            
            updateCategoryCounts();
            renderProjects();
        } else {
            console.log('⚠️ projects.json not found, using default data');
            loadDefaultProjects();
        }
    } catch (error) {
        console.error('❌ Error loading projects:', error);
        loadDefaultProjects();
    }
}

async function fetchGitHubStats() {
    for (const project of projects) {
        if (project.githubUrl) {
            const githubRepo = extractGitHubRepo(project.githubUrl);
            if (githubRepo) {
                try {
                    const response = await fetch(`https://api.github.com/repos/${githubRepo}`);
                    if (response.ok) {
                        const data = await response.json();
                        project.stars = data.stargazers_count || project.stars;
                        project.forks = data.forks_count || project.forks;
                        project.issues = data.open_issues_count || project.issues;
                        project.updatedAt = data.updated_at || project.updatedAt;
                        console.log(`📊 Updated ${project.name} stats from GitHub`);
                    }
                } catch (e) {
                    console.log(`⚠️ Could not fetch GitHub stats for ${project.name}`);
                }
            }
        }
    }
}

function extractGitHubRepo(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    return match ? `${match[1]}/${match[2]}` : null;
}

function loadDefaultProjects() {
    projects = [
        {
            id: 1,
            name: "E-Commerce Platform",
            shortDesc: "Full-featured online store",
            description: "Complete e-commerce platform with payment integration and admin dashboard.",
            icon: "fas fa-shopping-cart",
            category: "web",
            technologies: ["React", "Node.js", "MongoDB", "Stripe"],
            githubUrl: "https://github.com/amkyawdev/ecommerce-platform",
            stars: 245,
            forks: 89,
            featured: true
        },
        {
            id: 2,
            name: "AI Image Generator",
            shortDesc: "Text to image using AI",
            description: "Generate stunning images from text descriptions using Stable Diffusion.",
            icon: "fas fa-brain",
            category: "ai",
            technologies: ["Python", "TensorFlow", "React", "FastAPI"],
            githubUrl: "https://github.com/amkyawdev/ai-image-generator",
            stars: 312,
            forks: 78,
            featured: true
        }
    ];
    updateCategoryCounts();
    renderProjects();
}

// ==================== CATEGORY COUNTS ====================
function updateCategoryCounts() {
    const categories = {
        all: projects.length,
        web: projects.filter(p => p.category === 'web').length,
        mobile: projects.filter(p => p.category === 'mobile').length,
        ai: projects.filter(p => p.category === 'ai').length,
        game: projects.filter(p => p.category === 'game').length,
        devops: projects.filter(p => p.category === 'devops').length,
        blockchain: projects.filter(p => p.category === 'blockchain').length
    };
    
    for (const [key, count] of Object.entries(categories)) {
        const el = document.getElementById(`count-${key}`);
        if (el) el.textContent = count;
    }
}

// ==================== FILTER & SORT ====================
function filterProjects(category) {
    currentCategory = category;
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        }
    });
    
    renderProjects();
}

function sortProjects() {
    const sortSelect = document.getElementById('sortBy');
    currentSort = sortSelect.value;
    renderProjects();
}

function getSortedProjects(filtered) {
    return [...filtered].sort((a, b) => {
        switch(currentSort) {
            case 'stars':
                return b.stars - a.stars;
            case 'forks':
                return b.forks - a.forks;
            case 'recent':
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return b.stars - a.stars;
        }
    });
}

// ==================== RENDER PROJECTS ====================
function renderProjects() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    
    let filtered = projects;
    if (currentCategory !== 'all') {
        filtered = projects.filter(p => p.category === currentCategory);
    }
    
    const sorted = getSortedProjects(filtered);
    
    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-folder-open"></i>
                <h3>No projects found</h3>
                <p>Try a different category or search term</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sorted.map((project, index) => 
        renderProjectCard(project, index)
    ).join('');
    
    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.innerHTML = `<i class="fas fa-project-diagram"></i> Showing ${sorted.length} projects`;
    }
}

function renderProjectCard(project, index) {
    const stars = formatNumber(project.stars || 0);
    const forks = formatNumber(project.forks || 0);
    const techs = project.technologies || [];
    const categoryName = getCategoryName(project.category);
    
    return `
        <div class="project-card" onclick="showProjectDetails(${project.id})" style="animation-delay: ${index * 0.05}s">
            <div class="project-image">
                <i class="${project.icon || 'fas fa-code'}"></i>
                ${project.featured ? '<div class="project-badge featured-badge">⭐ Featured</div>' : ''}
                <div class="project-badge">${categoryName}</div>
            </div>
            <div class="project-content">
                <h3>${escapeHtml(project.name)}</h3>
                ${project.shortDesc ? `<p class="project-short-desc">⚡ ${escapeHtml(project.shortDesc)}</p>` : ''}
                <p class="project-description">${escapeHtml(project.description.substring(0, 120))}...</p>
                <div class="project-tech">
                    ${techs.slice(0, 4).map(tech => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join('')}
                </div>
                <div class="github-stats">
                    <span class="github-stat"><i class="fas fa-star"></i> ${stars}</span>
                    <span class="github-stat"><i class="fas fa-code-branch"></i> ${forks}</span>
                    ${project.issues !== undefined ? `<span class="github-stat"><i class="fas fa-exclamation-circle"></i> ${project.issues} issues</span>` : ''}
                </div>
                <div class="project-links">
                    ${project.githubUrl ? `
                        <a href="${project.githubUrl}" target="_blank" class="project-link github-link" onclick="event.stopPropagation()">
                            <i class="fab fa-github"></i> View on GitHub
                        </a>
                    ` : ''}
                    ${project.liveUrl ? `
                        <a href="${project.liveUrl}" target="_blank" class="project-link demo-link" onclick="event.stopPropagation()">
                            <i class="fas fa-external-link-alt"></i> Live Demo
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// ==================== PROJECT DETAILS ====================
function showProjectDetails(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const modal = document.getElementById('projectModal');
    const titleEl = document.getElementById('modalProjectTitle');
    const bodyEl = document.getElementById('modalProjectBody');
    
    titleEl.textContent = project.name;
    
    const stars = formatNumber(project.stars || 0);
    const forks = formatNumber(project.forks || 0);
    const techs = project.technologies || [];
    
    bodyEl.innerHTML = `
        <div class="modal-full-description">
            ${escapeHtml(project.fullDescription || project.description)}
        </div>
        
        <div class="modal-details">
            <div class="modal-detail-item">
                <span class="modal-detail-label">Category</span>
                <span class="modal-detail-value">${getCategoryName(project.category)}</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">GitHub Stars</span>
                <span class="modal-detail-value"><i class="fas fa-star"></i> ${stars}</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">Forks</span>
                <span class="modal-detail-value"><i class="fas fa-code-branch"></i> ${forks}</span>
            </div>
            ${project.license ? `
            <div class="modal-detail-item">
                <span class="modal-detail-label">License</span>
                <span class="modal-detail-value">${escapeHtml(project.license)}</span>
            </div>
            ` : ''}
            ${project.contributors ? `
            <div class="modal-detail-item">
                <span class="modal-detail-label">Contributors</span>
                <span class="modal-detail-value"><i class="fas fa-users"></i> ${project.contributors}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="modal-tech-list">
            ${techs.map(tech => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join('')}
        </div>
        
        <div class="modal-actions">
            ${project.githubUrl ? `
                <a href="${project.githubUrl}" target="_blank" class="project-link github-link">
                    <i class="fab fa-github"></i> View on GitHub
                </a>
            ` : ''}
            ${project.liveUrl ? `
                <a href="${project.liveUrl}" target="_blank" class="project-link demo-link">
                    <i class="fas fa-external-link-alt"></i> Live Demo
                </a>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
}

// ==================== SEARCH ====================
function searchProjects() {
    const searchInput = document.getElementById('projectSearch');
    const term = searchInput.value.toLowerCase();
    const clearBtn = document.getElementById('clearSearch');
    
    if (term.length > 0) {
        clearBtn.style.display = 'flex';
    } else {
        clearBtn.style.display = 'none';
    }
    
    if (!term) {
        renderProjects();
        return;
    }
    
    const filtered = projects.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.technologies && p.technologies.some(t => t.toLowerCase().includes(term))) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
    );
    
    const container = document.getElementById('projectsContainer');
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-search"></i>
                <h3>No results found</h3>
                <p>No projects matching "${escapeHtml(term)}"</p>
                <button class="btn" onclick="clearSearch()">Clear Search</button>
            </div>
        `;
    } else {
        container.innerHTML = filtered.map((p, i) => renderProjectCard(p, i)).join('');
    }
    
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.innerHTML = `<i class="fas fa-search"></i> Found ${filtered.length} results for "${escapeHtml(term)}"`;
    }
}

function clearSearch() {
    const searchInput = document.getElementById('projectSearch');
    searchInput.value = '';
    document.getElementById('clearSearch').style.display = 'none';
    renderProjects();
}

// ==================== VIEW MODE ====================
function setView(view) {
    currentView = view;
    const container = document.getElementById('projectsContainer');
    container.className = `projects-container ${view}-view`;
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    localStorage.setItem('projectsView', view);
}

// ==================== UTILITIES ====================
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function getCategoryName(category) {
    const names = {
        web: 'Web Development',
        mobile: 'Mobile Apps',
        ai: 'AI & Machine Learning',
        game: 'Game Development',
        devops: 'DevOps & Tools',
        blockchain: 'Blockchain & Web3'
    };
    return names[category] || category;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Projects page loading...');
    
    // Load saved view preference
    const savedView = localStorage.getItem('projectsView');
    if (savedView) {
        currentView = savedView;
        setTimeout(() => {
            const viewBtn = document.querySelector(`.view-btn[onclick*="${savedView}"]`);
            if (viewBtn) viewBtn.classList.add('active');
        }, 100);
    }
    
    loadProjects();
    
    // Search input handler
    const searchInput = document.getElementById('projectSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchProjects);
    }
    
    // Clear search button
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }
});

// Global functions
window.filterProjects = filterProjects;
window.sortProjects = sortProjects;
window.searchProjects = searchProjects;
window.clearSearch = clearSearch;
window.showProjectDetails = showProjectDetails;
window.setView = setView;
window.closeModal = closeModal;