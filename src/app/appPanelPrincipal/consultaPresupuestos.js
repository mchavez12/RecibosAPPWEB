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
  mostrarPresupuestos();
});

async function mostrarPresupuestos() {
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
    const presupuestosCollectionRef = collection(userDocRef, "Presupuestos");
    const querySnapshot = await getDocs(presupuestosCollectionRef);

    if (querySnapshot.empty) {
      showMessage("No hay presupuestos para mostrar", "info");
    } else {
      const filteredDocs = querySnapshot.docs.filter((doc) => {
        const presupuesto = doc.data();
        return presupuesto.pdfURL && presupuesto.tituloPresupuesto;
      });

      if (filteredDocs.length === 0) {
        showMessage("Todos los presupuestos son inválidos", "error");
      } else {
        mostrarPresupuestosEnTabla(filteredDocs);
      }
    }
  } catch (error) {
    showMessage("Error al obtener datos de Firestore", "error");
    console.error("Error al obtener datos de Firestore:", error);
  }
}

async function mostrarPresupuestosEnTabla(docs) {
  const tableBody = document.getElementById("tablitaPresupuestos");
  tableBody.innerHTML = "";

  docs.forEach((doc, index) => {
    const presupuesto = doc.data();
    const whatsappURL = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Mira este presupuesto: ${presupuesto.tituloPresupuesto} ${presupuesto.pdfURL}`)}`;
    const telegramURL = `https://t.me/share/url?url=${encodeURIComponent(presupuesto.pdfURL)}&text=${encodeURIComponent(`Mira este presupuesto: ${presupuesto.tituloPresupuesto}`)}`;
    const twitterURL = `https://twitter.com/intent/tweet?url=${encodeURIComponent(presupuesto.pdfURL)}&text=${encodeURIComponent(`Mira este presupuesto: ${presupuesto.tituloPresupuesto}`)}`;
    const facebookURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(presupuesto.pdfURL)}`;
    const deleteModalId = `deletePresupuestoModal${index}`;

    const row = `
      <tr>
        <td>
          <a href="${whatsappURL}" target="_blank" class="btn btn-success mb-2"><i class="bi bi-whatsapp"></i> WhatsApp</a>
          <a href="${telegramURL}" target="_blank" class="btn btn-info mb-2"><i class="bi bi-telegram"></i> Telegram</a>
          <a href="${twitterURL}" target="_blank" class="btn btn-primary mb-2" style="background-color: black;"><i class="bi bi-twitter-x"></i> Twitter</a>
          <a href="${facebookURL}" target="_blank" class="btn btn-primary mb-2"><i class="bi bi-facebook"></i> Facebook</a>
        </td>
        <td>
          <button class="btn btn-danger" style="background-color: red;" onclick="viewPDF('${presupuesto.pdfURL}')">${presupuesto.tituloPresupuesto} <i class="bi bi-file-pdf"></i></button>
        </td>
        <td>
          <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#${deleteModalId}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;

    tableBody.innerHTML += row;

    const deletePresupuestoModal = document.createElement("div");
    deletePresupuestoModal.classList.add("modal", "fade");
    deletePresupuestoModal.id = deleteModalId;
    deletePresupuestoModal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Eliminar Presupuesto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de que quieres eliminar el presupuesto "${presupuesto.tituloPresupuesto}"?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" onclick="eliminarPresupuesto(${index}, '${presupuesto.pdfURL}')">Eliminar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(deletePresupuestoModal);
  });

  console.log("Tabla de presupuestos mostrada correctamente");
}

async function eliminarPresupuesto(index, pdfURL) {
  try {
    const currentUser = auth.currentUser;

    if (currentUser) {
      const userId = currentUser.uid;
      if (!userId) {
        showMessage("ID de usuario no encontrado", "error");
        return;
      }

      const userDocRef = doc(db, "Usuarios", userId);
      const presupuestosCollectionRef = collection(userDocRef, "Presupuestos");

      const querySnapshot = await getDocs(presupuestosCollectionRef);
      const presupuestoDocId = querySnapshot.docs[index].id;
      const presupuestoDocRef = doc(presupuestosCollectionRef, presupuestoDocId);

      // Eliminar
      await deleteDoc(presupuestoDocRef);

      const storage = getStorage();
      const storageRef = ref(storage, pdfURL.replace(/^[^\/]+\/[^\/]+\/[^\/]+\//, ''));
      await deleteObject(storageRef);

      showMessage("Presupuesto eliminado correctamente", "success");
      const modalId = `deletePresupuestoModal${index}`;
      const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
      modal.hide();

      setTimeout(function () {
        location.reload();
      }, 2000);

    } else {
      showMessage("Usuario no autenticado", "error");
    }
  } catch (error) {
    showMessage("Error al eliminar presupuesto", "error");
    console.error("Error al eliminar presupuesto:", error);
  }
}

window.eliminarPresupuesto = eliminarPresupuesto;

window.viewPDF = function (url) {
  window.open(url, '_blank');
};
