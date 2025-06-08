import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

    if (allSellers.length === 0) {
      sellerProfiles.innerHTML = "<p class='text-gray-500'>No sellers found.</p>";
      return;
    }

    displaySellerProfiles(allSellers);

  } catch (error) {
    console.error("Error loading sellers:", error);
    sellerProfiles.innerHTML = "<p class='text-red-500'>Failed to load sellers.</p>";
  }
}

async function loadAllProducts() {
  const productListings = document.getElementById("productListings");
  productListings.innerHTML = "Loading products...";

  try {
    const snapshot = await getDocs(collection(db, "products"));
    allProducts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        productName: data.productName,
        productDescription: data.productDescription || "",
        price: data.price || "",
        productImageURL: data.productImageURL || "",
        sellerUid: data.sellerUid || "",
        category: (data.category || "uncategorized").toLowerCase(),
      };
    });

    displayProducts(allProducts);

  } catch (error) {
    console.error("Error loading products:", error);
    productListings.innerHTML = "<p class='text-red-500'>Failed to load products.</p>";
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
      <img src="${seller.logoURL || 'https://via.placeholder.com/70?text=Logo'}" alt="${seller.businessName} Logo" class="mx-auto mb-1 w-16 h-16 rounded-full object-cover" />
      <div class="font-semibold text-sm truncate" title="${seller.businessName}">${seller.businessName}</div>
      <div class="text-xs text-gray-500 truncate" title="${seller.category}">${capitalize(seller.category)}</div>
    `;

    card.addEventListener("click", () => {
      selectSeller(seller.uid);
    });

    sellerProfiles.appendChild(card);
  });
}

function displayProducts(products) {
  const productListings = document.getElementById("productListings");
  productListings.innerHTML = "";

  if (products.length === 0) {
    productListings.innerHTML = "<p class='text-gray-500'>No products found.</p>";
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

  // Highlight selected seller card
  const sellerCards = document.querySelectorAll(".seller-profile");
  sellerCards.forEach(card => {
    card.classList.toggle("selected", card.dataset.uid === uid);
  });

  // Show products ONLY for this seller and matching current category filter & search term
  filterAndDisplayProducts();
}

function filterAndDisplayProducts() {
  const searchTerm = document.getElementById("searchBar").value.toLowerCase();

  let filtered = allProducts;

  // Filter by seller if selected
  if (selectedSellerUid) {
    filtered = filtered.filter(p => p.sellerUid === selectedSellerUid);
  }

  // Filter by category if not "all"
  if (selectedCategory !== "all") {
    filtered = filtered.filter(p => p.category === selectedCategory);
  }

  // Filter by search term on productName
  if (searchTerm) {
    filtered = filtered.filter(p => p.productName.toLowerCase().includes(searchTerm));
  }

  displayProducts(filtered);
}

function filterSellersByCategory(category) {
  selectedCategory = category;

  const sellerCards = document.querySelectorAll(".seller-profile");
  sellerCards.forEach(card => {
    if (category === "all" || card.dataset.category === category) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });

  // If selected seller filtered out, clear selection or select first visible
  const visibleSellers = [...sellerCards].filter(c => c.style.display === "block");
  if (visibleSellers.length === 0) {
    document.getElementById("productListings").innerHTML = "<p class='text-gray-500'>No sellers in this category.</p>";
    selectedSellerUid = null;
    displayProducts([]); // Clear products
    return;
  }

  if (!visibleSellers.some(c => c.dataset.uid === selectedSellerUid)) {
    selectedSellerUid = null;
  }

  // Show products filtered by category & search, across all sellers (if none selected)
  filterAndDisplayProducts();
}

function searchHandler() {
  const term = document.getElementById("searchBar").value.toLowerCase();

  // Filter sellers by search term (businessName)
  const sellerCards = document.querySelectorAll(".seller-profile");
  sellerCards.forEach(card => {
    const name = card.querySelector("div").textContent.toLowerCase();
    if (name.includes(term)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });

  // If selected seller is filtered out, clear selection
  const visibleSellers = [...sellerCards].filter(c => c.style.display === "block");
  if (!visibleSellers.some(c => c.dataset.uid === selectedSellerUid)) {
    selectedSellerUid = null;
  }

  // Filter products by seller (if selected), category, and search term
  filterAndDisplayProducts();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Event listeners for category buttons
document.querySelectorAll(".category-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");

    filterSellersByCategory(button.dataset.category);
  });
});

// Event listener for search bar
document.getElementById("searchBar").addEventListener("input", searchHandler);

// Explore button resets filters and shows all
document.getElementById("exploreButton").addEventListener("click", () => {
  selectedCategory = "all";
  selectedSellerUid = null;

  document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("selected"));
  document.querySelector(".category-btn[data-category='all']").classList.add("selected");

  // Show all sellers and all products
  const sellerCards = document.querySelectorAll(".seller-profile");
  sellerCards.forEach(card => card.style.display = "block");

  filterAndDisplayProducts();
});

// Initial load
(async function init() {
  await loadSellers();
  await loadAllProducts();

  // Show all sellers and all products initially
  filterAndDisplayProducts();

  // Set default category button
  document.querySelector(".category-btn[data-category='all']").classList.add("selected");
})();
