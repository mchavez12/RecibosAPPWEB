export function showMessage (message, type = "success") {
    Toastify({
        text: message,
        duration: 3000,
        destination: "https://github.com/apvarun/toastify-js",
        newWindow: true,
        close: true,
        gravity: "bottom", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            color: "black",
            background: type === 'success' ? "linear-gradient(90deg, rgba(170,227,161,1) 0%, rgba(125,196,116,1) 25%, rgba(124,191,113,1) 100%)" : "red"
        },
        onClick: function(){} // Callback after click
      }).showToast();
}
