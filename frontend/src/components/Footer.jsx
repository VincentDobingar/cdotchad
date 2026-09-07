// components/Footer.jsx
import { MapPin, Phone, Mail } from "lucide-react";
import { FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="relative text-white">
      {/* Background image */}
        <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/images/footer-bg.jpg')" }}
        >
        <div className="absolute inset-0 bg-red-800 bg-opacity-75"></div>
        </div>

      {/* Contenu */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Bloc 1 */}
        <div>
          <h3 className="text-xl font-bold mb-2">CDO Consulting</h3>
          <p className="text-sm leading-relaxed">
            <strong>CDO Consulting</strong> est un cabinet de Consultance
            spécialisé dans l’ingénierie informatique, la communication digitale,
            la stratégie marketing, la représentation d’affaires, les services RH
            et la finance.
          </p>
        </div>

        {/* Bloc 2 */}
        <div>
          <h3 className="text-xl font-bold mb-2">Nous suivre</h3>
          <p className="text-sm mb-2">Nos actualités sur les réseaux sociaux</p>
            <div className="flex gap-4 text-xl">
            <a
                href="#"
                className="hover:scale-110 hover:text-blue-600 transition transform duration-200"
                aria-label="Facebook"
            >
                <FaFacebookF />
            </a>
            <a
                href="#"
                className="hover:scale-110 hover:text-blue-400 transition transform duration-200"
                aria-label="Twitter"
            >
                <FaTwitter />
            </a>
            <a
                href="#"
                className="hover:scale-110 hover:text-blue-700 transition transform duration-200"
                aria-label="LinkedIn"
            >
                <FaLinkedinIn />
            </a>
            </div>
        </div>

        {/* Bloc 3 */}
        <div>
          <h3 className="text-xl font-bold mb-2">Adresse</h3>
          <div className="flex items-start gap-3 text-sm mb-2">
            <MapPin className="mt-1 w-5 h-5 text-white" />
            <span>Klémat, 2ème Arr. N'Djamena (TCHAD)</span>
          </div>
          <div className="flex items-start gap-3 text-sm mb-2">
            <Phone className="mt-1 w-5 h-5 text-white" />
            <span>+235 98 85 00 78</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Mail className="mt-1 w-5 h-5 text-white" />
            <span>contact@cdotchad.com</span>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="relative z-10 bg-red-600 text-center text-white text-sm py-3">
        <p>
          CDO Consulting est Immatriculé au RCCM sous le numéro : TD-NDJ-01-2021-B12-00287.
          NIF : 9031681F
        </p>
        <p className="mt-1">© 2022 All rights reserved. CDO | By dbstchad</p>
      </div>
    </footer>
  );
};

export default Footer;
