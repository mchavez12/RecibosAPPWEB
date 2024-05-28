import { signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { showMessage } from "./showMessage.js";
import { auth } from "./firebase.js";

const logout = document.querySelector("#logout, #logoutPP");

logout.addEventListener("click", async () => {
  await signOut(auth);
  console.log("Usuario cerró sesión");
  showMessage("Usted cerró sesión. Vuelva pronto", "error");
  
  if (window.location.pathname.includes("index.html")) {
    window.location.reload();
  } else {
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 3000);
  }
});
