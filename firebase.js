import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJlB40-npsY1GWJg-sEHC6Ycf5anliJ28",
  authDomain: "the-dons-league.firebaseapp.com",
  projectId: "the-dons-league",
  storageBucket: "the-dons-league.firebasestorage.app",
  messagingSenderId: "531571550304",
  appId: "1:531571550304:web:8fd89fd7bcd5fefc143b05"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
