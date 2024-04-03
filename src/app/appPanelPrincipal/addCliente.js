import {
  doc,
  setDoc,
  collection,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "../firebase.js";
import { showMessage } from "../showMessage.js";

document.addEventListener("DOMContentLoaded", function () {
  const addCliente = document.getElementById("nuevoClienteForm");

  addCliente.addEventListener("submit", async function (e) {
    e.preventDefault(); // Evita que el formulario se envíe automáticamente

    const nombre = addCliente.nombre.value;
    const direccion = addCliente.direccion.value;
    const telefono = parseInt(addCliente.telefono.value);
    const tipoAsociado = addCliente.tipoAsociado.value;

    if (isNaN(telefono) || telefono.toString().length !== 10) {
      showMessage("El número de teléfono debe tener 10 dígitos", "error");
      return;
    }

    try {
      const currentUser = auth.currentUser;

      if (currentUser) {
        const userId = currentUser.uid;
        const userDocRef = doc(db, "Usuarios", userId);
        const clientesCollectionRef = collection(userDocRef, "Clientes");

        await setDoc(doc(clientesCollectionRef), {
          nombre: nombre,
          direccion: direccion,
          telefono: telefono,
          tipo: tipoAsociado,
        });

        showMessage("Cliente agregado correctamente", "success");

        setTimeout(function () {
          modal.hide();
        }, 1000);
        setTimeout(function () {
          location.reload();
        }, 2000);
      } else {
        showMessage("Usuario no autenticado", "error");
      }
    } catch (error) {
      showMessage("Error al agregar cliente", "error");
      console.error("Error al agregar cliente:", error);
    }
  });
});
