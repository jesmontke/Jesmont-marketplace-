import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDlakKgMzhADOywIOg4iTCJ5sUFXLMGwVg",
  authDomain: "jesmont-marketplace.firebaseapp.com",
  projectId: "jesmont-marketplace",
  storageBucket: "jesmont-marketplace.firebasestorage.app",
  messagingSenderId: "543717950238",
  appId: "1:543717950238:web:df009d49e88a2ea010bf0f",
  measurementId: "G-56TMB41PS8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Example function for seller registration
async function registerSeller(email, password, businessName) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;
  await addDoc(collection(db, "sellers"), {
    uid: user.uid,
    businessName,
    email
  });
}

// Example function for image upload
async function uploadLogo(file, userId) {
  const fileRef = ref(storage, `logos/${userId}/${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const businessName = document.getElementById("business-name").value;
  const businessType = document.getElementById("business-type").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const address = document.getElementById("business-address").value;
  const description = document.getElementById("business-description").value;
  const termsAccepted = document.getElementById("terms").checked;
  const logoFile = document.getElementById("logo-upload").files[0];

  const categories = Array.from(document.querySelectorAll('#categories input[type="checkbox"]:checked'))
    .map(cb => cb.id);

  if (!termsAccepted) return alert("You must agree to the terms.");
  if (password !== confirmPassword) return alert("Passwords do not match.");

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCred.user.uid;

    let logoUrl = "";
    if (logoFile) {
      logoUrl = await uploadLogo(logoFile, userId);
    }

    await addDoc(collection(db, "sellers"), {
      uid: userId,
      businessName,
      businessType,
      email,
      phone,
      address,
      description,
      categories,
      logoUrl,
      createdAt: new Date()
    });

    alert("Seller registered successfully!");
    // Optional: clear form or redirect
  } catch (err) {
    console.error(err);
    alert("Error registering seller: " + err.message);
  }
});
