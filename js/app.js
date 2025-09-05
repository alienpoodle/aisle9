import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "aisle-9-6f7d1";

// Hardcoded list of supermarkets
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

// Hardcoded list of categories
const categories = [
    "Bakery & Bread",
    "Beverages",
    "Canned & Packaged Goods",
    "Dairy, Eggs & Cheese",
    "Deli",
    "Frozen Foods",
    "Health & Beauty",
    "Household Essentials",
    "Meat & Seafood",
    "Pasta & Grains",
    "Produce",
    "Snacks & Candy"
];

// Hardcoded list of item types
const itemTypes = ["Local", "Imported"];

let userId = null;
let username = null;
let unsubscribeSnapshot = null;

// Function to show custom message box
function showMessageBox(message) {
    document.getElementById('message-text').innerText = message;
    document.getElementById('message-box').classList.remove('hidden');
}

// Function to hide custom message box
document.getElementById('message-box-ok-btn').addEventListener('click', () => {
    document.getElementById('message-box').classList.add('hidden');
});

// Exponential backoff for API calls
async function fetchWithBackoff(func, retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await func();
        } catch (error) {
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            } else {
                throw error;
            }
        }
    }
}

// DOM Elements
const addItemBtn = document.getElementById('add-item-btn');
const addItemModal = document.getElementById('add-item-modal');
const closeAddItemModal = document.getElementById('close-add-item-modal');
const cancelAddItem = document.getElementById('cancel-add-item');
const addItemForm = document.getElementById('add-item-form');
// Removed the old select elements
// const addItemStoreSelect = document.getElementById('item-store');
// const addItemCategorySelect = document.getElementById('item-category');

// New searchable dropdown elements
const itemCategoryInput = document.getElementById('item-category-input');
const itemCategoryDropdown = document.getElementById('item-category-dropdown');
const itemCategoryHidden = document.getElementById('item-category');

const itemStoreInput = document.getElementById('item-store-input');
const itemStoreDropdown = document.getElementById('item-store-dropdown');
const itemStoreHidden = document.getElementById('item-store');

// View Containers
const itemListingsView = document.getElementById('item-listings-view');
const priceComparisonView = document.getElementById('price-comparison-view');

// Card Containers
const itemCardsContainer = document.getElementById('item-cards-container');
const comparisonCardsContainer = document.getElementById('comparison-cards-container');

// Search and Filter
const searchInput = document.getElementById('search-input');
const storeFilterBtn = document.getElementById('store-filter-btn');
const storeFilterOptions = document.getElementById('store-filter-options');
const categoryFilterBtn = document.getElementById('category-filter-btn');
const categoryFilterOptions = document.getElementById('category-filter-options');
const typeFilterBtn = document.getElementById('type-filter-btn');
const typeFilterOptions = document.getElementById('type-filter-options');

// User Display
const userDisplay = document.getElementById('user-display');

// Loading and No Items Messages
const loadingIndicator = document.getElementById('loading-indicator');
const noItemsMessage = document.getElementById('no-items-message');
const loadingComparisonIndicator = document.getElementById('loading-comparison-indicator');
const noComparisonItemsMessage = document.getElementById('no-comparison-items-message');

// Tabs
const tabListings = document.getElementById('tab-listings');
const tabComparisons = document.getElementById('tab-comparisons');

// Item Details Modal Elements
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

let allItems = [];
let currentView = 'cards';

// Function to switch between views
function showView(viewName) {
    currentView = viewName;
    // Hide all view sections
    itemListingsView.classList.add('hidden');
    priceComparisonView.classList.add('hidden');

    // Deactivate all tabs
    tabListings.classList.remove('active');
    tabComparisons.classList.remove('active');

    // Show the selected view and activate its tab
    if (viewName === 'cards') {
        itemListingsView.classList.remove('hidden');
        tabListings.classList.add('active');
    } else if (viewName === 'comparison') {
        priceComparisonView.classList.remove('hidden');
        tabComparisons.classList.add('active');
    }
    applyFiltersAndSearch();
}

// Event Listeners for Tabs
tabListings.addEventListener('click', () => showView('cards'));
tabComparisons.addEventListener('click', () => showView('comparison'));

// Show/Hide Add Item Modal
addItemBtn.addEventListener('click', () => {
    addItemModal.classList.remove('hidden');
    // Clear and populate searchable dropdowns on modal open
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

// Show/Hide Item Details Modal
closeItemDetailsModal.addEventListener('click', () => {
    itemDetailsModal.classList.add('hidden');
});

okItemDetailsModal.addEventListener('click', () => {
    itemDetailsModal.classList.add('hidden');
});

// Add New Item to Firestore
addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const itemName = document.getElementById('item-name').value.trim();
    const itemDescription = document.getElementById('item-description').value.trim();
    const itemCategory = itemCategoryHidden.value;
    const itemStore = itemStoreHidden.value;
    const itemType = document.getElementById('item-type').value;
    const itemPrice = parseFloat(document.getElementById('item-price').value);

    if (!itemName || !itemCategory || !itemStore || !itemType || isNaN(itemPrice)) {
        showMessageBox("Please fill in all required fields correctly.");
        return;
    }

    if (!userId) {
        showMessageBox("User not authenticated. Please wait a moment and try again.");
        return;
    }

    try {
        const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/items`);
        await fetchWithBackoff(() => addDoc(itemsCollectionRef, {
            name: itemName,
            description: itemDescription,
            category: itemCategory,
            store: itemStore,
            type: itemType,
            price: itemPrice,
            submittedBy: username,
            submissionDate: new Date().toISOString(),
            upvotes: [],
            downvotes: []
        }));
        showMessageBox("Item added successfully!");
        addItemForm.reset();
        addItemModal.classList.add('hidden');
    } catch (error) {
        console.error("Error adding document: ", error);
        showMessageBox("Failed to add item. Please try again.");
    }
});

// Function to handle the searchable dropdown logic
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
}

function renderItemCards(items) {
    itemCardsContainer.innerHTML = '';
    if (items.length === 0) {
        noItemsMessage.classList.remove('hidden');
        return;
    }
    noItemsMessage.classList.add('hidden');

    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card relative p-6 bg-white rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105';
        itemCard.dataset.id = item.id;

        itemCard.innerHTML = `

            <div class="flex items-start">
                <div class="flex-grow">
                    <h3 class="text-xl font-bold text-gray-900 clickable-item-name">${item.name}</h3>
                    <p class="text-sm text-gray-600 truncate mt-1">${item.description}</p>
                    <div class="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${item.category}</span>
                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full">${item.store}</span>
                    </div>
                </div>
                <div class="flex-shrink-0 ml-4 flex flex-col items-center">
                    <div class="text-3xl font-bold text-blue-600">${item.price.toFixed(2)}<span class="text-base font-normal"> XCD$</span></div>
                    <div class="text-xs text-gray-500 mt-1">Submitted by: ${item.submittedBy}</div>
                    <div class="text-xs text-gray-400">
                        <span class="mr-1">Updated:</span><span>${new Date(item.submissionDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            <div class="flex justify-between items-center mt-6">
                <div class="flex space-x-4 text-sm">
                    <button class="vote-btn flex items-center text-green-600 hover:text-green-800 transition-colors duration-200" data-id="${item.id}" data-type="upvote">
                        <i class="fas fa-thumbs-up mr-1"></i>
                        <span class="font-semibold">${item.upvotes.length}</span>
                    </button>
                    <button class="vote-btn flex items-center text-red-600 hover:text-red-800 transition-colors duration-200" data-id="${item.id}" data-type="downvote">
                        <i class="fas fa-thumbs-down mr-1"></i>
                        <span class="font-semibold">${item.downvotes.length}</span>
                    </button>
                </div>
                    <div class="group relative inline-block h-9 w-9 overflow-hidden rounded-full bg-blue-500 transition-[width] duration-200 hover:w-[160px] hover:bg-gradient-to-r from-blue-500 to-indigo-600">
                        <p class="text-white"><i class="fas fa-ellipsis-h"></i></p>
                        <ul class="absolute inset-0 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0">
                            <li class="p-2 transition-opacity duration-200">
                                <a href="#" data-id="${item.id}" data-action="share" class="share-btn text-white/80 hover:text-blue-700 transition duration-150" aria-label="share">
                                    <i class="fas fa-share-alt text-2xl"></i>
                                </a>
                            </li>

                            <li class="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                <a href="#" class="p-2 text-white/80 transition-colors hover:text-white" data-tippy-content="Edit">
                                    <i class="fas fa-edit"></i>
                                </a>
                            </li>
                            <li class="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                <a href="#" class="p-2 text-white/80 transition-colors hover:text-white" data-tippy-content="Duplicate">
                                    <i class="fas fa-clone"></i>
                                </a>
                            </li>
                            <li class="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                <a href="#" class="p-2 text-white/80 transition-colors hover:text-white" data-tippy-content="Delete">
                                    <i class="fas fa-trash"></i>
                                </a>
                            </li>
                        </ul>
                    </div>              
            </div>
        `;
        itemCardsContainer.appendChild(itemCard);
    });
}

function renderComparisonCards(items) {
    comparisonCardsContainer.innerHTML = '';
    if (items.length === 0) {
        noComparisonItemsMessage.classList.remove('hidden');
        return;
    }
    noComparisonItemsMessage.classList.add('hidden');

    const groupedItems = items.reduce((acc, item) => {
        const key = item.name.toLowerCase().trim();
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {});

    for (const itemName in groupedItems) {
        const itemGroup = groupedItems[itemName];
        const comparisonCard = document.createElement('div');
        comparisonCard.className = 'comparison-card p-6 bg-white rounded-xl shadow-lg flex flex-col justify-between';
        comparisonCard.innerHTML = `
            <h3 class="text-2xl font-bold text-gray-900">${itemGroup[0].name}</h3>
            <p class="text-sm text-gray-600 mt-2">Description: ${itemGroup[0].description}</p>
            <div class="mt-4 space-y-3">
                ${itemGroup.sort((a, b) => a.price - b.price).map(item => `
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div class="flex-grow">
                            <span class="text-lg font-semibold text-gray-800">${item.store}</span>
                            <span class="text-sm text-gray-500 ml-2">(${item.type})</span>
                        </div>
                        <span class="text-lg font-bold text-blue-600">${item.price.toFixed(2)} XCD$</span>
                    </div>
                `).join('')}
            </div>
        `;
        comparisonCardsContainer.appendChild(comparisonCard);
    }
}

// Function to update votes
async function updateVote(docId, voteType) {
    if (!userId) {
        showMessageBox("You must be logged in to vote.");
        return;
    }

    const itemRef = doc(db, `artifacts/${appId}/public/data/items`, docId);

    try {
        await fetchWithBackoff(async () => {
            const itemDoc = await getDoc(itemRef);
            if (itemDoc.exists()) {
                const data = itemDoc.data();
                const upvotes = new Set(data.upvotes || []);
                const downvotes = new Set(data.downvotes || []);
                let hasVoted = false;

                if (voteType === 'upvote') {
                    if (downvotes.has(userId)) {
                        downvotes.delete(userId);
                    }
                    if (upvotes.has(userId)) {
                        upvotes.delete(userId);
                        hasVoted = false;
                    } else {
                        upvotes.add(userId);
                        hasVoted = true;
                    }
                } else if (voteType === 'downvote') {
                    if (upvotes.has(userId)) {
                        upvotes.delete(userId);
                    }
                    if (downvotes.has(userId)) {
                        downvotes.delete(userId);
                        hasVoted = false;
                    } else {
                        downvotes.add(userId);
                        hasVoted = true;
                    }
                }

                await updateDoc(itemRef, {
                    upvotes: Array.from(upvotes),
                    downvotes: Array.from(downvotes)
                });
                console.log(`Vote registered: ${hasVoted ? 'Added' : 'Removed'} ${voteType}`);
            }
        });
    } catch (error) {
        console.error("Error updating vote: ", error);
        showMessageBox("Failed to update vote. Please try again.");
    }
}

// Function to handle showing item details modal
function showItemDetails(item) {
    detailItemName.textContent = item.name;
    detailItemDescription.textContent = item.description;
    detailItemCategory.textContent = item.category;
    detailItemStore.textContent = item.store;
    detailItemType.textContent = item.type;
    detailItemPrice.textContent = `${item.price.toFixed(2)} XCD$`;
    detailUpvotes.textContent = item.upvotes.length;
    detailDownvotes.textContent = item.downvotes.length;
    detailItemDate.textContent = new Date(item.submissionDate).toLocaleDateString();
    itemDetailsModal.classList.remove('hidden');
}

// Real-time Firestore Listener
function setupRealtimeItemListener() {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
    }
    const q = query(collection(db, `artifacts/${appId}/public/data/items`));
    unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        allItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        applyFiltersAndSearch();
    }, (error) => {
        console.error("Error fetching documents: ", error);
        showMessageBox("Failed to load listings. Please try again later.");
    });
}

// Function to apply filters and search
function applyFiltersAndSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedStores = Array.from(storeFilterOptions.querySelectorAll('input:checked')).map(input => input.value);
    const selectedCategories = Array.from(categoryFilterOptions.querySelectorAll('input:checked')).map(input => input.value);
    const selectedTypes = Array.from(typeFilterOptions.querySelectorAll('input:checked')).map(input => input.value);

    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.store.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm);

        const matchesStore = selectedStores.length === 0 || selectedStores.includes(item.store);
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(item.type);

        return matchesSearch && matchesStore && matchesCategory && matchesType;
    });

    if (currentView === 'cards') {
        renderItemCards(filteredItems);
    } else {
        renderComparisonCards(filteredItems);
    }
}

// Populate and setup filter dropdowns
function setupFilterDropdown(options, container, filterBtn, filterType) {
    const optionsContainer = container;
    options.forEach(option => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'flex items-center p-2 hover:bg-gray-100 cursor-pointer';
        const checkboxId = `${filterType}-${option.replace(/\s/g, '-')}`;
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="${checkboxId}" name="${filterType}" value="${option}" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            <label for="${checkboxId}" class="ml-2 block text-sm font-medium text-gray-700">${option}</label>
        `;
        optionsContainer.appendChild(checkboxDiv);
    });

    optionsContainer.addEventListener('change', () => {
        applyFiltersAndSearch();
    });

    // Handle dropdown toggle
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.filter-options-container').forEach(otherContainer => {
            if (otherContainer !== optionsContainer) {
                otherContainer.classList.add('hidden');
            }
        });
        optionsContainer.classList.toggle('hidden');
    });
}

setupFilterDropdown(supermarkets, storeFilterOptions, storeFilterBtn, 'store');
setupFilterDropdown(categories, categoryFilterOptions, categoryFilterBtn, 'category');
setupFilterDropdown(itemTypes, typeFilterOptions, typeFilterBtn, 'type');

const filterContainers = document.querySelectorAll('#store-filter-container, #category-filter-container, #type-filter-container');

filterContainers.forEach(container => {
    const options = container.querySelector('[role="menu"]');
    const button = container.querySelector('button');

    button.addEventListener('click', (event) => {
        event.stopPropagation();
        filterContainers.forEach(otherContainer => {
            if (otherContainer !== container) {
                otherContainer.querySelector('[role="menu"]').classList.add('hidden');
            }
        });
        options.classList.toggle('hidden');
    });
});

// Close dropdowns when clicking outside
document.addEventListener('click', (event) => {
    filterContainers.forEach(container => {
        if (!container.contains(event.target)) {
            container.querySelector('[role="menu"]').classList.add('hidden');
        }
    });
});

// Event listeners for search
searchInput.addEventListener('input', applyFiltersAndSearch);

// Event listener for user authentication from login.js
window.addEventListener('user-authenticated', (e) => {
    userId = e.detail.userId;
    username = e.detail.username;
    userDisplay.textContent = `Welcome, ${username}`;
    userDisplay.classList.remove('hidden');

    // Once authenticated, setup the item listener and app functionality
    setupRealtimeItemListener();
    showView('cards');
});

// Event listener for user sign out
window.addEventListener('user-signed-out', () => {
    userId = null;
    username = null;
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
    }
    userDisplay.classList.add('hidden');
    itemCardsContainer.innerHTML = '';
    comparisonCardsContainer.innerHTML = '';
});

// Event listener for votes
itemCardsContainer.addEventListener('click', (e) => {
    const voteBtn = e.target.closest('.vote-btn');
    if (voteBtn) {
        const docId = voteBtn.dataset.id;
        const voteType = voteBtn.dataset.type;
        updateVote(docId, voteType);
    }

    const itemNameElement = e.target.closest('.clickable-item-name');
    if (itemNameElement) {
        const itemCard = itemNameElement.closest('.item-card');
        const itemId = itemCard.dataset.id;
        const item = allItems.find(i => i.id === itemId);
        if (item) {
            showItemDetails(item);
        }
    }
});