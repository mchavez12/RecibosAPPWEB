import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "../firebase.js";
import { showMessage } from "../showMessage.js";

// Función para mostrar/ocultar campos según el tipo de perfil seleccionado
function togglePerfilVisibility() {
  const radioEmpresa = document.getElementById("perfilEmpresa");
  const radioIndividual = document.getElementById("perfilIndividual");
  const datosEmpresa = document.getElementById("datosEmpresa");
  const datosIndividual = document.getElementById("datosIndividual");

  if (radioEmpresa.checked) {
    datosEmpresa.style.display = "block";
    datosIndividual.style.display = "none";
  } else if (radioIndividual.checked) {
    datosEmpresa.style.display = "none";
    datosIndividual.style.display = "block";
  }
}

// Función para cargar el perfil desde Firestore y autocompletar el formulario
async function cargarPerfil() {
  try {
    const user = auth.currentUser;

    if (user) {
      console.log("Usuario autenticado:", user.uid);
      const userDocRef = doc(db, "Usuarios", user.uid);
      const perfilCollectionRef = collection(userDocRef, "Perfil");
      const perfilDocRef = doc(perfilCollectionRef, "perfil_usuario");

      const perfilDocSnap = await getDoc(perfilDocRef);

      if (perfilDocSnap.exists()) {
        const perfilData = perfilDocSnap.data();

        if (perfilData.tipo === "empresa") {
          document.getElementById("perfilEmpresa").checked = true;
          togglePerfilVisibility(); // Mostrar solo campos de empresa
          document.getElementById("nombreEmpresa").value = perfilData.nombreEmpresa || "";
          document.getElementById("direccionEmpresa").value = perfilData.direccionEmpresa || "";
          document.getElementById("telefonoEmpresa").value = perfilData.telefonoEmpresa || "";
          document.getElementById("codigoEmpresa").value = perfilData.codigoEmpresa || "";
        } else if (perfilData.tipo === "individual") {
          document.getElementById("perfilIndividual").checked = true;
          togglePerfilVisibility(); // Mostrar solo campos individuales
          document.getElementById("nombreIndividual").value = perfilData.nombre || "";
          document.getElementById("direccionIndividual").value = perfilData.direccion || "";
          document.getElementById("telefonoIndividual").value = perfilData.telefono || "";
        }

        console.log("Perfil cargado con éxito");
        showMessage("Perfil cargado con éxito", "success");
      } else {
        console.log("Perfil no encontrado");
        showMessage("Perfil no encontrado", "info");
      }
    } else {
      console.error("Usuario no autenticado");
      showMessage("Usuario no autenticado", "error");
    }
  } catch (error) {
    console.error("Error al cargar el perfil:", error);
    showMessage("Error al cargar el perfil", "error");
  }
}

// Nueva función para buscar clientes en Firestore
// Variables globales para almacenar datos del cliente seleccionado
let clienteSeleccionado = null;

// Función para buscar clientes y mostrar el botón para guardar si se encuentran resultados
async function buscarClientes() {
  const campoBusqueda = document.getElementById("campoBusquedaCliente").value.trim();
  const resultadosElement = document.getElementById("resultadosClientes");
  const botonGuardarCliente = document.getElementById("botonGuardarCliente");

  resultadosElement.innerHTML = ""; // Limpiar resultados anteriores
  botonGuardarCliente.style.display = "none"; // Ocultar botón inicialmente

  if (campoBusqueda === "") {
    return; // No hacer nada si el campo está vacío
  }

  const user = auth.currentUser;

  if (user) {
    try {
      const userDocRef = doc(db, "Usuarios", user.uid);
      const clientesRef = collection(userDocRef, "Clientes");
      const consulta = query(clientesRef, where("nombre", "==", campoBusqueda));

      const resultadosSnapshot = await getDocs(consulta);

      if (!resultadosSnapshot.empty) {
        showMessage("Cliente(s) encontrado(s)", "success");

        resultadosSnapshot.forEach((doc) => {
          const datos = doc.data();
          const clienteItem = document.createElement("li");
          clienteItem.classList.add("list-group-item");

          // Guardar el ID del documento para identificar al cliente seleccionado
          clienteItem.dataset.id = doc.id; // Almacenar ID del cliente
          clienteItem.innerHTML = `
            <strong>Nombre:</strong> ${datos.nombre}<br>
            <strong>Dirección:</strong> ${datos.direccion}<br>
            <strong>Teléfono:</strong> ${datos.telefono}<br>
            <strong>Tipo:</strong> ${datos.tipo}
          `;

          resultadosElement.appendChild(clienteItem);

          // Evento para seleccionar el cliente al hacer clic en el elemento
          clienteItem.addEventListener("click", () => {
            clienteSeleccionado = datos; // Almacenar datos del cliente seleccionado
            botonGuardarCliente.style.display = "inline-block"; // Mostrar botón para guardar
          });
        });
      } else {
        showMessage("No se encontraron clientes con ese nombre", "error");
        const noResultadosItem = document.createElement("li");
        noResultadosItem.classList.add("list-group-item");
        noResultadosItem.textContent = "No se encontraron clientes.";
        resultadosElement.appendChild(noResultadosItem);
      }
    } catch (error) {
      console.error("Error buscando clientes:", error);
      showMessage("Error buscando clientes", "error");
    }
  } else {
    showMessage("Usuario no autenticado", "error");
  }
}

// Evento para el botón que guarda información del cliente en el formulario
function guardarCliente() {
  if (clienteSeleccionado) {
    // Guardar información del cliente en el formulario principal
    document.getElementById("nombreCliente").value = clienteSeleccionado.nombre;
    document.getElementById("tipoAsociado").value =
      clienteSeleccionado.tipo === "Cliente" ? "tipoAsociadoCliente" : "tipoAsociadoProveedor";
    document.getElementById("direccionCliente").value = clienteSeleccionado.direccion;
    document.getElementById("telefonoCliente").value = clienteSeleccionado.telefono;

    showMessage("Información del cliente guardada", "success");
    setTimeout(() => {
      $('#modalCliente').modal('hide');
    }, 1000);
  } else {
    showMessage("No hay cliente seleccionado", "error");
  }
}


document.addEventListener("DOMContentLoaded", function () {
  const botonGuardarCliente = document.getElementById("botonGuardarCliente");

  if (botonGuardarCliente) {
    botonGuardarCliente.addEventListener("click", guardarCliente); // Guardar al hacer clic
  }

  const botonBuscar = document.getElementById("botonBuscarCliente");

  if (botonBuscar) {
    botonBuscar.addEventListener("click", buscarClientes); // Ejecutar la búsqueda al hacer clic
  }
});


document.addEventListener("DOMContentLoaded", function () {
  const mostrarPerfiles = document.getElementById("mostrarPerfiles");

  // Registrar evento para cargar el perfil al hacer clic
  if (mostrarPerfiles) {
    mostrarPerfiles.addEventListener("click", cargarPerfil);
    console.log("Evento registrado para 'Mostrar Perfiles'");
  } else {
    console.error("Botón 'Mostrar Perfiles' no encontrado");
  }

  // Registrar eventos para cambiar visibilidad según el tipo de perfil
  const radioEmpresa = document.getElementById("perfilEmpresa");
  const radioIndividual = document.getElementById("perfilIndividual");

  if (radioEmpresa) {
    radioEmpresa.addEventListener("change", togglePerfilVisibility);
  }

  if (radioIndividual) {
    radioIndividual.addEventListener("change", togglePerfilVisibility);
  }

  // Evento para el botón que inicia la búsqueda
  const botonBuscar = document.getElementById("botonBuscarCliente");

  if (botonBuscar) {
    botonBuscar.addEventListener("click", buscarClientes); // Ejecutar la búsqueda al hacer clic
  }

  // Asegurar visibilidad correcta al cargar la página
  togglePerfilVisibility();
});
