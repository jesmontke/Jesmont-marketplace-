import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
const auth = getAuth();
const db = getFirestore(app);

// DOM Elements
const businessNameEl = document.getElementById("businessName");
const sellerEmailEl = document.getElementById("sellerEmail");
const profileLogo = document.getElementById("profileLogo");
const productList = document.getElementById("productList");
const productForm = document.getElementById("productForm");
const toggleProductFormBtn = document.getElementById("toggleProductFormBtn");
const logoutBtn = document.getElementById("logoutBtn");
const editProfileBtn = document.getElementById("editProfileBtn");
const editProfileForm = document.getElementById("editProfileForm");

let currentUser;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const docRef = doc(db, "sellers", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("Seller data:", data);

      businessNameEl.textContent = data.businessName || "No business name set";
      sellerEmailEl.textContent = data.email || user.email || "No email set";
      profileLogo.src = data.logoURL || "https://via.placeholder.com/100";

      // Prefill Edit Profile inputs:
      document.getElementById("nameInput").value = data.fullName || "";
      document.getElementById("businessInput").value = data.businessName || "";
    } else {
      console.warn("No seller document found for UID:", user.uid);
      businessNameEl.textContent = "No business data found";
      sellerEmailEl.textContent = user.email || "No email";
      profileLogo.src = "https://via.placeholder.com/100";
    }

    displayProducts();
  } else {
    // No user logged in, redirect to login page (index.html)
    window.location.href = "index.html";
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});

toggleProductFormBtn.addEventListener("click", () => {
  productForm.classList.toggle("hidden");
});

editProfileBtn.addEventListener("click", () => {
  editProfileForm.classList.toggle("hidden");
});

editProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("nameInput").value.trim();
  const business = document.getElementById("businessInput").value.trim();
  const logoFile = document.getElementById("logoInput").files[0];

  let logoURL = profileLogo.src;

  if (logoFile) {
    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", logoFile);
    formData.append("upload_preset", "Jesmont");

    const res = await fetch("https://api.cloudinary.com/v1_1/dxirsijbl/image/upload", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    logoURL = data.secure_url;
  }

  const sellerDoc = doc(db, "sellers", currentUser.uid);
  await updateDoc(sellerDoc, {
    fullName: name,
    businessName: business,
    logoURL
  });

  alert("Profile updated successfully!");
  // Update UI immediately
  businessNameEl.textContent = business;
  profileLogo.src = logoURL;
  editProfileForm.classList.add("hidden");
});

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("titleInput").value.trim();
  const category = document.getElementById("categoryInput").value.trim();
  const description = document.getElementById("descInput").value.trim();
  const price = parseFloat(document.getElementById("priceInput").value);
  const imageFile = document.getElementById("productImageInput").files[0];

  if (!imageFile) {
    alert("Please select a product image.");
    return;
  }

  // Upload product image to Cloudinary
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", "Jesmont");

  const response = await fetch("https://api.cloudinary.com/v1_1/dxirsijbl/image/upload", {
    method: "POST",
    body: formData
  });
  const imageData = await response.json();

  // Save product to Firestore
  await addDoc(collection(db, "products"), {
    title,
    category,
    description,
    price,
    imageUrl: imageData.secure_url,
    sellerId: currentUser.uid,
    createdAt: new Date()
  });

  alert("Product added successfully!");
  productForm.reset();
  productForm.classList.add("hidden");

  displayProducts();
});

async function displayProducts() {
  productList.innerHTML = "";

  // Query products where sellerId == currentUser.uid, ordered by date desc
  const q = query(
    collection(db, "products"),
    where("sellerId", "==", currentUser.uid),
    order by("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    productList.innerHTML = "<p class='text-gray-500'>No products uploaded yet.</p>";
    return;
  }

  querySnapshot.forEach((docSnap) => {
    const product = docSnap.data();
    const id = docSnap.id;

    const card = document.createElement("div");
    card.className = "border rounded p-4 bg-white shadow";

    card.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.title}" class="w-full h-48 object-cover rounded mb-3" />
      <h4 class="text-lg font-semibold mb-1">${product.title}</h4>
      <p class="text-gray-600 mb-1">${product.description}</p>
      <p class="font-bold mb-2">KSh ${product.price.toFixed(2)}</p>
      <button data-id="${id}" class="deleteBtn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Delete</button>
    `;

    productList.appendChild(card);
  });

  // Add event listeners for all delete buttons
  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productId = e.target.dataset.id;
      if (confirm("Are you sure you want to delete this product?")) {
        await deleteDoc(doc(db, "products", productId));
        displayProducts();
      }
    });
  });
}
