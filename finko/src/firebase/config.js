import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from "firebase/analytics";
// Configuration Firebase - vous devez remplacer ces valeurs par les vôtres
const firebaseConfig = {
  apiKey: "AIzaSyAAvMyBjSmCvTd2yX03aZCHSmDB0mCdO4s",
  authDomain: "finko-e8e37.firebaseapp.com",
  projectId: "finko-e8e37",
  storageBucket: "finko-e8e37.firebasestorage.app",
  messagingSenderId: "937941569536",
  appId: "1:937941569536:web:3062fe805aeacd8c4688e5",
  measurementId: "G-M254JJ9880"
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app);

// Initialiser Firebase Authentication
export const auth = getAuth(app)

// Initialiser Firestore
export const db = getFirestore(app)

export default app
