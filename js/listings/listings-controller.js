import * as Model from './listings-model.js';
import * as ShoppingListModel from '../shopping-list/shopping-list-model.js';
import * as View from './listings-view.js';
import * as GlobalView from '../view.js';
import { auth } from '../firebase-config.js';
import { GROCERY_ITEMS } from '../data/initial-data.js';

export const init = async (container) => {
    View.renderPage(container);
    View.showLoading(true);

    View.populateDatalist(GROCERY_ITEMS);

    try {
        await Model.seedDatabase();
        const items = await Model.fetchListings();
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        View.renderListings(items, userId);
    } catch (error) {
        GlobalView.showMessage('Failed to load listings.');
        console.error("Error fetching listings:", error);
    } finally {
        View.showLoading(false);
    }

    setupEventListeners();
};

const setupEventListeners = () => {
    const container = document.getElementById('item-cards-container');
    if (!container) return;

    container.addEventListener('click', async (e) => {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const itemId = actionBtn.dataset.id;
        const action = actionBtn.dataset.action;
        
        if (action === 'upvote' || action === 'downvote') {
            await handleVote(itemId, action);
        } else if (action === 'add-to-list') {
            const card = e.target.closest('.item-card');
            const itemName = card.querySelector('.clickable-item-name').textContent;
            await handleAddItemToList(itemName);
        } else if (action === 'edit') {
            await handleEdit(itemId);
        } else if (action === 'delete') {
            await handleDelete(itemId);
        } else if (action === 'clone') {
            await handleClone(itemId);
        }
    });

    document.getElementById('add-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const itemName = document.getElementById('itemName').value;
        const itemPrice = document.getElementById('itemPrice').value;
        const itemStore = document.getElementById('itemStore').value;
        const itemCategory = document.getElementById('itemCategory').value;

        const itemData = {
            itemName: itemName,
            itemPrice: parseFloat(itemPrice),
            itemStore: itemStore,
            itemCategory: itemCategory
        };

        try {
            await Model.createListing(itemData);
            const items = await Model.fetchListings();
            const userId = auth.currentUser ? auth.currentUser.uid : null;
            View.renderListings(items, userId);
            GlobalView.showMessage('Item added successfully!');
            e.target.reset();
        } catch (error) {
            GlobalView.showMessage(error.message);
        }
    });
};

const handleVote = async (itemId, voteType) => {
    try {
        await Model.voteOnListing(itemId, voteType);
        const items = await Model.fetchListings();
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        View.renderListings(items, userId);
        GlobalView.showMessage('Vote cast successfully!');
    } catch (error) {
        GlobalView.showMessage(error.message);
    }
};

const handleAddItemToList = async (itemName) => {
    try {
        await ShoppingListModel.addItem({ name: itemName });
        GlobalView.showMessage(`${itemName} added to your shopping list.`);
    } catch (error) {
        GlobalView.showMessage(error.message);
    }
};

const handleEdit = async (itemId) => {
    GlobalView.showMessage(`Edit button clicked for item ${itemId}`);
};

const handleDelete = async (itemId) => {
    if (confirm("Are you sure you want to delete this item?")) {
        try {
            await Model.deleteListing(itemId);
            const items = await Model.fetchListings();
            const userId = auth.currentUser ? auth.currentUser.uid : null;
            View.renderListings(items, userId);
            GlobalView.showMessage('Item deleted.');
        } catch (error) {
            GlobalView.showMessage(error.message);
        }
    }
};

const handleClone = async (itemId) => {
    GlobalView.showMessage(`Clone button clicked for item ${itemId}`);
};