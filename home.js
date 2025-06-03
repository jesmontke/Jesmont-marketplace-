// home.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadSellers() {
  const container = document.getElementById("homeSellerContainer");

  try {
    const snapshot = await getDocs(collection(db, "sellers"));
    snapshot.forEach((doc) => {
      const seller = doc.data();

      // Create card container
      const card = document.createElement("div");
      card.style.width = "280px";
      card.style.background = "#fff";
      card.style.borderRadius = "12px";
      card.style.padding = "16px";
      card.style.margin = "10px";
      card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      card.style.transition = "transform 0.2s";
      card.style.display = "flex";
      card.style.flexDirection = "column";

      // Add seller info
      card.innerHTML = `
        <h3 style="color: #1E88E5; font-size: 20px; margin-bottom: 10px;">${seller.businessName}</h3>
        <p><strong>Owner:</strong> ${seller.fullName}</p>
        <p><strong>Category:</strong> ${seller.category}</p>
        <p><strong>Email:</strong> ${seller.email}</p>
        <p><strong>Phone:</strong> ${seller.phone}</p>
        <p><strong>Description:</strong> ${seller.description}</p>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading sellers:", error);
    container.innerHTML = `<p style="color:red;">Failed to load sellers. Please try again later.</p>`;
  }
}

loadSellers();
