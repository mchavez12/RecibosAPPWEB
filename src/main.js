import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import {getDocs, collection} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { auth, db } from "./app/firebase.js";

import { loginCheck } from "./app/loginCheck.js";
import { setupClientes } from "./app/clientesList.js";

import "./app/logout.js";
import "./app/iniciarsesionForm.js";
import "./app/registroForm.js";
import "./app/googleLogin.js";
import "./app/githubLogin.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const querySnapshot = await getDocs(collection(db, "Clientes"));
    setupClientes(querySnapshot.docs);
    console.log(querySnapshot);
  } else {
    
    setupClientes([])
  }
  loginCheck(user);
});
