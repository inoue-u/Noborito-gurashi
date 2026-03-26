import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Firebase設定
// 環境変数が設定されていない場合はlocalStorageのみで動作します
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'undefined'
)

let app = null
let db = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
}

export { db }
