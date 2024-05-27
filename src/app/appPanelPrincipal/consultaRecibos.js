import {
  getDocs,
  collection,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { db, auth } from "../firebase.js";
import { showMessage } from "../showMessage.js";

document.addEventListener("DOMContentLoaded", function () {
  mostrarRecibos();
});

async function mostrarRecibos() {
  try {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        await mostrarDatosUsuario(user);
      } else {
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
    const recibosCollectionRef = collection(userDocRef, "Recibos");
    const querySnapshot = await getDocs(recibosCollectionRef);

    if (querySnapshot.empty) {
      showMessage("No hay recibos para mostrar", "info");
    } else {
      const filteredDocs = querySnapshot.docs.filter((doc) => {
        const recibo = doc.data();
        return recibo.pdfURL && recibo.tituloRecibo;
      });

      if (filteredDocs.length === 0) {
        showMessage("Todos los recibos son inválidos", "error");
      } else {
        mostrarRecibosEnTabla(filteredDocs);
      }
    }
  } catch (error) {
    showMessage("Error al obtener datos de Firestore", "error");
    console.error("Error al obtener datos de Firestore:", error);
  }
}

async function mostrarRecibosEnTabla(docs) {
  const tableBody = document.getElementById("tablitaRecibos");
  tableBody.innerHTML = "";

  docs.forEach((doc, index) => {
    const recibo = doc.data();
    const whatsappURL = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Mira este recibo: ${recibo.tituloRecibo} ${recibo.pdfURL}`)}`;
    const telegramURL = `https://t.me/share/url?url=${encodeURIComponent(recibo.pdfURL)}&text=${encodeURIComponent(`Mira este recibo: ${recibo.tituloRecibo}`)}`;
    const twitterURL = `https://twitter.com/intent/tweet?url=${encodeURIComponent(recibo.pdfURL)}&text=${encodeURIComponent(`Mira este recibo: ${recibo.tituloRecibo}`)}`;
    const facebookURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(recibo.pdfURL)}`;
    const deleteModalId = `deleteReciboModal${index}`;

    const row = `
      <tr>
        <td>
          <a href="${whatsappURL}" target="_blank" class="btn btn-success mb-2"><i class="bi bi-whatsapp"></i> WhatsApp</a>
          <a href="${telegramURL}" target="_blank" class="btn btn-info mb-2"><i class="bi bi-telegram"></i> Telegram</a>
          <a href="${twitterURL}" target="_blank" class="btn btn-primary mb-2" style="background-color: black;"><i class="bi bi-twitter-x"></i> Twitter</a>
          <a href="${facebookURL}" target="_blank" class="btn btn-primary mb-2"><i class="bi bi-facebook"></i> Facebook</a>
        </td>
        <td>
          <button class="btn btn-danger" style="background-color: red;" onclick="viewPDF('${recibo.pdfURL}')">${recibo.tituloRecibo} <i class="bi bi-file-pdf"></i></button>
        </td>
        <td>
          <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#${deleteModalId}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;

    tableBody.innerHTML += row;

    const deleteReciboModal = document.createElement("div");
    deleteReciboModal.classList.add("modal", "fade");
    deleteReciboModal.id = deleteModalId;
    deleteReciboModal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Eliminar Recibo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de que quieres eliminar el recibo "${recibo.tituloRecibo}"?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" onclick="eliminarRecibo(${index}, '${recibo.pdfURL}')">Eliminar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(deleteReciboModal);
  });

  console.log("Tabla de recibos mostrada correctamente");
}

async function eliminarRecibo(index, pdfURL) {
  try {
    const currentUser = auth.currentUser;

    if (currentUser) {
      const userId = currentUser.uid;
      if (!userId) {
        showMessage("ID de usuario no encontrado", "error");
        return;
      }

      const userDocRef = doc(db, "Usuarios", userId);
      const recibosCollectionRef = collection(userDocRef, "Recibos");

      const querySnapshot = await getDocs(recibosCollectionRef);
      const reciboDocId = querySnapshot.docs[index].id;
      const reciboDocRef = doc(recibosCollectionRef, reciboDocId);

      // Eliminar el documento de Firestore
      await deleteDoc(reciboDocRef);

      // Obtener la referencia del archivo en Firebase Storage usando la URL
      const storage = getStorage();
      const storageRef = ref(storage, pdfURL.replace(/^[^\/]+\/[^\/]+\/[^\/]+\//, ''));

      // Eliminar el archivo de Firebase Storage
      await deleteObject(storageRef);

      showMessage("Recibo eliminado correctamente", "success");
      const modalId = `deleteReciboModal${index}`;
      const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
      modal.hide();

      // Recarga la página después de 2 segundos
      setTimeout(function () {
        location.reload();
      }, 2000);

    } else {
      showMessage("Usuario no autenticado", "error");
    }
  } catch (error) {
    showMessage("Error al eliminar recibo", "error");
    console.error("Error al eliminar recibo:", error);
  }
}

// Hacer que la función eliminarRecibo esté disponible globalmente
window.eliminarRecibo = eliminarRecibo;

window.viewPDF = function (url) {
  window.open(url, '_blank');
};
