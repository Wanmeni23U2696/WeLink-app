import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserProfile, Product, Order, RestaurantTable, RestaurantBooking, DishRating } from '../types';
import marketEtalageBg from '../assets/images/market_etalage_bg_1780937807541.png';
import epicerieSpicesBg from '../assets/images/grocery_epicerie_spices_bg_1781026049545.png';
import secretariatBureautiqueBg from '../assets/images/secretariat_bureautique_bg_1781086315338.png';
import agriculteurMaraicherBg from '../assets/images/agriculteur_maraicher_bg_1781088890833.png';
import artisanArtWoodcraftBg from '../assets/images/artisan_art_woodcraft_bg_1781089788361.png';
import eleveurStableWoodBg from '../assets/images/eleveur_stable_wood_bg_1781090474698.png';
import poissonnierSeafoodIceBg from '../assets/images/poissonnier_seafood_ice_bg_1781093439613.png';
import boucherCharcuterieBg from '../assets/images/boucher_charcuterie_counter_bg_1781094621741.png';
import poissonnerieBgImg from '../assets/images/poissonnerie_bg_1781095395203.png';
import { 
  MapPin, Phone, Mail, Clock, ShieldCheck, 
  ShoppingCart, ShoppingBag, ArrowLeft, Search, 
  ChevronRight, Check, Plus, Trash2, Heart, 
  Award, Sparkles, Loader2, CheckCircle2, Wallet,
  Volume2, VolumeX
} from 'lucide-react';

import WhatsAppButton from './WhatsAppButton';

interface PaymentPreference {
  id: string;
  type: 'mobile_money' | 'bank_transfer' | 'card';
  label: string;
  holderName: string;
  provider: string;
  accountNumber: string;
  isDefault: boolean;
  createdAt: string;
}

interface ShopShowcasePortalProps {
  seller: UserProfile;
  user: UserProfile;
  products: Product[];
  orders: Order[];
  cart: { [productId: string]: number };
  onBack: () => void;
  onRefreshState: () => void;
  addToCart: (productId: string, stock: number) => void;
  removeFromCart: (productId: string) => void;
  setCart: React.Dispatch<React.SetStateAction<{ [productId: string]: number }>>;
  getProdCurrentPrice: (p: Product) => number;
  handleCheckout: (productId: string, quantity: number) => Promise<void>;
  handleCheckoutBulk: (schedDate?: string, schedTime?: string, itemCuts?: Record<string, string>, serviceType?: string, deliveryAddress?: string, tableNumber?: string) => Promise<void>;
  paymentPreferences: PaymentPreference[];
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  useEscrowPayment: boolean;
  setUseEscrowPayment: (val: boolean) => void;
  orderLoading: boolean;
  triggerToast: (msg: string) => void;
  restaurantTables?: RestaurantTable[];
  restaurantBookings?: RestaurantBooking[];
  dishRatings?: DishRating[];
  companyReviews?: any[];
}

export default function ShopShowcasePortal({
  seller,
  user,
  products,
  orders,
  cart,
  onBack,
  onRefreshState,
  addToCart,
  removeFromCart,
  setCart,
  getProdCurrentPrice,
  handleCheckout,
  handleCheckoutBulk,
  paymentPreferences,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  useEscrowPayment,
  setUseEscrowPayment,
  orderLoading,
  triggerToast,
  restaurantTables = [],
  restaurantBookings = [],
  dishRatings = [],
  companyReviews = []
}: ShopShowcasePortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeImageByProduct, setActiveImageByProduct] = useState<Record<string, string>>({});
  
  // Custom states for Poissonnerie & customizable weight/scheduling
  const [selectedWeightByProduct, setSelectedWeightByProduct] = useState<Record<string, number>>({});
  const [selectedCutByProduct, setSelectedCutByProduct] = useState<Record<string, string>>({});
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [alertEmail, setAlertEmail] = useState(user.email || '');
  const [subscribedProductIds, setSubscribedProductIds] = useState<string[]>([]);

  // Restaurant Client State
  const [serviceType, setServiceType] = useState<string>('dinein'); // dinein, takeout, delivery
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');

  // Table Reservation interface states
  const [isReservingTable, setIsReservingTable] = useState(false);
  const [resTableGuests, setResTableGuests] = useState<number>(2);
  const [resTableDate, setResTableDate] = useState<string>('');
  const [resTableTime, setResTableTime] = useState<string>('');
  const [resTableZone, setResTableZone] = useState<string>('interior'); // interior, terrace, vip
  const [resTableNotes, setResTableNotes] = useState<string>('');
  const [resTablePhone, setResTablePhone] = useState<string>(user.phone || '');
  const [resTableLoading, setResTableLoading] = useState(false);
  const [showRatingsForProduct, setShowRatingsForProduct] = useState<string | null>(null);

  // Leave review states for products
  const [ratingProduct, setRatingProduct] = useState<Product | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);

  // Enterprise level reviews
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      triggerToast("⚠️ Veuillez rédiger un texte pour votre avis.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: seller.id,
          companyName: seller.name,
          reviewerId: user.id,
          reviewerName: user.name,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (!response.ok) {
        throw new Error("Erreur de sauvegarde de l'avis.");
      }

      const result = await response.json();
      if (result.success) {
        triggerToast("✨ Merci pour votre avis ! Votre feedback est enregistré.");
        setReviewComment('');
        setReviewRating(5);
        onRefreshState();
      }
    } catch (err) {
      console.error(err);
      triggerToast("❌ Échec de la soumission de l'avis.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const playBeep = (freq = 440) => {
    if (!isSoundOn) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {
      // Ignored
    }
  };

  const cartRef = useRef<HTMLDivElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isCartOpen &&
        cartRef.current &&
        !cartRef.current.contains(event.target as Node) &&
        (!cartButtonRef.current || !cartButtonRef.current.contains(event.target as Node))
      ) {
        setIsCartOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartOpen]);

  // Identify Brand Theme details based on name
  const nameLower = seller.name.toLowerCase();
  
  const isRaoul = nameLower.includes('raoul') || seller.enterpriseType === 'restaurant';
  const isGlas = (nameLower.includes('glas') && seller.enterpriseType !== 'alimentation') || seller.enterpriseType === 'marche';
  const isVuitton = nameLower.includes('vuitton') || seller.enterpriseType === 'vetement';
  const isKylie = nameLower.includes('kylie') || seller.enterpriseType === 'supermarche';
  const isAlimentation = seller.enterpriseType === 'alimentation';
  const isSecretariat = seller.enterpriseType === 'secretariat';
  const isAgriculteur = seller.supplierType === 'agriculteur' || (seller.enterpriseType === 'autre' && (nameLower.includes('agriculteur') || nameLower.includes('maraicher') || nameLower.includes('maraîcher'))) || nameLower.includes('fermier') || nameLower.includes('gérard') || nameLower.includes('gerard') || nameLower.includes('récolte') || nameLower.includes('recolte');
  const isArtisan = seller.supplierType === 'artisan' || (seller.enterpriseType === 'autre' && (nameLower.includes('artisan') || nameLower.includes('bois') || nameLower.includes('sculpture') || nameLower.includes('menuiser'))) || nameLower.includes('koffi') || nameLower.includes('fabricant') || nameLower.includes('sculpteur') || nameLower.includes('ébéniste') || nameLower.includes('ebeniste') || nameLower.includes('artisanat');
  const isEleveur = seller.supplierType === 'eleveur' || nameLower.includes('eleveur') || nameLower.includes('éleveur') || nameLower.includes('savanes') || nameLower.includes('bétail') || nameLower.includes('volaille') || nameLower.includes('élevage') || nameLower.includes('elevage') || nameLower.includes('pâturage') || nameLower.includes('paturage') || nameLower.includes('ferme');
  const isPoissonnier = seller.supplierType === 'poissonnier' || nameLower.includes('marée') || nameLower.includes('maree') || nameLower.includes('pêche') || nameLower.includes('peche') || nameLower.includes('crustacé') || nameLower.includes('crustace') || nameLower.includes('mer');
  const isBoucher = seller.enterpriseType === 'boucher' || nameLower.includes('boucher') || nameLower.includes('charcutier') || nameLower.includes('viande');
  const isPoissonnerie = seller.enterpriseType === 'poissonnerie' || nameLower.includes('poissonnerie') || (nameLower.includes('poisson') && seller.profileType === 'entreprise');

  const brand = useMemo(() => {
    if (isRaoul) {
      return {
        logo: 'Raoul.',
        tagline: 'Une expérience gastronomique inoubliable',
        fullTagline: 'Découvrez une expérience culinaire unique, préparée avec passion et des ingrédients de qualité.',
        ctaText: 'Découvrir notre Menu Interactif',
        bgAccent: 'bg-[#e11d48]', // rose-600
        bgAccentHover: 'hover:bg-rose-700',
        textAccent: 'text-[#e11d48]',
        borderAccent: 'border-rose-500',
        ringAccent: 'focus:ring-rose-500',
        headerBg: 'bg-black/95 text-white',
        bannerImg: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
        fontFamily: 'font-sans',
        whyUsTitle: 'Infos Pratiques',
        whyUsCards: [
          { title: '📍 Adresse', desc: 'Contactez-nous pour la localisation exacte et réservations.' },
          { title: '🕒 Horaires', desc: 'Ouvert 7j/7 de 11h00 à 23h00 non-stop.' },
          { title: '📞 Téléphone', desc: seller.phone || '237 645678034' },
          { title: '✉️ Email', desc: seller.email || 'raoulyves@gmail.com' }
        ],
        catalogTitle: 'Notre Menu Numérique',
        catalogDesc: 'Parcourez nos plats chauds traditionnels africains et de grillades premium concoctés par nos chefs.',
        btnColor: 'bg-rose-600 hover:bg-rose-700 text-white',
        btnLightColor: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
      };
    } else if (isGlas) {
      return {
        logo: seller.name.toLowerCase().includes('glas') ? 'Glas.' : `${seller.name}.`,
        tagline: seller.description || 'Le frais, près de chez vous',
        fullTagline: seller.description || 'Retrouvez des produits frais, locaux, bios et de haute qualité pour toutes vos courses quotidiennes.',
        ctaText: 'Voir nos Étalages',
        bgAccent: 'bg-emerald-600',
        bgAccentHover: 'hover:bg-emerald-700',
        textAccent: 'text-emerald-700',
        borderAccent: 'border-emerald-500',
        ringAccent: 'focus:ring-emerald-500',
        headerBg: 'bg-emerald-850 text-white',
        bannerImg: marketEtalageBg,
        fontFamily: 'font-sans',
        whyUsTitle: 'Pourquoi nous choisir ?',
        whyUsCards: [
          { title: '🥬 Fruits & Légumes', desc: 'Approvisionnement direct de Douala à Yaoundé, récoltés du matin pour vous.' },
          { title: '🏷️ Prix Équitables', desc: 'Des tarifs compétitifs de gros profitant à l\'agriculture locale.' },
          { title: '🚚 Livraison à domicile', desc: 'Service de livraison rapide et sécurisé directement chez vous.' },
          { title: '📞 Contact Direct', desc: seller.phone || '237 645678451' }
        ],
        catalogTitle: 'Nos Produits Frais',
        catalogDesc: 'Bénéficiez du meilleur de l\'agriculture locale de proximité livrée en un temps record.',
        btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        btnLightColor: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250'
      };
    } else if (isVuitton) {
      return {
        logo: 'Vuitton.',
        tagline: 'L\'élégance à portée de main',
        fullTagline: 'Découvrez notre collection exclusive de pièces de couture, mode et habillement soigneusement sélectionnées.',
        ctaText: 'DÉCOUVRIR LA COLLECTION',
        bgAccent: 'bg-amber-600',
        bgAccentHover: 'hover:bg-amber-700',
        textAccent: 'text-amber-700',
        borderAccent: 'border-amber-500',
        ringAccent: 'focus:ring-amber-500',
        headerBg: 'bg-slate-950 text-white border-b border-amber-900/30',
        bannerImg: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        fontFamily: 'font-serif',
        whyUsTitle: 'Nos Services d\'Élégance',
        whyUsCards: [
          { title: '📦 Livraison Privée', desc: 'Un emballage haute couture et livraison sécurisée de proximité.' },
          { title: '🔄 Échanges & Retours', desc: 'Échanges autorisés sous 7 jours contre tout défaut ou taille.' },
          { title: '🛡️ Authenticité Garantie', desc: 'Toutes les créations de mode sont des pièces authentiques.' },
          { title: '📞 Service Client', desc: seller.phone || '237 609198012' }
        ],
        catalogTitle: 'Notre Collection Exclusive',
        catalogDesc: 'Chaque pièce incarne le savoir-faire créateur. Échauffez vos désirs avec la collection capsule.',
        btnColor: 'bg-amber-700 hover:bg-amber-800 text-white tracking-widest',
        btnLightColor: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
      };
    } else if (isKylie) {
      return {
        logo: 'WeLink.',
        tagline: 'Votre supermarché de confiance',
        fullTagline: 'Votre hypermarché de proximité avec des prix hyper légers et des rayons complets pour la famille.',
        ctaText: 'Faire mes courses',
        bgAccent: 'bg-[#9f1239]', // rose-800 / plum
        bgAccentHover: 'hover:bg-rose-900',
        textAccent: 'text-[#9f1239]',
        borderAccent: 'border-rose-900',
        ringAccent: 'focus:ring-rose-800',
        headerBg: 'bg-rose-950 text-white',
        bannerImg: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
        fontFamily: 'font-sans',
        whyUsTitle: 'Infos Pratiques',
        whyUsCards: [
          { title: '🏢 Rayons Complets', desc: 'Épicerie, Boucherie, Fruits & légumes, et rayon bébé à prix bas.' },
          { title: '🕒 Heures d\'ouverture', desc: 'Lun-Sam : 8h00 - 21h00, Dim : 9h00 - 18h00.' },
          { title: '📞 Assistance locale', desc: seller.phone || '237 645678029' },
          { title: '✉️ Courriel boutique', desc: seller.email || 'chrisk@gmail.com' }
        ],
        catalogTitle: 'Notre Catalogue Spécial',
        catalogDesc: 'Parcourez un vaste catalogue contenant tout ce qui est essentiel pour votre foyer.',
        btnColor: 'bg-rose-800 hover:bg-rose-900 text-white',
        btnLightColor: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
      };
    } else if (isAlimentation) {
      return {
        logo: `${seller.name}.`,
        tagline: seller.description || "L'authenticité des saveurs et condiments de quartier",
        fullTagline: seller.description || "Votre épicerie fine de proximité proposant des céréales locales sélectionnées, d'excellentes épices, koki, condiments et essentiels du foyer.",
        ctaText: "Explorer l'Épicerie",
        bgAccent: "bg-amber-650",
        bgAccentHover: "hover:bg-amber-700",
        textAccent: "text-amber-500",
        borderAccent: "border-amber-600",
        ringAccent: "focus:ring-amber-500",
        headerBg: "bg-[#362619] text-[#fff2e2]",
        bannerImg: epicerieSpicesBg,
        fontFamily: "font-sans",
        whyUsTitle: "Nos Valeurs Épicères",
        whyUsCards: [
          { title: "🌾 Céréales Locales", desc: "Sorgho, mil, maïs et riz de qualité supérieure issus directement de coopératives paysannes." },
          { title: "🌶️ Épices & Condiments", desc: "Currys parfumés, koki frais, piments séchés et gingembre pour sublimer tous vos plats hôteliers." },
          { title: "🥫 Secs & Conserves", desc: "Sélections de premier choix d'huiles de cuisson, conserves, et essentiels d'épicerie à prix équitable." },
          { title: "📞 Service Direct", desc: seller.phone || 'Contactez-nous pour des compositions personnalisées.' }
        ],
        catalogTitle: "Nos Produits d'Épicerie",
        catalogDesc: "Parcourez une sélection de saveurs traditionnelles et d'essentiels livrés directement dans la zone.",
        btnColor: "bg-amber-600 hover:bg-amber-700 text-white font-bold",
        btnLightColor: "bg-amber-950/40 text-amber-200 border border-amber-800"
      };
    } else if (isSecretariat) {
      return {
        logo: `${seller.name}.`,
        tagline: "Secrétariat & Prestations Digitales d'excellence",
        fullTagline: "Impression numérique haute définition, reliure de rapports de stage, thèses, saisie et assistance administrative express.",
        ctaText: "Découvrir nos Prestations",
        bgAccent: "bg-amber-600",
        bgAccentHover: "hover:bg-amber-700",
        textAccent: "text-amber-500",
        borderAccent: "border-amber-600",
        ringAccent: "focus:ring-amber-500",
        headerBg: "bg-[#331c0e] text-[#ffe9d2]",
        bannerImg: secretariatBureautiqueBg,
        fontFamily: "font-sans",
        whyUsTitle: "Nos Prestations Administratives",
        whyUsCards: [
          { title: "🖨️ Impression Express", desc: "Tirages noir et blanc ou couleur haute définition de rapports et thèses." },
          { title: "📁 Reliure de thèses", desc: "Finition collée solide et propre garantissant un rendu académique de qualité." },
          { title: "💻 Transcription & Saisie", desc: "Saisie de textes, rapports, CV et courriers administratifs de qualité." },
          { title: "🕒 Horaires Flexibles", desc: seller.phone ? `Contactez-nous au ${seller.phone}` : 'Disponible du lundi au samedi non-stop.' }
        ],
        catalogTitle: "Nos Services Bureautiques",
        catalogDesc: "Sélectionnez vos travaux d'écriture, formats d'impression, reliures ou photocopies.",
        btnColor: "bg-amber-600 hover:bg-amber-700 text-white font-bold",
        btnLightColor: "bg-amber-950/40 text-amber-200 border border-amber-800"
      };
    } else if (isAgriculteur) {
      return {
        logo: `${seller.name}.`,
        tagline: seller.description || "Fraîcheur locale en direct des récoltes",
        fullTagline: seller.description || "Achetez en direct de notre exploitation maraîchère éco-responsable. Des produits de saison mûris au soleil de proximité.",
        ctaText: "Découvrir nos Récoltes",
        bgAccent: "bg-amber-600",
        bgAccentHover: "hover:bg-amber-700",
        textAccent: "text-amber-500",
        borderAccent: "border-amber-600",
        ringAccent: "focus:ring-amber-500",
        headerBg: "bg-[#271c11] text-[#fff6e6]",
        bannerImg: agriculteurMaraicherBg,
        fontFamily: "font-sans",
        whyUsTitle: "Nos Engagements de Producteur",
        whyUsCards: [
          { title: "🚜 Direct Producteur", desc: "Zéro intermédiaire. Les produits vont directement de notre champ à vos paniers." },
          { title: "🥬 Récolté le Matin", desc: "La fraîcheur maximale garantie grâce à un arrachage et tri à l'aube des livraisons." },
          { title: "🌱 Éco-Responsable", desc: "Savoir-faire traditionnel respectueux des sols et de la biodiversité locale." },
          { title: "📞 Commande & Contact", desc: seller.phone ? `Joindre au ${seller.phone}` : "Disponibilité du lundi au samedi." }
        ],
        catalogTitle: "Nos Légumes & Fruits de Saison",
        catalogDesc: "Soutenez le travail de la terre en choisissant des produits sains, savoureux et 100% locaux.",
        btnColor: "bg-amber-600 hover:bg-amber-700 text-white font-bold",
        btnLightColor: "bg-amber-950/40 text-amber-200 border border-amber-800"
      };
    } else if (isArtisan) {
      return {
        logo: `${seller.name}.`,
        tagline: seller.description || "Créations d'art & Noblesse du Bois",
        fullTagline: seller.description || "Découvrez notre collection de pièces artistiques et objets en bois noble, sculptés entièrement à la main avec passion.",
        ctaText: "Découvrir notre Collection",
        bgAccent: "bg-amber-600",
        bgAccentHover: "hover:bg-amber-700",
        textAccent: "text-amber-500",
        borderAccent: "border-amber-600",
        ringAccent: "focus:ring-amber-500",
        headerBg: "bg-[#281a10] text-[#ffeed2]",
        bannerImg: artisanArtWoodcraftBg,
        fontFamily: "font-sans",
        whyUsTitle: "Notre Savoir-Faire d'Artisan",
        whyUsCards: [
          { title: "🪵 Sculptures à la Main", desc: "Chaque objet est une pièce unique polie, cirée et travaillée à la main." },
          { title: "✨ Bois de Qualité", desc: "Utilisation exclusive de bois locaux durables (chêne, noyer, olivier)." },
          { title: "🧩 Sur-Mesure", desc: "N'hésitez pas à nous solliciter pour des projets d'aménagement ou coffrets personnalisés." },
          { title: "📞 Demande Directe", desc: seller.phone ? `Appelez le ${seller.phone}` : "Disponible pour toute étude d'œuvre." }
        ],
        catalogTitle: "Nos Créations d'Art & Ustensiles",
        catalogDesc: "Soutenez l'artisanat d'art durable en choisissant l'authenticité d'éléments faits main.",
        btnColor: "bg-amber-600 hover:bg-amber-700 text-white font-bold",
        btnLightColor: "bg-amber-950/40 text-amber-200 border border-amber-800"
      };
    } else if (isPoissonnier) {
      return {
        logo: `${seller.name}.`,
        tagline: seller.description || "Poissonnerie Fine & Crustacés d'Élite",
        fullTagline: seller.description || "Retrouvez les saveurs authentiques de l'océan avec notre arrivage quotidien de poissons nobles sauvages et de coquillages d'exception.",
        ctaText: "Acheter en Direct-Pêcheur",
        bgAccent: "bg-sky-600",
        bgAccentHover: "hover:bg-sky-700",
        textAccent: "text-sky-400",
        borderAccent: "border-sky-500",
        ringAccent: "focus:ring-sky-500",
        headerBg: "bg-[#0b1d28] text-[#e0f2fe]",
        bannerImg: poissonnierSeafoodIceBg,
        fontFamily: "font-sans",
        whyUsTitle: "La Garantie d’une Fraîcheur Absolue",
        whyUsCards: [
          { title: "🌊 Pêche Responsable", desc: "Arrivage quotidien issu directement des bateaux de pêche locale et artisanale." },
          { title: "🧊 Chaîne du Froid", desc: "Conservation irréprochable sur lit de glace gérée en direct." },
          { title: "🦐 Crustacés de Choix", desc: "Une sélection rare de gambas géantes, langoustines et coquillages purifiés." },
          { title: "📞 Commande Spéciale", desc: seller.phone ? `Contact direct marée : ${seller.phone}` : "Livraison rapide pour restaurateurs." }
        ],
        catalogTitle: "Nos Variétés de la Mer",
        catalogDesc: "Sélection rigoureuse des plus belles pièces de chalut saines aux teintes irisées de l'Atlantique.",
        btnColor: "bg-sky-600 hover:bg-sky-700 text-white font-bold",
        btnLightColor: "bg-sky-950/40 text-sky-200 border border-sky-800"
      };
    } else if (isPoissonnerie) {
      return {
        logo: `${seller.name}.`,
        tagline: seller.description || "Poissonnerie Fine & Trésors de la Marée",
        fullTagline: seller.description || "Sélection rigoureuse des plus belles pièces nobles sauvages de l'océan, crustacés vivants et coquillages d'excellence sur glace vive.",
        ctaText: "Réserver nos Plus Beaux Poissons",
        bgAccent: "bg-cyan-600",
        bgAccentHover: "hover:bg-cyan-700",
        textAccent: "text-cyan-400",
        borderAccent: "border-cyan-500",
        ringAccent: "focus:ring-cyan-500",
        headerBg: "bg-[#0b1d22] text-[#e0f7fa]",
        bannerImg: poissonnerieBgImg,
        fontFamily: "font-sans",
        whyUsTitle: "Nos Standards de Fraîcheur Absolue",
        whyUsCards: [
          { title: "🌊 Arrivage Quotidien", desc: "Produits de marée noble issus de la pêche artisanale durable de la nuit locale." },
          { title: "🧊 Conservation Givrée", desc: "Lit de glace pilée renouvelé en continu pour préserver l'éclat et la chair ferme." },
          { title: "🦐 Crustacés Fins", desc: "Gamme rare de crevettes géantes tigrées, langoustines et coquillages vivants." },
          { title: "📞 Demande Directe", desc: seller.phone ? `Contact direct étal : ${seller.phone}` : "Préparations sur-mesure (darnes, filets désossés, écaillage) par nos poissonniers." }
        ],
        catalogTitle: "Notre Banc de Poissons & Crustacés de Choix",
        catalogDesc: "Sentez l'appel du grand large avec des spécimens minutieusement calibrés et préparés selon vos envies culinaires.",
        btnColor: "bg-cyan-600 hover:bg-cyan-700 text-white font-bold",
        btnLightColor: "bg-cyan-950/40 text-cyan-200 border border-cyan-800"
      };
    } else if (isBoucher) {
      return {
        logo: `${seller.name}.`,
        tagline: seller.description || "Boucherie d'Excellence & Charcuterie Fine",
        fullTagline: seller.description || "Sélection rigoureuse de viandes de premier choix, de préparations bouchères faites maison et de charcuteries artisanales halal de qualité.",
        ctaText: "Réserver nos Plus Beaux Morceaux",
        bgAccent: "bg-red-600",
        bgAccentHover: "hover:bg-red-700",
        textAccent: "text-red-400",
        borderAccent: "border-red-500",
        ringAccent: "focus:ring-red-500",
        headerBg: "bg-[#1f0d0d] text-[#fecdd3]",
        bannerImg: boucherCharcuterieBg,
        fontFamily: "font-sans",
        whyUsTitle: "L'Excellence d'une Viande Sélectionnée",
        whyUsCards: [
          { title: "🥩 Sélection d'Origine", desc: "Viandes de bœuf persillées et bétail rigoureusement sélectionnés." },
          { title: "🔪 Savoir-faire Boucher", desc: "Découpe artisanale experte et hachage minute pour une tendreté absolue." },
          { title: "🌶️ Préparations Artisanales", desc: "Merguez maison pur bœuf & agneau, keftas parfumées frais et grillades de choix." },
          { title: "📞 Demande Directe", desc: seller.phone ? `Contact direct étal : ${seller.phone}` : "Livraison rapide pour particuliers et restaurateurs." }
        ],
        catalogTitle: "Nos Pièces & Découpes de Choix",
        catalogDesc: "Retrouvez des saveurs incomparables avec des morceaux tendres et savoureux découpés avec rigueur.",
        btnColor: "bg-red-600 hover:bg-red-700 text-white font-bold",
        btnLightColor: "bg-red-950/40 text-red-200 border border-red-800"
      };
    } else if (isEleveur) {
      return {
        logo: `${seller.name}.`,
        tagline: seller.description || "Élevage Traditionnel & Volaille Saine",
        fullTagline: seller.description || "Découvrez notre élevage traditionnel en plein air assurant des animaux en pleine santé et des viandes d'une qualité d'antan.",
        ctaText: "S'approvisionner Directement",
        bgAccent: "bg-yellow-600",
        bgAccentHover: "hover:bg-yellow-700",
        textAccent: "text-yellow-500",
        borderAccent: "border-yellow-600",
        ringAccent: "focus:ring-yellow-500",
        headerBg: "bg-[#362615] text-[#feebd0]",
        bannerImg: eleveurStableWoodBg,
        fontFamily: "font-sans",
        whyUsTitle: "Notre Élevage Responsable",
        whyUsCards: [
          { title: "🐑 Grand Air & Nature", desc: "Élevage traditionnel avec parcours d'herbe saine et nourriture végétale contrôlée." },
          { title: "✨ Qualité Sanitaire", desc: "Suivi rigoureux garantissant une viande tendre et des volailles vigoureuses." },
          { title: "🐓 Direct-Producteur", desc: "Raccourcissez le circuit d'alimentation : achetez en direct au meilleur prix." },
          { title: "📞 Demande Directe", desc: seller.phone ? `Contactez-nous au ${seller.phone}` : "Approvisionnements réguliers pour tous." }
        ],
        catalogTitle: "Nos Élevages, Volailles & Œufs",
        catalogDesc: "Consommez local et responsable avec des troupeaux élevés dans le pur respect des terres.",
        btnColor: "bg-yellow-600 hover:bg-yellow-700 text-white font-bold",
        btnLightColor: "bg-yellow-950/40 text-yellow-200 border border-yellow-800"
      };
    } else {
      // Fallback
      return {
        logo: `${seller.name}.`,
        tagline: seller.description || 'Votre commerce de quartier',
        fullTagline: seller.description || 'Retrouvez nos sélections de produits locaux de confiance de haute qualité.',
        ctaText: 'Découvrir la boutique',
        bgAccent: 'bg-indigo-650',
        bgAccentHover: 'hover:bg-indigo-750',
        textAccent: 'text-indigo-600',
        borderAccent: 'border-indigo-500',
        ringAccent: 'focus:ring-indigo-500',
        headerBg: 'bg-slate-900 text-white',
        bannerImg: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80',
        fontFamily: 'font-sans',
        whyUsTitle: 'Infos Pratiques',
        whyUsCards: [
          { title: '📍 Adresse', desc: seller.address || 'Non spécifié' },
          { title: '🕒 Horaires', desc: 'Ouvert en semaine de 8h à 19h.' },
          { title: '🛡️ Achat Sécurisé', desc: 'Bénéficiez du paiement séquestre de confiance.' },
          { title: '📞 Téléphone', desc: seller.phone || 'Non spécifié' }
        ],
        catalogTitle: 'Notre Catalogue',
        catalogDesc: 'Découvrez notre collection de produits prêts à l\'achat de proximité.',
        btnColor: 'bg-indigo-600 hover:bg-indigo-750 text-white',
        btnLightColor: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border-indigo-200'
      };
    }
  }, [seller, isRaoul, isGlas, isVuitton, isKylie, isAlimentation, isSecretariat, isAgriculteur, isArtisan, isEleveur, isPoissonnier, isBoucher, isPoissonnerie]);

  // Filter products for this specific seller
  const sellerProducts = useMemo(() => {
    return products.filter(p => p.sellerId === seller.id);
  }, [products, seller]);

  // Dynamic Category filters derived from product categories
  const categories = useMemo(() => {
    const list = new Set<string>();
    sellerProducts.forEach(p => {
      if (p.category) list.add(p.category);
    });
    return Array.from(list);
  }, [sellerProducts]);

  // Filtered Products list
  const filteredProducts = useMemo(() => {
    return sellerProducts.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.rayon && p.rayon.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = activeCategoryFilter ? p.category === activeCategoryFilter : true;
      return matchSearch && matchCat;
    }, [sellerProducts, searchQuery, activeCategoryFilter]);
  });

  // Calculate cart states
  const totalCartPrice = useMemo(() => {
    return Object.entries(cart).reduce((sum, [pId, qty]) => {
      const prod = products.find(p => p.id === pId);
      if (prod && prod.sellerId === seller.id) {
        return sum + getProdCurrentPrice(prod) * Number(qty);
      }
      return sum;
    }, 0);
  }, [cart, products, seller.id, getProdCurrentPrice]);

  const cartQuantity = useMemo(() => {
    return Object.entries(cart).reduce((sum, [pId, qty]) => {
      const prod = products.find(p => p.id === pId);
      if (prod && prod.sellerId === seller.id) {
        return sum + Number(qty);
      }
      return sum;
    }, 0);
  }, [cart, products, seller.id]);

  const prevQuantityRef = useRef(cartQuantity);
  useEffect(() => {
    // Suppress automatic opening of the cart dropdown on item addition
    prevQuantityRef.current = cartQuantity;
  }, [cartQuantity]);

  // Specific handle for scroll to catalog
  const handleScrollToCatalog = () => {
    const el = document.getElementById('boutique-catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReserveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTableDate || !resTableTime) {
      alert("Veuillez renseigner la date et l'heure.");
      return;
    }
    setResTableLoading(true);
    try {
      const res = await fetch('/api/restaurant/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: seller.id,
          clientId: user.id,
          clientName: user.name || 'Client Proche',
          clientPhone: resTablePhone,
          dateTime: `${resTableDate}T${resTableTime}`,
          guestsCount: Number(resTableGuests),
          zone: resTableZone,
          notes: resTableNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur s'est produite lors de la réservation.");
      
      triggerToast("🪑 Votre réservation de table a bien été transmise !");
      setIsReservingTable(false);
      setResTableNotes('');
      onRefreshState();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResTableLoading(false);
    }
  };

  const handleAddRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingProduct) return;
    setRatingLoading(true);
    try {
      const res = await fetch('/api/restaurant/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: ratingProduct.id,
          clientId: user.id,
          clientName: user.name || 'Client de proximité',
          stars: ratingValue,
          comment: ratingComment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur s'est produite.");

      triggerToast(`★ Merci ! Votre note de ${ratingValue}/5 a été enregistrée pour "${ratingProduct.title}".`);
      setRatingProduct(null);
      setRatingComment('');
      onRefreshState();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <div id="shop-showcase-immersive" className={`min-h-screen bg-transparent text-[var(--slate-100)] ${brand.fontFamily} relative pb-20`}>
      
      {/* 1. BRAND STRIP HEADER NAVBAR */}
      <header className={`sticky top-0 z-40 bg-[var(--slate-900)]/90 text-[var(--slate-100)] border-b border-[var(--slate-800)]/60 backdrop-blur-md shadow-md transition-all`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button 
              onClick={onBack}
              className="bg-[var(--slate-100)]/15 hover:bg-[var(--slate-100)]/25 text-[var(--slate-100)] p-2 rounded-xl transition duration-150 flex items-center justify-center cursor-pointer"
              title="Retourner à l'accueil de la plateforme"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-extrabold tracking-tight cursor-default">{brand.logo}</span>
              <span className="hidden sm:inline text-[10px] text-[var(--slate-150)] opacity-60 uppercase tracking-widest">
                {brand.logo === 'WeLink.' ? 'commerce et carrière au bout des doigts' : (seller.enterpriseType === 'hotel' ? 'HÔTEL TRANS-LOCAL' : seller.enterpriseType === 'restaurant' ? 'RESTAURATEUR' : 'COMMERCE LOCAL')}
              </span>
            </div>
          </div>

          {/* Quick Menu Options */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-[var(--slate-150)]">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[var(--slate-100)] cursor-pointer select-none">Accueil</button>
            <button 
              onClick={() => {
                const el = document.getElementById('why-us-details-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="hover:text-[var(--slate-100)] cursor-pointer select-none"
            >
              Infos {brand.whyUsTitle.includes('Pratiques') ? 'Pratiques' : 'Prestations'}
            </button>
            <button onClick={handleScrollToCatalog} className="hover:text-[var(--slate-100)] cursor-pointer select-none">Notre Catalogue</button>
          </nav>

          <div className="flex items-center space-x-3">
            {/* Display Return to Platform explicitly as text button for ease */}
            <button
              onClick={onBack}
              className="hidden sm:inline-flex text-xs font-bold text-[var(--slate-150)] hover:text-[var(--slate-100)] border border-[var(--slate-800)]/80 hover:bg-[var(--slate-850)] px-3.5 py-1.5 rounded-xl transition cursor-pointer"
            >
              ← Retour aux établissements
            </button>

            {/* Premium Basket & Popover Wrapper */}
            <div className="relative">
              {/* Premium Basket Button */}
              <button
                ref={cartButtonRef}
                onClick={() => setIsCartOpen(!isCartOpen)}
                className={`p-2 py-1.5 sm:p-2.5 sm:px-4 rounded-xl text-white outline-hidden border flex items-center gap-2 cursor-pointer select-none transition duration-150 ${
                  cartQuantity > 0 
                    ? 'bg-indigo-600 border-transparent shadow-[0_4px_20px_rgba(92,115,231,0.4)] hover:bg-indigo-500 scale-102 hover:scale-105 active:scale-95' 
                    : 'bg-[#0e1322]/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShoppingCart className={`w-4 h-4 shrink-0 ${cartQuantity > 0 ? 'text-white animate-pulse' : 'text-slate-400'}`} />
                <span className="text-xs font-black uppercase tracking-wider transition-colors">
                  {cartQuantity > 0 ? 'Mon Panier' : 'Panier'}
                </span>
                {cartQuantity > 0 && (
                  <span className="bg-white text-indigo-900 text-[10px] font-black px-2 py-0.5 rounded-full block tracking-tight shrink-0 font-mono">
                    {cartQuantity}
                  </span>
                )}
              </button>

              {/* 6. IMMERSIVE CART POPUP (DISPLAYED DIRECTLY UNDER THE BUTTON AS AN ABSOLUTE DROPDOWN CARD WITH MAXIMUM OPACITY) */}
              {isCartOpen && (
                <div 
                  ref={cartRef}
                  id="cart-dropdown-menu"
                  className="absolute right-0 mt-2 w-[340px] sm:w-[400px] max-w-[95vw] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl z-[999999] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 border border-slate-200 dark:border-slate-800"
                >
                    {/* Cart Header styled like screenshot notifications header */}
                    <div className="p-4 text-slate-800 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-slate-850/80 shrink-0 bg-slate-50 dark:bg-[#0f172a]">
                    <div className="flex items-center space-x-2 min-w-0">
                      <ShoppingCart className="w-4 h-4 text-indigo-500 shrink-0" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-indigo-500 font-sans truncate">
                        MON PANIER EN DIRECT
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Active Sons toggle like the image */}
                      <button
                        type="button"
                        onClick={() => {
                          const val = !isSoundOn;
                          setIsSoundOn(val);
                          if (val) {
                            try {
                              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                              if (AudioCtx) {
                                const ctx = new AudioCtx();
                                const osc = ctx.createOscillator();
                                const gain = ctx.createGain();
                                osc.type = "sine";
                                osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                                gain.gain.setValueAtTime(0.03, ctx.currentTime);
                                gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
                                osc.connect(gain);
                                gain.connect(ctx.destination);
                                osc.start();
                                osc.stop(ctx.currentTime + 0.16);
                              }
                            } catch (e) {}
                          }
                        }}
                        className={`p-1 px-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[9px] font-semibold ${
                          isSoundOn 
                            ? 'border-indigo-200 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300' 
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {isSoundOn ? <Volume2 className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> : <VolumeX className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                        <span>Sons</span>
                      </button>

                      {/* Vider button exactly like screenshot */}
                      <button
                        type="button"
                        onClick={() => {
                          setCart({});
                          triggerToast("🧹 Panier vidé !");
                          playBeep(261.63);
                        }}
                        className="text-[10px] text-red-500 hover:text-red-400 transition flex items-center gap-1 cursor-pointer bg-transparent border-0"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                        <span>Vider</span>
                      </button>

                      {/* Close cross indicator */}
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 text-xs font-bold flex items-center justify-center bg-slate-100 dark:bg-slate-850 rounded-lg cursor-pointer transition shrink-0 ml-1 border border-slate-200 dark:border-slate-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Tab badges mimicking Tous (10) | Selections | Reglements pills */}
                  <div className="px-4 pt-3 pb-1 shrink-0">
                    <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-center">
                      <button 
                        type="button" 
                        className="text-center py-1.5 bg-indigo-650 dark:bg-indigo-600 rounded-lg text-[10px] sm:text-[11px] font-black uppercase text-white shadow-xs select-none"
                      >
                        Tous ({cartQuantity})
                      </button>
                      <button 
                        type="button" 
                        className="text-center py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-[10px] sm:text-[11px] font-semibold uppercase transition select-none"
                      >
                        Sélections ({Object.keys(cart).length})
                      </button>
                      <button 
                        type="button" 
                        className="text-center py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-[10px] sm:text-[11px] font-semibold uppercase transition select-none"
                      >
                        Règlements
                      </button>
                    </div>
                  </div>

                  {/* Cart Body Scroll Area */}
                  <div className="p-4 space-y-3.5 text-left">
                    {cartQuantity === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <span className="text-4xl block">🛒</span>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-widest">Votre Panier est Vide</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Ajoutez des spécialités de {seller.name} pour démarrer vos achats en direct de quartier.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800/80 pb-1.5 flex items-center justify-between min-w-0">
                          <span className="truncate pr-2">COMMANDE PROPRIÉTÉ DE {user.name || 'Client de Proximité'}</span>
                          <span className="font-mono text-[9px] text-indigo-500 dark:text-[#5c73e7] shrink-0 font-bold">Live</span>
                        </div>

                        {/* List items mimicking the look of the notifications screen */}
                        <div className="space-y-3">
                          {Object.entries(cart).map(([pId, qty]) => {
                             const prod = products.find(p => p.id === pId);
                             if (!prod || prod.sellerId !== seller.id) return null;
                             const currentPrice = getProdCurrentPrice(prod);

                             return (
                               <div 
                                 key={pId} 
                                 className="flex flex-col p-3.5 bg-slate-100 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl gap-2.5 text-slate-900 dark:text-slate-100 transition decoration-none hover:bg-slate-200 dark:hover:bg-slate-850"
                               >
                                 <div className="flex items-start justify-between gap-3 min-w-0">
                                   <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-indigo-200 dark:border-indigo-900 font-mono">
                                          Selection ⚡
                                        </span>
                                        {prod.category && (
                                          <span className="text-[9px] text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wider">
                                            {prod.category}
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 break-words leading-snug" title={prod.title}>
                                        {prod.title}
                                      </h4>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-1">
                                        Tarif : {currentPrice.toLocaleString()} F / {prod.unit}
                                      </span>
                                    </div>

                                    {/* Trash icon exactly matching screenshot right aligned trash container */}
                                    <button
                                      onClick={() => {
                                        const c = { ...cart };
                                        delete c[pId];
                                        setCart(c);
                                        playBeep(329.63);
                                      }}
                                      className="p-1 px-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-200 dark:hover:bg-rose-950 text-slate-600 dark:text-slate-350 hover:text-red-500 border border-slate-300 dark:border-slate-700 transition cursor-pointer self-start select-none"
                                      title="Supprimer cet article"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/40">
                                  {isPoissonnerie || prod.unit === 'kg' || prod.unit === 'g' ? (
                                    <div className="flex flex-col gap-1 items-start">
                                      <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1 text-[10.5px] text-cyan-600 dark:text-cyan-400 font-mono font-bold">
                                        <span>⚖️ {qty >= 1 ? `${qty} kg` : `${qty * 1000} g`}</span>
                                        <div className="flex items-center border-l border-slate-200 dark:border-slate-850 pl-2 ml-1 gap-1">
                                          <button 
                                            type="button"
                                            onClick={() => { removeFromCart(pId); playBeep(261.63); }} 
                                            className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer select-none"
                                          >
                                            -
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => { addToCart(pId, prod.stock); playBeep(293.66); }} 
                                            className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer select-none"
                                            disabled={qty >= prod.stock}
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                      {isBoucher && selectedCutByProduct[pId] && (
                                        <span className="text-[9.5px] font-black uppercase text-red-500 dark:text-red-450 mt-1">
                                          ✂️ Découpe : {selectedCutByProduct[pId] === 'des_cubes' ? 'Cubes' : selectedCutByProduct[pId] === 'tranches' ? 'Tranches' : selectedCutByProduct[pId] === 'hache' ? 'Haché' : selectedCutByProduct[pId] === 'entier' ? 'Entier' : selectedCutByProduct[pId]}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    /* Elegant dark pill styled quantity controller */
                                    <div className="flex items-center bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs">
                                      <button 
                                        onClick={() => { removeFromCart(pId); playBeep(349.23); }} 
                                        className="px-2 hover:text-red-500 font-extrabold text-sm text-slate-600 dark:text-slate-300 transition cursor-pointer select-none bg-transparent border-0"
                                      >
                                        -
                                      </button>
                                      <span className="px-3 font-mono font-black text-slate-800 dark:text-white">{qty}</span>
                                      <button 
                                        onClick={() => { addToCart(pId, prod.stock); playBeep(392.00); }} 
                                        className="px-2 hover:text-green-500 font-extrabold text-sm text-slate-600 dark:text-slate-300 transition cursor-pointer select-none bg-transparent border-0"
                                        disabled={qty >= prod.stock}
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                  <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 min-w-[#70px] text-right font-mono">
                                    {(currentPrice * qty).toLocaleString()} F
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Confidence Escrow Guarantee and payment preferences inside the same card */}
                        <div className="border-t border-slate-200 dark:border-[#1d273a]/60 pt-3.5 space-y-3">
                          <div className="space-y-2.5 border border-slate-200 dark:border-slate-800 p-3.5 rounded-[18px] bg-slate-100 dark:bg-[#111726]">
                            <span className="block text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-500">🔒 Règlement de confiance séquestre</span>
                            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                              Les fonds sont conservés de manière fiable et ne seront débloqués pour le vendeur que lorsque vous aurez accusé réception en direct.
                            </p>

                            <div className="pt-1.5">
                              <label className="block text-[8.5px] font-black uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-1">Moyen de règlement préféré :</label>
                              <div className="grid grid-cols-1 gap-1">
                                {paymentPreferences.map((p) => {
                                  const isSelected = selectedPaymentMethod === `${p.provider} (${p.label})` || selectedPaymentMethod === p.provider;
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => setSelectedPaymentMethod(`${p.provider} (${p.label})`)}
                                      className={`p-2 rounded-lg text-left text-xs font-semibold border transition flex items-center justify-between cursor-pointer ${
                                        isSelected 
                                          ? 'border-indigo-500 bg-indigo-100 dark:bg-[#161e31] text-indigo-600 dark:text-indigo-300 shadow-xs font-bold' 
                                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1222] hover:bg-slate-55 dark:hover:bg-[#131a2c] text-slate-600 dark:text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <Wallet className="w-3 h-3 text-slate-405" />
                                        <span className="text-[11px]">{p.provider} • {p.label}</span>
                                      </div>
                                      {isSelected && <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">✓</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Escrow Checkbox Options */}
                            <div className="pt-1.5 flex items-center justify-between">
                              <span className="text-[10px] text-slate-605 dark:text-slate-300 font-bold select-none cursor-pointer flex items-center gap-1.5">
                                <span>🔐 Activer la retenue Escrow de sécurité</span>
                              </span>
                              <input 
                                type="checkbox"
                                checked={useEscrowPayment}
                                onChange={(e) => setUseEscrowPayment(e.target.checked)}
                                className="w-3.5 h-3.5 border-slate-300 dark:border-slate-800 rounded bg-slate-50 dark:bg-[#131b2e] focus:ring-0 cursor-pointer text-[#4f46e5]"
                              />
                            </div>

                            {/* Delivery & Restaurant Scheduler Option */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 mt-2 space-y-2.5 text-left font-sans animate-fade-in text-slate-850 dark:text-[var(--slate-100)]">
                              {isRaoul ? (
                                <div className="space-y-2">
                                  <label className="block text-[9px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-450">
                                    🍽️ Type de Service Restaurant :
                                  </label>
                                  <div className="grid grid-cols-3 gap-1">
                                    {[
                                      { label: "Sur Place", val: "dinein" },
                                      { label: "A Emporter", val: "takeout" },
                                      { label: "Livraison", val: "delivery" }
                                    ].map((opt) => (
                                      <button
                                        key={opt.val}
                                        type="button"
                                        onClick={() => setServiceType(opt.val)}
                                        className={`py-1 px-1 rounded-lg text-center font-bold text-[10px] border transition cursor-pointer select-none ${
                                          serviceType === opt.val
                                            ? "bg-rose-950/40 border-rose-500 text-rose-350 font-black"
                                            : "bg-[#050810] border-slate-800 text-slate-400 hover:border-slate-700"
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>

                                  {serviceType === 'dinein' && (
                                    <div className="space-y-1 pt-1 animate-fade-in text-left">
                                      <span className="block text-[8.5px] text-slate-400">Numéro de table (Facultatif)</span>
                                      <select
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        className="w-full bg-[#131b2e] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-hidden"
                                      >
                                        <option value="">Sélectionner une table...</option>
                                        {restaurantTables
                                          .filter(t => t.sellerId === seller.id)
                                          .map(t => (
                                            <option key={t.id} value={t.number}>
                                              Table {t.number} ({t.capacity} places) - {t.zone === 'terrace' ? 'Terrasse' : t.zone === 'vip' ? 'VIP' : 'Intérieur'}
                                            </option>
                                          ))
                                        }
                                      </select>
                                      {tableNumber === "" && (
                                        <input
                                          type="text"
                                          placeholder="Ou saisir le numéro de votre table..."
                                          value={tableNumber}
                                          onChange={(e) => setTableNumber(e.target.value)}
                                          className="w-full bg-[#131b2e] border border-slate-800 mt-1 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-hidden"
                                        />
                                      )}
                                    </div>
                                  )}

                                  {serviceType === 'delivery' && (
                                    <div className="space-y-1 pt-1 animate-fade-in text-left">
                                      <span className="block text-[8.5px] text-slate-400">Adresse de livraison (Quartier, Rue, etc.)</span>
                                      <input
                                        type="text"
                                        required
                                        placeholder="Ex: Almadies, en face de la mosquée"
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        className="w-full bg-[#131b2e] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-hidden focus:border-rose-500"
                                      />
                                    </div>
                                  )}

                                  {(serviceType === 'delivery' || serviceType === 'takeout') && (
                                    <div className="pt-2.5 space-y-1.5 border-t border-slate-800/40 animate-fade-in text-left">
                                      <span className="block text-[8.5px] uppercase tracking-wider font-extrabold text-[#94a3b8]">🕒 Programmer l'heure de retrait ou livraison</span>
                                      <div className="grid grid-cols-2 gap-1.5">
                                        <div>
                                          <span className="block text-[8px] text-slate-400">Date souhaitée</span>
                                          <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="w-full bg-[#131b2e] border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono focus:outline-hidden"
                                          />
                                        </div>
                                        <div>
                                          <span className="block text-[8px] text-slate-400">Heure souhaitée</span>
                                          <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            className="w-full bg-[#131b2e] border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono focus:outline-hidden"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                                    🚚 Programmer une Livraison de proximité (Optionnel)
                                  </label>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div>
                                      <span className="block text-[8px] text-slate-400 mb-0.5">Date estimée</span>
                                      <input 
                                        type="date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="w-full bg-[#131b2e] border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-cyan-500"
                                      />
                                    </div>
                                    <div>
                                      <span className="block text-[8px] text-slate-400 mb-0.5">Heure estimée</span>
                                      <input 
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full bg-[#131b2e] border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-cyan-500"
                                      />
                                    </div>
                                  </div>
                                  {scheduledDate && (
                                    <p className="text-[9.5px] text-cyan-400 font-bold">
                                      ✓ Souhait : livré le {new Date(scheduledDate).toLocaleDateString('fr-FR')} {scheduledTime ? `à ${scheduledTime}` : ''}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Checkout Actions Buttons Footer inside the black container */}
                  {cartQuantity > 0 && (
                    <div className="border-t border-[#1d273a] p-4 space-y-3 shrink-0" style={{ backgroundColor: '#050810' }}>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>Sous-total de commande :</span>
                        <span className="text-sm font-black text-cyan-400 font-mono">
                          {totalCartPrice.toLocaleString()} F
                        </span>
                      </div>

                      <button
                        onClick={async () => {
                          playBeep(523.25);
                          await handleCheckoutBulk(scheduledDate, scheduledTime, selectedCutByProduct, serviceType, deliveryAddress, tableNumber);
                          setIsCartOpen(false);
                        }}
                        disabled={orderLoading}
                        className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs select-none transition duration-150 shadow-md flex items-center justify-center gap-1.5 text-white active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
                          isRaoul ? 'bg-rose-600 hover:bg-rose-500' : 'bg-[#4f46e5] hover:bg-indigo-500 shadow-indigo-950/50'
                        }`}
                      >
                        {orderLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Transmission...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Valider ma commande ({totalCartPrice.toLocaleString()} F)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC HERO BRAND BANNER */}
      <section className="relative w-full h-[300px] md:h-[385px] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          {/* No dark overriding image, let the beautiful global background image shine fully unobstructed */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--slate-950)]/40 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-4 md:space-y-6 animate-fade-in text-[var(--slate-100)]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--slate-900)]/70 border border-[var(--slate-800)] rounded-full text-[10px] font-bold uppercase tracking-widest text-[var(--brand-indigo)] shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Établissement vérifié en ligne</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-slate-950 dark:text-white drop-shadow-[0_2px_4px_rgba(255,255,255,0.95)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
            {seller.name}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-955 dark:text-slate-200 font-extrabold leading-relaxed max-w-2xl mx-auto drop-shadow-[0_1.5px_1.5px_rgba(255,255,255,0.95)] dark:drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.95)] opacity-100">
            {brand.fullTagline}
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleScrollToCatalog}
              className={`px-7 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition duration-350 shadow-xl inline-flex items-center gap-2 cursor-pointer ${brand.btnColor} transform hover:scale-102`}
            >
              <span>{brand.ctaText}</span>
              <ChevronRight className="w-4 h-4 animate-bounce shrink-0" />
            </button>

            {isRaoul && (
              <button
                type="button"
                onClick={() => setIsReservingTable(true)}
                className="px-7 py-3.5 bg-neutral-900 hover:bg-neutral-850 text-white rounded-xl text-xs font-black uppercase tracking-wider transition duration-350 shadow-xl inline-flex items-center gap-2 cursor-pointer border border-[#1e293b]"
              >
                <span>🪑 Réserver une Table</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. PRACTICAL INFO CARDS SECTION */}
      <section className="bg-transparent py-12" id="why-us-details-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-xl md:text-2xl font-extrabold text-[var(--slate-100)] tracking-tight uppercase tracking-widest">
            {brand.whyUsTitle}
          </h2>
          <div className="w-12 h-1 bg-gradient-to-l from-transparent via-[var(--slate-800)] to-transparent mx-auto mt-3 mb-8" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brand.whyUsCards.map((card, i) => (
              <div 
                key={i} 
                className="bg-transparent border border-[var(--slate-800)]/65 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 backdrop-blur-xs"
              >
                <div className="text-xs uppercase font-extrabold text-[var(--brand-indigo)] tracking-wide mb-1.5 flex items-center justify-between">
                  <span>{card.title}</span>
                  <span className="w-1.5 h-1.5 bg-[var(--slate-800)] rounded-full"></span>
                </div>
                <p className="text-xs sm:text-sm text-slate-950 dark:text-slate-150 leading-relaxed font-black opacity-100">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PRODUCTS CATALOGUE SECTION */}
      <section className="py-16 bg-transparent" id="boutique-catalog-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--slate-800)]/80 pb-6">
            <div className="space-y-1.5">
              <h2 className="text-xl md:text-2xl font-extrabold text-[var(--slate-100)] tracking-tight">
                {brand.catalogTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-950 dark:text-slate-100 font-extrabold max-w-xl opacity-100">
                {brand.catalogDesc}
              </p>
            </div>

            {/* Quick Search inside Store */}
            <div className="relative min-w-[280px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--slate-400)] pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher spécifiquement dans cette boutique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border border-[var(--slate-800)]/80 rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--slate-100)] placeholder-slate-400 focus:outline-hidden focus:border-[var(--brand-indigo)] backdrop-blur-xs"
              />
            </div>
          </div>

          {/* Categories Filters Chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveCategoryFilter(null)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer select-none ${
                   activeCategoryFilter === null 
                    ? `bg-[var(--brand-indigo)] text-white shadow-xs` 
                    : 'bg-transparent text-[var(--slate-150)] border border-[var(--slate-800)] hover:bg-white/5'
                }`}
              >
                Tout ({sellerProducts.length})
              </button>
              {categories.map((cat) => {
                const count = sellerProducts.filter(p => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer select-none ${
                      activeCategoryFilter === cat 
                        ? `bg-[var(--brand-indigo)] text-white shadow-xs` 
                        : 'bg-transparent text-[var(--slate-150)] border border-[var(--slate-800)] hover:bg-white/5'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid list of Products */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-transparent border border-[var(--slate-800)]/60 rounded-2xl flex flex-col items-center justify-center space-y-2 backdrop-blur-xs">
              <span className="text-3xl">🥦</span>
              <h3 className="font-bold text-sm text-[var(--slate-100)]">Aucun produit disponible</h3>
              <p className="text-xs text-[var(--slate-150)] max-w-xs">Aucun article ne correspond à vos filtres ou n'est référencé dans cette boutique actuellement.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((p) => {
                const qtyInCart = cart[p.id] || 0;
                const currentPrice = getProdCurrentPrice(p);
                const hasDiscount = currentPrice !== p.price;

                const defaultProdImages: Record<string, string> = {
                  "millet": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=350",
                  "sorgho": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=350",
                  "riz": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=350",
                  "koki": "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=350",
                  "sap": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=350"
                };

                const fallbackProductImg = defaultProdImages[p.title.toLowerCase()] || 
                  (p.category.toLowerCase().includes('lait') ? "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=350" : 
                   p.category.toLowerCase().includes('boisson') ? "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=350" :
                   p.category.toLowerCase().includes('vêtem') ? "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=350" :
                   "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=350");

                const cardPhoto = activeImageByProduct[p.id] || p.imageUrl || fallbackProductImg;

                return (
                  <div 
                    key={p.id}
                    className="bg-transparent border border-[var(--slate-800)]/70 hover:border-[var(--brand-indigo)] rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition duration-300 flex flex-col justify-between backdrop-blur-xs font-sans"
                  >
                    <div>
                      {/* Product Photo Container */}
                      <div className="relative aspect-square w-full bg-[var(--slate-850)]/40 overflow-hidden flex items-center justify-center">
                        <img 
                          src={cardPhoto} 
                          alt={p.title} 
                          className="w-full h-full object-contain bg-slate-950/45"
                          referrerPolicy="no-referrer"
                        />
                        {/* Discount or promo badges */}
                        {hasDiscount && (
                          <span className="absolute top-2.5 left-2.5 bg-red-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full select-none shadow">
                            -{p.promotionDiscount}% PROMO
                          </span>
                        )}
                        {p.stock === 0 && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-white uppercase select-none">
                            🚫 Épuisé
                          </div>
                        )}
                      </div>

                      {p.images && p.images.length > 1 && (
                        <div className="flex items-center gap-1 p-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-850 bg-slate-950/20 border-b border-slate-900/30">
                          {p.images.map((img, idx) => {
                            const isSelected = cardPhoto === img;
                            return (
                              <button 
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImageByProduct(prev => ({ ...prev, [p.id]: img }));
                                }}
                                className={`w-8 h-8 rounded border shrink-0 transition ${
                                  isSelected ? 'border-[var(--brand-indigo)] ring-1 ring-[var(--brand-indigo)]/50' : 'border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <img src={img} alt="thumbnail" className="w-full h-full object-contain bg-slate-950" />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Info body */}
                      <div className="p-4 space-y-1.5 font-sans">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[var(--slate-400)] uppercase tracking-widest">
                          <span className="text-[var(--brand-indigo)]">{p.category}</span>
                          {p.rayon && <span className="text-[var(--slate-150)]">🗳️ {p.rayon}</span>}
                        </div>
                        <h3 className="font-extrabold text-sm text-[var(--slate-100)] line-clamp-1" title={p.title}>
                          {p.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-950 dark:text-slate-100 leading-normal font-black opacity-100 line-clamp-2 min-h-[34px]">
                          {p.description}
                        </p>

                        {isRaoul && (() => {
                          const ratingsForThis = dishRatings.filter(r => r.productId === p.id);
                          const totalRatings = ratingsForThis.length;
                          const avgRating = totalRatings > 0 
                            ? (ratingsForThis.reduce((s, r) => s + r.rating, 0) / totalRatings).toFixed(1)
                            : null;

                          return (
                            <div className="pt-2 flex flex-col gap-1 border-t border-[var(--slate-800)]/65">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="uppercase tracking-wider text-slate-400 font-bold">Avis clients :</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRatingProduct(p);
                                    setRatingValue(5);
                                    setRatingComment('');
                                  }}
                                  className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
                                >
                                  ★ Noter ce plat
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {avgRating ? (
                                  <>
                                    <div className="flex text-amber-500 text-xs">
                                      {Array.from({ length: 5 }).map((_, idx) => (
                                        <span key={idx}>
                                          {idx < Math.floor(Number(avgRating)) ? '★' : '☆'}
                                        </span>
                                      ))}
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-200">({avgRating}/5)</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowRatingsForProduct(showRatingsForProduct === p.id ? null : p.id);
                                      }}
                                      className="text-[10px] text-slate-400 hover:text-white underline ml-auto transition cursor-pointer"
                                    >
                                      {totalRatings} avis
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] italic text-slate-500">Aucun avis pour le moment</span>
                                )}
                              </div>
                              
                              {showRatingsForProduct === p.id && ratingsForThis.length > 0 && (
                                <div className="mt-1.5 p-2 bg-slate-950/45 border border-slate-900/60 rounded-xl space-y-1.5 text-left max-h-[140px] overflow-y-auto font-sans">
                                  {ratingsForThis.map(rating => (
                                    <div key={rating.id} className="text-[10px] border-b border-slate-900/40 pb-1.5 last:border-0">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-200">{rating.reviewerName}</span>
                                        <span className="text-amber-500 font-mono">{'★'.repeat(rating.rating)}</span>
                                      </div>
                                      {rating.comment && <p className="text-slate-400 italic mt-0.5">"{rating.comment}"</p>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Footer / purchase operations */}
                    <div className="p-4 pt-0 border-t border-[var(--slate-800)]/50">
                      <div className="flex items-center justify-between pb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[var(--slate-400)] font-medium font-sans">Prix unitaire</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-[var(--slate-100)] font-mono">
                              {currentPrice.toLocaleString()} F
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-[var(--slate-400)] line-through font-mono">
                                {p.price.toLocaleString()} F
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-[var(--slate-100)] font-serif italic font-medium bg-[var(--slate-850)]/90 px-2 py-0.5 rounded border border-[var(--slate-800)]/50">
                          Par {p.unit || 'unité'}
                        </span>
                      </div>

                      {/* Custom Weight / Option Selection for Poissonnerie / Weight-based products */}
                      {(() => {
                        const isWeightBased = isPoissonnerie || p.unit === 'kg' || p.unit === 'g';
                        const currentWeight = selectedWeightByProduct[p.id] !== undefined ? selectedWeightByProduct[p.id] : (qtyInCart > 0 ? qtyInCart : 1);
                        
                        if (p.stock === 0) {
                          if (isPoissonnerie) {
                            return (
                              <div className="pt-2">
                                {subscribedProductIds.includes(p.id) ? (
                                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-center text-[10.5px] font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                                    <span>✓</span>
                                    <span>Inscrit à l'alerte ! Notification dès arrivage.</span>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-slate-900/40 border border-slate-850/60 rounded-xl space-y-2 text-left">
                                    <span className="block text-[10px] font-bold text-slate-300">🔔 S'abonner aux alertes d'arrivage :</span>
                                    <div className="flex gap-1.5">
                                      <input 
                                        type="email"
                                        required
                                        placeholder="votre@email.com"
                                        value={alertEmail}
                                        onChange={(e) => setAlertEmail(e.target.value)}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-hidden"
                                      />
                                      <button 
                                        type="button"
                                        onClick={async () => {
                                          if (!alertEmail || !alertEmail.includes('@')) {
                                            alert("Veuillez saisir un e-mail valide.");
                                            return;
                                          }
                                          try {
                                            const res = await fetch('/api/poissonnerie/alerts', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                productId: p.id,
                                                buyerEmail: alertEmail,
                                                clientName: user.name || 'Client Proche'
                                              })
                                            });
                                            const d = await res.json();
                                            if (!res.ok) throw new Error(d.error || "Une erreur s'est produite");
                                            setSubscribedProductIds(prev => [...prev, p.id]);
                                            triggerToast("🔔 Vous recevrez une alerte dès le retour en stock !");
                                          } catch (err: any) {
                                            alert(err.message);
                                          }
                                        }}
                                        className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-500 text-white font-extrabold rounded-lg text-[10px] cursor-pointer"
                                      >
                                        M'alerter
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }

                        if (isWeightBased) {
                          return (
                            <div className="pt-1.5 space-y-2.5 text-left">
                              <div className="bg-slate-950/55 p-2.5 rounded-xl border border-slate-850/60 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-[10.5px] text-slate-400 uppercase tracking-wide">⚖️ Poids souhaité :</span>
                                  <div className="flex items-center space-x-1.5">
                                    <input 
                                      type="number"
                                      step="0.05"
                                      min="0.1"
                                      max={p.stock}
                                      value={currentWeight}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0.1;
                                        const clamped = Math.max(0.1, Math.min(p.stock, val));
                                        setSelectedWeightByProduct(prev => ({ ...prev, [p.id]: clamped }));
                                        if (qtyInCart > 0) {
                                          setCart(prev => ({ ...prev, [p.id]: clamped }));
                                        }
                                      }}
                                      className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-right font-mono font-bold text-cyan-400 text-xs"
                                    />
                                    <span className="text-xs text-slate-400 font-bold">kg</span>
                                  </div>
                                </div>

                                {/* Quick Presets weight buttons */}
                                <div className="grid grid-cols-4 gap-1">
                                  {[
                                    { label: "250g", val: 0.25 },
                                    { label: "500g", val: 0.5 },
                                    { label: "1 kg", val: 1 },
                                    { label: "2 kg", val: 2 }
                                  ].map((preset) => {
                                    const isSelected = currentWeight === preset.val;
                                    return (
                                      <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => {
                                          setSelectedWeightByProduct(prev => ({ ...prev, [p.id]: preset.val }));
                                          if (qtyInCart > 0) {
                                            setCart(prev => ({ ...prev, [p.id]: preset.val }));
                                          } else {
                                            setCart(prev => ({ ...prev, [p.id]: preset.val }));
                                            triggerToast(`⚖️ ${preset.label} de "${p.title}" ajouté au panier !`);
                                          }
                                        }}
                                        className={`py-1 rounded-sm text-[9.5px] font-extrabold border transition ${
                                          isSelected 
                                            ? "bg-cyan-950 border-cyan-500/60 text-cyan-400" 
                                            : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-750"
                                        }`}
                                      >
                                        {preset.label}
                                      </button>
                                    );
                                  })}
                                </div>

                                {isBoucher && (
                                  <div className="pt-2 border-t border-slate-850 mt-1.5 space-y-1">
                                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">✂️ Type de découpe souhaitée :</span>
                                    <div className="grid grid-cols-2 gap-1">
                                      {[
                                        { label: "📍 Entier", val: "entier" },
                                        { label: "🥩 Tranches", val: "tranches" },
                                        { label: "🍢 Cubes", val: "des_cubes" },
                                        { label: "🍔 Haché", val: "hache" }
                                      ].map((cut) => {
                                        const isSelected = (selectedCutByProduct[p.id] || "entier") === cut.val;
                                        return (
                                          <button
                                            key={cut.val}
                                            type="button"
                                            onClick={() => {
                                              setSelectedCutByProduct(prev => ({ ...prev, [p.id]: cut.val }));
                                              triggerToast(`✂️ Découpe "${cut.label.substring(3)}" sélectionnée pour "${p.title}" !`);
                                            }}
                                            className={`py-1 px-1.5 rounded-lg text-[9.5px] font-extrabold border transition text-left cursor-pointer ${
                                              isSelected 
                                                ? "bg-red-950/40 border-red-500/60 text-red-300" 
                                                : "bg-[#0b101c] border-slate-800 text-slate-400 hover:border-slate-700"
                                            }`}
                                          >
                                            {cut.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Ex: Tranches fines, dégraissé..."
                                      value={selectedCutByProduct[p.id + "_custom"] || ""}
                                      onChange={(e) => {
                                        setSelectedCutByProduct(prev => ({ 
                                          ...prev, 
                                          [p.id + "_custom"]: e.target.value,
                                          [p.id]: e.target.value || "entier"
                                        }));
                                      }}
                                      className="w-full bg-[#0d1221] border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 placeholder:text-slate-500 font-sans focus:outline-hidden focus:border-red-500 mt-1 text-left"
                                    />
                                  </div>
                                )}

                                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                                  <span>Montant total estimé :</span>
                                  <span className="font-black text-cyan-400 block">
                                    {(currentWeight * currentPrice).toLocaleString()} FCFA
                                  </span>
                                </div>
                              </div>

                              {/* Cart Controls for weight product */}
                              {qtyInCart > 0 ? (
                                <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-850">
                                  <span className="text-[10.5px] font-extrabold text-cyan-400">
                                    ✓ {qtyInCart >= 1 ? `${qtyInCart} kg` : `${qtyInCart * 1000} g`} au panier
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={() => setIsCartOpen(true)}
                                      className="text-[10px] font-bold text-slate-450 hover:underline flex items-center gap-1"
                                    >
                                      <span>Panier</span>
                                      <ShoppingCart className="w-3 h-3 text-slate-500" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const c = { ...cart };
                                        delete c[p.id];
                                        setCart(c);
                                      }}
                                      className="px-2 py-1 bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-900/30 font-bold rounded-lg text-[10px] transition"
                                      title="Retirer du panier"
                                    >
                                      Retirer
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCart(prev => ({ ...prev, [p.id]: currentWeight }));
                                    triggerToast(`⚖️ ${currentWeight >= 1 ? `${currentWeight} kg` : `${currentWeight * 1000} g`} de "${p.title}" ajouté au panier !`);
                                  }}
                                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 select-none shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white duration-150 cursor-pointer shadow-xs`}
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Commander au poids</span>
                                </button>
                              )}
                            </div>
                          );
                        }

                        // Standard Unit-Based product controls
                        return (
                          <div className="pt-1">
                            {qtyInCart > 0 ? (
                              <div className="flex items-center justify-between bg-[var(--slate-850)] p-1.5 rounded-xl border border-[var(--slate-800)]/70 w-full">
                                <div className="flex items-center justify-between text-xs font-bold font-mono w-full">
                                  <button 
                                    onClick={() => removeFromCart(p.id)}
                                    className="w-8 py-1 hover:bg-[var(--slate-900)] text-[var(--slate-100)] font-black rounded-lg transition"
                                  >
                                    -
                                  </button>
                                  <span className="text-center text-[var(--slate-100)] text-xs">{qtyInCart} dans le panier</span>
                                  <button 
                                    onClick={() => addToCart(p.id, p.stock)}
                                    className="w-8 py-1 hover:bg-[var(--slate-900)] text-[var(--slate-100)] font-black rounded-lg transition"
                                    disabled={qtyInCart >= p.stock}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(p.id, p.stock)}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 select-none shrink-0 bg-[var(--brand-indigo)] text-white hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.98] duration-150 cursor-pointer shadow-xs`}
                              >
                                <Plus className="w-4 h-4" />
                                <span>Ajouter au panier</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* 4.5 ENTERPRISE REVIEWS & OPINIONS SECTION */}
      <section className="py-12 bg-transparent border-t border-[var(--slate-800)]/80 mt-12 animate-fade-in" id="boutique-reviews-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-100">
          
          <div className="space-y-1.5 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--slate-800)]/60 pb-4">
            <div>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-550/20 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit font-sans">
                ⭐ FEEDBACK DU QUARTIER
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white mt-2.5 tracking-tight font-sans">
                Avis sur l'établissement {seller.name}
              </h2>
              <p className="text-xs text-slate-400 max-w-xl font-sans mt-1">
                Lisez les avis authentiques des habitants du quartier, ou partagez votre expérience de visite en laissant une évaluation étoilée.
              </p>
            </div>
            
            <div className="bg-slate-950 border border-[var(--slate-800)] rounded-xl p-3 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-black block font-mono">Note Globale</span>
              {(() => {
                const list = companyReviews.filter((r: any) => r.companyId === seller.id);
                if (list.length === 0) return <span className="text-xs text-slate-500 italic mt-0.5 block font-sans">Aucune note</span>;
                const avg = (list.reduce((acc: number, curr: any) => acc + curr.rating, 0) / list.length).toFixed(1);
                return (
                  <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                    <span className="text-sm font-black text-amber-400 font-mono">{avg} / 5</span>
                    <span className="text-[10px] text-slate-450 font-sans">({list.length} {list.length > 1 ? 'avis' : 'avis'})</span>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* WRITING NEW REVIEW */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-white font-extrabold text-sm font-sans">Laisser un avis professionnel</h3>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">Vous avez récemment commandé ou visité cette entreprise ? Partagez votre opinion sincère.</p>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                
                {/* Star selection */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono">Note de Visite</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl transition duration-150 focus:outline-none shrink-0 ${star <= reviewRating ? 'text-amber-400 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
                        title={`${star} Étoile(s)`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-[11px] text-slate-400 font-mono font-black ml-2">({reviewRating}/5)</span>
                  </div>
                </div>

                {/* Comment area */}
                <div className="space-y-1.5">
                  <label htmlFor="review_comment_input_box" className="block text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono">Votre Commentaire</label>
                  <textarea
                    id="review_comment_input_box"
                    rows={4}
                    value={reviewComment}
                    required
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Qu'avez-vous pensé de l'expérience de visite et de la qualité des articles de quartier ?"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold rounded-xl text-xs transition duration-150 cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/20"
                >
                  {isSubmittingReview ? (
                    <span className="font-sans">Envoi en cours ...</span>
                  ) : (
                    <span className="font-sans">Soumettre mon Avis ✓</span>
                  )}
                </button>

              </form>
            </div>

            {/* REVIEWS LIST FEED */}
            <div className="lg:col-span-7 space-y-3.5">
              <h3 className="text-xs uppercase font-black tracking-widest text-slate-400 font-mono">
                Avis Récents reçus ({companyReviews.filter((r: any) => r.companyId === seller.id).length})
              </h3>

              {(() => {
                const sellerReviews = companyReviews.filter((r: any) => r.companyId === seller.id);
                if (sellerReviews.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl">
                      <p className="text-slate-400 text-xs font-bold font-sans">Aucun avis publié pour le moment.</p>
                      <p className="text-slate-550 text-[10px] mt-1 font-sans">N'hésitez pas à remplir le formulaire à gauche pour soumettre le premier avis de cette boutique !</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {sellerReviews.map((rev: any) => (
                      <div key={rev.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3 w-full shadow-lg">
                        <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-900 text-sm flex items-center justify-center shrink-0">
                          👤
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-extrabold text-white font-sans">{rev.reviewerName}</p>
                              <span className="text-[9px] font-mono text-slate-500">{rev.createdAt ? rev.createdAt.split('T')[0] : 'Aujourd\'hui'}</span>
                            </div>
                            <div className="flex text-amber-400 text-xs shrink-0 select-none">
                              {Array.from({ length: rev.rating }).map((_, i) => <span key={i}>★</span>)}
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 italic pt-1 leading-relaxed font-sans">"{rev.comment}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>

        </div>
      </section>

      {/* 5. BRAND FOOTER BLOCK */}
      <footer className="bg-[var(--slate-950)]/80 text-[var(--slate-400)] py-12 border-t border-[var(--slate-800)] mt-16 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-baseline justify-center space-x-1">
            <span className="text-white text-xl font-black font-sans tracking-tight">{brand.logo}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-indigo)] block"></span>
          </div>
          <p className="text-xs sm:text-sm text-slate-950 dark:text-slate-100 font-extrabold leading-relaxed max-w-md mx-auto italic opacity-100">
            "{brand.tagline}. Retrouvez nos produits de quartier de confiance, avec une traçabilité et des modes opératoires fiables."
          </p>
          <div className="flex justify-center gap-6 text-xs text-[var(--slate-400)] pt-1 font-medium items-center">
            <span className="flex items-center gap-1.5">
              Direct : {seller.phone || '+237 600000000'}
              {seller.phone && (
                <WhatsAppButton 
                  phone={seller.phone} 
                  message={`Bonjour ${seller.name}, je regarde vos articles sur WeLink !`} 
                  iconOnly={true} 
                />
              )}
            </span>
            <span>•</span>
            <span>Secours : {seller.email}</span>
          </div>
          <div className="text-[10px] text-[var(--slate-500)] block border-t border-[var(--slate-800)]/40 pt-4 max-w-md mx-auto font-medium">
            © 2026 {seller.name}. Propulsé par SDE Platform de proximité. Tous droits réservés.
          </div>
        </div>
      </footer>

      {/* ==================== RES TABLE MODAL ==================== */}
      {isReservingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-sans">
          <div className="w-full max-w-lg bg-[#0e1424] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fade-in relative">
            <button
              onClick={() => setIsReservingTable(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>
            <form onSubmit={handleReserveTable} className="p-6 sm:p-8 space-y-4 text-left">
              <div className="space-y-1.5 border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500">Service de Réservation</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🪑 Réserver une Table chez {seller.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Planifiez votre repas d'exception, choisissez votre zone préférée et validez instantanément.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Date souhaitée</label>
                  <input
                    type="date"
                    required
                    value={resTableDate}
                    onChange={(e) => setResTableDate(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Heure souhaitée</label>
                  <input
                    type="time"
                    required
                    value={resTableTime}
                    onChange={(e) => setResTableTime(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre de convives</label>
                  <select
                    value={resTableGuests}
                    onChange={(e) => setResTableGuests(Number(e.target.value))}
                    className="w-full bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-rose-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                      <option key={n} value={n}>{n} {n > 1 ? 'personnes' : 'personne'}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Zone souhaitée</label>
                  <select
                    value={resTableZone}
                    onChange={(e) => setResTableZone(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="interior">🛋️ Salle Principale (Intérieur)</option>
                    <option value="terrace">🍷 Terrasse (Plein Air)</option>
                    <option value="vip">✨ Espace VIP / Privé</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Numéro de téléphone de contact</label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 221 77 654 3210"
                  value={resTablePhone}
                  onChange={(e) => setResTablePhone(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Demandes ou Notes particulières (Optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Ex: En terrasse au calme, bougie d'anniversaire..."
                  value={resTableNotes}
                  onChange={(e) => setResTableNotes(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsReservingTable(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={resTableLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {resTableLoading ? "Réservation..." : "Confirmer ma Réservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DISH RATING MODAL ==================== */}
      {ratingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-[#0e1424] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fade-in relative">
            <button
              onClick={() => setRatingProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>
            <form onSubmit={handleAddRating} className="p-6 space-y-4 text-left">
              <div className="space-y-1 border-b border-slate-800 pb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">Évaluation Gastronomique</span>
                <h3 className="text-base font-bold text-white leading-tight">
                  Laisser une note pour "{ratingProduct.title}"
                </h3>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Sélectionner votre Note :</span>
                <div className="flex items-center gap-2 pt-1 justify-center bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
                  {[1, 2, 3, 4, 5].map((starsCount) => {
                    const isActive = ratingValue >= starsCount;
                    return (
                      <button
                        key={starsCount}
                        type="button"
                        onClick={() => setRatingValue(starsCount)}
                        className="text-2xl transition hover:scale-115 active:scale-95 cursor-pointer"
                        title={`${starsCount} étoile(s)`}
                      >
                        <span className={isActive ? "text-amber-400" : "text-slate-700"}>★</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-center text-[10.5px] font-bold text-amber-400 pt-0.5">
                  {ratingValue === 5 ? "Excellent ! Un vrai délice ✨" :
                   ratingValue === 4 ? "Très bon plat ! Recommandé 👍" :
                   ratingValue === 3 ? "Bon mais améliorable 🙂" :
                   ratingValue === 2 ? "Passable, un peu déçu" : "Mauvaise expérience"}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Votre Commentaire ou Avis</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Qu'avez-vous pensé des saveurs, de la cuisson et de l'assaisonnement ?"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRatingProduct(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={ratingLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {ratingLoading ? "Envoi..." : "Envoyer mon avis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
