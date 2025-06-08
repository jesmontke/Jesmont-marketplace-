// Firebase config + initialization
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
let categories = [];

let selectedCategory = "All";
let selectedSellerId = null;
let searchTerm = "";

// Fetch sellers from Firestore
async function fetchSellers() {
  try {
    const snapshot = await db.collection("sellers").get();
    sellers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Derive categories from sellers businessCategory if needed
    // But we'll get categories from products (more inclusive)
    // console.log("Sellers fetched:", sellers);
  } catch (err) {
    console.error("Error fetching sellers:", err);
  }
}

// Fetch products from Firestore
async function fetchProducts() {
  try {
    const snapshot = await db.collection("products").get();
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Derive categories from products
    const catSet = new Set(products.map(p => p.category).filter(c => !!c));
    categories = Array.from(catSet).sort();
    categories.unshift("All"); // Add 'All' at front

    // console.log("Products fetched:", products);
    // console.log("Categories derived:", categories);
  } catch (err) {
    console.error("Error fetching products:", err);
  }
}

function createCategoryButtons() {
  categoriesContainer.innerHTML = "";

  categories.forEach(category => {
    const btn = document.createElement("button");
    btn.className = "category-btn";
    if (category === selectedCategory) btn.classList.add("selected");
    btn.textContent = category;
    btn.onclick = () => {
      selectedCategory = category;
      selectedSellerId = null; // Reset seller filter when selecting category
      updateUI();
    };
    categoriesContainer.appendChild(btn);
  });
}

function createSellerProfiles() {
  sellerProfilesContainer.innerHTML = "";

  // Add the "All Sellers" card with View Profile disabled
  const allSellersCard = document.createElement("div");
  allSellersCard.className = "seller-card" + (selectedSellerId === null ? " selected" : "");

  // Logo placeholder for "All Sellers"
  const allLogo = document.createElement("img");
  allLogo.src = "https://via.placeholder.com/80?text=All";
  allLogo.alt = "All Sellers";
  allLogo.className = "seller-logo";
  allSellersCard.appendChild(allLogo);

  const allName = document.createElement("div");
  allName.className = "seller-name";
  allName.textContent = "All Sellers";
  allSellersCard.appendChild(allName);

  // Disabled "View Profile" button for All Sellers
  const allBtn = document.createElement("button");
  allBtn.className = "view-profile-btn";
  allBtn.textContent = "View Profile";
  allBtn.disabled = true;
  allBtn.style.cursor = "default";
  allSellersCard.appendChild(allBtn);

  // Clicking entire card selects all sellers filter
  allSellersCard.onclick = () => {
    selectedSellerId = null;
    updateUI();
  };

  sellerProfilesContainer.appendChild(allSellersCard);

  // Filter sellers by selected category if not "All"
  const filteredSellers = selectedCategory === "All"
    ? sellers
    : sellers.filter(seller => {
      if (!seller.businessCategory) return false;
      if (Array.isArray(seller.businessCategory)) {
        return seller.businessCategory.includes(selectedCategory);
      }
      return seller.businessCategory === selectedCategory;
    });

  filteredSellers.forEach(seller => {
    const card = document.createElement("div");
    card.className = "seller-card" + (selectedSellerId === seller.id ? " selected" : "");

    card.onclick = () => {
      if (selectedSellerId === seller.id) {
        selectedSellerId = null; // deselect
      } else {
        selectedSellerId = seller.id;
      }
      updateUI();
    };

    const logo = document.createElement("img");
    logo.src = seller.logoUrl || "https://via.placeholder.com/80?text=No+Logo";
    logo.alt = seller.businessName || "Seller Logo";
    logo.className = "seller-logo";

    const name = document.createElement("div");
    name.className = "seller-name";
    name.textContent = seller.businessName || "Unnamed Seller";

    const btn = document.createElement("button");
    btn.className = "view-profile-btn";
    btn.textContent = "View Profile";
    btn.onclick = (e) => {
      e.stopPropagation();
      alert(`View profile clicked for seller: ${seller.businessName} (ID: ${seller.id})`);
      // TODO: Replace alert with navigation to seller profile page
    };

    card.appendChild(logo);
    card.appendChild(name);
    card.appendChild(btn);

    sellerProfilesContainer.appendChild(card);
  });

  // Show message if no sellers for this category
  if (filteredSellers.length === 0 && selectedCategory !== "All") {
    const msg = document.createElement("div");
    msg.textContent = "No sellers in this category.";
    msg.style.color = "#999";
    msg.style.fontStyle = "italic";
    msg.style.padding = "0.5rem";
    sellerProfilesContainer.appendChild(msg);
  }
}

function filterProducts() {
  return products.filter(product => {
    // Category filter (if 'All', allow all)
    const categoryMatch = selectedCategory === "All" || product.category === selectedCategory;

    // Seller filter
    const sellerMatch = !selectedSellerId || product.sellerId === selectedSellerId;

    // Search filter (case insensitive on product name)
    const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

    return categoryMatch && sellerMatch && searchMatch;
  });
}

function displayProducts(filteredProducts) {
  productListings.innerHTML = "";

  if (filteredProducts.length === 0) {
    productListings.innerHTML = `<p>No products found.</p>`;
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const img = document.createElement("img");
    img.className = "product-image";
    img.src = product.imageUrl || "https://via.placeholder.com/280x160?text=No+Image";
    img.alt = product.name || "Product Image";

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

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(price);
    card.appendChild(desc);
    card.appendChild(sellerInfo);

    productListings.appendChild(card);
  });
}

function updateUI() {
  createCategoryButtons();
  createSellerProfiles();

  const filteredProducts = filterProducts();
  displayProducts(filteredProducts);
}

// Search input event
searchBar.addEventListener("input", e => {
  searchTerm = e.target.value.trim();
  // reset seller filter when searching
  selectedSellerId = null;
  updateUI();
});

// Initialization
async function init() {
  await fetchSellers();
  await fetchProducts();
  updateUI();
}

init();
