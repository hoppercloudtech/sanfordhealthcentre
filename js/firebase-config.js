/* ============================================================
   sanford HEALTH CENTRE — Firebase Configuration
   ------------------------------------------------------------
   1. Go to https://console.firebase.google.com
   2. Create a project (or use an existing one)
   3. Add a Web App to the project, copy the config object
      it gives you and paste the values below.
   4. Enable "Cloud Firestore" (Build > Firestore Database > Create database)
   5. Enable "Authentication" > Sign-in method > Email/Password
      (this is how you log in to the admin dashboard)
   6. Create your first admin user under Authentication > Users
   ============================================================ */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (compat SDK loaded via <script> tags in HTML)
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

/* Firestore collections used across the site */
const COLLECTIONS = {
  products: "products",
  events: "events",
  gallery: "gallery"
};
