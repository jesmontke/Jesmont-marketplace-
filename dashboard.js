// Firebase config
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

// Cloudinary
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dxirsijbl/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'Jesmont';

let currentUser;

// Auth state
auth.onAuthStateChanged(async user => {
  if (!user) return (window.location.href = 'index.html');
  currentUser = user;

  document.getElementById('sellerEmail').textContent = user.email;

  const sellerDoc = await db.collection('sellers').doc(user.uid).get();
  if (sellerDoc.exists) {
    const data = sellerDoc.data();
    document.getElementById('nameInput').value = data.name || '';
    document.getElementById('businessInput').value = data.business || '';
    document.getElementById('businessName').textContent = data.business || 'Business Name';
    document.getElementById('profileLogo').src = data.logo || '';
  }

  loadProducts();
});

// Show Edit Form
function showEditForm() {
  document.getElementById('editSection').classList.toggle('hidden');
}

// Edit Profile
document.getElementById('profileForm').addEventListener('submit', async e => {
  e.preventDefault();

  const name = document.getElementById('nameInput').value;
  const business = document.getElementById('businessInput').value;
  const logoFile = document.getElementById('logoInput').files[0];

  let logoUrl = document.getElementById('profileLogo').src;

  if (logoFile) {
    const formData = new FormData();
    formData.append('file', logoFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    logoUrl = data.secure_url;
  }

  await db.collection('sellers').doc(currentUser.uid).set({
    name,
    business,
    logo: logoUrl,
    email: currentUser.email
  });

  document.getElementById('businessName').textContent = business;
  document.getElementById('profileLogo').src = logoUrl;
  document.getElementById('editSection').classList.add('hidden');
});

// Add Product
document.getElementById('productForm').addEventListener('submit', async e => {
  e.preventDefault();

  const name = document.getElementById('productName').value;
  const description = document.getElementById('productDescription').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const category = document.getElementById('productCategory').value;
  const imageFile = document.getElementById('productImage').files[0];

  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
  const data = await res.json();
  const imageUrl = data.secure_url;

  await db.collection('products').add({
    sellerId: currentUser.uid,
    name,
    description,
    price,
    category,
    image: imageUrl,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  e.target.reset();
  loadProducts();
});

// Load Products
async function loadProducts() {
  const snapshot = await db
    .collection('products')
    .where('sellerId', '==', currentUser.uid)
    .orderBy('createdAt', 'desc')
    .get();

  const productList = document.getElementById('productList');
  productList.innerHTML = '';

  snapshot.forEach(doc => {
    const product = doc.data();
    const card = document.createElement('div');
    card.className = 'bg-white p-3 rounded shadow';
    card.innerHTML = `
      <img src="${product.image}" class="w-full h-32 object-cover rounded mb-2" />
      <h4 class="font-bold">${product.name}</h4>
      <p class="text-sm">${product.description}</p>
      <p class="text-green-600 font-semibold">Ksh ${product.price}</p>
      <p class="text-xs text-gray-500">Category: ${product.category}</p>
      <button class="mt-2 bg-red-600 text-white px-3 py-1 rounded" onclick="deleteProduct('${doc.id}')">Delete</button>
    `;
    productList.appendChild(card);
  });
}

// Delete Product
async function deleteProduct(id) {
  await db.collection('products').doc(id).delete();
  loadProducts();
}

// Logout
function logout() {
  auth.signOut();
}
