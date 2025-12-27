import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOTN78VOU1afvzaJSnc0owUgof5YkZR5Q",
  authDomain: "hangman-multiplayer-207f7.firebaseapp.com",
  projectId: "hangman-multiplayer-207f7",
  storageBucket: "hangman-multiplayer-207f7.firebasestorage.app",
  messagingSenderId: "371709670932",
  appId: "1:371709670932:web:30d2924bfe233a9e2bd901",
  measurementId: "G-HM15FKC9X9",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
