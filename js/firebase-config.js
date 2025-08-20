import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBxreWwMOTobAtG_w5-PoA7xv5_gErtcAE",
    authDomain: "aisle-9-6f7d1.firebaseapp.com",
    projectId: "aisle-9-6f7d1",
    storageBucket: "aisle-9-6f7d1.appspot.com",
    messagingSenderId: "620336806261",
    appId: "1:620336806261:web:8986d4cf9ec39932337b3c",
    measurementId: "G-RSH093YSFN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export a constant for the app ID to be used in Firestore paths
export const APP_ID = firebaseConfig.appId;