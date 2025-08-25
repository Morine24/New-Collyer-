import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBsgsH5S_a1dAPe2GMBrSK889YhB2Tfzn8",
  authDomain: "collyer-ff8ef.firebaseapp.com",
  projectId: "collyer-ff8ef",
  storageBucket: "collyer-ff8ef.firebasestorage.app",
  messagingSenderId: "741229616522",
  appId: "1:741229616522:web:ed31c7abde8feefd683c73"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
