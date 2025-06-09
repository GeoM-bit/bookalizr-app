import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDr3WQrsicXaB75PxzZLDX7PYi9OWEAU9w",
  authDomain: "bookalizr-d7391.firebaseapp.com",
  projectId: "bookalizr-d7391",
  storageBucket: "bookalizr-d7391.firebasestorage.app",
  messagingSenderId: "616798399540",
  appId: "1:616798399540:web:c5201c03ab7bace5ff6e61"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };