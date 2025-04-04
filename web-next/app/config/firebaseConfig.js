// Add the getApps and getMessaging imports
import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase only if it hasn't been initialized already
let app
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Initialize Auth with app config
export const auth = getAuth(app)
auth.settings.appVerificationDisabledForTesting = false // Ensure this is false for production

// Initialize Firestore and Storage
export const db = getFirestore(app)
export { collection, getDocs, query, where, orderBy, limit }
export const storage = getStorage(app)

// Initialize messaging conditionally (only in browser environment)
let messaging = null
export const initializeMessaging = async () => {
  if (typeof window !== "undefined" && !messaging) {
    try {
      const { getMessaging } = await import("firebase/messaging")
      messaging = getMessaging(app)
    } catch (error) {
      console.error("Error initializing messaging:", error)
    }
  }
  return messaging
}

export { app }

