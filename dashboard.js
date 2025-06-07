// Firebase Setup
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

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
const auth = getAuth(app);
const db = getFirestore(app);
const cloudinaryUploadPreset = 'Jesmont';
const cloudinaryURL = 'https://api.cloudinary.com/v1_1/dxirsijbl/image/upload';

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = 'index.html';
  currentUser = user;

  document.getElementById('sellerEmail').textContent = user.email;

  const sellerRef = doc(db, 'sellers', user.uid);
  const sellerSnap = await getDoc(sellerRef);

  if (sellerSnap.exists()) {
    const data = sellerSnap.data();
    document.getElementById('businessName').textContent = data.businessName || "No Business Name";
    document.getElementById('profileLogo').src = data.logoURL || "https://via.placeholder.com/100";
    document.getElementById('nameInput').value = data.name || "";
    document.getElementById('businessInput').value = data.businessName || "";
  }

  loadProducts();
});

function loadProducts() {
  const productList = document.getElementById('productList');
  productList.innerHTML = '';

  const q = query(collection(db, 'products'), where('uid', '==', currentUser.uid));
  getDocs(q).then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.className = 'border p-3 rounded shadow';
      div.innerHTML = `
        <img src="${data.imageURL}" class="w-full h-40 object-cover rounded mb-2" />
        <h3 class="font-bold text-lg">${data.title}</h3>
        <p>${data.description}</p>
        <p class="text-blue-600 font-bold">Ksh ${data.price}</p>
        <button onclick="deleteProduct('${doc.id}')" class="mt-2 bg-red-500 text-white px-2 py-1 rounded">Delete</button>
      `;
      productList.appendChild(div);
    });
  });
}

window.deleteProduct = async (productId) => {
  await deleteDoc(doc(db, 'products', productId));
  loadProducts();
};

document.getElementById('logoutBtn').addEventListener('click', () => {
  signOut(auth);
});

document.getElementById('editProfileBtn').addEventListener('click', () => {
  document.getElementById('editProfileForm').classList.toggle('hidden');
});

document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('nameInput').value;
  const business = document.getElementById('businessInput').value;
  const file = document.getElementById('logoInput').files[0];

  let logoURL = "";
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryUploadPreset);

    const res = await axios.post(cloudinaryURL, formData);
    logoURL = res.data.secure_url;
  }

  await setDoc(doc(db, 'sellers', currentUser.uid), {
    uid: currentUser.uid,
    email: currentUser.email,
    name,
    businessName: business,
    logoURL
  }, { merge: true });

  location.reload();
});

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('titleInput').value;
  const description = document.getElementById('descInput').value;
  const price = parseInt(document.getElementById('priceInput').value);
  const category = document.getElementById('categoryInput').value;
  const file = document.getElementById('productImageInput').files[0];

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryUploadPreset);

  const res = await axios.post(cloudinaryURL, formData);
  const imageURL = res.data.secure_url;

  await addDoc(collection(db, 'products'), {
    title,
    description,
    price,
    category,
    imageURL,
    uid: currentUser.uid,
    createdAt: new Date()
  });

  e.target.reset();
  loadProducts();
});
