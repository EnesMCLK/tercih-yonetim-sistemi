// @ts-nocheck

// This is a placeholder for your Firebase configuration.
// 1. Go to your Firebase project console.
// 2. In your project's settings, find the "General" tab.
// 3. Under "Your apps", select the web app you created.
// 4. Find and copy the Firebase configuration object.
// 5. Paste it here to replace the placeholder object below.

export const firebaseConfig = {
  apiKey: "AIzaSyCrUqxMATZ67wt_PeTK_3qSc9K6mbwmrPs",
  authDomain: "tercih-yonetim-sistemi.firebaseapp.com",
  projectId: "tercih-yonetim-sistemi",
  storageBucket: "tercih-yonetim-sistemi.firebasestorage.app",
  messagingSenderId: "1017666250456",
  appId: "1:1017666250456:web:569fd589d96c7e8bc1d9ad",
  measurementId: "G-KP5HB0LN9M"
};

// Initialize Firebase
let app;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

export const db = firebase.firestore();