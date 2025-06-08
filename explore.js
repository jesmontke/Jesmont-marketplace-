// explore.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your Firebase config here
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

const categoryFilters = document.getElementById("categoryFilters");
const sellerProfiles = document.getElementById("sellerProfiles");
const productListings = document.getElementById("productListings");
const searchBar = document.getElementById("searchBar");

let sellers = [];
let products = [];
let categories = new Set();

let selectedCategory = "all";
let selectedSellerId = null;
let searchTerm = "";

async function fetchSellers() {
  const sellersCol = collection(db, "sellers");
  const sellersSnapshot = await getDocs(sellersCol);
  sellers = sellersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function fetchProducts() {
  const productsCol = collection(db, "products");
  const productsSnapshot = await getDocs(productsCol);
  products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Collect all categories from products
  products.forEach(p => {
    if (p.category) categories.add(p.category.toLowerCase());
  });
}

function createCategoryButtons() {
  categoryFilters.innerHTML = "";

  // Add "All" category first
  const allBtn = document.createElement("button");
  allBtn.textContent = "All";
  allBtn.classList.add("category-btn");
  if (selectedCategory === "all") allBtn.classList.add("selected");
  allBtn.addEventListener("click", () => {
    selectedCategory = "all";
    selectedSellerId = null;
    updateUI();
  });
  categoryFilters.appendChild(allBtn);

  Array.from(categories).sort().forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    btn.classList.add("category-btn");
    if (selectedCategory === cat) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      selectedCategory = cat;
      selectedSellerId = null;
      updateUI();
    });
    categoryFilters.appendChild(btn);
  });
}

function createSellerProfiles() {
  sellerProfiles.innerHTML = "";

  sellers.forEach(seller => {
    // Filter sellers by category if applicable
    if (selectedCategory !== "all" && seller.category.toLowerCase() !== selectedCategory) {
      return;
    }

    const div = document.createElement("div");
    div.classList.add("seller-profile");
    if (seller.id === selectedSellerId) div.classList.add("selected");

    // Seller logo image fallback if none
    const img = document.createElement("img");
    img.src = seller.logoUrl || "https://via.placeholder.com/110?text=No+Logo";
    img.alt = `${seller.businessName} logo`;
    div.appendChild(img);

    const name = document.createElement("div");
    name.className = "business-name";
    name.textContent = seller.businessName;
    div.appendChild(name);

    const cat = document.createElement("div");
    cat.className = "category";
    cat.textContent = seller.category;
    div.appendChild(cat);

    const viewBtn = document.createElement("a");
    viewBtn.className = "view-profile-btn";
    viewBtn.href = `seller.html?id=${seller.id}`;
    viewBtn.textContent = "View Profile";
    div.appendChild(viewBtn);

    div.addEventListener("click", () => {
      selectedSellerId = seller.id;
      updateUI();
    });

    sellerProfiles.appendChild(div);
  });
}

function filterProducts() {
  let filtered = products;

  // Filter by category
  if (selectedCategory !== "all") {
    filtered = filtered.filter(
      p => p.category && p.category.toLowerCase() === selectedCategory
    );
  }

  // Filter by seller
  if (selectedSellerId) {
    filtered = filtered.filter(p => p.sellerId === selectedSellerId);
  }

  // Filter by search term (product name or seller business name)
  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(p => {
      const productName = p.name ? p.name.toLowerCase() : "";
      const seller = sellers.find(s => s.id === p.sellerId);
      const sellerName = seller ? seller.businessName.toLowerCase() : "";
      return productName.includes(term) || sellerName.includes(term);
    });
  }

  return filtered;
}

function displayProducts() {
  productListings.innerHTML = "";

  const filteredProducts = filterProducts();

  if (filteredProducts.length === 0) {
    productListings.innerHTML = `<p style="text-align:center; color:#666;">No products found.</p>`;
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const img = document.createElement("img");
    img.className = "product-image";
    img.src = product.imageUrl || "https://via.placeholder.com/400x300?text=No+Image";
    img.alt = product.name || "Product image";
    card.appendChild(img);

    const title = document.createElement("h3");
    title.textContent = product.name || "Unnamed Product";
    card.appendChild(title);

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = product.price ? `Ksh ${product.price.toLocaleString()}` : "Price N/A";
    card.appendChild(price);

    const desc = document.createElement("p");
    desc.textContent = product.description || "";
    card.appendChild(desc);

    const seller = sellers.find(s => s.id === product.sellerId);
    const sellerName = seller ? seller.businessName : "Unknown Seller";

    const sellerInfo = document.createElement("div");
    sellerInfo.textContent = `Seller: ${sellerName}`;
    card.appendChild(sellerInfo);

    productListings.appendChild(card);
  });
}

function updateUI() {
  createCategoryButtons();
  createSellerProfiles();
  displayProducts();
}

// Search bar event
searchBar.addEventListener("input", e => {
  searchTerm = e.target.value;
  selectedSellerId = null; // reset selected seller when searching
  updateUI();
});

async function initializePage() {
  await fetchSellers();
  await fetchProducts();
  updateUI();
}

initializePage();
