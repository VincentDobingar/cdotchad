// 📁 src/pages/Notifications.jsx
// Notifications du compte connecté dans l'espace d'administration : nouvelles candidatures,
// avis de partenaires à valider, messages du formulaire de contact.
// Même API que la cloche des espaces candidat et partenaire (/backend/notifications).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import api from "@/utils/api";

const formater = (date) =>
  new Date(date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const charger = () =>
    api
      .get("/notifications")
      .then(({ data }) => {
        setNotifications(data.notifications || []);
        setNonLues(data.non_lues || 0);
        setErreur(null);
      })
      .catch(() => setErreur("Impossible de charger les notifications."))
      .finally(() => setChargement(false));

  // Chargement initial, puis rafraîchissement discret toutes les minutes
  useEffect(() => {
    charger();
    const minuteur = setInterval(charger, 60000);
    return () => clearInterval(minuteur);
  }, []);

  const marquerLue = async (notif) => {
    if (notif.lue) return;
    try {
      await api.patch(`/notifications/${notif.id}/lue`);
      setNotifications((liste) => liste.map((n) => (n.id === notif.id ? { ...n, lue: true } : n)));
      setNonLues((n) => Math.max(0, n - 1));
    } catch {
      setErreur("Impossible de marquer la notification comme lue.");
    }
  };

  const toutLire = async () => {
    try {
      await api.post("/notifications/tout-lire");
      setNotifications((liste) => liste.map((n) => ({ ...n, lue: true })));
      setNonLues(0);
    } catch {
      setErreur("Impossible de tout marquer comme lu.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Bell className="w-6 h-6 text-red-600" />
          Notifications
          {nonLues > 0 && (
            <span className="min-w-[1.5rem] h-6 px-2 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
              {nonLues}
            </span>
          )}
        </h2>
        {nonLues > 0 && (
          <button
            type="button"
            onClick={toutLire}
            className="flex items-center gap-2 text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded"
          >
            <CheckCheck size={16} /> Tout marquer comme lu
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Vous êtes prévenu ici des nouvelles candidatures, des avis de partenaires à valider et des messages reçus
        par le formulaire de contact.
      </p>

      {erreur && <p className="mb-4 text-sm text-red-600">{erreur}</p>}

      {chargement ? (
        <p className="text-gray-500 dark:text-gray-300">Chargement…</p>
      ) : notifications.length === 0 && !erreur ? (
        <p className="bg-white rounded shadow p-6 text-gray-600">Aucune notification pour le moment.</p>
      ) : (
        <ul className="bg-white rounded shadow divide-y">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${n.lue ? "" : "bg-red-50"}`}
            >
              <div className="min-w-0">
                <p className={`text-sm ${n.lue ? "text-gray-600" : "text-gray-900 font-medium"}`}>{n.message}</p>
                <p className="text-xs text-gray-500 mt-1">{formater(n.cree_le)}</p>
              </div>
              <div className="flex items-center gap-3 text-sm shrink-0">
                {n.lien && (
                  <Link to={n.lien} onClick={() => marquerLue(n)} className="text-blue-600 hover:underline">
                    Ouvrir
                  </Link>
                )}
                {!n.lue && (
                  <button type="button" onClick={() => marquerLue(n)} className="text-gray-600 hover:underline">
                    Marquer comme lu
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
