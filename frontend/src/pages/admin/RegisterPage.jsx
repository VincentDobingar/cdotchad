import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [motdepasse, setMotdepasse] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("/api/utilisateurs/register", {
        email,
        motdepasse,
      });

      toast.success("Inscription réussie !");
      navigate("/login");
    } catch (err) {
      console.error("Erreur inscription :", err);
      toast.error(err.response?.data?.message || "Erreur à l'inscription");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Créer un compte</h2>

        <label className="block text-gray-700 mb-2">Email</label>
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-4"
        />

        <label className="block text-gray-700 mb-2">Mot de passe</label>
        <input
          type="password"
          value={motdepasse}
          required
          onChange={(e) => setMotdepasse(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-4"
        />

        <button
          type="submit"
          className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
        >
          S'inscrire
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
