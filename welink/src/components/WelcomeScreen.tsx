import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CheckCircle2, Heart, Quote, Star, User, Building, Tractor, PlusCircle, MessageSquare } from 'lucide-react';
import { WeLinkLogo } from './WeLinkLogo';

interface WelcomeScreenProps {
  activeBusinessesCount: number;
  activeSuppliersCount: number;
  activeJobsCount: number;
  activeProductsCount: number;
  onDismiss: () => void;
}

interface Testimonial {
  id: string;
  author: string;
  role: string;
  quote: string;
  rating: number;
  date: string;
}

const initialTestimonials: Testimonial[] = [
  {
    id: "t1",
    author: "Marie-Claire K.",
    role: "Restauratrice, 'Saveurs du Pays'",
    quote: "Grâce au catalogue direct, j'achète mes produits frais de saison auprès d'agriculteurs locaux en quelques clics. J'ai pu considérablement augmenter mes ventes en ligne.",
    rating: 5,
    date: "Il y a 3 jours"
  },
  {
    id: "t2",
    author: "Koffi N'Guessan",
    role: "Artisan Ébéniste",
    quote: "WeLink me permet d'écouler mes fabrications artisanales en quelques instants auprès de boutiques partenaires. C'est l'application idéale pour vendre nos créations !",
    rating: 5,
    date: "Il y a 1 semaine"
  },
  {
    id: "t3",
    author: "Amina Doumbia",
    role: "Cliente Particulière",
    quote: "Je fais mes achats en ligne sur la plateforme tous les week-ends ! C'est super fluide. Et j'ai même pu postuler à un emploi d'appoint dans une épicerie voisine.",
    rating: 5,
    date: "Il y a 2 semaines"
  },
  {
    id: "t4",
    author: "Gérard l'Agriculteur",
    role: "Producteur maraîcher",
    quote: "Une solution formidable pour liquider rapidement mon surstock de carottes et de pommes de terre directement auprès des restaurants du coin.",
    rating: 4,
    date: "Il y a 2 jours"
  }
];

export default function WelcomeScreen({
  activeBusinessesCount,
  activeSuppliersCount,
  activeJobsCount,
  activeProductsCount,
  onDismiss
}: WelcomeScreenProps) {
  const [reviews, setReviews] = useState<Testimonial[]>(initialTestimonials);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRole, setNewRole] = useState('Client de Proximité');
  const [newQuote, setNewQuote] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newQuote.trim()) return;

    const addedReview: Testimonial = {
      id: Date.now().toString(),
      author: newAuthor,
      role: newRole,
      quote: newQuote,
      rating: newRating,
      date: "À l'instant"
    };

    setReviews([addedReview, ...reviews]);
    setNewAuthor('');
    setNewQuote('');
    setNewRating(5);
    setShowForm(false);
    setSuccessMsg('Merci pour votre note ! Votre avis a été ajouté avec succès.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Calculate average score like Play Store
  const totalRating = reviews.reduce((acc, curr) => acc + curr.rating, 0);
  const averageRating = (totalRating / reviews.length).toFixed(1);

  return (
    <div
      id="welcome-portal"
      className="max-w-6xl mx-auto bg-slate-900/75 border border-slate-800/80 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md animate-fade-in text-slate-100 font-sans shadow-welink"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

      {/* Top Welcome Header */}
      <div className="text-center md:text-left md:flex md:items-center md:justify-between border-b border-slate-800/80 pb-8 mb-8 relative z-10">
        <div className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <WeLinkLogo iconSize="lg" isDarkBackground={true} />
            <div className="inline-flex items-center space-x-2 bg-indigo-950/80 border border-indigo-900/60 text-indigo-300 text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider w-max self-start md:self-auto animate-pulse">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>WeLink - Écosystème Connecté</span>
            </div>
          </div>
          <p className="text-sm md:text-base text-slate-300 mt-2 max-w-4xl font-semibold leading-relaxed">
            WeLink, commerce et carrière au bout des doigts
          </p>
          <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
            La solution numérique tout-en-un pour dynamiser l'économie de proximité. Accédez instantanément à des opportunités de recrutement sur-mesure ou simplifiez vos achats et ventes directes de quartier sans intermédiaire.
          </p>
        </div>
      </div>

      {/* Core Profiles Presentation Side-by-Side (3 Columns) */}
      <div className="relative z-10 mb-8">
        <h2 className="text-sm font-bold text-slate-300 flex items-center space-x-2 mb-6 uppercase tracking-wider justify-center md:justify-start">
          <Heart className="w-4 h-4 text-violet-400" />
          <span>Une application complète, trois comptes adaptés à vos besoins</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Client Citoyen */}
          <div className="bg-indigo-950/15 border border-indigo-900/30 rounded-2xl p-5 md:p-6 space-y-4 hover:border-indigo-800/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#a5b4fc]">Particulier</span>
              <span className="w-7 h-7 bg-indigo-900/40 rounded-lg flex items-center justify-center text-xs text-indigo-300 font-bold">1</span>
            </div>
            <h3 className="text-md font-extrabold text-indigo-300 flex items-center space-x-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Achat en ligne & Emploi</span>
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed">
              Faites vos achats en toute simplicité auprès de vos boutiques et trouvez un emploi à proximité.
            </p>
            <div className="space-y-2.5 pt-2 border-t border-slate-800/40">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-450 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300"><strong>Commandes faciles :</strong> Achetez plats cuisinés de quartier, épicerie et artisanat.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-450 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300"><strong>Candidature Rapide :</strong> Postulez directement aux offres de recrutement publiées.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-450 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300"><strong>Suivi de Commande :</strong> Suivez les statuts de préparation et livraison.</span>
              </div>
            </div>
          </div>

          {/* Card 2: Entreprise de Terrain */}
          <div className="bg-violet-950/15 border border-violet-900/30 rounded-2xl p-5 md:p-6 space-y-4 hover:border-violet-800/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#c084fc]">Boutique & commerce</span>
              <span className="w-7 h-7 bg-violet-900/40 rounded-lg flex items-center justify-center text-xs text-violet-300 font-bold">2</span>
            </div>
            <h3 className="text-md font-extrabold text-violet-300 flex items-center space-x-2">
              <Building className="w-4 h-4 text-violet-400" />
              <span>Vente & Recrutement</span>
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed">
              Écoulez rapidement vos produits, encaissez vos ventes et recrutez de nouveaux talents locaux.
            </p>
            <div className="space-y-2.5 pt-2 border-t border-slate-800/40">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-450 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300"><strong>Gestion de ventes :</strong> Une caisse enregistreuse claire pour toutes vos transactions.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-450 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300"><strong>Offres d'emploi :</strong> Publiez des fiches de poste pour attirer les candidats du quartier.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-450 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300"><strong>Ravitaillement :</strong> Achetez vos matières premières directement aux producteurs.</span>
              </div>
            </div>
          </div>

          {/* Card 3: Fornisseur */}
          <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-2xl p-5 md:p-6 space-y-4 hover:border-emerald-800/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#34d399]">Fournisseur</span>
              <span className="w-7 h-7 bg-emerald-900/40 rounded-lg flex items-center justify-center text-xs text-emerald-300 font-bold">3</span>
            </div>
            <h3 className="text-md font-extrabold text-emerald-300 flex items-center space-x-2">
              <Tractor className="w-4 h-4 text-emerald-400" />
              <span>Distribution en gros</span>
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed">
              Vendez de gros volumes ou stocks d'équipements, récoltes et matières premières aux commerces partenaires.
            </p>
            <div className="space-y-2.5 pt-2 border-t border-slate-800/40">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300"><strong>Catalogues B2B :</strong> Listez vos produits à des prix compétitifs pour liquidation rapide.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300"><strong>Expéditions simplifiées :</strong> Validez les commandes industrielles et suivez les envois.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300"><strong>Vente sans Intermédiaire :</strong> Rapprochez-vous directement des professionnels de la région.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Play Store Rating & Interactive Feedbacks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 mb-8">
        
        {/* Left component: Google Play Store rating visualization */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
              <span>Avis sur l'application</span>
            </div>
            
            <div className="flex items-baseline space-x-3 mt-4">
              <span className="text-5xl font-extrabold text-white tracking-tight">{averageRating}</span>
              <div>
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(parseFloat(averageRating)) ? 'fill-current' : 'text-slate-700'}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block mt-1">Basé sur {reviews.length} témoignages</span>
              </div>
            </div>

            {/* Simulated progress bars */}
            <div className="space-y-1.5 mt-6">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter(r => r.rating === stars).length;
                const percent = (count / reviews.length) * 100;
                return (
                  <div key={stars} className="flex items-center text-xs text-slate-400">
                    <span className="w-3 text-right mr-2">{stars}</span>
                    <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden mr-3">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="w-6 text-right text-[10px] text-slate-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 mt-6 md:mt-0">
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Votre expérience compte pour notre communauté d'acheteurs et d'entrepreneurs !
            </p>
            {!showForm ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-indigo-300 font-bold rounded-xl text-xs transition duration-250 flex items-center justify-center space-x-1.5 cursor-pointer hover:text-white"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Laisser un avis & une note</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-full py-2 px-4 bg-slate-900 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition duration-250 border border-slate-850 cursor-pointer"
              >
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* Right component: Feedbacks list & submission form */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between">
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-semibold animate-bounce">
              {successMsg}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2 border-b border-slate-900 pb-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Rédiger votre témoignage</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Votre Nom / Pseudo</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="ex: Yao Koffi"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Votre Activité / Profil</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Client Particulier">👤 Client de Proximité / Candidat</option>
                    <option value="Gérant de boutique B2C">🏢 Boutique / Commerce</option>
                    <option value="Producteur & Fournisseur B2B">🚜 Producteur & Artisan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sélectionner votre Note</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 cursor-pointer transition transform hover:scale-110"
                    >
                      <Star className={`w-6 h-6 ${star <= newRating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Votre Commentaire</label>
                <textarea
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  placeholder="Expliquez en quoi l'appli facilite vos commandes en ligne, vos ventes ou vos recrutements..."
                  rows={3}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Soumettre mon avis au catalogue
              </button>
            </form>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Avis de nos utilisateurs</h3>
                <span className="text-[10px] text-indigo-400 font-semibold">{reviews.length} avis publiés</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[280px] overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-900/40 border border-slate-850/60 p-4 rounded-xl flex flex-col justify-between hover:border-slate-800 transition">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((sh) => (
                            <Star
                              key={sh}
                              className={`w-3 h-3 ${sh <= rev.rating ? 'fill-current' : 'text-slate-800'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] text-slate-500 font-medium">{rev.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 italic line-clamp-3 leading-relaxed mb-3">
                        "{rev.quote}"
                      </p>
                    </div>

                    <div className="border-t border-slate-950/60 pt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 block truncate max-w-[130px]">{rev.author}</span>
                      <span className="text-[9px] text-slate-500 block truncate max-w-[110px] text-right font-medium">{rev.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Main Core Action Box to connect */}
      <div className="mt-8 bg-linear-to-r from-indigo-950/30 via-slate-900/60 to-emerald-950/20 border border-indigo-900/40 p-6 md:p-8 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between z-10">
        <div className="text-center md:text-left md:max-w-xl mb-6 md:mb-0">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#34d399] block mb-1">Démarrer vos publications & achats</span>
          <h4 className="font-extrabold text-lg text-white">Écoulez vos produits et simplifiez vos recrutements</h4>
          <p className="text-xs text-slate-400 leading-relaxed mt-1">
            Connectez-vous pour choisir le compte qui correspond le mieux à votre activité. Déposez des fiches de poste, postulez ou liquidez vos marchandises en ligne d'un clic.
          </p>
        </div>

        {/* BIG ACTION BUTTON TO DISMISS AND GO TO WORKSPACE */}
        <button
          id="welcome-dismiss-action"
          onClick={onDismiss}
          className="flex items-center justify-center space-x-3.5 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 active:translate-y-px text-white text-sm font-bold rounded-xl shadow-xl shadow-indigo-600/25 transition cursor-pointer shrink-0 w-full md:w-auto hover:shadow-indigo-500/30 font-sans"
        >
          <span>Commencer l'expérience</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
