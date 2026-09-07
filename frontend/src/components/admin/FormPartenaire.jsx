import { useState } from "react";
import api from "@/utils/api";
import toast from "react-hot-toast";

export default function FormPartenaire({ onSuccess }) {
  const [nom, setNom] = useState("");
  const [resume, setResume] = useState("");
  const [logo, setLogo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nom", nom);
    formData.append("resume", resume);
    if (logo) formData.append("logo", logo);

    try {
      await api.post("/partenaires", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Partenaire ajouté avec succès !");
      setNom("");
      setResume("");
      setLogo(null);
      onSuccess?.(); // recharge la liste
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'ajout du partenaire.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <input
        type="text"
        placeholder="Nom du partenaire"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        placeholder="Résumé du partenaire"
        value={resume}
        onChange={(e) => setResume(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setLogo(e.target.files[0])}
        className="w-full"
      />
      <button
        type="submit"
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Ajouter
      </button>
    </form>
  );
}
