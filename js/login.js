import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "aisle-9-6f7d1"; // Using the same app ID

// DOM Elements for Auth Page
const authPage = document.getElementById('auth-page');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authTabBtns = document.querySelectorAll('.auth-tab-btn');
const authTitle = document.getElementById('auth-title');
const logoutBtn = document.getElementById('logout-btn');

// Show/Hide custom message box
function showMessageBox(message) {
    document.getElementById('message-text').innerText = message;
    document.getElementById('message-box').classList.remove('hidden');
}

// Function to generate a random username
function generateRandomUsername() {
    const adjectives = ['Happy', 'Swift', 'Brave', 'Clever', 'Quiet', 'Strong', 'Bold', 'Bright', 'Calm', 'Gentle'];
    const animals = ['Panda', 'Tiger', 'Lion', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Shark', 'Dolphin', 'Giraffe'];
    const randomNumber = Math.floor(Math.random() * 900) + 100; // Generate a 3-digit number
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    return `${randomAdjective}${randomAnimal}${randomNumber}`;
}

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;"'<,>.?/=-])(?=.{12,})/;

// Toggle between Login and Signup forms
authTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        authTabBtns.forEach(b => {
            b.classList.remove('active', 'border-blue-600', 'text-blue-600', 'hover:text-gray-700');
            b.classList.add('text-gray-500');
        });
        btn.classList.add('active', 'border-blue-600', 'text-blue-600');
        btn.classList.remove('text-gray-500');

        if (btn.innerText === 'Login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            authTitle.textContent = 'Welcome!';
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            authTitle.textContent = 'Create an Account';
        }
    });
});

// Handle Login Form Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessageBox("Logged in successfully!");
        loginForm.reset();
    } catch (error) {
        console.error("Login failed:", error);
        showMessageBox(`Login failed: ${error.message}`);
    }
});

// Handle Signup Form Submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;
    const confirmPassword = signupForm['signup-confirm-password'].value;

    if (password !== confirmPassword) {
        showMessageBox("Passwords do not match.");
        return;
    }

    if (!passwordRegex.test(password)) {
        showMessageBox("Password must be 12+ characters and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const generatedUsername = generateRandomUsername();

        // Store the username in Firestore
        // FIX: CHANGE THE FIREBASE PATH TO A STANDARD USERS COLLECTION
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            username: generatedUsername,
            email: user.email,
            createdAt: new Date().toISOString()
        });

        showMessageBox("Account created and logged in successfully!");
        signupForm.reset();
    } catch (error) {
        console.error("Signup failed:", error);
        showMessageBox(`Signup failed: ${error.message}`);
    }
});

// Handle Log Out
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showMessageBox("Logged out successfully.");
    } catch (error) {
        console.error("Logout failed:", error);
        showMessageBox(`Logout failed: ${error.message}`);
    }
});

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in, get username and dispatch event
        // FIX: CHANGE THE FIREBASE PATH TO A STANDARD USERS COLLECTION
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        let username = user.email; // Fallback to email
        if (userSnap.exists()) {
            username = userSnap.data().username;
        }

        authPage.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        // Dispatch a custom event with user data to app.js
        const event = new CustomEvent('user-authenticated', {
            detail: {
                userId: user.uid,
                username: username
            }
        });
        window.dispatchEvent(event);

    } else {
        // User is signed out, show auth page and hide app
        authPage.classList.remove('hidden');
        appContainer.classList.add('hidden');
        
        // Dispatch a sign-out event to app.js
        window.dispatchEvent(new Event('user-signed-out'));
    }
});
