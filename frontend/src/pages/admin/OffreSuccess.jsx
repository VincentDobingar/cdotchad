// frontend/pages/admin/OffreSuccess.jsx
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function OffreSuccess() {
  const { id } = useParams();

  return (
    <motion.div
      className="max-w-xl mx-auto p-6 mt-10 bg-white rounded-2xl shadow-lg text-center"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="text-green-600 text-4xl mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        ✅
      </motion.div>
      <h2 className="text-2xl font-bold text-green-700 mb-2">Offre créée avec succès</h2>
      <p className="text-gray-700 mb-4">
        Votre offre a bien été enregistrée avec l’ID <strong>#{id}</strong>.
      </p>

      <div className="flex justify-center gap-4 mt-6">
        <Link
          to={`/offre/${id}`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Voir l’offre
        </Link>
        <Link
          to="/admin/offres"
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Retour à la liste
        </Link>
      </div>
    </motion.div>
  );
}
