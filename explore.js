// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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

function truncateText(text, maxLength = 25) {
  return !text ? "" : (text.length > maxLength ? text.slice(0, maxLength) + "…" : text);
}

async function fetchSellers() {
  const q = query(collection(db, "sellers"), orderBy("businessName", "asc"));
  const snapshot = await getDocs(q);
  sellers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderSellers();
}

async function fetchProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderProducts();
}

function renderSellers() {
  sellerProfilesEl.innerHTML = "";
  sellers.forEach((seller) => {
    const card = document.createElement("div");
    card.className = "min-w-[140px] bg-blue-100 rounded-xl p-3 flex-shrink-0 cursor-pointer hover:shadow-md transition";
    if (selectedSellerId === seller.id) card.classList.add("selected");

    const img = document.createElement("img");
    img.src = seller.logoUrl || "https://via.placeholder.com/90?text=Logo";
    img.alt = seller.businessName;
    img.className = "w-16 h-16 object-cover rounded-full mx-auto mb-2";
    card.appendChild(img);

    const name = document.createElement("div");
    name.textContent = truncateText(seller.businessName);
    name.className = "text-center font-semibold text-sm";
    card.appendChild(name);

    const category = document.createElement("div");
    category.textContent = seller.category || "N/A";
    category.className = "text-center text-xs text-gray-500";
    card.appendChild(category);

    const viewBtn = document.createElement("a");
    viewBtn.href = `seller.html?uid=${seller.id}`;
    viewBtn.textContent = "View Profile";
    viewBtn.className = "block mt-2 text-center text-blue-600 text-sm underline";
    viewBtn.addEventListener("click", (e) => e.stopPropagation());
    card.appendChild(viewBtn);

    card.addEventListener("click", () => {
      selectedSellerId = (selectedSellerId === seller.id) ? null : seller.id;
      updateFiltersAndRender();
    });

    sellerProfilesEl.appendChild(card);
  });
}

function renderProducts() {
  productListingsEl.innerHTML = "";
  const searchTerm = searchBar.value.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const seller = sellers.find((s) => s.id === product.sellerId);
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm) ||
      seller?.businessName.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    const matchesSeller =
      !selectedSellerId || product.sellerId === selectedSellerId;

    return matchesSearch && matchesCategory && matchesSeller;
  });

  if (filtered.length === 0) {
    productListingsEl.innerHTML = '<p class="text-center text-gray-500 col-span-full">No products found.</p>';
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "bg-yellow-100 rounded-lg shadow p-4";

    const img = document.createElement("img");
    img.src = product.imageUrl || "https://via.placeholder.com/220x140?text=No+Image";
    img.alt = product.name;
    img.className = "w-full h-40 object-cover rounded-md mb-3";
    card.appendChild(img);

    const name = document.createElement("h3");
    name.textContent = truncateText(product.name, 30);
    name.className = "text-lg font-bold text-gray-800 mb-1";
    card.appendChild(name);

    const price = document.createElement("p");
    price.textContent = `Ksh ${product.price?.toFixed(2) || "N/A"}`;
    price.className = "text-green-700 font-semibold mb-1";
    card.appendChild(price);

    const desc = document.createElement("p");
    desc.textContent = truncateText(product.description, 60);
    desc.className = "text-sm text-gray-600";
    card.appendChild(desc);

    productListingsEl.appendChild(card);
  });
}

function updateFiltersAndRender() {
  [...categoryFilters.children].forEach((btn) => {
    btn.classList.toggle("bg-yellow-500", btn.dataset.category === selectedCategory);
  });

  [...sellerProfilesEl.children].forEach((card, i) => {
    const id = sellers[i]?.id;
    card.classList.toggle("selected", id === selectedSellerId);
  });

  renderProducts();
}

categoryFilters.addEventListener("click", (e) => {
  if (e.target.classList.contains("category-btn")) {
    selectedCategory = e.target.dataset.category;
    updateFiltersAndRender();
  }
});

searchBar.addEventListener("input", () => updateFiltersAndRender());

(async () => {
  await fetchSellers();
  await fetchProducts();
  updateFiltersAndRender();
})();
