import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js"
import { auth } from './firebase.js' 
import { showMessage  } from './showMessage.js'

const signInForm = document.querySelector('#inicioSesion-form');

signInForm.addEventListener('submit', async e => {
    e.preventDefault()

    const email = signInForm['login-email'].value;
    const contraseña = signInForm['login-contraseña'].value;

    try {
        const credentials = await signInWithEmailAndPassword(auth, email, contraseña)
        console.log(credentials)

        const modal = bootstrap.Modal.getInstance(document.querySelector('#inicioSesionModal'))
        modal.hide()

        showMessage('Bienvenido! ' + credentials.user.email)

        window.location.href = 'views/panelPrincipal.html';


    } catch (error) {
        if (error.code === "auth/wrong-password") {
            showMessage('Contraseña incorrecta', 'error');
        } else if (error.code === "auth/user-not-found") {
            showMessage('Usuario no encontrado', 'error');
        } else {
            showMessage('Error de inicio de sesión. Por favor, inténtalo de nuevo más tarde.', 'error');
        }
    }
    
})