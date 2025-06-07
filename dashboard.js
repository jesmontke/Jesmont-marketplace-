// Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDlakKgMzhADOywIOg4iTCJ5sUFXLMGwVg",
  authDomain: "jesmont-marketplace.firebaseapp.com",
  projectId: "jesmont-marketplace",
  storageBucket: "jesmont-marketplace.appspot.com",
  messagingSenderId: "543717950238",
  appId: "1:543717950238:web:df009d49e88a2ea010bf0f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Elements
const logoutBtn = document.getElementById("logout-btn");
const productForm = document.getElementById("upload-form");
const productList = document.getElementById("product-list");
const uploadBtn = document.getElementById("upload-btn");
const uploadModal = document.getElementById("upload-modal");
const cancelUpload = document.getElementById("cancel-upload");

const businessNameEl = document.getElementById("businessName");
const emailEl = document.getElementById("email");
const phoneEl = document.getElementById("phone");
const categoryEl = document.getElementById("category");
const logoEl = document.getElementById("logo");

// Auth Check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const sellerDoc = await getDoc(doc(db, "sellers", user.uid));
    if (sellerDoc.exists()) {
      const data = sellerDoc.data();
      businessNameEl.textContent = data.businessName || "Business Name";
      emailEl.textContent = data.email || user.email;
      phoneEl.textContent = data.phone || "N/A";
      categoryEl.textContent = data.category || "Uncategorized";
      logoEl.src = data.logoURL || "https://via.placeholder.com/100";
      loadProducts(user.uid);
    } else {
      alert("Seller profile not found.");
    }
  } catch (err) {
    console.error("Error loading seller:", err);
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});

// Upload modal toggle
uploadBtn.addEventListener("click", () => {
  uploadModal.classList.remove("hidden");
});

cancelUpload.addEventListener("click", () => {
  uploadModal.classList.add("hidden");
});

// Product Upload
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const name = document.getElementById("product-name").value;
  const price = document.getElementById("product-price").value;
  const description = document.getElementById("product-description").value;
  const imageFile = document.getElementById("product-image").files[0];

  try {
    const imageRef = ref(storage, `products/${user.uid}/${Date.now()}-${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);

    await addDoc(collection(db, "products"), {
      uid: user.uid,
      name,
      price,
      description,
      imageUrl,
      createdAt: new Date()
    });

    productForm.reset();
    uploadModal.classList.add("hidden");
    loadProducts(user.uid);
  } catch (err) {
    console.error("Upload error:", err);
    alert("Error uploading product.");
  }
});

// Load Products
async function loadProducts(uid) {
  productList.innerHTML = "";

  const q = query(collection(db, "products"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "border p-4 rounded-lg shadow flex flex-col";

    card.innerHTML = `
      <img src="${data.imageUrl}" alt="${data.name}" class="w-full h-48 object-cover rounded mb-3">
      <h4 class="text-lg font-bold">${data.name}</h4>
      <p class="text-sm text-gray-600">${data.description}</p>
      <p class="text-green-700 font-semibold mt-2">Ksh ${data.price}</p>
      <div class="mt-4 flex justify-between">
        <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm" data-id="${docSnap.id}">Delete</button>
      </div>
    `;

    card.querySelector("[data-id]").addEventListener("click", async () => {
      if (confirm("Delete this product?")) {
        await deleteDoc(doc(db, "products", docSnap.id));
        loadProducts(uid);
      }
    });

    productList.appendChild(card);
  });
}
