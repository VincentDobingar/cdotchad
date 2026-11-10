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
import Inscription from "@/pages/public/Inscription";
import PartenaireDashboard from "@/pages/partenaire/PartenaireDashboard";
import PartenaireAvisForm from "@/pages/partenaire/PartenaireAvisForm";
import Profile from "@/pages/public/Profile";
import MesCandidatures from "@/pages/public/MesCandidatures";
import Galerie from "@/pages/public/Galerie";
import CandidatureConfirmation from "@/pages/public/CandidatureConfirmation";
import MotDePasseOublie from "@/pages/public/MotDePasseOublie";
import ResetPassword from "@/pages/public/ResetPassword";
import SuiviCandidature from "@/pages/public/SuiviCandidature";
import MesCandidatureDetail from "@/pages/public/MesCandidatureDetail";
import TestQuill from "@/components/public/TestQuill";
import NotFound from "@/pages/NotFound";
import Formations from "@/pages/public/Formations";
import FormationDetail from "@/pages/public/FormationDetail";
import VerifierCertificat from "@/pages/public/VerifierCertificat";
import MesFormations from "@/pages/formation/MesFormations";
import MaFormation from "@/pages/formation/MaFormation";
import PasserEvaluation from "@/pages/formation/PasserEvaluation";
import RequireRole from "@/routes/RequireRole";
import EspaceLayout from "@/components/espace/EspaceLayout";
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

  {
    path: "/postuler/:id",
    element: (
      <RequireRole roles={["candidat"]} redirectTo="/login">
        <PostulerEtape />
      </RequireRole>
    ),
  },
  // Plateforme de formation en ligne
  { path: "/formations", element: <Formations /> },
  { path: "/formations/:slug", element: <FormationDetail /> },
  { path: "/certificats/verifier", element: <VerifierCertificat /> },
  { path: "/certificats/verifier/:numero", element: <VerifierCertificat /> },
  {
    path: "/mes-formations",
    element: (
      <RequireRole roles={["candidat", "partenaire"]} redirectTo="/login">
        <EspaceLayout>
          <MesFormations />
        </EspaceLayout>
      </RequireRole>
    ),
  },
  {
    path: "/mes-formations/:id",
    element: (
      <RequireRole roles={["candidat", "partenaire"]} redirectTo="/login">
        <EspaceLayout>
          <MaFormation />
        </EspaceLayout>
      </RequireRole>
    ),
  },
  {
    path: "/mes-formations/:id/evaluations/:evaluationId",
    element: (
      <RequireRole roles={["candidat", "partenaire"]} redirectTo="/login">
        <EspaceLayout>
          <PasserEvaluation />
        </EspaceLayout>
      </RequireRole>
    ),
  },
  { path: "/actualites", element: <Actualites /> },
  { path: "/actualites/:id", element: <ActualiteDetail /> },
  { path: "/contact", element: <Contact /> },
  { path: "/login", element: <Login /> },
  { path: "/inscription", element: <Inscription /> },
  { path: "/mot-de-passe-oublie", element: <MotDePasseOublie /> },
  { path: "/reset-password/:token", element: <ResetPassword /> },
  { path: "/suivi", element: <SuiviCandidature /> },
  {
    path: "/profile",
    element: (
      <RequireRole roles={[]} redirectTo="/login">
        <EspaceLayout>
          <Profile />
        </EspaceLayout>
      </RequireRole>
    ),
  },
  {
    path: "/mes-candidatures",
    element: (
      <RequireRole roles={["candidat"]} redirectTo="/login">
        <EspaceLayout>
          <MesCandidatures />
        </EspaceLayout>
      </RequireRole>
    ),
  },
  {
    path: "/mes-candidatures/:id",
    element: (
      <RequireRole roles={["candidat"]} redirectTo="/login">
        <EspaceLayout>
          <MesCandidatureDetail />
        </EspaceLayout>
      </RequireRole>
    ),
  },
  {
    path: "/partenaire",
    element: (
      <RequireRole roles={["partenaire"]} redirectTo="/login">
        <EspaceLayout>
          <PartenaireDashboard />
        </EspaceLayout>
      </RequireRole>
    ),
  },
  {
    path: "/partenaire/avis/nouveau",
    element: (
      <RequireRole roles={["partenaire"]} redirectTo="/login">
        <EspaceLayout>
          <PartenaireAvisForm />
        </EspaceLayout>
      </RequireRole>
    ),
  },
  {
    path: "/partenaire/avis/:id/modifier",
    element: (
      <RequireRole roles={["partenaire"]} redirectTo="/login">
        <EspaceLayout>
          <PartenaireAvisForm />
        </EspaceLayout>
      </RequireRole>
    ),
  },
  { path: "/galerie", element: <Galerie /> },
  { path: "/candidature/success", element: <CandidatureConfirmation /> },
  { path: "/test-quill", element: <TestQuill /> },
  { path: "*", element: <NotFound /> },
];

export default publicRoutes;
