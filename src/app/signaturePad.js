// signaturePad.js

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  // Obtiene una referencia al canvas
  var canvas = document.getElementById('signatureCanvas');

  // Inicializa Signature Pad en el canvas
  var signaturePad = new SignaturePad(canvas);

  // Obtiene una referencia al botón para borrar la firma
  var clearButton = document.getElementById('clearButton');

  // Agrega un evento de clic al botón para borrar la firma
  clearButton.addEventListener('click', function () {
      signaturePad.clear();
  });
});
