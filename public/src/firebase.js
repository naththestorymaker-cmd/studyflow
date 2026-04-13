import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyA6dyvEkLmvoUkmtckvNuCLUVd_8ZHqjbc",
  authDomain:        "studyflow-407e3.firebaseapp.com",
  projectId:         "studyflow-407e3",
  storageBucket:     "studyflow-407e3.firebasestorage.app",
  messagingSenderId: "653420228937",
  appId:             "1:653420228937:web:62a9b87a57c18b050cea98",
  measurementId:     "G-QV9DWQEK9M",
}

const app         = initializeApp(firebaseConfig)
export const auth     = getAuth(app)
export const db       = getFirestore(app)
export const provider = new GoogleAuthProvider()
