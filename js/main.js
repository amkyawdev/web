// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAr7Hv2ApKtNTxF11MhT5cuWeg_Dgsh0TY",
    authDomain: "smart-burme-app.firebaseapp.com",
    projectId: "smart-burme-app",
    storageBucket: "smart-burme-app.appspot.com",
    messagingSenderId: "851502425686",
    appId: "1:851502425686:web:f29e0e1dfa84794b4abdf7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Global Variables
let currentUser = null;

// Side Menu Functions
function initSideMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('menuOverlay');
    
    if (!menuBtn) return;
    
    function toggleMenu() {
        sideMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        menuBtn.classList.toggle('active');
    }
    
    menuBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
    
    // Close menu on link click
    document.querySelectorAll('.side-menu-items a').forEach(link => {
        link.addEventListener('click', () => {
            if (sideMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    });
}

// Show Toast Notification
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

// Check Auth State
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateUIForAuth(true);
        } else {
            currentUser = null;
            updateUIForAuth(false);
        }
    });
}

function updateUIForAuth(isLoggedIn) {
    const authLinks = document.querySelectorAll('.auth-link-item');
    const userInfo = document.getElementById('userInfo');
    
    if (isLoggedIn && userInfo) {
        userInfo.innerHTML = `
            <div style="text-align: center; color: white;">
                <i class="fas fa-user-circle" style="font-size: 40px;"></i>
                <p style="margin-top: 10px;">${currentUser.email}</p>
                <button onclick="logout()" class="btn" style="margin-top: 10px; background: rgba(255,255,255,0.2);">Logout</button>
            </div>
        `;
    }
    
    authLinks.forEach(link => {
        if (isLoggedIn) {
            if (link.classList.contains('login-link')) link.style.display = 'none';
            if (link.classList.contains('register-link')) link.style.display = 'none';
            if (link.classList.contains('logout-link')) link.style.display = 'block';
        } else {
            if (link.classList.contains('login-link')) link.style.display = 'block';
            if (link.classList.contains('register-link')) link.style.display = 'block';
            if (link.classList.contains('logout-link')) link.style.display = 'none';
        }
    });
}

function logout() {
    auth.signOut().then(() => {
        showToast('Logged out successfully');
        window.location.href = '../auth/login.html';
    }).catch((error) => {
        showToast('Error logging out: ' + error.message);
    });
}

// Load User Data
function loadUserData() {
    const user = auth.currentUser;
    if (user) {
        currentUser = user;
        const userElements = document.querySelectorAll('.user-email');
        userElements.forEach(el => {
            el.textContent = user.email;
        });
    }
}

// Initialize 3D Background
function init3DBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Create floating particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 2000;
        posArray[i+1] = (Math.random() - 0.5) * 1000;
        posArray[i+2] = (Math.random() - 0.5) * 500;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        transparent: true,
        opacity: 0.6
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    camera.position.z = 500;
    
    function animate() {
        requestAnimationFrame(animate);
        particlesMesh.rotation.y += 0.002;
        particlesMesh.rotation.x += 0.001;
        renderer.render(scene, camera);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initSideMenu();
    init3DBackground();
    checkAuth();
    loadUserData();
});