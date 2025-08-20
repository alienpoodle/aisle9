import { fetchListings } from '../listings/listings-model.js';

export const getComparisonData = async () => {
    const items = await fetchListings();
    const comparisonMap = {};
    
    items.forEach(item => {
        if (!comparisonMap[item.itemName]) {
            comparisonMap[item.itemName] = {
                stores: [item.itemStore],
                lowestPrice: item.itemPrice,
                lowestPriceStore: item.itemStore,
            };
        } else {
            if (item.itemPrice < comparisonMap[item.itemName].lowestPrice) {
                comparisonMap[item.itemName].lowestPrice = item.itemPrice;
                comparisonMap[item.itemName].lowestPriceStore = item.itemStore;
            }
            if (!comparisonMap[item.itemName].stores.includes(item.itemStore)) {
                 comparisonMap[item.itemName].stores.push(item.itemStore);
            }
        }
    });

    return Object.entries(comparisonMap).map(([name, data]) => ({
        itemName: name,
        ...data
    }));
};