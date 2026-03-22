// Firebase is already initialized in main.js

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                showToast('Login successful!');
                setTimeout(() => {
                    window.location.href = '../pages/home.html';
                }, 1000);
            })
            .catch((error) => {
                showToast('Error: ' + error.message);
            });
    });
}

// Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match!');
            return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                showToast('Registration successful! Please login.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            })
            .catch((error) => {
                showToast('Error: ' + error.message);
            });
    });
}

// Reset Password Form
const resetForm = document.getElementById('resetForm');
if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        
        auth.sendPasswordResetEmail(email)
            .then(() => {
                showToast('Password reset email sent! Check your inbox.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            })
            .catch((error) => {
                showToast('Error: ' + error.message);
            });
    });
}