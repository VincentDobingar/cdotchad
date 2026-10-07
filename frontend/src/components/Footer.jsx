// components/Footer.jsx
// Pied de page du site public et des espaces connectés (pas de l'administration).
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import { FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";

// Adresses des réseaux sociaux : renseigner l'URL (ex. "https://www.facebook.com/...") pour activer le lien.
// Tant que href est vide, l'icône s'affiche sans lien.
const RESEAUX = [
  { nom: "Facebook", icone: FaFacebookF, href: "" },
  { nom: "Twitter", icone: FaTwitter, href: "" },
  { nom: "LinkedIn", icone: FaLinkedinIn, href: "" },
];

const NAVIGATION = [
  { label: "Présentation", to: "/presentation" },
  { label: "Services", to: "/services" },
  { label: "Objectifs", to: "/objectifs" },
  { label: "Activités", to: "/activites" },
  { label: "Actualités", to: "/actualites" },
  { label: "Galerie", to: "/galerie" },
];

const CARRIERE = [
  { label: "Offres d'emploi", to: "/offres" },
  { label: "Créer un compte candidat", to: "/inscription" },
  { label: "Suivre mes candidatures", to: "/mes-candidatures" },
  { label: "Espace partenaire", to: "/partenaire" },
];

const LienInterne = ({ to, children }) => (
  <Link to={to} className="text-slate-300 hover:text-white transition-colors">
    {children}
  </Link>
);

export default function Footer() {
  const annee = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Identité */}
        <div className="space-y-4">
          <img src="/images/logo-cdotchad.png" alt="CDO Consulting" className="h-12 w-auto select-none" draggable={false} />
          <p className="text-sm leading-relaxed text-slate-400">
            Cabinet de conseil spécialisé dans l'ingénierie informatique, la communication digitale, la stratégie
            marketing, la représentation d'affaires, les services RH et la finance.
          </p>
          <div className="flex gap-3 pt-2">
            {RESEAUX.map(({ nom, icone: Icone, href }) =>
              href ? (
                <a
                  key={nom}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={nom}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
                >
                  <Icone className="w-4 h-4" />
                </a>
              ) : (
                <span
                  key={nom}
                  aria-label={`${nom} (bientôt disponible)`}
                  title={`${nom} (bientôt disponible)`}
                  className="w-9 h-9 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500"
                >
                  <Icone className="w-4 h-4" />
                </span>
              )
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Navigation du site">
          <p className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Le cabinet</p>
          <ul className="space-y-2.5 text-sm">
            {NAVIGATION.map((l) => (
              <li key={l.to}>
                <LienInterne to={l.to}>{l.label}</LienInterne>
              </li>
            ))}
          </ul>
        </nav>

        {/* Carrière et espaces */}
        <nav aria-label="Carrière et espaces personnels">
          <p className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Carrière</p>
          <ul className="space-y-2.5 text-sm">
            {CARRIERE.map((l) => (
              <li key={l.to}>
                <LienInterne to={l.to}>{l.label}</LienInterne>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Contact</p>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <span>Klémat, 2ème Arr.<br />N'Djamena, Tchad</span>
            </li>
            <li className="flex gap-3">
              <Phone className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <a href="tel:+23598850078" className="hover:text-white transition-colors">+235 98 85 00 78</a>
            </li>
            <li className="flex gap-3">
              <Mail className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <a href="mailto:contact@cdotchad.com" className="hover:text-white transition-colors">
                contact@cdotchad.com
              </a>
            </li>
          </ul>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Nous écrire
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs text-slate-500">
          <p>
            CDO Consulting est immatriculé au RCCM sous le numéro TD-NDJ-01-2021-B12-00287 · NIF 9031681F
          </p>
          <p>© {annee} CDO Consulting. Tous droits réservés. Site développé par dbstchad.</p>
        </div>
      </div>
    </footer>
  );
}
