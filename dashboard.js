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
  updateDoc
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
      businessNameEl.textContent = data.businessName;
      sellerEmailEl.textContent = data.email;
      if (data.logoURL) profileLogo.src = data.logoURL;
    }

    displayProducts();
  } else {
    window.location.href = "index.html";
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "index.html");
});

toggleProductFormBtn.addEventListener("click", () => {
  productForm.classList.toggle("hidden");
});

editProfileBtn.addEventListener("click", () => {
  editProfileForm.classList.toggle("hidden");
});

document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("nameInput").value;
  const business = document.getElementById("businessInput").value;
  const logo = document.getElementById("logoInput").files[0];

  let logoURL = "";
  if (logo) {
    const formData = new FormData();
    formData.append("file", logo);
    formData.append("upload_preset", "Jesmont");

    const res = await fetch("https://api.cloudinary.com/v1_1/dxirsijbl/image/upload", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    logoURL = data.secure_url;
  }

  const docRef = doc(db, "sellers", currentUser.uid);
  await updateDoc(docRef, {
    fullName: name,
    businessName: business,
    logoURL: logoURL || profileLogo.src
  });

  alert("Profile updated");
  location.reload();
});

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("titleInput").value;
  const category = document.getElementById("categoryInput").value;
  const description = document.getElementById("descInput").value;
  const price = document.getElementById("priceInput").value;
  const imageFile = document.getElementById("productImageInput").files[0];

  if (!imageFile) return alert("Please select an image");

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", "Jesmont");

  const response = await fetch("https://api.cloudinary.com/v1_1/dxirsijbl/image/upload", {
    method: "POST",
    body: formData
  });
  const imageData = await response.json();

  await addDoc(collection(db, "products"), {
    title,
    category,
    description,
    price,
    imageUrl: imageData.secure_url,
    sellerId: currentUser.uid,
    createdAt: new Date()
  });

  alert("Product added");
  productForm.reset();
  displayProducts();
});

async function displayProducts() {
  productList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "products"));
  querySnapshot.forEach((docSnap) => {
    const product = docSnap.data();
    if (product.sellerId === currentUser.uid) {
      const div = document.createElement("div");
      div.className = "bg-white p-4 rounded shadow";
      div.innerHTML = `
        <img src="${product.imageUrl}" class="w-full h-40 object-cover rounded mb-2">
        <h3 class="text-lg font-semibold">${product.title}</h3>
        <p class="text-sm text-gray-600">${product.description}</p>
        <p class="text-green-600 font-bold">KSh ${product.price}</p>
        <button data-id="${docSnap.id}" class="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded deleteBtn">Delete</button>
      `;
      productList.appendChild(div);
    }
  });

  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");
      await deleteDoc(doc(db, "products", id));
      displayProducts();
    });
  });
}
