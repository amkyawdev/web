/**
 * Documentation System
 * Version: 2.0
 */

let currentDoc = 'intro';
let searchTimeout = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📚 Documentation page loaded');
    
    // Load from URL hash
    const hash = window.location.hash.substring(1);
    if (hash) {
        showDoc(hash);
    }
    
    // Setup search
    const searchInput = document.getElementById('docSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('docTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const moonIcon = document.querySelector('.action-btn .fa-moon');
        if (moonIcon) moonIcon.classList.replace('fa-moon', 'fa-sun');
    }
});

// ==================== DOCUMENTATION NAVIGATION ====================
function showDoc(docId) {
    // Hide all sections
    document.querySelectorAll('.doc-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(docId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentDoc = docId;
        
        // Update URL hash
        window.location.hash = docId;
        
        // Update active nav link
        document.querySelectorAll('.docs-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-doc') === docId) {
                link.classList.add('active');
            }
        });
        
        // Scroll to top
        document.querySelector('.docs-content').scrollTop = 0;
        
        // Save last viewed
        localStorage.setItem('lastDoc', docId);
    }
}

function toggleNavGroup(element) {
    const navGroup = element.closest('.nav-group');
    navGroup.classList.toggle('open');
    
    // Save expanded state
    const groupTitle = element.querySelector('span').textContent;
    const expandedGroups = JSON.parse(localStorage.getItem('expandedGroups') || '[]');
    
    if (navGroup.classList.contains('open')) {
        if (!expandedGroups.includes(groupTitle)) {
            expandedGroups.push(groupTitle);
        }
    } else {
        const index = expandedGroups.indexOf(groupTitle);
        if (index > -1) {
            expandedGroups.splice(index, 1);
        }
    }
    localStorage.setItem('expandedGroups', JSON.stringify(expandedGroups));
}

// ==================== SEARCH FUNCTIONALITY ====================
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTimeout) clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        if (searchTerm.length < 2) {
            clearSearchHighlights();
            return;
        }
        
        searchInDocs(searchTerm);
    }, 300);
}

function searchInDocs(term) {
    const results = [];
    const sections = document.querySelectorAll('.doc-section');
    
    sections.forEach(section => {
        const text = section.innerText.toLowerCase();
        if (text.includes(term)) {
            results.push({
                id: section.id,
                title: section.querySelector('h1')?.textContent || section.id,
                preview: getPreview(section, term)
            });
        }
    });
    
    showSearchResults(results, term);
}

function getPreview(section, term) {
    const text = section.innerText;
    const index = text.toLowerCase().indexOf(term);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 60);
    const end = Math.min(text.length, index + term.length + 60);
    let preview = text.substring(start, end);
    
    // Highlight the term
    preview = preview.replace(new RegExp(`(${term})`, 'gi'), '<mark>$1</mark>');
    
    return '...' + preview + '...';
}

function showSearchResults(results, term) {
    if (results.length === 0) {
        showToast('No results found', 'info');
        return;
    }
    
    // Create results modal
    const modal = document.createElement('div');
    modal.className = 'search-modal';
    modal.innerHTML = `
        <div class="search-modal-content">
            <div class="search-modal-header">
                <h3><i class="fas fa-search"></i> Search Results</h3>
                <button onclick="this.closest('.search-modal').remove()">&times;</button>
            </div>
            <div class="search-modal-body">
                <p>Found ${results.length} result(s) for "${escapeHtml(term)}"</p>
                <div class="search-results-list">
                    ${results.map(r => `
                        <div class="search-result-item" onclick="showDoc('${r.id}'); document.querySelector('.search-modal')?.remove()">
                            <strong>${escapeHtml(r.title)}</strong>
                            <p>${r.preview}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function clearSearchHighlights() {
    document.querySelectorAll('.search-modal')?.forEach(modal => modal.remove());
}

// ==================== CODE COPY FUNCTION ====================
function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('pre code, pre').innerText;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
        showToast('Code copied to clipboard!', 'success');
    });
}

// ==================== FAQ TOGGLE ====================
function toggleFaq(element) {
    const faqItem = element.closest('.faq-item');
    faqItem.classList.toggle('open');
}

// ==================== FEEDBACK ====================
function feedback(helpful) {
    const message = helpful ? 'Thank you for your feedback!' : 'Sorry to hear that. We\'ll improve it!';
    showToast(message, 'info');
    
    // Save feedback
    const feedbacks = JSON.parse(localStorage.getItem('docFeedback') || '[]');
    feedbacks.push({
        page: currentDoc,
        helpful: helpful,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('docFeedback', JSON.stringify(feedbacks));
}

// ==================== COPY LINK ====================
function copyDocLink() {
    const url = window.location.href.split('#')[0] + '#' + currentDoc;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!', 'success');
    });
}

// ==================== PRINT ====================
function printDoc() {
    const content = document.getElementById(currentDoc).cloneNode(true);
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Documentation - ${content.querySelector('h1')?.textContent || 'Developer Platforms'}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { color: #667eea; }
                pre { background: #f4f4f4; padding: 15px; border-radius: 8px; overflow-x: auto; }
                code { background: #f4f4f4; padding: 2px 5px; border-radius: 4px; }
                .info-box { background: #e8f4fd; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
                .tip { background: #fef3c7; border-left-color: #f59e0b; }
            </style>
        </head>
        <body>
            ${content.innerHTML}
            <p style="margin-top: 40px; color: #999; font-size: 12px;">Printed from Developer Platforms Documentation</p>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// ==================== DARK MODE ====================
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const moonIcon = document.querySelector('.action-btn .fa-moon, .action-btn .fa-sun');
    
    if (isDark) {
        moonIcon?.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('docTheme', 'dark');
    } else {
        moonIcon?.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('docTheme', 'light');
    }
}

// ==================== UTILITIES ====================
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== RESTORE SAVED STATE ====================
function restoreSavedState() {
    // Restore last viewed doc
    const lastDoc = localStorage.getItem('lastDoc');
    if (lastDoc && document.getElementById(lastDoc)) {
        showDoc(lastDoc);
    }
    
    // Restore expanded nav groups
    const expandedGroups = JSON.parse(localStorage.getItem('expandedGroups') || '[]');
    document.querySelectorAll('.nav-group').forEach(group => {
        const title = group.querySelector('.nav-group-title span').textContent;
        if (expandedGroups.includes(title)) {
            group.classList.add('open');
        }
    });
}

// Initialize restoration after DOM is ready
document.addEventListener('DOMContentLoaded', restoreSavedState);

// Add CSS for search modal
const searchModalStyle = document.createElement('style');
searchModalStyle.textContent = `
    .search-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }
    
    .search-modal-content {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        animation: slideUp 0.3s ease;
    }
    
    .search-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #e9ecef;
    }
    
    .search-modal-header button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #adb5bd;
    }
    
    .search-modal-body {
        padding: 20px;
        overflow-y: auto;
        max-height: calc(80vh - 70px);
    }
    
    .search-results-list {
        margin-top: 15px;
    }
    
    .search-result-item {
        padding: 12px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .search-result-item:hover {
        background: #f8f9fa;
        transform: translateX(5px);
    }
    
    .search-result-item strong {
        color: #667eea;
        display: block;
        margin-bottom: 5px;
    }
    
    .search-result-item p {
        margin: 0;
        font-size: 13px;
        color: #6c757d;
    }
    
    .search-result-item mark {
        background: #fef3c7;
        padding: 0 2px;
        border-radius: 3px;
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
    
    .toast {
        position: fixed;
        bottom: 30px;
        right: 30px;
        padding: 12px 24px;
        border-radius: 12px;
        color: white;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        font-size: 14px;
    }
    
    .toast-success { background: #10b981; }
    .toast-error { background: #ef4444; }
    .toast-warning { background: #f59e0b; }
    .toast-info { background: #3b82f6; }
    
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
`;
document.head.appendChild(searchModalStyle);