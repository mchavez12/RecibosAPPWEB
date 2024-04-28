import {
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  collection,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "../firebase.js";
import { showMessage } from "../showMessage.js";

const editarClienteModal = document.getElementById("editarClienteModal");

editarClienteModal.addEventListener("shown.bs.modal", async function (e) {
  const button = e.relatedTarget;
  const clientId = button.dataset.id;
  console.log("Cliente ID: " + clientId);

  // Obtener los datos del cliente
  const cliente = await obtenerClientePorId(clientId);

  // Rellenar los campos del formulario con los datos del cliente
  if (cliente) {
    document.getElementById("Editar-nombre").value = cliente.nombre;
    document.getElementById("Editar-direccion").value = cliente.direccion;
    document.getElementById("Editar-telefono").value = cliente.telefono;
    document.getElementById("Editar-tipoAsociado").value = cliente.tipo;
    showMessage("Cliente encontrado", "success");

  } else {
    showMessage("Cliente no encontrado", "error");
    console.error("Cliente no encontrado", "error");
  }

  // Establecer el ID del cliente en el botón de guardar cambios
  document.getElementById("guardarClienteEditado").setAttribute("data-id", clientId);
});

// Función para obtener los datos del cliente por su ID desde la base de datos
async function obtenerClientePorId(clientId) {
  try {
    const currentUser = auth.currentUser;

    if (currentUser) {
      const userId = currentUser.uid;
      const userDocRef = doc(db, "Usuarios", userId);
      const clientesCollectionRef = collection(userDocRef, "Clientes");
      const clienteDocRef = doc(clientesCollectionRef, clientId);
      const clienteDocSnap = await getDoc(clienteDocRef);

      if (clienteDocSnap.exists()) {
        return clienteDocSnap.data();
      } else {
        console.log("El cliente con ID " + clientId + " no existe en Firestore.");
        showMessage("Cliente no encontrado en Firestore", "error");
        console.error("Cliente no encontrado en Firestore", "error");
        return null;
      }
    } else {
      showMessage("Usuario no autenticado", "error");
      console.error("Usuario no autenticado", "error");
    }
  } catch (error) {
    showMessage("Error al obtener cliente", "error");
    console.error("Error al obtener cliente:", error);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const botonGuardar = document.getElementById("guardarClienteEditado");

  botonGuardar.addEventListener("click", async function (event) {
    event.preventDefault(); // Evitar el comportamiento predeterminado de envío del formulario
    
    try {
      const clienteId = this.getAttribute("data-id");
      const updatedNombre = document.getElementById("Editar-nombre").value;
      const updatedDireccion = document.getElementById("Editar-direccion").value;
      const updatedTelefono = document.getElementById("Editar-telefono").value;
      const updatedTipoAsociado = document.getElementById("Editar-tipoAsociado").value;

      const currentUser = auth.currentUser;
      if (!currentUser) {
        showMessage("Usuario no autenticado", "error");
        return;
      }

      const userId = currentUser.uid;
      const userDocRef = doc(db, "Usuarios", userId);
      const clientesCollectionRef = collection(userDocRef, "Clientes");
      const clienteDocRef = doc(clientesCollectionRef, clienteId);

      await updateDoc(clienteDocRef, {
        nombre: updatedNombre,
        direccion: updatedDireccion,
        telefono: updatedTelefono,
        tipo: updatedTipoAsociado,
      });

      showMessage("Cliente editado con éxito", "success");

      setTimeout(function () {
        const modal = new bootstrap.Modal(document.getElementById("editarClienteModal"));
        modal.hide();
      }, 1000);

      setTimeout(function () {
        location.reload();
      }, 2000);

    } catch (error) {
      showMessage("Error al editar cliente", "error");
      console.error("Error al editar cliente:", error);
    }
  });
});



const deleteClienteModal = document.getElementById("deleteClienteModal");
deleteClienteModal.addEventListener("show.bs.modal", async function (e) {
  const button = e.relatedTarget;
  const clientId = button.dataset.id;
  console.log("Cliente ID: " + clientId);

  // Obtener los datos del cliente
  const cliente = await obtenerClientePorId(clientId);

  // Rellenar el nombre del cliente seleccionado en el modal
  if (cliente && cliente.nombre) {
    document.getElementById("clienteSeleccionadoNombre").textContent = cliente.nombre;
  } else {
    showMessage("Cliente no encontrado", "error");
    console.error("Cliente no encontrado", "error");
    // Si no se encuentra el cliente o el nombre está vacío, ocultar el modal de eliminar
    const modal = new bootstrap.Modal(document.getElementById('deleteClienteModal'));
    modal.hide();
  }

  // Establecer el ID del cliente en el botón de confirmar eliminar
  document.getElementById("confirmarEliminarCliente").setAttribute("data-id", clientId);
});

document.getElementById("confirmarEliminarCliente").addEventListener("click", async function () {
  try {
    const clienteId = this.getAttribute("data-id");

    const currentUser = auth.currentUser;

    if (currentUser) {
      const userId = currentUser.uid;
      if (!userId) {
        showMessage("ID de usuario no encontrado", "error");
        return;
      }
      
      const userDocRef = doc(db, "Usuarios", userId);
      const clientesCollectionRef = collection(userDocRef, "Clientes");

      if (!clienteId) {
        showMessage("ID de cliente no encontrado", "error");
        return;
      }
      
      const clienteDocRef = doc(clientesCollectionRef, clienteId);

      await deleteDoc(clienteDocRef); // Elimina el documento del cliente

      showMessage("Cliente eliminado correctamente", "success");

      // Cierra el modal después de 1 segundo
      setTimeout(function () {
        const modal = new bootstrap.Modal(document.getElementById('deleteClienteModal'));
        modal.hide();
      }, 1000);

      // Recarga la página después de 2 segundos
      setTimeout(function () {
        location.reload();
      }, 2000);

    } else {
      showMessage("Usuario no autenticado", "error");
    }
  } catch (error) {
    showMessage("Error al eliminar cliente", "error");
    console.error("Error al eliminar cliente:", error);
  }
});


