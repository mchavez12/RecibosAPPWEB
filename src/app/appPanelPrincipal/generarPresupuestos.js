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

  const tituloPresupuesto = document.getElementById("tituloPresupuesto").value || "(Presupuesto)";
  const nombreCliente = document.getElementById("nombreCliente").value || "(No se proporcionó)";
  const direccionCliente = document.getElementById("direccionCliente").value || "(No se proporcionó)";
  const telefonoCliente = document.getElementById("telefonoCliente").value || "(No se proporcionó)";
  const emailCliente = document.getElementById("emailCliente").value || "(No se proporcionó)";
  const fechaPresupuesto = document.getElementById("fechaPresupuesto").value || "(No se proporcionó)";
  const conceptoPresupuesto = document.getElementById("conceptoPresupuesto").value || "(No se proporcionó)";
  const selectMoneda = document.getElementById("selectMoneda").value || "(No se proporcionó)";
  const firmaURL = getSignatureImage();
  const tiempoEntrega = document.getElementById("tiempoEntrega").value || "(No se proporcionó)";
  const validez = document.getElementById("validez").value || "(No se proporcionó)";

  let datosEmisor = {};
  let tituloDocumento = `${tituloPresupuesto} (Presupuesto)`;

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

  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(18);
  const textWidth = pdf.getTextWidth(tituloDocumento);
  pdf.text(tituloDocumento, (pageWidth - textWidth) / 2, 20);

  pdf.setFontSize(12);
  pdf.text(`Fecha: ${fechaPresupuesto}`, pageWidth - pdf.getTextWidth(`Fecha: ${fechaPresupuesto}`) - 10, 30);

  const parrafoPresupuesto = `
    Emitido por:
    Nombre: ${datosEmisor.nombre}
    Dirección: ${datosEmisor.direccion}
    Teléfono: ${datosEmisor.telefono}
    ${datosEmisor.tipoPerfil === "empresa" ? `Código Empresa: ${datosEmisor.codigoEmpresa}` : ""}
      
    Cliente:
    Nombre: ${nombreCliente}
    Dirección: ${direccionCliente}
    Teléfono: ${telefonoCliente}
    Email: ${emailCliente}

    Concepto del presupuesto: ${conceptoPresupuesto}
    Tiempo de entrega: ${tiempoEntrega} días - Validez del presupuesto: ${validez} días
  `;

  const lineasParrafo = pdf.splitTextToSize(parrafoPresupuesto, pageWidth - 20);
  pdf.text(lineasParrafo, 10, 40);

  const listaProductos = document.getElementById("listaProductos");
  const productos = [];
  const items = listaProductos.querySelectorAll("tr");

  const headers = [["Producto/Servicio", "Cantidad", "Costo", "Total"]];
  const data = [];
  let costoTotal = 0;

  items.forEach(item => {
    const nombre = item.querySelector("td:nth-of-type(1)").textContent.trim();
    const cantidad = parseInt(item.querySelector("td:nth-of-type(2)").textContent.trim());
    const costo = parseFloat(item.querySelector("td:nth-of-type(3)").textContent.trim());
    const total = cantidad * costo;
    data.push([nombre, cantidad, costo.toFixed(2), total.toFixed(2)]);
    costoTotal += total;
  });

  data.push(["", "", "Costo Total:", `${costoTotal.toFixed(2)} ${selectMoneda}`]);

  let startY = 120; // Ajustamos el inicio de la tabla

  pdf.autoTable({
    head: headers,
    body: data,
    startY: startY,
    styles: { fontSize: 10, cellPadding: 3 },
    theme: 'grid',
  });

  const finalY = pdf.autoTable.previous.finalY || pdf.autoTableEndPosY();

  let firmaStartY = finalY + 10;

  if (firmaStartY + 40 > pdf.internal.pageSize.height) {
    pdf.addPage();
    firmaStartY = 10;
  }

  if (firmaURL) {
    const imgProps = pdf.getImageProperties(firmaURL);
    const imgWidth = 80;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    pdf.addImage(firmaURL, 'JPEG', (pageWidth - imgWidth) / 2, firmaStartY, imgWidth, imgHeight);
  }

  const pdfBlob = pdf.output('blob');
  await guardarPresupuestoPDFEnFirestore(pdfBlob);
}



async function validarCampos() {
  const tituloPresupuesto = document.getElementById("tituloPresupuesto").value;
  const nombreCliente = document.getElementById("nombreCliente").value;
  const fechaPresupuesto = document.getElementById("fechaPresupuesto").value;
  const selectMoneda = document.getElementById("selectMoneda").value;
  //const emailCliente = document.getElementById("emailCliente").value;

  let nombreEmisor;
  let camposFaltantes = [];

  if (document.getElementById("perfilEmpresa").checked) {
    nombreEmisor = document.getElementById("nombreEmpresa").value;
  } else if (document.getElementById("perfilIndividual").checked) {
    nombreEmisor = document.getElementById("nombreIndividual").value;
  }

  // Verificar el canvas de firma
  const canvasFirma = document.getElementById("signatureCanvas");
  if (!canvasFirma) {
    showMessage("No se pudo encontrar el canvas de firma", "error");
    return false;
  }
  const contextFirma = canvasFirma.getContext("2d");
  const firmaData = contextFirma.getImageData(0, 0, canvasFirma.width, canvasFirma.height);

  let firmaVacia = true;
  for (let i = 0; i < firmaData.data.length; i += 4) {
    if (firmaData.data[i + 3] !== 0) { // Verifica el canal alfa (transparencia)
      firmaVacia = false;
      break;
    }
  }

  if (!tituloPresupuesto) camposFaltantes.push("Título del presupuesto");
  if (!nombreCliente) camposFaltantes.push("Nombre del cliente");
  if (!fechaPresupuesto) camposFaltantes.push("Fecha del Presupuesto");
  if (!selectMoneda) camposFaltantes.push("Moneda");
  if (!nombreEmisor) camposFaltantes.push("Nombre del emisor");
  if (firmaVacia) camposFaltantes.push("Firma");

  if (camposFaltantes.length > 0) {
    showMessage(`Por favor complete los siguientes campos: ${camposFaltantes.join(", ")}`, "warning");
    return false;
  }

  return true;
}

document.addEventListener("DOMContentLoaded", function () {
  const botonAgregar = document.getElementById("agregarProducto");
  const listaProductos = document.getElementById("listaProductos");
  const productos = [];

  // Evento para agregar un producto o servicio a la lista
  botonAgregar.addEventListener("click", function () {
    const nombreProducto = document.getElementById("nombreProducto").value.trim();
    const cantidad = parseInt(document.getElementById("cantidad").value);
    const costo = parseFloat(document.getElementById("costo").value);

    // Validar que se ingresen valores en los campos
    if (!nombreProducto || isNaN(cantidad) || isNaN(costo)) {
      alert("Por favor completa todos los campos correctamente.");
      return;
    }

    // Agregar producto al arreglo
    productos.push({ nombre: nombreProducto, cantidad, costo });

    // Actualizar la tabla de productos
    actualizarTablaProductos();

    // Limpiar campos después de agregar el producto/servicio
    document.getElementById("nombreProducto").value = "";
    document.getElementById("cantidad").value = "";
    document.getElementById("costo").value = "";
  });

  function actualizarTablaProductos() {
    // Limpiar la tabla antes de actualizarla
    listaProductos.innerHTML = "";

    // Llenar la tabla con los productos
    productos.forEach((producto) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${producto.nombre}</td>
        <td>${producto.cantidad}</td>
        <td>${producto.costo.toFixed(2)}</td>
      `;
      listaProductos.appendChild(row);
    });
  }

});


// Guardar el PDF en Firebase Storage y almacenar su respectiva URL en Firestore
async function guardarPresupuestoPDFEnFirestore(pdfBlob) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("Usuario no autenticado");
      showMessage("Usuario no autenticado", "error");
      return;
    }

    // Obtener valores del formulario
    const tituloPresupuesto = document.getElementById("tituloPresupuesto").value;
    const nombreCliente = document.getElementById("nombreCliente").value;
    const direccionCliente = document.getElementById("direccionCliente").value;
    const telefonoCliente = document.getElementById("telefonoCliente").value;
    const emailCliente = document.getElementById("emailCliente").value;
    const fechaPresupuesto = document.getElementById("fechaPresupuesto").value;
    const conceptoPresupuesto = document.getElementById("conceptoPresupuesto").value;
    const selectMoneda = document.getElementById("selectMoneda").value;
    const firmaURL = getSignatureImage();
    const tiempoEntrega = document.getElementById("tiempoEntrega").value;
    const validez = document.getElementById("validez").value;

    // Obtener el tipo de perfil seleccionado por el usuario
    const tipoPerfilSeleccionado = document.querySelector('input[name="tipoPerfil"]:checked');
    if (!tipoPerfilSeleccionado) {
      console.error("Debe seleccionar un tipo de perfil");
      showMessage("Debe seleccionar un tipo de perfil", "error");
      return;
    }

    // Obtener valores del formulario según el tipo de perfil seleccionado
    let datosEmisor = {};
    if (tipoPerfilSeleccionado.value === "empresa") {
      datosEmisor = {
        nombre: document.getElementById("nombreEmpresa").value,
        direccion: document.getElementById("direccionEmpresa").value,
        telefono: document.getElementById("telefonoEmpresa").value,
        codigo: document.getElementById("codigoEmpresa").value
      };
    } else if (tipoPerfilSeleccionado.value === "individual") {
      datosEmisor = {
        nombre: document.getElementById("nombreIndividual").value,
        direccion: document.getElementById("direccionIndividual").value,
        telefono: document.getElementById("telefonoIndividual").value
      };
    }

    // Construir los datos del presupuesto
    const presupuestoData = {
      tituloPresupuesto,
      nombreCliente,
      direccionCliente,
      telefonoCliente,
      emailCliente,
      fechaPresupuesto,
      conceptoPresupuesto,
      selectMoneda,
      firmaURL,
      tiempoEntrega,
      validez,
      datosEmisor
    };

    // Obtener lista de productos/servicios
    const listaProductos = document.getElementById("listaProductos");
    const productos = [];
    const items = listaProductos.querySelectorAll("tr");

    items.forEach((item) => {
      try {
        const nombre = item.querySelector("td:nth-of-type(1)").textContent.trim();
        const cantidad = parseInt(item.querySelector("td:nth-of-type(2)").textContent.trim());
        const costo = parseFloat(item.querySelector("td:nth-of-type(3)").textContent.trim());

        // Log the extracted values
        console.log(`Producto - Nombre: ${nombre}, Cantidad: ${cantidad}, Costo: ${costo}`);

        if (!nombre || isNaN(cantidad) || isNaN(costo)) {
          throw new Error("Datos del producto no válidos");
        }

        productos.push({ nombre, cantidad, costo });
      } catch (error) {
        console.error("Error al procesar un producto:", error, item);
        showMessage("Error al procesar un producto. Por favor, revise los datos e intente nuevamente.", "error");
        return;
      }
    });

    // Verificar que se hayan procesado correctamente todos los productos
    if (productos.length !== items.length) {
      console.error("No se pudieron procesar todos los productos.");
      showMessage("No se pudieron procesar todos los productos. Por favor, revise los datos e intente nuevamente.", "error");
      return;
    }

    // Log the final list of products
    console.log("Productos procesados:", productos);

    presupuestoData.productos = productos;

    // Subir PDF a Cloud Storage
    const storagePath = `Usuarios/${user.uid}/Presupuestos/${Date.now()}.pdf`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, pdfBlob);

    // Esperar a que se complete la subida del PDF
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
        showMessage(`Carga en progreso: ${progress.toFixed(2)}%`, "warning");
      },
      async (error) => {
        console.error("Error al subir el archivo:", error);
        showMessage("Error al subir el archivo", "error");
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log("URL de descarga del PDF:", downloadURL);
        presupuestoData.pdfURL = downloadURL;

        // Guardar datos del presupuesto en Firestore
        const userDocRef = doc(db, "Usuarios", user.uid);
        await addDoc(collection(userDocRef, "Presupuestos"), presupuestoData);

        console.log("Subiendo: ", presupuestoData);

        showMessage("Presupuesto creado exitosamente", "success");
        reproducirEfectoSonido();

        confetti({
          particleCount: 300,
          spread: 150,
          origin: { y: 0.8 }
        });
        vaciarCamposFormulario();
      }
    );
  } catch (error) {
    console.error("Error al guardar el presupuesto:", error);
    showMessage("Error al guardar el presupuesto", "error");
  }
}



function reproducirEfectoSonido() {
  const audio = new Audio('../../../resources/EfectoSonidoKid.mp3'); 
  audio.play();
}

// Función para vaciar los campos del formulario
function vaciarCamposFormulario() {
  setTimeout(() => {
    document.getElementById("tituloPresupuesto").value = "";
    document.getElementById("nombreCliente").value = "";
    document.getElementById("direccionCliente").value = "";
    document.getElementById("telefonoCliente").value = "";
    document.getElementById("emailCliente").value = "";
    document.getElementById("fechaPresupuesto").value = "";
    document.getElementById("conceptoPresupuesto").value = "";
    document.getElementById("selectMoneda").value = "";
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


// Evento para el botón "Crear Presupuesto" que llama a la función generarPDF al hacer clic
document.addEventListener("DOMContentLoaded", function () {
  const botonCrearPresupuesto = document.getElementById("btnCrearPresupuesto");

  if (botonCrearPresupuesto) {
    botonCrearPresupuesto.addEventListener("click", function (event) {
      event.preventDefault(); // Evita el envío del formulario
      generarPDF();
    });
  } else {
    console.error("Botón 'Crear Presupuesto' no encontrado");
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
      const fileName = "logo_presupuesto.jpg"; // Nombre del archivo
      const storagePath = `Usuarios/${user.uid}/logosPresupuestos/${fileName}`; // Ruta de almacenamiento
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