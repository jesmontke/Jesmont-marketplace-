// Initialize Firebase with your config
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

// Fetch sellers from Firestore
async function fetchSellers() {
  try {
    const snapshot = await db.collection("sellers").get();
    sellers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Sellers fetched:", sellers);
  } catch (error) {
    console.error("Error fetching sellers:", error);
    sellerProfilesContainer.innerHTML = `<p style="color:red;">Error loading sellers</p>`;
  }
}

// Fetch products from Firestore
async function fetchProducts() {
  try {
    const snapshot = await db.collection("products").get();
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Products fetched:", products);
  } catch (error) {
    console.error("Error fetching products:", error);
    productListings.innerHTML = `<p style="color:red;">Error loading products</p>`;
  }
}

function getUniqueCategories() {
  const categoriesSet = new Set();
  sellers.forEach(s => {
    if (s.category && s.category.trim()) {
      categoriesSet.add(s.category.trim());
    }
  });
  products.forEach(p => {
    if (p.category && p.category.trim()) {
      categoriesSet.add(p.category.trim());
    }
  });
  return Array.from(categoriesSet).sort();
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

  // Add All Sellers card to deselect seller filter
  const allSellersCard = document.createElement("div");
  allSellersCard.className = "seller-card" + (selectedSellerId === null ? " selected" : "");
  allSellersCard.textContent = "All Sellers";
  allSellersCard.style.fontWeight = "700";
  allSellersCard.style.padding = "10px 15px";
  allSellersCard.style.border = "2px solid var(--black)";
  allSellersCard.style.borderRadius = "10px";
  allSellersCard.style.userSelect = "none";
  allSellersCard.style.cursor = "pointer";
  allSellersCard.onclick = () => {
    selectedSellerId = null;
    updateUI();
  };
  sellerProfilesContainer.appendChild(allSellersCard);

  sellers.forEach(seller => {
    const card = document.createElement("div");
    card.className = "seller-card" + (selectedSellerId === seller.id ? " selected" : "");
    card.onclick = () => {
      if (selectedSellerId === seller.id) {
        // Deselect if clicked again
        selectedSellerId = null;
      } else {
        selectedSellerId = seller.id;
      }
      updateUI();
    };

    const logo = document.createElement("img");
    logo.src = seller.logoUrl || "https://via.placeholder.com/60?text=No+Logo";
    logo.alt = `${seller.businessName} Logo`;
    logo.className = "seller-logo";

    const name = document.createElement("div");
    name.textContent = seller.businessName || "Unnamed Seller";
    name.className = "seller-name";

    card.appendChild(logo);
    card.appendChild(name);

    sellerProfilesContainer.appendChild(card);
  });
}

function filterProducts() {
  return products.filter(product => {
    // Filter by category
    const categoryMatch = selectedCategory === "All" || product.category === selectedCategory;

    // Filter by seller
    const sellerMatch = !selectedSellerId || product.sellerId === selectedSellerId;

    // Filter by search term
    const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

    return categoryMatch && sellerMatch && searchMatch;
  });
}

function displayProducts(filteredProducts) {
  productListings.innerHTML = "";
  if (filteredProducts.length === 0) {
    productListings.innerHTML = "<p>No products found.</p>";
    return;
  }
  filteredProducts.forEach(product => {
    const productCard = document.createElement("article");
    productCard.className = "product-card";

    const img = document.createElement("img");
    img.src = product.imageUrl || "https://via.placeholder.com/280x160?text=No+Image";
    img.alt = product.name || "Product Image";
    img.className = "product-image";

    const title = document.createElement("h3");
    title.textContent = product.name || "Unnamed Product";

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = product.price ? `Ksh ${product.price}` : "Price not set";

    const desc = document.createElement("p");
    desc.textContent = product.description || "";

    const seller = sellers.find(s => s.id === product.sellerId);
    const sellerInfo = document.createElement("div");
    sellerInfo.className = "seller-info";
    sellerInfo.textContent = seller ? seller.businessName : "Unknown Seller";

    productCard.appendChild(img);
    productCard.appendChild(title);
    productCard.appendChild(price);
    productCard.appendChild(desc);
    productCard.appendChild(sellerInfo);

    productListings.appendChild(productCard);
  });
}

function updateUI() {
  createCategoryButtons();
  createSellerProfiles();

  const filteredProducts = filterProducts();
  displayProducts(filteredProducts);
}

// Setup event listener for search input
searchBar.addEventListener("input", (e) => {
  searchTerm = e.target.value.trim();
  selectedSellerId = null; // reset seller filter when searching
  updateUI();
});

// Main initialization function
async function init() {
  await fetchSellers();
  await fetchProducts();
  updateUI();
}

init();
