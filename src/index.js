// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup, signOut
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, serverTimestamp, doc,
  onSnapshot, getDoc, Firestore, query, orderBy, limit, deleteDoc, updateDoc
} from "firebase/firestore";
import { getFirebaseConfig } from "./firebase-config";

const firebaseAppConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseAppConfig);
const auth = getAuth();


window.onload = () => {
  //Seleccionamos elementos de la página
  let btnLogin = document.getElementById("btnLogin");
  let btnGoogle = document.getElementById("btnGoogle");
  let btnCerrar = document.getElementById("btnCerrar");
  let inputEmail = document.getElementById("email");
  let inputPassword = document.getElementById("password");
  let sectionLogin = document.getElementById("section_login");
  let sectionMain = document.getElementById("section_main");
  let btnCrearCita = document.getElementById("btnCrearCita");
  let btnEditarCita = document.getElementById("btnEditarCita");
  let inputNombre = document.getElementById("nombre");
  let inputApellido = document.getElementById("apellido");
  let inputTelefono = document.getElementById("telefono");
  let inputFecha = document.getElementById("fecha");
  let inputHora = document.getElementById("hora");
  let inputSintomas = document.getElementById("sintomas");

  //Asociamos eventos
  btnLogin.addEventListener("click", () => {
    let email = inputEmail.value;
    let password = inputPassword.value;
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 

        const user = userCredential.user;
        console.log(user);
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert(errorMessage);
      });
  })

  btnGoogle.addEventListener("click", () => {
    signIn();
  })

  btnCerrar.addEventListener("click", () => {
    signOut(auth);
  })

  btnCrearCita.addEventListener("click", () => {
    let cita = {
      nombre: inputNombre.value,
      apellido: inputApellido.value,
      telefono: inputTelefono.value,
      fecha: inputFecha.value,
      hora: inputHora.value,
      sintomas: inputSintomas.value
    };
    crearCita(cita);
  })

  btnEditarCita.addEventListener("click", () => {
    let cita = {
      nombre: inputNombre.value,
      apellido: inputApellido.value,
      telefono: inputTelefono.value,
      fecha: inputFecha.value,
      hora: inputHora.value,
      sintomas: inputSintomas.value
    };
    editarCita(btnEditarCita.id, cita);
    limpiarInputsCita();
    btnCrearCita.hidden = false;
    btnEditarCita.hidden = true;
  })

  onAuthStateChanged(auth, (user) => {
    if (user) {
      //Login
      sectionLogin.hidden = true;
      sectionMain.hidden = false;
      let username = user.displayName != null ? user.displayName : user.email;
      document.getElementById("username").innerText = username;

    } else {

      sectionLogin.hidden = false;
      sectionMain.hidden = true;
      //logout
    }
  });

  async function signIn() {
    // Sign in Firebase using popup auth and Google as the identity provider.
    var provider = new GoogleAuthProvider();
    await signInWithPopup(getAuth(), provider);
  }

  function limpiarInputsCita() {
    let inputs = document.querySelectorAll('#nueva-cita .form-control');
    inputs.forEach(input => input.value = '');
  }

  async function crearCita(cita) {
    cita.timeStamp = serverTimestamp();
    cita.user = getAuth().currentUser.email;
    try {
      await addDoc(collection(getFirestore(), 'citas'), cita);
      // Limpiar inputs
      limpiarInputsCita();
    } catch {
      console.log("Error guardando cita");
    }
  }

  function cargarCitas() {
    const citasQuery = query(collection(getFirestore(), 'citas'), orderBy('fecha', 'desc'), limit(12));

    // Start listening to the query
    onSnapshot(citasQuery, function (snapshot) {
      let citas = "";
      snapshot.forEach(doc => {
        let cita = doc.data();
        citas += `<p class='ver-cita' id='${doc.id}'>
                    <i class="fa-regular fa-calendar"></i>
                    <span class='ver-cita-fechaHora'>${cita.fecha} ${cita.hora}</span>
                    <span class='ver-cita-nombre'>${cita.nombre} ${cita.apellido}</span>
                    <i class="fa-solid fa-trash borrar-cita"></i>
                    <i class="fa-solid fa-pen editar-cita"></i>
                  </p>`;
      });
      document.getElementById("citas").innerHTML = citas;

      let btnsBorrar = document.getElementsByClassName("borrar-cita");
      for (let i = 0; i < btnsBorrar.length; i++) {
        const btnB = btnsBorrar[i];
        btnB.addEventListener("click", function (event) {
          borrarCita(btnB.parentElement.id);
        }, false);
      }

      let btnsEditar = document.getElementsByClassName("editar-cita");
      for (let i = 0; i < btnsEditar.length; i++) {
        const btnE = btnsEditar[i];
        btnE.addEventListener("click", function (event) {
          getCita(btnE.parentElement.id, (citaE) => {
            inputNombre.value = citaE.nombre;
            inputApellido.value = citaE.apellido;
            inputTelefono.value = citaE.telefono;
            inputFecha.value = citaE.fecha;
            inputHora.value = citaE.hora;
            inputSintomas.value = citaE.sintomas;

            btnCrearCita.hidden = true;
            btnEditarCita.hidden = false;
            btnEditarCita.id = btnE.parentElement.id;
          });
        }, false);
      }

    });
  }

  async function getCita(id, f) {
    const docRef = doc(getFirestore(), "citas", id);
    const docSnap = await getDoc(docRef);
    f(docSnap.data());
  }

  function borrarCita(id) {
    const docRef = doc(getFirestore(), "citas", id);

    deleteDoc(docRef)
      .catch(error => {
        console.log(error);
      })
  }

  function editarCita(id, cita) {
    const docRef = doc(getFirestore(), "citas", id);

    updateDoc(docRef, cita)
      .catch(error => {
        console.log(error);
      })

  }

  cargarCitas();

}

