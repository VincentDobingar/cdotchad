// 📁 src/pages/admin/FormService.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { createService, updateService, getServiceById } from "@/utils/adminApi";

export default function FormService() {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("id");
  const navigate = useNavigate();

  // Charger un service existant
  useEffect(() => {
    if (serviceId) {
      getServiceById(serviceId)
        .then((data) => {
          setTitre(data.titre);
          setDescription(data.description);
          setPreviewImage(data.image);
          setIsEditing(true);
        })
        .catch(() => {
          toast.error("Erreur lors du chargement du service");
        });
    }
  }, [serviceId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("titre", titre);
    formData.append("description", description);
    if (image) formData.append("image", image);

    try {
      if (isEditing) {
        await updateService(serviceId, formData);
        toast.success("Service modifié avec succès");
      } else {
        await createService(formData);
        toast.success("Service ajouté avec succès");
      }
      navigate("/admin/services");
    } catch (err) {
      toast.error("Erreur lors de l’enregistrement");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg mt-10">
      <h1 className="text-2xl font-bold text-red-600 mb-4">
        {isEditing ? "Modifier un service" : "Ajouter un service"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre */}
        <div>
          <label className="block font-medium mb-1">Titre</label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Image */}
        <div>
          <label className="block font-medium mb-1">Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {previewImage && (
            <img
              src={previewImage}
              alt="Aperçu"
              className="mt-2 h-40 object-contain rounded border"
            />
          )}
        </div>

        <div className="text-right">
          <button
            type="submit"
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            {isEditing ? "Mettre à jour" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
