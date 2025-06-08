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
  const container = document.getElementById("sellerProfiles");
  container.innerHTML = "";

  sellers.forEach((seller) => {
    const div = document.createElement("div");
    div.className = "seller-profile";
    div.dataset.uid = seller.uid;
    div.dataset.category = seller.category;
    div.tabIndex = 0;

    div.innerHTML = `
      <img src="${seller.logoURL || 'https://via.placeholder.com/64?text=No+Logo'}" alt="${seller.businessName} logo" loading="lazy" />
      <div class="business-name" title="${seller.businessName}">${seller.businessName}</div>
      <div class="category">${seller.category}</div>
    `;

    div.addEventListener("click", () => {
      if (selectedSellerUid === seller.uid) {
        // Deselect
        selectedSellerUid = null;
        div.classList.remove("selected");
        displayProducts(filteredProducts());
      } else {
        // Select new seller
        selectedSellerUid = seller.uid;
        // Remove selected class from all
        document.querySelectorAll(".seller-profile.selected").forEach(el => el.classList.remove("selected"));
        div.classList.add("selected");
        displayProducts(filteredProducts());
      }
    });

    container.appendChild(div);
  });
}

function filteredProducts() {
  return allProducts.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSeller = !selectedSellerUid || product.sellerUid === selectedSellerUid;
    return matchesCategory && matchesSeller;
  });
}

function displayProducts(products) {
  const container = document.getElementById("productListings");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = `<p class="text-gray-500 col-span-full">No products found.</p>`;
    return;
  }

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${product.productImageURL || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${product.productName}" loading="lazy" />
      <div class="product-info">
        <h3>${product.productName}</h3>
        <p>${product.productDescription}</p>
        <div class="product-price">KES ${product.price}</div>
      </div>
    `;

    container.appendChild(card);
  });
}

function setupCategoryFilters() {
  const categoryButtons = document.querySelectorAll(".category-btn");
  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      categoryButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedCategory = btn.dataset.category || "all";
      selectedSellerUid = null;
      // Remove selected seller profile highlight
      document.querySelectorAll(".seller-profile.selected").forEach(el => el.classList.remove("selected"));
      displayProducts(filteredProducts());
    });
  });
}

function setupSearchBar() {
  const searchInput = document.getElementById("searchBar");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();

    // Filter sellers by name or category
    const filteredSellers = allSellers.filter(seller => {
      return seller.businessName.toLowerCase().includes(query) || seller.category.includes(query);
    });
    displaySellerProfiles(filteredSellers);

    // Filter products by name or description
    const filteredProds = allProducts.filter(product => {
      return product.productName.toLowerCase().includes(query) || product.productDescription.toLowerCase().includes(query);
    });
    displayProducts(filteredProds);
  });
}

window.onload = () => {
  setupCategoryFilters();
  setupSearchBar();
  loadSellers();
  loadAllProducts();
};
