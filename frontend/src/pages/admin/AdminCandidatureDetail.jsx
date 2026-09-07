import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminNavbar from "@/components/AdminNavbar";
import { toast } from "react-toastify";
import api from "@/utils/api";

const AdminCandidatureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidature, setCandidature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    const fetchCandidature = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res = await api.get(`/candidatures/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCandidature(res.data);
      } catch (err) {
        setErreur(err.response?.data?.error || err.message);
        toast.error(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidature();
  }, [id]);

  return (
    <div>
      <AdminNavbar />
      <div className="max-w-3xl mx-auto p-4">
        <button
          onClick={() => navigate("/admin/candidatures")}
          className="mb-4 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded"
        >
          ← Retour à la liste
        </button>

        {loading ? (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Chargement de la candidature...</p>
          </div>
        ) : erreur ? (
          <p className="text-red-500">{erreur}</p>
        ) : (
          <div className="bg-white shadow rounded p-4 space-y-4">
            <h2 className="text-2xl font-bold text-red-600">{candidature.nom}</h2>
            <p><strong>Email :</strong> {candidature.email}</p>
            <p><strong>Téléphone :</strong> {candidature.telephone}</p>
            <p><strong>Offre concernée :</strong> {candidature.titre_offre}</p>
            <p><strong>Date de candidature :</strong> {new Date(candidature.date_candidature).toLocaleDateString()}</p>
            <div>
              <strong>Message :</strong>
              <p className="mt-1 border p-2 rounded bg-gray-50">{candidature.message}</p>
            </div>
            {candidature.cv_url && (
              <div>
                <a
                  href={candidature.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Télécharger le CV
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCandidatureDetail;
