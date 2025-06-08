// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
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

// Elements
const productListings = document.getElementById("productListings");
const categoryFilters = document.getElementById("categoryFilters");
const sellerProfiles = document.getElementById("sellerProfiles");
const searchBar = document.getElementById("searchBar");

let allProducts = [];
let allSellers = [];
let selectedCategory = "All";
let selectedSellerId = null;

// Render functions
function renderProducts(products) {
  productListings.innerHTML = "";
  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img class="product-image" src="${product.imageURL || 'https://via.placeholder.com/400x300'}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <div class="price">Ksh ${product.price}</div>
      <p>${product.description}</p>
      <div>By: ${product.businessName}</div>
    `;

    productListings.appendChild(card);
  });
}

function renderCategories(categories) {
  const unique = Array.from(new Set(["All", ...categories]));
  categoryFilters.innerHTML = "";

  unique.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "category-btn";
    btn.textContent = cat;
    if (cat === selectedCategory) btn.classList.add("selected");
    btn.onclick = () => {
      selectedCategory = cat;
      document.querySelectorAll(".category-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      applyFilters();
    };
    categoryFilters.appendChild(btn);
  });
}

function renderSellers(sellers) {
  sellerProfiles.innerHTML = "";
  sellers.forEach((seller) => {
    const div = document.createElement("div");
    div.className = "seller-profile";
    if (seller.id === selectedSellerId) div.classList.add("selected");

    div.innerHTML = `
      <img src="${seller.logoURL || 'https://via.placeholder.com/100'}" alt="${seller.businessName}" />
      <div class="business-name">${seller.businessName}</div>
      <div class="category">${seller.category}</div>
      <a class="view-profile-btn" href="seller.html?id=${seller.id}">View</a>
    `;

    div.onclick = () => {
      if (selectedSellerId === seller.id) {
        selectedSellerId = null;
      } else {
        selectedSellerId = seller.id;
      }
      applyFilters();
    };

    sellerProfiles.appendChild(div);
  });
}

// Filter logic
function applyFilters() {
  const term = searchBar.value.toLowerCase();

  let filtered = allProducts.filter((p) => {
    const matchCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchSeller = !selectedSellerId || p.sellerId === selectedSellerId;
    const matchSearch =
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.businessName.toLowerCase().includes(term);

    return matchCategory && matchSeller && matchSearch;
  });

  renderProducts(filtered);
  renderSellers(allSellers);
}

// Load data from Firestore
async function loadData() {
  const sellerSnap = await getDocs(collection(db, "sellers"));
  allSellers = sellerSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const productSnap = await getDocs(collection(db, "products"));
  allProducts = productSnap.docs.map((doc) => {
    const data = doc.data();
    const seller = allSellers.find((s) => s.id === data.sellerId);
    return {
      ...data,
      businessName: seller ? seller.businessName : "Unknown Seller",
    };
  });

  const categories = allProducts.map((p) => p.category);
  renderCategories(categories);
  applyFilters();
}

searchBar.addEventListener("input", applyFilters);

// Run
loadData();
