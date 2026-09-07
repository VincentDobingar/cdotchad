import { Pencil, Trash2, Plus } from "lucide-react";

export default function ActualitesList({
  items,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Actualités</h2>
        <button
          onClick={onCreate}
          className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center gap-2"
        >
          <Plus size={16} /> Nouvelle actualité
        </button>
      </div>

      {items.length === 0 ? (
        <p>Aucune actualité trouvée.</p>
      ) : (
        items.map((a) => (
          <div key={a.id} className="p-3 border rounded-lg bg-white dark:bg-gray-900 flex gap-3">
            <div className="w-28 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
              {a.image ? (
                <img src={a.image} alt={a.titre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-gray-500">
                  Pas d’image
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{a.titre}</div>
              <div className="text-xs text-gray-500">
                {a.categorie || "—"} • {String(a.date_publication || "").substring(0,10)}
              </div>
              <p className="text-sm mt-1 line-clamp-2">
                {(a.resume && a.resume) ||
                  (a.contenu || "").replace(/<[^>]+>/g, "").slice(0, 200)}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => onEdit(a)}
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Pencil size={16} /> Modifier
              </button>
              <button
                onClick={() => onDelete(a)}
                className="px-3 py-2 rounded bg-rose-600 text-white hover:bg-rose-700 inline-flex items-center gap-2"
              >
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
