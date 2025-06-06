import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlakKgMzhADOywIOg4iTCJ5sUFXLMGwVg",
  authDomain: "jesmont-marketplace.firebaseapp.com",
  projectId: "jesmont-marketplace",
  storageBucket: "jesmont-marketplace.appspot.com",
  messagingSenderId: "543717950238",
  appId: "1:543717950238:web:df009d49e88a2ea010bf0f",
  measurementId: "G-56TMB41PS8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const businessName = document.getElementById("business-name").value.trim();
    const businessType = document.getElementById("business-type").value;
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const address = document.getElementById("business-address").value.trim();
    const description = document.getElementById("business-description").value.trim();
    const categories = Array.from(document.querySelectorAll("input[type='checkbox']:checked")).map(c => c.id);
    const logoFile = document.getElementById("logo-upload").files[0];
    const category = document.getElementById("category").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!businessName || !businessType || !email || !phone || !address || !description || !category || categories.length === 0) {
      alert("Please fill all required fields and select categories.");
      return;
    }

    try {
      // Optionally disable button here to prevent multiple submits
      // form.querySelector("button[type='submit']").disabled = true;

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      let logoURL = "";
      if (logoFile) {
        const logoRef = ref(storage, `logos/${user.uid}/${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        logoURL = await getDownloadURL(logoRef);
      }

      await setDoc(doc(db, "sellers", user.uid), {
        uid: user.uid,
        businessName,
        businessType,
        email,
        phone,
        address,
        description,
        category,
        categories,
        logoURL,
        createdAt: new Date()
      });

     form.reset();
window.location.href = "dashboard.html";


    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      // form.querySelector("button[type='submit']").disabled = false;
    }
  });
});
