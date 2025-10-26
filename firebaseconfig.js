import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBanWwBpR0CcSPaVlltG6f3L8G9DlwgLoE",
  authDomain: "learnlocal-nat.firebaseapp.com",
  databaseURL:
    "https://learnlocal-nat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "learnlocal-nat",
  storageBucket: "learnlocal-nat.firebasestorage.app",
  messagingSenderId: "231794248283",
  appId: "1:231794248283:web:b33a2eae0191ee85f84d7e",
  measurementId: "G-VTWTGEE3KH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export { app, auth };

// Analytics is not needed for React Native and causes DOM errors
// export const analytics = getAnalytics(app);
