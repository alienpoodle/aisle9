const comparisonsHTML = `
    <section id="price-comparison-view" class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">Price Comparisons</h2>
        <div id="loading-comparison-indicator" class="text-center text-gray-500 hidden">Loading comparisons...</div>
        <div id="comparison-cards-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"></div>
    </section>
`;

export const renderPage = (container) => {
    container.innerHTML = comparisonsHTML;
};

export const renderComparisonTable = (data) => {
    const container = document.getElementById('comparison-cards-container');
    container.innerHTML = '';
    
    if (data.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500">No data available for comparison.</p>`;
        return;
    }

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 rounded-lg shadow-md p-4';
        card.innerHTML = `
            <h3 class="text-lg font-bold text-gray-800 mb-2">${item.itemName}</h3>
            <p class="text-sm font-semibold text-gray-600 mb-1">Lowest Price: <span class="text-green-600">XCD$${item.lowestPrice.toFixed(2)}</span></p>
            <p class="text-sm text-gray-500">Found at: ${item.lowestPriceStore}</p>
        `;
        container.appendChild(card);
    });
};

export const showLoading = (show) => {
    const loading = document.getElementById('loading-comparison-indicator');
    if (loading) loading.classList.toggle('hidden', !show);
};