import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config
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

let allSellers = [];
let selectedCategory = "all";

// Load all sellers from Firestore
async function loadSellers() {
  const sellerContainer = document.getElementById("sellerContainer");
  sellerContainer.innerHTML = "<p>Loading sellers...</p>";

  try {
    const snapshot = await getDocs(collection(db, "sellers"));
    allSellers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        category: (data.category || "uncategorized").toLowerCase()
      };
    });

    if (allSellers.length === 0) {
      sellerContainer.innerHTML = "<p class='text-gray-500 text-center'>No sellers found.</p>";
    } else {
      displaySellers(allSellers);
    }

  } catch (err) {
    console.error("Error loading sellers:", err);
    sellerContainer.innerHTML = "<p class='text-red-500'>Failed to load sellers.</p>";
  }
}


// Display sellers as cards
function displaySellers(sellers) {
  const sellerContainer = document.getElementById("sellerContainer");
  sellerContainer.innerHTML = "";

  if (sellers.length === 0) {
    sellerContainer.innerHTML = "<p class='text-gray-500 text-center'>No matching sellers found.</p>";
    return;
  }

  sellers.forEach(seller => {
    const card = document.createElement("div");
    card.classList.add("listing-card");

    card.innerHTML = `
      <h3>${seller.businessName}</h3>
      <p>${seller.businessDescription || seller.description || ""}</p>
    `;

    sellerContainer.appendChild(card);
  });
}


// Setup search and category filters
function setupFilters() {
  const categoryButtons = document.querySelectorAll(".category-btn");

  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category.toLowerCase();

      categoryButtons.forEach(b => b.classList.remove("ring", "ring-blue-500"));
      btn.classList.add("ring", "ring-blue-500");

      filterSellers();
    });
  });

  const searchBar = document.getElementById("searchBar");
  searchBar.addEventListener("input", () => {
    filterSellers();
  });
}


// Filter sellers based on search and category
function filterSellers() {
  const searchValue = document.getElementById("searchBar").value.toLowerCase();

  const filtered = allSellers.filter(seller => {
    const matchesSearch =
      (seller.businessName || "").toLowerCase().includes(searchValue) ||
      (seller.businessDescription || "").toLowerCase().includes(searchValue);
    const matchesCategory = selectedCategory === "all" || seller.businessCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  displaySellers(filtered);
}

// Initialize everything
document.addEventListener("DOMContentLoaded", () => {
  loadSellers();     // Load from Firestore
  setupFilters();    // Setup category and search
});

