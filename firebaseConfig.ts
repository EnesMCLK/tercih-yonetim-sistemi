// @ts-nocheck

// This is a placeholder for your Firebase configuration.
// For Vercel, you should set these as environment variables in your project settings.
// For local development, create a .env.local file in your project root.
//
// Example .env.local:
VITE_FIREBASE_API_KEY="AIzaSyCrUqxMATZ67wt_PeTK_3qSc9K6mbwmrPs"
VITE_FIREBASE_AUTH_DOMAIN="tercih-yonetim-sistemi.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="tercih-yonetim-sistemi"
VITE_FIREBASE_STORAGE_BUCKET="tercih-yonetim-sistemi.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1017666250456"
VITE_FIREBASE_APP_ID="1:1017666250456:web:569fd589d96c7e8bc1d9ad"
VITE_FIREBASE_MEASUREMENT_ID="G-KP5HB0LN9M"

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
// Check if Firebase has already been initialized to avoid errors
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app(); // if already initialized, use that one
}

export const db = firebase.firestore();