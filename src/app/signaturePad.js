// signaturePad.js

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('signatureCanvas');

  var signaturePad = new SignaturePad(canvas);

  var clearButton = document.getElementById('clearButton');

  clearButton.addEventListener('click', function () {
      signaturePad.clear();
  });
});
