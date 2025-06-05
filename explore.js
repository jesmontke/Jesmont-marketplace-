import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlakKgMzhADOywIOg4iTCJ5sUFXLMGwVg",
  authDomain: "jesmont-marketplace.firebaseapp.com",
  projectId: "jesmont-marketplace",
  storageBucket: "jesmont-marketplace.appspot.com", // fixed here
  messagingSenderId: "543717950238",
  appId: "1:543717950238:web:df009d49e88a2ea010bf0f",
  measurementId: "G-56TMB41PS8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allSellers = [];
let selectedCategory = "all";

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
        category: (data.category || "uncategorized").trim().toLowerCase(),
      };
    });

    console.log("Loaded sellers:", allSellers.length);

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

function displaySellers(sellers) {
  const sellerContainer = document.getElementById("sellerContainer");
  sellerContainer.innerHTML = "";

  if (sellers.length === 0) {
    sellerContainer.innerHTML = "<p class='text-gray-500 text-center'>No matching sellers found.</p>";
    return;
  }

  sellers.forEach(seller => {
    const card = document.createElement("div");
    card.classList.add("listing-card", "bg-white", "p-4", "rounded", "shadow", "mb-4");

    card.innerHTML = `
      <h3 class="text-lg font-semibold">${seller.businessName || "Unnamed Business"}</h3>
      <p class="text-sm text-gray-700">${seller.businessDescription || seller.description || ""}</p>
      <p class="text-xs text-gray-500 mt-2">Category: ${seller.category || "Uncategorized"}</p>
    `;

    sellerContainer.appendChild(card);
  });
}

function setupFilters() {
  const categoryButtons = document.querySelectorAll(".category-btn");

  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category.toLowerCase();

      categoryButtons.forEach(b => b.classList.remove("ring", "ring-blue-500"));
      btn.classList.add("ring", "ring-blue-500");

      console.log("Filtering by category:", selectedCategory);
      filterSellers();
    });
  });

  const searchBar = document.getElementById("searchBar");
  searchBar.addEventListener("input", () => {
    filterSellers();
  });
}

function filterSellers() {
  const searchValue = document.getElementById("searchBar").value.toLowerCase();

  const filtered = allSellers.filter(seller => {
    const name = (seller.businessName || "").toLowerCase();
    const description = ((seller.businessDescription || seller.description) || "").toLowerCase();
    const category = (seller.category || "uncategorized").toLowerCase();

    const matchesSearch = name.includes(searchValue) || description.includes(searchValue);
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  displaySellers(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
  loadSellers();
  setupFilters();
});
