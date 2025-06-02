// Firebase setup using CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ Replace with your actual Firebase config:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadSellers() {
  const container = document.getElementById("sellerContainer");
  const querySnapshot = await getDocs(collection(db, "sellers"));

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
