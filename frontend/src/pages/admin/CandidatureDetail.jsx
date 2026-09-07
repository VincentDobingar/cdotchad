import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function CandidatureDetail() {
  const { id } = useParams();
  const [candidature, setCandidature] = useState(null);

  useEffect(() => {
    fetch(`/api/candidatures/${id}`)
      .then(res => res.json())
      .then(data => setCandidature(data))
      .catch(err => console.error(err));
  }, [id]);

  if (!candidature) return <p>Chargement...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-red-600">Détails de la candidature #{id}</h2>

      <table className="w-full table-auto border">
        <tbody>
          <tr><td className="font-semibold p-2">Nom</td><td>{candidature.nom}</td></tr>
          <tr><td className="font-semibold p-2">Email</td><td>{candidature.email}</td></tr>
          <tr><td className="font-semibold p-2">Téléphone</td><td>{candidature.telephone}</td></tr>
          <tr><td className="font-semibold p-2">Lien</td><td>{candidature.lien || "-"}</td></tr>
          <tr><td className="font-semibold p-2">Commentaire</td><td>{candidature.commentaire || "-"}</td></tr>
          <tr><td className="font-semibold p-2">Date de candidature</td><td>{new Date(candidature.date_candidature).toLocaleString()}</td></tr>
          <tr><td className="font-semibold p-2">CV</td><td><a href={`/${candidature.cv_path}`} target="_blank" className="text-blue-600">Télécharger</a></td></tr>
          <tr><td className="font-semibold p-2">Lettre</td><td><a href={`/${candidature.lettre_path}`} target="_blank" className="text-blue-600">Télécharger</a></td></tr>
          <tr><td className="font-semibold p-2">Diplôme</td><td><a href={`/${candidature.diplome_path}`} target="_blank" className="text-blue-600">Télécharger</a></td></tr>
        </tbody>
      </table>
      
      <h3 className="text-xl font-semibold mt-8 mb-2 text-gray-700">Informations de l’offre liée</h3>
      <table className="w-full table-auto border mb-6">
        <tbody>
          <tr><td className="font-semibold p-2">Poste</td><td>{candidature.offre_titre}</td></tr>
          <tr><td className="font-semibold p-2">Employeur</td><td>{candidature.employeur}</td></tr>
          <tr><td className="font-semibold p-2">Lieu</td><td>{candidature.lieu}</td></tr>
          <tr><td className="font-semibold p-2">Description</td><td>{candidature.offre_description}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
