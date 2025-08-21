import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "aisle-9-6f7d1";

// Hardcoded lists
const supermarkets = [
    "C.K. Greaves Supermarket (Kingstown)",
    "C.K. Greaves Supermarket (Arnos Vale)",
    "C.K. Greaves Supermarket (Pembroke)",
    "Massy Stores Supermarket (Arnos Vale)",
    "Massy Stores Supermarket (Kingstown)",
    "Massy Stores Supermarket (Stoney Ground)",
    "Coreas Food Mart (Kingstown)",
    "Doris' Fresh Food & Yacht Provisioning (Bequia)",
    "Knights Trading (Bequia)",
    "Randy's Supermarket (Canouan)",
    "Randy's Supermarket (Diamond Estate)"
];
const categories = [
    "Bakery & Bread",
    "Beverages",
    "Canned & Packaged Goods",
    "Dairy, Eggs & Cheese",
    "Frozen Foods",
    "Fruits & Vegetables",
    "Meat & Seafood",
    "Pantry Staples",
    "Snacks & Sweets",
    "Household & Cleaning",
    "Personal Care",
    "Baby Products",
    "Pet Supplies",
    "Health & Wellness",
    "Miscellaneous"
];
const itemTypes = ["Local", "Imported"];

// State variables
let userId = null;
let username = null;
let unsubscribeSnapshot = null;
let allItems = [];
let currentView = 'cards';

// DOM Element References (kept at the top for clarity)
const addItemBtn = document.getElementById('add-item-btn');
const addItemModal = document.getElementById('add-item-modal');
const closeAddItemModal = document.getElementById('close-add-item-modal');
const cancelAddItem = document.getElementById('cancel-add-item');
const addItemForm = document.getElementById('add-item-form');
const itemCategoryInput = document.getElementById('item-category-input');
const itemCategoryDropdown = document.getElementById('item-category-dropdown');
const itemCategoryHidden = document.getElementById('item-category');
const itemStoreInput = document.getElementById('item-store-input');
const itemStoreDropdown = document.getElementById('item-store-dropdown');
const itemStoreHidden = document.getElementById('item-store');
const itemListingsView = document.getElementById('item-listings-view');
const priceComparisonView = document.getElementById('price-comparison-view');
const itemCardsContainer = document.getElementById('item-cards-container');
const comparisonCardsContainer = document.getElementById('comparison-cards-container');
const searchInput = document.getElementById('search-input');
const storeFilterOptions = document.getElementById('store-filter-options');
const categoryFilterOptions = document.getElementById('category-filter-options');
const typeFilterOptions = document.getElementById('type-filter-options');
const userDisplay = document.getElementById('user-display');
const loadingIndicator = document.getElementById('loading-indicator');
const noItemsMessage = document.getElementById('no-items-message');
const loadingComparisonIndicator = document.getElementById('loading-comparison-indicator');
const noComparisonItemsMessage = document.getElementById('no-comparison-items-message');
const tabListings = document.getElementById('tab-listings');
const tabComparisons = document.getElementById('tab-comparisons');
const itemDetailsModal = document.getElementById('item-details-modal');
const closeItemDetailsModal = document.getElementById('close-item-details-modal');
const okItemDetailsModal = document.getElementById('ok-item-details-modal');
const detailItemName = document.getElementById('detail-item-name');
const detailItemDescription = document.getElementById('detail-item-description');
const detailItemCategory = document.getElementById('detail-item-category');
const detailItemStore = document.getElementById('detail-item-store');
const detailItemPrice = document.getElementById('detail-item-price');
const detailItemDate = document.getElementById('detail-item-date');
const detailItemType = document.getElementById('detail-item-type');
const detailUpvotes = document.getElementById('detail-upvotes');
const detailDownvotes = document.getElementById('detail-downvotes');
const detailItemSubmittedBy = document.getElementById('detail-item-submitted-by');

// Re-usable utility functions
function showMessageBox(message) {
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const messageBoxOkBtn = document.getElementById('message-box-ok-btn');

    messageText.textContent = message;
    messageBox.classList.remove('hidden');

    messageBoxOkBtn.onclick = () => {
        messageBox.classList.add('hidden');
    };
}

async function fetchWithBackoff(func, retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await func();
            return result;
        } catch (error) {
            if (i < retries - 1) {
                console.error(`Attempt ${i + 1} failed, retrying in ${delay / 1000}s...`, error);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                console.error("All retries failed.", error);
                throw error;
            }
        }
    }
}

// UI Rendering and Logic Functions
function showView(viewName) {
    itemListingsView.classList.add('hidden');
    priceComparisonView.classList.add('hidden');

    tabListings.classList.remove('active');
    tabComparisons.classList.remove('active');

    if (viewName === 'cards') {
        itemListingsView.classList.remove('hidden');
        tabListings.classList.add('active');
        currentView = 'cards';
        applyFiltersAndSearch();
    } else if (viewName === 'comparison') {
        priceComparisonView.classList.remove('hidden');
        tabComparisons.classList.add('active');
        currentView = 'comparison';
        applyFiltersAndSearch();
    }
}

function setupSearchableDropdown(inputElement, dropdownElement, hiddenInputElement, optionsList) {
    inputElement.addEventListener('input', () => {
        const query = inputElement.value.toLowerCase();
        const filteredOptions = optionsList.filter(option =>
            option.toLowerCase().includes(query)
        );

        dropdownElement.innerHTML = '';
        if (filteredOptions.length > 0) {
            filteredOptions.forEach(option => {
                const item = document.createElement('div');
                item.className = 'px-4 py-2 cursor-pointer hover:bg-gray-100';
                item.textContent = option;
                item.onclick = () => {
                    inputElement.value = option;
                    hiddenInputElement.value = option;
                    dropdownElement.classList.add('hidden');
                };
                dropdownElement.appendChild(item);
            });
            dropdownElement.classList.remove('hidden');
        } else {
            dropdownElement.classList.add('hidden');
        }
    });

    inputElement.addEventListener('focus', () => {
        dropdownElement.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !dropdownElement.contains(e.target)) {
            dropdownElement.classList.add('hidden');
        }
    });
}

function renderItems(itemsToRender) {
    if (itemsToRender.length === 0) {
        noItemsMessage.classList.remove('hidden');
        loadingIndicator.classList.add('hidden');
        itemCardsContainer.innerHTML = '';
        return;
    }
    
    noItemsMessage.classList.add('hidden');
    loadingIndicator.classList.add('hidden');

    itemCardsContainer.innerHTML = '';
    itemsToRender.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="space-y-2">
                <h3 class="text-xl font-bold clickable-item-name" data-id="${item.id}">${item.name}</h3>
                <p class="text-gray-600 truncate-3-lines">${item.description}</p>
                <p class="text-lg font-bold text-blue-600">EC$${item.price.toFixed(2)}</p>
                <p class="text-sm text-gray-500">Store: ${item.store}</p>
                <p class="text-sm text-gray-500">Category: ${item.category}</p>
            </div>
            <div class="vote-buttons-container">
                <button class="vote-btn" data-id="${item.id}" data-vote="up">
                    <i class="fas fa-thumbs-up text-gray-400 hover:text-green-500"></i>
                    <span class="vote-count">${item.upvotes || 0}</span>
                </button>
                <button class="vote-btn" data-id="${item.id}" data-vote="down">
                    <i class="fas fa-thumbs-down text-gray-400 hover:text-red-500"></i>
                    <span class="vote-count">${item.downvotes || 0}</span>
                </button>
            </div>
        `;
        itemCardsContainer.appendChild(card);
    });

    // Add event listeners for item names and vote buttons
    document.querySelectorAll('.clickable-item-name').forEach(nameElement => {
        nameElement.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            const item = allItems.find(i => i.id === itemId);
            if (item) {
                showItemDetails(item);
            }
        });
    });

    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!userId) {
                showMessageBox('You must be logged in to vote.');
                return;
            }

            const itemId = e.currentTarget.dataset.id;
            const voteType = e.currentTarget.dataset.vote;

            try {
                const itemRef = doc(db, 'items', itemId);
                const itemToUpdate = allItems.find(i => i.id === itemId);
                if (!itemToUpdate) return;

                const currentUpvotes = itemToUpdate.upvotes || 0;
                const currentDownvotes = itemToUpdate.downvotes || 0;

                let newUpvotes = currentUpvotes;
                let newDownvotes = currentDownvotes;

                if (voteType === 'up') {
                    newUpvotes++;
                } else {
                    newDownvotes++;
                }

                await updateDoc(itemRef, {
                    upvotes: newUpvotes,
                    downvotes: newDownvotes,
                });
            } catch (error) {
                console.error("Error updating vote:", error);
                showMessageBox('Failed to submit vote. Please try again.');
            }
        });
    });
}

function groupItemsForComparison(items) {
    const groups = {};
    items.forEach(item => {
        const key = `${item.name}-${item.category}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    });
    return Object.values(groups).filter(group => group.length > 1);
}

function renderComparisonItems(itemsToRender) {
    if (itemsToRender.length === 0) {
        noComparisonItemsMessage.classList.remove('hidden');
        loadingComparisonIndicator.classList.add('hidden');
        comparisonCardsContainer.innerHTML = '';
        return;
    }

    noComparisonItemsMessage.classList.add('hidden');
    loadingComparisonIndicator.classList.add('hidden');

    comparisonCardsContainer.innerHTML = '';
    itemsToRender.forEach(group => {
        const firstItem = group[0];
        const card = document.createElement('div');
        card.className = 'comparison-card';

        let itemDetailsHtml = '';
        group.sort((a, b) => a.price - b.price); // Sort by price, lowest first
        group.forEach(item => {
            const cardClass = item.price === group[0].price ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300';
            const priceClass = item.price === group[0].price ? 'text-green-600' : 'text-gray-600';
            itemDetailsHtml += `
                <div class="p-4 border rounded-lg ${cardClass}">
                    <p class="text-sm font-semibold">${item.store}</p>
                    <p class="text-lg font-bold ${priceClass}">EC$${item.price.toFixed(2)}</p>
                    <p class="text-xs text-gray-500">Updated: ${new Date(item.dateAdded).toLocaleDateString()}</p>
                </div>
            `;
        });

        card.innerHTML = `
            <h3 class="text-xl font-bold mb-4">${firstItem.name}</h3>
            <p class="text-gray-600 mb-4">${firstItem.description}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${itemDetailsHtml}
            </div>
        `;
        comparisonCardsContainer.appendChild(card);
    });
}

function showItemDetails(item) {
    detailItemName.textContent = item.name;
    detailItemDescription.textContent = item.description || 'N/A';
    detailItemPrice.textContent = `EC$${item.price.toFixed(2)}`;
    detailItemCategory.textContent = item.category;
    detailItemStore.textContent = item.store;
    detailItemType.textContent = item.type;
    detailItemSubmittedBy.textContent = item.submittedBy || 'Anonymous';
    detailItemDate.textContent = new Date(item.dateAdded).toLocaleDateString();
    detailUpvotes.textContent = item.upvotes || 0;
    detailDownvotes.textContent = item.downvotes || 0;

    itemDetailsModal.classList.remove('hidden');
}

function getSelectedValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

function populateFilterCheckboxes(container, options) {
    container.innerHTML = '';
    options.forEach(option => {
        const checkboxId = `${option.replace(/\s+/g, '-').toLowerCase()}`;
        const checkboxHtml = `
            <div class="flex items-center">
                <input id="${checkboxId}" type="checkbox" value="${option}" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <label for="${checkboxId}" class="ml-2 block text-sm text-gray-900">${option}</label>
            </div>
        `;
        container.innerHTML += checkboxHtml;
    });

    container.addEventListener('change', () => {
        applyFiltersAndSearch();
    });
}

function populateUIFromData() {
    populateFilterCheckboxes(categoryFilterOptions, categories);
    populateFilterCheckboxes(storeFilterOptions, supermarkets);
    populateFilterCheckboxes(typeFilterOptions, itemTypes);
}

function applyFiltersAndSearch() {
    let filteredItems = allItems;
    const searchTerm = searchInput.value.toLowerCase();

    const selectedCategories = getSelectedValues('category-filter-options');
    const selectedStores = getSelectedValues('store-filter-options');
    const selectedTypes = getSelectedValues('type-filter-options');

    if (searchTerm) {
        filteredItems = filteredItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
        );
    }

    if (selectedCategories.length > 0) {
        filteredItems = filteredItems.filter(item =>
            selectedCategories.includes(item.category)
        );
    }

    if (selectedStores.length > 0) {
        filteredItems = filteredItems.filter(item =>
            selectedStores.includes(item.store)
        );
    }

    if (selectedTypes.length > 0) {
        filteredItems = filteredItems.filter(item =>
            selectedTypes.includes(item.type)
        );
    }

    if (currentView === 'cards') {
        renderItems(filteredItems);
    } else if (currentView === 'comparison') {
        const comparisonGroups = groupItemsForComparison(filteredItems);
        renderComparisonItems(comparisonGroups);
    }
}

function setupRealtimeItemListener() {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot(); // Unsubscribe from previous listener if it exists
    }

    const itemsCol = collection(db, 'items');
    const q = query(itemsCol);

    unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        loadingIndicator.classList.remove('hidden');
        noItemsMessage.classList.add('hidden');
        
        allItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        applyFiltersAndSearch();
    }, (error) => {
        console.error("Failed to fetch items:", error);
        showMessageBox("Failed to load data. Please try again later.");
        loadingIndicator.classList.add('hidden');
        noItemsMessage.classList.remove('hidden');
    });
}

// Event handlers
function handleDocumentClick(e) {
    const filterContainers = document.querySelectorAll('.filter-dropdown');
    filterContainers.forEach(container => {
        if (!container.contains(e.target)) {
            container.querySelector('[role="menu"]').classList.add('hidden');
        }
    });
}

function handleAuthEvent(e) {
    userId = e.detail.userId;
    username = e.detail.username;
    userDisplay.textContent = `Welcome, ${username}`;
    userDisplay.classList.remove('hidden');
    
    setupRealtimeItemListener();
    showView('cards');
}

function handleSignOut() {
    userId = null;
    username = null;
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
    }
    userDisplay.classList.add('hidden');
    itemCardsContainer.innerHTML = '';
    comparisonCardsContainer.innerHTML = '';
}

// Main initialization function
function initializeApp() {
    // Event Listeners for UI interaction
    addItemBtn.addEventListener('click', () => {
        if (!userId) {
            showMessageBox('You must be logged in to add an item.');
            return;
        }
        addItemModal.classList.remove('hidden');
        setupSearchableDropdown(itemCategoryInput, itemCategoryDropdown, itemCategoryHidden, categories);
        setupSearchableDropdown(itemStoreInput, itemStoreDropdown, itemStoreHidden, supermarkets);
    });

    closeAddItemModal.addEventListener('click', () => {
        addItemModal.classList.add('hidden');
        addItemForm.reset();
    });

    cancelAddItem.addEventListener('click', () => {
        addItemModal.classList.add('hidden');
        addItemForm.reset();
    });

    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const itemName = document.getElementById('item-name').value;
        const itemDescription = document.getElementById('item-description').value;
        const itemPrice = parseFloat(document.getElementById('item-price').value);
        const itemCategory = document.getElementById('item-category').value;
        const itemStore = document.getElementById('item-store').value;
        const itemType = document.getElementById('item-type').value;

        if (!itemName || !itemPrice || !itemCategory || !itemStore) {
            showMessageBox('Please fill out all required fields.');
            return;
        }

        try {
            await fetchWithBackoff(() => addDoc(collection(db, 'items'), {
                name: itemName,
                description: itemDescription,
                price: itemPrice,
                category: itemCategory,
                store: itemStore,
                type: itemType,
                dateAdded: new Date().toISOString(),
                submittedBy: username,
                userId: userId,
                upvotes: 0,
                downvotes: 0
            }));
            
            addItemModal.classList.add('hidden');
            addItemForm.reset();
            showMessageBox('Item added successfully!');
        } catch (error) {
            console.error("Error adding document: ", error);
            showMessageBox('Failed to add item. Please try again.');
        }
    });

    closeItemDetailsModal.addEventListener('click', () => {
        itemDetailsModal.classList.add('hidden');
    });

    okItemDetailsModal.addEventListener('click', () => {
        itemDetailsModal.classList.add('hidden');
    });

    tabListings.addEventListener('click', () => showView('cards'));
    tabComparisons.addEventListener('click', () => showView('comparison'));

    document.addEventListener('click', handleDocumentClick);
    searchInput.addEventListener('input', applyFiltersAndSearch);
    
    // Auth-related event listeners
    window.addEventListener('user-authenticated', handleAuthEvent);
    window.addEventListener('user-signed-out', handleSignOut);

    // Initial population of filter dropdowns
    populateUIFromData();
}

// Run the initialization function when the script loads
initializeApp();