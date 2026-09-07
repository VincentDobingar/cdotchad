import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { saveActualite, fetchActualiteById } from "@/utils/adminApi";

export default function FormActualite() {
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [resume, setResume] = useState("");
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [datePublication, setDatePublication] = useState(new Date().toISOString().split("T")[0]);
  const [categorie, setCategorie] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    if (id) {
      fetchActualiteById(id)
        .then((data) => {
          setTitre(data.titre);
          setContenu(data.contenu);
          setResume(data.resume || data.contenu.replace(/<[^>]+>/g, "").slice(0, 200));
          setPreviewImage(data.image || null);
          setDatePublication(data.date_publication?.split("T")[0] || "");
          setCategorie(data.categorie || "");
          setIsEditing(true);
        })
        .catch((err) => {
          console.error("Erreur chargement:", err);
          toast.error("Erreur lors du chargement de l'actualité");
        });
    }
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const generatedResume = resume.trim()
      ? resume
      : contenu.replace(/<[^>]+>/g, "").slice(0, 200);

    const formData = new FormData();
    formData.append("titre", titre);
    formData.append("contenu", contenu);
    formData.append("resume", generatedResume);
    formData.append("date_publication", datePublication);
    formData.append("categorie", categorie);
    if (image) formData.append("image", image);

    try {
      await saveActualite(id, formData);
      toast.success(`Actualité ${id ? "modifiée" : "ajoutée"} avec succès`);
      navigate("/admin/actualites");
    } catch (err) {
      toast.error("Erreur lors de l’enregistrement");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-red-600">
        {isEditing ? "Modifier l’actualité" : "Ajouter une actualité"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl shadow">
        {/* Titre */}
        <div>
          <label className="block mb-1 font-medium">Titre :</label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block mb-1 font-medium">Catégorie :</label>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Sélectionner une catégorie</option>
            <option value="Annonce">Annonce</option>
            <option value="Événement">Événement</option>
            <option value="Projet">Projet</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        {/* Résumé */}
        <div>
          <label className="block mb-1 font-medium">Résumé :</label>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Résumé automatique ou personnalisé"
            className="w-full border rounded p-2"
            rows={3}
          />
        </div>

        {/* Contenu */}
        <div>
          <label className="block mb-1 font-medium">Contenu :</label>
          <ReactQuill
            theme="snow"
            value={contenu}
            onChange={setContenu}
            className="bg-white"
            placeholder="Écrivez ici le contenu détaillé..."
          />
        </div>

        {/* Image */}
        <div>
          <label className="block mb-1 font-medium">Image :</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {previewImage && (
            <img
              src={previewImage}
              alt="Aperçu"
              className="mt-2 max-h-48 w-full object-cover rounded border"
            />
          )}
        </div>

        {/* Date publication */}
        <div>
          <label className="block mb-1 font-medium">Date de publication :</label>
          <input
            type="date"
            value={datePublication}
            onChange={(e) => setDatePublication(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        {/* Bouton */}
        <div className="text-right">
          <button
            type="submit"
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            {isEditing ? "Mettre à jour" : "Publier"}
          </button>
        </div>
      </form>
    </div>
  );
}
