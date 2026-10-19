// 📁 src/components/admin/Graphiques.jsx
// Briques communes aux écrans d'analyse de l'administration (tableau de bord, analyse premium) :
// carte avec bascule graphique / tableau, barres verticales, horizontales et empilées.
import React, { useEffect, useRef, useState } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Rectangle } from "recharts";
import { BarChart2, Table2 } from "lucide-react";

export const ROUGE = "#b91c1c"; // série unique : la couleur du site
export const ATTENUE = "#cbd5e1"; // barres hors sélection
export const REFERENCE = "#94a3b8"; // série de comparaison (année précédente)
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"]; // séries nommées, ordre fixe

export const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const MOIS_LONGS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const AXE = { fontSize: 12, fill: "#64748b" };
const GRILLE = "#e2e8f0";
const nombre = (v) => (typeof v === "number" ? v.toLocaleString("fr-FR") : v);
const sansZero = (v) => (v ? nombre(v) : "");

/* ------------------------------------------------------------------ carte */
export function Carte({ titre, sousTitre, tableau, children, className = "" }) {
  const [vue, setVue] = useState("graphique");
  const enTableau = vue === "tableau" && tableau;
  return (
    <section className={`min-w-0 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-800">{titre}</h3>
          {sousTitre && <p className="mt-0.5 text-xs text-slate-500">{sousTitre}</p>}
        </div>
        {tableau && (
          <button
            type="button"
            data-html2canvas-ignore="true"
            onClick={() => setVue(enTableau ? "graphique" : "tableau")}
            title={enTableau ? "Afficher le graphique" : "Afficher les chiffres en tableau"}
            aria-label={enTableau ? "Afficher le graphique" : "Afficher les chiffres en tableau"}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {enTableau ? <BarChart2 className="w-3.5 h-3.5" /> : <Table2 className="w-3.5 h-3.5" />}
            {enTableau ? "Graphique" : "Tableau"}
          </button>
        )}
      </div>
      {enTableau ? <Tableau {...tableau} /> : children}
    </section>
  );
}

export function Tableau({ colonnes = [], lignes = [], dense = false }) {
  const estNombre = (v) => typeof v === "number";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
            {colonnes.map((c, i) => (
              <th
                key={i}
                className={`py-2 pr-4 font-semibold whitespace-nowrap ${i > 0 && lignes.every((l) => estNombre(l[i]) || l[i] == null) ? "text-right" : ""}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {l.map((v, j) => (
                <td
                  key={j}
                  className={`${dense ? "py-1.5" : "py-2"} pr-4 ${estNombre(v) ? "text-right tabular-nums font-medium text-slate-900" : "text-slate-700"}`}
                >
                  {v == null || v === "" ? "—" : nombre(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Vide({ children = "Aucune donnée sur cette période." }) {
  return <div className="flex items-center justify-center rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{children}</div>;
}

export function Legende({ series = [] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {series.map((s) => (
        <li key={s.nom} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.couleur }} />
          {s.nom}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ info-bulle */
function Bulle({ active, payload, label, titre, suffixe = "" }) {
  if (!active || !payload?.length) return null;
  const lignes = payload.filter((p) => p.value != null && (payload.length === 1 || p.value !== 0));
  const total = payload.length > 1 ? payload.reduce((s, p) => s + (Number(p.value) || 0), 0) : null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-800">{titre ? titre(label, payload) : label}</p>
      {lignes.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 text-slate-600">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.payload?.__couleur || p.color || p.fill }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums text-slate-900">
            {nombre(p.value)}
            {suffixe}
          </span>
        </p>
      ))}
      {total != null && lignes.length > 1 && (
        <p className="mt-1 flex border-t border-slate-100 pt-1 text-slate-600">
          Total <span className="ml-auto pl-3 font-semibold tabular-nums text-slate-900">{nombre(total)}</span>
        </p>
      )}
    </div>
  );
}

// Largeur réelle du bloc : sert à adapter les libellés aux petits écrans.
function useLargeur() {
  const ref = useRef(null);
  const [largeur, setLargeur] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const mesurer = () => setLargeur(el.getBoundingClientRect().width);
    mesurer();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, largeur];
}

/* ------------------------------------------------------------------ barres verticales */
// series : [{ cle, nom, couleur }] — une série = pas de légende ; plusieurs = légende.
// surligne : valeur du libellé à mettre en avant (les autres barres sont atténuées).
export function BarresVerticales({
  donnees = [],
  cleLibelle = "libelle",
  series = [{ cle: "total", nom: "Total", couleur: ROUGE }],
  surligne = null,
  formatLibelle = (v) => v,
  titreBulle,
  hauteur = 260,
}) {
  const [ref, place] = useLargeur();
  const serre = place > 0 && place / Math.max(donnees.length, 1) < 38; // libellés trop serrés
  return (
    <div ref={ref}>
      {series.length > 1 && <Legende series={series} />}
      <ResponsiveContainer width="100%" height={hauteur}>
        <BarChart data={donnees} margin={{ top: 18, right: 8, bottom: 0, left: -16 }} barGap={2}>
          <CartesianGrid stroke={GRILLE} vertical={false} />
          <XAxis
            dataKey={cleLibelle}
            tick={AXE}
            tickFormatter={formatLibelle}
            tickLine={false}
            axisLine={{ stroke: GRILLE }}
            interval={serre ? "preserveStartEnd" : 0}
            minTickGap={2}
          />
          <YAxis allowDecimals={false} tick={AXE} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} content={<Bulle titre={titreBulle || ((l) => formatLibelle(l))} />} />
          {series.map((s, i) => (
            <Bar key={s.cle} dataKey={s.cle} name={s.nom} fill={s.couleur} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
              {i === 0 &&
                surligne != null &&
                donnees.map((d) => <Cell key={d[cleLibelle]} fill={d[cleLibelle] === surligne ? s.couleur : ATTENUE} />)}
              <LabelList dataKey={s.cle} position="top" formatter={sansZero} style={{ fontSize: 11, fill: "#334155", fontWeight: 600 }} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ barres horizontales (classement) */
export function BarresHorizontales({
  donnees = [],
  cleLibelle = "libelle",
  cle = "total",
  nom = "Total",
  couleur = ROUGE,
  suffixe = "",
  largeurLibelles,
  max,
}) {
  const [ref, place] = useLargeur();
  const plusLong = donnees.reduce((m, d) => Math.max(m, String(d[cleLibelle] ?? "").length), 0);
  const plafond = place ? Math.min(230, place * 0.45) : 230;
  const largeur = largeurLibelles || Math.min(plafond, Math.max(70, plusLong * 6.6 + 12));
  const tronque = Math.floor((largeur - 12) / 6.4);
  return (
    <div ref={ref}>
      <ResponsiveContainer width="100%" height={donnees.length * 34 + 12}>
        <BarChart data={donnees} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }}>
          <XAxis type="number" hide domain={[0, max || "dataMax"]} />
          <YAxis
            type="category"
            dataKey={cleLibelle}
            width={largeur}
            tick={{ fontSize: 12, fill: "#334155" }}
            tickLine={false}
            axisLine={{ stroke: GRILLE }}
            interval={0}
            tickFormatter={(v) => (String(v).length > tronque ? `${String(v).slice(0, tronque - 1)}…` : v)}
          />
          <Tooltip cursor={{ fill: "#f1f5f9" }} content={<Bulle suffixe={suffixe} />} />
          <Bar dataKey={cle} name={nom} fill={couleur} radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
            <LabelList
              dataKey={cle}
              position="right"
              formatter={(v) => `${nombre(v)}${suffixe}`}
              style={{ fontSize: 12, fill: "#0f172a", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ barres empilées */
// Chaque segment garde 2 px d'écart avec le suivant ; seul le segment du haut est arrondi.
function Segment({ ordre, cles, ...p }) {
  const auDessus = cles.slice(ordre + 1).some((k) => Number(p.payload?.[k]) > 0);
  if (!p.height || p.height <= 0) return null;
  const ecart = auDessus ? 2 : 0;
  return <Rectangle {...p} y={p.y + ecart} height={Math.max(1, p.height - ecart)} radius={auDessus ? 0 : [4, 4, 0, 0]} />;
}

export function BarresEmpilees({ donnees = [], cleLibelle = "libelle", series = [], formatLibelle = (v) => v, titreBulle, hauteur = 280 }) {
  const cles = series.map((s) => s.cle);
  const [ref, place] = useLargeur();
  const serre = place > 0 && place / Math.max(donnees.length, 1) < 38;
  return (
    <div ref={ref}>
      <Legende series={series} />
      <ResponsiveContainer width="100%" height={hauteur}>
        <BarChart data={donnees} margin={{ top: 18, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={GRILLE} vertical={false} />
          <XAxis
            dataKey={cleLibelle}
            tick={AXE}
            tickFormatter={formatLibelle}
            tickLine={false}
            axisLine={{ stroke: GRILLE }}
            interval={serre ? "preserveStartEnd" : 0}
            minTickGap={2}
          />
          <YAxis allowDecimals={false} tick={AXE} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} content={<Bulle titre={titreBulle || ((l) => formatLibelle(l))} />} />
          {series.map((s, i) => (
            <Bar
              key={s.cle}
              dataKey={s.cle}
              name={s.nom}
              stackId="pile"
              fill={s.couleur}
              maxBarSize={24}
              isAnimationActive={false}
              shape={<Segment ordre={i} cles={cles} />}
            >
              {i === series.length - 1 && (
                <LabelList dataKey="total" position="top" formatter={sansZero} style={{ fontSize: 11, fill: "#334155", fontWeight: 600 }} />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
