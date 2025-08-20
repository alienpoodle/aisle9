import { auth, db, APP_ID } from '../firebase-config.js';
import {
    collection,
    query,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const fetchList = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");

    const q = query(collection(db, `artifacts/${APP_ID}/private/${currentUser.uid}/shopping-list`));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addItem = async (itemData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    
    await addDoc(collection(db, `artifacts/${APP_ID}/private/${currentUser.uid}/shopping-list`), {
        ...itemData,
        createdAt: serverTimestamp(),
        isFound: false
    });
};

export const updateItem = async (itemId, updatedData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    
    const itemRef = doc(db, `artifacts/${APP_ID}/private/${currentUser.uid}/shopping-list`, itemId);
    await updateDoc(itemRef, updatedData);
};

export const removeItem = async (itemId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");

    const itemRef = doc(db, `artifacts/${APP_ID}/private/${currentUser.uid}/shopping-list`, itemId);
    await deleteDoc(itemRef);
};