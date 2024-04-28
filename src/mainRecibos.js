import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { auth } from "./app/firebase.js";

import { loginCheck } from "./app/loginCheck.js";

import "./app/logout.js";
import "./app/signaturePad.js";
import "./app/appPanelPrincipal/generarRecibos.js";

onAuthStateChanged(auth, async (user) => {
  

  loginCheck(user);
});
