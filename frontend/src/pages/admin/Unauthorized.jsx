import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-5xl font-bold text-red-600 mb-4">Accès refusé</h1>
      <p className="text-gray-700 text-lg mb-6">
        Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
      </p>
      <Link
        to="/admin"
        className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}
