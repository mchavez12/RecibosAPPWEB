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

let clienteSeleccionado = null;

async function cargarPerfil() {
  try {
    const user = auth.currentUser;

    if (user) {
      console.log("Usuario autenticado:", user.uid);

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
  if (!(await validarCampos())) {
    return; 
  }
  const pdf = new jsPDF();

  const tituloRecibo = document.getElementById("tituloRecibo").value || "(Recibo / Nota de entrega)";
  const nombreCliente = document.getElementById("nombreCliente").value || "(No se proporcionó)";
  const direccionCliente = document.getElementById("direccionCliente").value || "(No se proporcionó)";
  const telefonoCliente = document.getElementById("telefonoCliente").value || "(No se proporcionó)";
  const fechaRecibo = document.getElementById("fechaRecibo").value || "(No se proporcionó)";
  const conceptoRecibo = document.getElementById("conceptoRecibo").value || "(No se proporcionó)";
  const cantidadRecibo = document.getElementById("cantidadRecibo").value || "(No se proporcionó)";
  const selectMoneda = document.getElementById("selectMoneda").value || "(No se proporcionó)";
  const tipoAsociado = document.getElementById("tipoAsociado").value || "(No se proporcionó)";
  const firmaURL = getSignatureImage();

  let datosEmisor = {};
  let textoRecibo = "";
  let tituloDocumento = "";

  if (document.getElementById("perfilEmpresa").checked) {
    datosEmisor = {
      tipoPerfil: "empresa",
      nombre: document.getElementById("nombreEmpresa").value || "(No se proporcionó)",
      direccion: document.getElementById("direccionEmpresa").value || "(No se proporcionó)",
      telefono: document.getElementById("telefonoEmpresa").value || "(No se proporcionó)",
      codigoEmpresa: document.getElementById("codigoEmpresa").value || "(No se proporcionó)",
    };
    const logoFile = document.getElementById("logoEmpresa").files[0];
    if (logoFile) {
      const logoBase64 = await fileToBase64(logoFile);
      const imgProps = pdf.getImageProperties(logoBase64);
      const imgWidth = 30;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      pdf.addImage(logoBase64, 'JPEG', 10, 10, imgWidth, imgHeight);
    }
  } else if (document.getElementById("perfilIndividual").checked) {
    datosEmisor = {
      tipoPerfil: "individual",
      nombre: document.getElementById("nombreIndividual").value || "(No se proporcionó)",
      direccion: document.getElementById("direccionIndividual").value || "(No se proporcionó)",
      telefono: document.getElementById("telefonoIndividual").value || "(No se proporcionó)",
    };
  }

  if (tipoAsociado === "tipoAsociadoCliente") {
    tituloDocumento = `${tituloRecibo} (Recibo) `;
    textoRecibo = `Recibí de ${nombreCliente}, la suma de: ${cantidadRecibo} ${selectMoneda}. Por concepto de: ${conceptoRecibo}.`;
  } else if (tipoAsociado === "tipoAsociadoProveedor") {
    tituloDocumento = `${tituloRecibo} (Nota de entrega) `;
    textoRecibo = `Entregué a ${nombreCliente}, la suma de: ${cantidadRecibo} ${selectMoneda}. Por concepto de: ${conceptoRecibo}.`;
  }

  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(18);
  const textWidth = pdf.getTextWidth(tituloDocumento);
  pdf.text(tituloDocumento, (pageWidth - textWidth) / 2, 50);

  pdf.setFontSize(12);
  pdf.text(`Fecha: ${fechaRecibo}`, pageWidth - pdf.getTextWidth(`Fecha: ${fechaRecibo}`) - 10, 65);

  const parrafoRecibo = `
  Emitido por:
  Nombre: ${datosEmisor.nombre}
  Dirección: ${datosEmisor.direccion}
  Teléfono: ${datosEmisor.telefono}
  ${datosEmisor.tipoPerfil === "empresa" ? `Código Empresa: ${datosEmisor.codigoEmpresa}` : ""}
  
  ${textoRecibo}

  Dirección del ${tipoAsociado === "tipoAsociadoCliente" ? "cliente" : "proveedor"}: ${direccionCliente}
  Teléfono del ${tipoAsociado === "tipoAsociadoCliente" ? "cliente" : "proveedor"}: ${telefonoCliente}
  `;

  // Dividir el párrafo en líneas que quepan dentro del ancho de la página
  const lineasParrafo = pdf.splitTextToSize(parrafoRecibo, pageWidth - 20);

  // Agregar las líneas del párrafo al PDF
  pdf.text(lineasParrafo, 10, 80);

  if (firmaURL) {
    const imgProps = pdf.getImageProperties(firmaURL);
    const imgWidth = 80;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    pdf.addImage(firmaURL, 'JPEG', (pageWidth - imgWidth) / 2, 160, imgWidth, imgHeight);
  }

  const pdfBlob = pdf.output('blob');
  await guardarReciboPDFEnFirestore(pdfBlob);
}


async function validarCampos() {
  const tituloRecibo = document.getElementById("tituloRecibo").value;
  const nombreCliente = document.getElementById("nombreCliente").value;
  const tipoAsociado = document.getElementById("tipoAsociado").value;
  const fechaRecibo = document.getElementById("fechaRecibo").value;
  const cantidadRecibo = document.getElementById("cantidadRecibo").value;
  const selectMoneda = document.getElementById("selectMoneda").value;

  let nombreEmisor;
  let camposFaltantes = [];

  if (document.getElementById("perfilEmpresa").checked) {
    nombreEmisor = document.getElementById("nombreEmpresa").value;
  } else if (document.getElementById("perfilIndividual").checked) {
    nombreEmisor = document.getElementById("nombreIndividual").value;
  }

  if (!tituloRecibo) camposFaltantes.push("Título del recibo");
  if (!nombreCliente) camposFaltantes.push("Nombre del cliente");
  if (!tipoAsociado) camposFaltantes.push("Tipo de asociado");
  if (!fechaRecibo) camposFaltantes.push("Fecha del recibo");
  if (!cantidadRecibo) camposFaltantes.push("Cantidad");
  if (!selectMoneda) camposFaltantes.push("Moneda");
  if (!nombreEmisor) camposFaltantes.push("Nombre del emisor");

  if (camposFaltantes.length > 0) {
    showMessage(`Por favor complete los siguientes campos: ${camposFaltantes.join(", ")}`, "warning");
    return false;
  }

  return true;
}



// Función para guardar el PDF en Firebase Storage y almacenar la URL en Firestore
async function guardarReciboPDFEnFirestore(pdfBlob) {
  try {
    const user = auth.currentUser;
    if (user) {
      // Crear una referencia a Firebase Storage
      const storagePath = `Usuarios/${user.uid}/Recibos/${Date.now()}.pdf`;
      const storageRef = ref(storage, storagePath);

      // Subir el PDF a Firebase Storage con seguimiento del progreso
      const uploadTask = uploadBytesResumable(storageRef, pdfBlob);

      uploadTask.on('state_changed', 
        (snapshot) => {
          // Obtener el progreso de la subida
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
          showMessage(`Carga en progreso: ${progress.toFixed(2)}%`, "warning");
        }, 
        (error) => {
          console.error("Error al subir el archivo:", error);
          showMessage("Error al subir el archivo", "error");
        }, 
        async () => {
          // Obtener la URL de descarga del PDF
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

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
            tipoAsociado: document.getElementById("tipoAsociado").value,
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
          reproducirEfectoSonido();

          confetti({
            particleCount: 300,
            spread: 150,
            origin: { y: 0.8 }
          });
          vaciarCamposFormulario();
        }
      );
    } else {
      console.error("Usuario no autenticado");
      showMessage("Usuario no autenticado", "error");
    }
  } catch (error) {
    console.error("Error al guardar el recibo:", error);
    showMessage("Error al guardar el recibo", "error");
  }
}

function reproducirEfectoSonido() {
  const audio = new Audio('../../../resources/EfectoSonidoKid.mp3'); 
  audio.play();
}

// Función para vaciar los campos del formulario
function vaciarCamposFormulario() {
  setTimeout(() => {
    document.getElementById("tituloRecibo").value = "";
    document.getElementById("nombreCliente").value = "";
    document.getElementById("direccionCliente").value = "";
    document.getElementById("telefonoCliente").value = "";
    document.getElementById("fechaRecibo").value = "";
    document.getElementById("conceptoRecibo").value = "";
    document.getElementById("cantidadRecibo").value = "";
    document.getElementById("selectMoneda").value = "";
    document.getElementById("tipoAsociado").value = "";
    document.getElementById("nombreIndividual").value = "";
    document.getElementById("direccionIndividual").value = "";
    document.getElementById("telefonoIndividual").value = "";
    document.getElementById("nombreEmpresa").value = "";
    document.getElementById("direccionEmpresa").value = "";
    document.getElementById("telefonoEmpresa").value = "";
    document.getElementById("codigoEmpresa").value = "";
    document.getElementById("logoEmpresa").value = "";
    document.getElementById("logoEmpresaPreview").value = "";
    clearCanvas();
    // Recargar la página después de dos segundos
    setTimeout(() => {
      window.scrollTo(0, 0); // Desplazarse al principio de la página
      window.location.reload();
    }, 2000);
  }, 2000);
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