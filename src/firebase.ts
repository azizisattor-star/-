import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCYBajoLKS5RY_4bKtWhAoIHGX7fhCo5ng",
  authDomain: "gen-lang-client-0083755413.firebaseapp.com",
  projectId: "gen-lang-client-0083755413",
  storageBucket: "gen-lang-client-0083755413.firebasestorage.app",
  messagingSenderId: "207922462915",
  appId: "1:207922462915:web:77d274dd15a761371da276"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore with custom database ID
const db = getFirestore(app, "ai-studio-1fdc0a2c-5486-4aae-85e5-d2ad32bc77b1");

export { app, db };
