const shoppingListHTML = `
    <section id="shopping-list-view" class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">My Shopping List</h2>
        <form id="add-shopping-item-form" class="flex mb-4 space-x-2">
            <input type="text" id="new-item-name" placeholder="Add an item..." class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300">Add</button>
        </form>
        <div id="shopping-list-container"></div>
    </section>
`;

export const renderPage = (container) => {
    container.innerHTML = shoppingListHTML;
};

export const renderList = (items) => {
    const container = document.getElementById('shopping-list-container');
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500">Your shopping list is empty!</p>`;
        return;
    }
    
    const ul = document.createElement('ul');
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-4 my-2 rounded-lg shadow-sm border ${item.isFound ? 'bg-green-50' : 'bg-gray-50'}`;
        li.dataset.id = item.id;
        li.innerHTML = `
            <div class="flex items-center space-x-3">
                <input type="checkbox" ${item.isFound ? 'checked' : ''} class="toggle-found form-checkbox h-5 w-5 text-blue-600 rounded">
                <span class="text-lg ${item.isFound ? 'line-through text-gray-500' : 'text-gray-800'}">${item.name}</span>
            </div>
            <button class="remove-item-btn text-red-500 hover:text-red-700">
                <i class="fas fa-times"></i>
            </button>
        `;
        ul.appendChild(li);
    });
    container.appendChild(ul);
};