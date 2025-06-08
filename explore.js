// Firebase imports (ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
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

// Define categories you want to show (example, can be dynamic if you want)
const categories = [
  { id: "all", name: "All Categories" },
  { id: "electronics", name: "Electronics" },
  { id: "fashion", name: "Fashion" },
  { id: "books", name: "Books" },
  { id: "home", name: "Home" },
  { id: "sports", name: "Sports" },
];

// Utility to truncate text
function truncateText(text, maxLength = 25) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

// Render category buttons horizontally
function renderCategories() {
  categoryFilters.innerHTML = "";
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat.name;
    btn.classList.add("category-btn");
    if (cat.id === selectedCategory) btn.classList.add("selected");
    btn.dataset.category = cat.id;

    btn.addEventListener("click", () => {
      selectedCategory = cat.id;
      updateFiltersAndRender();
    });

    categoryFilters.appendChild(btn);
  });
}

// Fetch sellers from Firestore ordered by businessName
async function fetchSellers() {
  const q = query(collection(db, "sellers"), orderBy("businessName", "asc"));
  const snapshot = await getDocs(q);
  sellers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderSellers();
}

// Fetch products from Firestore ordered by createdAt desc
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
    name.textContent = truncateText(seller.businessName, 18);
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

    // Click event to toggle seller filter, ignore clicks on view profile
    card.addEventListener("click", (e) => {
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

// Render products filtered by search, category and seller
function renderProducts() {
  productListingsEl.innerHTML = "";

  const searchTerm = searchBar.value.trim().toLowerCase();

  const filtered = products.filter((product) => {
    // Defensive checks
    const productName = product.name?.toLowerCase() || "";
    const productDesc = product.description?.toLowerCase() || "";
    const seller = sellers.find((s) => s.id === product.sellerId);
    const sellerName = seller?.businessName?.toLowerCase() || "";

    const matchesSearch =
      productName.includes(searchTerm) ||
      productDesc.includes(searchTerm) ||
      sellerName.includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    const matchesSeller =
      !selectedSellerId || product.sellerId === selectedSellerId;

    return matchesSearch && matchesCategory && matchesSeller;
  });

  if (filtered.length === 0) {
    productListingsEl.innerHTML =
      '<p class="text-center text-gray-400 col-span-full mt-4">No products found.</p>';
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    // Product image
    const img = document.createElement("img");
    img.classList.add("product-image");
    img.src = product.imageUrl || "https://via.placeholder.com/220x140?text=No+Image";
    img.alt = product.name || "Product Image";
    card.appendChild(img);

    // Product name
    const name = document.createElement("h3");
    name.textContent = truncateText(product.name, 30);
    card.appendChild(name);

    // Price
    const price = document.createElement("p");
    price.classList.add("price");
    price.textContent = `Ksh ${product.price?.toFixed(2) || "N/A"}`;
    card.appendChild(price);

    // Description
    if (product.description) {
      const desc = document.createElement("p");
      desc.textContent = truncateText(product.description, 60);
      card.appendChild(desc);
    }

    productListingsEl.appendChild(card);
  });
}

// Update filters (buttons & seller card highlight) and rerender products
function updateFiltersAndRender() {
  // Update category button styles
  [...categoryFilters.children].forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.category === selectedCategory);
  });

  // Update seller card highlight
  [...sellerProfilesEl.children].forEach((card) => {
    const viewLink = card.querySelector("a.view-profile-btn");
    if (!viewLink) return;
    const sellerId = new URL(viewLink.href).searchParams.get("uid");
    card.classList.toggle("selected", sellerId === selectedSellerId);
  });

  renderProducts();
}

// Search bar input
searchBar.addEventListener("input", () => {
  updateFiltersAndRender();
});

// Initialize page
(async () => {
  renderCategories();
  await fetchSellers();
  await fetchProducts();
  updateFiltersAndRender();
})();
