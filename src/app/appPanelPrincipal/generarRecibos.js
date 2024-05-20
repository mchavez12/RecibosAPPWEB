import {
  doc,
  addDoc,
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
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
const storage = getStorage();
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
  } else {
    showMessage("No hay cliente seleccionado", "error");
  }
}

const { jsPDF } = window.jspdf;
const signatureCanvas = document.getElementById("signatureCanvas");
const clearButton = document.getElementById("clearButton");
// Evento para borrar la firma
clearButton.addEventListener("click", function() {
  clearCanvas();
});

function clearCanvas() {
  const context = signatureCanvas.getContext("2d");
  context.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

// Función para obtener la imagen de la firma como una URL de datos
function getSignatureImage() {
  return signatureCanvas.toDataURL();
}

// Función para convertir un archivo a base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Función para generar el PDF y convertirlo a Blob
async function generarPDF() {
  const pdf = new jsPDF();

  const tituloRecibo = document.getElementById("tituloRecibo").value;
  const nombreCliente = document.getElementById("nombreCliente").value;
  const direccionCliente = document.getElementById("direccionCliente").value;
  const telefonoCliente = document.getElementById("telefonoCliente").value;
  const fechaRecibo = document.getElementById("fechaRecibo").value;
  const conceptoRecibo = document.getElementById("conceptoRecibo").value;
  const cantidadRecibo = document.getElementById("cantidadRecibo").value;
  const selectMoneda = document.getElementById("selectMoneda").value;
  const firmaURL = getSignatureImage();

  let datosEmisor = {};

  if (document.getElementById("perfilEmpresa").checked) {
    datosEmisor = {
      tipoPerfil: "empresa",
      nombre: document.getElementById("nombreEmpresa").value,
      direccion: document.getElementById("direccionEmpresa").value,
      telefono: document.getElementById("telefonoEmpresa").value,
      codigoEmpresa: document.getElementById("codigoEmpresa").value,
    };

    // Cargar la imagen del logo de la empresa
    const logoFile = document.getElementById("logoEmpresa").files[0];
    if (logoFile) {
      const logoBase64 = await fileToBase64(logoFile);
      const imgProps = pdf.getImageProperties(logoBase64);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth / 4; // Ajusta el tamaño de la imagen si es necesario
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      pdf.addImage(logoBase64, 'JPEG', 10, 10, imgWidth, imgHeight);
    }
  } else if (document.getElementById("perfilIndividual").checked) {
    datosEmisor = {
      tipoPerfil: "individual",
      nombre: document.getElementById("nombreIndividual").value,
      direccion: document.getElementById("direccionIndividual").value,
      telefono: document.getElementById("telefonoIndividual").value,
    };
  }

  // Agregar contenido al PDF
  pdf.setFontSize(18);
  pdf.text("Recibo", 10, 30);
  pdf.setFontSize(12);
  pdf.text(`Título: ${tituloRecibo}`, 10, 40);
  pdf.text(`Fecha: ${fechaRecibo}`, 10, 50);
  pdf.text(`Cliente: ${nombreCliente}`, 10, 60);
  pdf.text(`Dirección: ${direccionCliente}`, 10, 70);
  pdf.text(`Teléfono: ${telefonoCliente}`, 10, 80);
  pdf.text(`Concepto: ${conceptoRecibo}`, 10, 90);
  pdf.text(`Cantidad: ${cantidadRecibo} ${selectMoneda}`, 10, 100);

  pdf.text(`Emitido por:`, 10, 110);
  pdf.text(`Nombre: ${datosEmisor.nombre}`, 10, 120);
  pdf.text(`Dirección: ${datosEmisor.direccion}`, 10, 130);
  pdf.text(`Teléfono: ${datosEmisor.telefono}`, 10, 140);

  if (datosEmisor.tipoPerfil === "empresa") {
    pdf.text(`Código Empresa: ${datosEmisor.codigoEmpresa}`, 10, 150);
  }

  // Agregar firma al PDF
  if (firmaURL) {
    const imgProps = pdf.getImageProperties(firmaURL);
    const imgWidth = 50; // Ajusta el tamaño de la imagen de la firma si es necesario
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    pdf.addImage(firmaURL, 'JPEG', 10, 160, imgWidth, imgHeight);
  }

  // Generar el PDF como un Blob
  const pdfBlob = pdf.output('blob');

  // Guardar el PDF en Firebase Storage
  await guardarReciboPDFEnFirestore(pdfBlob);
}

// Función para guardar el PDF en Firebase Storage y almacenar la URL en Firestore
async function guardarReciboPDFEnFirestore(pdfBlob) {
  try {
    const user = auth.currentUser;
    if (user) {
      // Crear una referencia a Firebase Storage
      const storagePath = `Usuarios/${user.uid}/Recibos/${Date.now()}.pdf`;
      const storageRef = ref(storage, storagePath);

      // Subir el PDF a Firebase Storage
      const snapshot = await uploadBytes(storageRef, pdfBlob);

      // Obtener la URL de descarga del PDF
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Obtener una referencia al documento del usuario
      const userDocRef = doc(db, "Usuarios", user.uid);

      // Guardar la URL del PDF en Firestore
      const reciboData = {
        tituloRecibo: document.getElementById("tituloRecibo").value,
        nombreCliente: document.getElementById("nombreCliente").value,
        direccionCliente: document.getElementById("direccionCliente").value,
        telefonoCliente: document.getElementById("telefonoCliente").value,
        fechaRecibo: document.getElementById("fechaRecibo").value,
        conceptoRecibo: document.getElementById("conceptoRecibo").value,
        cantidadRecibo: document.getElementById("cantidadRecibo").value,
        selectMoneda: document.getElementById("selectMoneda").value,
        firmaURL: getSignatureImage(),
        pdfURL: downloadURL,
        datosEmisor: {
          nombre: document.getElementById("nombreIndividual").value || document.getElementById("nombreEmpresa").value,
          direccion: document.getElementById("direccionIndividual").value || document.getElementById("direccionEmpresa").value,
          telefono: document.getElementById("telefonoIndividual").value || document.getElementById("telefonoEmpresa").value,
        }
      };

      // Agregar un nuevo documento a la subcolección "Recibos"
      await addDoc(collection(userDocRef, "Recibos"), reciboData);

      showMessage("Recibo creado exitosamente", "success");
    } else {
      console.error("Usuario no autenticado");
      showMessage("Usuario no autenticado", "error");
    }
  } catch (error) {
    console.error("Error al guardar el recibo:", error);
    showMessage("Error al guardar el recibo", "error");
  }
}

// Evento para el botón "Crear Recibo" que llama a la función generarPDF al hacer clic
document.addEventListener("DOMContentLoaded", function () {
  const botonCrearRecibo = document.getElementById("btnCrearRecibo");

  if (botonCrearRecibo) {
    botonCrearRecibo.addEventListener("click", function (event) {
      event.preventDefault(); // Evita el envío del formulario
      generarPDF();
    });
  } else {
    console.error("Botón 'Crear Recibo' no encontrado");
  }
});



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

            showMessage("Imagen cargada con éxito", "success");

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