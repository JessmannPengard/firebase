// Imports
import { initializeApp } from "firebase/app";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup, signOut
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, serverTimestamp, doc,
  onSnapshot, getDoc, Firestore, query, orderBy, limit, deleteDoc, updateDoc, where
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { getFirebaseConfig } from "./firebase-config";

// Firebase config
const firebaseAppConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseAppConfig);
const auth = getAuth();


window.onload = () => {
  // Get DOM elements
  let btnLogin = document.getElementById("btnLogin");
  let btnGoogle = document.getElementById("btnGoogle");
  let btnCerrar = document.getElementById("btnCerrar");
  let inputEmail = document.getElementById("email");
  let inputPassword = document.getElementById("password");
  let sectionLogin = document.getElementById("section_login");
  let sectionMain = document.getElementById("section_main");
  let btnCrearCita = document.getElementById("btnCrearCita");
  let btnEditarCita = document.getElementById("btnEditarCita");

  let btnCancelarEditarCita = document.getElementById("btnCancelarEditarCita");
  let inputNombre = document.getElementById("nombre");
  let inputApellido = document.getElementById("apellido");
  let inputTelefono = document.getElementById("telefono");
  let inputFecha = document.getElementById("fecha");
  let inputHora = document.getElementById("hora");
  let inputSintomas = document.getElementById("sintomas");
  let inputSearch = document.getElementById("inputSearch");

  // Events:

  // (button) Sign in with email/password
  btnLogin.addEventListener("click", () => {
    let email = inputEmail.value;
    let password = inputPassword.value;
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
      })
      .catch((error) => {
        // Error signing in
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(error.code + ": " + errorMessage);
      });
  })

  // (button) Sign in with Google
  btnGoogle.addEventListener("click", () => {
    signIn();
  })

  // (button) Sign out
  btnCerrar.addEventListener("click", () => {
    signOut(auth);
  })

  // (button) Create new date
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

  // (button) Edit date
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

  // (button) Cancel editing date
  btnCancelarEditarCita.addEventListener("click", () => {
    limpiarInputsCita();
    btnEditarCita.hidden = true;
    btnCancelarEditarCita.hidden = true;
    btnCrearCita.hidden = false;
  })

  // (input) Search
  inputSearch.addEventListener("input", () => {
    cargarCitas();
  })

  // Get auth changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Logged
      sectionLogin.hidden = true;
      sectionMain.hidden = false;
      let username = user.displayName != null ? user.displayName : user.email;
      document.getElementById("username").innerText = username;
      cargarCitas();
    } else {
      // Not logged
      sectionLogin.hidden = false;
      sectionMain.hidden = true;
    }
  });

  // Functions:

  // Sign in Firebase using popup auth and Google as the identity provider
  async function signIn() {
    var provider = new GoogleAuthProvider();
    await signInWithPopup(getAuth(), provider);
  }

  // Clear date inputs
  function limpiarInputsCita() {
    let inputs = document.querySelectorAll('#nueva-cita .form-control');
    inputs.forEach(input => input.value = '');
  }

  // Create new date
  async function crearCita(cita) {
    cita.timeStamp = serverTimestamp();
    cita.user = getAuth().currentUser.email;
    try {
      await addDoc(collection(getFirestore(), 'citas'), cita);
      limpiarInputsCita();
    } catch {
      console.log("Error guardando cita");
    }
  }

  // Get and show dates
  function cargarCitas() {
    const citasQuery = query(collection(getFirestore(), 'citas'), where("user", "==", getAuth().currentUser.email), orderBy('fecha', 'desc'), limit(12));

    // Start listening to the query
    onSnapshot(citasQuery, function (snapshot) {
      let citas = "";
      snapshot.forEach(doc => {
        let cita = doc.data();
        // Check for search input and filter if needed
        let texto = inputSearch.value;
        if (cita.nombre.toLowerCase().indexOf(texto.toLowerCase()) >= 0 || cita.apellido.toLowerCase().indexOf(texto.toLowerCase()) >= 0) {
          citas += `<p class='ver-cita' id='${doc.id}'>
                    <i class="fa-regular fa-calendar"></i>
                    <span class='ver-cita-fechaHora'>${cita.fecha} ${cita.hora}</span>
                    <span class='ver-cita-nombre'>${cita.nombre} ${cita.apellido}</span>
                    <i class="fa-solid fa-trash borrar-cita"></i>
                    <i class="fa-solid fa-pen editar-cita"></i>
                    <label>
                      <input class="inputFile d-none" type="file">
                      <i class="fa-solid fa-camera subir-imagen" (click)=""></i>
                    </label>`;
          if (cita.imageUrl != null) {
            if (cita.imageUrl.indexOf(".pdf") != -1) {
              citas += `<p><a href="${cita.imageUrl}" target="blank"><i class="fa-solid fa-file-pdf fa-3x"></i></a></p>`;
            } else {
              citas += `<p><a href="${cita.imageUrl}" target="blank"><img src="${cita.imageUrl}" class="miniatura"></img></a></p>`;
            }
          }
          citas += `</p>`;
        }
      });
      document.getElementById("citas").innerHTML = citas;

      // Add delete button to each document
      let btnsBorrar = document.getElementsByClassName("borrar-cita");
      for (let i = 0; i < btnsBorrar.length; i++) {
        const btnB = btnsBorrar[i];
        // Delete date logic
        btnB.addEventListener("click", function (event) {
          borrarCita(btnB.parentElement.id);
        }, false);
      }

      // Add edit button to each document
      let btnsEditar = document.getElementsByClassName("editar-cita");
      for (let i = 0; i < btnsEditar.length; i++) {
        const btnE = btnsEditar[i];
        // Edit date logic
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
            btnCancelarEditarCita.hidden = false;
            btnEditarCita.id = btnE.parentElement.id;
          });
        }, false);
      }

      // Add picture upload button to each document
      let btnsImagen = document.getElementsByClassName("inputFile");
      for (let i = 0; i < btnsImagen.length; i++) {
        const btnI = btnsImagen[i];
        // Upload image logic
        btnI.addEventListener("change", function (event) {
          subirImagen(btnI.parentElement.parentElement.id, event.target.files[0]);
        }, false);
      }
    });
  }

  // Get date by ID
  async function getCita(id, f) {
    const docRef = doc(getFirestore(), "citas", id);
    const docSnap = await getDoc(docRef);
    f(docSnap.data());
  }

  // Delete date by ID
  function borrarCita(id) {
    const docRef = doc(getFirestore(), "citas", id);

    deleteDoc(docRef)
      .catch(error => {
        console.log(error);
      })
  }

  // Edit date by ID
  function editarCita(id, cita) {
    const docRef = doc(getFirestore(), "citas", id);

    updateDoc(docRef, cita)
      .catch(error => {
        console.log(error);
      })
  }

  // Upload image
  async function subirImagen(id, file) {
    try {
      if (file.type.match("image.*") || file.type.match("application/pdf")) {
        if (file.size < 5 * 1024 * 1024) {

          // 1 - Reference to document
          const docRef = doc(getFirestore(), "citas", id);

          // 2 - Upload the image to Cloud Storage.
          const filePath = `${getAuth().currentUser.uid}/${docRef.id}/${file.name}`;
          const newImageRef = ref(getStorage(), filePath);
          const fileSnapshot = await uploadBytesResumable(newImageRef, file);

          // 3 - Generate a public URL for the file.
          const publicImageUrl = await getDownloadURL(newImageRef);

          // 4 - Update the document
          await updateDoc(docRef, {
            imageUrl: publicImageUrl,
            storageUri: fileSnapshot.metadata.fullPath
          });
        } else {
          alert("La imagen no puede ser mayor de 3 MB.");
        }
      } else {
        alert("Archivo no válido. Seleccione una imagen o un PDF.");
      }
    } catch (error) {
      console.error('Ha habido un error subiendo el archivo a Cloud Storage:', error);
    }
  }

}

