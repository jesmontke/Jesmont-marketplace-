// dashboard.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Cloudinary config - replace with your own Cloudinary details
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/<your-cloud-name>/upload";
const CLOUDINARY_UPLOAD_PRESET = "<your-upload-preset>";

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

// Elements
const logoutBtn = document.getElementById("logout-btn");

const businessNameEl = document.getElementById("businessName");
const emailEl = document.getElementById("email");
const phoneEl = document.getElementById("phone");
const categoryEl = document.getElementById("category");
const logoEl = document.getElementById("logo");

const productList = document.getElementById("product-list");

const uploadModal = document.getElementById("upload-modal");
const uploadBtn = document.getElementById("upload-btn");
const cancelUploadBtn = document.getElementById("cancel-upload");
const uploadForm = document.getElementById("upload-form");

const editProfileBtn = document.getElementById("edit-profile-btn");
const editProfileModal = document.getElementById("edit-profile-modal");
const cancelEditBtn = document.getElementById("cancel-edit");
const editProfileForm = document.getElementById("edit-profile-form");

let currentUserUid = null;

// UTILITIES for modals
function showModal(modal) {
  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.add("active"), 10);
}
function hideModal(modal) {
  modal.classList.remove("active");
  setTimeout(() => modal.classList.add("hidden"), 300);
}

// AUTH & LOAD PROFILE & PRODUCTS
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUserUid = user.uid;

  try {
    const sellerDocRef = doc(db, "sellers", user.uid);
    const sellerDocSnap = await getDoc(sellerDocRef);

    if (sellerDocSnap.exists()) {
      const data = sellerDocSnap.data();

      businessNameEl.textContent = data.businessName || "No Business Name";
      emailEl.textContent = data.email || user.email;
      phoneEl.textContent = data.phone || "N/A";
      categoryEl.textContent = data.category || "Uncategorized";
      logoEl.src = data.logoURL || "https://via.placeholder.com/100";

      // Pre-fill edit form
      editProfileForm["edit-businessName"].value = data.businessName || "";
      editProfileForm["edit-phone"].value = data.phone || "";
      editProfileForm["edit-category"].value = data.category || "";
      editProfileForm["edit-logoURL"].value = data.logoURL || "";

      loadProducts(user.uid);
    } else {
      alert("Seller profile not found.");
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
});

// LOGOUT
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});

// OPEN UPLOAD MODAL
uploadBtn.addEventListener("click", () => {
  showModal(uploadModal);
});

// CANCEL UPLOAD MODAL
cancelUploadBtn.addEventListener("click", () => {
  uploadForm.reset();
  hideModal(uploadModal);
});

// UPLOAD PRODUCT FORM SUBMIT
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = uploadForm["product-name"].value.trim();
  const description = uploadForm["product-description"].value.trim();
  const price = Number(uploadForm["product-price"].value);
  const imageFile = uploadForm["product-image"].files[0];

  if (!imageFile) {
    alert("Please select an image.");
    return;
  }

  // Upload image to Cloudinary
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error.message);
    }

    const imageURL = data.secure_url;

    // Save product to Firestore
    await addDoc(collection(db, "products"), {
      sellerUid: currentUserUid,
      name,
      description,
      price,
      imageURL,
      createdAt: new Date(),
    });

    alert("Product uploaded successfully!");

    uploadForm.reset();
    hideModal(uploadModal);
    loadProducts(currentUserUid);
  } catch (err) {
    console.error("Upload failed:", err);
    alert("Failed to upload product.");
  }
});

// LOAD PRODUCTS
async function loadProducts(uid) {
  productList.innerHTML = "";
  const q = query(collection(db, "products"), where("sellerUid", "==", uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    productList.innerHTML = "<p class='text-gray-500'>No products uploaded yet.</p>";
    return;
  }

  querySnapshot.forEach((docSnap) => {
    const prod = docSnap.data();
    const prodId = docSnap.id;

    const card = document.createElement("div");
    card.className = "border rounded shadow p-4 bg-white";

    card.innerHTML = `
      <img src="${prod.imageURL}" alt="${prod.name}" class="w-full h-48 object-cover rounded mb-3" />
      <h3 class="text-lg font-semibold mb-1">${prod.name}</h3>
      <p class="text-sm mb-2">${prod.description}</p>
      <p class="font-bold mb-3">KSh ${prod.price.toLocaleString()}</p>
      <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" data-id="${prodId}">Delete</button>
    `;

    productList.appendChild(card);
  });

  // Attach delete listeners
  productList.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const prodId = btn.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this product?")) {
        try {
          await deleteDoc(doc(db, "products", prodId));
          alert("Product deleted!");
          loadProducts(currentUserUid);
        } catch (err) {
          console.error("Delete failed:", err);
          alert("Failed to delete product.");
        }
      }
    });
  });
}

// EDIT PROFILE MODAL OPEN
editProfileBtn.addEventListener("click", () => {
  showModal(editProfileModal);
});

// CANCEL EDIT PROFILE
cancelEditBtn.addEventListener("click", () => {
  hideModal(editProfileModal);
});

// EDIT PROFILE FORM SUBMIT
editProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const updatedBusinessName = editProfileForm["edit-businessName"].value.trim();
  const updatedPhone = editProfileForm["edit-phone"].value.trim();
  const updatedCategory = editProfileForm["edit-category"].value.trim();
  const updatedLogoURL = editProfileForm["edit-logoURL"].value.trim();

  if (!updatedBusinessName || !updatedPhone || !updatedCategory) {
    alert("Please fill all required fields.");
    return;
  }

  try {
    const sellerDocRef = doc(db, "sellers", currentUserUid);

    await updateDoc(sellerDocRef, {
      businessName: updatedBusinessName,
      phone: updatedPhone,
      category: updatedCategory,
      logoURL: updatedLogoURL,
    });

    // Update UI immediately
    businessNameEl.textContent = updatedBusinessName;
    phoneEl.textContent = updatedPhone;
    categoryEl.textContent = updatedCategory;
    logoEl.src = updatedLogoURL || "https://via.placeholder.com/100";

    alert("Profile updated!");
    hideModal(editProfileModal);
  } catch (err) {
    console.error("Profile update failed:", err);
    alert("Failed to update profile.");
  }
});
