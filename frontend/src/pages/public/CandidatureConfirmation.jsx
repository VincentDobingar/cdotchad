// frontend/pages/CandidatureConfirmation.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CandidatureConfirmation() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/offres");
    }, 8000); // Redirige après 8 secondes

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="max-w-xl mx-auto text-center py-16 px-4">
      <div className="text-green-600 text-6xl mb-4 animate-bounce">✅</div>
      <h1 className="text-2xl font-bold text-green-700 mb-2">Candidature envoyée !</h1>
      <p className="text-gray-600">Merci pour votre intérêt. Vous allez être redirigé automatiquement...</p>
    </div>
  );
}
