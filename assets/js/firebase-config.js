// Paste your Firebase config into firebaseConfig below
// Get it from Firebase Console > Project settings > General > Your apps (Web)
// Example shape:
// const firebaseConfig = {
//   apiKey: "...",
//   authDomain: "...",
//   projectId: "...",
//   storageBucket: "...",
//   messagingSenderId: "...",
//   appId: "..."
// };

/* eslint-disable no-undef */
if (typeof firebase === 'undefined') {
  throw new Error('Firebase SDK not loaded. Ensure firebase-app-compat.js is included before this file.');
}

// TODO: Replace with your real config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYpSirsZJBuaM7GdZUJoKK3isEOP6_Q1A",
  authDomain: "mr-premium-app.firebaseapp.com",
  projectId: "mr-premium-app",
  storageBucket: "mr-premium-app.firebasestorage.app",
  messagingSenderId: "511242966185",
  appId: "1:511242966185:web:694ebbae3bc553caa545b8",
  measurementId: "G-ZKBS50XP2H"
};

firebase.initializeApp(firebaseConfig);
/* eslint-enable no-undef */

// Firestore Rules for your Firebase Console:
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /products/{productId} {
//       allow read: if true;  // Public read access for products
//       allow write: if request.auth != null;  // Only authenticated users can write
//     }
//     match /orders/{orderId} {
//       allow read, write: if request.auth != null;
//     }
//   }
// }



