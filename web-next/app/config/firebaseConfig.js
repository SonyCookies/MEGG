import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyCCGOtJMIAp50JJCEv091K1NNUlhHivUfE",
  authDomain: "egg-cellent-4ca51.firebaseapp.com",
  projectId: "egg-cellent-4ca51",
  storageBucket: "egg-cellent-4ca51.firebasestorage.app",
  messagingSenderId: "457648596846",
  appId: "1:457648596846:web:e351d64c2eaf0081a8037f",
  measurementId: "G-J7MDCPJ8Q8",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)