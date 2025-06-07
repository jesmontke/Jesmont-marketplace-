// ✅ Firebase Config (yours)
const firebaseConfig = {
  apiKey: "AIzaSyDlakKgMzhADOywIOg4iTCJ5sUFXLMGwVg",
  authDomain: "jesmont-marketplace.firebaseapp.com",
  projectId: "jesmont-marketplace",
  storageBucket: "jesmont-marketplace.firebasestorage.app",
  messagingSenderId: "543717950238",
  appId: "1:543717950238:web:df009d49e88a2ea010bf0f",
  measurementId: "G-56TMB41PS8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 🔐 Auth Check
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadProfile(user);
    loadProducts(user.uid);
  }
});

// 👤 Display profile
function loadProfile(user) {
  document.getElementById("profile").innerHTML = `
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>User ID:</strong> ${user.uid}</p>
    <button onclick="logout()" class="mt-2 bg-red-500 text-white px-3 py-1 rounded">Logout</button>
  `;
}

function logout() {
  auth.signOut().then(() => window.location.href = "login.html");
}

// 🛒 Add Product
document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("productName").value;
  const description = document.getElementById("productDescription").value;
  const price = parseFloat(document.getElementById("productPrice").value);
  const imageFile = document.getElementById("productImage").files[0];
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in");

  // 🌩 Upload to Cloudinary
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", "Jesmont");

  const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dxirsijbl/image/upload", {
    method: "POST",
    body: formData
  });

  const cloudData = await cloudRes.json();
  const imageUrl = cloudData.secure_url;

  // 📝 Save to Firestore
  await db.collection("products").add({
    uid: user.uid,
    name,
    description,
    price,
    imageUrl,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  e.target.reset();
  loadProducts(user.uid);
});

// 📦 Load Products
async function loadProducts(uid) {
  const list = document.getElementById("productList");
  list.innerHTML = "<p>Loading...</p>";

  const snapshot = await db.collection("products")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  if (snapshot.empty) return (list.innerHTML = "<p>No products found.</p>");
  list.innerHTML = "";

  snapshot.forEach(doc => {
    const product = doc.data();
    list.innerHTML += `
      <div class="bg-white p-4 rounded shadow border">
        <img src="${product.imageUrl}" class="w-full h-40 object-cover mb-2 rounded" />
        <h3 class="font-bold">${product.name}</h3>
        <p>${product.description}</p>
        <p class="text-green-600 font-semibold">Ksh ${product.price}</p>
        <button onclick="deleteProduct('${doc.id}')" class="mt-2 bg-red-600 text-white px-3 py-1 rounded">Delete</button>
      </div>
    `;
  });
}

// 🗑 Delete product
async function deleteProduct(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    await db.collection("products").doc(id).delete();
    loadProducts(auth.currentUser.uid);
  }
}
