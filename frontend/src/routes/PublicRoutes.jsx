// routes/PublicRoutes.jsx
import Home from "@/pages/public/Home";
import Presentation from "@/pages/public/Presentation";
import Services from "@/pages/public/Services";
import Objectifs from "@/pages/public/Objectifs";
import Activites from "@/pages/public/Activites";
import Offres from "@/pages/public/Offres";
import OffreDetail from "@/pages/public/OffreDetail";
import PostulerEtape from "@/pages/public/PostulerEtape";
import Actualites from "@/pages/public/Actualites";
import ActualiteDetail from "@/pages/public/ActualiteDetail";
import Contact from "@/pages/public/Contact";
import Login from "@/pages/public/Login";
import Galerie from "@/pages/public/Galerie";
import CandidatureConfirmation from "@/pages/public/CandidatureConfirmation";
import TestQuill from "@/components/public/TestQuill";
import NotFound from "@/pages/NotFound";
import { Navigate, useParams } from "react-router-dom";

function RedirectOffre() {
  const { id } = useParams();
  return <Navigate to={`/offres/${id}`} replace />;
}

const publicRoutes = [
  { path: "/", element: <Home /> },
  { path: "/presentation", element: <Presentation /> },
  { path: "/services", element: <Services /> },
  { path: "/objectifs", element: <Objectifs /> },
  { path: "/activites", element: <Activites /> },

  { path: "/offres", element: <Offres /> },
  { path: "/offres/:id", element: <OffreDetail /> },
  { path: "/offre/:id", element: <RedirectOffre /> },

  { path: "/postuler/:id", element: <PostulerEtape /> },
  { path: "/actualites", element: <Actualites /> },
  { path: "/actualites/:id", element: <ActualiteDetail /> },
  { path: "/contact", element: <Contact /> },
  { path: "/login", element: <Login /> },
  { path: "/galerie", element: <Galerie /> },
  { path: "/candidature/success", element: <CandidatureConfirmation /> },
  { path: "/test-quill", element: <TestQuill /> },
  { path: "*", element: <NotFound /> },
];

export default publicRoutes;