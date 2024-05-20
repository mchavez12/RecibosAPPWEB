import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteField,
  collection,
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

// Evento que se dispara cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", async function () {
  try {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("Usuario autenticado:", user.uid);
        showMessage("Usuario autenticado", "success");

        const storagePath = `Usuarios/${user.uid}/logoPerfil/logo_empresa.jpg`;
        const storage = getStorage();
        const storageRef = ref(storage, storagePath);

        const logoPreview = document.getElementById("logoEmpresaPreview");
        const btnBorrarImagen = document.getElementById("borrarImagen");

        // Obtener y mostrar el logotipo desde Firebase Storage
        try {
          const downloadURL = await getDownloadURL(storageRef);
          logoPreview.src = downloadURL;
          logoPreview.style.display = "block"; // Asegúrate de que esté visible
          console.log("Logotipo cargado desde:", downloadURL);

          if (btnBorrarImagen) {
            btnBorrarImagen.style.display = "inline-block"; // Hacer visible el botón para borrar la imagen
          }

        } catch (error) {
          console.error("Error al cargar la imagen desde Storage:", error);
          showMessage("No se encontró el logotipo de perfil", "info");
          logoPreview.style.display = "none"; // Oculta la vista previa si no hay logotipo

          if (btnBorrarImagen) {
            btnBorrarImagen.style.display = "none"; // Mantener el botón oculto si no hay imagen
          }
        }

        const userDocRef = doc(db, "Usuarios", user.uid);
        const perfilCollectionRef = collection(userDocRef, "Perfil");
        const perfilDocRef = doc(perfilCollectionRef, "perfil_usuario");

        const userDocSnap = await getDoc(userDocRef);
        const perfilDocSnap = await getDoc(perfilDocRef);

        const radioEmpresa = document.getElementById("perfilEmpresa");
        const radioIndividual = document.getElementById("perfilIndividual");
        const datosEmpresa = document.getElementById("datosEmpresa");
        const datosIndividual = document.getElementById("datosIndividual");

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const nombreUsuarioDisplay = document.getElementById("nombreUsuarioDisplay");

          if (userData.NombreUsuario) {
            nombreUsuarioDisplay.textContent = userData.NombreUsuario;
          } else {
            console.error("Campo 'NombreUsuario' no encontrado");
            showMessage("Campo 'NombreUsuario' no encontrado", "error");
          }
        } else {
          console.error("Documento del usuario no encontrado");
          showMessage("Documento del usuario no encontrado", "error");
        }

        if (perfilDocSnap.exists()) {
          console.log("Documento del perfil encontrado");
          showMessage("Perfil cargado correctamente", "success");

          const perfilData = perfilDocSnap.data();

          if (perfilData.tipo === "empresa") {
            radioEmpresa.checked = true;
            datosEmpresa.style.display = "block";
            datosIndividual.style.display = "none";

            document.getElementById("nombreEmpresa").value = perfilData.nombreEmpresa || "";
            document.getElementById("direccionEmpresa").value = perfilData.direccionEmpresa || "";
            document.getElementById("telefonoEmpresa").value = perfilData.telefonoEmpresa || "";
            document.getElementById("codigoEmpresa").value = perfilData.codigoEmpresa || "";
          } else if (perfilData.tipo === "individual") {
            radioIndividual.checked = true;
            datosEmpresa.style.display = "none";
            datosIndividual.style.display = "block";

            document.getElementById("nombreIndividual").value = perfilData.nombre || "";
            document.getElementById("direccionIndividual").value = perfilData.direccion || "";
            document.getElementById("telefonoIndividual").value = perfilData.telefono || "";
          }
        } else {
          console.error("Documento del perfil no encontrado");
          showMessage("Documento del perfil no encontrado", "info");
        }

        // Asignar eventos y otros elementos
        const form = document.querySelector("form");
        form.addEventListener("submit", async (event) => {
          event.preventDefault();

          const perfilData = {};

          if (document.getElementById("perfilEmpresa").checked) {
            perfilData.tipo = "empresa";
            perfilData.nombreEmpresa = document.getElementById("nombreEmpresa").value;
          } else {
            perfilData.tipo = "individual";
            perfilData.nombre = document.getElementById("nombreIndividual").value;
          }

          try {
            await setDoc(perfilDocRef, perfilData, { merge: true });
            showMessage("Perfil guardado con éxito", "success");
          } catch (error) {
            console.error("Error al guardar el perfil:", error);
            showMessage("Error al guardar el perfil", "error");
          }
        });

        const inputFile = document.getElementById("logoEmpresa");
        const btnVisualizar = document.getElementById("visualizarImagen");
        const btnBorrar = document.getElementById("borrarImagen");

        inputFile.addEventListener("change", () => {
          guardarArchivo(inputFile);
        });

        btnVisualizar.addEventListener("click", mostrarImagen);
        btnBorrar.addEventListener("click", borrarImagen);

      } else {
        console.error("Usuario no autenticado");
        showMessage("Usuario no autenticado", "error");
      }
    });

    // Eventos para mostrar/ocultar campos
    const radioEmpresa = document.getElementById("perfilEmpresa");
    const radioIndividual = document.getElementById("perfilIndividual");

    radioEmpresa.addEventListener("change", function () {
      if (radioEmpresa.checked) {
        datosEmpresa.style.display = "block";
        datosIndividual.style.display = "none";
        console.log("Perfil de empresa seleccionado");
      }
    });

    radioIndividual.addEventListener("change", function () {
      if (radioIndividual.checked) {
        datosEmpresa.style.display = "none";
        datosIndividual.style.display = "block";
      }
    });

  } catch (error) {
    console.error("Error general:", error);
    showMessage("Error general al procesar la información", "error");
  }
});



export async function guardarArchivo(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const storage = getStorage();
    const user = auth.currentUser;

    if (user) {
      // Nombre fijo para el archivo del logo del usuario
      const fileName = "logo_empresa.jpg"; // Puedes cambiar la extensión según sea necesario
      const storagePath = `Usuarios/${user.uid}/logoPerfil/${fileName}`; // Ruta donde se guardará la imagen

      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Progreso de carga: ${progress}%`);
        },
        (error) => {
          console.error("Error al subir el archivo:", error);
          showMessage("Error al subir el archivo", "error");
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            const logoPreview = document.getElementById("logoEmpresaPreview");
            logoPreview.src = downloadURL;
            logoPreview.style.display = "block";

            showMessage("Archivo cargado con éxito", "success");

            // Guardar la URL en Firestore para futura referencia
            const userDocRef = doc(db, "Usuarios", user.uid);
            await setDoc(userDocRef, { logoURL: downloadURL }, { merge: true });
          } catch (error) {
            console.error("Error al obtener la URL de descarga:", error);
            showMessage("Error al obtener la URL de descarga", "error");
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

export async function borrarImagen() {
  const storage = getStorage();
  const user = auth.currentUser;

  if (user) {
    const storagePath = `Usuarios/${user.uid}/logos/logo_empresa.jpg`; // Ruta del archivo a eliminar
    const storageRef = ref(storage, storagePath);

    try {
      await deleteObject(storageRef); // Eliminar el archivo en Storage
      console.log("Imagen eliminada con éxito");

      // Actualizar Firestore para eliminar el campo `logoURL`
      const userDocRef = doc(db, "Usuarios", user.uid);
      await updateDoc(userDocRef, { logoURL: deleteField() });

      showMessage("Imagen eliminada con éxito", "success");

      // Quitar la vista previa
      const logoPreview = document.getElementById("logoEmpresaPreview");
      logoPreview.src = "";
      logoPreview.style.display = "none"; // Ocultar la imagen
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
      showMessage("Error al eliminar la imagen", "error");
    }
  } else {
    console.error("Usuario no autenticado");
    showMessage("Usuario no autenticado", "error");
  }
}

export function mostrarImagen() {
  const fileInput = document.getElementById("logoEmpresa");
  if (fileInput.files && fileInput.files[0]) {
    guardarArchivo(fileInput);
  } else {
    console.error("No se ha seleccionado ningún archivo");
    showMessage("No se ha seleccionado ningún archivo", "warning");
  }
}
