import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

let allSellers = [];
let allProducts = [];
let selectedCategory = "all";
let selectedSellerUid = null;

async function loadSellers() {
  const sellerProfiles = document.getElementById("sellerProfiles");
  sellerProfiles.innerHTML = "Loading sellers...";
  console.log("Loading sellers...");

  try {
    const snapshot = await getDocs(collection(db, "sellers"));
    allSellers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid,
        businessName: data.businessName,
        category: (data.category || "uncategorized").toLowerCase(),
        logoURL: data.logoURL || "",
        description: data.businessDescription || data.description || "",
      };
    });

    console.log("Loaded sellers:", allSellers);

    if (allSellers.length === 0) {
      sellerProfiles.innerHTML = "<p class='text-gray-500'>No sellers found.</p>";
      return;
    }

    displaySellerProfiles(allSellers);
    selectSeller(allSellers[0].uid);

  } catch (error) {
    console.error("Error loading sellers:", error);
    sellerProfiles.innerHTML = "<p class='text-red-500'>Failed to load sellers.</p>";
  }
}

function displaySellerProfiles(sellers) {
  const sellerProfiles = document.getElementById("sellerProfiles");
  sellerProfiles.innerHTML = "";

  sellers.forEach(seller => {
    const card = document.createElement("div");
    card.className = "seller-profile";
    card.dataset.uid = seller.uid;
    card.dataset.category = seller.category;

    card.innerHTML = `
      <img src="${seller.logoURL || 'https://via.placeholder.com/70?text=Logo'}" alt="${seller.businessName} Logo" />
      <div class="font-semibold text-sm truncate" title="${seller.businessName}">${seller.businessName}</div>
      <div class="text-xs text-gray-500 truncate" title="${seller.category}">${capitalize(seller.category)}</div>
    `;

    card.addEventListener("click", () => {
      selectSeller(seller.uid);
    });

    sellerProfiles.appendChild(card);
  });
}

async function loadProductsForSeller(sellerUid) {
  const productListings = document.getElementById("productListings");
  productListings.innerHTML = "Loading products...";
  console.log(`Loading products for seller UID: ${sellerUid}`);

  try {
    const q = query(collection(db, "products"), where("sellerUid", "==", sellerUid));
    const snapshot = await getDocs(q);
    allProducts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        productName: data.productName,
        productDescription: data.productDescription || "",
        price: data.price || "",
        productImageURL: data.productImageURL || "",
      };
    });

    console.log("Loaded products:", allProducts);

    displayProducts(allProducts);

  } catch (error) {
    console.error("Error loading products:", error);
    productListings.innerHTML = "<p class='text-red-500'>Failed to load products.</p>";
  }
}

function displayProducts(products) {
  const productListings = document.getElementById("productListings");
  productListings.innerHTML = "";

  if (products.length === 0) {
    productListings.innerHTML = "<p class='text-gray-500'>No products found for this seller.</p>";
    return;
  }

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${product.productImageURL || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${product.productName}" class="product-image" />
      <h3 class="text-lg font-semibold">${product.productName}</h3>
      <p class="text-gray-700 text-sm mb-2">${product.productDescription}</p>
      <p class="text-green-600 font-bold">${product.price ? "KES " + product.price : "Price not set"}</p>
    `;

    productListings.appendChild(card);
  });
}

function selectSeller(uid) {
  selectedSellerUid = uid;
  console.log("Selected seller UID:", uid);

  // Highlight selected seller card
  const sellerCards = document.querySelectorAll(".seller-profile");
  sellerCards.forEach(card => {
    card.classList.toggle("selected", card.dataset.uid === uid);
  });

  // Load that seller's products
  loadProductsForSeller(uid);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function filterSellersByCategory(category) {
  selectedCategory = category;
  console.log("Filtering sellers by category:", category);

  const sellerCards = document.querySelectorAll(".seller-profile");
  sellerCards.forEach(card => {
    if (category === "all" || card.dataset.category === category) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });

  const visibleSellers = [...sellerCards].filter(c => c.style.display === "block");

  if (visibleSellers.length === 0) {
    document.getElementById("productListings").innerHTML = "<p class='text-gray-500'>No sellers in this category.</p>";
  }

  if (!visibleSellers.some(c => c.dataset.uid === selectedSellerUid)) {
    if (visibleSellers.length > 0) {
      selectSeller(visibleSellers[0].dataset.uid);
    } else {
      selectedSellerUid = null;
      document.getElementById("productListings").innerHTML = "";
    }
  }
}

function searchHandler() {
  const term = document.getElementById("searchBar").value.toLowerCase();
  console.log("Search term:", term);

  // Filter sellers
  const sellerCards = document.querySelectorAll(".seller-profile");
  sellerCards.forEach(card => {
    const name = card.querySelector("div").textContent.toLowerCase();
    if (name.includes(term)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });

  // Filter products if a seller is selected
  if (selectedSellerUid) {
    const filteredProducts = allProducts.filter(product =>
      product.productName.toLowerCase().includes(term)
    );
    displayProducts(filteredProducts);
  }
}

// Setup event listeners
document.querySelectorAll(".category-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");

    filterSellersByCategory(button.dataset.category);
  });
});

document.getElementById("searchBar").addEventListener("input", searchHandler);

// Load sellers on page load
loadSellers();

console.log("Explore page JS loaded");
