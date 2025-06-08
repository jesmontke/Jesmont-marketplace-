// Firebase config — use your actual config here
const firebaseConfig = {
  apiKey: "AIzaSyDlakKgMzhADOywIOg4iTCJ5sUFXLMGwVg",
  authDomain: "jesmont-marketplace.firebaseapp.com",
  projectId: "jesmont-marketplace",
  storageBucket: "jesmont-marketplace.appspot.com",
  messagingSenderId: "543717950238",
  appId: "1:543717950238:web:df009d49e88a2ea010bf0f",
  measurementId: "G-56TMB41PS8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const searchBar = document.getElementById("search-bar");
const categoriesContainer = document.getElementById("categories");
const sellerProfilesContainer = document.getElementById("seller-profiles");
const productListings = document.getElementById("product-listings");

let sellers = [];
let products = [];
let selectedCategory = "All";
let selectedSellerId = null;
let searchTerm = "";

function getUniqueCategories() {
  const cats = new Set();
  sellers.forEach(seller => {
    if (seller.category && seller.category.trim() !== "") {
      cats.add(seller.category.trim());
    }
  });
  products.forEach(prod => {
    if (prod.category && prod.category.trim() !== "") {
      cats.add(prod.category.trim());
    }
  });
  return Array.from(cats).sort();
}

function createCategoryButtons() {
  categoriesContainer.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.textContent = "All";
  allBtn.className = "category-btn" + (selectedCategory === "All" ? " selected" : "");
  allBtn.onclick = () => {
    selectedCategory = "All";
    selectedSellerId = null;
    updateUI();
  };
  categoriesContainer.appendChild(allBtn);

  const categories = getUniqueCategories();
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.className = "category-btn" + (selectedCategory === cat ? " selected" : "");
    btn.onclick = () => {
      selectedCategory = cat;
      selectedSellerId = null;
      updateUI();
    };
    categoriesContainer.appendChild(btn);
  });
}

function createSellerProfiles() {
  sellerProfilesContainer.innerHTML = "";

  // "All Sellers" card
  const allSellerCard = document.createElement("div");
  allSellerCard.className = "seller-card" + (selectedSellerId === null ? " selected" : "");
  allSellerCard.title = "All Sellers";
  allSellerCard.onclick = () => {
    selectedSellerId = null;
    updateUI();
  };
  // Placeholder all sellers icon
  allSellerCard.innerHTML = `
    <img src="https://img.icons8.com/ios-filled/100/000000/shop.png" alt="All Sellers" class="seller-logo" />
    <div class="seller-name">All Sellers</div>
  `;
  sellerProfilesContainer.appendChild(allSellerCard);

  sellers.forEach(seller => {
    const card = document.createElement("div");
    card.className = "seller-card" + (selectedSellerId === seller.id ? " selected" : "");
    card.title = seller.businessName || "Unnamed Seller";
    card.onclick = () => {
      selectedSellerId = seller.id;
      updateUI();
    };

    const logoUrl = seller.logoUrl && seller.logoUrl.trim() !== "" ? seller.logoUrl : "https://via.placeholder.com/60?text=Logo";

    card.innerHTML = `
      <img src="${logoUrl}" alt="${seller.businessName || "Seller Logo"}" class="seller-logo" />
      <div class="seller-name">${seller.businessName || "Unnamed Seller"}</div>
    `;
    sellerProfilesContainer.appendChild(card);
  });
}

function displayProducts() {
  productListings.innerHTML = "";

  let filteredProducts = products;

  if (selectedCategory !== "All") {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }
  if (selectedSellerId) {
    filteredProducts = filteredProducts.filter(p => p.sellerId === selectedSellerId);
  }
  if (searchTerm.trim() !== "") {
    const term = searchTerm.trim().toLowerCase();
    filteredProducts = filteredProducts.filter(p => p.name && p.name.toLowerCase().includes(term));
  }

  if (filteredProducts.length === 0) {
    productListings.innerHTML = `<p>No products found.</p>`;
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const img = document.createElement("img");
    img.className = "product-image";
    img.src = product.imageUrl && product.imageUrl.trim() !== "" ? product.imageUrl : "https://via.placeholder.com/400x300?text=No+Image";
    img.alt = product.name || "Product Image";
    card.appendChild(img);

    const title = document.createElement("h3");
    title.textContent = product.name || "Unnamed Product";
    card.appendChild(title);

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = product.price != null ? `Ksh ${product.price.toLocaleString()}` : "Price N/A";
    card.appendChild(price);

    const desc = document.createElement("p");
    desc.textContent = product.description || "";
    card.appendChild(desc);

    const seller = sellers.find(s => s.id === product.sellerId);
    const sellerName = seller ? seller.businessName : "Unknown Seller";
    const sellerInfo = document.createElement("div");
    sellerInfo.className = "seller-info";
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

searchBar.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  selectedSellerId = null; // Reset seller filter on new search
  updateUI();
});

async function fetchSellers() {
  const snapshot = await db.collection("sellers").get();
  sellers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function fetchProducts() {
  const snapshot = await db.collection("products").get();
  products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function initialize() {
  await fetchSellers();
  await fetchProducts();
  updateUI();
}

initialize();
