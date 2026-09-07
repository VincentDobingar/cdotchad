// 📁 src/pages/admin/AdminOffres.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOffres, supprimerOffre } from "@/utils/adminApi";

function formatDate(date) {
  if (!date) return "Non précisée";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Non précisée";
  return d.toLocaleDateString("fr-FR");
}

function getRecruitmentLabel(value) {
  return String(value || "").toLowerCase() === "interne" ? "Interne" : "Externe";
}

function normalizeOffre(offre, index) {
  return {
    id: offre?.id ?? offre?._id ?? index,
    titre: offre?.titre ?? "Offre sans titre",
    employeur: offre?.employeur ?? "Non précisé",
    lieu: offre?.lieu ?? "Non précisé",
    type_contrat: offre?.type_contrat ?? "Non précisé",
    type_recrutement: offre?.type_recrutement ?? "externe",
    statut: offre?.statut ?? offre?.etat ?? "",
    etat: offre?.etat ?? "",
    resume: offre?.resume ?? "",
    description: offre?.description ?? "",
    date_publication: offre?.date_publication ?? "",
    date_limite: offre?.date_limite ?? "",
  };
}

function getDisplayStatus(offre) {
  const rawStatut = (offre.statut || "").toLowerCase();
  const rawEtat = (offre.etat || "").toLowerCase();

  if (rawStatut === "brouillon") {
    return { label: "Brouillon", className: "bg-yellow-100 text-yellow-800" };
  }

  if (rawStatut === "suspendue") {
    return { label: "Suspendue", className: "bg-orange-100 text-orange-800" };
  }

  if (
    rawStatut === "cloturee" ||
    rawStatut === "clôturée" ||
    rawEtat === "expiré" ||
    rawEtat === "expire"
  ) {
    return { label: "Expirée", className: "bg-gray-200 text-gray-700" };
  }

  if (offre.date_limite) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(offre.date_limite);
    deadline.setHours(0, 0, 0, 0);

    if (!Number.isNaN(deadline.getTime()) && deadline < today) {
      return { label: "Expirée", className: "bg-gray-200 text-gray-700" };
    }
  }

  if (rawStatut === "publiee" || rawStatut === "publiée") {
    return { label: "Publiée", className: "bg-green-100 text-green-800" };
  }

  return { label: "Active", className: "bg-green-100 text-green-800" };
}

function truncateText(text, max = 140) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function AdminOffres() {
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [typeContratFilter, setTypeContratFilter] = useState("");
  const [typeRecrutementFilter, setTypeRecrutementFilter] = useState("");

  const loadOffres = async () => {
    try {
      setLoading(true);

      const data = await fetchOffres({
        search,
        statut: statutFilter,
        type_contrat: typeContratFilter,
        type_recrutement: typeRecrutementFilter,
        page: 1,
        limit: 100,
        sort: "date_publication:desc",
      });

      const list = Array.isArray(data?.offres)
        ? data.offres
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setOffres(list.map(normalizeOffre));
    } catch (error) {
      console.error("Erreur chargement des offres :", error);
      setOffres([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOffres = useMemo(() => {
    return offres.filter((offre) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        !keyword ||
        offre.titre.toLowerCase().includes(keyword) ||
        offre.employeur.toLowerCase().includes(keyword) ||
        offre.lieu.toLowerCase().includes(keyword) ||
        offre.resume.toLowerCase().includes(keyword) ||
        offre.description.toLowerCase().includes(keyword);

      const matchesStatut =
        !statutFilter ||
        (offre.statut || "").toLowerCase() === statutFilter.toLowerCase();

      const matchesContrat =
        !typeContratFilter ||
        (offre.type_contrat || "").toLowerCase().includes(typeContratFilter.toLowerCase());

      const matchesRecruitment =
        !typeRecrutementFilter ||
        (offre.type_recrutement || "").toLowerCase() === typeRecrutementFilter.toLowerCase();

      return matchesSearch && matchesStatut && matchesContrat && matchesRecruitment;
    });
  }, [offres, search, statutFilter, typeContratFilter, typeRecrutementFilter]);

  const handleDelete = async (id) => {
    const ok = window.confirm("Voulez-vous vraiment supprimer cette offre ?");
    if (!ok) return;

    try {
      setDeletingId(id);
      await supprimerOffre(id);
      setOffres((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Erreur suppression :", error);
      alert("Erreur lors de la suppression de l’offre.");
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatutFilter("");
    setTypeContratFilter("");
    setTypeRecrutementFilter("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des offres</h1>
          <p className="text-gray-600 mt-2">
            Consultez, recherchez, modifiez ou supprimez les offres publiées.
          </p>
        </div>

        <Link
          to="/admin/offres/ajouter"
          className="inline-flex items-center justify-center bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 font-medium"
        >
          Ajouter une offre
        </Link>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm p-4 md:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une offre..."
            className="border border-gray-300 rounded-xl px-4 py-2.5"
          />

          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="publiee">Publiée</option>
            <option value="suspendue">Suspendue</option>
            <option value="cloturee">Clôturée</option>
          </select>

          <input
            type="text"
            value={typeContratFilter}
            onChange={(e) => setTypeContratFilter(e.target.value)}
            placeholder="Type de contrat"
            className="border border-gray-300 rounded-xl px-4 py-2.5"
          />

          <select
            value={typeRecrutementFilter}
            onChange={(e) => setTypeRecrutementFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white"
          >
            <option value="">Tous les recrutements</option>
            <option value="interne">Interne</option>
            <option value="externe">Externe</option>
          </select>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={resetFilters}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600 py-10">Chargement...</p>
      ) : filteredOffres.length === 0 ? (
        <div className="bg-white border rounded-2xl shadow-sm p-8 text-center text-gray-500">
          Aucune offre trouvée.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOffres.map((offre) => {
            const status = getDisplayStatus(offre);

            return (
              <article
                key={offre.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 md:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h2 className="text-xl font-bold text-red-700">{offre.titre}</h2>

                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>

                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                        Recrutement {getRecruitmentLabel(offre.type_recrutement)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-sm mb-4">
                      <InfoItem label="Date de publication" value={formatDate(offre.date_publication)} />
                      <InfoItem label="Date d’expiration" value={formatDate(offre.date_limite)} />
                      <InfoItem label="Lieu" value={offre.lieu} />
                      <InfoItem label="Employeur" value={offre.employeur} />
                      <InfoItem label="Type de contrat" value={offre.type_contrat} />
                      <InfoItem
                        label="Type de recrutement"
                        value={getRecruitmentLabel(offre.type_recrutement)}
                      />
                    </div>

                    {offre.resume && (
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-gray-800 mb-1">
                          Résumé du poste
                        </p>
                        <p className="text-gray-700">
                          {truncateText(offre.resume, 180)}
                        </p>
                      </div>
                    )}

                    {offre.description && (
                      <div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">
                          Description du poste
                        </p>
                        <p className="text-gray-600">
                          {truncateText(offre.description, 220)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[220px]">
                    <Link
                      to={`/offres/${offre.id}`}
                      className="text-center bg-gray-100 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-200"
                    >
                      Voir l’offre
                    </Link>

                    <Link
                      to={`/admin/offres/modifier/${offre.id}`}
                      className="text-center bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
                    >
                      Modifier
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(offre.id)}
                      disabled={deletingId === offre.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === offre.id ? "Suppression..." : "Supprimer"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-800">{value || "Non précisé"}</p>
    </div>
  );
}