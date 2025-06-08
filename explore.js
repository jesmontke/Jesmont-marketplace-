// Firebase imports (adjust if needed)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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
const db = getFirestore(app);

const sellerProfilesEl = document.getElementById("sellerProfiles");
const productListingsEl = document.getElementById("productListings");
const searchBar = document.getElementById("searchBar");
const categoryFilters = document.getElementById("categoryFilters");

let sellers = [];
let products = [];
let selectedCategory = "all";
let selectedSellerId = null;

// Utility to sanitize and truncate strings
function truncateText(text, maxLength = 25) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

// Fetch sellers from Firestore
async function fetchSellers() {
  const q = query(collection(db, "sellers"), orderBy("businessName", "asc"));
  const snapshot = await getDocs(q);
  sellers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderSellers();
}

// Fetch products from Firestore
async function fetchProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderProducts();
}

// Render sellers horizontally
function renderSellers() {
  sellerProfilesEl.innerHTML = "";
  sellers.forEach((seller) => {
    const card = document.createElement("div");
    card.classList.add("seller-profile");
    if (selectedSellerId === seller.id) card.classList.add("selected");

    // Seller logo or placeholder
    const img = document.createElement("img");
    img.src = seller.logoUrl || "https://via.placeholder.com/90?text=Logo";
    img.alt = `${seller.businessName} logo`;
    card.appendChild(img);

    // Business name
    const name = document.createElement("div");
    name.classList.add("business-name");
    name.textContent = truncateText(seller.businessName);
    card.appendChild(name);

    // Category
    const cat = document.createElement("div");
    cat.classList.add("category");
    cat.textContent = seller.category || "Unknown";
    card.appendChild(cat);

    // View Profile button
    const viewBtn = document.createElement("a");
    viewBtn.href = `seller.html?uid=${seller.id}`;
    viewBtn.textContent = "View Profile";
    viewBtn.classList.add("view-profile-btn");
    viewBtn.setAttribute("aria-label", `View profile of ${seller.businessName}`);
    card.appendChild(viewBtn);

    // Click event selects seller filter
    card.addEventListener("click", (e) => {
      // Prevent clicking the View Profile link from toggling selection
      if (e.target === viewBtn) return;
      if (selectedSellerId === seller.id) {
        selectedSellerId = null;
      } else {
        selectedSellerId = seller.id;
      }
      updateFiltersAndRender();
    });

    sellerProfilesEl.appendChild(card);
  });
}

// Render products grid
function renderProducts() {
  productListingsEl.innerHTML = "";

  // Filter products by search, category and seller
  const searchTerm = searchBar.value.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm) ||
      sellers.find((s) => s.id === product.sellerId)?.businessName
        .toLowerCase()
        .includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    const matchesSeller =
      !selectedSellerId || product.sellerId === selectedSellerId;

    return matchesSearch && matchesCategory && matchesSeller;
  });

  if (filtered.length === 0) {
    productListingsEl.innerHTML =
      '<p class="text-center text-gray-500 col-span-full">No products found.</p>';
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    // Product image
    const img = document.createElement("img");
    img.classList.add("product-image");
    img.src = product.imageUrl || "https://via.placeholder.com/220x140?text=No+Image";
    img.alt = product.name;
    card.appendChild(img);

    // Product name
    const name = document.createElement("h3");
    name.textContent = truncateText(product.name, 30);
    name.classList.add("font-semibold", "mb-1", "text-gray-800");
    card.appendChild(name);

    // Product price
    const price = document.createElement("p");
    price.textContent = `Ksh ${product.price?.toFixed(2) || "N/A"}`;
    price.classList.add("text-green-600", "mb-2");
    card.appendChild(price);

    // Product description
    if (product.description) {
      const desc = document.createElement("p");
      desc.textContent = truncateText(product.description, 60);
      desc.classList.add("text-gray-600", "text-sm");
      card.appendChild(desc);
    }

    productListingsEl.appendChild(card);
  });
}

// Update filters visually and rerender products and sellers
function updateFiltersAndRender() {
  // Update category button styles
  [...categoryFilters.children].forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.category === selectedCategory);
  });

  // Update seller card highlights
  [...sellerProfilesEl.children].forEach((card) => {
    const sellerId = card.querySelector("a.view-profile-btn")?.href.split("uid=")[1];
    card.classList.toggle("selected", sellerId === selectedSellerId);
  });

  renderProducts();
}

// Category button click event
categoryFilters.addEventListener("click", (e) => {
  if (e.target.classList.contains("category-btn")) {
    selectedCategory = e.target.dataset.category;
    updateFiltersAndRender();
  }
});

// Search bar input event
searchBar.addEventListener("input", () => {
  updateFiltersAndRender();
});

// Initial fetch and render
(async () => {
  await fetchSellers();
  await fetchProducts();
  updateFiltersAndRender();
})();
