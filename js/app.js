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

    // Initial render on focus
    inputElement.addEventListener('focus', () => renderOptions(inputElement.value));
}

// Function to render items as individual cards using the new CSS
function renderItems(itemsToRender) {
    itemCardsContainer.innerHTML = '';
    if (itemsToRender.length === 0) {
        noItemsMessage.classList.remove('hidden');
        loadingIndicator.classList.add('hidden');
        return;
    }
    noItemsMessage.classList.add('hidden');
    loadingIndicator.classList.add('hidden');

    itemsToRender.forEach(item => {
        const isConfirmed = item.upvotes.length > item.downvotes.length;
        const confirmationText = isConfirmed ? 'Confirmed True' : 'Confirmed False';
        const confirmationColor = isConfirmed ? 'text-green-500' : 'text-red-500';

        const card = document.createElement('div');
        // Corrected: Using more robust and responsive Tailwind classes for the card
        card.className = 'w-full md:w-1/2 lg:w-1/3 p-4 flex';
        card.innerHTML = `
            <div class="item-card flex-1">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold min-w-0">
                        <span class="clickable-item-name" data-item-id="${item.id}">${item.name}</span>
                    </h3>
                    <button data-id="${item.id}" data-action="share" class="share-btn text-blue-500 hover:text-blue-700 transition duration-150">
                        <i class="fas fa-share-alt text-2xl"></i>
                    </button>
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

// Function to group items by name for comparison
function groupItemsForComparison(items) {
    const grouped = {};
    items.forEach(item => {
        const key = item.name.toLowerCase();
        if (!grouped[key]) {
            grouped[key] = {
                name: item.name,
                variants: []
            };
        }
        grouped[key].variants.push({
            id: item.id,
            store: item.store,
            price: item.price,
            category: item.category,
            type: item.type,
            submissionDate: item.submissionDate,
            upvotes: item.upvotes,
            downvotes: item.downvotes,
            description: item.description,
            submittedBy: item.submittedBy
        });
    });

    // Sort variants within each group by price (lowest first)
    for (const key in grouped) {
        grouped[key].variants.sort((a, b) => a.price - b.price);
    }

    // Convert to array for easier rendering and sort by item name
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
}

// Function to render items in comparison view
function renderComparisonItems(itemsToRender) {
    comparisonCardsContainer.innerHTML = '';
    loadingComparisonIndicator.classList.remove('hidden');
    noComparisonItemsMessage.classList.add('hidden');

    const groupedItems = groupItemsForComparison(itemsToRender);

    if (groupedItems.length === 0) {
        noComparisonItemsMessage.classList.remove('hidden');
        loadingComparisonIndicator.classList.add('hidden');
        return;
    }
    loadingComparisonIndicator.classList.add('hidden');

    groupedItems.forEach(group => {
        const comparisonCard = document.createElement('div');
        comparisonCard.className = 'bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-300';
        
        let variantsHtml = group.variants.map(variant => {
            const isConfirmed = variant.upvotes.length > variant.downvotes.length;
            const confirmationText = isConfirmed ? 'Confirmed True' : 'Confirmed False';
            const confirmationColor = isConfirmed ? 'text-green-500' : 'text-red-500';

            return `
            <div class="flex justify-between items-center mb-2">
                <div class="flex-grow flex flex-col">
                    <span class="text-sm font-medium text-gray-700">${variant.store} <span class="text-xs text-gray-500">(${variant.type || 'N/A'})</span></span>
                    <div class="flex items-center text-xs text-gray-500 mt-1">
                        <span>Submitted by: ${variant.submittedBy} on ${new Date(variant.submissionDate).toLocaleDateString()}</span>
                        <div class="ml-2 flex items-center">
                            <i class="fas fa-check-circle mr-1 ${confirmationColor}"></i>
                            <span class="${confirmationColor} font-medium">${confirmationText} (${Math.abs(variant.upvotes.length - variant.downvotes.length)} votes)</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="font-semibold text-2xl text-blue-600">XCD$${variant.price.toFixed(2)}</span>
                </div>
            </div>
        `;
        }).join('');

        comparisonCard.innerHTML = `
            <div class="flex justify-between items-center mb-4 border-b pb-2">
                <h3 class="text-3xl font-bold text-gray-900">
                    <span class="clickable-item-name" data-item-id="${group.variants[0].id}">${group.name}</span>
                </h3>
                <button data-id="${group.variants[0].id}" data-action="share" class="share-btn text-blue-500 hover:text-blue-700 transition duration-150">
                    <i class="fas fa-share-alt text-2xl"></i>
                </button>
            </div>
            <div class="space-y-4">
                ${variantsHtml}
            </div>
        `;
        comparisonCardsContainer.appendChild(comparisonCard);
    });
}

// Function to show item details modal
function showItemDetails(item) {
    detailItemName.textContent = item.name;
    detailItemDescription.textContent = item.description || 'N/A';
    detailItemCategory.textContent = item.category;
    detailItemStore.textContent = item.store;
    detailItemType.textContent = item.type || 'N/A';
    detailItemPrice.textContent = `XCD$${item.price.toFixed(2)}`;
    detailItemDate.textContent = new Date(item.submissionDate).toLocaleDateString();
    detailUpvotes.textContent = item.upvotes.length;
    detailDownvotes.textContent = item.downvotes.length;
    if (detailItemSubmittedBy) {
        detailItemSubmittedBy.textContent = item.submittedBy;
    }
    itemDetailsModal.classList.remove('hidden');
}

// Helper to get selected values from multiselect checkboxes
function getSelectedValues(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)).map(checkbox => checkbox.value);
}

// Populate filter dropdowns and the store/category datalists
function populateUIFromData() {
    // We no longer populate the add item form's select menus here,
    // as they are now handled by the new searchable dropdowns.

    // Populate multi-select filter options with checkboxes
    populateFilterCheckboxes(storeFilterOptions, supermarkets);
    populateFilterCheckboxes(categoryFilterOptions, categories);
    populateFilterCheckboxes(typeFilterOptions, itemTypes);
}

// Helper function to create checkboxes for a filter
function populateFilterCheckboxes(container, options) {
    container.innerHTML = '';
    // Add a "Select All" option
    const selectAllDiv = document.createElement('div');
    selectAllDiv.className = 'flex items-center px-4 py-2 hover:bg-gray-100';
    selectAllDiv.innerHTML = `
        <input type="checkbox" id="select-all-${container.id}" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
        <label for="select-all-${container.id}" class="ml-2 block font-medium text-gray-900">Select All</label>
    `;
    container.appendChild(selectAllDiv);
    document.getElementById(`select-all-${container.id}`).addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        applyFiltersAndSearch();
    });

    options.forEach(option => {
        const div = document.createElement('div');
        div.className = 'flex items-center px-4 py-2 hover:bg-gray-100';
        div.innerHTML = `
            <input type="checkbox" id="${container.id}-${option.replace(/\s/g, '-')}" name="filter-option" value="${option}" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
            <label for="${container.id}-${option.replace(/\s/g, '-')}" class="ml-2 block text-gray-900">${option}</label>
        `;
        container.appendChild(div);
    });

    container.querySelectorAll('input[name="filter-option"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyFiltersAndSearch);
    });
}

// Apply filters and search
function applyFiltersAndSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedStores = getSelectedValues('store-filter-options');
    const selectedCategories = getSelectedValues('category-filter-options');
    const selectedTypes = getSelectedValues('type-filter-options');

    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                             (item.description && item.description.toLowerCase().includes(searchTerm)) ||
                             item.category.toLowerCase().includes(searchTerm) ||
                             item.store.toLowerCase().includes(searchTerm);

        const matchesStore = selectedStores.length === 0 || selectedStores.includes(item.store);
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(item.type);

        return matchesSearch && matchesStore && matchesCategory && matchesType;
    });

    if (currentView === 'cards') {
        renderItems(filteredItems);
    } else if (currentView === 'comparison') {
        renderComparisonItems(filteredItems);
    }
}

// Real-time listener for items
function setupRealtimeItemListener() {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
    }

    if (!db || !userId) {
        console.warn("Firestore or User ID not ready for item listener.");
        return;
    }

    loadingIndicator.classList.remove('hidden');
    loadingComparisonIndicator.classList.remove('hidden');
    itemCardsContainer.innerHTML = '';
    comparisonCardsContainer.innerHTML = '';

    const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/items`);
    const q = query(itemsCollectionRef);

    unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        allItems = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            allItems.push({ id: doc.id, ...data });
        });

        allItems.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));

        populateUIFromData();
        applyFiltersAndSearch();
    }, (error) => {
        console.error("Error fetching documents: ", error);
        showMessageBox("Failed to load items. Please refresh.");
        loadingIndicator.classList.add('hidden');
        noItemsMessage.classList.remove('hidden');
        loadingComparisonIndicator.classList.add('hidden');
        noComparisonItemsMessage.classList.remove('hidden');
    });
}

// Handle upvote/downvote/share and item details click
document.addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    const itemNameSpan = e.target.closest('.clickable-item-name');

    if (button) {
        const itemId = button.dataset.id;
        const action = button.dataset.action;
        const currentItem = allItems.find(item => item.id === itemId);

        if (!currentItem) return;

        if (action === 'share') {
            const shareText = `Check out this price listing for ${currentItem.name} at ${currentItem.store} for XCD$${currentItem.price.toFixed(2)}!`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `Aisle 9: ${currentItem.name} Price`,
                        text: shareText,
                    });
                } catch (error) {
                    console.error('Error sharing:', error);
                }
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = shareText;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    showMessageBox('Item details copied to clipboard!');
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                    showMessageBox('Unable to copy to clipboard.');
                }
                document.body.removeChild(textarea);
            }
        } else if (action === 'upvote' || action === 'downvote') {
            if (!userId) {
                showMessageBox("Please log in to vote.");
                return;
            }

            try {
                const itemRef = doc(db, `artifacts/${appId}/public/data/items`, itemId);
                
                let upvotes = [...currentItem.upvotes];
                let downvotes = [...currentItem.downvotes];

                const hasUpvoted = upvotes.includes(userId);
                const hasDownvoted = downvotes.includes(userId);

                if (action === 'upvote') {
                    if (hasUpvoted) {
                        upvotes = upvotes.filter(id => id !== userId);
                    } else {
                        upvotes.push(userId);
                        if (hasDownvoted) {
                            downvotes = downvotes.filter(id => id !== userId);
                        }
                    }
                } else if (action === 'downvote') {
                    if (hasDownvoted) {
                        downvotes = downvotes.filter(id => id !== userId);
                    } else {
                        downvotes.push(userId);
                        if (hasUpvoted) {
                            upvotes = upvotes.filter(id => id !== userId);
                        }
                    }
                }

                await fetchWithBackoff(() => updateDoc(itemRef, { upvotes, downvotes }));

            } catch (error) {
                console.error("Error updating vote:", error);
                showMessageBox("Failed to record vote. Please try again.");
            }
        }
    } else if (itemNameSpan) {
        const itemId = itemNameSpan.dataset.itemId;
        const item = allItems.find(i => i.id === itemId);
        if (item) {
            showItemDetails(item);
        }
    }
});

// Multi-select filter dropdown logic
const filterContainers = document.querySelectorAll('.relative.inline-block');
filterContainers.forEach(container => {
    const button = container.querySelector('button');
    const options = container.querySelector('[role="menu"]');
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
