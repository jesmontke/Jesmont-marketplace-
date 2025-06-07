// Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

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

// DOM Elements
const sellerName = document.getElementById("seller-name");
const sellerEmail = document.getElementById("seller-email");
const sellerPhone = document.getElementById("seller-phone");
const sellerLogo = document.getElementById("seller-logo");
const logoutBtn = document.getElementById("logout");
const productForm = document.getElementById("product-form");
const productList = document.getElementById("product-list");

// AUTH CHECK & LOAD PROFILE + PRODUCTS
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const sellerRef = doc(db, "sellers", user.uid);
    const sellerSnap = await getDoc(sellerRef);

    if (sellerSnap.exists()) {
      const sellerData = sellerSnap.data();

      sellerName.textContent = sellerData.businessName || "Business Name";
      sellerEmail.textContent = "Email: " + (sellerData.email || user.email);
      sellerPhone.textContent = "Phone: " + (sellerData.phone || "N/A");
      sellerLogo.src = sellerData.logoURL || "https://via.placeholder.com/100";

      loadProducts(user.uid);
    } else {
      alert("Seller profile not found.");
    }
  } catch (error) {
    console.error("Error loading seller data:", error);
  }
});

// LOGOUT
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});

// UPLOAD PRODUCT
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("product-name").value;
  const price = document.getElementById("product-price").value;
  const description = document.getElementById("product-description").value;
  const imageFile = document.getElementById("product-image").files[0];

  const user = auth.currentUser;
  if (!user || !imageFile) return;

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
    loadProducts(user.uid);
  } catch (err) {
    console.error("Error uploading product:", err);
    alert("Error uploading product");
  }
});

// LOAD PRODUCTS
async function loadProducts(uid) {
  productList.innerHTML = "";

  try {
    const q = query(collection(db, "products"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const productCard = document.createElement("div");
      productCard.className = "border p-4 rounded-lg shadow flex flex-col";

      productCard.innerHTML = `
        <img src="${data.imageUrl}" alt="${data.name}" class="w-full h-48 object-cover rounded mb-3">
        <h4 class="text-lg font-bold">${data.name}</h4>
        <p class="text-sm text-gray-600">${data.description}</p>
        <p class="text-green-700 font-semibold mt-2">Ksh ${data.price}</p>
        <div class="mt-4 flex justify-between">
          <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">Edit</button>
          <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm" data-id="${docSnap.id}">Delete</button>
        </div>
      `;

      productCard.querySelector("[data-id]").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this product?")) {
          await deleteDoc(doc(db, "products", docSnap.id));
          loadProducts(uid);
        }
      });

      productList.appendChild(productCard);
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
}
