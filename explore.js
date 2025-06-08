import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
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

const searchBar = document.getElementById("searchBar");
const categoryFilters = document.getElementById("categoryFilters");
const sellerProfiles = document.getElementById("sellerProfiles");
const productListings = document.getElementById("productListings");

let sellers = [];
let products = [];
let selectedCategory = "all";
let selectedSeller = null;

async function fetchSellers() {
  const q = query(collection(db, "sellers"), orderBy("businessName"));
  const snapshot = await getDocs(q);
  sellers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderSellers();
}

async function fetchProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderProducts();
}

function renderSellers() {
  sellerProfiles.innerHTML = "";
  sellers.forEach(seller => {
    const card = document.createElement("div");
    card.className = "seller-card" + (selectedSeller === seller.id ? " selected" : "");
    card.onclick = () => {
      selectedSeller = selectedSeller === seller.id ? null : seller.id;
      renderSellers();
      renderProducts();
    };

    const img = document.createElement("img");
    img.src = seller.logoUrl || "https://via.placeholder.com/100?text=Logo";
    img.alt = "Seller Logo";
    img.className = "w-20 h-20 rounded-full object-cover mb-2";

    const name = document.createElement("div");
    name.textContent = seller.businessName;
    name.className = "font-semibold text-sm text-center text-blue-700";

    const category = document.createElement("div");
    category.textContent = seller.category || "";
    category.className = "text-xs text-gray-500";

    const viewBtn = document.createElement("a");
    viewBtn.href = `seller.html?uid=${seller.id}`;
    viewBtn.textContent = "View Profile";
    viewBtn.className = "mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600";

    card.append(img, name, category, viewBtn);
    sellerProfiles.appendChild(card);
  });
}

function renderProducts() {
  const search = searchBar.value.toLowerCase();
  const filtered = products.filter(product => {
    const matchSearch =
      product.name?.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search);

    const matchCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    const matchSeller =
      !selectedSeller || product.sellerId === selectedSeller;

    return matchSearch && matchCategory && matchSeller;
  });

  productListings.innerHTML = filtered.length === 0
    ? '<p class="text-center text-gray-500 col-span-full">No products found.</p>'
    : "";

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 border rounded-xl shadow hover:shadow-lg transition";

    const img = document.createElement("img");
    img.src = p.imageUrl || "https://via.placeholder.com/200x140?text=No+Image";
    img.alt = p.name;
    img.className = "w-full h-40 object-cover rounded-lg mb-2";

    const name = document.createElement("h3");
    name.textContent = p.name || "Untitled";
    name.className = "text-lg font-semibold mb-1";

    const price = document.createElement("p");
    price.textContent = `Ksh ${p.price || "N/A"}`;
    price.className = "text-green-600 font-bold";

    const desc = document.createElement("p");
    desc.textContent = p.description || "";
    desc.className = "text-sm text-gray-600";

    card.append(img, name, price, desc);
    productListings.appendChild(card);
  });
}

searchBar.addEventListener("input", renderProducts);

categoryFilters.addEventListener("click", (e) => {
  if (e.target.dataset.category) {
    selectedCategory = e.target.dataset.category;
    document.querySelectorAll(".category-btn").forEach(btn =>
      btn.classList.toggle("selected", btn.dataset.category === selectedCategory)
    );
    renderProducts();
  }
});

await fetchSellers();
await fetchProducts();
