import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzoN1ExRzoR6DVhbpJlvJ_KtAYzMrSVJE",
  authDomain: "pubgolf-90e33.firebaseapp.com",
  projectId: "pubgolf-90e33",
  storageBucket: "pubgolf-90e33.appspot.com", // ✅ FIXED
  messagingSenderId: "1077790899699",
  appId: "1:1077790899699:web:4be51147a747a1d5e8a686",
  measurementId: "G-W4SW9T386V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, RecaptchaVerifier, signInWithPhoneNumber };
