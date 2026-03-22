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
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized');
}

// Admin email
const ADMIN_EMAIL = 'wayne.mm.92@gmail.com';
const ADMIN_PASSWORD = '0000';

// Create admin user if not exists
async function initAdminUser() {
    try {
        await firebase.auth().signInWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        await firebase.auth().signOut();
        console.log('Admin user exists');
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            try {
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
                await userCredential.user.updateProfile({ displayName: 'Admin' });
                console.log('Admin user created');
                await firebase.auth().signOut();
            } catch (e) { console.error('Error creating admin:', e); }
        }
    }
}

if (typeof firebase !== 'undefined') {
    initAdminUser();
}

window.ADMIN_EMAIL = ADMIN_EMAIL;