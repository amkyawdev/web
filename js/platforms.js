/**
 * Platforms Management System
 * Auto loads default data if JSON not found
 */

let platforms = [];
let currentCategory = 'all';

// ==================== DEFAULT PLATFORMS DATA ====================
const DEFAULT_PLATFORMS = [
    {
        id: 1,
        name: "OpenAI",
        shortDesc: "GPT-4, DALL-E, API",
        description: "Advanced AI models including GPT-4 for text generation and DALL-E for image creation. Build powerful AI applications with state-of-the-art models.",
        icon: "fas fa-robot",
        category: "ai",
        categoryName: "AI & Machine Learning",
        website: "https://openai.com",
        docs: "https://platform.openai.com/docs",
        users: "1M+",
        rating: 4.9,
        featured: true,
        tags: ["GPT-4", "DALL-E", "API"],
        founded: "2015"
    },
    {
        id: 2,
        name: "Hugging Face",
        shortDesc: "Transformers, Models, Datasets",
        description: "Access 500,000+ pre-trained models and datasets for machine learning projects.",
        icon: "fas fa-smile",
        category: "ai",
        categoryName: "AI & Machine Learning",
        website: "https://huggingface.co",
        docs: "https://huggingface.co/docs",
        users: "500K+",
        rating: 4.8,
        featured: true,
        tags: ["Transformers", "NLP", "Models"],
        founded: "2016"
    },
    {
        id: 3,
        name: "Google AI Studio",
        shortDesc: "Gemini API, Vertex AI",
        description: "Google's AI platform with Gemini API and Vertex AI for building AI applications.",
        icon: "fab fa-google",
        category: "ai",
        categoryName: "AI & Machine Learning",
        website: "https://makersuite.google.com",
        docs: "https://ai.google.dev",
        users: "2M+",
        rating: 4.7,
        featured: true,
        tags: ["Gemini", "Vertex AI", "TensorFlow"],
        founded: "2017"
    },
    {
        id: 4,
        name: "GitHub",
        shortDesc: "Version Control, Copilot",
        description: "World's leading developer platform for version control and collaboration. 100M+ developers.",
        icon: "fab fa-github",
        category: "coding",
        categoryName: "Coding & Programming",
        website: "https://github.com",
        docs: "https://docs.github.com",
        users: "100M+",
        rating: 4.9,
        featured: true,
        tags: ["Git", "Copilot", "Open Source"],
        founded: "2008"
    },
    {
        id: 5,
        name: "GitLab",
        shortDesc: "DevOps, CI/CD",
        description: "Complete DevOps platform with built-in CI/CD and project management.",
        icon: "fab fa-gitlab",
        category: "coding",
        categoryName: "Coding & Programming",
        website: "https://gitlab.com",
        docs: "https://docs.gitlab.com",
        users: "30M+",
        rating: 4.7,
        featured: true,
        tags: ["DevOps", "CI/CD", "Git"],
        founded: "2011"
    },
    {
        id: 6,
        name: "Stack Overflow",
        shortDesc: "Q&A, Developer Community",
        description: "The largest online community for developers to learn and share knowledge.",
        icon: "fab fa-stack-overflow",
        category: "coding",
        categoryName: "Coding & Programming",
        website: "https://stackoverflow.com",
        docs: "https://stackoverflow.com/help",
        users: "50M+",
        rating: 4.8,
        featured: true,
        tags: ["Q&A", "Community", "Help"],
        founded: "2008"
    },
    {
        id: 7,
        name: "React Native",
        shortDesc: "Cross-platform Mobile",
        description: "Build native mobile apps for iOS and Android using React.",
        icon: "fab fa-react",
        category: "mobile",
        categoryName: "Mobile Development",
        website: "https://reactnative.dev",
        docs: "https://reactnative.dev/docs",
        users: "10M+",
        rating: 4.8,
        featured: true,
        tags: ["React", "iOS", "Android"],
        founded: "2015"
    },
    {
        id: 8,
        name: "Flutter",
        shortDesc: "UI Toolkit",
        description: "Google's UI toolkit for building natively compiled applications from a single codebase.",
        icon: "fas fa-mobile-alt",
        category: "mobile",
        categoryName: "Mobile Development",
        website: "https://flutter.dev",
        docs: "https://docs.flutter.dev",
        users: "8M+",
        rating: 4.8,
        featured: true,
        tags: ["Dart", "Cross-platform", "UI"],
        founded: "2017"
    },
    {
        id: 9,
        name: "Firebase",
        shortDesc: "Backend, Auth, Database",
        description: "Google's mobile platform for developing high-quality apps.",
        icon: "fas fa-fire",
        category: "mobile",
        categoryName: "Mobile Development",
        website: "https://firebase.google.com",
        docs: "https://firebase.google.com/docs",
        users: "3M+",
        rating: 4.8,
        featured: true,
        tags: ["Backend", "Auth", "Database"],
        founded: "2011"
    },
    {
        id: 10,
        name: "AWS",
        shortDesc: "Cloud Computing",
        description: "Amazon Web Services - Comprehensive cloud computing platform with 200+ services.",
        icon: "fab fa-aws",
        category: "cloud",
        categoryName: "Cloud Storage & Hosting",
        website: "https://aws.amazon.com",
        docs: "https://docs.aws.amazon.com",
        users: "100M+",
        rating: 4.9,
        featured: true,
        tags: ["Cloud", "EC2", "S3", "Lambda"],
        founded: "2006"
    },
    {
        id: 11,
        name: "Google Cloud",
        shortDesc: "Cloud Platform",
        description: "Google's cloud platform with compute, storage, and AI/ML services.",
        icon: "fab fa-google",
        category: "cloud",
        categoryName: "Cloud Storage & Hosting",
        website: "https://cloud.google.com",
        docs: "https://cloud.google.com/docs",
        users: "50M+",
        rating: 4.8,
        featured: true,
        tags: ["Cloud", "BigQuery", "Kubernetes"],
        founded: "2008"
    },
    {
        id: 12,
        name: "Microsoft Azure",
        shortDesc: "Cloud Services",
        description: "Microsoft's cloud platform with integrated tools and DevOps capabilities.",
        icon: "fab fa-microsoft",
        category: "cloud",
        categoryName: "Cloud Storage & Hosting",
        website: "https://azure.microsoft.com",
        docs: "https://docs.microsoft.com/azure",
        users: "60M+",
        rating: 4.8,
        featured: true,
        tags: ["Cloud", "Azure", "DevOps"],
        founded: "2010"
    },
    {
        id: 13,
        name: "MongoDB",
        shortDesc: "NoSQL Database",
        description: "Leading NoSQL database with flexible document model and scalability.",
        icon: "fas fa-leaf",
        category: "database",
        categoryName: "Database Platforms",
        website: "https://mongodb.com",
        docs: "https://docs.mongodb.com",
        users: "20M+",
        rating: 4.8,
        featured: true,
        tags: ["NoSQL", "Document DB", "Atlas"],
        founded: "2007"
    },
    {
        id: 14,
        name: "PostgreSQL",
        shortDesc: "Relational Database",
        description: "Powerful open-source relational database system with advanced features.",
        icon: "fas fa-database",
        category: "database",
        categoryName: "Database Platforms",
        website: "https://postgresql.org",
        docs: "https://www.postgresql.org/docs",
        users: "15M+",
        rating: 4.9,
        featured: true,
        tags: ["SQL", "Relational", "ACID"],
        founded: "1996"
    },
    {
        id: 15,
        name: "MySQL",
        shortDesc: "SQL Database",
        description: "World's most popular open-source relational database management system.",
        icon: "fas fa-database",
        category: "database",
        categoryName: "Database Platforms",
        website: "https://mysql.com",
        docs: "https://dev.mysql.com/doc",
        users: "30M+",
        rating: 4.7,
        featured: true,
        tags: ["SQL", "Relational", "MySQL"],
        founded: "1995"
    },
    {
        id: 16,
        name: "Python",
        shortDesc: "Programming Language",
        description: "Official Python programming language website with documentation and tutorials.",
        icon: "fab fa-python",
        category: "language",
        categoryName: "Programming Languages",
        website: "https://python.org",
        docs: "https://docs.python.org",
        users: "50M+",
        rating: 4.9,
        featured: true,
        tags: ["Python", "Programming", "AI"],
        founded: "1991"
    },
    {
        id: 17,
        name: "JavaScript",
        shortDesc: "Web Language",
        description: "MDN Web Docs - Comprehensive JavaScript documentation and tutorials.",
        icon: "fab fa-js",
        category: "language",
        categoryName: "Programming Languages",
        website: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        docs: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
        users: "40M+",
        rating: 4.8,
        featured: true,
        tags: ["JavaScript", "Web", "ES6"],
        founded: "1995"
    },
    {
        id: 18,
        name: "TypeScript",
        shortDesc: "Typed JavaScript",
        description: "TypeScript language with static typing for JavaScript.",
        icon: "fab fa-js",
        category: "language",
        categoryName: "Programming Languages",
        website: "https://typescriptlang.org",
        docs: "https://www.typescriptlang.org/docs",
        users: "15M+",
        rating: 4.9,
        featured: true,
        tags: ["TypeScript", "Static Types", "JavaScript"],
        founded: "2012"
    }
];

// ==================== LOAD PLATFORMS ====================
async function loadPlatforms() {
    const container = document.getElementById('platformsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-container">
            <div class="loader"></div>
            <p>Loading platforms...</p>
        </div>
    `;
    
    try {
        // Try to load from platforms.json
        const response = await fetch('../data/platforms.json');
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Loaded from platforms.json');
            
            if (data.platforms && Array.isArray(data.platforms)) {
                platforms = data.platforms;
            } else if (Array.isArray(data)) {
                platforms = data;
            } else {
                platforms = DEFAULT_PLATFORMS;
            }
        } else {
            // JSON not found, use default data
            console.log('⚠️ platforms.json not found, using default data');
            platforms = DEFAULT_PLATFORMS;
        }
        
    } catch (error) {
        console.log('❌ Error loading JSON, using default data');
        platforms = DEFAULT_PLATFORMS;
    }
    
    console.log(`📦 Loaded ${platforms.length} platforms`);
    updateCategoryCounts();
    renderPlatforms('all');
}

// ==================== UPDATE CATEGORY COUNTS ====================
function updateCategoryCounts() {
    const categories = {
        all: platforms.length,
        ai: platforms.filter(p => p.category === 'ai').length,
        coding: platforms.filter(p => p.category === 'coding').length,
        mobile: platforms.filter(p => p.category === 'mobile').length,
        cloud: platforms.filter(p => p.category === 'cloud').length,
        database: platforms.filter(p => p.category === 'database').length,
        language: platforms.filter(p => p.category === 'language').length
    };
    
    for (const [key, count] of Object.entries(categories)) {
        const el = document.getElementById(`count-${key}`);
        if (el) el.textContent = count;
    }
}

// ==================== RENDER PLATFORMS ====================
function renderPlatforms(category) {
    const container = document.getElementById('platformsContainer');
    if (!container) return;
    
    if (platforms.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-database"></i>
                <h3>No Platforms</h3>
                <p>No platform data available</p>
            </div>
        `;
        return;
    }
    
    let filtered = platforms;
    if (category !== 'all') {
        filtered = platforms.filter(p => p.category === category);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-search"></i>
                <h3>No platforms in this category</h3>
                <button class="btn" onclick="filterByCategory('all')">View All</button>
            </div>
        `;
        return;
    }
    
    // Group by category
    const groups = {
        ai: { name: 'AI & Machine Learning', icon: 'fas fa-brain', platforms: [] },
        coding: { name: 'Coding & Programming', icon: 'fas fa-code', platforms: [] },
        mobile: { name: 'Mobile Development', icon: 'fas fa-mobile-alt', platforms: [] },
        cloud: { name: 'Cloud Storage & Hosting', icon: 'fas fa-cloud', platforms: [] },
        database: { name: 'Database Platforms', icon: 'fas fa-database', platforms: [] },
        language: { name: 'Programming Languages', icon: 'fas fa-language', platforms: [] }
    };
    
    filtered.forEach(p => {
        if (groups[p.category]) {
            groups[p.category].platforms.push(p);
        }
    });
    
    let html = '';
    for (const [key, group] of Object.entries(groups)) {
        if (group.platforms.length > 0) {
            html += `
                <div class="category-section">
                    <div class="category-title">
                        <i class="${group.icon}"></i>
                        <span>${group.name}</span>
                        <span class="category-count">${group.platforms.length} platforms</span>
                    </div>
                    <div class="platforms-grid">
                        ${group.platforms.map(p => renderCard(p)).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
    
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.innerHTML = `<i class="fas fa-layer-group"></i> Showing ${filtered.length} platforms`;
    }
}

// ==================== RENDER CARD ====================
function renderCard(platform) {
    const stars = generateStars(platform.rating || 4.5);
    const tags = platform.tags || [];
    
    return `
        <div class="platform-card" onclick="openWebsite('${platform.website}')">
            <div class="platform-badge ${platform.featured ? 'featured-badge' : ''}">
                ${platform.featured ? '⭐ Featured' : (platform.categoryName || platform.category)}
            </div>
            <div class="platform-icon">
                <i class="${platform.icon}"></i>
            </div>
            <h3>${escapeHtml(platform.name)}</h3>
            <p class="platform-description">${escapeHtml(platform.description)}</p>
            ${platform.shortDesc ? `<p class="platform-short-desc">⚡ ${escapeHtml(platform.shortDesc)}</p>` : ''}
            <div class="platform-tags">
                ${tags.slice(0, 3).map(tag => `<span class="platform-tag">#${escapeHtml(tag)}</span>`).join('')}
            </div>
            <div class="platform-stats">
                <span><i class="fas fa-users"></i> ${platform.users}</span>
                <span class="platform-rating">${stars}</span>
                ${platform.founded ? `<span><i class="fas fa-calendar"></i> ${platform.founded}</span>` : ''}
            </div>
            <div class="platform-links">
                <button class="platform-link" onclick="event.stopPropagation(); openWebsite('${platform.website}')">
                    <i class="fas fa-external-link-alt"></i> Visit Website
                </button>
                ${platform.docs ? `
                    <button class="platform-link docs-link" onclick="event.stopPropagation(); openWebsite('${platform.docs}')">
                        <i class="fas fa-book"></i> Docs
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// ==================== GENERATE STARS ====================
function generateStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '<i class="fas fa-star"></i>';
    if (half) stars += '<i class="fas fa-star-half-alt"></i>';
    const empty = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < empty; i++) stars += '<i class="far fa-star"></i>';
    return `<span class="stars">${stars}</span> <span class="rating-value">${rating}</span>`;
}

// ==================== FILTER FUNCTIONS ====================
function filterByCategory(category) {
    currentCategory = category;
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        }
    });
    
    renderPlatforms(category);
}

function openWebsite(url) {
    if (url && url !== '#') {
        window.open(url, '_blank');
    }
}

function searchPlatforms(keyword) {
    if (!keyword || keyword.trim() === '') {
        renderPlatforms(currentCategory);
        return;
    }
    
    const term = keyword.toLowerCase();
    const results = platforms.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
    );
    
    const container = document.getElementById('platformsContainer');
    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-search"></i>
                <h3>No results found</h3>
                <p>No platforms matching "${escapeHtml(keyword)}"</p>
                <button class="btn" onclick="document.getElementById('platformSearch').value=''; filterByCategory('all')">Clear</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="category-section">
                <div class="category-title">
                    <i class="fas fa-search"></i>
                    <span>Search Results: ${results.length} found</span>
                </div>
                <div class="platforms-grid">
                    ${results.map(p => renderCard(p)).join('')}
                </div>
            </div>
        `;
    }
    
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.innerHTML = `<i class="fas fa-search"></i> Found ${results.length} results`;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Platforms page loaded');
    loadPlatforms();
});

// Global functions
window.filterByCategory = filterByCategory;
window.openWebsite = openWebsite;
window.searchPlatforms = searchPlatforms;
window.renderPlatforms = renderPlatforms;