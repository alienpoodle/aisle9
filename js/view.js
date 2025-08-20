const authPage = document.getElementById('auth-page');
const appContainer = document.getElementById('app-container');
const authToggle = document.getElementById('auth-toggle');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authTitle = document.getElementById('auth-title');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const messageBoxOkBtn = document.getElementById('message-box-ok-btn');

export const showMessage = (message) => {
    messageText.textContent = message;
    messageBox.classList.remove('hidden');
    messageBoxOkBtn.addEventListener('click', () => {
        messageBox.classList.add('hidden');
    }, { once: true });
};

export const showAppContainer = () => {
    authPage.classList.add('hidden');
    appContainer.classList.remove('hidden');
};

export const showAuthPage = () => {
    authPage.classList.remove('hidden');
    appContainer.classList.add('hidden');
};

export const updateUserDisplay = (username) => {
    userDisplay.textContent = username;
    userDisplay.classList.remove('hidden');
};

export const setupEventListeners = (callbacks) => {
    authToggle.addEventListener('click', (e) => {
        const isLogin = e.target.textContent.trim() === 'Login';
        authToggle.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
            btn.classList.add('text-gray-500', 'hover:text-gray-700');
            btn.style.borderBottomWidth = '0px';
        });
        e.target.classList.add('active', 'border-blue-600', 'text-blue-600');
        e.target.style.borderBottomWidth = '2px';

        if (isLogin) {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            authTitle.textContent = 'Welcome Back!';
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            authTitle.textContent = 'Join Aisle 9';
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        callbacks.onLogin(loginForm['login-email'].value, loginForm['login-password'].value);
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = signupForm['signup-password'].value;
        const confirmPassword = signupForm['signup-confirm-password'].value;
        if (password !== confirmPassword) {
            showMessage('Passwords do not match.');
            return;
        }
        callbacks.onSignup(
            signupForm['signup-username'].value,
            signupForm['signup-email'].value,
            password
        );
    });

    logoutBtn.addEventListener('click', callbacks.onLogout);
};