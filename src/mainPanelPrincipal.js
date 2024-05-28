import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { auth } from "./app/firebase.js";

import { loginCheck } from "./app/loginCheck.js";

import "./app/logout.js";
import "./app/accesibilidad.js";

onAuthStateChanged(auth, async (user) => {
  loginCheck(user); 
  
  function resetIdleTimer() {
      idleTime = 0;
  }

  let idleTime = 0;
  const idleInterval = setInterval(() => {
      idleTime++;
      if (idleTime > 15) { 
          clearInterval(idleInterval);
          auth.signOut().then(() => {
              console.log("Sesión cerrada automáticamente debido a inactividad");
              loginCheck(null); 
          }).catch((error) => {
              console.error("Error al cerrar sesión automáticamente:", error);
          });
      }
  }, 60000);

  document.addEventListener("mousemove", resetIdleTimer);
  document.addEventListener("keypress", resetIdleTimer);
});
