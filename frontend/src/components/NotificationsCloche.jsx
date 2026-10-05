// src/components/NotificationsCloche.jsx
// Cloche de notifications pour les espaces candidat et partenaire.
// Affiche le nombre de notifications non lues et la liste déroulante des dernières.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "@/utils/api";

const formater = (date) =>
  new Date(date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

export default function NotificationsCloche() {
  const [ouvert, setOuvert] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [erreur, setErreur] = useState(null);
  const racine = useRef(null);

  const charger = () =>
    api
      .get("/notifications")
      .then(({ data }) => {
        setNotifications(data.notifications || []);
        setNonLues(data.non_lues || 0);
        setErreur(null);
      })
      .catch(() => setErreur("Impossible de charger les notifications."));

  // Chargement initial, puis rafraîchissement discret toutes les minutes
  useEffect(() => {
    charger();
    const minuteur = setInterval(charger, 60000);
    return () => clearInterval(minuteur);
  }, []);

  // Ferme la liste au clic en dehors
  useEffect(() => {
    if (!ouvert) return;
    const surClic = (e) => {
      if (racine.current && !racine.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", surClic);
    return () => document.removeEventListener("mousedown", surClic);
  }, [ouvert]);

  const ouvrir = () => {
    setOuvert((v) => !v);
    if (!ouvert) charger();
  };

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
    <div ref={racine} className="relative">
      <button
        type="button"
        onClick={ouvrir}
        aria-label={nonLues > 0 ? `Notifications, ${nonLues} non lues` : "Notifications"}
        aria-expanded={ouvert}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {nonLues > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
            {nonLues > 9 ? "9+" : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border rounded shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            {nonLues > 0 && (
              <button type="button" onClick={toutLire} className="text-xs text-blue-600 hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>

          {erreur && <p className="px-4 py-2 text-sm text-red-600">{erreur}</p>}

          {!erreur && notifications.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-600">Aucune notification pour le moment.</p>
          )}

          <ul className="max-h-96 overflow-y-auto divide-y">
            {notifications.map((n) => {
              const contenu = (
                <div className={`px-4 py-3 text-sm ${n.lue ? "text-gray-600" : "text-gray-900 bg-red-50"}`}>
                  <p>{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{formater(n.cree_le)}</p>
                </div>
              );
              return (
                <li key={n.id} onClick={() => marquerLue(n)}>
                  {n.lien ? (
                    <Link to={n.lien} onClick={() => setOuvert(false)} className="block hover:bg-gray-50">
                      {contenu}
                    </Link>
                  ) : (
                    contenu
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
