import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ----------------------------------------------------------------
// UYARI: Lütfen aşağıdaki yer tutucu değerleri kendi Firebase
// projenizin bilgileriyle güncelleyin.
// Firebase konsolunuzda "Proje Ayarları" -> "Genel" sekmesinde
// bu bilgileri bulabilirsiniz.
// ----------------------------------------------------------------
export const firebaseConfig = {
  apiKey: "AIzaSyCrUqxMATZ67wt_PeTK_3qSc9K6mbwmrPs",
  authDomain: "tercih-yonetim-sistemi.firebaseapp.com",
  projectId: "tercih-yonetim-sistemi",
  storageBucket: "tercih-yonetim-sistemi.firebasestorage.app",
  messagingSenderId: "1017666250456",
  appId: "1:1017666250456:web:569fd589d96c7e8bc1d9ad",
  measurementId: "G-KP5HB0LN9M"
};

// Check if any config value is a placeholder before initializing
const hasPlaceholder = Object.values(firebaseConfig).some(
  (value) => typeof value === 'string' && value.startsWith('YOUR_')
);

if (hasPlaceholder) {
  console.error("Firebase yapılandırması eksik. Lütfen firebaseConfig.ts dosyasını kendi proje bilgilerinizle güncelleyin.");
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: sans-serif; background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 0.5rem; margin: 2rem auto; max-width: 600px;">
        <h1 style="font-size: 1.5rem; font-weight: bold;">Yapılandırma Hatası</h1>
        <p style="margin-top: 0.5rem;">Uygulama başlatılamadı. Lütfen <code>firebaseConfig.ts</code> dosyasındaki Firebase proje bilgilerini doldurun.</p>
      </div>
    `;
  }
  throw new Error("Firebase configuration is incomplete. Please update firebaseConfig.ts with your project credentials.");
}

// Initialize Firebase with the modular SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);