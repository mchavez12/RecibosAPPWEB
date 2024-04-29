        // Import the functions you need from the SDKs you need
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js"
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js"
        import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js"
        import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
        import { getStorage } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js"
        // https://firebase.google.com/docs/web/setup#available-libraries
      

        const firebaseConfig = {
          apiKey: "AIzaSyBHUbddjqou4oyKkyJDDEQCUiO-lFiDnVc",
          authDomain: "recibo-risitas.firebaseapp.com",
          projectId: "recibo-risitas",
          storageBucket: "recibo-risitas.appspot.com",
          messagingSenderId: "589398113723",
          appId: "1:589398113723:web:8200023dc9ebb653b8989e",
          measurementId: "G-Z4T496BYPX"
        };
      
        // Initialize Firebase
        export const app = initializeApp(firebaseConfig);
        export const auth = getAuth(app);
        export const db = getFirestore(app)
        export const storage = getStorage(app);
        const analytics = getAnalytics(app);