import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Add a test log
console.log('Firebase initialized');

const handleEditEntry = (employeeId, date) => {
  // Implementation for editing entries
  setEditingEntry({ employeeId, date });
};

const handleDeleteEntry = async (employeeId, date) => {
  if (window.confirm('Are you sure you want to delete this entry?')) {
    // Implementation for deleting entries
    try {
      // Delete from Firebase
      // Update local state
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry');
    }
  }
};