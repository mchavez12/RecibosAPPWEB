import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "./firebase.js";
import { showMessage } from "./showMessage.js";

const signInForm = document.querySelector("#inicioSesion-form");

signInForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = signInForm["login-email"].value;
  const contraseña = signInForm["login-contraseña"].value;

  try {
    const credentials = await signInWithEmailAndPassword(
      auth,
      email,
      contraseña
    );
    const user = credentials.user;

    console.log("Usuario autenticado:", user.uid);

    const modal = bootstrap.Modal.getInstance(
      document.querySelector("#inicioSesionModal")
    );
    modal.hide();

    showMessage("Bienvenido! " + user.email);

    const userDocRef = doc(db, "Usuarios", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();

      if (userData.isFirstLogin === undefined || userData.isFirstLogin) {
        showMessage(
          "¡Te recomendamos configurar tu perfil primero!",
          "warning"
        );

        await updateDoc(userDocRef, { isFirstLogin: false });
      }
    } else {
      console.error("Documento del usuario no encontrado para ID:", user.uid);
    }

    setTimeout(() => {
      window.location.href = "views/panelPrincipal.html";
    }, 4000);

  } catch (error) {
    if (error.code === "auth/wrong-password") {
      showMessage("Contraseña incorrecta", "error");
    } else if (error.code === "auth/user-not-found") {
      showMessage("Usuario no encontrado", "error");
    } else {
      showMessage(
        "Error de inicio de sesión. Por favor, inténtalo de nuevo más tarde.",
        "error"
      );
    }
  }
});
