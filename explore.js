// Firebase config - replace with your own config
const firebaseConfig = {
  apiKey: "AIzaSyDlakKgMzhADOywIOg4iTCJ5sUFXLMGwVg",
  authDomain: "jesmont-marketplace.firebaseapp.com",
  projectId: "jesmont-marketplace",
  storageBucket: "jesmont-marketplace.appspot.com",
  messagingSenderId: "543717950238",
  appId: "1:543717950238:web:df009d49e88a2ea010bf0f",
  measurementId: "G-56TMB41PS8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const searchBar = document.getElementById("searchBar");
const categoryFilters = document.getElementById("categoryFilters");
const sellerProfiles = document.getElementById("sellerProfiles");
const productListings = document.getElementById("productListings");

// State
let categories = new Set();
let sellers = [];
let products = [];
let selectedCategory = "All";
let selectedSellerId = null;
let searchQuery = "";

// Utility function: sanitize strings for search matching
function normalizeText(text) {
  return text.toLowerCase();
}

// Fetch all sellers from Firestore
async function fetchSellers() {
  const snapshot = await db.collection("sellers").get();
  sellers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Collect all categories from sellers as well
  sellers.forEach(s => {
    if (s.category) categories.add(s.category.toLowerCase());
  });
  categories.add("all");
}

// Fetch all products from Firestore
async function fetchProducts() {
  const snapshot = await db.collection("products").get();
  products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Also collect product categories
  products.forEach(p => {
    if (p.category) categories.add(p.category.toLowerCase());
  });
  categories.add("all");
}

// Render category filter buttons
function renderCategories() {
  // Sort and display 'All' first
  const sortedCats = Array.from(categories).sort((a, b) => {
    if (a === "all") return -1;
    if (b === "all") return 1;
    return a.localeCompare(b);
  });

  categoryFilters.innerHTML = "";
  sortedCats.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    btn.className = "category-btn";
    if (cat === selectedCategory.toLowerCase()) {
      btn.classList.add("selected");
    }
    btn.addEventListener("click", () => {
      selectedCategory = cat;
      selectedSellerId = null; // Reset seller filter when category changes
      renderCategories();
      renderSellerProfiles();
      renderProducts();
    });
    categoryFilters.appendChild(btn);
  });
}

// Render seller profiles horizontally with logos and View Profile buttons
function renderSellerProfiles() {
  sellerProfiles.innerHTML = "";

  // Add "All Sellers" card
  const allCard = document.createElement("div");
  allCard.className = "seller-profile" + (selectedSellerId === null ? " selected" : "");
  allCard.innerHTML = `
    <img src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" alt="All Sellers" />
    <div class="business-name">All Sellers</div>
    <div class="category-label">All</div>
    <button class="view-profile-btn">View Profile</button>
  `;
  allCard.querySelector("button").addEventListener("click", () => {
    selectedSellerId = null;
    renderSellerProfiles();
    renderProducts();
  });
  sellerProfiles.appendChild(allCard);

  // Filter sellers by selectedCategory if not "all"
  let filteredSellers = sellers;
  if (selectedCategory.toLowerCase() !== "all") {
    filteredSellers = sellers.filter(s => s.category?.toLowerCase() === selectedCategory.toLowerCase());
  }

  filteredSellers.forEach(seller => {
    const card = document.createElement("div");
    card.className = "seller-profile" + (selectedSellerId === seller.id ? " selected" : "");
    card.innerHTML = `
      <img src="${seller.logoUrl || "https://cdn-icons-png.flaticon.com/512/1077/1077114.png"}" alt="${seller.businessName}" />
      <div class="business-name">${seller.businessName}</div>
      <div class="category-label">${seller.category || ""}</div>
      <button class="view-profile-btn">View Profile</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      selectedSellerId = seller.id;
      renderSellerProfiles();
      renderProducts();
    });
    sellerProfiles.appendChild(card);
  });
}

// Render product cards filtered by search, category, and seller
function renderProducts() {
  const q = normalizeText(searchQuery);

  let filtered = products;

  // Filter by selected category (if not All)
  if (selectedCategory.toLowerCase() !== "all") {
    filtered = filtered.filter(
      p => p.category && p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  // Filter by selected seller
  if (selectedSellerId) {
    filtered = filtered.filter(p => p.sellerId === selectedSellerId);
  }

  // Filter by search query: match product name, description, or seller business name
  if (q) {
    filtered = filtered.filter(p => {
      const prodName = p.name ? normalizeText(p.name) : "";
      const prodDesc = p.description ? normalizeText(p.description) : "";
      // Find seller business name from sellers array
      const sellerName = sellers.find(s => s.id === p.sellerId)?.businessName || "";
      return (
        prodName.includes(q) ||
        prodDesc.includes(q) ||
        normalizeText(sellerName).includes(q)
      );
    });
  }

  // Render
  productListings.innerHTML = "";

  if (filtered.length === 0) {
    productListings.innerHTML = `<p style="text-align:center; color:#777;">No products found.</p>`;
    return;
  }

  filtered.forEach(p => {
    const seller = sellers.find(s => s.id === p.sellerId);
    const productCard = document.createElement("article");
    productCard.className = "product-card";
    productCard.innerHTML = `
      <img
        loading="lazy"
        class="product-image"
        src="${p.imageUrl || 'https://via.placeholder.com/300x225?text=No+Image'}"
        alt="${p.name || 'Product Image'}"
      />
      <h3>${p.name || "Unnamed Product"}</h3>
      <div class="price">Ksh ${p.price?.toFixed(2) || "N/A"}</div>
      <p>${p.description || "No description."}</p>
      <div class="seller-name">Seller: ${seller?.businessName || "Unknown"}</div>
    `;
    productListings.appendChild(productCard);
  });
}

// Event listeners
searchBar.addEventListener("input", e => {
  searchQuery = e.target.value;
  renderProducts();
});

// Initial fetch and render
async function init() {
  await Promise.all([fetchSellers(), fetchProducts()]);
  renderCategories();
  renderSellerProfiles();
  renderProducts();
}

init();
