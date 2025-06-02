// Firebase setup using CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ Replace with your actual Firebase config:


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadSellers() {
  const container = document.getElementById("sellerContainer");
  con// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDlakKgMzhADOywIOg4iTCJ5sUFXLMGwVg",
  authDomain: "jesmont-marketplace.firebaseapp.com",
  projectId: "jesmont-marketplace",
  storageBucket: "jesmont-marketplace.firebasestorage.app",
  messagingSenderId: "543717950238",
  appId: "1:543717950238:web:df009d49e88a2ea010bf0f",
  measurementId: "G-56TMB41PS8"
};
  st querySnapshot = await getDocs(collection(db, "sellers"));

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const img = data.profileImage || "https://via.placeholder.com/80";

    const card = document.createElement("div");
    card.className = "seller-card";
    card.innerHTML = `
      <img src="${img}" alt="Profile Image" />
      <h3>${data.businessName}</h3>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
    `;
    container.appendChild(card);
  });
}

loadSellers();
