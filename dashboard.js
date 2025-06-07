import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
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
  storageBucket: "jesmont-marketplace.appspot.com",
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
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  const docRef = doc(db, "sellers", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    businessNameEl.textContent = data.businessName || "No business name";
    sellerEmailEl.textContent = data.email || user.email;
    profileLogo.src = data.logoURL || "https://via.placeholder.com/100";

    document.getElementById("nameInput").value = data.fullName || "";
    document.getElementById("businessInput").value = data.businessName || "";
  } else {
    businessNameEl.textContent = "No seller data";
    sellerEmailEl.textContent = user.email;
  }

  displayProducts();
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

  const name = document.getElementById("nameInput").value;
  const business = document.getElementById("businessInput").value;
  const logoFile = document.getElementById("logoInput").files[0];
  let logoURL = profileLogo.src;

  if (logoFile) {
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

  const sellerRef = doc(db, "sellers", currentUser.uid);
  await updateDoc(sellerRef, {
    fullName: name,
    businessName: business,
    logoURL
  });

  businessNameEl.textContent = business;
  profileLogo.src = logoURL;
  editProfileForm.classList.add("hidden");
  alert("Profile updated");
});

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("titleInput").value;
  const category = document.getElementById("categoryInput").value;
  const description = document.getElementById("descInput").value;
  const price = parseFloat(document.getElementById("priceInput").value);
  const imageFile = document.getElementById("productImageInput").files[0];

  if (!imageFile) {
    alert("Please upload a product image.");
    return;
  }

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", "Jesmont");

  const uploadRes = await fetch("https://api.cloudinary.com/v1_1/dxirsijbl/image/upload", {
    method: "POST",
    body: formData
  });
  const uploadData = await uploadRes.json();

  await addDoc(collection(db, "products"), {
    title,
    category,
    description,
    price,
    imageUrl: uploadData.secure_url,
    sellerId: currentUser.uid,
    createdAt: new Date()
  });

  productForm.reset();
  productForm.classList.add("hidden");
  displayProducts();
});

async function displayProducts() {
  productList.innerHTML = "<p>Loading products...</p>";

  try {
    const q = query(
      collection(db, "products"),
      where("sellerId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      productList.innerHTML = "<p class='text-gray-500'>No products uploaded yet.</p>";
      return;
    }

    productList.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const product = docSnap.data();
      const id = docSnap.id;

      const card = document.createElement("div");
      card.className = "border p-4 rounded bg-white shadow";

      card.innerHTML = `
        <img src="${product.imageUrl}" class="w-full h-48 object-cover rounded mb-3" />
        <h4 class="text-lg font-semibold">${product.title}</h4>
        <p>${product.description}</p>
        <p class="font-bold text-green-600">KSh ${product.price.toFixed(2)}</p>
        <button data-id="${id}" class="deleteBtn bg-red-500 text-white px-3 py-1 rounded mt-2">Delete</button>
      `;

      card.querySelector(".deleteBtn").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this product?")) {
          await deleteDoc(doc(db, "products", id));
          displayProducts();
        }
      });

      productList.appendChild(card);
    });
  } catch (error) {
    console.error("Error displaying products:", error);
    productList.innerHTML = `<p class="text-red-500">Error loading products: ${error.message}</p>`;
  }
}
