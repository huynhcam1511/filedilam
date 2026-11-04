// Firebase configuration for localhost and fallback
var firebaseConfig = {
  apiKey: "AIzaSyDBO9kY1C9SXuTLkbIxpVDwu8ynJtt4eQY",
  authDomain: "filedilam.firebaseapp.com",
  databaseURL: "https://filedilam-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "filedilam",
  storageBucket: "filedilam.firebasestorage.app",
  messagingSenderId: "808461994761",
  appId: "1:808461994761:web:filedilam"
};

if (typeof firebase !== 'undefined' && (!firebase.apps || !firebase.apps.length)) {
  firebase.initializeApp(firebaseConfig);
}
