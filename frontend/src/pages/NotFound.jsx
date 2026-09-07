// src/pages/NotFound.jsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
      <img
        src="/images/logo-cdo.png"
        alt="CDO TCHAD"
        className="w-28 h-auto mb-4"
      />

      <h1 className="text-6xl font-extrabold text-red-700 mb-2 animate-pulse">
        404
      </h1>

      <p className="text-lg text-gray-700 mb-6">
        Oups ! La page que vous cherchez n'existe pas.
      </p>

      <Link
        to="/"
        className="bg-red-700 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded shadow transition"
      >
        Retour à l’accueil
      </Link>

      <p className="mt-2 text-sm text-gray-500">
        Redirection automatique vers l’accueil dans quelques secondes...
      </p>
    </div>
  );
}