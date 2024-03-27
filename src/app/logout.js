import {signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"

import { auth } from './firebase.js'

const logout = document.querySelector('#logout, #logoutPP')

logout.addEventListener('click' , async () => {
    await signOut(auth)
    console.log('Usuario cerró sesion')
    window.location.href = '../index.html'
})