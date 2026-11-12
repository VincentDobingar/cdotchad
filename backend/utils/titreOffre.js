// 📁 backend/utils/titreOffre.js
// Harmonisation des titres de postes : une seule convention, la majuscule initiale
// (« Chargé de clientèle », « Chef de service trade – section opérations locales »).
//
//  - Titre saisi tout en MAJUSCULES ou tout en minuscules : remis en minuscules, avec
//    majuscule initiale, sigles conservés (RH, MRC, ONG…) et accents usuels rétablis
//    (CHARGE DE CLIENTELE -> Chargé de clientèle).
//  - Titre déjà en casse mixte : respecté tel quel (seule la première lettre est mise
//    en majuscule), pour ne pas défaire une saisie volontaire.

// Sigles à garder en capitales
const SIGLES = new Set(`
  RH DRH DAF DG DGA DSI SI IT TIC ONG ONU PNUD UNICEF HCR UNHCR OMS PAM FAO OIM NRC IRC MSF CICR CRT
  PME PMI BTP QHSE HSE VIH SIDA CDI CDD CEMAC OHADA SYSCOHADA COBAC BEAC UEMOA ERP SAP SIG GIS MEAL
  WASH VBG GBV M&E CV MRC KYC LCB-FT LCB FT AML SQL PHP API UX UI IA TVA BDT IFRS
`.trim().split(/\s+/));

// Accents oubliés dans les saisies en capitales (mots fréquents des offres)
const ACCENTS = {
  charge: "chargé", chargee: "chargée", charges: "chargés", clientele: "clientèle",
  operation: "opération", operations: "opérations", operationnel: "opérationnel", operationnelle: "opérationnelle",
  ingenieur: "ingénieur", ingenieurs: "ingénieurs", ingenieure: "ingénieure", conformite: "conformité",
  regional: "régional", regionale: "régionale", regionaux: "régionaux", securite: "sécurité", qualite: "qualité",
  comptabilite: "comptabilité", general: "général", generale: "générale", generaux: "généraux",
  developpement: "développement", developpeur: "développeur", developpeuse: "développeuse", etudes: "études",
  etude: "étude", systeme: "système", systemes: "systèmes", reseau: "réseau", reseaux: "réseaux",
  electricite: "électricité", electricien: "électricien", electrique: "électrique", mecanicien: "mécanicien",
  secretaire: "secrétaire", delegue: "délégué", deleguee: "déléguée", specialiste: "spécialiste",
  strategie: "stratégie", strategique: "stratégique", controle: "contrôle", controleur: "contrôleur",
  controleuse: "contrôleuse", tresorerie: "trésorerie", tresorier: "trésorier", tresoriere: "trésorière",
  credit: "crédit", credits: "crédits", societe: "société", sante: "santé", medecin: "médecin",
  medical: "médical", medicale: "médicale", agrege: "agrégé", experimente: "expérimenté", experimentee: "expérimentée",
  geologue: "géologue", geometre: "géomètre", logistique: "logistique", benevole: "bénévole",
  coordinateur: "coordinateur", superviseur: "superviseur", reception: "réception", receptionniste: "réceptionniste",
  hotesse: "hôtesse", securitaire: "sécuritaire", economiste: "économiste", economique: "économique",
  financiere: "financière", financier: "financier", communaute: "communauté", communautaire: "communautaire",
  proximite: "proximité", entrepot: "entrepôt", gerant: "gérant", gerante: "gérante", agence: "agence",
  telecommunications: "télécommunications", telecom: "télécom", technicien: "technicien", realisation: "réalisation",
  activites: "activités", activite: "activité", equipe: "équipe", prevention: "prévention", recrutement: "recrutement",
};

const MOTS_LIAISON = /^[\s'’()\-–/&,.:;]+$/;

function harmoniserMot(mot, enCapitales) {
  if (!mot || MOTS_LIAISON.test(mot)) return mot;
  const brut = mot.toUpperCase();
  if (SIGLES.has(brut)) return brut;
  // Chiffres romains et références (II, III, A1, 2026…) : inchangés
  if (/^(?=[IVX]+$)I{0,3}V?I{0,3}X?$/.test(brut) && brut.length <= 4 && enCapitales) return brut;
  if (/\d/.test(mot)) return mot;
  const bas = mot.toLocaleLowerCase("fr-FR");
  return ACCENTS[bas] || bas;
}

export function harmoniserTitre(titre) {
  if (titre == null) return titre;
  let t = String(titre).replace(/\s+/g, " ").replace(/\s*([–—-])\s+/g, " $1 ").trim();
  if (!t) return t;

  const lettres = t.replace(/[^\p{L}]/gu, "");
  const toutMaj = lettres && lettres === lettres.toLocaleUpperCase("fr-FR");
  const toutMin = lettres && lettres === lettres.toLocaleLowerCase("fr-FR");

  if (toutMaj || toutMin) {
    // Découpe en conservant séparateurs et ponctuation
    t = t
      .split(/([\s'’()/&,.:;]+|\s[–—-]\s)/)
      .map((m) => harmoniserMot(m, toutMaj))
      .join("");
  }
  return t.charAt(0).toLocaleUpperCase("fr-FR") + t.slice(1);
}
