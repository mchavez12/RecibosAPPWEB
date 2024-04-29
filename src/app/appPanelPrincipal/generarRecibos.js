import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  deleteField,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "../firebase.js";
import {
  getStorage,
  ref,
  deleteObject,
  uploadBytesResumable,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
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

      // Genera la ruta de Firebase Storage para el logotipo del perfil
      const storagePath = `Usuarios/${user.uid}/logoPerfil/logo_empresa.jpg`;
      const storage = getStorage();
      const storageRef = ref(storage, storagePath);

      const logoPreview = document.getElementById("logoEmpresaPreview");
      const btnBorrarImagen = document.getElementById("borrarImagen"); // Obtiene el botón de borrar imagen

      if (!logoPreview) {
        console.error("Element 'logoEmpresaPreview' no encontrado.");
        showMessage("Error: 'logoEmpresaPreview' no está definido", "error");
        return;
      }

      try {
        // Obtiene la URL de descarga desde Firebase Storage
        const downloadURL = await getDownloadURL(storageRef);

        // Asigna la URL al elemento de vista previa para mostrar la imagen
        logoPreview.src = downloadURL;
        logoPreview.style.display = "block"; // Asegúrate de que esté visible
        console.log("Logotipo del perfil cargado desde:", downloadURL);

        if (btnBorrarImagen) {
          // Si el botón de borrar imagen existe, hazlo visible
          btnBorrarImagen.style.display = "inline-block"; // Cambia el estilo para mostrarlo
        }
        
      } catch (error) {
        console.error("No se encontró un logotipo de perfil para este usuario.");
        showMessage("No se encontró un logotipo de perfil", "info");
        logoPreview.style.display = "none"; // Oculta la vista previa si no hay logotipo
        if (btnBorrarImagen) {
          btnBorrarImagen.style.display = "none"; // Mantiene el botón oculto si no hay imagen
        }
      }

      // Resto del código para cargar datos del perfil...
      const userDocRef = doc(db, "Usuarios", user.uid);
      const perfilCollectionRef = collection(userDocRef, "Perfil");
      const perfilDocRef = doc(perfilCollectionRef, "perfil_usuario");
      const perfilDocSnap = await getDoc(perfilDocRef);

      if (perfilDocSnap.exists()) {
        const perfilData = perfilDocSnap.data();
        
        // Código para cargar datos según el tipo de perfil...
        if (perfilData.tipo === "empresa") {
          document.getElementById("perfilEmpresa").checked = true;
          togglePerfilVisibility();
          document.getElementById("nombreEmpresa").value = perfilData.nombreEmpresa || "";
          document.getElementById("direccionEmpresa").value = perfilData.direccionEmpresa || "";
          document.getElementById("telefonoEmpresa").value = perfilData.telefonoEmpresa || "";
          document.getElementById("codigoEmpresa").value = perfilData.codigoEmpresa || "";
        } else if (perfilData.tipo === "individual") {
          document.getElementById("perfilIndividual").checked = true;
          togglePerfilVisibility();
          document.getElementById("nombreIndividual").value = perfilData.nombre || "";
          document.getElementById("direccionIndividual").value = perfilData.direccion || "";
          document.getElementById("telefonoIndividual").value = perfilData.telefono || "";
        }

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



let clienteSeleccionado = null;

async function buscarClientes() {
  const campoBusqueda = document
    .getElementById("campoBusquedaCliente")
    .value.trim();
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
      clienteSeleccionado.tipo === "Cliente"
        ? "tipoAsociadoCliente"
        : "tipoAsociadoProveedor";
    document.getElementById("direccionCliente").value =
      clienteSeleccionado.direccion;
    document.getElementById("telefonoCliente").value =
      clienteSeleccionado.telefono;

    showMessage("Información del cliente guardada", "success");
    setTimeout(() => {
      $("#modalCliente").modal("hide");
    }, 1000);
  } else {
    showMessage("No hay cliente seleccionado", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const inputFile = document.getElementById("logoEmpresa");
  const btnBorrar = document.getElementById("borrarImagen");

  inputFile.addEventListener("change", () => {
    guardarArchivo(inputFile); // Carga la imagen al cambiar el archivo
  });

  if (btnBorrar) {
    btnBorrar.addEventListener("click", limpiarVistaPrevia); // Solo limpia la vista previa, no borra en Storage
  }});


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

// Función para guardar el archivo en Firebase Storage
export async function guardarArchivo(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const storage = getStorage();
    const user = auth.currentUser;

    if (user) {
      const fileName = "logo_recibo.jpg"; // Nombre del archivo
      const storagePath = `Usuarios/${user.uid}/logosRecibos/${fileName}`; // Ruta de almacenamiento
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Progreso de carga: ${progress}%`);
        },
        (error) => {
          console.error("Error al subir el archivo:", error); // Obtén más detalles del error
          showMessage("Error al subir el archivo: " + error.message, "error"); // Usa `error.message` para obtener información
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            const logoPreview = document.getElementById("logoEmpresaPreview");
            if (logoPreview) {
              logoPreview.src = downloadURL; // Muestra la imagen cargada
              logoPreview.style.display = "block"; // Asegúrate de que esté visible
            } else {
              console.error("Element 'logoEmpresaPreview' no encontrado.");
            }

            showMessage("Archivo cargado con éxito", "success");

          } catch (error) {
            console.error("Error al obtener la URL de descarga:", error);
            showMessage("Error al obtener la URL de descarga: " + error.message, "error");
          }
        }
      );
    } else {
      console.error("Usuario no autenticado");
      showMessage("Usuario no autenticado", "error");
    }
  } else {
    console.error("No se ha seleccionado ningún archivo");
    showMessage("No se ha seleccionado ningún archivo", "warning");
  }
}




// Función para borrar la imagen de Firebase Storage
export async function borrarImagen() {
  const storage = getStorage();
  const user = auth.currentUser;

  if (user) {
    const storagePath = `Usuarios/${user.uid}/logoPerfil/logo_empresa.jpg`; // Ruta de almacenamiento
    const storageRef = ref(storage, storagePath);

    try {
      await deleteObject(storageRef); // Borra el archivo en Storage
      console.log("Imagen eliminada con éxito");

      // Elimina la URL de Firestore
      const userDocRef = doc(db, "Usuarios", user.uid);
      await updateDoc(userDocRef, { logoURL: deleteField() });

      showMessage("Imagen eliminada con éxito", "success");

      // Oculta la vista previa
      const logoPreview = document.getElementById("logoEmpresaPreview");
      logoPreview.src = "";
      logoPreview.style.display = "none"; // Oculta la vista previa
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
      showMessage("Error al eliminar la imagen", "error");
    }
  } else {
    console.error("Usuario no autenticado");
    showMessage("Usuario no autenticado", "error");
  }
}

function limpiarVistaPrevia() {
  const logoPreview = document.getElementById("logoEmpresaPreview");
  const inputFile = document.getElementById("logoEmpresa");

  // Limpiar la vista previa y el campo de entrada de archivos
  logoPreview.src = "";
  logoPreview.style.display = "none"; // Ocultar la imagen
  inputFile.value = ""; // Restablecer el campo de archivo
}