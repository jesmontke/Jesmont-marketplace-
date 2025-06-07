// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dxirsijbl/image/upload";
const UPLOAD_PRESET = "jesmont";

const businessName = document.getElementById("businessName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const category = document.getElementById("category");
const logo = document.getElementById("logo");

const productList = document.getElementById("product-list");
const uploadBtn = document.getElementById("upload-btn");
const uploadModal = document.getElementById("upload-modal");
const cancelUpload = document.getElementById("cancel-upload");
const uploadForm = document.getElementById("upload-form");

uploadBtn.addEventListener("click", () => uploadModal.classList.remove("hidden"));
cancelUpload.addEventListener("click", () => uploadModal.classList.add("hidden"));

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;
    const sellerRef = doc(db, "sellers", uid);
    const sellerSnap = await getDoc(sellerRef);

    if (sellerSnap.exists()) {
      const data = sellerSnap.data();
      businessName.textContent = data.businessName;
      email.textContent = data.email;
      phone.textContent = data.phone;
      category.textContent = data.category;
      logo.src = data.logoURL || "https://via.placeholder.com/100";

      loadProducts(uid);
    }
  } else {
    window.location.href = "login.html";
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  signOut(auth);
});

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const name = document.getElementById("product-name").value;
  const description = document.getElementById("product-description").value;
  const price = parseFloat(document.getElementById("product-price").value);
  const imageFile = document.getElementById("product-image").files[0];

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const cloudRes = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData
    });
    const cloudData = await cloudRes.json();
    const imageUrl = cloudData.secure_url;

    await addDoc(collection(db, "products"), {
      sellerId: user.uid,
      name,
      description,
      price,
      imageUrl,
      createdAt: new Date()
    });

    alert("Product uploaded successfully");
    uploadForm.reset();
    uploadModal.classList.add("hidden");
    loadProducts(user.uid);
  } catch (error) {
    console.error("Upload failed:", error);
    alert("Failed to upload product.");
  }
});

async function loadProducts(uid) {
  productList.innerHTML = "";
  const q = query(collection(db, "products"), where("sellerId", "==", uid));
  const querySnap = await getDocs(q);
  querySnap.forEach(doc => {
    const product = doc.data();
    const card = document.createElement("div");
    card.className = "bg-white border rounded shadow p-4";
    card.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-40 object-cover rounded mb-2"/>
      <h3 class="font-semibold">${product.name}</h3>
      <p class="text-sm text-gray-600">${product.description}</p>
      <p class="text-green-600 font-bold mt-1">KES ${product.price}</p>
    `;
    productList.appendChild(card);
  });
}
