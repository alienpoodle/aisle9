const listingsHTML = `
    <section class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            <input type="text" id="listings-search-input" placeholder="Search for items..." class="flex-grow w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <select id="listings-category-filter" class="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Categories</option>
                <option value="Groceries">Groceries</option>
                <option value="Household">Household</option>
                <option value="Electronics">Electronics</option>
            </select>
            <select id="listings-store-filter" class="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Stores</option>
                <option value="Massy">Massy</option>
                <option value="Gittens">Gittens</option>
                <option value="C.K. Greaves">C.K. Greaves</option>
            </select>
            <button id="add-item-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 w-full md:w-auto">
                <i class="fas fa-plus-circle mr-2"></i> Add Item
            </button>
        </div>
    </section>
    <section id="item-listings-view" class="bg-white rounded-lg shadow-lg p-6">
        <div id="loading-indicator" class="text-center text-gray-500 hidden">Loading listings...</div>
        <div id="no-items-message" class="text-center text-gray-500 hidden">No items found.</div>
        <div id="item-cards-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    </section>
    
    <div id="add-edit-modal" class="modal fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 hidden">
        <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg mx-4">
            <h3 id="modal-title" class="text-2xl font-bold mb-4">Add Item</h3>
            <form id="add-edit-form" class="space-y-4">
                <input type="hidden" id="item-id">
                
                <div class="form-group">
                    <label for="itemName" class="block text-sm font-medium text-gray-700">Item Name</label>
                    <input list="grocery-items-list" id="itemName" name="itemName" required class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-base">
                    <datalist id="grocery-items-list">
                    </datalist>
                </div>

                <div class="form-group">
                    <label for="itemPrice" class="block text-sm font-medium text-gray-700">Price (XCD)</label>
                    <input type="number" step="0.01" id="itemPrice" required class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-base">
                </div>

                <div class="form-group">
                    <label for="itemStore" class="block text-sm font-medium text-gray-700">Store</label>
                    <select id="itemStore" required class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-base">
                        <option value="">Select a store</option>
                        <option value="Massy">Massy</option>
                        <option value="Gittens">Gittens</option>
                        <option value="C.K. Greaves">C.K. Greaves</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="itemCategory" class="block text-sm font-medium text-gray-700">Category</label>
                    <select id="itemCategory" required class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-base">
                        <option value="">Select a category</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Household">Household</option>
                        <option value="Electronics">Electronics</option>
                    </select>
                </div>

                <div class="flex justify-end space-x-4 mt-6">
                    <button type="button" id="cancel-modal-btn" class="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" id="save-modal-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                </div>
            </form>
        </div>
    </div>
`;

const itemCardsContainer = document.getElementById('item-cards-container');
const noItemsMessage = document.getElementById('no-items-message');
const loadingIndicator = document.getElementById('loading-indicator');

export const renderPage = (container) => {
    container.innerHTML = listingsHTML;
};

export const populateDatalist = (items) => {
    const datalist = document.getElementById('grocery-items-list');
    if (!datalist) return;

    datalist.innerHTML = items.map(item => `<option value="${item.name}"></option>`).join('');
};

export const renderListings = (itemsToRender, userId) => {
    const itemCardsContainer = document.getElementById('item-cards-container');
    const noItemsMessage = document.getElementById('no-items-message');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (!itemCardsContainer || !noItemsMessage || !loadingIndicator) return;

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
        card.className = 'w-full md:w-1/2 lg:w-1/3 p-4 flex';
        card.innerHTML = `
            <div class="item-card bg-white rounded-lg shadow-lg p-6 flex-1">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold min-w-0">
                        <span class="clickable-item-name" data-item-id="${item.id}">${item.itemName}</span>
                    </h3>
                    <div class="group relative inline-block h-9 w-9 overflow-hidden rounded-full bg-blue-500 transition-[width] duration-200 hover:w-[160px] hover:bg-gradient-to-r from-blue-500 to-indigo-600">
                        <div class="absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
                            <i class="fas fa-ellipsis text-white text-xl"></i>
                        </div>
                        <ul class="absolute inset-0 flex items-center justify-center space-x-2 transition-transform duration-200 group-hover:translate-x-0 -translate-x-full">
                            <li class="p-2 transition-opacity duration-200">
                                <button data-id="${item.id}" data-action="add-to-list" class="add-to-list-btn text-white/80 hover:text-white transition duration-150" aria-label="Add to Shopping List">
                                    <i class="fas fa-shopping-cart text-2xl"></i>
                                </button>
                            </li>
                            <li class="p-2 transition-opacity duration-200">
                                <button data-id="${item.id}" data-action="share" class="share-btn text-white/80 hover:text-white transition duration-150" aria-label="share">
                                    <i class="fas fa-share-alt text-2xl"></i>
                                </button>
                            </li>
                            
                            ${userId && userId === item.submittedById ? `
                                <li class="p-2 transition-opacity duration-200">
                                    <button data-id="${item.id}" data-action="edit" class="p-2 text-white/80 transition-colors hover:text-white" data-tippy-content="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </li>
                                <li class="p-2 transition-opacity duration-200">
                                    <button data-id="${item.id}" data-action="delete" class="p-2 text-white/80 transition-colors hover:text-white" data-tippy-content="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </li>
                            ` : ''}
                            
                            <li class="p-2 transition-opacity duration-200">
                                <button data-id="${item.id}" data-action="clone" class="p-2 text-white/80 transition-colors hover:text-white" data-tippy-content="Duplicate">
                                    <i class="fas fa-clone"></i>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                <span class="text-3xl font-bold text-blue-600">XCD$${item.itemPrice.toFixed(2)}</span>
                <div class="flex items-center text-sm font-medium mt-2">
                    <i class="fas fa-check-circle mr-2 ${confirmationColor}"></i>
                    <span class="${confirmationColor}">${confirmationText} (${Math.abs(item.upvotes.length - item.downvotes.length)} votes)</span>
                </div>
                <div class="flex flex-col mt-4 text-sm text-gray-500">
                    <div class="flex items-center space-x-4 mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-store mr-2"></i>
                            <span>${item.itemStore}</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4 mb-2">
                        <div class="flex items-center">
                            <i class="fas fa-tag mr-2"></i>
                            <span>${item.itemCategory || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center">
                            <i class="fas fa-user mr-2"></i>
                            <span>${item.submittedByUsername}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-calendar-alt mr-2"></i>
                            <span>${item.submittedAt ? new Date(item.submittedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div class="vote-buttons-container mt-4 flex items-center justify-start space-x-4">
                    <button data-id="${item.id}" data-action="upvote" class="vote-btn text-green-500 hover:text-green-700 transition duration-150">
                        <i class="fas fa-thumbs-up text-3xl"></i>
                        <span class="vote-count text-lg ml-1">${item.upvotes.length}</span>
                    </button>
                    <button data-id="${item.id}" data-action="downvote" class="vote-btn text-red-500 hover:text-red-700 transition duration-150">
                        <i class="fas fa-thumbs-down text-3xl"></i>
                        <span class="vote-count text-lg ml-1">${item.downvotes.length}</span>
                    </button>
                </div>
            </div>
        `;
        itemCardsContainer.appendChild(card);
    });
};

export const showLoading = (show) => {
    const loading = document.getElementById('loading-indicator');
    if (loading) loading.classList.toggle('hidden', !show);
};