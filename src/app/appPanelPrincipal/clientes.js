import {
  getDocs,
  collection,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "../firebase.js";
import { showMessage } from "../showMessage.js";

// Función para mostrar los datos de los clientes en la tabla
async function mostrarClientesEnTabla() {
  try {
    showMessage("Se ha cargado el js", "success");
    console.log("Se ha cargado el js:");

    auth.onAuthStateChanged(async (user) => {
      if (user) {
        await mostrarDatosUsuario(user);
      } else {
        //Podemos mostrar cuando el usuario no esta autenticado en caso de errores pero cuando cerremos sesion se mostrara el mensaje porque dejara de estar autenticado.
        //showMessage("Usuario no autenticado", "error");
      }
    });
  } catch (error) {
    showMessage("Error al obtener datos de Firestore", "error");
    console.error("Error al obtener datos de Firestore:", error);
  }
}

async function mostrarDatosUsuario(user) {
  const userId = user.uid;
  console.log("El user id guardado es: " + userId);

  // Referencia al documento del usuario en la colección "Usuarios"
  const userDocRef = doc(db, "Usuarios", userId);

  try {
    // Referencia a la colección "Clientes" dentro del documento del usuario
    const clientesCollectionRef = collection(userDocRef, "Clientes");

    // Intentar obtener los datos de la colección "Clientes"
    const querySnapshot = await getDocs(clientesCollectionRef);
    // Si la colección "Clientes" está vacía, crearla y mostrar un mensaje
    if (querySnapshot.empty) {
      // Crea la colección "Clientes" si no existe
      const newClientDocRef = doc(clientesCollectionRef);
      await setDoc(newClientDocRef, {});
    } else {
      // Mostrar los clientes en la tabla
      mostrarClientes(querySnapshot);
    }
  } catch (error) {
    showMessage("Error al obtener datos de Firestore", "error");
    console.error("Error al obtener datos de Firestore:", error);
  }
}

async function mostrarClientes(querySnapshot) {
  const tableBody = document.getElementById("tablitaClientes");

  // Limpiar cualquier contenido previo en el tbody
  tableBody.innerHTML = "";

  // Iterar sobre los documentos y agregar una fila por cada cliente
  querySnapshot.forEach((doc) => {
    const cliente = doc.data();
    const row = `
        <tr>
          <td>${cliente.nombre}</td>
          <td>${cliente.direccion}</td>
          <td>${cliente.telefono}</td>
          <td>${cliente.tipo}</td>
          <td>
          <button type="button" class="btn btn-warning btn-sm"><i class="bi bi-pencil-square"></i></button>
          <button type="button" class="btn btn-danger btn-sm"><i class="bi bi-trash"></i></button>
          </td>

        </tr>
      `;
    tableBody.innerHTML += row;
  });

  showMessage("Se ha cargado la tabla", "success");
  console.log("Se ha cargado la tabla:");
}

// Esperar a que el DOM esté completamente cargado antes de llamar a la función
document.addEventListener("DOMContentLoaded", function () {
  mostrarClientesEnTabla();
});
