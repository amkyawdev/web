let projects = [];

function loadProjects() {
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
    } else {
        // Default projects
        projects = [
            {
                id: 1,
                name: 'E-Commerce Platform',
                description: 'Full-featured e-commerce platform with payment integration, user authentication, and admin dashboard.',
                tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
                category: 'Web',
                stars: 245,
                forks: 89,
                demo: 'https://github.com/amkyawdev/ecommerce'
            },
            {
                id: 2,
                name: 'AI Image Generator',
                description: 'Generate stunning images from text descriptions using stable diffusion and OpenAI API.',
                tech: ['Python', 'TensorFlow', 'React', 'FastAPI'],
                category: 'AI',
                stars: 189,
                forks: 45,
                demo: 'https://github.com/amkyawdev/ai-image-gen'
            },
            {
                id: 3,
                name: 'Mobile Chat App',
                description: 'Real-time messaging app with end-to-end encryption, group chats, and media sharing.',
                tech: ['React Native', 'Firebase', 'Socket.io'],
                category: 'Mobile',
                stars: 312,
                forks: 102,
                demo: 'https://github.com/amkyawdev/chat-app'
            },
            {
                id: 4,
                name: '3D Portfolio Website',
                description: 'Interactive 3D portfolio with Three.js, showcasing projects with stunning animations.',
                tech: ['Three.js', 'HTML5', 'CSS3', 'JavaScript'],
                category: 'Web',
                stars: 178,
                forks: 56,
                demo: 'https://github.com/amkyawdev/3d-portfolio'
            },
            {
                id: 5,
                name: 'Game Development Kit',
                description: '2D game engine and toolkit for creating browser-based games with physics.',
                tech: ['JavaScript', 'Canvas API', 'WebGL'],
                category: 'Game',
                stars: 134,
                forks: 42,
                demo: 'https://github.com/amkyawdev/game-kit'
            },
            {
                id: 6,
                name: 'DevOps Dashboard',
                description: 'CI/CD pipeline monitoring dashboard with real-time metrics and alerts.',
                tech: ['Vue.js', 'Docker', 'Kubernetes', 'Grafana'],
                category: 'Web',
                stars: 98,
                forks: 31,
                demo: 'https://github.com/amkyawdev/devops-dash'
            }
        ];
        saveProjects();
    }
    renderProjects('all');
}

function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects));
}

function renderProjects(category) {
    const container = document.getElementById('projectsGrid');
    if (!container) return;
    
    let filteredProjects = projects;
    if (category !== 'all') {
        filteredProjects = projects.filter(p => p.category === category);
    }
    
    container.innerHTML = filteredProjects.map((project, index) => `
        <div class="project-card" style="animation-delay: ${index * 0.1}s">
            <div class="project-image">
                <i class="fas fa-code"></i>
                <div class="project-badge">${project.category}</div>
            </div>
            <div class="project-content">
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <div class="project-tech">
                    ${project.tech.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
                <div class="project-footer">
                    <div class="project-stats">
                        <span><i class="fas fa-star"></i> ${project.stars}</span>
                        <span><i class="fas fa-code-branch"></i> ${project.forks}</span>
                    </div>
                    <a href="${project.demo}" target="_blank" class="project-link">
                        View Project <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProjects(category) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === category || 
            (category === 'all' && btn.textContent === 'All')) {
            btn.classList.add('active');
        }
    });
    renderProjects(category);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
});