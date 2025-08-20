if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/aisle9/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered: ', registration.scope);
            })
            .catch(err => {
                console.log('Service Worker registration failed: ', err);
            });
    });
}

// Corrected import path for page.mjs
import page from './lib/page.mjs';

import * as GlobalModel from './model.js';
import * as GlobalView from './view.js';
import * as ListingsController from './listings/listings-controller.js';
import * as ComparisonsController from './comparisons/comparisons-controller.js';
import * as ShoppingListController from './shopping-list/shopping-list-controller.js';

const contentContainer = document.getElementById('content-container');
const tabButtons = document.querySelectorAll('.tab-btn');

function handleRoute(context) {
    const tabName = context.pathname.split('/')[1] || 'listings';
    tabButtons.forEach(btn => {
        btn.classList.remove('border-blue-600');
        btn.classList.add('border-transparent');
    });
    const currentTab = document.querySelector(`[data-tab-name="${tabName}"]`);
    if (currentTab) {
        currentTab.classList.remove('border-transparent');
        currentTab.classList.add('border-blue-600');
    }
}

// Route handlers for each page
page('/', () => {
    handleRoute({ pathname: '/' });
    ListingsController.init(contentContainer);
});

page('/comparisons', () => {
    handleRoute({ pathname: '/comparisons' });
    ComparisonsController.init(contentContainer);
});

page('/shopping-list', () => {
    handleRoute({ pathname: '/shopping-list' });
    ShoppingListController.init(contentContainer);
});

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    GlobalModel.onAuthStateChange(user => {
        if (user) {
            GlobalView.showAppContainer();
            GlobalModel.fetchUsername(user.uid).then(username => {
                GlobalView.updateUserDisplay(username);
            });
            page.start();
        } else {
            GlobalView.showAuthPage();
        }
    });

    GlobalView.setupEventListeners({
        onLogin: handleLogin,
        onSignup: handleSignup,
        onLogout: handleLogout
    });
});

async function handleLogin(email, password) {
    try {
        await GlobalModel.loginUser(email, password);
    } catch (error) {
        GlobalView.showMessage(error.message);
    }
}

async function handleSignup(username, email, password) {
    try {
        await GlobalModel.signupUser(username, email, password);
        GlobalView.showMessage('Sign up successful! Welcome to Aisle 9.');
    } catch (error) {
        GlobalView.showMessage(error.message);
    }
}

async function handleLogout() {
    await GlobalModel.logoutUser();
}
