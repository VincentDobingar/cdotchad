// src/data/contenuCabinet.js
// Textes de positionnement du cabinet (audit, conseil, management), partagés par
// l'accueil, les pages Services, Objectifs et Présentation. Validés le 12/11/2026.
import { ClipboardCheck, GraduationCap, Landmark, Lightbulb, Network, ShieldCheck, Users } from "lucide-react";

export const METIERS = [
  {
    id: "audit",
    titre: "Audit",
    Icon: ClipboardCheck,
    accroche: "Des comptes et des organisations sous contrôle.",
    prestations: [
      "Audit contractuel financier et comptable",
      "Audit organisationnel et RH",
      "Contrôle interne",
      "Conformité réglementaire bancaire",
    ],
  },
  {
    id: "conseil",
    titre: "Conseil",
    Icon: Lightbulb,
    accroche: "Des décisions financières, fiscales et organisationnelles éclairées.",
    prestations: [
      "Structuration et restructuration de financements",
      "Conseil fiscal",
      "Organisation et procédures",
      "Accompagnement comptable, fiscal et social",
    ],
  },
  {
    id: "management",
    titre: "Management",
    Icon: Users,
    accroche: "Des équipes et des dirigeants qui font la différence.",
    prestations: [
      "Formation et renforcement des capacités",
      "Recrutement",
      "Portage salarial",
      "Management de transition",
    ],
  },
];

export const OBJECTIFS = [
  {
    id: "information-financiere",
    titre: "Fiabiliser l’information financière",
    description:
      "Des comptes sincères et des procédures maîtrisées, pour décider en confiance et rassurer banques, bailleurs et partenaires.",
    Icon: ShieldCheck,
    lien: "/services",
  },
  {
    id: "organisations",
    titre: "Structurer les organisations",
    description:
      "Des organigrammes clairs, des procédures conformes aux normes OHADA et des outils de pilotage adaptés à la taille et à l’activité de chaque structure.",
    Icon: Network,
    lien: "/services",
  },
  {
    id: "financement",
    titre: "Faciliter l’accès au financement",
    description:
      "Des dossiers solides et des modèles financiers crédibles pour obtenir ou restructurer les financements dont l’économie tchadienne a besoin.",
    Icon: Landmark,
    lien: "/services",
  },
  {
    id: "competences",
    titre: "Développer les compétences",
    description:
      "Former, recruter et accompagner les dirigeants et les équipes pour que les savoir-faire restent durablement dans les organisations.",
    Icon: GraduationCap,
    lien: "/formations",
  },
];
