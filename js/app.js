import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';
import { GROCERY_ITEMS } from './grocery-items.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "aisle-9-6f7d1";
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

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
    "Bakery & Bread", "Beverages", "Canned & Packaged Goods", "Dairy, Eggs & Cheese", "Deli",
    "Frozen Foods", "Health & Beauty", "Household Essentials", "Meat & Seafood", "Pasta & Grains",
    "Produce", "Snacks & Candy"
];

// Global state variables
let userId = null;
let username = null;
let unsubscribeSnapshot = null;
let allItems = [];
let allComparisonItems = [];
let currentView = 'cards';
let currentFilters = { store: '', category: '', type: '' };

// DOM Elements
const authPage = document.getElementById('auth-page');
const appContainer = document.getElementById('app-container');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const addItemBtn = document.getElementById('add-item-btn');
const searchInput = document.getElementById('search-input');
const itemCardsContainer = document.getElementById('item-cards-container');
const comparisonCardsContainer = document.getElementById('comparison-cards-container');
const loadingIndicator = document.getElementById('loading-indicator');
const noItemsMessage = document.getElementById('no-items-message');
const loadingComparisonIndicator = document.getElementById('loading-comparison-indicator');
const noComparisonItemsMessage = document.getElementById('no-comparison-items-message');

const addItemModal = document.getElementById('add-item-modal');
const closeAddItemModalBtn = document.getElementById('close-add-item-modal');
const addItemForm = document.getElementById('add-item-form');
const itemNameInput = document.getElementById('item-name-input');
const itemDescription = document.getElementById('item-description');
const itemCategoryInput = document.getElementById('item-category-input');
const itemStoreInput = document.getElementById('item-store-input');
const itemType = document.getElementById('item-type');
const itemPrice = document.getElementById('item-price');
const itemNameDropdown = document.getElementById('item-name-dropdown');
const itemCategoryDropdown = document.getElementById('item-category-dropdown');
const itemStoreDropdown = document.getElementById('item-store-dropdown');
const itemHiddenName = document.getElementById('item-name');
const itemHiddenCategory = document.getElementById('item-category');
const itemHiddenStore = document.getElementById('item-store');
const cancelAddItemBtn = document.getElementById('cancel-add-item');

const editItemModal = document.getElementById('edit-item-modal');
const closeEditItemModalBtn = document.getElementById('close-edit-item-modal');
const editItemForm = document.getElementById('edit-item-form');
const editItemId = document.getElementById('edit-item-id');
const editItemNameInput = document.getElementById('edit-item-name-input');
const editItemDescription = document.getElementById('edit-item-description');
const editItemCategoryInput = document.getElementById('edit-item-category-input');
const editItemStoreInput = document.getElementById('edit-item-store-input');
const editItemType = document.getElementById('edit-item-type');
const editItemPrice = document.getElementById('edit-item-price');
const editItemNameDropdown = document.getElementById('edit-item-name-dropdown');
const editItemCategoryDropdown = document.getElementById('edit-item-category-dropdown');
const editItemStoreDropdown = document.getElementById('edit-item-store-dropdown');
const editHiddenName = document.getElementById('edit-item-name');
const editHiddenCategory = document.getElementById('edit-item-category');
const editHiddenStore = document.getElementById('edit-item-store');
const cancelEditItemBtn = document.getElementById('cancel-edit-item');

const itemDetailsModal = document.getElementById('item-details-modal');
const closeItemDetailsModal = document.getElementById('close-item-details-modal');
const okItemDetailsModal = document.getElementById('ok-item-details-modal');

const filterModal = document.getElementById('filter-modal');
const closeFilterModalBtn = document.getElementById('close-filter-modal');
const filterBtn = document.getElementById('filter-btn');
const applyFiltersBtn = document.getElementById('apply-filters-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const storeFilterInput = document.getElementById('store-filter-input');
const categoryFilterInput = document.getElementById('category-filter-input');
const typeFilterInput = document.getElementById('type-filter-input');
const storeFilterDropdown = document.getElementById('store-filter-dropdown');
const categoryFilterDropdown = document.getElementById('category-filter-dropdown');
const typeFilterDropdown = document.getElementById('type-filter-dropdown');

const tabListingsBtn = document.getElementById('tab-listings');
const tabComparisonsBtn = document.getElementById('tab-comparisons');
const itemListingsView = document.getElementById('item-listings-view');
const priceComparisonView = document.getElementById('price-comparison-view');

const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const messageBoxOkBtn = document.getElementById('message-box-ok-btn');

// --- Helper Functions ---

/**
 * Show a custom message box instead of using alert().
 * @param {string} message The message to display.
 */
const showMessageBox = (message) => {
    messageText.textContent = message;
    messageBox.classList.remove('hidden');
};

/**
 * Hide the custom message box.
 */
const hideMessageBox = () => {
    messageBox.classList.add('hidden');
};

/**
 * Shows a specific view (either 'cards' or 'comparisons').
 * @param {string} viewName 'cards' or 'comparisons'
 */
const showView = (viewName) => {
    currentView = viewName;
    if (viewName === 'cards') {
        itemListingsView.classList.remove('hidden');
        priceComparisonView.classList.add('hidden');
        tabListingsBtn.classList.add('active');
        tabComparisonsBtn.classList.remove('active');
    } else {
        itemListingsView.classList.add('hidden');
        priceComparisonView.classList.remove('hidden');
        tabListingsBtn.classList.remove('active');
        tabComparisonsBtn.classList.add('active');
        renderComparisonCards();
    }
    applyFiltersAndSearch();
};

/**
 * Renders the item cards to the DOM.
 * @param {Array} items The array of item objects to render.
 */
const renderItemCards = (items) => {
    itemCardsContainer.innerHTML = ''; // Clear previous items
    if (items.length === 0) {
        noItemsMessage.classList.remove('hidden');
    } else {
        noItemsMessage.classList.add('hidden');
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-2';
            const date = new Date(item.timestamp.seconds * 1000);
            const formattedDate = date.toLocaleDateString();

            // Check if the current user is the owner of the item
            const isOwner = userId && item.ownerId === userId;
            const actionMenuHtml = isOwner ? `
                <div class="action-menu-container absolute top-3 right-3">
                    <button class="action-menu-btn text-gray-500 hover:text-gray-900 transition duration-200" aria-label="Item actions">
                        <i class="fas fa-ellipsis-v text-xl"></i>
                    </button>
                    <div class="menu-items absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 flex-col">
                        <button data-action="edit" data-id="${item.id}" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200 flex items-center">
                            <i class="fas fa-edit mr-2"></i> Edit
                        </button>
                        <button data-action="delete" data-id="${item.id}" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition duration-200 flex items-center">
                            <i class="fas fa-trash-alt mr-2"></i> Delete
                        </button>
                    </div>
                </div>` : '';

            card.innerHTML = `
                <div class="item-card-container relative flex flex-col justify-between h-full">
                    <div class="flex-grow">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xl font-bold text-gray-800 break-words clickable-item-name" data-id="${item.id}">${item.name}</h3>
                            ${actionMenuHtml}
                        </div>
                        <p class="text-gray-600 text-sm mb-2">
                            <span class="font-medium">Category:</span> ${item.category}
                        </p>
                        <p class="text-gray-600 text-sm mb-2">
                            <span class="font-medium">Store:</span> ${item.store}
                        </p>
                        <p class="text-gray-600 text-sm mb-4">
                            <span class="font-medium">Price:</span> XCD$${item.price.toFixed(2)}
                        </p>
                    </div>
                    <div class="flex items-center justify-between text-sm text-gray-500 mt-4">
                        <div class="flex items-center space-x-2">
                             <button class="share-btn" data-action="share" data-id="${item.id}" aria-label="Share item">
                                <i class="fas fa-share-alt"></i>
                            </button>
                            <button class="vote-btn bg-green-100 text-green-700" data-id="${item.id}" data-vote="upvote">
                                <i class="fas fa-thumbs-up"></i>
                                <span class="vote-count">${item.upvotes}</span>
                            </button>
                            <button class="vote-btn downvote bg-red-100 text-red-700" data-id="${item.id}" data-vote="downvote">
                                <i class="fas fa-thumbs-down"></i>
                                <span class="vote-count">${item.downvotes}</span>
                            </button>
                        </div>
                        <div class="text-right">
                            <p>Submitted: ${formattedDate}</p>
                            <p>By: ${item.ownerName}</p>
                        </div>
                    </div>
                </div>
            `;
            itemCardsContainer.appendChild(card);
        });
    }

    // Attach event listeners for the new cards
    attachCardEventListeners();
};

/**
 * Renders the comparison cards to the DOM.
 */
const renderComparisonCards = () => {
    comparisonCardsContainer.innerHTML = '';
    loadingComparisonIndicator.classList.remove('hidden');
    
    // Group items by name
    const groupedItems = allItems.reduce((acc, item) => {
        if (!acc[item.name]) {
            acc[item.name] = [];
        }
        acc[item.name].push(item);
        return acc;
    }, {});

    const itemsToCompare = Object.values(groupedItems).filter(group => group.length > 1);

    loadingComparisonIndicator.classList.add('hidden');
    if (itemsToCompare.length === 0) {
        noComparisonItemsMessage.classList.remove('hidden');
    } else {
        noComparisonItemsMessage.classList.add('hidden');
        itemsToCompare.forEach(group => {
            // Sort by price, ascending
            group.sort((a, b) => a.price - b.price);
            
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-lg p-6';
            card.innerHTML = `
                <h3 class="text-xl font-bold text-gray-800 mb-4">${group[0].name}</h3>
                <div class="space-y-4">
                    ${group.map(item => `
                        <div class="flex justify-between items-center text-gray-700 border-b pb-2 last:border-b-0 last:pb-0">
                            <div class="flex-grow">
                                <p class="font-semibold">${item.store}</p>
                                <p class="text-sm text-gray-500">${item.category}</p>
                            </div>
                            <span class="text-lg font-bold text-blue-600">XCD$${item.price.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            comparisonCardsContainer.appendChild(card);
        });
    }
};

/**
 * Attaches event listeners to dynamically created item cards.
 */
const attachCardEventListeners = () => {
    // Event listeners for item details modal
    document.querySelectorAll('.clickable-item-name').forEach(element => {
        element.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            const item = allItems.find(i => i.id === itemId);
            if (item) {
                document.getElementById('detail-item-name').textContent = item.name;
                document.getElementById('detail-item-description').textContent = item.description || 'N/A';
                document.getElementById('detail-item-category').textContent = item.category;
                document.getElementById('detail-item-store').textContent = item.store;
                document.getElementById('detail-item-type').textContent = item.type;
                document.getElementById('detail-item-price').textContent = `XCD$${item.price.toFixed(2)}`;
                const date = new Date(item.timestamp.seconds * 1000);
                document.getElementById('detail-item-date').textContent = date.toLocaleDateString();
                document.getElementById('detail-upvotes').textContent = item.upvotes;
                document.getElementById('detail-downvotes').textContent = item.downvotes;
                document.getElementById('detail-item-submitted-by').textContent = item.ownerName;
                itemDetailsModal.classList.remove('hidden');
            }
        });
    });

    // Event listeners for votes
    document.querySelectorAll('.vote-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (!userId) {
                showMessageBox("You must be logged in to vote.");
                return;
            }
            const itemId = e.currentTarget.dataset.id;
            const voteType = e.currentTarget.dataset.vote;
            const itemRef = doc(db, `artifacts/${appId}/public/data/items`, itemId);
            const item = allItems.find(i => i.id === itemId);

            if (!item) return;

            // Check if the user has already voted
            if (item.voters && item.voters[userId] === voteType) {
                // User is trying to vote again with the same vote, so remove the vote
                if (voteType === 'upvote') {
                    await updateDoc(itemRef, { upvotes: item.upvotes - 1 });
                } else {
                    await updateDoc(itemRef, { downvotes: item.downvotes - 1 });
                }
                const newVoters = { ...item.voters };
                delete newVoters[userId];
                await updateDoc(itemRef, { voters: newVoters });

            } else {
                // User is voting for the first time or changing their vote
                const oldVote = item.voters ? item.voters[userId] : null;

                if (voteType === 'upvote') {
                    await updateDoc(itemRef, {
                        upvotes: item.upvotes + 1,
                        downvotes: oldVote === 'downvote' ? item.downvotes - 1 : item.downvotes,
                        [`voters.${userId}`]: 'upvote'
                    });
                } else {
                    await updateDoc(itemRef, {
                        downvotes: item.downvotes + 1,
                        upvotes: oldVote === 'upvote' ? item.upvotes - 1 : item.upvotes,
                        [`voters.${userId}`]: 'downvote'
                    });
                }
            }
        });
    });

    // Event listener for share button
    document.querySelectorAll('[data-action="share"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.currentTarget.dataset.id;
            const item = allItems.find(i => i.id === itemId);
            if (item) {
                const shareData = {
                    title: `Check out this price listing for ${item.name}!`,
                    text: `Found a great price for ${item.name} at ${item.store} for XCD$${item.price.toFixed(2)}!`,
                    url: window.location.href
                };

                if (navigator.share) {
                    navigator.share(shareData)
                        .then(() => console.log('Share successful.'))
                        .catch((error) => console.log('Error sharing:', error));
                } else {
                    showMessageBox('Web Share API is not supported in this browser.');
                }
            }
        });
    });
    
    // Event listeners for action menu buttons
    document.querySelectorAll('.action-menu-container').forEach(container => {
        const button = container.querySelector('.action-menu-btn');
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other open menus
            document.querySelectorAll('.action-menu-container.active').forEach(otherContainer => {
                if (otherContainer !== container) {
                    otherContainer.classList.remove('active');
                }
            });
            container.classList.toggle('active');
        });
    });

    // Event listeners for edit and delete actions
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = e.target.dataset.id;
            const item = allItems.find(i => i.id === itemId);
            if (item) {
                document.getElementById('edit-item-modal').dataset.id = itemId;
                editItemId.value = itemId;
                editItemNameInput.value = item.name;
                editHiddenName.value = item.name;
                editItemDescription.value = item.description || '';
                editItemCategoryInput.value = item.category;
                editHiddenCategory.value = item.category;
                editItemStoreInput.value = item.store;
                editHiddenStore.value = item.store;
                editItemType.value = item.type;
                editItemPrice.value = item.price;
                editItemModal.classList.remove('hidden');
            }
        });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const itemId = e.target.dataset.id;
            // Use custom modal instead of confirm
            const userConfirmed = window.confirm("Are you sure you want to delete this item?");
            if (userConfirmed) {
                try {
                    const itemRef = doc(db, `artifacts/${appId}/public/data/items`, itemId);
                    await deleteDoc(itemRef);
                    showMessageBox("Item deleted successfully.");
                } catch (e) {
                    console.error("Error deleting item:", e);
                    showMessageBox("Error deleting item. Please try again.");
                }
            }
        });
    });
};

// --- Firebase and App Initialization ---

/**
 * Sets up a realtime listener for item data from Firestore.
 */
const setupRealtimeItemListener = () => {
    if (!db) {
        return;
    }
    
    // Unsubscribe from any previous listener
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
    }

    loadingIndicator.classList.remove('hidden');

    const itemsCol = collection(db, `artifacts/${appId}/public/data/items`);
    const q = query(itemsCol);
    unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        loadingIndicator.classList.add('hidden');
        allItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            price: parseFloat(doc.data().price) // Ensure price is a number
        }));
        applyFiltersAndSearch();
    }, (error) => {
        console.error("Error fetching documents:", error);
        loadingIndicator.classList.add('hidden');
        showMessageBox("Failed to load data. Please check your connection and refresh.");
    });
};

/**
 * Handles user authentication state changes.
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        username = user.email ? user.email.split('@')[0] : 'Guest';
        userDisplay.textContent = `Welcome, ${username}`;
        userDisplay.classList.remove('hidden');
        authPage.classList.add('hidden');
        appContainer.classList.remove('hidden');

        // Setup the item listener once authenticated
        setupRealtimeItemListener();
    } else {
        // If not authenticated, sign in with the provided custom token or anonymously
        if (initialAuthToken) {
            try {
                await signInWithCustomToken(auth, initialAuthToken);
            } catch (error) {
                console.error("Custom token sign-in failed:", error);
                // Fallback to anonymous sign-in if custom token fails
                await signInAnonymously(auth);
            }
        } else {
            // Sign in anonymously if no token is available
            await signInAnonymously(auth);
        }
    }
});

// --- Modal and Form Handlers ---

const showModal = (modalElement) => modalElement.classList.remove('hidden');
const hideModal = (modalElement) => modalElement.classList.add('hidden');

closeAddItemModalBtn.addEventListener('click', () => hideModal(addItemModal));
cancelAddItemBtn.addEventListener('click', () => hideModal(addItemModal));
addItemBtn.addEventListener('click', () => showModal(addItemModal));

closeEditItemModalBtn.addEventListener('click', () => hideModal(editItemModal));
cancelEditItemBtn.addEventListener('click', () => hideModal(editItemModal));

closeItemDetailsModal.addEventListener('click', () => hideModal(itemDetailsModal));
okItemDetailsModal.addEventListener('click', () => hideModal(itemDetailsModal));

filterBtn.addEventListener('click', () => showModal(filterModal));
closeFilterModalBtn.addEventListener('click', () => hideModal(filterModal));

messageBoxOkBtn.addEventListener('click', () => hideMessageBox());

// --- Dropdown Logic ---
const setupDropdown = (inputElement, dropdownElement, items, hiddenInputElement) => {
    inputElement.addEventListener('input', () => {
        const searchText = inputElement.value.toLowerCase();
        const filteredItems = items.filter(item => item.toLowerCase().includes(searchText));
        dropdownElement.innerHTML = '';
        if (filteredItems.length > 0) {
            filteredItems.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.textContent = item;
                itemDiv.className = 'px-4 py-2 cursor-pointer hover:bg-gray-100';
                itemDiv.addEventListener('click', () => {
                    inputElement.value = item;
                    hiddenInputElement.value = item;
                    dropdownElement.classList.add('hidden');
                });
                dropdownElement.appendChild(itemDiv);
            });
            dropdownElement.classList.remove('hidden');
        } else {
            dropdownElement.classList.add('hidden');
        }
    });

    inputElement.addEventListener('focus', () => {
        if (dropdownElement.innerHTML !== '') {
            dropdownElement.classList.remove('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !dropdownElement.contains(e.target)) {
            dropdownElement.classList.add('hidden');
        }
    });
};

setupDropdown(itemNameInput, itemNameDropdown, GROCERY_ITEMS, itemHiddenName);
setupDropdown(itemCategoryInput, itemCategoryDropdown, categories, itemHiddenCategory);
setupDropdown(itemStoreInput, itemStoreDropdown, supermarkets, itemHiddenStore);

setupDropdown(editItemNameInput, editItemNameDropdown, GROCERY_ITEMS, editHiddenName);
setupDropdown(editItemCategoryInput, editItemCategoryDropdown, categories, editHiddenCategory);
setupDropdown(editItemStoreInput, editItemStoreDropdown, supermarkets, editHiddenStore);


// --- Main Form Submission Logic ---

addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!userId) {
        showMessageBox("You must be logged in to add an item.");
        return;
    }

    const newItem = {
        name: itemHiddenName.value,
        description: itemDescription.value,
        category: itemHiddenCategory.value,
        store: itemHiddenStore.value,
        type: itemType.value,
        price: parseFloat(itemPrice.value),
        upvotes: 0,
        downvotes: 0,
        timestamp: new Date(),
        ownerId: userId,
        ownerName: username
    };

    try {
        const itemsCol = collection(db, `artifacts/${appId}/public/data/items`);
        await addDoc(itemsCol, newItem);
        hideModal(addItemModal);
        addItemForm.reset();
        showMessageBox("Item added successfully!");
    } catch (e) {
        console.error("Error adding document: ", e);
        showMessageBox("Failed to add item. Please try again.");
    }
});

editItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const itemId = editItemId.value;
    const itemRef = doc(db, `artifacts/${appId}/public/data/items`, itemId);
    const updatedItem = {
        name: editHiddenName.value,
        description: editItemDescription.value,
        category: editItemCategoryInput.value,
        store: editItemStoreInput.value,
        type: editItemType.value,
        price: parseFloat(editItemPrice.value),
        lastUpdated: new Date()
    };

    try {
        await updateDoc(itemRef, updatedItem);
        hideModal(editItemModal);
        editItemForm.reset();
        showMessageBox("Item updated successfully!");
    } catch (e) {
        console.error("Error updating document:", e);
        showMessageBox("Failed to update item. Please try again.");
    }
});

// --- Filtering and Search Logic ---

const applyFiltersAndSearch = () => {
    const searchQuery = searchInput.value.toLowerCase();
    
    let filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery) ||
                              item.description.toLowerCase().includes(searchQuery) ||
                              item.store.toLowerCase().includes(searchQuery) ||
                              item.category.toLowerCase().includes(searchQuery);

        const matchesStore = !currentFilters.store || item.store === currentFilters.store;
        const matchesCategory = !currentFilters.category || item.category === currentFilters.category;
        const matchesType = !currentFilters.type || item.type === currentFilters.type;

        return matchesSearch && matchesStore && matchesCategory && matchesType;
    });

    // Sort the filtered items by most upvotes
    filteredItems.sort((a, b) => b.upvotes - a.upvotes);

    if (currentView === 'cards') {
        renderItemCards(filteredItems);
    } else {
        // The comparison view handles its own rendering and filtering.
        // It's still triggered here to ensure the data is up-to-date.
    }
};

applyFiltersBtn.addEventListener('click', () => {
    currentFilters.store = storeFilterInput.value;
    currentFilters.category = categoryFilterInput.value;
    currentFilters.type = typeFilterInput.value;
    applyFiltersAndSearch();
    hideModal(filterModal);
});

clearFiltersBtn.addEventListener('click', () => {
    currentFilters = { store: '', category: '', type: '' };
    storeFilterInput.value = '';
    categoryFilterInput.value = '';
    typeFilterInput.value = '';
    applyFiltersAndSearch();
});

// Event listeners for tabs
tabListingsBtn.addEventListener('click', () => showView('cards'));
tabComparisonsBtn.addEventListener('click', () => showView('comparisons'));

// Filter dropdown logic
const setupFilterDropdowns = () => {
    const createDropdown = (inputElement, dropdownElement, options) => {
        options.forEach(option => {
            const div = document.createElement('div');
            div.textContent = option;
            div.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm';
            div.addEventListener('click', () => {
                inputElement.value = option;
                dropdownElement.classList.add('hidden');
            });
            dropdownElement.appendChild(div);
        });

        inputElement.addEventListener('focus', () => {
            dropdownElement.classList.remove('hidden');
        });

        inputElement.addEventListener('input', () => {
            const filterText = inputElement.value.toLowerCase();
            const items = dropdownElement.querySelectorAll('div');
            items.forEach(item => {
                if (item.textContent.toLowerCase().includes(filterText)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    };

    createDropdown(storeFilterInput, storeFilterDropdown, supermarkets);
    createDropdown(categoryFilterInput, categoryFilterDropdown, categories);
    createDropdown(typeFilterInput, typeFilterDropdown, ['Local', 'Imported']);
};

setupFilterDropdowns();

// Close dropdowns when clicking outside
document.addEventListener('click', (event) => {
    const filterContainers = [
        document.getElementById('store-filter-input').closest('div.relative'),
        document.getElementById('category-filter-input').closest('div.relative'),
        document.getElementById('type-filter-input').closest('div.relative')
    ];
    filterContainers.forEach(container => {
        if (container && !container.contains(event.target)) {
            const dropdown = container.querySelector('div[id$="-dropdown"]');
            if (dropdown) {
                dropdown.classList.add('hidden');
            }
        }
    });

    // Close action menus
    document.querySelectorAll('.action-menu-container.active').forEach(container => {
        if (!container.contains(event.target)) {
            container.classList.remove('active');
        }
    });
});

// Event listeners for search
searchInput.addEventListener('input', applyFiltersAndSearch);

// Event listener for user sign out
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        userId = null;
        username = null;
        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
        }
        authPage.classList.remove('hidden');
        appContainer.classList.add('hidden');
        itemCardsContainer.innerHTML = '';
        comparisonCardsContainer.innerHTML = '';
        userDisplay.classList.add('hidden');
        showMessageBox("You have been signed out successfully.");
    } catch (error) {
        console.error("Error signing out:", error);
        showMessageBox("Error signing out. Please try again.");
    }
});
