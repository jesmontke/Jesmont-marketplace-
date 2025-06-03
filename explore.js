import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";



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

// Log to confirm script runs
console.log("Explore.js is loaded");

// Fetch sellers from Firestore
async function loadSellers() {
  const sellerContainer = document.getElementById("sellerContainer");
  sellerContainer.innerHTML = ""; // Clear before adding

  try {
    const querySnapshot = await getDocs(collection(db, "sellers"));

    if (querySnapshot.empty) {
      sellerContainer.innerHTML = "<p>No sellers found.</p>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const seller = doc.data();
      const card = document.createElement("div");
      card.className = "seller-card";
      card.innerHTML = `
        <h3>${seller.businessName || "Unnamed Business"}</h3>
        <p><strong>Owner:</strong> ${seller.fullName || "N/A"}</p>
        <p><strong>Email:</strong> ${seller.email || "N/A"}</p>
        <p><strong>Phone:</strong> ${seller.phone || "N/A"}</p>
        <p><strong>Category:</strong> ${seller.category || "N/A"}</p>
        <p><strong>Description:</strong> ${seller.description || "N/A"}</p>
      `;
      sellerContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Error fetching sellers:", error);
    sellerContainer.innerHTML = "<p>Failed to load sellers.</p>";
  }
}

loadSellers();


   
