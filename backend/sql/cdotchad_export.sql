--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actualites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actualites (
    id integer NOT NULL,
    titre text NOT NULL,
    contenu text NOT NULL,
    image text,
    date_publication timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    categorie character varying(100)
);


ALTER TABLE public.actualites OWNER TO postgres;

--
-- Name: actualites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actualites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actualites_id_seq OWNER TO postgres;

--
-- Name: actualites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actualites_id_seq OWNED BY public.actualites.id;


--
-- Name: administrateurs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.administrateurs (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    motdepasse text NOT NULL,
    cree_le timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.administrateurs OWNER TO postgres;

--
-- Name: administrateurs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.administrateurs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.administrateurs_id_seq OWNER TO postgres;

--
-- Name: administrateurs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.administrateurs_id_seq OWNED BY public.administrateurs.id;


--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    id integer NOT NULL,
    job_id integer,
    name text NOT NULL,
    email text NOT NULL,
    cv_url text,
    message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- Name: applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applications_id_seq OWNER TO postgres;

--
-- Name: applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applications_id_seq OWNED BY public.applications.id;


--
-- Name: avis_recrutement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.avis_recrutement (
    id integer NOT NULL,
    titre character varying(255) NOT NULL,
    description text NOT NULL,
    date_publication date DEFAULT CURRENT_DATE
);


ALTER TABLE public.avis_recrutement OWNER TO postgres;

--
-- Name: avis_recrutement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.avis_recrutement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.avis_recrutement_id_seq OWNER TO postgres;

--
-- Name: avis_recrutement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.avis_recrutement_id_seq OWNED BY public.avis_recrutement.id;


--
-- Name: candidatures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidatures (
    id integer NOT NULL,
    nom text NOT NULL,
    email text NOT NULL,
    telephone text NOT NULL,
    lien text,
    commentaire text,
    cv_path text NOT NULL,
    lettre_path text NOT NULL,
    diplome_path text NOT NULL,
    offre_id integer NOT NULL,
    date_candidature timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.candidatures OWNER TO postgres;

--
-- Name: candidatures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidatures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidatures_id_seq OWNER TO postgres;

--
-- Name: candidatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidatures_id_seq OWNED BY public.candidatures.id;


--
-- Name: galerie; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.galerie (
    id integer NOT NULL,
    url text NOT NULL,
    date_upload timestamp without time zone DEFAULT now(),
    categorie text,
    titre text,
    filename text
);


ALTER TABLE public.galerie OWNER TO postgres;

--
-- Name: galerie_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.galerie_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.galerie_id_seq OWNER TO postgres;

--
-- Name: galerie_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.galerie_id_seq OWNED BY public.galerie.id;


--
-- Name: job_postings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_postings (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    deadline date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.job_postings OWNER TO postgres;

--
-- Name: job_postings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_postings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_postings_id_seq OWNER TO postgres;

--
-- Name: job_postings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_postings_id_seq OWNED BY public.job_postings.id;


--
-- Name: offres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offres (
    id integer NOT NULL,
    titre character varying(255) NOT NULL,
    resume text,
    description text,
    date_limite date,
    lieu character varying(150),
    type_contrat character varying(50),
    employeur text,
    diplome text,
    experience text,
    competences text,
    langue text,
    document_url text,
    attributions text,
    formation text,
    certifications text,
    logiciels text,
    affiliations text,
    date_publication date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    autre_fichier_url text
);


ALTER TABLE public.offres OWNER TO postgres;

--
-- Name: offres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.offres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offres_id_seq OWNER TO postgres;

--
-- Name: offres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.offres_id_seq OWNED BY public.offres.id;


--
-- Name: utilisateurs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilisateurs (
    id integer NOT NULL,
    nom character varying(100),
    prenom character varying(100),
    email character varying(150) NOT NULL,
    motdepasse text NOT NULL,
    role character varying(50) DEFAULT 'utilisateur'::character varying,
    actif boolean DEFAULT true
);


ALTER TABLE public.utilisateurs OWNER TO postgres;

--
-- Name: utilisateurs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utilisateurs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utilisateurs_id_seq OWNER TO postgres;

--
-- Name: utilisateurs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utilisateurs_id_seq OWNED BY public.utilisateurs.id;


--
-- Name: actualites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actualites ALTER COLUMN id SET DEFAULT nextval('public.actualites_id_seq'::regclass);


--
-- Name: administrateurs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrateurs ALTER COLUMN id SET DEFAULT nextval('public.administrateurs_id_seq'::regclass);


--
-- Name: applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications ALTER COLUMN id SET DEFAULT nextval('public.applications_id_seq'::regclass);


--
-- Name: avis_recrutement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avis_recrutement ALTER COLUMN id SET DEFAULT nextval('public.avis_recrutement_id_seq'::regclass);


--
-- Name: candidatures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidatures ALTER COLUMN id SET DEFAULT nextval('public.candidatures_id_seq'::regclass);


--
-- Name: galerie id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.galerie ALTER COLUMN id SET DEFAULT nextval('public.galerie_id_seq'::regclass);


--
-- Name: job_postings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_postings ALTER COLUMN id SET DEFAULT nextval('public.job_postings_id_seq'::regclass);


--
-- Name: offres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offres ALTER COLUMN id SET DEFAULT nextval('public.offres_id_seq'::regclass);


--
-- Name: utilisateurs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateurs ALTER COLUMN id SET DEFAULT nextval('public.utilisateurs_id_seq'::regclass);


--
-- Data for Name: actualites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actualites (id, titre, contenu, image, date_publication, categorie) FROM stdin;
1	Le cabinet CDO Consulting renforce la capacité du personnel de la raffinerie en informatique	<p><strong><em>Le cabinet CDO Consulting Tchad a formé le personnel de la raffinerie de Djarmaya en Pack Office 2013 et 2016 du 28 août au 1</em></strong><sup><strong><em>er</em></strong></sup><strong><em> septembre 2023 au sein de ladite raffinerie. Douze participants au total ont suivi avec brio cette formation en informatique.</em></strong></p><p>Le cabinet CDO Consulting a prouvé une fois de plus par cette formation qu’il a de l’expérience en la matière puisque, les outils pédagogiques, l’organisation et les méthodes à travers lesquels il a procédé pour former le personnel de la raffinerie sont redoutables et ont permis aux participants d’assimiler facilement en un temps record les modules les plus complexes.</p><p>Implanté au Tchad, le cabinet CDO Consulting s’impose sur le marché national avec une tendance d’externalisation de plus en plus forte. Géré par Sougnabé Oualoumi, le cabinet est spécialisé en ingénierie informatique, la communication digitale et stratégie marketing, la représentation d’affaires, les prestations de services en ressources humaines et financières.</p>	/uploads/actualites/actu-1750690321913-5053.png	2023-09-18 00:00:00	Formation
2	CDO : Formation certifiant de trente-huit (38) agents d’Orabank Tchad	<p>Formation certifiant de trente-huit (38) agents d’Orabank Tchad sur le thème&nbsp;: «&nbsp;Financement des marchés publics&nbsp;» par les experts du CDO Consulting venus du Togo.</p>	/uploads/actualites/actu-1750690590563-6415.png	2023-02-27 00:00:00	Formation
3	Le Conseil Financier CDO consulting accompagne Pendé Investissement	<p>Le Conseil Financier CDO consulting accompagne Pendé Investissement à la Représentation Afrique Centrale du Fonds Africain de Garanti et de Coopération Economique (FAGACE) basé à Douala au Cameroun pour la délivrance de la contre-garantie bancaire des demandes de financement clients.</p>	/uploads/actualites/actu-1750690694025-3811.png	2022-10-30 00:00:00	Formation
4	CDO Consulting : Signataire des Principes d’apprentissage de l’IFC.	<p>Félicitations&nbsp;à&nbsp;CDO&nbsp;Consulting&nbsp;pour&nbsp;être&nbsp;devenu&nbsp;signataire&nbsp;des&nbsp;Principes d’apprentissage de l’IFC. Ce faisant, votre équipe s’est engagée à améliorer continuellement vos programmes de formation pour les aligner sur les principes d’apprentissage de l’IFC.</p><p>Devenez un&nbsp;défenseur des&nbsp;Principes d’apprentissage&nbsp;en soulignant l’importance d’adhérer aux principes fondamentaux qui rendent un&nbsp;projet d’amélioration de la performance percutant, inclusif, évolutif et durable. Envisagez&nbsp;de&nbsp;nommer&nbsp;une autre organisation de performance ou d’apprentissage pour devenir&nbsp;signataire&nbsp;. Incluez&nbsp;un&nbsp;badge&nbsp;de&nbsp;signataire dans votre site&nbsp;Web, vos supports marketing, vos communications, vos réseaux sociaux, etc. Veuillez lier le badge à la page&nbsp;:&nbsp;https://www.growlearnconnect.org/principles-learning, si vous comptez l’utiliser en ligne. Faites une annonce et une promesse de don sur les réseaux sociaux en utilisant les points clés des exemples ci-dessous&nbsp;: En tant qu’organisation engagée dans la conception et la réalisation de projets de formation selon les normes les plus élevées, nous souscrivons pleinement aux Principes d’apprentissage de l’IFC et sommes ravis de devenir signataire. Nous sommes fiers d’approuver les Principes d’apprentissage&nbsp;! Nous croyons fermement qu’il faut tirer parti des normes les plus élevées pour aider nos clients à réussir. Les principes d’apprentissage d’IFC s’alignent sur notre philosophie de formation, donc l’approbation des principes était une solution naturelle. En tant que signataire des Principes d’apprentissage d’IFC, nous sommes ravis de rejoindre une communauté internationale de formateurs, d’institutions financières et d’organisations internationales de premier plan qui souscrivent aux normes les plus élevées en matière de formation. Devenir signataire des Principes d’apprentissage renforce la crédibilité de notre organisation et permet à nos clients de savoir que nous nous engageons à respecter les normes internationales de qualité et d’impact. Veuillez utiliser les hashtags suivants lorsque vous partagez du matériel ou des informations sur le programme GrowLearnConnect&nbsp;: #GrowLearnConnect et #PrinciplesForLearning</p>	/uploads/actualites/actu-1750690783626-2929.png	2022-09-27 00:00:00	Formation
5	CDO Consulting : L’expertise financière de haut standing	<p><strong style="color: rgb(0, 0, 0);"><em>Depuis sa création en septembre 2021, le Cabinet d’expertise financière CDO Consulting forme et accompagne constamment les entreprises d’envergure parmi lesquelles, les entreprises du secteur pétroliers et les plus grandes banques de la place.</em></strong></p><p><span style="color: rgb(0, 0, 0);">Certifié Formateur des formateurs par la Banque Mondiale, CDO Consulting accompagne les entreprises dans la formation de leurs personnels. Depuis deux ans, les principaux clients de CDO Consulting proviennent essentiellement des banques, des industries agroalimentaires mais également des entreprises du secteur pétrolier. On cite aussi des projets de la Banque Mondiale à travers des études de faisabilités et autres.</span></p><p><span style="color: rgb(0, 0, 0);">La procédure utilisée par CDO Consulting est simple mais polyvalent et professionnelle. Un catalogue spécifique explicitant les types de formations à la carte est mis à la disposition des clients. Pour des besoins de formations spécifiques à la demande, un canevas de discussion et d’adaptation permettant de rassembler les outils nécessaires relatif au module sollicité est mis en place.</span></p><p><span style="color: rgb(0, 0, 0);">Selon le Gérant de CDO Consulting Sougnabé Oualoumi, la création de CDO Consulting est à la base, née du souci de combler les besoins en personnels qualifiés des entreprises. «&nbsp;</span><em style="color: rgb(0, 0, 0);">Nous avons constaté qu’il y a assez de besoins de formations des jeunes cadres qui intègrent le milieu professionnel. Suite à ce constat, nous nous sommes convenus de mettre en place une structure qui assurerait l’accompagnement des entreprises dans la formation des jeunes compte tenu de nos expériences capitalisées dans différents domaines</em><span style="color: rgb(0, 0, 0);">&nbsp;», explique-il.</span></p><p><span style="color: rgb(0, 0, 0);">Si la formation est une opportunité pour les entreprises, plusieurs directions des ressources humaines, restent retissant à cette dynamique. La raison principale est le départ des agents formés qui démissionnent après avoir bénéficiés de la formation. Pour Sougnabé Oualoumi, cette crainte ne doit pas entraver la formation du personnel. Car, les employés non formés sont moins productifs pour leurs employeurs. «&nbsp;</span><em style="color: rgb(0, 0, 0);">L’école ne donne pas tout. Il faut former les gens pour qu’ils soient à la hauteur des taches qui leurs sont confiées. La formation est considérée comme un outil de production à part entière. Pas de formation, pas de production. Nous demandons aux entreprises de faire confiances à nos notre expertise car nous avons de de l’expérience et la compétence requise&nbsp;</em><span style="color: rgb(0, 0, 0);">», a spécifié le Gérant de CDO Consulting Sougnabé Oualoumi.</span></p><p><span style="color: rgb(0, 0, 0);">D’une manière générale, dans le domaine de management des organisations, CDO Consulting intervient sur la Formation du personnel, le Recrutement et l’Externalisation de la paie.</span></p><p><span style="color: rgb(0, 0, 0);">Dans le domaine des Finances, </span><strong style="color: rgb(0, 0, 0);">CDO</strong><span style="color: rgb(0, 0, 0);"> Consulting accompagne les clients dans la recherche des financements.</span><em style="color: rgb(0, 0, 0);"> «&nbsp;Nous accompagnons les clients qui cherchent des financements auprès des banques. Etant banquier de formation, nous savons les difficultés rencontrées par les banques dans la structuration de leurs dossiers lorsque les besoins sont mal exprimés par les clients. Nous conseillons les clients à mieux formuler leurs besoins à travers un business plan que nous aidons dans l’élaboration. Ceci facilite la compréhension entre les banques et les clients </em><span style="color: rgb(0, 0, 0);">», relève le Gérant de CDO Consulting.&nbsp;En termes de Formalisation des structures informelles, CDO Consulting accompagne dans l’élaboration des états financiers des entreprises.</span></p><p><span style="color: rgb(0, 0, 0);">L’Assistance fiscale qui est aussi au cœur de notre métier permet d’accompagner les clients des clients à travers les déclarations fiscales périodiques et la maitrise de leurs droits et devoirs en matière fiscale.</span></p><p><span style="color: rgb(0, 0, 0);">Le Cabinet assure aussi la Représentation commerciale et aide dans l’élaboration de la Stratégie commerciale pour les entreprises qui en font la demande.</span></p><p><span style="color: rgb(0, 0, 0);">La Transformation des organisations en difficultés est également notre domaine de compétence.</span></p>	/uploads/actualites/actu-1750690863384-4268.jpg	2023-07-13 00:00:00	Formation
\.


--
-- Data for Name: administrateurs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.administrateurs (id, email, motdepasse, cree_le) FROM stdin;
4	admin@cdotchad.com	$2b$10$aSrK8yXc.1DLa3xyfxODXeDVcaecuvp5gwG2pDva68yf7wLBJzSaS	2025-05-29 13:27:30.032231
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (id, job_id, name, email, cv_url, message, created_at) FROM stdin;
\.


--
-- Data for Name: avis_recrutement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.avis_recrutement (id, titre, description, date_publication) FROM stdin;
\.


--
-- Data for Name: candidatures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidatures (id, nom, email, telephone, lien, commentaire, cv_path, lettre_path, diplome_path, offre_id, date_candidature) FROM stdin;
8	DOBINGAR GUIRYAMBAYE VINCENT	guiryambaye.vincent@gmail.com	+25762500305	https://www.linkedIn.com/guiryambaye.vincent	RAS	uploads\\cv\\1750705400603-cv.pdf	uploads\\lettres\\1750705400635-lettre.pdf	uploads\\diplomes\\1750705400658-diplome.pdf	5	2025-06-23 21:03:20.776463
9	MINGUEMADJI CORINE	corineminguemadji@gmail.com	+25770921220	https://www.linkedIn.com/corineminguemadji	RAS	uploads\\cv\\1750705663026-cv.pdf	uploads\\lettres\\1750705663067-lettre.pdf	uploads\\diplomes\\1750705663091-diplome.pdf	6	2025-06-23 21:07:43.223211
10	AIGONGUE HONORE	aigonguehonore@gmail.com	+23568826243	https://www.linkedIn.com/aigonguehonore	RAS	uploads\\cv\\1751038429169-cv.pdf	uploads\\lettres\\1751038429216-lettre.pdf	uploads\\diplomes\\1751038429233-diplome.pdf	13	2025-06-27 17:33:49.48542
11	BERNARD KIRENGA	bernard.kirenga@gmail.com	+25678980973	https://www.linkedIn.com/bernard.kirenga	RAS	uploads\\cv\\1751039029695-cv.pdf	uploads\\lettres\\1751039029710-lettre.pdf	uploads\\diplomes\\1751039029739-diplome.pdf	7	2025-06-27 17:43:50.081817
12	SHEN MAYANJA WABBI	wabbi@gmail.com	+256789098765	https://www.linkedIn.com/wabbishen	RAS	uploads\\cv\\1751039836229-cv.pdf	uploads\\lettres\\1751039836246-lettre.pdf	uploads\\diplomes\\1751039836268-diplome.pdf	12	2025-06-27 17:57:16.688169
13	NSENGUMUREMYI EMMANUEL	emmanuel.nge@gmail.com	+25779800658	https://www.linkedIn.com/emmanuel.nge	RAS	uploads\\cv\\1751043717364-cv.pdf	uploads\\lettres\\1751043717386-lettre.pdf	uploads\\diplomes\\1751043717413-diplome.pdf	10	2025-06-27 19:01:58.009942
14	DIDIER MINGUEYAMBAYE	mingueyambaye.didier@gmail.com	+23599900703	https://www.linkedIn.com/mingueyambayedidier	RAS	uploads\\cv\\1751043959795-cv.pdf	uploads\\lettres\\1751043959809-lettre.pdf	uploads\\diplomes\\1751043959839-diplome.pdf	10	2025-06-27 19:05:59.991711
\.


--
-- Data for Name: galerie; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.galerie (id, url, date_upload, categorie, titre, filename) FROM stdin;
5	http://localhost:5000/uploads/galerie/image-1750698342171.jpg	2025-06-23 19:05:42.179	Ecobank	Formation Ecobank	image-1750698342171.jpg
6	http://localhost:5000/uploads/galerie/image-1750698367316.jpg	2025-06-23 19:06:07.32	Ecobank	Formation Ecobank	image-1750698367316.jpg
7	http://localhost:5000/uploads/galerie/image-1750704965658.jpg	2025-06-23 20:56:05.668	Ecobank	Formation Ecobank	image-1750704965658.jpg
8	http://localhost:5000/uploads/galerie/image-1750759690913.jpg	2025-06-24 12:08:10.924	Ecobank	Formation Ecobank	image-1750759690913.jpg
9	http://localhost:5000/uploads/galerie/image-1750759717703.jpg	2025-06-24 12:08:37.709	Ecobank	Formation Ecobank	image-1750759717703.jpg
10	http://localhost:5000/uploads/galerie/image-1750759769617.jpg	2025-06-24 12:09:29.62	Ecobank	Formation Ecobank	image-1750759769617.jpg
11	http://localhost:5000/uploads/galerie/image-1750759820259.jpg	2025-06-24 12:10:20.263	Ecobank	Formation Ecobank	image-1750759820259.jpg
12	http://localhost:5000/uploads/galerie/image-1750863102860.jpg	2025-06-25 16:51:42.863	Ecobank	Formation Ecobank	image-1750863102860.jpg
13	http://localhost:5000/uploads/galerie/image-1750863150830.jpg	2025-06-25 16:52:30.832	Ecobank	Formation Ecobank	image-1750863150830.jpg
14	http://localhost:5000/uploads/galerie/image-1750863163038.jpg	2025-06-25 16:52:43.041	Ecobank	Formation Ecobank	image-1750863163038.jpg
15	http://localhost:5000/uploads/galerie/image-1750863178696.jpg	2025-06-25 16:52:58.698	Ecobank	Formation Ecobank	image-1750863178696.jpg
16	http://localhost:5000/uploads/galerie/image-1750863191250.jpg	2025-06-25 16:53:11.252	Ecobank	Formation Ecobank	image-1750863191250.jpg
17	http://localhost:5000/uploads/galerie/image-1750863236693.jpg	2025-06-25 16:53:56.699	Ecobank	Formation Ecobank	image-1750863236693.jpg
18	http://localhost:5000/uploads/galerie/image-1750863248157.jpg	2025-06-25 16:54:08.159	Ecobank	Formation Ecobank	image-1750863248157.jpg
19	http://localhost:5000/uploads/galerie/image-1750863257698.jpg	2025-06-25 16:54:17.7	Ecobank		image-1750863257698.jpg
21	http://localhost:5000/uploads/galerie/image-1750863401559.jpg	2025-06-25 16:56:41.561	Raffinerie	Formation Raffinerie	image-1750863401559.jpg
22	http://localhost:5000/uploads/galerie/image-1750863430039.jpg	2025-06-25 16:57:10.041	Raffinerie	Formation Raffinerie	image-1750863430039.jpg
23	http://localhost:5000/uploads/galerie/image-1750863440391.jpg	2025-06-25 16:57:20.394	Raffinerie	Formation Raffinerie	image-1750863440391.jpg
24	http://localhost:5000/uploads/galerie/image-1750863459732.jpg	2025-06-25 16:57:39.734	Raffinerie	Formation Raffinerie	image-1750863459732.jpg
25	http://localhost:5000/uploads/galerie/image-1750863687911.jpg	2025-06-25 17:01:27.913	Raffinerie	Formation Raffinerie	image-1750863687911.jpg
26	http://localhost:5000/uploads/galerie/image-1750871921277.jpg	2025-06-25 19:18:41.287	Raffinerie	Formation X	image-1750871921277.jpg
27	http://localhost:5000/uploads/galerie/image-1750954693329.jpg	2025-06-26 18:18:13.34	Ministere	FormationZ	image-1750954693329.jpg
28	http://localhost:5000/uploads/galerie/image-1751023378641.jpg	2025-06-27 13:22:58.661	Banque Mondiale	Formations Aigongue	image-1751023378641.jpg
\.


--
-- Data for Name: job_postings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_postings (id, title, description, deadline, created_at) FROM stdin;
\.


--
-- Data for Name: offres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offres (id, titre, resume, description, date_limite, lieu, type_contrat, employeur, diplome, experience, competences, langue, document_url, attributions, formation, certifications, logiciels, affiliations, date_publication, created_at, updated_at, autre_fichier_url) FROM stdin;
5	DIRECTEUR/DIRECTRICE DE LA CONFORMITÉ	Recrutement externe	Placé sous l’autorité du Directeur Général, le Directeur du Département de la Conformité est responsable de garantir que l’ensemble des activités de la banque respectent les réglementations et les normes en vigueur. Il/elle supervise et coordonne les efforts visant à maintenir un haut niveau de conformité dans toutes les opérations de la banque.	2024-04-29	N'Djamena	CDI	\N	BAC + 5	10 ans	•\tConnaissance approfondie des lois et réglementations bancaires nationales et internationales.\r\n•\tCapacité à analyser les risques et à élaborer des stratégies de conformité efficaces.\r\n•\tCompétences en leadership et en gestion d’équipe.\r\n•\tExcellentes compétences communication en communication verbale et écrite.\r\n•\tSens aigu de l’éthique professionnelle et de la confidentialité.\r\n•\tCapacité à travailler de manière autonome et à prendre des décisions éclairées.\r\n•\tExpérience antérieure dans le domaine de la conformité bancaire serait un atout.\r\n•\tMaitrise des outils informatiques et des logiciels de gestion de la conformité.\r\n	Anglais	http://localhost:5000/uploads/documents/offre_1750859235715.pdf	•\tDévelopper et mettre en œuvre des politiques et des procédures de conformité.\r\n•\tFournir des conseils et une orientation stratégique sur les questions de conformité aux équipes opérationnelles.\r\n•\tEffectuer des évaluations régulières des risques et de conformité et proposer des mesures d’atténuation.\r\n•\tAssurer une surveillance continue des activités de la banque pour détecter et prévenir les violations de la conformité.\r\n•\tCollaborer avec les organismes de réglementation externes et assurer une communication transparente.\r\n•\tFormer le personnel sur les exigences réglementaires et les meilleurs pratiques de conformité.\r\n•\tGérer les enquêtes internes et externes liées à la conformité.\r\n•\tSuperviser les équipes de professionnels de la conformité et évaluer leurs performances.\r\n	Diplôme universitaire en finance, en droit ou dans un domaine connexe	CAMS, CRCM	Excell	PMI	2024-02-10	2025-06-16 13:31:09.955122	2025-06-25 15:47:15.719926	\N
6	CHEF DE SERVICE MULTINATIONALE ET RÉGIONALE CORPORATE (MRC) 	Recrutement Externe	Placé sous la supervision du Directeur du Corporate Bank, le chef de service de service du segment clientèle Multinationale et Régionale Corporate (MRC) est responsable de garantir le développement de ce portefeuille. Il/elle supervise et coordonne les efforts visant à maintenir un haut niveau de service et travaille en collaboration avec d’autres départements pour offrir des solutions financières adaptées aux besoins spécifiques de ces clients.	2024-05-29	N'Djaména	CDI	\N	BAC + 5	4 ans	•\tExcellentes compétences en communication et négociation.\r\n•\tFortes compétences analytiques et capacité à comprendre les besoins financiers des clients\r\n•\tConnaissances approfondies des produits et services bancaires\r\n•\tCapacité à travailler sous pression et à gérer plusieurs projets simultanément\r\n•\tOrienté résultats et axé sur la satisfaction client\r\n•\tEsprit d’équipe et capacité à motiver les autres membres de l’équipe\r\n•\tLa maitrise du logiciel de gestion des relations clients (CRM) ou tout autre est un atout\r\n•\tCapacité à analyser les états financiers\r\n•\tBonne connaissance de l’outil informatique\r\n	Anglais	http://localhost:5000/uploads/documents/offre_1750859375040.pdf	•\tExécuter une stratégie de croissance du portefeuille des Multinationales – Régionales – Corporate\r\n•\tDévelopper et pour le segment Multinationales – Régionales – Corporate – – Fidéliser cette catégorie de clientèle\r\n•\tVulgariser les produits digitaux\r\n•\tAnalyser les besoins financiers des clients et recommander des produits et services adaptés\r\n•\tNégocier et structurer des transactions complexes y compris des prets syndiqués, des financements structurés et des services de trésorerie\r\n•\tAssurer une gestion efficace des risques liés au portefeuille de ces clients\r\n•\tFournir un excellent service clientèle et entretenir des relations solides avec les clients\r\n•\tMaximiser la chaine des valeurs sur cette clientèle\r\n•\tReporting régulier sur la performance du segment au Directeur du département\r\n	Diplôme universitaire de type Bac+4 minimum en finance	PMP	Word, Excell, PowerPoint	PMI	2024-03-01	2025-06-16 14:32:07.619045	2025-06-25 15:49:35.043802	\N
9	CHARGE DE CLIENTELE	Recrutement pour le compte d'un partenaire	Aptitudes à gérer les relations interpersonnelles ;\r\nRigueur, discrétion, sens de l’organisation ;\r\nAvoir une bonne aptitude de supporter la pression ;\r\nAvoir la capacité de surpasser le volume de travail ;\r\nÊtre polyvalent et dévoué.\r\nCourtois, calme, conciliant et innovateur.\r\nCapacité d’écoute.\r\nÊtre ordonné.\r\nTravail en équipe et collaboration.\r\nBonne capacité de communication orale.\r\nMaîtrise de Microsoft Excel, Word, PowerPoint et autres logiciels/outils pertinents.	2023-05-08	Sarh	CDI	CDO Consulting Tchad	Licence 	2 ans	Un minimum de 2 ans d’expérience en matière de Service Clientèle.\r\nLicence dans les domaines suivants : commercial, Gestion, Comptabilité ou autres diplômes équivalents.\r\nExpérience relative dans le secteur bancaire ou la téléphonie serait un atout	Français	http://localhost:5000/uploads/documents/offre_1750416091200.pdf	Ouverture de compte\r\nAbonnement aux produits et facilités de prêt\r\nDemande et délivrance des cartes, des chéquiers, des traites bancaires et des services électroniques\r\nJournalisation / traitement des réclamations via le système CRM (système de gestion de la relation client)\r\nMaintenance des mandataires de compte et des données statiques de la clientèle\r\nRéception des courriers envoyés à l’Agence\r\nFournir de l’appui consultatif aux clients en matière de banque et de services bancaires\r\nMigrer les clients vers les canaux hors agence à travers la promotion des canaux électroniques et la vente croisée des services électroniques\r\nÉtablir des relations productives lors des interactions avec les clients en agence afin de leur offrir une expérience pleinement satisfaisante\r\nCollaborer avec les commerciaux de l’agence afin de les aider à réaliser leurs objectifs de vente et de fidélisation de la clientèle.\r\nAppuyer la mise en œuvre des campagnes de promotion des produits et services de l’agence\r\nServir de principal point de contact dans l’agence pour les renseignements de la clientèle et recevoir les clients avec courtoisie et professionnalisme.\r\nTraiter efficacement les requêtes des clients et leur fournir des retours réguliers jusqu’à la résolution.\r\nAssister les clients dans l’utilisation des produits électroniques\r\nPrendre en charge les réclamations des clients de l’agence et en cas de non-résolution dans l’intervalle des 24 heures, escalader promptement le problème au superviseur.\r\nAssurer la conformité aux politiques et lois réglementaires et du Groupe\r\nAssurer la sauvegarde des documents bancaires et des matériels de sécurité\r\nExécuter toute autre tâche raisonnablement assignée	commercial, Gestion, Comptabilité ou autres diplômes équivalents.	Aucun	World et Excel	Neant	2023-02-02	2025-06-20 12:41:31.646096	2025-06-20 12:41:31.646096	http://localhost:5000/uploads/documents/piece_1750416091211.pdf
10	INGENIEURS INFORMATICIENS	Deux (2)  ingénieurs informaticiens pour renforcer équipe de la Technologie.	Pratique des langages de développement,\r\nBonne connaissance des SGBD tels que : Oracle, Access, SQL Server et MySQL,\r\nBonne maîtrise des réseaux, infrastructures et serveurs informatiques,\r\nAvoir une culture générale sur l’informatique (disposer des bases communes dans le domaine IT),\r\nConnaitre l’importance et les enjeux de la sécurité informatique dans une Banque,\r\nConnaitre les outils informatiques en générale ou de l’exploitation bancaire de préférence,\r\nConnaître les concepts et architectures du système d’information et de communication,\r\nConnaitre les réseaux et système d’exploitation avancé (Windows et Linux),\r\nBonnes connaissances et pratiques dans la gestion des projets. (Être rigoureux d’un bout à l’autre du cycle de vie d’un projet et avoir le sens des responsabilités),\r\nSavoir s’adapter,\r\nAptitude à communiquer efficacement et favoriser un climat de bonne entente,\r\nAvoir un sens poussé de l’écoute,\r\nAvoir un bon esprit d’équipe et être capable de travailler sous pression,\r\nFaire preuve de proactivité et être force de proposition,\r\nEtre disponible au service et assidu,\r\nÊtre capable à anticiper les difficultés et proposer des solutions appropriées,\r\nSavoir identifier et appliquer l’expertise nécessaire pour résoudre les problèmes,\r\nAvoir un très bon esprit d’analyse et une grande capacité à innover,\r\nObserver un devoir de réserve et de discrétion pour le traitement des données confidentielles,\r\nEtre Rigoureux, Persévérant, Patient, Créatif, Sociable, Curieux, Passionné,\r\nMaîtriser le français, la pratique de l’anglais est vivement souhaité,\r\nAvoir 2 ans d’expérience minimum confirmée dans un poste similaire.	2023-05-09	N'Djaména	CDI	CDO Consulting Tchad	Master 2	5 ans	Gérer l’infrastructure réseau et informatique,\r\nFormer et supporter les utilisateurs,\r\nParticiper à la réalisation des nouveaux projets informatiques,\r\nDévelopper de nouvelles applications,\r\nAssurer la maintenance corrective et évolutive des applications métiers existantes,\r\nAssurer les sauvegardes des données et la reprise d’activité sur l’infrastructure secours,\r\nMaintenir le parc informatique	Français	http://localhost:5000/uploads/documents/offre_1750424369179.pdf	Gérer l’infrastructure réseau et informatique,\r\nFormer et supporter les utilisateurs,\r\nParticiper à la réalisation des nouveaux projets informatiques,\r\nDévelopper de nouvelles applications,\r\nAssurer la maintenance corrective et évolutive des applications métiers existantes,\r\nAssurer les sauvegardes des données et la reprise d’activité sur l’infrastructure secours,\r\nMaintenir le parc informatique	informatique (diplôme d’ingénieur).	Oracle	Oracle, Access, SQL Server et MySQL	Neant	2023-02-10	2025-06-20 14:59:29.465042	2025-06-20 14:59:29.465042	http://localhost:5000/uploads/documents/piece_1750424369181.pdf
12	CHEF DE SERVICE MULTINATIONALE ET RÉGIONALE CORPORATE (MRC)	Recrutement Externe	Placé sous la supervision du Directeur du Corporate Bank, le chef de service de service du segment clientèle Multinationale et Régionale Corporate (MRC) est responsable de garantir le développement de ce portefeuille. Il/elle supervise et coordonne les efforts visant à maintenir un haut niveau de service et travaille en collaboration avec d’autres départements pour offrir des solutions financières adaptées aux besoins spécifiques de ces clients.	2024-03-29	N'Djaména	CDI	CDO Consulting Tchad	BAC + 4	4 ans	Excellentes compétences en communication et négociation.\r\nFortes compétences analytiques et capacité à comprendre les besoins financiers des clients\r\nConnaissances approfondies des produits et services bancaires\r\nCapacité à travailler sous pression et à gérer plusieurs projets simultanément\r\nOrienté résultats et axé sur la satisfaction client\r\nEsprit d’équipe et capacité à motiver les autres membres de l’équipe\r\nLa maitrise du logiciel de gestion des relations clients (CRM) ou tout autre est un atout\r\nCapacité à analyser les états financiers\r\nBonne connaissance de l’outil informatique	Français et Anglais	http://localhost:5000/uploads/documents/offre_1750432741356.pdf	Exécuter une stratégie de croissance du portefeuille des Multinationales – Régionales – Corporate\r\nDévelopper et pour le segment Multinationales – Régionales – Corporate – – Fidéliser cette catégorie de clientèle\r\nVulgariser les produits digitaux\r\nAnalyser les besoins financiers des clients et recommander des produits et services adaptés\r\nNégocier et structurer des transactions complexes y compris des prets syndiqués, des financements structurés et des services de trésorerie\r\nAssurer une gestion efficace des risques liés au portefeuille de ces clients\r\nFournir un excellent service clientèle et entretenir des relations solides avec les clients\r\nMaximiser la chaine des valeurs sur cette clientèle\r\nReporting régulier sur la performance du segment au Directeur du département	Finance, en droit ou dans un domaine connexe.	SAGE	Word, Excell, SAGE Compta	Neant	2024-03-22	2025-06-20 17:19:01.563465	2025-06-20 17:19:01.563465	http://localhost:5000/uploads/documents/piece_1750432741358.pdf
11	CHEF DE SERVICE FINANCIAL INSTITUTION & INTERNATIONAL ORGANISATION 	Recrutement Externe	Placé sous la supervision du Directeur du Corporate Bank, le chef de service de service du segment clientèle Financial Institution & International Organisation (Institution Financière et Organisation Internationale) est responsable de garantir le développement de ce portefeuille. Il/elle supervise et coordonne les efforts visant à maintenir un haut niveau de service et travaille en collaboration avec d’autres départements pour offrir des solutions financières adaptées aux besoins spécifiques de ces clients.	2024-06-05	N'Djaména	CDI	\N	BAC + 4	4 ans	Excellentes compétences en communication et négociation.\r\nCapacité à comprendre les besoins financiers et non financiers des FI & IO.\r\nConnaissances approfondies des produits et services bancaires y compris les financements des projets, les opérations de trésorerie et les services de conseil.\r\nOrienté résultats et axé sur la satisfaction client.\r\nEsprit d’équipe et capacité à motiver les autres membres de l’équipe.\r\nSens des affaires et compréhension des tendances du marché.\r\nBonne connaissance de l’outil informatique.	Français et Anglais	http://localhost:5000/uploads/documents/offre_1750859729147.pdf	Développer et exécuter une stratégie de croissance du portefeuille des FI & IO.\r\nGérer un portefeuille de clients existants et prospecter de nouveaux clients.\r\nAnalyser les besoins financiers et non financiers des FI & IO et recommander des solutions adaptées.\r\nStructurer des produits et services financiers sur mesure pour répondre aux besoins spécifiques de ces clients.\r\nAssurer une gestion efficace des risques liés au portefeuille de ces clients.\r\nFournir un excellent service clientèle et entretenir des relations solides avec les clients.\r\nMaximiser la chaine des valeurs sur cette clientèle.\r\nReporting régulier sur la performance du segment au Directeur du département.	Avoir une expérience d’au moins 4 ans dans le secteur bancaire ou la gestion des ONG. Avoir un bac+ 4 au minimum en finance, gestion, comptabilité, économie. Avoir une bonne culture Générale	Aucun	Word, Excell, PowerPoint, SAGE Compta	Neant	2024-03-02	2025-06-20 16:59:13.51456	2025-06-25 15:55:29.150836	http://localhost:5000/uploads/documents/piece_1750431553363.pdf
13	CHEF DE SERVICE TRADE – SECTION OPERATIONS LOCALES	Recrutement externe	Placé sous la supervision du Directeur des opérations, le chef de service Trade-Section opérations locales est responsable de la mise en œuvre des politiques et procédures des meilleures pratiques pour les activités des opérations. Il/elle supervise une équipe chargée d’assurer le bon déroulement des opérations et de garantir la conformité avec les réglementations locales et internationales.	2024-03-29	N'Djaména	CDI	\N	BAC + 4	4 ans	Solides connaissances des opérations commerciales y compris des lettres de crédits, les garanties bancaires et les collections documentaires.\r\nExcellentes compétences en leadership.\r\nBon esprit d’équipe et bon communicateur.\r\nOrientation client élevée et compétence en résolution de problems.\r\nSolides compétences analytiques.\r\nSolides compétences en négociation.	Français et Anglais	http://localhost:5000/uploads/documents/offre_1750858613131.pdf	Faire respecter scrupuleusement les procédures opérationnelles par les membres de l’équipe.\r\nS’assurer du Rapprochement mensuel de tous les comptes placés sous la responsabilité de la section.\r\nAssurer au quotidien le rapprochement des comptes Disposition à payer et chèques certifies.\r\nAssurer la bonne tenue des dossiers chèques certifiés, virements permanents, Disposition à payer en instance.\r\nS’assurer que les opérations remarquables font régulièrement l’objet de confirmation par les gestionnaires avant le traitement.\r\nS’assurer des bons dénouements des opérations de compensation bancaire.\r\nTransmettre hebdomadairement et mensuellement le rapport d’activité du service au Responsable des opérations.\r\nGérer les risques opérationnels associés aux transactions commerciales et mettre en place des mesures d’atténuation.\r\nFixe en concertation avec le responsable du Cash Management des objectifs individuels des collaborateurs placés sous sa responsabilité et procède périodiquement à leur évaluation.\r\nAnalyser les processus opérationnels existants et proposer des améliorations.	Avoir un Bac + 4 en Gestion, Comptabilité, Finances Minimum 03 ans d’expérience pour la qualification au poste Affiliation professionnelle à tout organisme professionnel reconnu si possible.	Comptabilité	SAGE COMPTA, Excell, Word	Aucun	2024-02-02	2025-06-20 18:25:19.303516	2025-06-25 15:36:53.149341	http://localhost:5000/uploads/documents/piece_1750858613144.pdf
8	ASSISTANT DIRECTEUR DES RESSOURCES HUMAINES	Recrutement Externe	Avoir la capacité d’assister le Directeur des ressources humaines (DRH) sur le plan technique,\r\nÊtre à mesure de représenter le Directeur des ressources humaines (DRH) en cas de besoin (dans le respect de la stratégie maison).\r\nÊtre capable d’assister la Direction Générale en matière des RH en cas d’absence du Directeur des ressources humaines (DRH)\r\nRigueur, discrétion, diplomatie et organisation ;\r\nAvoir l’engagement de délivrer des solutions au personnel ;\r\nCapacité à travailler sous pression ;\r\nCapacité de surpasser le volume de travail ;\r\nÊtre polyvalent et dévoué.\r\nLeadership, Innovateur,\r\nCourtois, calme, conciliant\r\nOreille d’écoute\r\nÊtre ordonné	2024-03-29	N'Djaména	CDI	\N	BAC + 3	4 ans	Avoir une expérience d’au moins deux (02) dans le domaine des Ressources Humaines ;\r\nAvoir un Bac + 4 au minimum en GRH, Gestion, Droit, Comptabilité ou tout diplôme équivalent\r\nAvoir une maîtrise des langues française et anglaise : Écrire, parler et lire (surtout en public)\r\nUne bonne connaissance de l’outil informatique.\r\nÊtre habitué aux chiffres & aux rapports\r\nAvoir une bonne capacité rédactionnelle	Français	http://localhost:5000/uploads/documents/offre_1750859052380.pdf	La gestion de l’administration du département des ressources humaines\r\nDérouler la stratégie des ressources humaines\r\nAdministration mensuelle de la paie\r\nJustification de la masse salariale et les variations\r\nAssurer la gestion des frais médicaux et la relation avec les assureurs\r\nSuivi des reversements et paiements dans les délais des impôts et taxes sur salaire, les cotisations sociales ainsi que la tenue des bordereaux et quittance\r\nAssurer la gestion des prêts et avances au personnel\r\nAssurer l’analyse et la justification des comptes rattachés au département des ressources humaines\r\nAssurer la gestion des stages\r\nAssurer le suivi des dossiers des retraites et allocations familiales avec la CNPS\r\nParticiper à la rencontre périodique avec les délégués du personnel\r\nGestion des avantages du personnel sur validation du Directeur des ressources humaines\r\nEffectuer certaines études périodiques ou ponctuelles à la demande du Directeur des ressources humaines\r\nProposer et faire valider le planning des activités du Département\r\nS’assurer du respect des réglementations en vigueur dans l’exercice de vos fonctions\r\nS’assurer de la réalisation et du suivi des plans d’actions	GRH, Gestion, Droit, Comptabilité ou tout diplôme équivalent	Excell	Word, Excell, PowerPoint	Neant	2024-02-02	2025-06-20 11:47:42.996428	2025-06-25 15:44:12.385787	http://localhost:5000/uploads/documents/piece_1750859052382.pdf
7	CHEF DE SERVICE TRADE – SECTION OPERATIONS LOCALES 	Recrutement externe	Placé sous la supervision du Directeur des opérations, le chef de service Trade-Section opérations locales est responsable de la mise en œuvre des politiques et procédures des meilleures pratiques pour les activités des opérations. Il/elle supervise une équipe chargée d’assurer le bon déroulement des opérations et de garantir la conformité avec les réglementations locales et internationales.	2024-05-29	N'djamena	CDI	\N	BAC + 4	4 ans	•\tSolides connaissances des opérations commerciales y compris des lettres de crédits, les garanties bancaires et les collections documentaires.\r\n•\tExcellentes compétences en leadership.\r\n•\tBon esprit d’équipe et bon communicateur.\r\n•\tOrientation client élevée et compétence en résolution de problems.\r\n•\tSolides compétences analytiques.\r\n•\tSolides compétences en négociation.\r\n	Anglais	http://localhost:5000/uploads/documents/offre_1750859629577.pdf	•\tFaire respecter scrupuleusement les procédures opérationnelles par les membres de l’équipe.\r\n•\tS’assurer du Rapprochement mensuel de tous les comptes placés sous la responsabilité de la section.\r\n•\tAssurer au quotidien le rapprochement des comptes Disposition à payer et chèques certifies.\r\n•\tAssurer la bonne tenue des dossiers chèques certifiés, virements permanents, Disposition à payer en instance.\r\n•\tS’assurer que les opérations remarquables font régulièrement l’objet de confirmation par les gestionnaires avant le traitement.\r\n•\tS’assurer des bons dénouements des opérations de compensation bancaire.\r\n•\tTransmettre hebdomadairement et mensuellement le rapport d’activité du service au Responsable des opérations.\r\n•\tGérer les risques opérationnels associés aux transactions commerciales et mettre en place des mesures d’atténuation.\r\n•\tFixe en concertation avec le responsable du Cash Management des objectifs individuels des collaborateurs placés sous sa responsabilité et procède périodiquement à leur évaluation.\r\n•\tAnalyser les processus opérationnels existants et proposer des améliorations.\r\n	Gestion, Comptabilité, Finances	Gestion	Excel	Comptabilité	2024-03-17	2025-06-16 14:41:11.082781	2025-06-25 15:53:49.582073	\N
\.


--
-- Data for Name: utilisateurs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilisateurs (id, nom, prenom, email, motdepasse, role, actif) FROM stdin;
\.


--
-- Name: actualites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actualites_id_seq', 5, true);


--
-- Name: administrateurs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.administrateurs_id_seq', 4, true);


--
-- Name: applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applications_id_seq', 1, false);


--
-- Name: avis_recrutement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.avis_recrutement_id_seq', 1, false);


--
-- Name: candidatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidatures_id_seq', 14, true);


--
-- Name: galerie_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.galerie_id_seq', 28, true);


--
-- Name: job_postings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_postings_id_seq', 1, false);


--
-- Name: offres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.offres_id_seq', 13, true);


--
-- Name: utilisateurs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilisateurs_id_seq', 1, false);


--
-- Name: actualites actualites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actualites
    ADD CONSTRAINT actualites_pkey PRIMARY KEY (id);


--
-- Name: administrateurs administrateurs_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrateurs
    ADD CONSTRAINT administrateurs_email_key UNIQUE (email);


--
-- Name: administrateurs administrateurs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrateurs
    ADD CONSTRAINT administrateurs_pkey PRIMARY KEY (id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: avis_recrutement avis_recrutement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avis_recrutement
    ADD CONSTRAINT avis_recrutement_pkey PRIMARY KEY (id);


--
-- Name: candidatures candidatures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidatures
    ADD CONSTRAINT candidatures_pkey PRIMARY KEY (id);


--
-- Name: galerie galerie_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.galerie
    ADD CONSTRAINT galerie_pkey PRIMARY KEY (id);


--
-- Name: job_postings job_postings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_pkey PRIMARY KEY (id);


--
-- Name: offres offres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offres
    ADD CONSTRAINT offres_pkey PRIMARY KEY (id);


--
-- Name: utilisateurs utilisateurs_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_email_key UNIQUE (email);


--
-- Name: utilisateurs utilisateurs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_pkey PRIMARY KEY (id);


--
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_postings(id) ON DELETE CASCADE;


--
-- Name: candidatures fk_offre; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidatures
    ADD CONSTRAINT fk_offre FOREIGN KEY (offre_id) REFERENCES public.offres(id) ON DELETE CASCADE;


--
-- Tables ajoutées lors du nettoyage Phase 0 : utilisées par le code actif
-- (services.routes.js, contact.service.js) mais absentes de l'export d'origine.
-- Schéma reconstitué à partir des requêtes SQL littérales du code, colonne par colonne.
--

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    titre text NOT NULL,
    description text,
    icone text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.services OWNER TO postgres;

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;
ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;
ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: sous_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sous_services (
    id integer NOT NULL,
    service_id integer NOT NULL,
    nom text NOT NULL
);


ALTER TABLE public.sous_services OWNER TO postgres;

CREATE SEQUENCE public.sous_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sous_services_id_seq OWNER TO postgres;
ALTER SEQUENCE public.sous_services_id_seq OWNED BY public.sous_services.id;
ALTER TABLE ONLY public.sous_services ALTER COLUMN id SET DEFAULT nextval('public.sous_services_id_seq'::regclass);

ALTER TABLE ONLY public.sous_services
    ADD CONSTRAINT sous_services_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sous_services
    ADD CONSTRAINT sous_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: messages_contact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages_contact (
    id integer NOT NULL,
    nom text NOT NULL,
    email text NOT NULL,
    sujet text,
    message text NOT NULL,
    date_envoi timestamp without time zone DEFAULT now()
);


ALTER TABLE public.messages_contact OWNER TO postgres;

CREATE SEQUENCE public.messages_contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_contact_id_seq OWNER TO postgres;
ALTER SEQUENCE public.messages_contact_id_seq OWNED BY public.messages_contact.id;
ALTER TABLE ONLY public.messages_contact ALTER COLUMN id SET DEFAULT nextval('public.messages_contact_id_seq'::regclass);

ALTER TABLE ONLY public.messages_contact
    ADD CONSTRAINT messages_contact_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

