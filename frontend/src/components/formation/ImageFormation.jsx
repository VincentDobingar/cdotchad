// src/components/formation/ImageFormation.jsx
// Image de la fiche catalogue : import depuis l'ordinateur (aperçu immédiat),
// remplacement, retrait, ou adresse d'une image déjà en ligne.
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Trash2 } from "lucide-react";
import { Bouton, champCls } from "./AdminUi";

const FORMATS = ["image/jpeg", "image/png", "image/webp"];
const MAX_MO = 5;

/**
 * @param {string}   url        image actuelle (image_url)
 * @param {File}     fichier    image choisie, pas encore envoyée
 * @param {Function} onFichier  (File | null) => void
 * @param {Function} onUrl      (string) => void
 * @param {Function} onErreur   (message) => void
 * @param {boolean}  envoi      téléversement en cours
 */
export default function ImageFormation({ url, fichier, onFichier, onUrl, onErreur, envoi = false }) {
  const input = useRef(null);
  const [apercu, setApercu] = useState(null);
  const [saisieUrl, setSaisieUrl] = useState(false);

  useEffect(() => {
    if (!fichier) return setApercu(null);
    const u = URL.createObjectURL(fichier);
    setApercu(u);
    return () => URL.revokeObjectURL(u);
  }, [fichier]);

  const choisir = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!FORMATS.includes(f.type)) return onErreur?.("Image au format JPG, PNG ou WebP uniquement.");
    if (f.size > MAX_MO * 1024 * 1024) return onErreur?.(`Image trop lourde (${MAX_MO} Mo maximum).`);
    onFichier(f);
  };

  const affichee = apercu || url;

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-1">Image de la formation</span>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="relative w-full sm:w-64 aspect-video shrink-0 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden hover:border-red-500 transition group"
          aria-label={affichee ? "Remplacer l'image" : "Importer une image"}
        >
          {affichee ? (
            <>
              <img src={affichee} alt="" className="w-full h-full object-cover" />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                Remplacer
              </span>
            </>
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-500 text-sm">
              <ImagePlus className="w-7 h-7" />
              Cliquer pour importer
            </span>
          )}
          {envoi && <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm text-gray-700">Envoi…</span>}
        </button>

        <div className="flex-1 space-y-2">
          <input ref={input} type="file" accept={FORMATS.join(",")} onChange={choisir} className="hidden" />
          <div className="flex flex-wrap gap-2">
            <Bouton variante="secondaire" onClick={() => input.current?.click()} disabled={envoi}>
              <ImagePlus className="w-4 h-4" /> {affichee ? "Remplacer l'image" : "Importer une image"}
            </Bouton>
            {affichee && (
              <Bouton variante="danger" onClick={() => { onFichier(null); onUrl(""); }} disabled={envoi}>
                <Trash2 className="w-4 h-4" /> Retirer
              </Bouton>
            )}
          </div>
          <p className="text-xs text-gray-500">JPG, PNG ou WebP, {MAX_MO} Mo maximum. Format paysage 16/9 conseillé (par exemple 1280 × 720).</p>
          {fichier && <p className="text-xs text-amber-700">Nouvelle image sélectionnée : elle sera envoyée à l'enregistrement.</p>}
          {!saisieUrl ? (
            <button type="button" onClick={() => setSaisieUrl(true)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-red-700">
              <Link2 className="w-3.5 h-3.5" /> ou utiliser l'adresse d'une image en ligne
            </button>
          ) : (
            <input
              value={fichier ? "" : url || ""}
              onChange={(e) => { onFichier(null); onUrl(e.target.value); }}
              placeholder="https://…"
              className={champCls}
            />
          )}
        </div>
      </div>
    </div>
  );
}
