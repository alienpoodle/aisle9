import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = "aisle-9-6f7d1"; // Using the same app ID as login.js

// Global variables
let allItems = [];
let user = null;
let userId = null;
let username = 'Guest';
let currentView = 'cards';

// DOM Elements
const userDisplay = document.getElementById('user-display');
const addItemBtn = document.getElementById('add-item-btn');
const addItemModal = document.getElementById('add-item-modal');
const closeAddItemModalBtn = document.getElementById('close-add-item-modal');
const addItemForm = document.getElementById('add-item-form');
const editItemModal = document.getElementById('edit-item-modal');
const closeEditItemModalBtn = document.getElementById('close-edit-item-modal');
const editItemForm = document.getElementById('edit-item-form');
const itemDetailsModal = document.getElementById('item-details-modal');
const closeItemDetailsModalBtn = document.getElementById('close-item-details-modal');
const okItemDetailsModalBtn = document.getElementById('ok-item-details-modal');
const messageBox = document.getElementById('message-box');
const messageBoxOkBtn = document.getElementById('message-box-ok-btn');
const messageText = document.getElementById('message-text');

// Main view elements
const itemCardsContainer = document.getElementById('item-cards-container');
const comparisonCardsContainer = document.getElementById('comparison-cards-container');
const itemListingsView = document.getElementById('item-listings-view');
const priceComparisonView = document.getElementById('price-comparison-view');
const tabs = {
    listings: document.getElementById('tab-listings'),
    comparisons: document.getElementById('tab-comparisons')
};

// Search and Filter
const searchInput = document.getElementById('search-input');
const filterBtn = document.getElementById('filter-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const filterModal = document.getElementById('filter-modal');
const closeFilterModalBtn = document.getElementById('close-filter-modal');
const applyFiltersBtn = document.getElementById('apply-filters-btn');

const storeFilterInput = document.getElementById('store-filter-input');
const storeFilterDropdown = document.getElementById('store-filter-dropdown');
const storeFilterHidden = document.getElementById('store-filter-hidden');
const categoryFilterInput = document.getElementById('category-filter-input');
const categoryFilterDropdown = document.getElementById('category-filter-dropdown');
const categoryFilterHidden = document.getElementById('category-filter-hidden');
const typeFilterInput = document.getElementById('type-filter-input');
const typeFilterDropdown = document.getElementById('type-filter-dropdown');
const typeFilterHidden = document.getElementById('type-filter-hidden');

const loadingIndicator = document.getElementById('loading-indicator');
const noItemsMessage = document.getElementById('no-items-message');
const noComparisonItemsMessage = document.getElementById('no-comparison-items-message');
const loadingComparisonIndicator = document.getElementById('loading-comparison-indicator');

// Collections and Data
const itemsRef = collection(db, `artifacts/${appId}/public/data/items`);
let supermarkets = [];
let categories = [];
let itemTypes = ['Local', 'Imported'];

// Custom event for user authentication state from login.js
window.addEventListener('user-authenticated', (event) => {
    userId = event.detail.userId;
    username = event.detail.username;
    userDisplay.textContent = `Hello, ${username}!`;
    userDisplay.classList.remove('hidden');
    addItemBtn.classList.remove('hidden');
    loadAllItems();
});

// Custom event for user sign-out from login.js
window.addEventListener('user-signed-out', () => {
    userId = null;
    username = 'Guest';
    userDisplay.textContent = '';
    userDisplay.classList.add('hidden');
    addItemBtn.classList.add('hidden');
    loadAllItems();
});

// Show custom message box
function showMessageBox(message) {
    messageText.innerText = message;
    messageBox.classList.remove('hidden');
}

messageBoxOkBtn.addEventListener('click', () => {
    messageBox.classList.add('hidden');
});

// Open/Close Modals
function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

closeAddItemModalBtn.addEventListener('click', () => closeModal(addItemModal));
document.getElementById('cancel-add-item').addEventListener('click', () => closeModal(addItemModal));
closeEditItemModalBtn.addEventListener('click', () => closeModal(editItemModal));
document.getElementById('cancel-edit-item').addEventListener('click', () => closeModal(editItemModal));
closeItemDetailsModalBtn.addEventListener('click', () => closeModal(itemDetailsModal));
okItemDetailsModalBtn.addEventListener('click', () => closeModal(itemDetailsModal));
addItemBtn.addEventListener('click', () => openModal(addItemModal));
filterBtn.addEventListener('click', () => openModal(filterModal));
closeFilterModalBtn.addEventListener('click', () => closeModal(filterModal));

// Searchable Dropdown Logic
function setupSearchableDropdown(inputElement, dropdownElement, hiddenInputElement, optionsList) {
    const renderOptions = (filter = '') => {
        dropdownElement.innerHTML = '';
        const filteredOptions = optionsList.filter(option => option.toLowerCase().includes(filter.toLowerCase()));

        if (filteredOptions.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'px-4 py-2 text-gray-500';
            noResults.textContent = 'No results found';
            dropdownElement.appendChild(noResults);
        } else {
            filteredOptions.forEach(option => {
                const item = document.createElement('div');
                item.className = 'cursor-pointer px-4 py-2 hover:bg-blue-100';
                item.textContent = option;
                item.addEventListener('click', () => {
                    inputElement.value = option;
                    hiddenInputElement.value = option;
                    dropdownElement.classList.add('hidden');
                });
                dropdownElement.appendChild(item);
            });
        }
        dropdownElement.classList.remove('hidden');
    };

    inputElement.addEventListener('input', (e) => {
        renderOptions(e.target.value);
    });

    inputElement.addEventListener('focus', () => {
        renderOptions(inputElement.value);
    });

    document.addEventListener('click', (e) => {
        if (!dropdownElement.contains(e.target) && e.target !== inputElement) {
            dropdownElement.classList.add('hidden');
        }
    });

    const clearInputButton = inputElement.nextElementSibling;
    if (clearInputButton && clearInputButton.classList.contains('clear-input-btn')) {
        clearInputButton.addEventListener('click', () => {
            inputElement.value = '';
            hiddenInputElement.value = '';
            dropdownElement.classList.add('hidden');
        });
    }
}

// Populate UI with data
function populateUIFromData() {
    // Setup searchable dropdowns for the filter modal
    setupSearchableDropdown(storeFilterInput, storeFilterDropdown, storeFilterHidden, supermarkets);
    setupSearchableDropdown(categoryFilterInput, categoryFilterDropdown, categoryFilterHidden, categories);
    setupSearchableDropdown(typeFilterInput, typeFilterDropdown, typeFilterHidden, itemTypes);

    // Setup searchable dropdowns for the add/edit modals
    const modalItemNames = allItems.map(item => item.name);
    setupSearchableDropdown(document.getElementById('item-name-input'), document.getElementById('item-name-dropdown'), document.getElementById('item-name'), [...new Set(modalItemNames)]);
    setupSearchableDropdown(document.getElementById('item-category-input'), document.getElementById('item-category-dropdown'), document.getElementById('item-category'), [...new Set(categories)]);
    setupSearchableDropdown(document.getElementById('item-store-input'), document.getElementById('item-store-dropdown'), document.getElementById('item-store'), [...new Set(supermarkets)]);
    setupSearchableDropdown(document.getElementById('edit-item-name-input'), document.getElementById('edit-item-name-dropdown'), document.getElementById('edit-item-name'), [...new Set(modalItemNames)]);
    setupSearchableDropdown(document.getElementById('edit-item-category-input'), document.getElementById('edit-item-category-dropdown'), document.getElementById('edit-item-category'), [...new Set(categories)]);
    setupSearchableDropdown(document.getElementById('edit-item-store-input'), document.getElementById('edit-item-store-dropdown'), document.getElementById('edit-item-store'), [...new Set(supermarkets)]);
}

// Function to handle fetching and filtering of data
function loadAllItems() {
    loadingIndicator.classList.remove('hidden');
    onSnapshot(itemsRef, (snapshot) => {
        allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        supermarkets = [...new Set(allItems.map(item => item.store))];
        categories = [...new Set(allItems.map(item => item.category))];
        
        populateUIFromData();
        applyFiltersAndSearch();
    }, (error) => {
        console.error("Error fetching items:", error);
        showMessageBox("Failed to load listings. Please try again.");
    });
}

function applyFiltersAndSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedStore = storeFilterHidden.value.toLowerCase();
    const selectedCategory = categoryFilterHidden.value.toLowerCase();
    const selectedType = typeFilterHidden.value.toLowerCase();

    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm)) ||
            (item.category && item.category.toLowerCase().includes(searchTerm)) ||
            (item.store && item.store.toLowerCase().includes(searchTerm));

        const matchesStore = !selectedStore || (item.store && item.store.toLowerCase() === selectedStore);
        const matchesCategory = !selectedCategory || (item.category && item.category.toLowerCase() === selectedCategory);
        const matchesType = !selectedType || (item.type && item.type.toLowerCase() === selectedType);

        return matchesSearch && matchesStore && matchesCategory && matchesType;
    });

    if (currentView === 'cards') {
        renderItems(filteredItems);
    } else if (currentView === 'comparison') {
        renderComparisonItems(filteredItems);
    }
}

// Event listeners for new filter buttons
applyFiltersBtn.addEventListener('click', (e) => {
    e.preventDefault();
    applyFiltersAndSearch();
    closeModal(filterModal);
});

clearFiltersBtn.addEventListener('click', () => {
    storeFilterInput.value = '';
    storeFilterHidden.value = '';
    categoryFilterInput.value = '';
    categoryFilterHidden.value = '';
    typeFilterInput.value = '';
    typeFilterHidden.value = '';
    applyFiltersAndSearch();
});

// Initial data load and event listeners for search
searchInput.addEventListener('input', applyFiltersAndSearch);

// Rendering functions
function renderItems(itemsToRender) {
    itemCardsContainer.innerHTML = '';
    loadingIndicator.classList.add('hidden');
    if (itemsToRender.length === 0) {
        noItemsMessage.classList.remove('hidden');
        return;
    }
    noItemsMessage.classList.add('hidden');

    itemsToRender.forEach(item => {
        const isConfirmed = item.upvotes.length > item.downvotes.length;
        const confirmationText = isConfirmed ? 'Confirmed True' : 'Confirmed False';
        const confirmationColor = isConfirmed ? 'text-green-500' : 'text-red-500';

        const card = document.createElement('div');
        card.className = 'w-full md:w-1/2 lg:w-1/3 p-4 flex';
        card.innerHTML = `
            <div class="item-card flex-1">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold min-w-0">
                        <span class="clickable-item-name" data-item-id="${item.id}">${item.name}</span>
                    </h3>
                    <div class="group relative inline-block h-9 w-9 overflow-hidden rounded-full bg-gray-900/80 transition-[width] duration-200 hover:w-[160px] hover:bg-gradient-to-r from-blue-500 to-indigo-600">
                        <div class="absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
                            <i class="fas fa-ellipsis text-white text-xl"></i>
                        </div>
                        <ul class="absolute inset-0 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0">
                            <li class="p-2 transition-opacity duration-200">
                                <button data-id="${item.id}" data-action="share" class="share-btn text-white/80 hover:text-blue-700 transition duration-150" aria-label="share">
                                    <i class="fas fa-share-alt text-2xl"></i>
                                </button>
                            </li>
                            
                            ${userId && userId === item.submittedById ? `
                                <li class="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <button data-id="${item.id}" data-action="edit" class="p-2 text-white/80 transition-colors hover:text-white" data-tippy-content="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </li>
                                <li class="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <button data-id="${item.id}" data-action="delete" class="p-2 text-white/80 transition-colors hover:text-white" data-tippy-content="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </li>
                            ` : ''}
                            <li class="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                <button data-id="${item.id}" data-action="clone" class="p-2 text-white/80 transition-colors hover:text-white" data-tippy-content="Duplicate">
                                    <i class="fas fa-clone"></i>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                <span class="text-3xl font-bold text-blue-600">XCD$${item.price.toFixed(2)}</span>
                <div class="flex items-center text-sm font-medium mt-2">
                    <i class="fas fa-check-circle mr-2 ${confirmationColor}"></i>
                    <span class="${confirmationColor}">${confirmationText} (${Math.abs(item.upvotes.length - item.downvotes.length)} votes)</span>
                </div>
                <div class="flex flex-col mt-4 text-sm text-gray-500">
                    <div class="flex items-center space-x-4 mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-store mr-2"></i>
                            <span>${item.store}</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4 mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-tag mr-2"></i>
                            <span>${item.type || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center">
                            <i class="fas fa-user mr-2"></i>
                            <span>${item.submittedBy}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-calendar-alt mr-2"></i>
                            <span>${new Date(item.submissionDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div class="vote-buttons-container mt-4">
                    <button data-id="${item.id}" data-action="upvote" class="vote-btn text-green-500 hover:text-green-700 transition duration-150">
                        <i class="fas fa-thumbs-up text-3xl"></i>
                        <span class="vote-count bg-green-500">${item.upvotes.length}</span>
                    </button>
                    <button data-id="${item.id}" data-action="downvote" class="vote-btn downvote text-red-500 hover:text-red-700 transition duration-150">
                        <i class="fas fa-thumbs-down text-3xl"></i>
                        <span class="vote-count">${item.downvotes.length}</span>
                    </button>
                </div>
            </div>
        `;
        itemCardsContainer.appendChild(card);
    });
}

function renderComparisonItems(items) {
    comparisonCardsContainer.innerHTML = '';
    loadingComparisonIndicator.classList.add('hidden');
    if (items.length === 0) {
        noComparisonItemsMessage.classList.remove('hidden');
        return;
    }
    noComparisonItemsMessage.classList.add('hidden');

    const groupedItems = items.reduce((acc, item) => {
        const key = item.name + (item.category || '');
        if (!acc[key]) {
            acc[key] = {
                name: item.name,
                category: item.category,
                listings: []
            };
        }
        acc[key].listings.push(item);
        return acc;
    }, {});

    for (const key in groupedItems) {
        const group = groupedItems[key];
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md p-6 border border-gray-200';
        card.innerHTML = `
            <h3 class="text-xl font-bold mb-2">${group.name}</h3>
            <p class="text-sm text-gray-500 mb-4">${group.category}</p>
            <div class="space-y-4">
                ${group.listings.map(listing => `
                    <div class="flex justify-between items-center py-2 px-4 rounded-lg border border-gray-100">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-store text-blue-500"></i>
                            <span class="font-medium">${listing.store}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="font-semibold text-gray-800">XCD$${listing.price.toFixed(2)}</span>
                            <span class="text-xs text-gray-400">(${listing.submittedBy})</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        comparisonCardsContainer.appendChild(card);
    }
}

// Tab functionality
tabs.listings.addEventListener('click', () => {
    tabs.listings.classList.add('active-tab');
    tabs.comparisons.classList.remove('active-tab');
    itemListingsView.classList.remove('hidden');
    priceComparisonView.classList.add('hidden');
    currentView = 'cards';
    applyFiltersAndSearch();
});

tabs.comparisons.addEventListener('click', () => {
    tabs.comparisons.classList.add('active-tab');
    tabs.listings.classList.remove('active-tab');
    itemListingsView.classList.add('hidden');
    priceComparisonView.classList.remove('hidden');
    currentView = 'comparison';
    applyFiltersAndSearch();
});

// Event listener for all actions on item cards
document.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const itemId = target.dataset.id;
    const action = target.dataset.action;

    if (!userId && (action === 'upvote' || action === 'downvote' || action === 'edit' || action === 'delete' || action === 'clone')) {
        showMessageBox("You must be logged in to perform this action.");
        return;
    }

    if (action === 'upvote' || action === 'downvote') {
        const itemRef = doc(db, `artifacts/${appId}/public/data/items`, itemId);
        const itemDoc = await getDoc(itemRef);
        if (!itemDoc.exists()) {
            console.error("Item not found!");
            return;
        }

        const data = itemDoc.data();
        let upvotes = data.upvotes || [];
        let downvotes = data.downvotes || [];

        const hasUpvoted = upvotes.includes(userId);
        const hasDownvoted = downvotes.includes(userId);

        if (action === 'upvote') {
            if (hasUpvoted) {
                // Already upvoted, so remove it
                upvotes = upvotes.filter(uid => uid !== userId);
            } else {
                upvotes.push(userId);
                if (hasDownvoted) {
                    downvotes = downvotes.filter(uid => uid !== userId);
                }
            }
        } else if (action === 'downvote') {
            if (hasDownvoted) {
                // Already downvoted, so remove it
                downvotes = downvotes.filter(uid => uid !== userId);
            } else {
                downvotes.push(userId);
                if (hasUpvoted) {
                    upvotes = upvotes.filter(uid => uid !== userId);
                }
            }
        }

        try {
            await updateDoc(itemRef, { upvotes, downvotes });
        } catch (error) {
            console.error("Error updating votes:", error);
            showMessageBox("Error submitting vote. Please try again.");
        }
    } else if (action === 'edit') {
        const item = allItems.find(i => i.id === itemId);
        if (item) {
            document.getElementById('edit-item-id').value = item.id;
            document.getElementById('edit-item-name-input').value = item.name;
            document.getElementById('edit-item-description').value = item.description || '';
            document.getElementById('edit-item-category-input').value = item.category || '';
            document.getElementById('edit-item-store-input').value = item.store || '';
            document.getElementById('edit-item-type').value = item.type || '';
            document.getElementById('edit-item-price').value = item.price;
            openModal(editItemModal);
        }
    } else if (action === 'delete') {
        if (confirm("Are you sure you want to delete this listing?")) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/public/data/items`, itemId));
                showMessageBox("Listing deleted successfully!");
            } catch (error) {
                console.error("Error deleting document:", error);
                showMessageBox(`Error deleting document: ${error.message}`);
            }
        }
    } else if (action === 'clone') {
        const itemToClone = allItems.find(i => i.id === itemId);
        if (itemToClone) {
            document.getElementById('item-name-input').value = itemToClone.name;
            document.getElementById('item-description').value = itemToClone.description || '';
            document.getElementById('item-category-input').value = itemToClone.category || '';
            document.getElementById('item-store-input').value = itemToClone.store || '';
            document.getElementById('item-type').value = itemToClone.type || '';
            document.getElementById('item-price').value = itemToClone.price;
            openModal(addItemModal);
        }
    }
});

// Item Details Modal
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('clickable-item-name')) {
        const itemId = e.target.dataset.itemId;
        const item = allItems.find(i => i.id === itemId);
        if (item) {
            document.getElementById('detail-item-name').innerText = item.name;
            document.getElementById('detail-item-description').innerText = item.description || 'N/A';
            document.getElementById('detail-item-category').innerText = item.category;
            document.getElementById('detail-item-store').innerText = item.store;
            document.getElementById('detail-item-type').innerText = item.type || 'N/A';
            document.getElementById('detail-item-price').innerText = `XCD$${item.price.toFixed(2)}`;
            document.getElementById('detail-item-date').innerText = new Date(item.submissionDate).toLocaleDateString();
            document.getElementById('detail-upvotes').innerText = item.upvotes.length;
            document.getElementById('detail-downvotes').innerText = item.downvotes.length;
            document.getElementById('detail-item-submitted-by').innerText = item.submittedBy;
            openModal(itemDetailsModal);
        }
    }
});

// Form Submissions
addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemName = document.getElementById('item-name-input').value;
    const itemDescription = document.getElementById('item-description').value;
    const itemCategory = document.getElementById('item-category-input').value;
    const itemStore = document.getElementById('item-store-input').value;
    const itemType = document.getElementById('item-type').value;
    const itemPrice = parseFloat(document.getElementById('item-price').value);

    const newDoc = {
        name: itemName,
        description: itemDescription,
        category: itemCategory,
        store: itemStore,
        type: itemType,
        price: itemPrice,
        submissionDate: new Date().toISOString(),
        submittedBy: username,
        submittedById: userId,
        upvotes: [],
        downvotes: []
    };

    try {
        await addDoc(itemsRef, newDoc);
        showMessageBox("Listing added successfully!");
        addItemForm.reset();
        closeModal(addItemModal);
    } catch (error) {
        console.error("Error adding document:", error);
        showMessageBox("Failed to add listing. Please try again.");
    }
});

editItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const docId = document.getElementById('edit-item-id').value;
    const itemName = document.getElementById('edit-item-name-input').value;
    const itemDescription = document.getElementById('edit-item-description').value;
    const itemCategory = document.getElementById('edit-item-category-input').value;
    const itemStore = document.getElementById('edit-item-store-input').value;
    const itemType = document.getElementById('edit-item-type').value;
    const itemPrice = parseFloat(document.getElementById('edit-item-price').value);

    const updatedDoc = {
        name: itemName,
        description: itemDescription,
        category: itemCategory,
        store: itemStore,
        type: itemType,
        price: itemPrice,
    };

    try {
        await updateDoc(doc(db, `artifacts/${appId}/public/data/items`, docId), updatedDoc);
        showMessageBox("Listing updated successfully!");
        closeModal(editItemModal);
    } catch (error) {
        console.error("Error updating document:", error);
        showMessageBox(`Failed to update listing: ${error.message}`);
    }
});

// Initial tab setup
tabs.listings.classList.add('active-tab');
