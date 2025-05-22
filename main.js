import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Example function for seller registration
async function registerSeller(email, password, businessName) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;
  await addDoc(collection(db, "sellers"), {
    uid: user.uid,
    businessName,
    email
  });
}

// Example function for image upload
async function uploadLogo(file, userId) {
  const fileRef = ref(storage, `logos/${userId}/${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}
