// 📁 src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // 👉 ajouter ici

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Safe Storage Shim: évite DOMException si storage est bloqué --- //
(function () {
  // crée un storage en mémoire si le vrai lève une SecurityError
  const makeMemoryStorage = () => {
    const store = new Map();
    return {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(String(k), String(v)); },
      removeItem: k => { store.delete(String(k)); },
      clear: () => { store.clear(); },
      key: i => Array.from(store.keys())[i] ?? null,
      get length() { return store.size; },
    };
  };

  try {
    const k = "__probe__";
    window.sessionStorage.setItem(k, "1");
    window.sessionStorage.removeItem(k);
  } catch (e) {
    console.warn("⚠️ sessionStorage indisponible → utilisation d’un shim en mémoire");
    window.sessionStorage = makeMemoryStorage();
  }

  try {
    const k = "__probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
  } catch (e) {
    console.warn("⚠️ localStorage indisponible → utilisation d’un shim en mémoire");
    window.localStorage = makeMemoryStorage();
  }
})();


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider> {/* 🌗 englobe toute l’application */}
        <AuthProvider>
          <App />
          <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
