import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { showMessage } from "./showMessage.js";

const RegistroForm = document.querySelector("#Registro-form");
RegistroForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = RegistroForm["registro-usuario"].value;
  const email = RegistroForm["registro-email"].value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const contraseña = RegistroForm["registro-contraseña"].value;
  const confirmarContraseña =
    RegistroForm["registro-contraseña-confirmar"].value;

  if (!emailRegex.test(email)) {
    showMessage("Por favor, introduce un correo electrónico válido", "error");
    return;
  }
  if (contraseña !== confirmarContraseña) {
    showMessage(
      "Las contraseñas no coinciden, ponte pilas, no te me duermas",
      "error"
    );
    return;
  }

  console.log(usuario, email, contraseña);

  //Intentar crear usuario con email y contraseña con Google auth y despues de esto cerrar el registro,
  // en caso de un fallo catch manda un mensaje de error al console log
  try {
    const userCredentials = await createUserWithEmailAndPassword(
      auth,
      email,
      contraseña
    );
    console.log(userCredentials);

    //Mandarle datos a la coleccion de Firestore de Usuarios, la de su nombre, email y contraseña.
    await addUsuarioFirestore(
      userCredentials.user.uid,
      usuario,
      email,
      contraseña
    );

    //Cerrar Modal despues de registro
    const registroModal = document.querySelector("#registroModal");
    const modal = bootstrap.Modal.getInstance(registroModal);
    modal.hide();

    showMessage("Bievenido " + userCredentials.user.email, "success");

    window.location.href = 'views/panelPrincipal.html';
    
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      //Caso de error para correo existente
      showMessage("Este correo electronico ya esta en uso", "error");
    } else if (error.code === "auth/invalid-email") {
      //Caso de error para correo no valido
      showMessage("Correo invalido", "error");
    } else if (error.code === "auth/weak-password") {
      showMessage("Contraseña muy debil", "error"); //Caso de error para contraseña floja
    } else if (error.code) {
      showMessage("Algo salio mal!", "error"); //Caso de error el cual no fue definido
    }
  }
});

export async function addUsuarioFirestore(
  uid,
  NombreUsuario,
  correoElectronico,
  contraseña
) {
  try {
    await setDoc(doc(db, "Usuarios", uid), {
      NombreUsuario: NombreUsuario,
      correoElectronico: correoElectronico,
      contraseña: contraseña,
    });
    console.log("Usuario agregado a Firestore");
    console.log("El uid guardado es: " + uid);
  } catch (error) {
    console.error("Error al guardar el usuario en Firestore", error);
  }
}