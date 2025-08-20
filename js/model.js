import { auth, db, APP_ID } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
    doc,
    setDoc,
    getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const loginUser = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        let message = "An error occurred. Please try again.";
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
            message = "Invalid email or password.";
        }
        throw new Error(message);
    }
};

export const signupUser = async (username, email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, `artifacts/${APP_ID}/public/data/users`, user.uid), {
            username: username
        });
    } catch (err) {
        let message = "An error occurred. Please try again.";
        if (err.code === 'auth/email-already-in-use') {
            message = "This email is already in use.";
        } else if (err.code === 'auth/weak-password') {
            message = "Password is too weak. Please use at least 6 characters.";
        }
        throw new Error(message);
    }
};

export const logoutUser = () => signOut(auth);
export const onAuthStateChange = (callback) => onAuthStateChanged(auth, callback);
export const fetchUsername = async (userId) => {
    const userSnap = await getDoc(doc(db, `artifacts/${APP_ID}/public/data/users`, userId));
    return userSnap.exists() ? userSnap.data().username : 'Unknown';
};