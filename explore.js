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
let selectedCategory = "All";

// Load all sellers from Firestore
async function loadSellers() {
  const sellerContainer = document.getElementById("sellerContainer");
  sellerContainer.innerHTML = "<p>Loading sellers...</p>";

  try {
    const snapshot = await getDocs(collection(db, "sellers"));
    allSellers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
    sellerContainer.innerHTML = "<p class='text-gray-500 text-center col-span-full'>No matching sellers found.</p>";
    return;
  }

  sellers.forEach(seller => {
    const card = document.createElement("div");
    card.className = "bg-white p-5 rounded-xl shadow-md card-hover transition-all border hover:shadow-lg";

    card.innerHTML = `
      <h3 class="text-lg font-semibold text-blue-800 mb-1">${seller.businessName || "Unnamed Business"}</h3>
      <p class="text-sm text-gray-600 mb-1"><strong>Owner:</strong> ${seller.fullName || "N/A"}</p>
      <p class="text-sm text-gray-600 mb-1"><strong>Email:</strong> ${seller.email || "N/A"}</p>
      <p class="text-sm text-gray-600 mb-1"><strong>Phone:</strong> ${seller.phone || "N/A"}</p>
      <p class="text-sm text-gray-600 mb-1"><strong>Category:</strong> ${seller.businessCategory || "N/A"}</p>
      <p class="text-sm text-gray-600 mb-3"><strong>Description:</strong> ${seller.businessDescription || "N/A"}</p>
      <a href="seller-profile.html?uid=${seller.uid}" class="text-sm text-white bg-blue-600 px-4 py-1.5 rounded hover:bg-blue-700">View Profile</a>
    `;

    sellerContainer.appendChild(card);
  });
}

// Setup search and category filters
function setupFilters() {
  const searchBar = document.getElementById("searchBar");
  const categoryButtons = document.querySelectorAll(".category-btn");

  searchBar.addEventListener("input", filterSellers);

  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category;

      categoryButtons.forEach(b => b.classList.remove("ring", "ring-offset-2", "bg-opacity-100"));
      btn.classList.add("ring", "ring-offset-2", "bg-opacity-100");

      filterSellers();
    });
  });
}

// Filter sellers based on search and category
function filterSellers() {
  const searchValue = document.getElementById("searchBar").value.toLowerCase();

  const filtered = allSellers.filter(seller => {
    const matchesSearch =
      (seller.businessName || "").toLowerCase().includes(searchValue) ||
      (seller.businessDescription || "").toLowerCase().includes(searchValue);
    const matchesCategory = selectedCategory === "All" || seller.businessCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  displaySellers(filtered);
}

// Initialize everything
loadSellers();
setupFilters();
