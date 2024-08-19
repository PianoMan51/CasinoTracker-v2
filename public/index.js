import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDu9UYjpqGogqGLNr3OfEBUkR1_JzxDgWs",
  authDomain: "casinotracker-f0c56.firebaseapp.com",
  databaseURL: "https://casinotracker-f0c56-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "casinotracker-f0c56",
  storageBucket: "casinotracker-f0c56.appspot.com",
  messagingSenderId: "370070512708",
  appId: "1:370070512708:web:a99cd1372708492b5cc811",
  measurementId: "G-35ZW2CF4YJ",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

getMonth("2024", "June");

// Create a reference to the root of the database

function getMonth(year, month) {
  const data = ref(db, year + "/" + month);
  get(data).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log(data);
    } else {
      console.log("No data available");
    }
  });
}
