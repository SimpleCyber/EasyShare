import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDPoEk-Qb2saKI743ZgID72jPPFEdBn7v0",
  authDomain: "file-share-4d9ae.firebaseapp.com",
  projectId: "file-share-4d9ae",
  storageBucket: "file-share-4d9ae.firebasestorage.app",
  messagingSenderId: "850818803071",
  appId: "1:850818803071:web:a6a083a9724f6e5f0ea64a",
  measurementId: "G-MCK7H5HJB3",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

export { app, db, auth }

