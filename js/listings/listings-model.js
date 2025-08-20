
import { auth, db, APP_ID } from '../firebase-config.js';
import {
    collection,
    query,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    runTransaction,
    orderBy,
    limit,
    arrayUnion,
    arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { GROCERY_ITEMS } from '../data/initial-data.js';

let allItems = [];

export const seedDatabase = async () => {
    const itemsRef = collection(db, `artifacts/${APP_ID}/public/data/items`);
    const q = query(itemsRef, limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("Database is empty. Seeding initial data...");
        const stores = ["Massy", "Gittens", "C.K. Greaves"];
        const categories = ["Groceries", "Household", "Electronics"];
        const dummyUserId = "initial-seed-user";

        for (const item of GROCERY_ITEMS) {
            const randomPrice = (Math.random() * (100 - 5) + 5).toFixed(2);
            await addDoc(itemsRef, {
                itemName: item.name,
                itemBrand: item.brand,
                itemSize: item.size,
                itemPrice: parseFloat(randomPrice),
                itemStore: stores[Math.floor(Math.random() * stores.length)],
                itemCategory: categories[Math.floor(Math.random() * categories.length)],
                submittedById: dummyUserId,
                submittedAt: serverTimestamp(),
                upvotes: [],
                downvotes: []
            });
        }
    } else {
        console.log("Database already contains data. Skipping seeding.");
    }
};

// CRUD Operations
export const fetchListings = async () => {
    const itemsRef = collection(db, `artifacts/${APP_ID}/public/data/items`);
    const q = query(itemsRef, orderBy("submittedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const itemsPromises = querySnapshot.docs.map(async doc => {
        const data = doc.data();
        const userRef = doc(db, `artifacts/${APP_ID}/public/data/users`, data.submittedById);
        const userSnap = await getDoc(userRef);
        const username = userSnap.exists() ? userSnap.data().username : 'Unknown';
        return { id: doc.id, ...data, submittedByUsername: username };
    });

    allItems = await Promise.all(itemsPromises);
    return allItems;
};

export const createListing = async (itemData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    await addDoc(collection(db, `artifacts/${APP_ID}/public/data/items`), {
        ...itemData,
        submittedById: currentUser.uid,
        submittedAt: serverTimestamp(),
        upvotes: [],
        downvotes: []
    });
};

export const updateListing = async (itemId, updatedData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    const itemRef = doc(db, `artifacts/${APP_ID}/public/data/items`, itemId);
    await updateDoc(itemRef, updatedData);
};

export const deleteListing = async (itemId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    const itemRef = doc(db, `artifacts/${APP_ID}/public/data/items`, itemId);
    await deleteDoc(itemRef);
};

// Voting Logic
export const voteOnListing = async (itemId, voteType) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("You must be logged in to vote.");
    
    const itemRef = doc(db, `artifacts/${APP_ID}/public/data/items`, itemId);
    
    try {
        await runTransaction(db, async (transaction) => {
            const itemDoc = await transaction.get(itemRef);
            if (!itemDoc.exists()) throw new Error("Document does not exist!");
            const data = itemDoc.data();
            
            // Check if the user has already voted
            const userUpvoted = data.upvotes.includes(currentUser.uid);
            const userDownvoted = data.downvotes.includes(currentUser.uid);
            
            if (voteType === 'upvote') {
                if (userUpvoted) throw new Error("You have already upvoted this item.");
                if (userDownvoted) transaction.update(itemRef, { downvotes: arrayRemove(currentUser.uid) });
                transaction.update(itemRef, { upvotes: arrayUnion(currentUser.uid) });
            } else if (voteType === 'downvote') {
                if (userDownvoted) throw new Error("You have already downvoted this item.");
                if (userUpvoted) transaction.update(itemRef, { upvotes: arrayRemove(currentUser.uid) });
                transaction.update(itemRef, { downvotes: arrayUnion(currentUser.uid) });
            }
        });
    } catch (e) {
        throw new Error(e.message || "Failed to cast vote.");
    }
};

// Search & Filter Logic
export const searchListings = (query, filters) => {
    return allItems.filter(item => {
        const matchesQuery = item.itemName.toLowerCase().includes(query) ||
                             item.itemDescription?.toLowerCase().includes(query) || '';
        const matchesCategory = !filters.category || item.itemCategory === filters.category;
        const matchesStore = !filters.store || item.itemStore === filters.store;
        return matchesQuery && matchesCategory && matchesStore;
    });
};