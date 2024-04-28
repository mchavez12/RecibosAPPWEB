import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "../firebase.js";
import { showMessage } from "../showMessage.js";

document.addEventListener("DOMContentLoaded", async function () {
  try {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("Usuario autenticado:", user.uid);
        showMessage("Usuario autenticado", "success");

        const userDocRef = doc(db, "Usuarios", user.uid);
        const perfilCollectionRef = collection(userDocRef, "Perfil");
        const perfilDocRef = doc(perfilCollectionRef, "perfil_usuario");


        const userDocSnap = await getDoc(userDocRef);
        const perfilDocSnap = await getDoc(perfilDocRef);

        const radioEmpresa = document.getElementById("perfilEmpresa");
        const radioIndividual = document.getElementById("perfilIndividual");
        const datosEmpresa = document.getElementById("datosEmpresa");
        const datosIndividual = document.getElementById("datosIndividual");

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();

          if (userData.NombreUsuario) {
            const nombreUsuarioDisplay = document.getElementById("nombreUsuarioDisplay");
            nombreUsuarioDisplay.textContent = userData.NombreUsuario;
          } else {
            console.error("Campo 'NombreUsuario' no encontrado");
            showMessage("Campo 'NombreUsuario' no encontrado", "error");
          }
        } else {
          console.error("Documento del usuario no encontrado");
          showMessage("Documento del usuario no encontrado", "error");
        }


        if (perfilDocSnap.exists()) {
          console.log("Documento del perfil encontrado");
          showMessage("Perfil cargado correctamente", "success");

          const perfilData = perfilDocSnap.data();

          if (perfilData.tipo === "empresa") {
            radioEmpresa.checked = true;
            datosEmpresa.style.display = "block";
            datosIndividual.style.display = "none";

            document.getElementById("nombreEmpresa").value = perfilData.nombreEmpresa || "";
            document.getElementById("direccionEmpresa").value = perfilData.direccionEmpresa || "";
            document.getElementById("telefonoEmpresa").value = perfilData.telefonoEmpresa || "";
            document.getElementById("codigoEmpresa").value = perfilData.codigoEmpresa || "";
          } else if (perfilData.tipo === "individual") {
            radioIndividual.checked = true;
            datosEmpresa.style.display = "none";
            datosIndividual.style.display = "block";

            document.getElementById("nombreIndividual").value = perfilData.nombre || "";
            document.getElementById("direccionIndividual").value = perfilData.direccion || "";
            document.getElementById("telefonoIndividual").value = perfilData.telefono || "";
          }
        } else {
          console.log("Documento del perfil no encontrado");
          showMessage("Documento del perfil no encontrado", "info");
        }

        // Evento para guardar/actualizar la información del perfil
        const form = document.querySelector("form");
        form.addEventListener("submit", async (event) => {
          event.preventDefault(); // Evitar recarga de la página

          const perfilData = {};

          // Determinar el tipo de perfil
          if (document.getElementById("perfilEmpresa").checked) {
            perfilData.tipo = "empresa";
            perfilData.nombreEmpresa = document.getElementById("nombreEmpresa").value;
            perfilData.direccionEmpresa = document.getElementById("direccionEmpresa").value;
            perfilData.telefonoEmpresa = document.getElementById("telefonoEmpresa").value;
            perfilData.codigoEmpresa = document.getElementById("codigoEmpresa").value;
          } else if (document.getElementById("perfilIndividual").checked) {
            perfilData.tipo = "individual";
            perfilData.nombre = document.getElementById("nombreIndividual").value;
            perfilData.direccion = document.getElementById("direccionIndividual").value;
            perfilData.telefono = document.getElementById("telefonoIndividual").value;
          }

          try {
            await setDoc(perfilDocRef, perfilData, { merge: true
            }); // Guardar o actualizar el perfil en la subcolección
            console.log("Perfil guardado con éxito");
            showMessage("Perfil guardado con éxito", "success");
          } catch (error) {
            console.error("Error al guardar el perfil:", error);
            showMessage("Error al guardar el perfil", "error");
          }
        });
  
      } else {
        console.error("Usuario no autenticado");
        showMessage("Usuario no autenticado", "error");
      }
    });
  
    // Control para mostrar/ocultar campos según el tipo de perfil
    const radioEmpresa = document.getElementById("perfilEmpresa");
    const radioIndividual = document.getElementById("perfilIndividual");
    const datosEmpresa = document.getElementById("datosEmpresa");
    const datosIndividual = document.getElementById("datosIndividual");
  
    radioEmpresa.addEventListener("change", function () {
      if (radioEmpresa.checked) {
        datosEmpresa.style.display = "block";
        datosIndividual.style.display = "none";
        console.log("Perfil de empresa seleccionado");
      }
    });
  
    radioIndividual.addEventListener("change", function () {
      if (radioIndividual.checked) {
        datosEmpresa.style.display = "none";
        datosIndividual.style.display = "block";
        console.log("Perfil individual seleccionado");
      }
    });
  
  } catch (error) {
    console.error("Error general:", error);
    showMessage("Error general al procesar la información", "error");
  }
});