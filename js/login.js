import { auth, db } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const loadingPage = document.getElementById('loading-page');
const authPage = document.getElementById('auth-page');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupForm = document.getElementById('signup-form');
const signupUsernameInput = document.getElementById('signup-username');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const logoutBtn = document.getElementById('logout-btn');

async function createNewUserInDb(userId, username) {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        await setDoc(userRef, {
            username: username
        });
    }
}

function showApp() {
    authPage.classList.add('hidden');
    appContainer.classList.remove('hidden');
}

function showAuth() {
    authPage.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

onAuthStateChanged(auth, (user) => {
    loadingPage.classList.add('hidden');
    if (user) {
        showApp();
        window.dispatchEvent(new CustomEvent('user-authenticated', {
            detail: {
                userId: user.uid,
                username: user.displayName || user.email
            }
        }));
    } else {
        showAuth();
        window.dispatchEvent(new CustomEvent('user-signed-out'));
    }
});

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // On success, the onAuthStateChanged listener handles the UI.
    } catch (error) {
        alert(error.message);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    const username = signupUsernameInput.value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await createNewUserInDb(user.uid, username);
        // On success, the onAuthStateChanged listener handles the UI.
    } catch (error) {
        alert(error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // On success, the onAuthStateChanged listener handles the UI.
    } catch (error) {
        alert(error.message);
    }
});

// Event listeners for auth tabs to toggle forms
document.querySelectorAll('.auth-tab-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        // Remove active class from all buttons and add to the clicked one
        document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active', 'border-blue-600', 'text-blue-600'));
        e.target.classList.add('active', 'border-blue-600', 'text-blue-600');

        // Toggle form visibility
        if (e.target.textContent.trim() === 'Login') {
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('signup-form').classList.add('hidden');
            document.getElementById('auth-title').textContent = 'Welcome!';
        } else {
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('signup-form').classList.remove('hidden');
            document.getElementById('auth-title').textContent = 'Join Aisle 9!';
        }
    });
});