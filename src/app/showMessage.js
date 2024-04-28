export function showMessage (message, type = "success") {
    const colors = {
      success: "linear-gradient(90deg, rgba(170,227,161,1) 0%, rgba(125,196,116,1) 25%, rgba(124,191,113,1) 100%)",
      error: "red",
      warning: "orange"
    };
  
    Toastify({
      text: message,
      duration: type === "warning" ? 5000 : 3000, // Duración más larga para advertencias
      destination: "https://github.com/apvarun/toastify-js",
      newWindow: true,
      close: true,
      gravity: "bottom",
      position: "center",
      stopOnFocus: true,
      style: {
        color: "black",
        background: colors[type] || colors.success
      },
      onClick: function(){} // Callback after click
    }).showToast();
  }
  