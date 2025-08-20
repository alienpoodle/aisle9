import * as Model from './shopping-list-model.js';
import * as View from './shopping-list-view.js';
import * as GlobalView from '../view.js';

export const init = async (container) => {
    View.renderPage(container);
    await fetchAndRenderList();
    setupEventListeners();
};

const fetchAndRenderList = async () => {
    try {
        const items = await Model.fetchList();
        View.renderList(items);
    } catch (error) {
        GlobalView.showMessage(error.message);
    }
};

const setupEventListeners = () => {
    document.getElementById('add-shopping-item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const itemName = document.getElementById('new-item-name').value;
        if (!itemName.trim()) return;

        try {
            await Model.addItem({ name: itemName });
            await fetchAndRenderList();
            document.getElementById('new-item-name').value = '';
            GlobalView.showMessage('Item added to your list.');
        } catch (error) {
            GlobalView.showMessage(error.message);
        }
    });

    document.getElementById('shopping-list-container').addEventListener('click', async (e) => {
        const itemLi = e.target.closest('li');
        if (!itemLi) return;
        
        const itemId = itemLi.dataset.id;
        if (e.target.closest('.remove-item-btn')) {
            try {
                await Model.removeItem(itemId);
                await fetchAndRenderList();
                GlobalView.showMessage('Item removed from your list.');
            } catch (error) {
                GlobalView.showMessage(error.message);
            }
        } else if (e.target.closest('.toggle-found')) {
            const isFound = e.target.closest('.toggle-found').checked;
            try {
                await Model.updateItem(itemId, { isFound });
                await fetchAndRenderList();
            } catch (error) {
                GlobalView.showMessage(error.message);
            }
        }
    });
};