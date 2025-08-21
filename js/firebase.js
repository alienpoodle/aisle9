import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "aisle-9-6f7d1";

export { auth, db, appId };