import { useState } from "react";
import api from "@/utils/api";
import toast from "react-hot-toast";

export default function FormReferent({ onSuccess }) {
  const [nom, setNom] = useState("");
  const [resume, setResume] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nom", nom);
    formData.append("resume", resume);
    formData.append("description", description);
    if (logo) formData.append("logo", logo);

    try {
      await api.post("/referents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Référent ajouté avec succès !");
      setNom("");
      setResume("");
      setDescription("");
      setLogo(null);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'ajout du référent.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <input
        type="text"
        placeholder="Nom"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        placeholder="Résumé"
        value={resume}
        onChange={(e) => setResume(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        placeholder="Description complète"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
      >
        Ajouter
      </button>
    </form>
  );
}
