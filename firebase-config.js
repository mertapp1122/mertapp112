// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBNqnUokM-PYOY8BHPLRY-4Rw1tmH5H2To",
  authDomain: "mert-s-app-55d6c.firebaseapp.com",
  projectId: "mert-s-app-55d6c",
  storageBucket: "mert-s-app-55d6c.firebasestorage.app",
  messagingSenderId: "826830569006",
  appId: "1:826830569006:web:625791f2cf6e2e4eace9bf",
  measurementId: "G-WEYK0V0LL9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Connect to emulators in development (optional)
if (location.hostname === 'localhost') {
  // Uncomment these lines when running Firebase emulators
  // connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  // connectFirestoreEmulator(db, '127.0.0.1', 8080);
  // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

export default app;