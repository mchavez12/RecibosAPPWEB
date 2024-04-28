import {
  getDocs,
  collection,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "../firebase.js";
import { showMessage } from "../showMessage.js";

document.addEventListener("DOMContentLoaded", function () {
  mostrarClientesEnTabla();
});

async function mostrarClientesEnTabla() {
  try {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        await mostrarDatosUsuario(user);
      } else {
        // Mostrar un mensaje si el usuario no está autenticado
        showMessage("Usuario no autenticado", "error");
      }
    });
  } catch (error) {
    showMessage("Error al obtener datos de Firestore", "error");
    console.error("Error al obtener datos de Firestore:", error);
  }
}

async function mostrarDatosUsuario(user) {
  const userId = user.uid;
  const userDocRef = doc(db, "Usuarios", userId);

  try {
    const clientesCollectionRef = collection(userDocRef, "Clientes");
    const querySnapshot = await getDocs(clientesCollectionRef);

    if (querySnapshot.empty) {
      showMessage("No hay clientes para mostrar", "info");
    } else {
      // Filtrar los documentos con campos vacíos o undefined
      const filteredDocs = querySnapshot.docs.filter((doc) => {
        const cliente = doc.data();
        return (
          cliente.nombre &&
          cliente.direccion &&
          cliente.telefono &&
          cliente.tipo
        );
      });

      if (filteredDocs.length === 0) {
        showMessage("Todos los registros de clientes son inválidos", "error");
      } else {
        mostrarClientes(filteredDocs);
      }
    }
  } catch (error) {
    showMessage("Error al obtener datos de Firestore", "error");
    console.error("Error al obtener datos de Firestore:", error);
  }
}

async function mostrarClientes(docs) {
  const tableBody = document.getElementById("tablitaClientes");
  tableBody.innerHTML = "";

  docs.forEach((doc) => {
    const cliente = doc.data();
    const row = `
      <tr>
        <td>${cliente.nombre}</td>
        <td>${cliente.direccion}</td>
        <td>${cliente.telefono}</td>
        <td>${cliente.tipo}</td>
        <td>
          <button type="button" class="btn btn-warning btn-sm btn-editar" data-bs-toggle="modal" data-bs-target="#editarClienteModal" data-id="${doc.id}">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button type="button" class="btn btn-danger btn-sm btn-delete" data-bs-toggle="modal" data-bs-target="#deleteClienteModal" data-id="${doc.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });

  console.log("Tabla de clientes mostrada correctamente");
}
