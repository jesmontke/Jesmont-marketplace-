// explore.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlakKgMzhADOywIOg4iTCJ5sUFXLMGwVg",
  authDomain: "jesmont-marketplace.firebaseapp.com",
  projectId: "jesmont-marketplace",
  storageBucket: "jesmont-marketplace.appspot.com",
  messagingSenderId: "543717950238",
  appId: "1:543717950238:web:df009d49e88a2ea010bf0f",
  measurementId: "G-56TMB41PS8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categoryFilters = document.getElementById("categoryFilters");
const sellerProfilesContainer = document.getElementById("sellerProfiles");
const productListingsContainer = document.getElementById("productListings");
const searchBar = document.getElementById("searchBar");

let categories = [];
let sellers = [];
let products = [];

let selectedCategory = null;
let selectedSellerId = null;
let searchTerm = "";

async function fetchCategories() {
  const categoriesCol = collection(db, "categories");
  const snapshot = await getDocs(categoriesCol);
  categories = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  categories.unshift({ id: "all", name: "All" }); // Add All at front
  renderCategoryFilters();
}

function renderCategoryFilters() {
  categoryFilters.innerHTML = "";
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat.name;
    btn.className = "category-btn";
    if ((selectedCategory === null && cat.id === "all") || selectedCategory === cat.id) {
      btn.classList.add("selected");
    }
    btn.addEventListener("click", () => {
      if (cat.id === "all") {
        selectedCategory = null;
      } else {
        selectedCategory = cat.id;
      }
      selectedSellerId = null; // Clear seller filter on category change
      renderCategoryFilters();
      renderSellerProfiles();
      filterAndRenderProducts();
    });
    categoryFilters.appendChild(btn);
  });
}

async function fetchSellers() {
  const sellersCol = collection(db, "sellers");
  const snapshot = await getDocs(sellersCol);
  sellers = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  renderSellerProfiles();
}

function renderSellerProfiles() {
  sellerProfilesContainer.innerHTML = "";

  // Filter sellers by selected category if any
  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name.toLowerCase()
    : null;

  const filteredSellers = selectedCategoryName
    ? sellers.filter(
        (s) =>
          s.category &&
          s.category.toLowerCase() === selectedCategoryName
      )
    : sellers;

  filteredSellers.forEach((seller) => {
    const card = document.createElement("div");
    card.className = "seller-profile";
    if (selectedSellerId === seller.id) {
      card.classList.add("selected");
    }

    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-pressed",
      selectedSellerId === seller.id ? "true" : "false"
    );

    // Seller logo or default circle placeholder
    const img = document.createElement("img");
    img.src =
      seller.logoURL && seller.logoURL.startsWith("http")
        ? seller.logoURL
        : "https://via.placeholder.com/110?text=No+Logo";
    img.alt = `Logo of ${seller.businessName || "seller"}`;
    card.appendChild(img);

    const businessName = document.createElement("div");
    businessName.textContent = seller.businessName || "Unnamed Seller";
    businessName.className = "business-name";
    card.appendChild(businessName);

    const categoryTag = document.createElement("div");
    categoryTag.textContent = seller.category
      ? seller.category.charAt(0).toUpperCase() + seller.category.slice(1)
      : "Uncategorized";
    categoryTag.className = "category";
    card.appendChild(categoryTag);

    // View Profile button
    const profileBtn = document.createElement("a");
    profileBtn.href = `profile.html?sellerId=${seller.id}`;
    profileBtn.className = "view-profile-btn";
    profileBtn.textContent = "View Profile";
    card.appendChild(profileBtn);

    card.addEventListener("click", (e) => {
      if (e.target !== profileBtn) {
        if (selectedSellerId === seller.id) {
          selectedSellerId = null; // Deselect on second click
        } else {
          selectedSellerId = seller.id;
        }
        filterAndRenderProducts();
        renderSellerProfiles();
      }
    });

    sellerProfilesContainer.appendChild(card);
  });
}

async function fetchProducts() {
  const productsCol = collection(db, "products");
  const snapshot = await getDocs(productsCol);
  products = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  filterAndRenderProducts();
}

function filterAndRenderProducts() {
  productListingsContainer.innerHTML = "";

  let filtered = products;

  // Filter by category (match product.category)
  if (selectedCategory) {
    const categoryName = categories.find((c) => c.id === selectedCategory)?.name.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.category &&
        p.category.toLowerCase() === categoryName
    );
  }

  // Filter by seller
  if (selectedSellerId) {
    filtered = filtered.filter((p) => p.sellerId === selectedSellerId);
  }

  // Filter by search term in product name or seller name
  if (searchTerm.trim().length > 0) {
    const lowerSearch = searchTerm.toLowerCase();
    filtered = filtered.filter((p) => {
      const productName = p.name ? p.name.toLowerCase() : "";
      const seller = sellers.find((s) => s.id === p.sellerId);
      const sellerName = seller?.businessName
        ? seller.businessName.toLowerCase()
        : "";
      return (
        productName.includes(lowerSearch) || sellerName.includes(lowerSearch)
      );
    });
  }

  if (filtered.length === 0) {
    productListingsContainer.innerHTML = `<p class="text-center" style="color:#666; margin-top:2rem; font-size:1.1rem;">No products found.</p>`;
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const img = document.createElement("img");
    img.className = "product-image";
    img.alt = product.name || "Product image";
    img.src =
      product.imageURL && product.imageURL.startsWith("http")
        ? product.imageURL
        : "https://via.placeholder.com/400x300?text=No+Image";
    card.appendChild(img);

    const title = document.createElement("h3");
    title.textContent = product.name || "Unnamed Product";
    card.appendChild(title);

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = product.price
      ? `KES ${Number(product.price).toLocaleString()}`
      : "Price not available";
    card.appendChild(price);

    const description = document.createElement("p");
    description.textContent =
      product.description || "No description available.";
    card.append
