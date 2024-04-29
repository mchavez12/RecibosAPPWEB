import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "../firebase.js";
import { showMessage } from "../showMessage.js";

let initialized = false;

document.addEventListener("DOMContentLoaded", function () {
  if (initialized) return; // Esto para evitar la inicialización duplicada (prueba para un error)
  initialized = true;

  const addCliente = document.getElementById("nuevoClienteForm");

  addCliente.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = addCliente.nombre.value;
    const direccion = addCliente.direccion.value;
    const telefono = parseInt(addCliente.telefono.value);
    const tipoAsociado = addCliente.tipoAsociado.value;

    try {
      const currentUser = auth.currentUser;

      if (currentUser) {
        const userId = currentUser.uid;
        const userDocRef = doc(db, "Usuarios", userId);
        const clientesCollectionRef = collection(userDocRef, "Clientes");

        const nombreQuery = query(clientesCollectionRef, where("nombre", "==", nombre));
        const querySnapshot = await getDocs(nombreQuery);

        if (!querySnapshot.empty) {
          showMessage("El nombre del cliente ya existe", "error");
          console.error("Cliente duplicado: el nombre ya existe.");
          return;
        }

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
