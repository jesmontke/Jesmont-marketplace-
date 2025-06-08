// Firebase config
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

// Utility function: normalize text for searching
function normalizeText(text) {
  return text.toLowerCase();
}

// Fetch sellers from Firestore
async function fetchSellers() {
  const snapshot = await db.collection("sellers").get();
  sellers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  sellers.forEach(s => {
    if (s.category) categories.add(s.category.toLowerCase());
  });
  categories.add("all");
}

// Fetch products from Firestore
async function fetchProducts() {
  const snapshot = await db.collection("products").get();
  products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  products.forEach(p => {
    if (p.category) categories.add(p.category.toLowerCase());
  });
  categories.add("all");
}

// Render category buttons
function renderCategories() {
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
    if (cat === selectedCategory.toLowerCase()) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      selectedCategory = cat;
      selectedSellerId = null;
      renderCategories();
      renderSellerProfiles();
      renderProducts();
    });
    categoryFilters.appendChild(btn);
  });
}

// Render seller profile cards with logos
function renderSellerProfiles() {
  sellerProfiles.innerHTML = "";

  // All Sellers card
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

  let filteredSellers = sellers;
  if (selectedCategory.toLowerCase() !== "all") {
    filteredSellers = sellers.filter(s => s.category?.toLowerCase() === selectedCategory.toLowerCase());
  }

  filteredSellers.forEach(seller => {
    const card = document.createElement("div");
    card.className = "seller-profile" + (selectedSellerId === seller.id ? " selected" : "");
    card.innerHTML = `
      <img src="${seller.LogoURL || "https://cdn-icons-png.flaticon.com/512/1077/1077114.png"}" alt="${seller.businessName}" />
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

// Render filtered products
function renderProducts() {
  const q = normalizeText(searchQuery);

  let filtered = products;

  if (selectedCategory.toLowerCase() !== "all") {
    filtered = filtered.filter(
      p => p.category && p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  if (selectedSellerId) {
    filtered = filtered.filter(p => p.sellerId === selectedSellerId);
  }

  if (q) {
    filtered = filtered.filter(p => {
      const name = normalizeText(p.name || "");
      const desc = normalizeText(p.description || "");
      const sellerName = normalizeText(sellers.find(s => s.id === p.sellerId)?.businessName || "");
      return name.includes(q) || desc.includes(q) || sellerName.includes(q);
    });
  }

  productListings.innerHTML = "";

  if (filtered.length === 0) {
    productListings.innerHTML = `<p style="text-align:center; color:#777;">No products found.</p>`;
    return;
  }

  filtered.forEach(p => {
    const seller = sellers.find(s => s.id === p.sellerId);
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
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
    productListings.appendChild(card);
  });
}

// Search bar listener
searchBar.addEventListener("input", e => {
  searchQuery = e.target.value;
  renderProducts();
});

// Init
async function init() {
  await Promise.all([fetchSellers(), fetchProducts()]);
  renderCategories();
  renderSellerProfiles();
  renderProducts();
}

init();
