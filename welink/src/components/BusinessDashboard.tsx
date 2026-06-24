import React, { useState } from 'react';
import { UserProfile, Product, JobOffer, Order, Vente, JobApplication, EnterpriseStock, HotelRoom, HotelReservation, HotelCoupon, HotelAuditLog, RestaurantTable, RestaurantBooking, DishRating } from '../types';
import { Shield, LayoutDashboard, PlusCircle, Briefcase, FileText, Tractor, ShoppingCart, Truck, CheckCircle2, Trash2, Plus, Minus, AlertTriangle, TrendingUp, DollarSign, Package, Check, User, Mail, Phone, Calendar, ArrowRight, X, Heart, RefreshCw, Flame, Percent, Zap, Printer, MessageSquare, Search } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import HotelAdminDashboard from './HotelAdminDashboard';
import ClothingBoutiqueDashboard from './ClothingBoutiqueDashboard';
import WhatsAppButton from './WhatsAppButton';
import { InvoiceModal } from './InvoiceModal';

interface BusinessDashboardProps {
  user: UserProfile;
  products: Product[];
  jobOffers: JobOffer[];
  orders: Order[];
  ventes?: Vente[];
  jobApplications?: JobApplication[];
  onRefreshState: () => void;
  rayonsMetadata?: Record<string, { desc: string; emoji: string; img: string }>;
  enterpriseStocks?: EnterpriseStock[];
  allUsers?: UserProfile[];
  hotelRooms?: HotelRoom[];
  hotelRoomCategories?: any[];
  hotelReservations?: HotelReservation[];
  hotelCoupons?: HotelCoupon[];
  hotelAuditLogs?: HotelAuditLog[];
  hotelFomoSettings?: any[];
  fishLots?: any[];
  fishLossLogs?: any[];
  fishAlerts?: any[];
  butcherLots?: any[];
  butcherLossLogs?: any[];
  butcherCuts?: any[];
  restaurantTables?: RestaurantTable[];
  restaurantBookings?: RestaurantBooking[];
  dishRatings?: DishRating[];
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function BusinessDashboard({ 
  user, 
  products, 
  jobOffers, 
  orders, 
  ventes = [], 
  jobApplications = [], 
  onRefreshState, 
  rayonsMetadata = {},
  enterpriseStocks = [],
  allUsers = [],
  hotelRooms = [],
  hotelRoomCategories = [],
  hotelReservations = [],
  hotelCoupons = [],
  hotelAuditLogs = [],
  hotelFomoSettings = [],
  fishLots = [],
  fishLossLogs = [],
  fishAlerts = [],
  butcherLots = [],
  butcherLossLogs = [],
  butcherCuts = [],
  restaurantTables = [],
  restaurantBookings = [],
  dishRatings = [],
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab
}: BusinessDashboardProps) {
  const isSupermarche = user.enterpriseType === 'supermarche';
  const isMarche = user.enterpriseType === 'marche';
  const [localActiveTab, setLocalActiveTab] = useState<string>((isSupermarche || isMarche) ? 'supermarket-stats' : 'inventory');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;

  // Conditional rendering checks moved below Hook initialization to uphold React Hook Rules

  // Delivery Instant Messaging Chat modal states
  const [activeDeliveryChatOrder, setActiveDeliveryChatOrder] = useState<any | null>(null);
  const [deliveryChatMessages, setDeliveryChatMessages] = useState<any[]>([]);
  const [deliveryChatInput, setDeliveryChatInput] = useState<string>('');
  const [isSendingDeliveryMessage, setIsSendingDeliveryMessage] = useState<boolean>(false);
  const [isFetchingDeliveryMessages, setIsFetchingDeliveryMessages] = useState<boolean>(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const fetchDeliveryMessages = async (orderId: string) => {
    setIsFetchingDeliveryMessages(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setDeliveryChatMessages(data);
      }
    } catch (err) {
      console.error("Erreur de chargement messagerie:", err);
    } finally {
      setIsFetchingDeliveryMessages(false);
    }
  };

  const handleOpenDeliveryChat = (order: any) => {
    setActiveDeliveryChatOrder(order);
    setDeliveryChatMessages([]);
    setDeliveryChatInput('');
    fetchDeliveryMessages(order.id);
  };

  const handleSendDeliveryMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeDeliveryChatOrder || !deliveryChatInput.trim() || isSendingDeliveryMessage) return;

    const textToSend = deliveryChatInput.trim();
    setDeliveryChatInput('');
    setIsSendingDeliveryMessage(true);

    try {
      const response = await fetch(`/api/orders/${activeDeliveryChatOrder.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          senderName: user.name,
          text: textToSend
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveryChatMessages(prev => [...prev, data.message]);
      } else {
        alert("Impossible de transmettre le message.");
        setDeliveryChatInput(textToSend);
      }
    } catch (err) {
      console.error("Erreur d'envoi:", err);
      alert("Erreur de réseau lors de l'envoi du message.");
      setDeliveryChatInput(textToSend);
    } finally {
      setIsSendingDeliveryMessage(false);
    }
  };

  // Supermarket-specific states
  const [customRayons, setCustomRayons] = useState<string[]>([]);
  const [selectedRayon, setSelectedRayon] = useState<string | null>(user.enterpriseType === 'marche' ? 'Étalage' : null);
  const [showAddRayonModal, setShowAddRayonModal] = useState(false);
  const [newRayonNameInput, setNewRayonNameInput] = useState('');
  const [newRayonDescInput, setNewRayonDescInput] = useState('');
  const [newRayonImgInput, setNewRayonImgInput] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600');
  const [newRayonEmojiInput, setNewRayonEmojiInput] = useState('📦');

  // Rayon editing states
  const [showEditRayonModal, setShowEditRayonModal] = useState(false);
  const [editingRayonName, setEditingRayonName] = useState('');
  const [editRayonNameInput, setEditRayonNameInput] = useState('');
  const [editRayonDescInput, setEditRayonDescInput] = useState('');
  const [editRayonImgInput, setEditRayonImgInput] = useState('');
  const [editRayonEmojiInput, setEditRayonEmojiInput] = useState('📦');
  const [deleteRayonConfirmName, setDeleteRayonConfirmName] = useState<string | null>(null);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [smProductName, setSmProductName] = useState('');
  const [smProductPrice, setSmProductPrice] = useState('');
  const [smProductStock, setSmProductStock] = useState('');
  const [smProductDesc, setSmProductDesc] = useState('');
  const [smProductImage, setSmProductImage] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600');
  const [smImagesList, setSmImagesList] = useState<string[]>([]);

  // Product editing states
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductStock, setEditProductStock] = useState('');
  const [editProductDesc, setEditProductDesc] = useState('');
  const [editProductImage, setEditProductImage] = useState('');
  const [editImagesList, setEditImagesList] = useState<string[]>([]);
  const [editProductPromoDiscount, setEditProductPromoDiscount] = useState('');
  const [editProductPromoDuration, setEditProductPromoDuration] = useState('30');
  const [editProductPromoUnit, setEditProductPromoUnit] = useState<'minutes' | 'heures' | 'jours'>('minutes');

  // Promotions Management Tab States
  const [bulkPromoDiscount, setBulkPromoDiscount] = useState('');
  const [bulkPromoDuration, setBulkPromoDuration] = useState('30');
  const [bulkPromoUnit, setBulkPromoUnit] = useState<'minutes' | 'heures' | 'jours'>('minutes');
  const [bulkPromoRayon, setBulkPromoRayon] = useState('all');
  const [bulkPromoLoading, setBulkPromoLoading] = useState(false);
  const [quickPromoProductId, setQuickPromoProductId] = useState<string | null>(null);
  const [quickPromoDiscount, setQuickPromoDiscount] = useState('');
  const [quickPromoDuration, setQuickPromoDuration] = useState('30');
  const [quickPromoUnit, setQuickPromoUnit] = useState<'minutes' | 'heures' | 'jours'>('minutes');

  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [restockQtyInput, setRestockQtyInput] = useState('');
  const [restockLoading, setRestockLoading] = useState(false);
  
  // Product state form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Alimentation');
  const [newStock, setNewStock] = useState('');
  const [newUnit, setNewUnit] = useState('unité');
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600');
  const [newImagesList, setNewImagesList] = useState<string[]>([]);
  const [newRayon, setNewRayon] = useState('Épicerie & Crémerie');
  const [customRayonName, setCustomRayonName] = useState('');
  const [isCreatingNewRayon, setIsCreatingNewRayon] = useState(false);

  // Job offer state form
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobLocation, setJobLocation] = useState(user.address || 'Local');
  const [jobRequirement, setJobRequirement] = useState('');
  const [jobReqs, setJobReqs] = useState<string[]>([]);
  const [recruitmentSubTab, setRecruitmentSubTab] = useState<'offers' | 'applications'>('offers');
  const [selectedAppToView, setSelectedAppToView] = useState<JobApplication | null>(null);

  // --- Poissonnerie Specific state forms ---
  const [poissonnerieTab, setPoissonnerieTab] = useState<'lots' | 'losses' | 'alerts'>('lots');
  const [lotProductId, setLotProductId] = useState('');
  const [lotSupplierName, setLotSupplierName] = useState('La Marée Fraîche');
  const [lotNumberInput, setLotNumberInput] = useState('');
  const [lotArrivalDate, setLotArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [lotQuantity, setLotQuantity] = useState('');
  const [lotUnit, setLotUnit] = useState('kg');
  const [lotFreshness, setLotFreshness] = useState('Extra Frais ✨');
  const [lotTemperature, setLotTemperature] = useState('2°C');
  const [lotOrigin, setLotOrigin] = useState('Pêche Atlantique Dakar');

  const [lossProductId, setLossProductId] = useState('');
  const [lossQuantity, setLossQuantity] = useState('');
  const [lossUnit, setLossUnit] = useState('kg');
  const [lossReason, setLossReason] = useState('Invendu périmé');
  const [lossCost, setLossCost] = useState('');

  // --- Boucherie Specific state forms ---
  const [boucherieTab, setBoucherieTab] = useState<'lots' | 'cuts' | 'losses' | 'suppliers'>('lots');
  const [bLotProductId, setBLotProductId] = useState('');
  const [bLotSupplierName, setBLotSupplierName] = useState('La Ferme des Savanes');
  const [bLotNumberInput, setBLotNumberInput] = useState('');
  const [bLotArrivalDate, setBLotArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [bLotQuantity, setBLotQuantity] = useState('');
  const [bLotUnit, setBLotUnit] = useState('kg');
  const [bLotFreshness, setBLotFreshness] = useState('Frais - Abattu récemment 🥩');
  const [bLotTemperature, setBLotTemperature] = useState('2°C');
  const [bLotOrigin, setBLotOrigin] = useState('Élevage Local Bouaké');
  const [bLotVeterinaryCert, setBLotVeterinaryCert] = useState('Certificat Sanitaire OK');

  const [bLossProductId, setBLossProductId] = useState('');
  const [bLossQuantity, setBLossQuantity] = useState('');
  const [bLossUnit, setBLossUnit] = useState('kg');
  const [bLossReason, setBLossReason] = useState('Invendu périmé');
  const [bLossCost, setBLossCost] = useState('');

  const [bCutSourceCarcass, setBCutSourceCarcass] = useState('Demi-Carcasse de Bœuf #45');
  const [bCutSourceWeight, setBCutSourceWeight] = useState('');
  const [bCutTargetProductId, setBCutTargetProductId] = useState('');
  const [bCutTargetWeight, setBCutTargetWeight] = useState('');
  const [bCutLossWeight, setBCutLossWeight] = useState('');
  const [bCutPiecesCount, setBCutPiecesCount] = useState('1');
  const [bCutOperator, setBCutOperator] = useState('Bamba (Chef Boucher)');

  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // --- Restaurant Specific Stocks & Shopping States ---
  const [adjustQtys, setAdjustQtys] = useState<Record<string, number>>({});
  const [shopCart, setShopCart] = useState<Record<string, number>>({});
  const [shopSearchQuery, setShopSearchQuery] = useState<string>('');

  const handleSaveStockAdjust = async (stockId: string, qty: number) => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty })
      });
      if (response.ok) {
        setFormSuccess("Stock mis à jour avec succès !");
        onRefreshState();
      }
    } catch (err) {
      setFormError("Impossible d'ajuster le stock");
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    if (!confirm("Voulez-vous supprimer cet ingrédient de votre stock de cuisine ?")) return;
    try {
      const response = await fetch(`/api/stocks/${stockId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setFormSuccess("Ingrédient supprimé de l'espace de stockage.");
        onRefreshState();
      }
    } catch (err) {
      setFormError("Échec de la suppression");
    }
  };

  const handleCheckoutShop = async () => {
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      for (const [prodId, qty] of Object.entries(shopCart)) {
        const quantity = qty as number;
        if (quantity <= 0) continue;
        const productDetail = products.find(p => p.id === prodId);
        if (!productDetail) continue;

        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerId: user.id,
            productId: prodId,
            quantity: quantity,
            targetSellerId: productDetail.sellerId || 'all'
          })
        });
      }
      setShopCart({});
      setFormSuccess("Félicitations ! Vos achats d'ingrédients ont été enregistrés. Suivez vos commandes ci-dessous et marquez-les comme 'Reçues' pour alimenter directement votre stock de cuisine !");
      onRefreshState();
    } catch (err) {
      setFormError("Erreur lors de la validation de vos achats.");
    } finally {
      setFormLoading(false);
    }
  };

  // Local inventory & data filtered specifically for THIS isolated company account
  const myProducts = products.filter(p => p.sellerId === user.id);
  const myJobs = jobOffers.filter(j => j.companyId === user.id);
  const myIncomingOrders = orders.filter(o => o.sellerId === user.id); // From clients
  const myOutgoingOrders = orders.filter(o => o.buyerId === user.id); // For raw materials from suppliers
  const myReceivedApps = jobApplications.filter(app => app.companyId === user.id && app.status !== 'rejected');

  // In B2B Procure view, we browse products listed by Suppliers (Fournisseurs)
  const supplierProducts = products.filter(p => p.sellerType === 'fournisseur');

  // --- POS Cashier & AI Analytics States ---
  const [posAge, setPosAge] = useState<string>('18-25');
  const [posSexe, setPosSexe] = useState<string>('Femme');
  const [posSearchQuery, setPosSearchQuery] = useState<string>('');
  const [posSelectedCategory, setPosSelectedCategory] = useState<string>('Tous');
  const [posCart, setPosCart] = useState<{ produit: string; quantite: number; prix_unitaire: number; rayon: string }[]>([]);
  const [aiInsights, setAiInsights] = useState<{
    staticRecommendations: { produit: string; score: number }[];
    advancedRecommendations: { produit: string; score: number }[];
    predictionResult?: {
      bestRayon: string;
      bestScore: number;
      level: string;
      probabilities: { rayon: string; proba: number }[];
    };
  } | null>(null);

  const [posError, setPosError] = useState<{
    error: string;
    message: string;
    produit: string;
    demande: number;
    dispo: number;
  } | null>(null);
  const [posPaymentMethod, setPosPaymentMethod] = useState<string>('Espèces');
  const [posClientName, setPosClientName] = useState<string>('');
  const [posDiscountPercent, setPosDiscountPercent] = useState<number>(0);
  const [posDiscountCode, setPosDiscountCode] = useState<string>('');
  const [posTvaRate, setPosTvaRate] = useState<number>(18);
  const [printedTicket, setPrintedTicket] = useState<any | null>(null);
  const [procureQtys, setProcureQtys] = useState<Record<string, number>>({});
  const [procureStatus, setProcureStatus] = useState<Record<string, { status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>>({});
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string>('');
  const [hasSeenRecruitmentTab, setHasSeenRecruitmentTab] = useState<boolean>(false);
  const [posSuccess, setPosSuccess] = useState<string>('');
  const [posSubmitting, setPosSubmitting] = useState<boolean>(false);

  // Trigger recommender queries instantly on cashier input change
  React.useEffect(() => {
    if (activeTab !== 'pos') return;
    
    const queryAIInsights = async () => {
      try {
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entreprise_id: user.id,
            age: posAge,
            sexe: posSexe,
            panier: posCart.map(i => i.produit)
          })
        });
        if (response.ok) {
          const data = await response.json();
          setAiInsights({
            staticRecommendations: data.staticRecommendations || [],
            advancedRecommendations: data.advancedRecommendations || [],
            predictionResult: data.predictionResult
          });
        }
      } catch (err) {
        console.error("Erreur de calcul de l'algorithme de recommandation:", err);
      }
    };

    const timer = setTimeout(() => {
      queryAIInsights();
    }, 150);

    return () => clearTimeout(timer);
  }, [posAge, posSexe, posCart, activeTab, user.id]);

  const handleApplyBulkPromo = async (isClear = false) => {
    setBulkPromoLoading(true);
    setFormSuccess('');
    setFormError('');
    try {
      const response = await fetch('/api/rayons/bulk-promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user.id,
          rayon: bulkPromoRayon === 'all' ? undefined : bulkPromoRayon,
          promotionDiscount: isClear ? '' : bulkPromoDiscount,
          durationValue: bulkPromoDuration,
          durationUnit: bulkPromoUnit
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise en promotion.");
      }

      const data = await response.json();
      if (isClear) {
        setFormSuccess(`✓ Promotion d'ensemble annulée avec succès pour ${data.updatedCount} article(s).`);
      } else {
        setFormSuccess(`⚡ Promotion flash de -${bulkPromoDiscount}% activée avec succès pour ${data.updatedCount} article(s) !`);
      }
      onRefreshState();
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue.");
    } finally {
      setBulkPromoLoading(false);
    }
  };

  const handleApplyQuickPromo = async (productId: string, isClear = false) => {
    setFormSuccess('');
    setFormError('');
    try {
      let promoEnd: string | undefined = undefined;
      let discount: number | undefined = undefined;

      if (!isClear) {
        discount = Number(quickPromoDiscount);
        if (isNaN(discount) || discount <= 0 || discount >= 100) {
          throw new Error("La réduction doit être un nombre de pourcentage valide (ex: 20 pour -20%).");
        }
        
        const val = Number(quickPromoDuration) || 30;
        let extraMs = 0;
        if (quickPromoUnit === 'minutes') {
          extraMs = val * 60 * 1000;
        } else if (quickPromoUnit === 'heures') {
          extraMs = val * 60 * 60 * 1000;
        } else if (quickPromoUnit === 'jours') {
          extraMs = val * 24 * 60 * 60 * 1000;
        }
        promoEnd = new Date(Date.now() + extraMs).toISOString();
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotionDiscount: isClear ? "" : discount,
          promotionEnd: isClear ? "" : promoEnd
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de configuration.");
      }

      setFormSuccess(isClear ? "✓ Promotion de l'article annulée." : "⚡ Offre Spéciale Flash activée sur l'article !");
      setQuickPromoProductId(null);
      setQuickPromoDiscount('');
      onRefreshState();
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue.");
    }
  };

  const handleAddPosCartItem = (p: Product) => {
    setPosSuccess('');
    setPosError(null);
    const existing = posCart.find(item => item.produit.toLowerCase() === p.title.toLowerCase());
    if (existing) {
      if (existing.quantite + 1 > p.stock) {
        setPosError({
          error: 'vente_impossible',
          message: `Stock insuffisant pour ajouter un autre "${p.title}".`,
          produit: p.title,
          demande: existing.quantite + 1,
          dispo: p.stock
        });
        return;
      }
      setPosCart(posCart.map(item => item.produit.toLowerCase() === p.title.toLowerCase() ? { ...item, quantite: item.quantite + 1 } : item));
    } else {
      if (p.stock < 1) {
        setPosError({
          error: 'vente_impossible',
          message: `Stock en rupture de stock pour "${p.title}".`,
          produit: p.title,
          demande: 1,
          dispo: p.stock
        });
        return;
      }
      setPosCart([...posCart, { produit: p.title, quantite: 1, prix_unitaire: p.price, rayon: p.category }]);
    }
  };

  const handleRemovePosCartItem = (productName: string) => {
    setPosError(null);
    setPosSuccess('');
    const existing = posCart.find(item => item.produit.toLowerCase() === productName.toLowerCase());
    if (existing && existing.quantite > 1) {
      setPosCart(posCart.map(item => item.produit.toLowerCase() === productName.toLowerCase() ? { ...item, quantite: item.quantite - 1 } : item));
    } else {
      setPosCart(posCart.filter(item => item.produit.toLowerCase() !== productName.toLowerCase()));
    }
  };

  const handleCheckoutPosCart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) return;
    setPosSubmitting(true);
    setPosError(null);
    setPosSuccess('');

    const rawTotal = posCart.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);
    const discountAmt = Math.round(rawTotal * (posDiscountPercent / 100));
    const afterDiscSub = rawTotal - discountAmt;
    const parsedVat = Math.round(afterDiscSub * (posTvaRate / 100));
    const finalTotalCalculated = afterDiscSub + parsedVat;

    try {
      const response = await fetch('/api/ventes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entreprise_id: user.id,
          age: posAge,
          sexe: posSexe,
          items: posCart,
          paymentMethod: posPaymentMethod,
          discountAmount: discountAmt,
          discountCode: posDiscountCode || (posDiscountPercent > 0 ? `REDUC-${posDiscountPercent}` : ""),
          promoApplied: posDiscountPercent > 0,
          vatRate: posTvaRate,
          vatAmount: parsedVat,
          clientName: posClientName || "Client de passage"
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'vente_impossible') {
          setPosError(data);
        } else {
          throw new Error(data.error || 'Erreur lors de la validation POS');
        }
      } else {
        setPosSuccess('Achat direct comptoir enregistré avec succès ! L\'inventaire a été décrémenté.');
        if (data.vente) {
          setPrintedTicket(data.vente);
        } else {
          setPrintedTicket({
            id: "vente_" + Math.random().toString(36).substring(2, 9),
            entreprise_id: user.id,
            age: posAge,
            sexe: posSexe,
            items: posCart.map(it => ({ rayon: "Général", produit: it.produit, quantite: it.quantite, prix_unitaire: it.prix_unitaire, total: it.prix_unitaire * it.quantite })),
            total: finalTotalCalculated,
            date_vente: new Date().toISOString(),
            paymentMethod: posPaymentMethod,
            discountAmount: discountAmt,
            discountCode: posDiscountCode || (posDiscountPercent > 0 ? `REDUC-${posDiscountPercent}` : ""),
            vatRate: posTvaRate,
            vatAmount: parsedVat,
            clientName: posClientName || "Client de passage"
          });
        }
        setPosCart([]);
        setPosClientName('');
        setPosDiscountPercent(0);
        setPosDiscountCode('');
        onRefreshState();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPosSubmitting(false);
    }
  };

  // Handle add product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice || !newStock) return;
    
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const activeRayon = isCreatingNewRayon ? customRayonName : newRayon;
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user.id,
          title: newTitle,
          description: newDescription,
          price: Number(newPrice),
          category: newCategory,
          stock: Number(newStock),
          unit: newUnit,
          imageUrl: newImageUrl,
          images: newImagesList && newImagesList.length > 0 ? newImagesList : [newImageUrl],
          rayon: user.enterpriseType === 'supermarche' ? (activeRayon || "Épicerie") : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setFormSuccess('Produit ajouté à votre boutique !');
      setNewTitle('');
      setNewDescription('');
      setNewPrice('');
      setNewStock('');
      setNewUnit('unité');
      setNewImageUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600');
      setNewImagesList([]);
      setCustomRayonName('');
      setIsCreatingNewRayon(false);
      onRefreshState();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Voulez-vous vraiment retirer ce produit ?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        onRefreshState();
      }
    } catch (err) {
      alert('Erreur lors du retrait du produit');
    }
  };

  // Add req to list temp
  const addRequirement = () => {
    if (jobRequirement.trim()) {
      setJobReqs([...jobReqs, jobRequirement.trim()]);
      setJobRequirement('');
    }
  };

  // Handle post Job Offer
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobDescription || !jobSalary) return;

    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: user.id,
          title: jobTitle,
          description: jobDescription,
          salary: jobSalary,
          location: jobLocation,
          requirements: jobReqs.length > 0 ? jobReqs : ["Motivé", "Polyvalent"]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setFormSuccess('Offre d\'emploi publiée avec succès ! Seuls les profils clients y ont accès.');
      setJobTitle('');
      setJobDescription('');
      setJobSalary('');
      setJobReqs([]);
      onRefreshState();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete Job Offer
  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setFormSuccess("L'offre d'emploi a été supprimée avec succès !");
        onRefreshState();
      } else {
        const data = await response.json();
        setFormError(data.error || "Erreur lors de la suppression de l'offre");
      }
    } catch (err) {
      setFormError("Erreur de connexion lors de la suppression de l'offre");
    }
  };

  // Reject a job application
  const handleRejectApplication = async (appId: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}/reject`, {
        method: 'POST'
      });
      if (response.ok) {
        setFormSuccess("Candidature rejetée. Un message de refus a été envoyé au client.");
        onRefreshState();
        setSelectedAppToView(null);
      } else {
        const data = await response.json();
        setFormError(data.error || "Erreur lors du rejet de la candidature.");
      }
    } catch (err) {
      setFormError("Erreur de connexion lors du rejet de la candidature.");
    }
  };

  // Accept/Validate a job application
  const handleAcceptApplication = async (appId: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}/accept`, {
        method: 'POST'
      });
      if (response.ok) {
        setFormSuccess("Félicitations ! Candidature validée avec succès. Le postulant a été informé par notification.");
        onRefreshState();
        setSelectedAppToView(null);
      } else {
        const data = await response.json();
        setFormError(data.error || "Erreur lors de la validation de la candidature.");
      }
    } catch (err) {
      setFormError("Erreur de connexion lors de la validation.");
    }
  };

  // Order status update (incoming clients orders)
  const handleOrderStatusUpdate = async (orderId: string, status: 'accepted' | 'shipped' | 'delivered') => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        onRefreshState();
      }
    } catch (err) {
      setFormError('Erreur lors du changement d\'état de la commande');
    }
  };

  const handleAutoAssignCarrier = async (orderId: string) => {
    const availableCarriers = allUsers.filter(u => u.profileType === 'livreur');
    if (availableCarriers.length === 0) {
      alert("Aucun livreur WeLink n'est encore inscrit sur la plateforme. Conseil : Créez d'abord un compte de type 'Livreur/Transporteur' (ex: moto, tricycle) sur l'écran de déconnexion pour tester l'assignation instantanée de proximité !");
      return;
    }
    const carrier = availableCarriers[0];
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierId: carrier.id,
          carrierName: carrier.name,
          carrierPhone: carrier.phone || 'Non spécifié',
          deliveryStatus: 'assigned',
          deliveryFee: 1500,
          status: 'shipped'
        })
      });
      if (res.ok) {
        alert(`Livreur WeLink assigné avec succès : ${carrier.name} (${carrier.carrierType || 'moto'}) !`);
        onRefreshState();
      } else {
        alert("Erreur lors de l'assignation.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Confirm delivery of B2B outgoing orders from suppliers
  const handleConfirmB2BOrderDelivery = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      });
      if (response.ok) {
        setFormSuccess("Livraison confirmée avec succès ! Les marchandises correspondantes ont été ajoutées directement à vos stocks.");
        onRefreshState();
      } else {
        const data = await response.json();
        setFormError(data.error || "Impossible de mettre à jour le statut de la commande.");
      }
    } catch (err) {
      setFormError("Une erreur de réseau s'est produite lors de la confirmation de la livraison.");
    }
  };

  // Procure raw materials from supplier
  const handleProcureRawMaterials = async (productId: string, quantity: number) => {
    setProcureStatus(prev => ({
      ...prev,
      [productId]: { status: 'loading' }
    }));

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: user.id, // This enterprise is buying
          productId,
          quantity
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setProcureStatus(prev => ({
        ...prev,
        [productId]: { status: 'success', message: `Commande de ${quantity} unité(s) envoyée avec succès !` }
      }));
      onRefreshState();

      // Automatically reset status to idle after 4 seconds
      setTimeout(() => {
        setProcureStatus(prev => ({
          ...prev,
          [productId]: { status: 'idle' }
        }));
      }, 4000);

    } catch (err: any) {
      setProcureStatus(prev => ({
        ...prev,
        [productId]: { status: 'error', message: err.message || 'Erreur lors de l\'envoi de la commande.' }
      }));
    }
  };

  // Render hotel or clothes boutique sub-dashboards if criteria met
  const isHotelFeatureTab = !activeTab || ['inventory', 'promotions', 'hotel-stats', 'bookings', 'audit-logs'].includes(activeTab);

  if (user.enterpriseType === 'hotel' && isHotelFeatureTab) {
    return (
      <HotelAdminDashboard
        user={user}
        products={products}
        jobOffers={jobOffers}
        orders={orders}
        onRefreshState={onRefreshState}
        allUsers={allUsers}
        hotelRooms={hotelRooms}
        hotelRoomCategories={hotelRoomCategories}
        hotelReservations={hotelReservations}
        hotelCoupons={hotelCoupons}
        hotelAuditLogs={hotelAuditLogs}
        hotelFomoSettings={hotelFomoSettings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    );
  }

  if (user.enterpriseType === 'vetement' && (activeTab === 'inventory' || activeTab === 'sales' || !activeTab)) {
    return (
      <ClothingBoutiqueDashboard
        user={user}
        products={products}
        jobOffers={jobOffers}
        orders={orders}
        onRefreshState={onRefreshState}
        allUsers={allUsers}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    );
  }

  return (
    <div id="business-dashboard-root" className="w-full font-sans">
      {/* Main workspace frame */}
      <div id="business-workspace" className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 min-h-[550px]">
        {formSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-sm">
            {formSuccess}
          </div>
        )}
        {formError && (
          <div className="mb-4 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-sm">
            {formError}
          </div>
        )}

        {/* SUPERMARKET STATS AND ANALYTICS TAB */}
        {activeTab === 'supermarket-stats' && (isSupermarche || isMarche) && (
          <div id="supermarket-stats-tab" className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-800/60 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                <span>
                  {isMarche 
                    ? "Analyse des Ventes & Performances de l'Étalage" 
                    : "Analyse des Ventes & Performances du Supermarché"}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {isMarche 
                  ? "Suivi en temps réel de votre activité commerciale physique (Caisse de l'étalage) et virtuelle (Commandes Étalage)."
                  : "Suivi en temps réel de votre activité commerciale physique (Caisse Comptoir) et virtuelle (Commandes Épicerie)."}
              </p>
            </div>

            {/* Calculations inside the render component block */}
            {(() => {
              const myDirectVentes = ventes.filter(v => v.entreprise_id === user.id);
              const myDeliveredOrders = myIncomingOrders.filter(o => o.status === 'delivered' || o.status === 'accepted' || o.status === 'shipped');

              const totalCA = myDirectVentes.reduce((sum, v) => sum + v.total, 0) + 
                              myDeliveredOrders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
                              
              const totalSalesCount = myDirectVentes.length + myDeliveredOrders.length;
              const averageCart = totalSalesCount > 0 ? Math.round(totalCA / totalSalesCount) : 0;

              const isNewAccount = user.id.startsWith("user_") || !["e1", "e2", "e3", "e5", "e6", "e7", "e8", "e10", "e-demo-hotel", "e-demo-marche", "e-demo-alimentation", "e-demo-vetement", "e-demo-poissonnerie", "e-demo-boucher"].includes(user.id);

              const productQuantities: Record<string, number> = {};
              myDirectVentes.forEach(v => {
                v.items?.forEach(item => {
                  productQuantities[item.produit] = (productQuantities[item.produit] || 0) + item.quantite;
                });
              });
              myDeliveredOrders.forEach(o => {
                productQuantities[o.productTitle] = (productQuantities[o.productTitle] || 0) + o.quantity;
              });

              const sortedProducts = Object.entries(productQuantities).sort((a, b) => b[1] - a[1]);
              const topProduct = sortedProducts.length > 0 ? sortedProducts[0][0] : "Aucune vente";
              const topProductQty = sortedProducts.length > 0 ? sortedProducts[0][1] : 0;

              // Compute distribution by Rayon for Chart
              const revenuePerRayon: Record<string, number> = {};
              myDirectVentes.forEach(v => {
                v.items?.forEach(item => {
                  const ray = item.rayon || "Épicerie";
                  revenuePerRayon[ray] = (revenuePerRayon[ray] || 0) + item.total;
                });
              });
              myDeliveredOrders.forEach(o => {
                const matchedProd = products.find(p => p.id === o.productId);
                const ray = matchedProd?.rayon || "Épicerie";
                revenuePerRayon[ray] = (revenuePerRayon[ray] || 0) + (o.price * o.quantity);
              });
              
              const defaultRayons = isNewAccount ? [] : [
                "Climatiseurs & Ventilateurs",
                "Téléphones & Tablettes",
                "Appareils de Cuisson & Cuisine",
                "Téléviseurs, Audio & Vidéo",
                "Mode & Vêtements",
                "Beauté, Cosmétiques & Parfum",
                "Épicerie, Alimentation & Boissons"
              ];
              defaultRayons.forEach(r => {
                if (!revenuePerRayon[r]) revenuePerRayon[r] = 0;
              });
              
              // Seed simulated graphic visuals if zero is true and NOT a new account
              if (totalCA === 0 && !isNewAccount) {
                revenuePerRayon["Climatiseurs & Ventilateurs"] = 540000;
                revenuePerRayon["Téléphones & Tablettes"] = 890000;
                revenuePerRayon["Appareils de Cuisson & Cuisine"] = 420000;
                revenuePerRayon["Téléviseurs, Audio & Vidéo"] = 385000;
                revenuePerRayon["Mode & Vêtements"] = 180000;
                revenuePerRayon["Beauté, Cosmétiques & Parfum"] = 125000;
                revenuePerRayon["Épicerie, Alimentation & Boissons"] = 245000;
              }

              const maxRayonVal = Math.max(...Object.values(revenuePerRayon), 1);

              return (
                <div className="space-y-6">
                  {/* KPI Bento Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* card 1 */}
                    <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg hover:border-violet-500/30 transition">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Chiffre d'Affaires</span>
                        <h4 className="text-sm font-extrabold text-slate-100 font-mono">
                          {((totalCA === 0 && !isNewAccount) ? 145000 : totalCA).toLocaleString()} <span className="text-[10px] text-violet-400 font-sans">FCFA</span>
                        </h4>
                        {!isNewAccount ? (
                          <div className="flex items-center space-x-1 text-[9px] text-emerald-400 font-semibold bg-emerald-950/30 px-2 py-0.5 rounded-full w-max">
                            <span>↑ 12.4%</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-[9px] text-slate-500 font-semibold bg-slate-900/60 px-2 py-0.5 rounded-full w-max">
                            <span>— 0%</span>
                          </div>
                        )}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center text-md shadow-inner">
                        💸
                      </div>
                    </div>

                    {/* card 2 */}
                    <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg hover:border-violet-500/30 transition">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Nombre de Ventes</span>
                        <h4 className="text-sm font-extrabold text-slate-100 font-mono">
                          {(totalSalesCount === 0 && !isNewAccount) ? 18 : totalSalesCount} <span className="text-[10px] text-slate-400 font-sans">achats</span>
                        </h4>
                        <span className="text-[9px] text-slate-400 block">Comptoir & Livraison incl.</span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center text-md shadow-inner">
                        🛒
                      </div>
                    </div>

                    {/* card 3 */}
                    <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg hover:border-violet-500/30 transition">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Panier Moyen</span>
                        <h4 className="text-sm font-extrabold text-slate-100 font-mono">
                          {((averageCart === 0 && !isNewAccount) ? 8055 : averageCart).toLocaleString()} <span className="text-[10px] text-violet-400 font-sans">FCFA</span>
                        </h4>
                        <span className="text-[9px] text-emerald-400 font-semibold">
                          {isNewAccount ? "Aucun achat enregistré" : "Haute valeur d'achat"}
                        </span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-md shadow-inner">
                        💳
                      </div>
                    </div>

                    {/* card 4 */}
                    <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg hover:border-violet-500/30 transition">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-sans">Top Article Vendu</span>
                        <h4 className="text-xs font-bold text-slate-100 truncate max-w-[120px]" title={topProduct}>
                          {(topProduct === "Aucun article vendu" || (topProduct === "Aucune vente" && isNewAccount)) ? (isNewAccount ? "Aucun" : "Jus de Bissap") : topProduct}
                        </h4>
                        <span className="text-[9px] text-violet-300 font-semibold bg-violet-950/40 px-2 py-0.5 rounded-full w-max">
                          {((topProductQty === 0 && !isNewAccount) ? 12 : topProductQty)} unités écoulées
                        </span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-md shadow-inner">
                        🏆
                      </div>
                    </div>
                  </div>

                  {/* Diagrams Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Diagram Rayon sales split */}
                    <div className="md:col-span-7 bg-slate-950/40 border border-slate-800 rounded-2xl p-5 shadow-inner">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">📊 Ventes par Rayons / Départements</h3>
                          <p className="text-[10px] text-slate-500">Performance financière par linéaire d'achalandage.</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {Object.keys(revenuePerRayon).length === 0 ? (
                          <div className="w-full flex flex-col items-center justify-center text-center py-8">
                            <span className="text-lg">📊</span>
                            <p className="text-[10px] text-slate-500 mt-1">Aucune donnée de rayon enregistrée.</p>
                          </div>
                        ) : (
                          Object.entries(revenuePerRayon).map(([ray, val]) => {
                            const percentage = Math.round((val / maxRayonVal) * 100);
                            return (
                              <div key={ray} className="space-y-1">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="font-medium text-slate-300 text-xs">{ray}</span>
                                  <span className="font-mono text-slate-400 text-[11px] font-semibold">
                                    {val.toLocaleString()} FCFA ({percentage}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/85">
                                  <div 
                                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-1000" 
                                    style={{ width: `${Math.max(percentage, 3)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Diagram Best products - Glowing column chart */}
                    <div className="md:col-span-5 bg-slate-950/40 border border-slate-800 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">📈 Quantités Vendues (Top 4)</h3>
                          <p className="text-[10px] text-slate-500">Volume de vente comparatif de vos articles leaders.</p>
                        </div>
                      </div>

                      {/* Pure CSS Column chart */}
                      <div className="h-40 flex items-end justify-between gap-2.5 pt-6 pb-2">
                        {(() => {
                          const mockTop = (sortedProducts.length >= 2 && !isNewAccount) ? sortedProducts.slice(0, 4) : (
                            isNewAccount ? [] : [
                              ["Bissap Coco", 32],
                              ["Ananas Bonoua", 24],
                              ["Arachide Pure", 15],
                              ["Manioc Sac", 8]
                            ]
                          );

                          if (mockTop.length === 0) {
                            return (
                              <div className="w-full h-full flex flex-col items-center justify-center text-center py-6">
                                <span className="text-xl">📈</span>
                                <p className="text-[10px] text-slate-500 mt-1 font-sans">Aucune vente enregistrée pour le moment.</p>
                              </div>
                            );
                          }

                          const maxMockQty = Math.max(...mockTop.map(item => Number(item[1])), 1);

                          return mockTop.map(([name, qty]) => {
                            const ratioHeight = Math.round((Number(qty) / maxMockQty) * 100);
                            return (
                              <div key={name} className="flex-1 flex flex-col items-center group">
                                <div className="w-full relative flex flex-col items-center">
                                  <span className="text-[9px] font-mono font-bold text-violet-400 mb-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap bg-slate-900/90 border border-slate-800 px-1 py-0.5 rounded -top-8 absolute">
                                    {qty} unités
                                  </span>
                                  {/* Bar container */}
                                  <div 
                                    className="w-7 sm:w-8 bg-gradient-to-t from-indigo-700 via-violet-600 to-pink-505 rounded-t-lg transition-all duration-700 relative shadow-lg shadow-violet-950/20 group-hover:shadow-violet-500/20 group-hover:brightness-110"
                                    style={{ height: `${Math.max(ratioHeight, 15)}%` }}
                                  >
                                    <div className="absolute inset-x-0 top-0 h-0.5 bg-white/40 rounded-t-lg" />
                                  </div>
                                </div>
                                <span className="text-[9px] text-slate-400 mt-2 text-center truncate w-full font-medium" title={name}>
                                  {name}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation block / Call to action */}
                  <div className="bg-violet-950/15 border border-violet-900/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-violet-300">💡 Optimisation des Linéaires & Approvisionnements</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed max-w-xl">
                        Vos produits de la caisse comptoir affichent un excellent engouement. N'oubliez pas d'indiquer les réapprovisionnements fournisseurs dans le menu <strong>Mes Rayons</strong> pour maintenir des statistiques parfaites et anticiper les ruptures de stock.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pos')}
                      className="text-xs font-bold bg-violet-600 hover:bg-violet-500 transition px-4 py-2 rounded-xl text-white shadow"
                    >
                      Aller à la caisse →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* SUPERMARKET AISLES / RAYONS TAB */}
        {activeTab === 'supermarket-rayons' && (isSupermarche || isMarche) && (
          <div id="supermarket-rayons-tab" className="space-y-6 animate-fade-in">
            {/* Header section with back navigation or actions */}
            <div className="border-b border-slate-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                  <LayoutDashboard className="w-5 h-5 text-violet-400" />
                  <span>
                    {isMarche ? "Mon Étalage de Vente" : (selectedRayon ? `Mes Rayons / ${selectedRayon}` : "Mes Rayons de Vente")}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-sans">
                  {isMarche 
                    ? "Consultez la liste des produits présents sur votre étalage, gérez vos prix, mettez à jour votre stock physique, et importez de nouvelles images."
                    : (selectedRayon 
                      ? "Consultez les produits, gérez vos prix, les stocks d'articles et le réapprovisionnement direct fournisseur."
                      : "Gérez les rayons physiques de votre supermarché et organisez vos linéaires d'articles.")
                  }
                </p>
              </div>

              {/* Top Right Action Button */}
              <div>
                {selectedRayon ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSmProductName('');
                      setSmProductPrice('');
                      setSmProductStock('');
                      setSmProductDesc('');
                      setShowAddProductModal(true);
                    }}
                    className="flex items-center space-x-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter Produit</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNewRayonNameInput('');
                      setShowAddRayonModal(true);
                    }}
                    className="flex items-center space-x-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter Rayon</span>
                  </button>
                )}
              </div>
            </div>

            {/* CASE 1: SELECTION OF A RAYON */}
            {selectedRayon === null ? (
              <div className="space-y-4">
                {(() => {
                  const rayonsList = Array.from(new Set([
                    ...myProducts.map(p => p.rayon).filter(Boolean),
                    ...customRayons
                  ]));

                  if (rayonsList.length === 0) {
                    return (
                      <div className="py-20 px-4 text-center bg-slate-950/20 border border-slate-800/80 rounded-3xl space-y-4 max-w-xl mx-auto animate-fade-in">
                        <span className="text-5xl block">🛒</span>
                        <h3 className="font-bold text-sm text-slate-200">Aucun rayon configuré</h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                          Votre supermarché commence avec 0 rayon aujourd'hui. Créez un rayon personnalisé (comme Épicerie, Produits frais, Boissons, etc.) pour stocker vos articles.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setNewRayonNameInput('');
                            setShowAddRayonModal(true);
                          }}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Créer mon premier rayon</span>
                        </button>
                      </div>
                    );
                  }

                  const rayonMetadata: Record<string, { desc: string; emoji: string; img: string }> = {
                    "Climatiseurs & Ventilateurs": {
                      desc: "Climatiseurs split intelligents de classe A+, ventilateurs brumisateurs à eau haute performance.",
                      emoji: "❄️",
                      img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600"
                    },
                    "Téléphones & Tablettes": {
                      desc: "Flagships Apple iPhone, appareils Samsung Galaxy et Tecno avec garanties officielles.",
                      emoji: "📱",
                      img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600"
                    },
                    "Réfrigérateurs & Congélateurs": {
                      desc: "Réfrigérateurs double battant de grande capacity OSCAR et congélateurs horizontaux économe.",
                      emoji: "🧊",
                      img: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=600"
                    },
                    "Appareils de Cuisson & Cuisine": {
                      desc: "Plaques de cuisson inox, cuisinières Fiabtec avec four, air fryers Midea et micro-ondes.",
                      emoji: "🍳",
                      img: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600"
                    },
                    "Blender & Petit Électroménager": {
                      desc: "Blendeurs Ice Crusher Moulinex, bouilloires électriques rapides en acier inoxydable.",
                      emoji: "🥤",
                      img: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&q=80&w=600"
                    },
                    "Téléviseurs, Audio & Vidéo": {
                      desc: "Écrans flats intelligents Roch 65 pouces 4K, home cinémas LG surround 5.1 et woofers Bluetooth.",
                      emoji: "📺",
                      img: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=600"
                    },
                    "Maison, Meubles & Literie": {
                      desc: "Matelas orthopédiques MEGALUX, chaises pivotantes d'ergonomie Pro et mobilier de direction.",
                      emoji: "🛏️",
                      img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600"
                    },
                    "Mode & Vêtements": {
                      desc: "Maillots officiels des Lions Indomptables du Cameroun pour la CAN 2025 et vélos pour enfants.",
                      emoji: "👕",
                      img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600"
                    },
                    "Bricolage & Énergie": {
                      desc: "Groupes électrogènes à essence ROCH, mallettes complètes d'outillages pro chromés.",
                      emoji: "⚡",
                      img: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=600"
                    },
                    "Beauté, Cosmétiques & Parfum": {
                      desc: "Eaux de parfum de marque, beurres de karité purs et savons corporels bio hydratants.",
                      emoji: "🧼",
                      img: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=600"
                    },
                    "Épicerie, Alimentation & Boissons": {
                      desc: "Laits d'Afrique enrichis, jus de goyave sauvage pressés et riz parfumé jasmin de premier choix.",
                      emoji: "🍇",
                      img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600"
                    }
                  };

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rayonsList.map((rayName) => {
                        const baseInfo = rayonMetadata[rayName] || {
                          desc: "Rayon personnalisé configuré pour classifier vos articles selon vos besoins de supermarché.",
                          emoji: "📦",
                          img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
                        };

                      // Merge with user-custom dynamic metadata from backend
                      const rayInfo = {
                        ...baseInfo,
                        ...(rayonsMetadata[rayName] || {})
                      };

                      const rayProducts = myProducts.filter(p => (p.rayon || "Épicerie & Crémerie") === rayName);
                      const activeItemCount = rayProducts.length;
                      const stockCriticalCount = rayProducts.filter(p => p.stock <= 5).length;

                      return (
                        <div 
                          key={rayName}
                          onClick={() => setSelectedRayon(rayName)}
                          className="bg-slate-950/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-violet-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-lg"
                        >
                          <div>
                            <div className="w-full h-28 relative bg-slate-900 border-b border-slate-900/50">
                              <img src={rayInfo.img} alt={rayName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
                              <span className="absolute top-2 left-2 w-7 h-7 bg-slate-900/90 text-xs rounded-lg flex items-center justify-center border border-slate-800 font-bold">
                                {rayInfo.emoji}
                              </span>

                              {/* Edit Button with e.stopPropagation() */}
                              <button
                                type="button"
                                title="Modifier ce rayon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRayonName(rayName);
                                  setEditRayonNameInput(rayName);
                                  setEditRayonDescInput(rayInfo.desc);
                                  setEditRayonImgInput(rayInfo.img);
                                  setEditRayonEmojiInput(rayInfo.emoji);
                                  setShowEditRayonModal(true);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-slate-900/90 text-slate-350 hover:text-white hover:bg-violet-600 rounded-lg border border-slate-800 transition z-10 cursor-pointer text-[10px]"
                              >
                                ✏️
                              </button>

                              <h3 className="absolute bottom-2 left-3 font-bold text-xs text-slate-100 drop-shadow">
                                {rayName}
                              </h3>
                            </div>
                            <div className="p-4 space-y-2">
                              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                                {rayInfo.desc}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 pt-0 border-t border-slate-900/40 mt-auto">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                              <span>Articles : {activeItemCount}</span>
                              {stockCriticalCount > 0 ? (
                                <span className="text-red-400 bg-red-950/35 px-1.5 py-0.5 rounded-sm font-bold flex items-center gap-1 animate-pulse">
                                  ⚠️ {stockCriticalCount} critique(s)
                                </span>
                              ) : (
                                <span className="text-emerald-400">Stock suffisant</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
                })()}
              </div>
            ) : (
              // CASE 2: BROWSING A SPECIFIC AISLE / RAYON
              <div className="space-y-4">
                {/* Back Link */}
                {!isMarche && (
                  <button
                    type="button"
                    onClick={() => { setSelectedRayon(null); setFormSuccess(''); setFormError(''); }}
                    className="flex items-center space-x-1.5 text-xs text-violet-400 hover:text-white transition group py-1 cursor-pointer"
                  >
                    <span className="group-hover:-translate-x-0.5 transition duration-200">←</span>
                    <span>Retour à la liste de tous les rayons</span>
                  </button>
                )}

                {/* Products Grid in that Department */}
                {(() => {
                  const rayonProducts = myProducts.filter(p => {
                    const r = isMarche ? "Étalage" : (p.rayon || "Épicerie & Crémerie");
                    return r === selectedRayon;
                  });

                  if (rayonProducts.length === 0) {
                    return (
                      <div className="text-center py-20 text-slate-655 border border-dashed border-slate-800 rounded-3xl bg-slate-950/10 space-y-3">
                        <p className="text-xs text-slate-400">
                          {isMarche 
                            ? "Aucun produit ou article n'est configuré sur votre étalage." 
                            : `Aucun produit ou article n'est configuré dans le rayon ${selectedRayon}.`}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSmProductName('');
                            setSmProductPrice('');
                            setSmProductStock('');
                            setSmProductDesc('');
                            setShowAddProductModal(true);
                          }}
                          className="bg-violet-950 text-violet-300 hover:bg-violet-900 border border-violet-800 rounded-xl px-4 py-2 text-xs font-bold transition shadow cursor-pointer mx-auto block"
                        >
                          {isMarche ? "Achalander l'étalage avec un premier produit" : "Achalander le rayon avec un 1er produit"}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rayonProducts.map((p) => {
                        const isCritical = p.stock <= 5;
                        return (
                          <div id={`rayon-product-${p.id}`} key={p.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden p-4 flex flex-col justify-between hover:border-slate-700 transition duration-200 shadow-sm">
                            <div>
                              {p.imageUrl && (
                                <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-3">
                                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                              )}

                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <h4 className="font-bold text-xs text-slate-100 truncate max-w-[150px]" title={p.title}>{p.title}</h4>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingProduct(p);
                                      setEditProductName(p.title);
                                      setEditProductDesc(p.description || '');
                                      setEditProductPrice(String(p.price));
                                      setEditProductStock(String(p.stock));
                                      setEditProductImage(p.imageUrl || '');
                                      setEditImagesList(p.images && p.images.length ? [...p.images] : [p.imageUrl || '']);
                                      setEditProductPromoDiscount(p.promotionDiscount ? String(p.promotionDiscount) : '');
                                      setEditProductPromoDuration('30');
                                      setEditProductPromoUnit('minutes');
                                      setShowEditProductModal(true);
                                    }}
                                    className="text-slate-500 hover:text-violet-400 p-0.5 rounded transition cursor-pointer"
                                    title="Modifier ce produit"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="text-slate-500 hover:text-red-400 p-0.5 rounded transition shrink-0 cursor-pointer"
                                    title="Retirer ce produit définitivement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 min-h-[32px] mb-3 font-sans">
                                {p.description || "Aucune description de l'article."}
                              </p>

                              <div className="flex items-center justify-between text-[11px] border-b border-slate-900 pb-2.5">
                                {p.promotionDiscount && p.promotionEnd && new Date(p.promotionEnd) > new Date() ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold text-emerald-400 font-mono text-[11px] sm:text-xs">
                                        {Math.round(p.price * (1 - p.promotionDiscount / 100)).toLocaleString()} FCFA
                                      </span>
                                      <span className="text-[9px] text-slate-500 line-through font-mono">
                                        {p.price.toLocaleString()} FCFA
                                      </span>
                                    </div>
                                    <div className="mt-0.5">
                                      <CountdownTimer expiryDate={p.promotionEnd} onExpired={onRefreshState} />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-bold text-violet-400 font-mono text-xs">{p.price.toLocaleString()} FCFA</span>
                                )}
                                <span className={`font-semibold text-[11px] shrink-0 ${isCritical ? 'text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded' : 'text-slate-400 bg-slate-900/40 px-1.5 py-0.5 rounded'}`}>
                                  Stock : {p.stock}
                                </span>
                              </div>
                            </div>

                            {/* REPLENISHMENT INPUT ACTION */}
                            <div className="mt-3 pt-3 space-y-1.5">
                              <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">
                                📦 Réapprovisionner (Entrée arrivage)
                              </label>
                              <div className="flex gap-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Qté à ajouter"
                                  id={`restock-input-${p.id}`}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 text-center font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const inputEl = document.getElementById(`restock-input-${p.id}`) as HTMLInputElement;
                                    const qty = inputEl?.value;
                                    if (!qty || Number(qty) <= 0) return;
                                    
                                    try {
                                      const res = await fetch(`/api/products/${p.id}/restock`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ quantity: Number(qty) })
                                      });
                                      if (res.ok) {
                                        if (inputEl) inputEl.value = '';
                                        setFormSuccess(`Le stock physique de "${p.title}" a été réapprovisionné de +${qty} !`);
                                        onRefreshState();
                                      } else {
                                        setFormError('Rupture de communication API.');
                                      }
                                    } catch {
                                      setFormError('Erreur communication serveur.');
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 text-xs rounded-lg transition active:scale-95 text-center shrink-0 cursor-pointer"
                                >
                                  Valider
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* MODAL 1: ADD NEW AISLE / RAYON */}
            {showAddRayonModal && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto pt-14 pb-14">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative my-auto">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>➕ Créer un Nouveau Rayon</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Saisissez le nom, la description et l'image officielle pour le nouveau rayon.</p>
                  </div>

                  <div className="space-y-4 font-sans">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">Nom du rayon *</label>
                      <input
                        type="text"
                        placeholder="Ex: Épicerie fine, Fromagerie, Fruits exotiques..."
                        value={newRayonNameInput}
                        onChange={(e) => setNewRayonNameInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[11px] text-slate-400 mb-1 font-medium">Emoji</label>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="📦"
                          value={newRayonEmojiInput}
                          onChange={(e) => setNewRayonEmojiInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-center text-slate-200 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[11px] text-slate-400 mb-1 font-medium">Description abrégée</label>
                        <input
                          type="text"
                          placeholder="Ex: Fromages affinés locaux et beurres traditionnels..."
                          value={newRayonDescInput}
                          onChange={(e) => setNewRayonDescInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    {/* Image Selector for Rayon */}
                    <div className="space-y-2 border-t border-slate-900 pt-3">
                      <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">📷 Image du Rayon</label>
                      
                      {newRayonImgInput && (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                          <img src={newRayonImgInput} alt="Aperçu" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-slate-900/85 text-[8px] text-violet-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Aperçu</span>
                        </div>
                      )}

                      {/* Presets Grid */}
                      <div>
                        <span className="block text-[10px] text-slate-500 mb-1 font-sans">Sélectionner une photo thématique :</span>
                        <div className="flex space-x-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                          {[
                            { name: 'Épicerie', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600' },
                            { name: 'Ferme/Viandes', url: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=600' },
                            { name: 'Boissons', url: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=80&w=600' },
                            { name: 'Pâtisserie', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600' },
                            { name: 'Ménager/Beauté', url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=600' },
                            { name: 'Fruits frais', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600' }
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setNewRayonImgInput(preset.url)}
                              className={`flex-shrink-0 bg-slate-900 hover:bg-slate-800 p-1 rounded border flex flex-col items-center space-y-1 transition active:scale-95 ${newRayonImgInput === preset.url ? 'border-violet-500 bg-violet-950/20' : 'border-slate-800'}`}
                            >
                              <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded object-cover" />
                              <span className="text-[8px] truncate max-w-[45px] text-slate-350 font-sans">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* File Selector and URL string */}
                      <div className="space-y-1.5 font-sans">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                           <span>Importer un fichier image :</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setNewRayonImgInput(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-[10px] text-slate-405 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-violet-955 file:text-violet-300 hover:file:bg-violet-900 transition cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Ou entrez un lien URL d'image de rayon..."
                          value={newRayonImgInput && newRayonImgInput.startsWith('data:') ? '' : newRayonImgInput}
                          onChange={(e) => setNewRayonImgInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-350 placeholder-slate-650 focus:outline-none focus:border-violet-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddRayonModal(false)}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        disabled={formLoading}
                        onClick={async () => {
                          if (!newRayonNameInput.trim()) return;
                          
                          setFormLoading(true);
                          try {
                            const response = await fetch('/api/rayons/metadata', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                rayonName: newRayonNameInput.trim(),
                                desc: newRayonDescInput.trim() || undefined,
                                img: newRayonImgInput.trim() || undefined,
                                emoji: newRayonEmojiInput.trim() || undefined
                              })
                            });
                            
                            if (response.ok) {
                              setCustomRayons([...customRayons, newRayonNameInput.trim()]);
                              setFormSuccess(`Le rayon "${newRayonNameInput}" a été créé avec succès !`);
                              setShowAddRayonModal(false);
                              setNewRayonNameInput('');
                              setNewRayonDescInput('');
                              setNewRayonEmojiInput('📦');
                              setNewRayonImgInput('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600');
                              onRefreshState();
                            }
                          } catch (err) {
                            console.error("Erreur de création du rayon:", err);
                          } finally {
                            setFormLoading(false);
                          }
                        }}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 text-xs font-bold rounded-lg shadow cursor-pointer transition active:scale-95 disabled:opacity-50"
                      >
                        {formLoading ? "Création..." : "Créer le Rayon"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 2: ADD NEW PRODUCT INSIDE SECTOR */}
            {showAddProductModal && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto pt-14 pb-14">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative my-auto">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      {isMarche ? (
                        <>🎪 Ajouter un Produit à l'Étalage</>
                      ) : (
                        <>🛒 Ajouter un Produit au Rayon : <span className="text-violet-400">{selectedRayon}</span></>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Saisissez les caractéristiques pour référencer l'article.</p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!smProductName || !smProductPrice || !smProductStock) return;
                      
                      setFormLoading(true);
                      try {
                        const response = await fetch('/api/products', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sellerId: user.id,
                            title: smProductName,
                            description: smProductDesc || "Aucune description de l'article.",
                            price: Number(smProductPrice),
                            category: "Alimentation",
                            stock: Number(smProductStock),
                            unit: "unité",
                            rayon: selectedRayon,
                            imageUrl: smProductImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
                            images: smImagesList && smImagesList.length > 0 ? smImagesList : [smProductImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"]
                          })
                        });
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.error);

                        setFormSuccess(isMarche 
                          ? `L'article "${smProductName}" a bien été mis en vente sur votre étalage !`
                          : `L'article "${smProductName}" a bien été mis en vente au rayon ${selectedRayon} !`);
                        setSmProductName('');
                        setSmProductPrice('');
                        setSmProductStock('');
                        setSmProductDesc('');
                        setSmProductImage('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600');
                        setSmImagesList([]);
                        setShowAddProductModal(false);
                        onRefreshState();
                      } catch (err: any) {
                        alert(err.message);
                      } finally {
                        setFormLoading(false);
                      }
                    }} 
                    className="space-y-4 font-sans"
                  >
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">Nom du produit *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Paquet de Riz Parfumé 5kg, Jus de mangue..."
                        value={smProductName}
                        onChange={(e) => setSmProductName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">Prix de vente (FCFA) *</label>
                        <input
                          type="number"
                          required
                          placeholder="Ex: 3500"
                          value={smProductPrice}
                          onChange={(e) => setSmProductPrice(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">Quantité en stock *</label>
                        <input
                          type="number"
                          required
                          placeholder="Ex: 150"
                          value={smProductStock}
                          onChange={(e) => setSmProductStock(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">Description (Facultative)</label>
                      <textarea
                        rows={3}
                        placeholder="Ex: Provient de producteurs locaux africains, conditionné de façon responsable..."
                        value={smProductDesc}
                        onChange={(e) => setSmProductDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 resize-none font-sans"
                      />
                    </div>

                    {/* Image Options and gallery choice */}
                    <div className="space-y-2 border-t border-slate-900 pt-3">
                      <label className="block text-[11px] text-slate-405 font-bold uppercase tracking-wider">📷 Image du Produit</label>
                      
                      {smProductImage && (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                          <img src={smProductImage} alt="Aperçu" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-slate-900/85 text-[8px] text-violet-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Aperçu</span>
                        </div>
                      )}

                      {/* Presets Grid */}
                      <div>
                        <span className="block text-[10px] text-slate-500 mb-1.5 font-sans">Sélectionner une photo :</span>
                        <div className="flex space-x-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-850">
                          {[
                            { name: 'Épicerie', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600' },
                            { name: 'Lait & Beur', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600' },
                            { name: 'Soda', url: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=80&w=600' },
                            { name: 'Croissant', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600' },
                            { name: 'Détergent', url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=600' },
                            { name: 'Fruits', url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600' }
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSmProductImage(preset.url)}
                              className={`flex-shrink-0 bg-slate-900 hover:bg-slate-800 p-1 rounded border flex flex-col items-center space-y-1 transition active:scale-95 ${smProductImage === preset.url ? 'border-violet-500 bg-violet-950/20' : 'border-slate-800'}`}
                            >
                              <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded object-cover" />
                              <span className="text-[8px] truncate max-w-[45px] text-slate-300 font-sans">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* File Selector and paste link option */}
                      <div className="space-y-1.5 font-sans">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                           <span>Sélectionner une image locale :</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setSmProductImage(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-violet-955 file:text-violet-300 hover:file:bg-violet-900 transition cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Ou copier-coller un lien URL d'image valide..."
                          value={smProductImage && smProductImage.startsWith('data:') ? '' : smProductImage}
                          onChange={(e) => setSmProductImage(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono"
                        />
                      </div>

                      {/* Multi-Image Gallery Manager for Supermarket */}
                      <div className="space-y-2 border-t border-slate-900/60 pt-3">
                        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider font-sans">🖼️ Galerie d'images secondaires ({smImagesList.length})</label>
                        <p className="text-[10px] text-slate-500 font-sans">Importez ou configurez une image ci-dessus, puis ajoutez-la à la liste de photos :</p>
                        
                        <div className="flex gap-2 items-center flex-wrap pt-1 font-sans">
                          {smImagesList.map((img, idx) => (
                            <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shrink-0">
                              <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setSmImagesList(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-0.5 right-0.5 bg-red-650 hover:bg-red-600 text-[8px] text-white font-black w-4 h-4 rounded-full flex items-center justify-center transition"
                                title="Supprimer de la galerie"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (smProductImage && !smImagesList.includes(smProductImage)) {
                                setSmImagesList(prev => [...prev, smProductImage]);
                              }
                            }}
                            className="w-14 h-14 rounded-lg border border-dashed border-slate-800 hover:border-violet-500 bg-slate-900/50 hover:bg-slate-900 flex flex-col items-center justify-center text-[8.5px] text-violet-400 font-semibold transition"
                            title="Ajouter à la galerie"
                          >
                            <span className="text-sm font-bold leading-none">+ Galerie</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddProductModal(false)}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 text-xs font-bold rounded-lg shadow disabled:opacity-50 cursor-pointer transition active:scale-95"
                      >
                        {formLoading ? "Enregistrement..." : "Ajouter le produit"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL 3: EDIT RAYON DETAILS & IMAGE */}
            {showEditRayonModal && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto pt-14 pb-14">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fade-in relative my-auto">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider font-sans">
                      <span>✏️ Modifier le Rayon : {editingRayonName}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">Configurez les détails visuels ou renommez le rayon.</p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const cleanNewName = editRayonNameInput.trim();
                      if (!cleanNewName) return;
                      setFormLoading(true);
                      try {
                        let response;
                        if (cleanNewName !== editingRayonName) {
                          // Rename transaction
                          response = await fetch('/api/rayons/rename', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              sellerId: user.id,
                              oldRayonName: editingRayonName,
                              newRayonName: cleanNewName,
                              desc: editRayonDescInput.trim(),
                              img: editRayonImgInput.trim(),
                              emoji: editRayonEmojiInput.trim()
                            })
                          });
                          if (response.ok) {
                            if (customRayons.includes(editingRayonName)) {
                              setCustomRayons(customRayons.map(r => r === editingRayonName ? cleanNewName : r));
                            } else {
                              setCustomRayons([...customRayons, cleanNewName]);
                            }
                            setFormSuccess(`Le rayon a été renommé en "${cleanNewName}" avec succès !`);
                          }
                        } else {
                          // Base metadata update
                          response = await fetch('/api/rayons/metadata', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              rayonName: editingRayonName,
                              desc: editRayonDescInput.trim(),
                              img: editRayonImgInput.trim(),
                              emoji: editRayonEmojiInput.trim()
                            })
                          });
                          if (response.ok) {
                            setFormSuccess(`Le rayon "${editingRayonName}" a été mis à jour avec succès !`);
                          }
                        }

                        if (response && response.ok) {
                          setShowEditRayonModal(false);
                          onRefreshState();
                        } else {
                          const data = await response?.json();
                          alert(data?.error || "Une erreur est survenue lors de l'enregistrement.");
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Erreur de communication avec le serveur.");
                      } finally {
                        setFormLoading(false);
                      }
                    }}
                    className="space-y-4 font-sans"
                  >
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium font-sans">Nom affiché *</label>
                      <input
                        type="text"
                        required
                        value={editRayonNameInput}
                        onChange={(e) => setEditRayonNameInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-violet-500 font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-1 font-sans">
                        <label className="block text-[11px] text-slate-400 mb-1 font-medium">Emoji</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={editRayonEmojiInput}
                          onChange={(e) => setEditRayonEmojiInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-center text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                        />
                      </div>
                      <div className="col-span-3 font-sans">
                        <label className="block text-[11px] text-slate-400 mb-1 font-medium">Description</label>
                        <input
                          type="text"
                          value={editRayonDescInput}
                          onChange={(e) => setEditRayonDescInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                        />
                      </div>
                    </div>

                    {/* Image Selector */}
                    <div className="space-y-2 border-t border-slate-900 pt-3">
                      <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider font-sans">📷 Modifier l'image de couverture</label>
                      
                      {editRayonImgInput && (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                          <img src={editRayonImgInput} alt="Aperçu" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex space-x-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                        {[
                          { name: 'Épicerie', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Charcut.', url: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Boissons', url: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Boulang.', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Cosmét.', url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=600' }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditRayonImgInput(preset.url)}
                            className={`flex-shrink-0 bg-slate-900 hover:bg-slate-800 p-1 rounded border flex flex-col items-center space-y-1 transition active:scale-95 ${editRayonImgInput === preset.url ? 'border-violet-500 bg-violet-950/20' : 'border-slate-800'}`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded object-cover" />
                            <span className="text-[8px] truncate max-w-[45px] text-slate-350 font-sans">{preset.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1.5 font-sans">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setEditRayonImgInput(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-violet-955 file:text-violet-300 hover:file:bg-violet-900 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Lien URL d'image valide..."
                          value={editRayonImgInput && editRayonImgInput.startsWith('data:') ? '' : editRayonImgInput}
                          onChange={(e) => setEditRayonImgInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-850">
                      {deleteRayonConfirmName ? (
                        <div className="flex items-center gap-1.5 p-1.5 bg-red-950/20 border border-red-900/30 rounded-xl">
                          <span className="text-[10px] text-red-400 font-extrabold font-sans">Supprimer ?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              setFormLoading(true);
                              try {
                                const response = await fetch('/api/rayons/delete', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    sellerId: user.id,
                                    rayonName: editingRayonName
                                  })
                                });
                                if (response.ok) {
                                  setCustomRayons(customRayons.filter(r => r !== editingRayonName));
                                  setFormSuccess(`Le rayon "${editingRayonName}" a été supprimé !`);
                                  setShowEditRayonModal(false);
                                  setDeleteRayonConfirmName(null);
                                  onRefreshState();
                                } else {
                                  const data = await response.json();
                                  alert(data.error || "Une erreur est survenue lors de la suppression.");
                                }
                              } catch (err) {
                                console.error(err);
                                alert("Erreur de communication avec le serveur.");
                              } finally {
                                setFormLoading(false);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded cursor-pointer"
                          >
                            Oui
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteRayonConfirmName(null)}
                            className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-extrabold text-[10px] px-2.5 py-1 rounded cursor-pointer animate-pulse"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteRayonConfirmName(editingRayonName)}
                          disabled={formLoading}
                          className="text-red-405 hover:text-red-400 hover:bg-red-950/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          🗑️ Supprimer le rayon
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowEditRayonModal(false)}
                          className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 text-xs font-bold rounded-lg shadow disabled:opacity-50 transition active:scale-95 cursor-pointer"
                        >
                          {formLoading ? "Enregistrement..." : "Enregistrer"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL 4: EDIT PRODUCT DETAILS & IMAGE */}
            {showEditProductModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 overflow-y-auto flex items-start justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fade-in my-8 text-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider font-sans">
                      <span>✏️ Modifier le produit</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">Modifiez les caractéristiques et l'image de ce produit.</p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!editingProduct || !editProductName || !editProductPrice || !editProductStock) return;
                      setFormLoading(true);
                      try {
                        let promoDiscountValue: number | null = null;
                        let promoEndValue: string | null = null;
                        const discountNum = Number(editProductPromoDiscount);
                        if (discountNum > 0 && discountNum <= 99) {
                          promoDiscountValue = discountNum;
                          const val = Number(editProductPromoDuration) || 30;
                          let extraMs = 0;
                          if (editProductPromoUnit === 'minutes') {
                            extraMs = val * 60 * 1000;
                          } else if (editProductPromoUnit === 'heures') {
                            extraMs = val * 60 * 60 * 1000;
                          } else if (editProductPromoUnit === 'jours') {
                            extraMs = val * 24 * 60 * 60 * 1000;
                          }
                          promoEndValue = new Date(Date.now() + extraMs).toISOString();
                        }

                        const response = await fetch(`/api/products/${editingProduct.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title: editProductName,
                            description: editProductDesc,
                            price: Number(editProductPrice),
                            stock: Number(editProductStock),
                            imageUrl: editProductImage,
                            images: editImagesList && editImagesList.length > 0 ? editImagesList : [editProductImage],
                            promotionDiscount: promoDiscountValue,
                            promotionEnd: promoEndValue
                          })
                        });
                        
                        if (response.ok) {
                          setFormSuccess(`L'article "${editProductName}" a été mis à jour avec succès !`);
                          setShowEditProductModal(false);
                          setEditingProduct(null);
                          setEditImagesList([]);
                          onRefreshState();
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setFormLoading(false);
                      }
                    }}
                    className="space-y-4 font-sans"
                  >
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1.5 font-medium font-sans">Nom du produit *</label>
                      <input
                        type="text"
                        required
                        value={editProductName}
                        onChange={(e) => setEditProductName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1.5 font-medium font-sans">Prix (FCFA) *</label>
                        <input
                          type="number"
                          required
                          value={editProductPrice}
                          onChange={(e) => setEditProductPrice(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1.5 font-medium font-sans">Stock physique *</label>
                        <input
                          type="number"
                          required
                          value={editProductStock}
                          onChange={(e) => setEditProductStock(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1.5 font-medium font-sans">Description</label>
                      <textarea
                        rows={2}
                        value={editProductDesc}
                        onChange={(e) => setEditProductDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 resize-none font-sans focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* Promotion Section */}
                    <div className="space-y-3.5 border-t border-slate-905 pt-3 mb-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider font-sans">🏷️ Promotion & Réduction</label>
                        {editingProduct?.promotionEnd && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900 font-mono">
                            Promo active
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-sans font-medium">Réduction (%)</label>
                           <input
                             type="number"
                             min="0"
                             max="99"
                             placeholder="Ex: 15 (vide pour aucune)"
                             value={editProductPromoDiscount}
                             onChange={(e) => {
                               const val = e.target.value;
                               if (val === '' || (Number(val) >= 0 && Number(val) <= 99)) {
                                 setEditProductPromoDiscount(val);
                               }
                             }}
                             className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                           />
                         </div>

                         <div>
                           <label className="block text-[11px] text-slate-350 mb-1 font-sans font-medium">Prix après réduction</label>
                           <div className="w-full bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono h-9 flex items-center shadow-inner">
                             {Number(editProductPromoDiscount) > 0 && Number(editProductPromoDiscount) <= 99 ? (
                               <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                 {Math.round((Number(editProductPrice) || 0) * (1 - Number(editProductPromoDiscount) / 100)).toLocaleString()} FCFA
                                 <span className="text-[10px] text-slate-500 font-normal">(-{editProductPromoDiscount}%)</span>
                               </span>
                             ) : (
                               <span className="text-slate-500 italic text-[11px]">Aucun changement</span>
                             )}
                           </div>
                         </div>
                       </div>

                       {Number(editProductPromoDiscount) > 0 && (
                         <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl space-y-2 animate-fade-in">
                           <span className="text-[10px] text-slate-400 block font-sans font-medium">⏳ Durée de validité de cette promotion :</span>
                           <div className="grid grid-cols-2 gap-2">
                             <input
                               type="number"
                               min="1"
                               required={Number(editProductPromoDiscount) > 0}
                               value={editProductPromoDuration}
                               onChange={(e) => setEditProductPromoDuration(e.target.value)}
                               className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                             />
                             <select
                               value={editProductPromoUnit}
                               onChange={(e) => setEditProductPromoUnit(e.target.value as any)}
                               className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                             >
                               <option value="minutes">Minutes</option>
                               <option value="heures">Heures</option>
                               <option value="jours">Jours</option>
                             </select>
                           </div>
                           <span className="text-[9.5px] text-slate-550 block leading-tight">
                             La promotion prendra fin automatiquement et le prix d'origine sera rétabli.
                           </span>
                         </div>
                       )}
                    </div>

                    {/* Image Options */}
                    <div className="space-y-2 border-t border-slate-900 pt-3">
                      <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider font-sans">📷 Modifier l'image du produit</label>
                      
                      {editProductImage && (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                          <img src={editProductImage} alt="Aperçu" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex space-x-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                        {[
                          { name: 'Épicerie', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Lait/Beurre', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Boissons', url: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Pâtisserie', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Propreté', url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=600' },
                          { name: 'Fruits', url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600' }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditProductImage(preset.url)}
                            className={`flex-shrink-0 bg-slate-900 hover:bg-slate-800 p-1 rounded border flex flex-col items-center space-y-1 transition active:scale-95 ${editProductImage === preset.url ? 'border-violet-500 bg-violet-950/20' : 'border-slate-800'}`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded object-cover" />
                            <span className="text-[8px] truncate max-w-[45px] text-slate-350 font-sans">{preset.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1.5 font-sans">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setEditProductImage(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-violet-955 file:text-violet-300 hover:file:bg-violet-900 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Lien URL de l'image..."
                          value={editProductImage && editProductImage.startsWith('data:') ? '' : editProductImage}
                          onChange={(e) => setEditProductImage(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 placeholder-slate-650 focus:outline-none focus:border-violet-500 font-mono"
                        />
                      </div>

                      {/* Multi-Image Gallery Manager */}
                      <div className="space-y-2 border-t border-slate-900/60 pt-3">
                        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider font-sans">🖼️ Galerie d'images secondaires ({editImagesList.length})</label>
                        <p className="text-[10px] text-slate-500 font-sans">Importez ou configurez une image ci-dessus, puis ajoutez-la à la liste de photos :</p>
                        
                        <div className="flex gap-2 items-center flex-wrap pt-1">
                          {editImagesList.map((img, idx) => (
                            <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shrink-0">
                              <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setEditImagesList(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-500 text-[8px] text-white font-black w-4 h-4 rounded-full flex items-center justify-center transition"
                                title="Supprimer de la galerie"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (editProductImage && !editImagesList.includes(editProductImage)) {
                                setEditImagesList(prev => [...prev, editProductImage]);
                              }
                            }}
                            className="w-14 h-14 rounded-lg border border-dashed border-slate-800 hover:border-violet-500 bg-slate-900/50 hover:bg-slate-900 flex flex-col items-center justify-center text-[8.5px] text-violet-400 font-semibold transition"
                            title="Ajouter à la galerie"
                          >
                            <span className="text-sm font-bold leading-none">+ Galerie</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditProductModal(false);
                          setEditingProduct(null);
                        }}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 text-xs font-bold rounded-lg shadow disabled:opacity-50 transition active:scale-95 cursor-pointer"
                      >
                        {formLoading ? "Mise à jour..." : "Mettre à jour"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: TEAM/CATALOG PROMOTIONS & FLASH SALES */}
        {activeTab === 'promotions' && (
          <div id="business-promotions-tab" className="space-y-6 animate-fade-in text-slate-100">
            {/* Tab Header */}
            <div className="border-b border-slate-800/60 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                <span>🏷️ Centre de Promotions & Ventes Flash</span>
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                Simulez l'effet de rareté (FOMO) et boostez vos ventes immédiates en créant un sentiment d'urgence avec des comptes à rebours marketing visibles par vos clients. Vous pouvez appliquer des promotions en masse sur tout un rayon ou configurer des offres flash unitaires.
              </p>
            </div>

            {/* Error & Success Feeds */}
            {formSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                <p>{formSuccess}</p>
              </div>
            )}
            {formError && (
              <div className="bg-red-950/40 border border-red-900/60 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <p>{formError}</p>
              </div>
            )}

            {/* Grid for Promotion Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Rayon Bulk Promoter */}
              <div className="lg:col-span-5 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center space-x-2 text-rose-450 pb-2 border-b border-slate-900/60">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider">⚡ Promotion de Rayon en 1-Clic</h2>
                </div>
                
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Appliquez instantanément un pourcentage de réduction à tous les produits d'un rayon de votre boutique.
                </p>

                <div className="space-y-3">
                  {/* Select Rayon */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                      Sélectionner le Rayon
                    </label>
                    <select
                      value={bulkPromoRayon}
                      onChange={(e) => setBulkPromoRayon(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-600 transition"
                    >
                      <option value="all">Tous les rayons (Catalogue complet)</option>
                      {Array.from(new Set(myProducts.map(p => p.rayon).filter(Boolean))).map((ray) => (
                        <option key={ray} value={ray}>{ray}</option>
                      ))}
                    </select>
                  </div>

                  {/* Percentage Input */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                      Pourcentage de Réduction
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Ex: 20"
                        min="1"
                        max="99"
                        value={bulkPromoDiscount}
                        onChange={(e) => setBulkPromoDiscount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-200 outline-none focus:border-violet-600 transition font-bold"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-bold">%</span>
                    </div>
                    {/* Quick percentage badges */}
                    <div className="flex gap-1.5 mt-1.5">
                      {['10', '15', '20', '30', '40', '50'].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setBulkPromoDiscount(pct)}
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded transition ${bulkPromoDiscount === pct ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration input */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                      Durée de validité
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Ex: 30"
                        value={bulkPromoDuration}
                        onChange={(e) => setBulkPromoDuration(e.target.value)}
                        className="w-2/3 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-600 transition font-mono"
                      />
                      <select
                        value={bulkPromoUnit}
                        onChange={(e: any) => setBulkPromoUnit(e.target.value)}
                        className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-200 outline-none focus:border-violet-600 transition"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="heures">Heures</option>
                        <option value="jours">Jours</option>
                      </select>
                    </div>
                    {/* Quick duration buttons */}
                    <div className="flex gap-1.5 mt-1.5">
                      {['30 minutes', '1 heure', '3 heures', '24 heures'].map((lbl) => {
                        let val = '30';
                        let unt: 'minutes' | 'heures' | 'jours' = 'minutes';
                        if (lbl === '1 heure') { val = '1'; unt = 'heures'; }
                        if (lbl === '3 heures') { val = '3'; unt = 'heures'; }
                        if (lbl === '24 heures') { val = '24'; unt = 'heures'; }

                        const isSelected = bulkPromoDuration === val && bulkPromoUnit === unt;
                        return (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => { setBulkPromoDuration(val); setBulkPromoUnit(unt); }}
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded transition ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={bulkPromoLoading}
                    onClick={() => handleApplyBulkPromo(false)}
                    className="flex-grow bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 animate-bounce" />
                    <span>{bulkPromoLoading ? 'Envoi...' : 'Activer la Vente Flash'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={bulkPromoLoading}
                    onClick={() => handleApplyBulkPromo(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs py-2.5 px-3.5 rounded-xl border border-slate-800 hover:border-slate-750 font-bold transition cursor-pointer"
                    title="Désactiver toutes les promotions de ce rayon"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* Right Column: Promotional status summary */}
              <div className="lg:col-span-7 bg-slate-950/30 border border-slate-800/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center space-x-2 text-violet-400 pb-2 border-b border-slate-900/60">
                  <Percent className="w-4 h-4 text-violet-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider">📋 État général de vos promotions</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/55 border border-slate-800/80 p-3.5 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total articles</span>
                    <p className="text-2xl font-black text-slate-100">{myProducts.length}</p>
                  </div>
                  <div className="bg-rose-950/20 border border-rose-900/40 p-3.5 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">En Promo Actuelle</span>
                    <p className="text-2xl font-black text-rose-450 animate-pulse">
                      {myProducts.filter(p => p.promotionDiscount && p.promotionEnd && new Date(p.promotionEnd) > new Date()).length}
                    </p>
                  </div>
                </div>

                {/* List of active promotions */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Ventes Flash Actives
                  </span>
                  {myProducts.filter(p => p.promotionDiscount && p.promotionEnd && new Date(p.promotionEnd) > new Date()).length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-800/80 rounded-xl text-[11px] text-slate-450 bg-slate-950/20">
                      Aucune promotion n'est active actuellement. Lisez vos fiches ci-dessous ou appliquez une promo groupée.
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {myProducts
                        .filter(p => p.promotionDiscount && p.promotionEnd && new Date(p.promotionEnd) > new Date())
                        .map((p) => (
                          <div key={p.id} className="flex items-center justify-between bg-slate-900/40 border border-slate-850 p-2 rounded-lg text-xs">
                            <div className="flex items-center gap-2 truncate max-w-[180px]">
                              <span className="bg-rose-900 text-rose-200 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                                -{p.promotionDiscount}%
                              </span>
                              <span className="font-medium text-slate-200 truncate">{p.title}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {p.promotionEnd && (
                                <CountdownTimer expiryDate={p.promotionEnd} className="text-[9px]" />
                              )}
                              <button
                                type="button"
                                onClick={() => handleApplyQuickPromo(p.id, true)}
                                className="text-slate-550 hover:text-red-400 text-[10px] font-bold p-0.5 cursor-pointer underline"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Individual Product Promotion configuration block */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">
                    Configuration Individuelle des Articles
                  </h3>
                  <p className="text-[11px] text-slate-450">
                    Choisissez précisément l'article que vous souhaitez mettre en promotion ci-dessous.
                  </p>
                </div>
              </div>

              {myProducts.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400">Vous n'avez aucun article ou produit enregistré.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myProducts.map((p) => {
                    const hasPromo = p.promotionDiscount && p.promotionEnd && new Date(p.promotionEnd) > new Date();
                    const isQuickPromoOpen = quickPromoProductId === p.id;
                    const stockWarn = p.stock <= 5;

                    return (
                      <div
                        key={p.id}
                        className={`bg-slate-950/40 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 ${hasPromo ? 'border-rose-500/50 shadow-md shadow-rose-950/20 hover:border-rose-500 bg-rose-950/5' : 'border-slate-800/80 hover:border-slate-705'}`}
                      >
                        <div className="space-y-3">
                          {p.imageUrl && (
                            <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-800/60 relative">
                              <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              {hasPromo ? (
                                <span className="absolute top-2 left-2 bg-rose-600 text-white font-black text-[10.5px] px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                                  -{p.promotionDiscount}% FLASH
                                </span>
                              ) : (
                                <span className="absolute top-2 left-2 bg-slate-900/85 text-[9.5px] text-slate-400 px-2 py-0.5 rounded-full border border-slate-800">
                                  {p.rayon || "Catalogue"}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-slate-100 line-clamp-1" title={p.title}>{p.title}</h4>
                            <p className="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed min-h-[30px]">
                              {p.description || "Aucune description fournie pour cet article."}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-900/50">
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase font-semibold block">Prix</span>
                              {hasPromo ? (
                                <div className="flex flex-col">
                                  <span className="font-bold text-rose-400 text-xs">
                                    {(p.price * (1 - p.promotionDiscount! / 100)).toLocaleString()} F
                                  </span>
                                  <span className="text-[9.5px] line-through text-slate-500">
                                    {p.price.toLocaleString()} F
                                  </span>
                                </div>
                              ) : (
                                <span className="font-bold text-slate-200">
                                  {p.price.toLocaleString()} F
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-500 uppercase font-semibold block">Stock</span>
                              <span className={`font-mono font-bold ${stockWarn ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                                {p.stock} {p.unit || 'unités'}
                              </span>
                            </div>
                          </div>

                          {/* Countdown block inside card */}
                          {hasPromo && p.promotionEnd && (
                            <div className="bg-rose-950/20 border border-rose-900/30 p-2 rounded-xl flex items-center justify-between text-xs">
                              <span className="text-[10px] text-rose-450 font-bold font-sans">Fin de l'offre :</span>
                              <CountdownTimer expiryDate={p.promotionEnd} className="text-[10px] font-bold text-rose-450" />
                            </div>
                          )}

                          {/* Inline setting block */}
                          {isQuickPromoOpen && (
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-3.5 mt-2 animate-fade-in text-slate-200">
                              <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                                <span className="text-[9.5px] font-bold text-amber-500 uppercase flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-400" /> Paramétrer la Vente Flash
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQuickPromoProductId(null)}
                                  className="text-slate-400 hover:text-white font-bold text-xs"
                                >
                                  ×
                                </button>
                              </div>

                              <div className="space-y-2.5">
                                <div>
                                  <label className="block text-[9.5px] text-slate-400 font-semibold mb-1">Pourcentage de réduction (%)</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="1"
                                      max="99"
                                      placeholder="Ex: 25"
                                      value={quickPromoDiscount}
                                      onChange={(e) => setQuickPromoDiscount(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-2 pr-7 py-1 text-xs text-slate-200 outline-none focus:border-rose-600 transition font-bold"
                                    />
                                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-bold">%</span>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[9.5px] text-slate-400 font-semibold mb-1">Durée et unités</label>
                                  <div className="flex gap-1.5 font-sans">
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder="Ex: 45"
                                      value={quickPromoDuration}
                                      onChange={(e) => setQuickPromoDuration(e.target.value)}
                                      className="w-1/2 bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-rose-600 transition"
                                    />
                                    <select
                                      value={quickPromoUnit}
                                      onChange={(e: any) => setQuickPromoUnit(e.target.value)}
                                      className="w-1/2 bg-slate-950 border border-slate-850 rounded-lg px-1.5 py-1 text-[11px] text-slate-200 outline-none focus:border-rose-600 transition"
                                    >
                                      <option value="minutes">Min</option>
                                      <option value="heures">Heures</option>
                                      <option value="jours">Jours</option>
                                    </select>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleApplyQuickPromo(p.id, false)}
                                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] py-1.5 rounded-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Flame className="w-3 h-3" />
                                  <span>Lancer la Vente Flash</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions block at bottom of card */}
                        <div className="pt-4 mt-auto">
                          {!isQuickPromoOpen && (
                            <div className="flex items-center gap-1.5">
                              {hasPromo ? (
                                <button
                                  type="button"
                                  onClick={() => handleApplyQuickPromo(p.id, true)}
                                  className="w-full bg-slate-900 hover:bg-slate-850 text-rose-450 border border-slate-800 hover:border-slate-750 font-bold text-[11px] py-2 rounded-xl transition cursor-pointer"
                                >
                                  ❌ Arrêter la Promo
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickPromoProductId(p.id);
                                    setQuickPromoDiscount('20');
                                    setQuickPromoDuration('60');
                                    setQuickPromoUnit('minutes');
                                  }}
                                  className="w-full bg-slate-900 border border-slate-800 hover:border-violet-600 hover:text-white text-slate-400 font-bold text-[11px] py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  🏷️ Promo / Vente Flash
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: MANAGE INVENTORY / PRODUCT */}
        {activeTab === 'inventory' && (
          <div id="business-inventory-tab" className="space-y-6">
            <div className="border-b border-slate-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                  <LayoutDashboard className="w-5 h-5 text-violet-400" />
                  <span>{user.enterpriseType === 'restaurant' ? "🍳 Mon Menu (Plats, Boissons & Mets)" : "Mon Inventaire Produit / Service"}</span>
                </h1>
                <p className="text-xs text-slate-400">
                  {user.enterpriseType === 'restaurant' 
                    ? "Ajoutez les délicieux plats, boissons ou formules de votre restaurant visibles par l'ensemble des clients." 
                    : "Ajoutez des produits physiques ou services locaux de proximité visibles uniquement des acheteurs clients."}
                </p>
              </div>
            </div>

            {/* Grid system splitting layout: Left = Form add, Right = inventory list */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Product Listing Form */}
              <div className="md:col-span-4 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 mb-4 flex items-center space-x-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-violet-400" />
                  <span>Nouveau produit</span>
                </h3>
                
                <form onSubmit={handleAddProduct} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nom du produit / service *</label>
                    <input
                      id="new-product-title"
                      type="text"
                      placeholder="ex: Plat de poisson braisé"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Prix de vente (FCFA) *</label>
                    <input
                      id="new-product-price"
                      type="number"
                      placeholder="4000"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Quantité Stock *</label>
                      <input
                        id="new-product-stock"
                        type="number"
                        placeholder="50"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Unité</label>
                      <input
                        id="new-product-unit"
                        type="text"
                        placeholder="portion, kg, litre"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Catégorie du Catalogue</label>
                    <select
                      id="new-product-category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="Repas">🍳 Repas préparé</option>
                      <option value="Alimentation">🍎 Epicerie / Aliments</option>
                      <option value="Légumes">🍍 Fruits & Légumes</option>
                      <option value="Hébergement">🏨 Services hôteliers</option>
                      <option value="Bureautique">💻 Informatique & Saisie</option>
                      <option value="Entretien">🧼 Entretien habitation</option>
                    </select>
                  </div>

                  {user.enterpriseType === 'supermarche' && (() => {
                    const existingRayons = Array.from(new Set([
                      ...myProducts.map(p => p.rayon).filter(Boolean),
                      ...customRayons
                    ]));
                    const forceCreateNew = existingRayons.length === 0;

                    return (
                      <div className="bg-slate-950/40 p-3.5 border border-slate-850 rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-violet-400 font-bold uppercase tracking-wide">Rayon / Linéaire du Supermarché</span>
                          {!forceCreateNew && (
                            <button
                              type="button"
                              onClick={() => setIsCreatingNewRayon(!isCreatingNewRayon)}
                              className="text-[10px] text-indigo-400 font-bold underline cursor-pointer hover:text-indigo-300"
                            >
                              {isCreatingNewRayon ? "← Choisir existant" : "+ Créer nouveau rayon"}
                            </button>
                          )}
                        </div>

                        {(isCreatingNewRayon || forceCreateNew) ? (
                          <div>
                            <input
                              type="text"
                              placeholder="Ex: Épicerie fine, Produits frais..."
                              value={customRayonName}
                              onChange={(e) => setCustomRayonName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                            />
                            <p className="text-[9px] text-slate-500 mt-1">Saisissez un rayon personnalisé pour classer les articles de votre supermarché.</p>
                          </div>
                        ) : (
                          <div>
                            <select
                              value={newRayon}
                              onChange={(e) => setNewRayon(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-855 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                            >
                              {existingRayons.map((ray) => (
                                <option key={ray} value={ray}>{ray}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Description</label>
                    <textarea
                      id="new-product-desc"
                      rows={2}
                      placeholder="Description soignée du produit..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-855 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
                    />
                  </div>

                  {/* Image Options and Upload */}
                  <div className="space-y-2 border-t border-slate-900 pt-3">
                    <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">📷 Image du Produit</label>
                    
                    {/* Image Preview Window */}
                    {newImageUrl && (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                        <img src={newImageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-slate-900/85 text-[8px] text-violet-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Aperçu</span>
                      </div>
                    )}

                    {/* Presets Horizontal Scroll */}
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-1">Choisir un modèle de notre galerie :</span>
                      <div className="flex space-x-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                        {[
                          { name: '🍳 Repas', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600' },
                          { name: '🐟 Poisson', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600' },
                          { name: '🍎 Fruits', url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600' },
                          { name: '🥛 Lait', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600' },
                          { name: '🧼 Lessive', url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=600' },
                          { name: '🪵 Bois', url: 'https://images.unsplash.com/photo-1616627547024-42e12e1ec11b?auto=format&fit=crop&q=80&w=600' },
                          { name: '🌾 Récolte', url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600' },
                          { name: '🏨 Hôtel', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600' }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewImageUrl(preset.url)}
                            className="flex-shrink-0 bg-slate-900 hover:bg-slate-850 p-1 rounded-md text-[9px] text-slate-300 border border-slate-800 flex flex-col items-center space-y-1 transition active:scale-95"
                          >
                            <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded object-cover" />
                            <span className="truncate max-w-[45px]">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Direct File Selector and URL input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>ou importer de votre galerie :</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setNewImageUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[10px] text-slate-505 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-violet-950 file:text-violet-300 hover:file:bg-violet-900 transition cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="Lien URL de l'image..."
                        value={newImageUrl.startsWith('data:') ? '' : newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* Multi-Image Gallery Manager for Common Products */}
                    <div className="space-y-2 border-t border-slate-900/60 pt-3">
                      <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider font-sans">🖼️ Galerie d'images secondaires ({newImagesList.length})</label>
                      <p className="text-[10px] text-slate-500 font-sans">Importez ou configurez une image ci-dessus, puis ajoutez-la à la liste de photos :</p>
                      
                      <div className="flex gap-2 items-center flex-wrap pt-1 font-sans">
                        {newImagesList.map((img, idx) => (
                          <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shrink-0">
                            <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNewImagesList(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-0.5 right-0.5 bg-red-650 hover:bg-red-600 text-[8px] text-white font-black w-4 h-4 rounded-full flex items-center justify-center transition"
                              title="Supprimer de la galerie"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (newImageUrl && !newImagesList.includes(newImageUrl)) {
                              setNewImagesList(prev => [...prev, newImageUrl]);
                            }
                          }}
                          className="w-14 h-14 rounded-lg border border-dashed border-slate-800 hover:border-violet-500 bg-slate-900/50 hover:bg-slate-900 flex flex-col items-center justify-center text-[8.5px] text-violet-400 font-semibold transition"
                          title="Ajouter à la galerie"
                        >
                          <span className="text-sm font-bold leading-none">+ Galerie</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    id="add-product-submit"
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-2 bg-violet-600 hover:bg-violet-500 transition text-white font-semibold rounded-lg text-xs"
                  >
                    {formLoading ? 'Création...' : 'Mettre en vente'}
                  </button>
                </form>
              </div>

              {/* My products inventory grid */}
              <div className="md:col-span-8 space-y-3">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Mon inventaire actif ({myProducts.length})</span>
                
                {myProducts.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                    Vous n'avez aucun produit enregistré. Ajoutez-en un à l'aide du formulaire.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myProducts.map((p) => (
                      <div id={`my-prod-${p.id}`} key={p.id} className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-800 transition">
                        <div>
                          {p.imageUrl && (
                            <div className="w-full h-24 rounded-lg overflow-hidden mb-2.5 bg-slate-900 border border-slate-850/80">
                              <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <h4 className="font-bold text-xs text-slate-200 truncate">{p.title}</h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(p);
                                  setEditProductName(p.title);
                                  setEditProductDesc(p.description || '');
                                  setEditProductPrice(String(p.price));
                                  setEditProductStock(String(p.stock));
                                  setEditProductImage(p.imageUrl || '');
                                  setEditImagesList(p.images && p.images.length ? [...p.images] : [p.imageUrl || '']);
                                  setEditProductPromoDiscount(p.promotionDiscount ? String(p.promotionDiscount) : '');
                                  setEditProductPromoDuration('30');
                                  setEditProductPromoUnit('minutes');
                                  setShowEditProductModal(true);
                                }}
                                className="text-slate-500 hover:text-violet-400 p-1 rounded-md transition cursor-pointer"
                                title="Modifier ce produit"
                              >
                                ✏️
                              </button>
                              <button
                                id={`delete-prod-btn-${p.id}`}
                                onClick={() => handleDeleteProduct(p.id)}
                                className="text-slate-500 hover:text-red-400 p-1 rounded-md transition shrink-0 cursor-pointer"
                                title="Retirer ce produit"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <span className="text-[10px] text-violet-400 bg-violet-950/35 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">{p.category}</span>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5 line-clamp-2">{p.description}</p>
                        </div>
                        
                        <div className="border-t border-slate-900 mt-2.5 pt-2 flex items-center justify-between">
                          {p.promotionDiscount && p.promotionEnd && new Date(p.promotionEnd) > new Date() ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-emerald-400 font-mono">
                                  {Math.round(p.price * (1 - p.promotionDiscount / 100)).toLocaleString()} FCFA
                                </span>
                                <span className="text-[10px] text-slate-500 line-through font-mono">
                                  {p.price.toLocaleString()} FCFA
                                </span>
                              </div>
                              <div className="mt-0.5">
                                <CountdownTimer expiryDate={p.promotionEnd} onExpired={onRefreshState} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-300 font-mono">{p.price.toLocaleString()} FCFA</span>
                          )}
                          <span className="text-[10px] text-slate-500 font-medium">Stock : {p.stock} ({p.unit})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: POST A JOB */}
        {activeTab === 'recruitment' && (
          <div id="business-recruitment-tab" className="space-y-6">
            <div className="border-b border-slate-800/60 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-violet-400" />
                <span>Publier une Offre d'Emploi de Proximité</span>
              </h1>
              <p className="text-xs text-slate-400">Publiez des opportunités d'emploi qui seront exclusivement présentées et réservées aux utilisateurs "Clients".</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Form poster */}
              <div className="md:col-span-5 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 mb-3.5 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  <span>Nouvel Appel d'Emploi</span>
                </h3>

                <form onSubmit={handlePostJob} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Intitulé du poste *</label>
                    <input
                      id="new-job-title"
                      type="text"
                      placeholder="ex: Commis de Cuisine Adjoint"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Salaire proposé *</label>
                    <input
                      id="new-job-salary"
                      type="text"
                      placeholder="ex: 180,000 FCFA / mois"
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Lieu du poste / Ville</label>
                    <input
                      id="new-job-location"
                      type="text"
                      placeholder="Dakar, Bamako, etc."
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Ajouter des Qualifications</label>
                    <div className="flex gap-1.5">
                      <input
                        id="new-job-req-input"
                        type="text"
                        placeholder="ex: Bilingue"
                        value={jobRequirement}
                        onChange={(e) => setJobRequirement(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                      />
                      <button
                        id="new-job-add-req-btn"
                        type="button"
                        onClick={addRequirement}
                        className="bg-violet-900 hover:bg-violet-850 text-white font-semibold px-2.5 py-1 text-xs rounded-lg"
                      >
                        +
                      </button>
                    </div>
                    {/* Temp list */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {jobReqs.map((r, i) => (
                        <span key={i} className="bg-slate-950 text-slate-350 text-[10px] px-2 py-0.5 rounded border border-slate-850 flex items-center gap-1">
                          {r}
                          <button type="button" onClick={() => setJobReqs(jobReqs.filter((_, idx) => idx !== i))} className="text-red-400 text-[9px] ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Missions et descriptif *</label>
                    <textarea
                      id="new-job-desc"
                      rows={3}
                      placeholder="Quelles sont les responsabilités attachées à ce poste ?"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500 resize-none"
                      required
                    />
                  </div>

                  <button
                    id="post-job-submit"
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-2 bg-violet-600 hover:bg-violet-500 transition text-white font-semibold rounded-lg text-xs"
                  >
                    {formLoading ? 'Création...' : "Publier l'offre d'emploi informatique"}
                  </button>
                </form>
              </div>

              {/* Tabbed Recruitment Panel */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex border-b border-slate-800 pb-1">
                  <button
                    type="button"
                    onClick={() => setRecruitmentSubTab('offers')}
                    className={`pb-2.5 px-4 text-xs font-semibold uppercase tracking-wider relative transition duration-200 ${recruitmentSubTab === 'offers' ? 'text-violet-400 border-b-2 border-violet-500 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Offres Publiées ({myJobs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecruitmentSubTab('applications')}
                    className={`pb-2.5 px-4 text-xs font-semibold uppercase tracking-wider relative transition duration-200 flex items-center space-x-1.5 ${recruitmentSubTab === 'applications' ? 'text-violet-400 border-b-2 border-violet-500 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    <span>Candidatures Reçues</span>
                    {myReceivedApps.length > 0 ? (
                      <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                        {myReceivedApps.length}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">(0)</span>
                    )}
                  </button>
                </div>

                {recruitmentSubTab === 'offers' ? (
                  <div className="space-y-3.5">
                    {myJobs.length === 0 ? (
                      <div className="text-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                        Aucune offre d'emploi n'a été publiée à ce jour. Remplissez le formulaire de gauche pour démarrer vos recrutements !
                      </div>
                    ) : (
                      myJobs.map((j) => (
                        <div id={`my-job-card-${j.id}`} key={j.id} className="bg-slate-950/40 border border-slate-850 rounded-xl p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-slate-200">{j.title}</h4>
                              <span className="text-[10px] text-slate-500">{j.location} • Salaire : {j.salary}</span>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                                ID: {j.id}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteJob(j.id)}
                                className="p-1 hover:bg-red-950/45 rounded-lg text-slate-500 hover:text-red-450 transition cursor-pointer"
                                title="Supprimer cette offre d'emploi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed mt-2.5">{j.description}</p>
                          <div className="mt-3">
                            <span className="text-[10px] text-slate-500 font-semibold block">Qualifications requises :</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {j.requirements.map((r, idx) => (
                                <span key={idx} className="bg-slate-950 text-slate-400 border border-slate-900 text-[9px] px-2 py-0.5 rounded">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Received candidate applications list
                  <div className="space-y-3">
                    {myReceivedApps.length === 0 ? (
                      <div className="text-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                        Aucune candidature reçue pour l'instant. Dès qu'un client postule, son CV et ses coordonnées apparaîtront ici en temps réel.
                      </div>
                    ) : (
                      myReceivedApps.map((app) => (
                        <div id={`app-ticket-${app.id}`} key={app.id} className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 hover:border-slate-800 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                              <h4 className="font-extrabold text-slate-200 text-sm">{app.clientName}</h4>
                              <span className="text-[9px] text-indigo-400 bg-indigo-950 font-bold px-2 py-0.5 rounded border border-indigo-900/40">
                                {app.cvType === 'file' ? 'CV Importé' : 'CV en ligne'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-300">
                              Postule au poste de : <strong className="text-violet-400 font-bold">{app.jobTitle}</strong>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-slate-600" /> {app.clientEmail}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-600" /> {app.clientPhone}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                            <span className="text-[10px] text-slate-500 font-mono">{app.appliedAt}</span>
                            <div className="flex items-center space-x-2">
                              {app.status === 'accepted' ? (
                                <span className="bg-emerald-950/45 text-emerald-400 border border-emerald-900/50 text-[10px] uppercase font-bold px-2.5 py-1.5 rounded-xl flex items-center space-x-1 shrink-0">
                                  <span>✓ Candidature Validée</span>
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptApplication(app.id)}
                                    className="bg-emerald-950/45 hover:bg-emerald-600 border border-emerald-900/40 text-emerald-350 hover:text-white font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer mr-2"
                                  >
                                    Valider
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectApplication(app.id)}
                                    className="bg-red-950/40 hover:bg-red-905 border border-red-900/45 text-red-300 font-bold text-xs px-3 py-1.5 rounded-xl transition hover:text-red-200 cursor-pointer mr-2"
                                  >
                                    Rejeter
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedAppToView(app)}
                                className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow-lg shadow-violet-950/25 cursor-pointer"
                              >
                                <span>Consulter le Dossier</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: B2B PROCUREMENT FROM SUPPLIERS */}
        {activeTab === 'b2b-procure' && (
          <div id="business-procure-tab" className="space-y-6">
            {!selectedSupplierId ? (
              // STEP 1: EXPLORE SUPPLIER ACCOUNTS
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-800/60 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Tractor className="w-5 h-5 text-emerald-400" />
                      <span>Réseau des Fournisseurs Gros de Terroir</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Consultez les comptes de tous les fournisseurs de terroir partenaires et parcourez leurs catalogues d'approvisionnement en direct.</p>
                  </div>

                  {/* Search bar inside supplier accounts list */}
                  <div className="relative min-w-[280px] w-full md:w-auto">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Rechercher un fournisseur par nom, type..."
                      value={supplierSearchQuery}
                      onChange={(e) => setSupplierSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="bg-emerald-950/10 border border-emerald-900/30 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 text-emerald-300">
                  <div className="text-xs leading-relaxed">
                    📢 <strong>Commandes Directe de Terroir :</strong> Les comptes fournisseurs ci-dessous sont dédiés exclusivement aux besoins d'approvisionnement des entreprises. Entrez dans leurs vitrines pour passer commande !
                  </div>
                </div>

                {/* Grid list of registered suppliers */}
                {(() => {
                  const b2bSuppliers = (allUsers || []).filter(u => u.profileType === 'fournisseur');
                  const filteredSuppliers = b2bSuppliers.filter(s => {
                    const queryStr = supplierSearchQuery.toLowerCase();
                    return s.name.toLowerCase().includes(queryStr) || 
                           (s.description || '').toLowerCase().includes(queryStr) || 
                           (s.supplierType || '').toLowerCase().includes(queryStr);
                  });

                  if (filteredSuppliers.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                        Aucun fournisseur enregistré n'est disponible ou ne correspond à vos filtres.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredSuppliers.map((s) => {
                        const sProducts = products.filter(p => p.sellerId === s.id);

                        let badgeText = "📦 Fournisseur Terroir";
                        let badgeColor = "bg-emerald-950/20 text-emerald-400 border-emerald-900/30";

                        if (s.supplierType === 'agriculteur') {
                          badgeText = "🚜 Agriculteur & Maraîcher";
                          badgeColor = "bg-green-950/30 text-green-400 border-green-900/30";
                        } else if (s.supplierType === 'artisan') {
                          badgeText = "🪵 Artisan & Fabricant";
                          badgeColor = "bg-orange-950/30 text-orange-400 border-orange-900/30";
                        } else if (s.supplierType === 'eleveur') {
                          badgeText = "🐑 Éleveur & Volailles";
                          badgeColor = "bg-yellow-950/30 text-yellow-400 border-yellow-900/20";
                        } else if (s.supplierType === 'poissonnier') {
                          badgeText = "🐟 Poissonnerie & Fruits de Mer";
                          badgeColor = "bg-sky-950/30 text-sky-400 border-sky-900/30";
                        }

                        return (
                          <div 
                            key={s.id} 
                            onClick={() => setSelectedSupplierId(s.id)}
                            className="group relative overflow-hidden bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/40 transition hover:scale-[1.015] hover:shadow-lg cursor-pointer h-full"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-3.5">
                                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border ${badgeColor}`}>
                                  {badgeText}
                                </span>
                                <span className="text-[11px] text-slate-500 font-bold bg-slate-900/80 px-2.5 py-0.5 rounded border border-slate-800/45">
                                  {sProducts.length} {sProducts.length > 1 ? 'articles' : 'article'}
                                </span>
                              </div>

                              <h3 className="font-extrabold text-base text-slate-200 group-hover:text-emerald-400 transition mb-2">
                                {s.name}
                              </h3>

                              <p className="text-xs text-slate-405 leading-relaxed line-clamp-3 mb-4">
                                {s.description || "Ce producteur local agréé propose ses récoltes et produits de terroir de premier choix."}
                              </p>

                              {/* Contact snippet summary */}
                              <div className="space-y-1.5 py-3 border-t border-slate-900/80 text-[11px] text-slate-400">
                                {s.address && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500">📍</span>
                                    <span className="truncate">{s.address}</span>
                                  </div>
                                )}
                                {s.phone && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-slate-500">📞</span>
                                    <span>{s.phone}</span>
                                    <WhatsAppButton 
                                      phone={s.phone} 
                                      message={`Bonjour ${s.name}, nous sommes une entreprise enregistrée sur WeLink et souhaiterions en savoir plus sur vos produits.`} 
                                      iconOnly={true} 
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 group-hover:scale-[1.02]"
                            >
                              <span>Consulter son catalogue</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              // STEP 2: IMMERSION IN SELECTED SUPPLIER'S ACCOUNT / VITRINE
              (() => {
                const supplierObj = allUsers.find(u => u.id === selectedSupplierId);
                if (!supplierObj) {
                  setSelectedSupplierId(null);
                  return null;
                }

                const sProducts = products.filter(p => p.sellerId === selectedSupplierId);

                return (
                  <div className="space-y-6 animate-fade-in">
                    <button
                      onClick={() => setSelectedSupplierId(null)}
                      className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 group select-none transition pb-2 cursor-pointer"
                    >
                      <span>← Retour à la liste de nos partenaires fournisseurs</span>
                    </button>

                    {/* Integrated Supplier Header Profile Display Banner */}
                    <div className="bg-slate-950/85 border border-slate-850 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
                            Espace d'approvisionnement B2B
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-white">{supplierObj.name}</h2>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">{supplierObj.description || "Établissement agroalimentaire ou artisanal spécialisé dans l'approvisionnement de premier choix."}</p>
                      </div>

                      {/* Direct B2B Contact Info panel */}
                      <div className="shrink-0 p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-slate-300 space-y-2 min-w-[245px]">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block pb-1 border-b border-slate-800/40">Ligne direct fournisseur</span>
                        {supplierObj.phone && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <a href={`tel:${supplierObj.phone}`} className="hover:text-white flex items-center gap-2 hover:underline">
                              <span>📞</span> <span className="font-mono">{supplierObj.phone}</span>
                            </a>
                            <WhatsAppButton 
                              phone={supplierObj.phone} 
                              message={`Bonjour ${supplierObj.name}, nous gérons "${user.name}" sur WeLink et nous souhaiterions commander des marchandises chez vous.`} 
                              iconOnly={true} 
                            />
                          </div>
                        )}
                        {supplierObj.email && (
                          <a
                            href={`mailto:${supplierObj.email}?subject=Partenariat B2B - Commande de matières premières&body=Bonjour ${supplierObj.name},\n\nNous gérons l'établissement "${user.name}" et nous souhaitons commander des matières premières chez vous.`}
                            className="hover:text-white flex items-center gap-2 hover:underline text-emerald-350"
                          >
                            <span>✉️</span> <span className="truncate">{supplierObj.email}</span>
                          </a>
                        )}
                        {supplierObj.address && (
                          <div className="flex items-start gap-2 text-slate-400">
                            <span>📍</span> <span className="text-[11px] leading-tight">{supplierObj.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Catalog section of this supplier */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                        <span>📚 Produits et matières premières de {supplierObj.name}</span>
                        <span className="text-xs font-normal text-slate-500 normal-case">({sProducts.length} {sProducts.length > 1 ? 'articles référencés' : 'article référencé'})</span>
                      </h3>

                      {sProducts.length === 0 ? (
                        <div className="text-center py-16 bg-slate-950/40 border border-slate-850 rounded-2xl text-slate-500">
                          Ce fournisseur n'a mis aucun produit en vente pour le moment.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sProducts.map((p) => {
                            const qty = procureQtys[p.id] || 1;
                            const statusInfo = procureStatus[p.id] || { status: 'idle' };

                            return (
                              <div
                                id={`supplier-item-${p.id}`}
                                key={p.id}
                                className="relative overflow-hidden bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition hover:scale-[1.012] hover:shadow-lg"
                              >
                                {/* Success Status Animation Overlay */}
                                {statusInfo.status === 'success' && (
                                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 rounded-2xl animate-fade-in z-20 text-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl mb-3 border border-emerald-500/25 animate-bounce">
                                      ✓
                                    </div>
                                    <p className="text-xs font-semibold text-slate-100">{statusInfo.message}</p>
                                    <span className="text-[10px] text-slate-400 mt-1">Le stock fournisseur a été mis à jour</span>
                                  </div>
                                )}

                                <div>
                                  {p.imageUrl && (
                                    <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-slate-900 border border-slate-850/60">
                                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/35 px-2 py-0.5 rounded border border-emerald-900/20 uppercase tracking-wider">
                                      🚜 {p.category}
                                    </span>
                                  </div>

                                  <h4 className="font-bold text-sm text-slate-200">{p.title}</h4>
                                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{p.description}</p>
                                </div>

                                <div className="border-t border-slate-900/60 mt-4 pt-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-bold text-slate-100">{p.price.toLocaleString()} FCFA</span>
                                      <span className="text-[10px] text-slate-500 block">par {p.unit} • Stock: {p.stock}</span>
                                    </div>

                                    {p.stock === 0 && (
                                      <span className="text-xs text-slate-600 bg-slate-950 px-2 py-1 rounded-md">Stock épuisé</span>
                                    )}
                                  </div>

                                  {p.stock > 0 && (
                                    <div className="space-y-2">
                                      {/* Quantity Adjuster + Button Controls */}
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 h-9 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => setProcureQtys(prev => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] || 1) - 1) }))}
                                            disabled={qty <= 1 || statusInfo.status === 'loading'}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-sm font-bold cursor-pointer"
                                            title="Diminuer"
                                          >
                                            -
                                          </button>
                                          <input
                                            type="number"
                                            min="1"
                                            max={p.stock}
                                            value={qty}
                                            onChange={(e) => {
                                              const val = Math.max(1, Math.min(p.stock, parseInt(e.target.value) || 1));
                                              setProcureQtys(prev => ({ ...prev, [p.id]: val }));
                                            }}
                                            disabled={statusInfo.status === 'loading'}
                                            className="w-10 text-center bg-transparent border-0 text-white text-xs font-bold focus:ring-0 focus:outline-none p-0"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setProcureQtys(prev => ({ ...prev, [p.id]: Math.min(p.stock, (prev[p.id] || 1) + 1) }))}
                                            disabled={qty >= p.stock || statusInfo.status === 'loading'}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-sm font-bold cursor-pointer"
                                            title="Augmenter"
                                          >
                                            +
                                          </button>
                                        </div>

                                        <button
                                          id={`procure-btn-${p.id}`}
                                          disabled={statusInfo.status === 'loading'}
                                          onClick={() => handleProcureRawMaterials(p.id, qty)}
                                          className={`flex-1 text-white text-xs font-semibold h-9 px-4 rounded-xl shadow-md transition flex items-center justify-center cursor-pointer ${
                                            statusInfo.status === 'loading'
                                              ? 'bg-emerald-700 opacity-80 cursor-wait'
                                              : 'bg-emerald-600 hover:bg-emerald-500'
                                          }`}
                                        >
                                          {statusInfo.status === 'loading' ? 'Envoi...' : `Commander ${qty}`}
                                        </button>
                                      </div>

                                      {statusInfo.status === 'error' && (
                                        <div className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg px-2 py-1.5 animate-fade-in font-medium">
                                          ⚠️ {statusInfo.message}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* TAB 4: CLIENT ORDERS TRACKING ("sales") */}
        {activeTab === 'sales' && (
          <div id="business-sales-tab" className="space-y-6">
            <div className="border-b border-slate-800/60 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <span>Commandes Clients Reçues & Suivi</span>
              </h1>
              <p className="text-xs text-slate-400">Consultez l'historique et les nouvelles commandes passées par vos clients. Coordonnées directes, moyens de règlements et mises à jour de livraisons.</p>
            </div>

            {myIncomingOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Vous n'avez reçu aucune commande client pour le moment.
              </div>
            ) : (
              <div className="space-y-3.5">
                {myIncomingOrders.map((o) => (
                  <div id={`incoming-order-${o.id}`} key={o.id} className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between gap-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] mb-1">
                          <span className="text-slate-500 font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9.5px]">COMMANDE ID: {o.id}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-violet-350 font-black uppercase text-xs">Client : {o.buyerName}</span>
                          {o.paymentMethod && (
                            <span className="ml-1.5 inline-flex items-center gap-1 bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900 text-[10px] font-bold">
                              💳 {o.paymentMethod} (Sécurisé)
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-200 text-sm">{o.productTitle}</h4>
                        <p className="text-xs text-slate-400">
                          Quantité Commandée : <strong className="text-slate-200">{o.quantity} {user.enterpriseType === 'poissonnerie' || o.productTitle.toLowerCase().includes('bar') || o.productTitle.toLowerCase().includes('gambas') || o.productTitle.toLowerCase().includes('poisson') || o.productTitle.toLowerCase().includes('calamar') ? 'kg' : ''}</strong> • Montant : <strong className="text-violet-400">{(o.price * o.quantity).toLocaleString()} FCFA</strong>
                        </p>

                        {/* Scheduled delivery banner for merchant */}
                        {o.scheduledDate && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 bg-cyan-950/40 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-900/40 text-xs font-semibold flex-wrap">
                            <span>🚚 Livraison planifiée par le client :</span>
                            <span className="font-bold text-white underline">{new Date(o.scheduledDate).toLocaleDateString('fr-FR')}</span>
                            {o.scheduledTime && <span>à <span className="font-bold text-white">{o.scheduledTime}</span></span>}
                          </div>
                        )}

                        {/* Interactive escrow lock banner for businesses */}
                        {o.isEscrow && (
                          <div className="mt-2 text-xs bg-indigo-950/40 border border-indigo-900/50 p-3 rounded-2xl max-w-2xl shadow-sm">
                            <div className="flex flex-wrap items-center gap-1.5 font-bold text-indigo-300">
                              <span>🛡️ Retenue de Garantie Escrow active :</span>
                              <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                                o.escrowStatus === 'released' 
                                  ? 'bg-emerald-950 border-emerald-900/60 text-emerald-400' 
                                  : o.escrowStatus === 'refunded'
                                  ? 'bg-slate-900 border-slate-800 text-slate-400'
                                  : 'bg-amber-950/50 border-amber-900/50 text-amber-400'
                              }`}>
                                {o.escrowStatus === 'released' ? '💸 Fonds Libérés / Encaissés ✓' : o.escrowStatus === 'refunded' ? '↩️ Fonds Retournés' : '🔒 Fonds Séquestrés'}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-350 mt-1 leading-normal font-medium">
                              {o.escrowStatus === 'released' && "✓ Succès : Les fonds ont été transférés de manière fiable sur votre compte suite à la confirmation de réception locale."}
                              {o.escrowStatus === 'refunded' && "↩️ Commande annulée. La provision a été restituée au client."}
                              {(o.escrowStatus === 'locked' || !o.escrowStatus) && "🔒 L'argent de la commande est bloqué en toute sécurité par la plateforme. Préparez et livrez le client, puis il libérera le paiement via son interface."}
                            </p>
                          </div>
                        )}

                        {/* Direct client coordinates lookup block */}
                        {(() => {
                          const buyerProfile = allUsers.find(u => u.id === o.buyerId);
                          if (!buyerProfile) return null;
                          return (
                            <div className="text-xs text-slate-300 mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 max-w-2xl w-full">
                              <span className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">📞 CONTACTER LE CLIENT :</span>
                              {buyerProfile.phone && (
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={`tel:${buyerProfile.phone}`} 
                                    className="text-violet-400 hover:text-violet-300 hover:underline font-bold flex items-center gap-1"
                                  >
                                    📞 {buyerProfile.phone}
                                  </a>
                                  <WhatsAppButton 
                                    phone={buyerProfile.phone} 
                                    message={`Bonjour ${buyerProfile.name}, nous avons reçu votre commande de marchandises sur WeLink.`} 
                                    iconOnly={true} 
                                  />
                                </div>
                              )}
                              {buyerProfile.email && (
                                <a 
                                  href={`mailto:${buyerProfile.email}`} 
                                  className="text-violet-450 hover:text-violet-350 hover:underline flex items-center gap-1"
                                >
                                  ✉️ {buyerProfile.email}
                                </a>
                              )}
                              {buyerProfile.address && (
                                <span className="text-slate-400 font-medium">
                                  📍 {buyerProfile.address}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenDeliveryChat(o)}
                                className="sm:ml-auto px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 rounded-lg text-[10.5px] font-bold border border-indigo-900/60 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                              >
                                💬 Contacter (Chat)
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-500 font-medium">Reçu le : {new Date(o.createdAt).toLocaleDateString()}</span>
                        
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {/* Facture or Devis PDF button for Merchant */}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(o)}
                            className="bg-slate-900 border border-slate-800 hover:bg-slate-850 px-2.5 py-1 text-xs text-slate-350 hover:text-white rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 font-sans"
                            title="Visualiser et imprimer la facture ou le devis de la commande"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{o.status === 'pending' ? 'Devis' : 'Facture'} PDF</span>
                          </button>

                          {/* WeLink Delivery Carrier Assignment Action */}
                          {o.serviceType === 'delivery' && (
                            <div className="flex items-center gap-1.5">
                              {o.carrierId ? (
                                <span className="bg-indigo-950/45 text-indigo-305 border border-indigo-900/40 px-2 py-0.5 rounded text-[10px] font-sans font-extrabold block">
                                  🛵 Livreur : {o.carrierName} ({o.deliveryStatus === 'delivered' ? 'Livré' : o.deliveryStatus === 'picked_up' ? 'En chemin' : 'Assigné'})
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAutoAssignCarrier(o.id)}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-2.5 py-1 rounded-lg text-[10.5px] transition cursor-pointer flex items-center gap-1 font-sans"
                                >
                                  ⚡ Assigner Livreur
                                </button>
                              )}
                            </div>
                          )}

                          {o.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                id={`accept-order-${o.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOrderStatusUpdate(o.id, 'accepted');
                                }}
                                className="bg-violet-900 hover:bg-violet-850 px-3 py-1.5 text-xs text-white hover:text-violet-100 rounded-lg font-bold transition cursor-pointer"
                              >
                                Accepter la commande
                              </button>
                              <span className="bg-amber-955/35 text-amber-400 border border-amber-900/50 px-2 py-1 rounded text-[9px] font-bold uppercase">⏳ En attente</span>
                            </>
                          )}
                          {o.status === 'accepted' && (
                            <>
                              <button
                                type="button"
                                id={`ship-order-${o.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOrderStatusUpdate(o.id, 'shipped');
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs text-white hover:text-indigo-100 rounded-lg font-bold transition cursor-pointer"
                              >
                                Expédier 🚚
                              </button>
                              <span className="bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-1 rounded text-[9px] font-bold uppercase">✓ Confirmé</span>
                            </>
                          )}
                          {o.status === 'shipped' && (
                            <>
                              <button
                                type="button"
                                id={`deliver-order-${o.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOrderStatusUpdate(o.id, 'delivered');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs text-white hover:text-emerald-100 rounded-lg font-bold transition cursor-pointer"
                              >
                                Livré ✓
                              </button>
                              <span className="bg-blue-950 text-blue-300 border border-blue-900 px-2 py-1 rounded text-[9px] font-bold uppercase">🚚 En livraison</span>
                            </>
                          )}
                          {o.status === 'delivered' && (
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-900 px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Reçu par le client & Encaissé
                            </span>
                          )}
                          {o.status === 'cancelled' && (
                            <span className="bg-red-950/40 text-red-300 border border-red-900 px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1">
                              ❌ Commande Annulée par le client
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: POINT OF SALE CASHIER & AI PREDICTIVE HUD */}
        {activeTab === 'pos' && (
          <div id="business-pos-tab" className="space-y-6">
            <div className="border-b border-slate-800/60 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <span>Caisse Enregistreuse & Tendances d'achats</span>
                  </h1>
                  <p className="text-xs text-slate-400">Guichet de vente physique au comptoir. Enregistrez vos ventes et observez les suggestions de rayons complémentaires basées sur l'historique d'activité locale.</p>
                </div>
                
                {/* Micro KPIs for Direct Sales */}
                <div className="flex gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <div className="px-2.5">
                    <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider">Chiffre d'Affaires</span>
                    <span className="text-xs font-bold text-indigo-400">
                      {ventes.filter(v => v.entreprise_id === user.id).reduce((sum, v) => sum + v.total, 0).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="border-l border-slate-850 pl-3 pr-2">
                    <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider font-sans">Panier Moyen Comptoir</span>
                    <span className="text-xs font-bold text-teal-400 text-right">
                      {(() => {
                        const direct = ventes.filter(v => v.entreprise_id === user.id);
                        return direct.length ? Math.round(direct.reduce((sum, v) => sum + v.total, 0) / direct.length).toLocaleString() : 0;
                      })()} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {posSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/35 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{posSuccess}</span>
              </div>
            )}

            {/* Custom Low-Stock Error Simulation (scénario vente-impossible de l'utilisateur) */}
            {posError && (
              <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/55 text-red-300 space-y-3">
                <div className="flex items-start space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-red-200">⚠️ Vente Bloquée - Stocks Physiques Épuisés</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Votre caisse n'a pas pu valider cette transaction car le produit <strong className="text-slate-200">"{posError.produit}"</strong> est en rupture de stock par rapport à la demande.
                    </p>
                  </div>
                </div>
                
                <div className="bg-slate-950/80 p-3 rounded-xl border border-red-900/10 text-xs flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Produit</span>
                    <span className="font-semibold text-slate-200">{posError.produit}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold text-center">Demande Guichet</span>
                    <span className="font-semibold text-red-400 text-center block">{posError.demande} unité(s)</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold text-center">Disponible</span>
                    <span className="font-semibold text-teal-400 text-center block">{posError.dispo} unité(s)</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 pt-1">
                  <button
                    onClick={() => {
                      setActiveTab('b2b-procure');
                      setPosError(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 hover:scale-101 transition duration-200 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center space-x-1"
                  >
                    <span>🚜 S'approvisionner auprès des Fournisseurs</span>
                  </button>
                  <button
                    onClick={() => setPosError(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-medium"
                  >
                    Fermer l'alerte
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* Col Left: POS Cash Register Controls */}
              <div className="md:col-span-8 space-y-6">
                
                {/* Subpart: Walk-in Shopper Profiles */}
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-3xl relative overflow-hidden">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Étape 1 : Profil démographique du client au comptoir</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Tranche d'âge</label>
                      <div className="grid grid-cols-4 gap-1">
                        {["18-25", "26-39", "40-55", "55+"].map((ageOpt) => (
                          <button
                            key={ageOpt}
                            type="button"
                            onClick={() => { setPosAge(ageOpt); setPosSuccess(''); }}
                            className={`py-2 text-xs font-semibold rounded-xl text-center border transition ${posAge === ageOpt ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'}`}
                          >
                            {ageOpt} ans
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Genre / Sexe</label>
                      <div className="grid grid-cols-2 gap-1">
                        {["Femme", "Homme"].map((sexeOpt) => (
                          <button
                            key={sexeOpt}
                            type="button"
                            onClick={() => { setPosSexe(sexeOpt); setPosSuccess(''); }}
                            className={`py-2 text-xs font-semibold rounded-xl text-center border transition ${posSexe === sexeOpt ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'}`}
                          >
                            {sexeOpt === "Homme" ? "Homme 🧔" : "Femme 👩"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subpart: Catalog Cashier Picker */}
                <div className="bg-slate-950/45 border border-slate-800 p-5 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-905">
                    <div>
                      <span className="block text-xs font-bold text-slate-200 uppercase tracking-wider">🛒 Étape 2 : Sélectionner les articles vendus</span>
                      <p className="text-[11px] text-slate-550">Recherchez ou filtrez par rayon pour enregistrer un article rapidement.</p>
                    </div>
                  </div>

                  {/* Search and Category Filter HUD */}
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="🔍 Rechercher un produit par nom ou rayon (ex: lait, boisson)..."
                        value={posSearchQuery}
                        onChange={(e) => { setPosSearchQuery(e.target.value); setPosSuccess(''); }}
                        className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition"
                      />
                      {posSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setPosSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-350"
                        >
                          Effacer
                        </button>
                      )}
                    </div>

                    {/* Category quick selectors */}
                    {(() => {
                      const categories = ['Tous', ...Array.from(new Set(myProducts.map(p => p.category || 'Général')))];
                      if (categories.length > 1) {
                        return (
                          <div className="flex flex-wrap gap-1.5 max-h-[75px] overflow-y-auto pr-1">
                            {categories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => { setPosSelectedCategory(cat); setPosSuccess(''); }}
                                className={`px-3 py-1 text-[10px] font-semibold rounded-lg transition border ${posSelectedCategory === cat ? 'bg-indigo-600 border-indigo-505 text-white' : 'bg-slate-955 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-200'}`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Products Grid */}
                  {myProducts.length === 0 ? (
                    <div className="text-center py-8 text-slate-650 text-xs bg-slate-950/20 border border-dashed border-slate-900 rounded-2xl">
                      Aucun produit créé dans votre inventaire. <button type="button" className="underline text-indigo-400 hover:text-indigo-300 font-bold" onClick={() => setActiveTab(isSupermarche || isMarche ? 'supermarket-rayons' : 'inventory')}>Créer un produit</button>
                    </div>
                  ) : (() => {
                    const filtered = myProducts.filter(p => {
                      const matchesSearch = p.title.toLowerCase().includes(posSearchQuery.toLowerCase()) || 
                                            (p.category && p.category.toLowerCase().includes(posSearchQuery.toLowerCase()));
                      const matchesCategory = posSelectedCategory === 'Tous' || (p.category || 'Général') === posSelectedCategory;
                      return matchesSearch && matchesCategory;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-8 text-slate-600 text-xs italic">
                          Aucun produit ne correspond à vos filtres actuels.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {filtered.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { handleAddPosCartItem(p); setPosSuccess(''); }}
                            className={`p-3 text-left rounded-2xl border bg-slate-950 border-slate-850/80 hover:border-indigo-500/55 transition flex items-center justify-between group cursor-pointer ${p.stock === 0 ? 'opacity-40 cursor-not-allowed text-slate-600' : 'hover:scale-[1.01]'}`}
                            disabled={p.stock === 0}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-[11px] text-slate-100 font-bold block truncate group-hover:text-indigo-300 transition">{p.title}</span>
                              <span className="text-[9px] text-slate-500 font-mono block">En Stock : <strong className={p.stock < 5 ? "text-amber-500 font-bold" : "text-slate-400 font-medium"}>{p.stock}</strong> ({p.unit})</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="block text-[11px] font-extrabold text-slate-205">{p.price.toLocaleString()} F</span>
                              <span className="text-[8px] font-sans font-bold px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-indigo-400 uppercase tracking-wider rounded group-hover:bg-indigo-950/50 group-hover:border-indigo-805 transition">+ Ajouter</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Subpart: Receipt Ledger list */}
                <div className="bg-slate-950/30 border border-slate-850/60 p-5 rounded-3xl">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Historique des ventes de caisse au comptoir ({ventes.filter(v => v.entreprise_id === user.id).length})</span>
                  
                  {ventes.filter(v => v.entreprise_id === user.id).length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-xs">
                      Aucun ticket de caisse enregistré.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {ventes.filter(v => v.entreprise_id === user.id).map((v) => (
                        <div key={v.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-855 flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-slate-300">Ticket #{v.id.substring(6)}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-[10px] text-slate-400">{v.sexe === 'Homme' ? '🧔' : '👩'} ({v.age} ans)</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono block">{new Date(v.date_vente).toLocaleTimeString()} • {v.items.map(item => `${item.produit} (x${item.quantite})`).join(', ')}</span>
                          </div>
                          <span className="font-bold text-indigo-400 text-xs shrink-0">{v.total.toLocaleString()} FCFA</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Col Right: POS Shopping Basket & AI Suggestion Panel */}
              <div className="md:col-span-4 space-y-6">

                {/* Part A.1: Ticket de Caisse PDF/Printable Receipt UI */}
                {printedTicket && (
                  <div className="bg-white text-slate-900 border-2 border-slate-300 p-5 rounded-2xl shadow-2xl relative overflow-hidden font-mono text-xs keep-white animate-fade-in space-y-3">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-emerald-500 to-indigo-500"></div>
                    
                    <div className="text-center font-bold space-y-1 pt-1">
                      <h3 className="text-sm tracking-wider uppercase">{user.name || "SUPERMARCHÉ EXCEL"}</h3>
                      <p className="text-[10px] text-slate-500 normal-case font-sans">Plateforme de Facturation & Caisse</p>
                      <p className="text-[9px] text-slate-400 font-sans font-normal">Tél: +221 33 824 15 15 • Dakar, Sénégal</p>
                    </div>

                    <div className="border-t border-dashed border-slate-300 my-2 pt-2 text-[10px] space-y-1 font-sans text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ticket N°:</span>
                        <span className="font-bold">{printedTicket.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date/Heure:</span>
                        <span>{new Date(printedTicket.date_vente).toLocaleString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Client:</span>
                        <span className="font-bold">{printedTicket.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Profil client:</span>
                        <span>{printedTicket.sexe} • {printedTicket.age} ans</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-300 py-2 space-y-1.5 text-left">
                      <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase">
                        <span className="col-span-6">Désignation</span>
                        <span className="col-span-2 text-center">Qté</span>
                        <span className="col-span-4 text-right">Montant</span>
                      </div>
                      <div className="border-b border-dotted border-slate-200 pb-1"></div>
                      {printedTicket.items.map((it: any, k: number) => (
                        <div key={k} className="grid grid-cols-12 text-[10px] leading-tight">
                          <div className="col-span-6 truncate font-sans font-medium">{it.produit}</div>
                          <div className="col-span-2 text-center">x{it.quantite}</div>
                          <div className="col-span-4 text-right font-bold">{(it.total || it.prix_unitaire * it.quantite).toLocaleString()} F</div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-dashed border-slate-300 pt-2 text-[10px] space-y-1 text-left">
                      <div className="flex justify-between font-sans">
                        <span className="text-slate-500">Total Brut:</span>
                        <span>{printedTicket.items.reduce((sum: number, i: any) => sum + (i.prix_unitaire * i.quantite), 0).toLocaleString()} FCFA</span>
                      </div>
                      {printedTicket.discountAmount > 0 && (
                        <div className="flex justify-between text-indigo-700 font-sans">
                          <span>Réduction ({printedTicket.discountCode || "PROMO"}):</span>
                          <span>-{printedTicket.discountAmount.toLocaleString()} FCFA</span>
                        </div>
                      )}
                      <div className="flex justify-between font-sans">
                        <span>TVA ({printedTicket.vatRate || 18}%) :</span>
                        <span>{(printedTicket.vatAmount || 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between font-sans text-xs font-black border-t border-slate-200 pt-1.5">
                        <span className="uppercase">Net Payé (TTC):</span>
                        <span className="text-emerald-700 font-mono text-sm">{printedTicket.total.toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[9px] text-slate-500 space-y-1">
                      <div className="flex justify-center items-center gap-1 font-bold text-slate-700 font-sans">
                        <span>Mode de Règlement:</span>
                        <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[8px]">{printedTicket.paymentMethod}</span>
                      </div>
                      <p className="font-sans italic text-slate-400 mt-1">Merci pour vos achats !</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const originalTitle = document.title;
                          document.title = `Ticket-Caisse-${printedTicket.id}`;
                          window.print();
                          document.title = originalTitle;
                        }}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold py-1.5 rounded-lg text-[10px] text-center flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Imprimer le Ticket</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintedTicket(null)}
                        className="px-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-sans font-bold py-1.5 rounded-lg text-[10px] text-center cursor-pointer"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Part A: POS Running Basket */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden font-sans">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                  
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-violet-400" />
                    <span>Panier Actuel</span>
                  </span>

                  {posCart.length === 0 ? (
                    <div className="text-center py-12 text-slate-600 text-xs border border-dashed border-slate-850 rounded-2xl bg-slate-950/20">
                      Le panier est vide. Cliquez sur des produits pour les facturer.
                    </div>
                  ) : (
                    <form onSubmit={handleCheckoutPosCart} className="space-y-4 text-left">
                      {/* Cart items list scrollable */}
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                        {posCart.map((item, index) => (
                          <div key={index} className="bg-slate-950 p-2 text-slate-200 rounded-xl border border-slate-850 flex items-center justify-between">
                            <div className="min-w-0 pr-1 select-none">
                              <span className="font-bold text-xs text-slate-200 block truncate">{item.produit}</span>
                              <span className="text-[9px] text-slate-500 block">{item.prix_unitaire.toLocaleString()} F / unité</span>
                            </div>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleRemovePosCartItem(item.produit)}
                                className="p-1 bg-slate-900 rounded-md hover:text-white hover:bg-slate-800 transition text-slate-400"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-xs font-bold font-mono text-slate-200">{item.quantite}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const orig = products.find(p => p.sellerId === user.id && p.title.toLowerCase() === item.produit.toLowerCase());
                                  if (orig) handleAddPosCartItem(orig);
                                }}
                                className="p-1 bg-slate-900 rounded-md hover:text-white hover:bg-slate-800 transition text-slate-400"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Cashier professional billing config options */}
                      <div className="border-t border-slate-850 pt-3 space-y-3">
                        {/* Option 1: Client account name */}
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Compte Client / Éco-Profil</label>
                          <input
                            type="text"
                            value={posClientName}
                            onChange={(e) => setPosClientName(e.target.value)}
                            placeholder="Ex: Babacar Diallo, Client Comptoir..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-left"
                          />
                        </div>

                        {/* Option 2: Payment method */}
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mode de Règlement</label>
                          <select
                            value={posPaymentMethod}
                            onChange={(e) => setPosPaymentMethod(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Espèces">💵 Espèces (Comptant)</option>
                            <option value="Carte bancaire">💳 Carte Bancaire Visa/Mastercard</option>
                            <option value="Mobile Money">📲 Mobile Money Général</option>
                            <option value="Orange Money">🍊 Orange Money Cameroun</option>
                            <option value="MTN MoMo">📡 MTN MoMo Cameroun</option>
                            <option value="Mixte">🔄 Paiement Mixte (Espèces + Mobile)</option>
                          </select>
                        </div>

                        {/* Option 3: Discount selector */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Réduction & Code Promo</label>
                            <span className="text-[10px] text-indigo-400 font-bold font-mono">-{posDiscountPercent}%</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                            {[0, 5, 10, 15, 20].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => {
                                  setPosDiscountPercent(pct);
                                  setPosDiscountCode(pct > 0 ? `REDUC-${pct}` : '');
                                }}
                                className={`py-1 text-[10px] font-bold rounded-lg transition border cursor-pointer ${
                                  posDiscountPercent === pct
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                          {posDiscountPercent > 0 && (
                            <input
                              type="text"
                              value={posDiscountCode}
                              onChange={(e) => setPosDiscountCode(e.target.value)}
                              placeholder="Code de réduction..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none text-left"
                            />
                          )}
                        </div>

                        {/* Option 4: TVA Rate */}
                        <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl border border-slate-850/40 text-[10px]">
                          <span className="font-bold text-slate-400 uppercase tracking-widest">Taux de TVA national</span>
                          <div className="flex items-center space-x-1 font-mono">
                            <input
                              type="number"
                              value={posTvaRate}
                              onChange={(e) => setPosTvaRate(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-10 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-slate-200 text-[10px]"
                            />
                            <span className="text-slate-500">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Calculations Breakdown */}
                      {(() => {
                        const rawTotal = posCart.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);
                        const discountAmt = Math.round(rawTotal * (posDiscountPercent / 100));
                        const subTotal = rawTotal - discountAmt;
                        const tvaAmt = Math.round(subTotal * (posTvaRate / 100));
                        const grandTotal = subTotal + tvaAmt;

                        return (
                          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-850/70 space-y-1.5 font-mono text-[10px]">
                            <div className="flex justify-between text-slate-500">
                              <span>Total Brut:</span>
                              <span>{rawTotal.toLocaleString()} F</span>
                            </div>
                            {discountAmt > 0 && (
                              <div className="flex justify-between text-indigo-400">
                                <span>Remise (-{posDiscountPercent}%):</span>
                                <span>-{discountAmt.toLocaleString()} F</span>
                              </div>
                            )}
                            <div className="flex justify-between text-slate-500">
                              <span>TVA ({posTvaRate}%):</span>
                              <span>{tvaAmt.toLocaleString()} F</span>
                            </div>
                            <div className="flex justify-between text-slate-200 font-bold text-xs border-t border-slate-800 pt-1.5 font-sans">
                              <span className="uppercase text-[10px] tracking-wider text-slate-400">Total à percevoir TTC:</span>
                              <span className="text-indigo-400 font-bold font-mono">{grandTotal.toLocaleString()} FCFA</span>
                            </div>
                          </div>
                        );
                      })()}

                      <button
                        id="pos-submit-checkout-btn"
                        type="submit"
                        disabled={posSubmitting}
                        className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition duration-200 flex items-center justify-center space-x-1.5 text-center cursor-pointer shadow-lg shadow-indigo-950/40"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Enregistrer & Sortir Ticket</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Part B: REAL-TIME AI RECOMMENDER HUD PANEL (Based on their Python algorithm) */}
                <div className="bg-slate-950 border border-indigo-900/30 p-5 rounded-3xl relative overflow-hidden font-sans">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl"></div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="block text-[11px] font-bold text-indigo-300 uppercase tracking-widest flex items-center space-x-1">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                      <span>Indicateur des ventes</span>
                    </span>
                    <span className="text-[9px] bg-indigo-950 text-indigo-400 border border-indigo-900/50 px-1.5 py-0.5 rounded font-bold uppercase">ANALYSE</span>
                  </div>

                  {aiInsights?.predictionResult && (
                    <div className="space-y-4">
                      
                      {/* Sub-HUD: Predicive Department Match (Logistic Regression emulation) */}
                      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-indigo-950">
                        <span className="text-[10px] text-slate-505 uppercase font-bold tracking-wider block mb-1">Affinité Prédictive de Rayon</span>
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-sm text-slate-100">{aiInsights.predictionResult.bestRayon}</span>
                          <span className="text-[9px] font-bold bg-violet-950/70 text-violet-300 border border-violet-900/40 px-2 py-0.5 rounded-full uppercase shrink-0">
                            {aiInsights.predictionResult.level}
                          </span>
                        </div>
                        
                        {/* Probability graph indicator */}
                        <div className="mt-2 text-xs">
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                            <span>Score de confiance d'achat</span>
                            <span>{Math.round(aiInsights.predictionResult.bestScore * 100) || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-linear-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.round(aiInsights.predictionResult.bestScore * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Sub-HUD: Demographic product suggestions */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Suggestions de Profil Démographique</span>
                        
                        {aiInsights.staticRecommendations.length === 0 ? (
                          <span className="text-[10px] text-slate-600 block italic leading-snug">Aucun modèle similaire dans l'historique pour l'instant.</span>
                        ) : (
                          <div className="space-y-1.5">
                            {aiInsights.staticRecommendations.map((rec, idx) => {
                              const actualProd = products.find(p => p.sellerId === user.id && p.title.toLowerCase() === rec.produit.toLowerCase());
                              return (
                                <div key={idx} className="bg-slate-900 p-2 rounded-xl flex items-center justify-between text-[11px] hover:border-indigo-500/30 border border-transparent transition">
                                  <div className="min-w-0 pr-2">
                                    <span className="text-[10px] text-slate-300 font-semibold block truncate">{rec.produit}</span>
                                    <span className="text-[9px] text-slate-500 block">Indice : {rec.score.toFixed(2)}</span>
                                  </div>
                                  {actualProd && actualProd.stock > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleAddPosCartItem(actualProd)}
                                      className="p-1 px-2 bg-indigo-900 hover:bg-indigo-850 text-white rounded text-[9px] shrink-0 uppercase tracking-widest font-bold"
                                    >
                                      + Vendre
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Sub-HUD: Co-occurrence/Combo basket suggestions */}
                      {posCart.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-slate-900">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block leading-normal font-sans">Suggestions d'Affinité Panier (Combos)</span>
                          
                          {aiInsights.advancedRecommendations.length === 0 ? (
                            <span className="text-[10px] text-slate-600 block italic leading-snug">Aucun combo répertorié pour ces articles dans vos ventes.</span>
                          ) : (
                            <div className="space-y-1.5">
                              {aiInsights.advancedRecommendations.map((rec, idx) => {
                                const actualProd = products.find(p => p.sellerId === user.id && p.title.toLowerCase() === rec.produit.toLowerCase());
                                return (
                                  <div key={idx} className="bg-slate-900 p-2 rounded-xl flex items-center justify-between text-[11px] hover:border-pink-500/30 border border-transparent transition">
                                    <div className="min-w-0 pr-2">
                                      <span className="text-[10px] text-slate-350 font-semibold block truncate">💡 Associer : {rec.produit}</span>
                                      <span className="text-[9px] text-slate-500 block">Combo Score : {rec.score.toFixed(2)}</span>
                                    </div>
                                    {actualProd && actualProd.stock > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleAddPosCartItem(actualProd)}
                                        className="p-1 px-2 bg-pink-950 hover:bg-pink-900 border border-pink-900/40 text-pink-300 rounded text-[9px] shrink-0 uppercase tracking-widest font-bold"
                                      >
                                        + Combo
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                  
                  {/* Explanatory footer about ML system */}
                  <span className="block text-[8px] text-slate-600 mt-4 leading-relaxed font-sans select-none">
                    * Modélisation basée sur le score d'affinité profile-matching (Age, Sexe) et l'analyse de corrélation par panier croisé.
                  </span>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB: OUTGOING B2B ORDERS / MES COMMANDES PASSEES */}
        {activeTab === 'my-orders' && (
          <div id="business-my-orders-tab" className="space-y-6 animate-fade-in text-slate-100">
            <div className="border-b border-slate-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-pink-400" />
                  <span>Mes Commandes & Achats B2B (Matières Premières)</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Suivez en temps réel l'avancement et le statut de vos commandes de matières premières et ingrédients passées auprès de vos fournisseurs ou des marchés locaux.
                </p>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Commandes totales</span>
                <span className="text-xl font-bold text-white font-mono">
                  {myOutgoingOrders.length}
                </span>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">En transit</span>
                <span className="text-xl font-bold text-blue-400 font-mono">
                  {myOutgoingOrders.filter(o => o.status !== 'delivered').length}
                </span>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Dépenses totales</span>
                <span className="text-xl font-bold text-pink-400 font-mono">
                  {myOutgoingOrders.reduce((sum, o) => sum + (o.price * o.quantity), 0).toLocaleString()} FCFA
                </span>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Historique d'approvisionnement ({myOutgoingOrders.length})
              </h3>

              {myOutgoingOrders.length === 0 ? (
                <div className="text-center py-16 text-slate-500 border border-dashed border-slate-850 rounded-2xl bg-slate-950/10">
                  <Truck className="w-8 h-8 text-slate-650 mx-auto mb-3 opacity-40 animate-pulse" />
                  <p className="text-sm">Vous n'avez passé aucune commande d'approvisionnement pour le moment.</p>
                  <p className="text-xs text-slate-600 mt-1">Allez dans l'onglet "Approvisionnement" ou "Faire des achats" pour commander vos premières ressources !</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myOutgoingOrders.map((o) => {
                    const isDelivered = o.status === 'delivered';
                    return (
                      <div key={o.id} className={`p-4 rounded-2xl bg-slate-950/60 border transition flex flex-col justify-between ${isDelivered ? 'border-slate-850 hover:border-slate-800' : 'border-indigo-900/40 shadow-lg shadow-indigo-950/10'}`}>
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center space-x-3 min-w-0">
                              <span className="text-2xl shrink-0">
                                {o.productTitle.toLowerCase().includes('poulet') || o.productTitle.toLowerCase().includes('viande') ? '🍗' :
                                 o.productTitle.toLowerCase().includes('poisson') ? '🐟' :
                                 o.productTitle.toLowerCase().includes('manioc') || o.productTitle.toLowerCase().includes('farine') ? '🌾' :
                                 o.productTitle.toLowerCase().includes('légume') || o.productTitle.toLowerCase().includes('tomate') ? '🍅' : '📦'}
                              </span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-slate-200 truncate" title={o.productTitle}>{o.productTitle}</h4>
                                <span className="text-[10px] text-slate-500 font-semibold block truncate">Fournisseur : {o.sellerName || 'Partenaire local'}</span>
                              </div>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase shrink-0 ${
                              isDelivered ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40' :
                              o.status === 'shipped' ? 'bg-blue-950/50 text-blue-400 border border-blue-900/40 animate-pulse' :
                              o.status === 'accepted' ? 'bg-indigo-950/50 text-indigo-450 border border-indigo-900/30' :
                              'bg-amber-950/50 text-amber-400 border border-amber-900/20'
                            }`}>
                              {isDelivered ? '✓ Livré' : 
                               o.status === 'shipped' ? '🚚 En livraison' :
                               o.status === 'accepted' ? '✓ Validé' : '⌛ En attente'}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-between text-xs font-mono border-t border-slate-900/40 pt-2 text-slate-450">
                            <span>Quantité : <strong className="text-slate-200">{o.quantity}</strong></span>
                            <span>Date : <strong className="text-slate-350">{new Date(o.createdAt || o.id).toLocaleDateString('fr-FR')}</strong></span>
                          </div>

                          {(() => {
                            const sellerProfile = allUsers.find(u => u.id === o.sellerId);
                            if (!sellerProfile) return null;
                            return (
                              <div className="mt-2.5 p-2 rounded bg-slate-900 border border-slate-850/40 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-450">
                                <span className="font-extrabold text-pink-400 uppercase tracking-wider block w-full mb-0.5">Contact Vendeur (Fournisseur) :</span>
                                {sellerProfile.phone && (
                                  <div className="flex items-center gap-2">
                                    <a href={`tel:${sellerProfile.phone}`} className="hover:text-white flex items-center gap-1 hover:underline">
                                      📞 {sellerProfile.phone}
                                    </a>
                                    <WhatsAppButton 
                                      phone={sellerProfile.phone} 
                                      message={`Bonjour ${sellerProfile.name}, nous vous contactons au sujet de notre commande sur WeLink.`} 
                                      iconOnly={true} 
                                    />
                                  </div>
                                )}
                                {sellerProfile.email && (
                                  <a 
                                    href={`mailto:${sellerProfile.email}?subject=Suivi de Commande B2B ${o.id}&body=Bonjour ${sellerProfile.name},\n\nNous vous contactons concernant notre commande #${o.id} de "${o.productTitle}" (${o.quantity} lot(s)).\n\nCordialement,\n${user.name}`} 
                                    className="hover:text-white flex items-center gap-1 hover:underline text-pink-400"
                                  >
                                    ✉️ {sellerProfile.email}
                                  </a>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-900/60 flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-pink-400 font-mono">
                            {(o.price * o.quantity).toLocaleString()} FCFA
                          </span>

                          {!isDelivered ? (
                            <button
                              type="button"
                              onClick={() => handleConfirmB2BOrderDelivery(o.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl transition cursor-pointer shadow-md"
                            >
                              ✓ Valider Réception & Stocker
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-500 font-bold flex items-center space-x-1">
                              <span>✓ Ajouté au stock cuisine</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: POISSONNERIE - LOTS, TRACEABILITY & ALERTS */}
        {activeTab === 'poissonnerie' && user.enterpriseType === 'poissonnerie' && (
          <div id="business-poissonnerie-tab" className="space-y-6 animate-fade-in text-slate-100 font-sans">
            <div className="border-b border-slate-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span className="text-cyan-400">🐟</span>
                  <span>Espace Traçabilité & Gestion de la Marée</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Gérez la fraîcheur, la traçabilité des lots de poissons, de crustacés, enregistrez les pertes de stock de la mer et gérez les alertes pour vos clients.
                </p>
              </div>

              {/* Sub tabs selector */}
              <div className="flex space-x-1.5 bg-slate-950 p-1 rounded-xl self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setPoissonnerieTab('lots')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${poissonnerieTab === 'lots' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  📦 Lots & Fraîcheur
                </button>
                <button
                  type="button"
                  onClick={() => setPoissonnerieTab('losses')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${poissonnerieTab === 'losses' ? 'bg-rose-950 text-rose-300 border border-rose-900/40' : 'text-slate-400 hover:text-white'}`}
                >
                  ⚠️ Pertes & Rebuts
                </button>
                <button
                  type="button"
                  onClick={() => setPoissonnerieTab('alerts')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${poissonnerieTab === 'alerts' ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/40' : 'text-slate-400 hover:text-white'}`}
                >
                  🔔 Alertes d'Arrivage ({fishAlerts.filter(a => a.status === 'pending').length})
                </button>
              </div>
            </div>

            {/* SUBTAB 1: LOTS & FRAICHEUR */}
            {poissonnerieTab === 'lots' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Add a lot form */}
                <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2.5">
                    <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider">💾 Déclarer un nouvel arrivage</h3>
                    <p className="text-[10px] text-slate-400">Enregistrez un lot de pêche fraîche et mettez à jour votre stock vitrine.</p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!lotProductId || !lotNumberInput || !lotQuantity) {
                        setFormError("Le produit, le numéro de lot et la quantité sont obligatoires.");
                        return;
                      }
                      setFormLoading(true);
                      setFormError('');
                      setFormSuccess('');

                      try {
                        const response = await fetch('/api/poissonnerie/lots', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            productId: lotProductId,
                            supplierName: lotSupplierName,
                            lotNumber: lotNumberInput,
                            arrivalDate: lotArrivalDate,
                            quantity: Number(lotQuantity),
                            unit: lotUnit,
                            freshness: lotFreshness,
                            temperature: lotTemperature,
                            origin: lotOrigin
                          })
                        });

                        if (response.ok) {
                          setFormSuccess(`Nouvel arrivage enregistré ! Le stock de l'article a été incrémenté.`);
                          setLotNumberInput('');
                          setLotQuantity('');
                          onRefreshState();
                        } else {
                          const errData = await response.json();
                          setFormError(errData.error || "Une erreur est survenue lors de l'enregistrement du lot.");
                        }
                      } catch (err: any) {
                        setFormError("Erreur réseau: " + err.message);
                      } finally {
                        setFormLoading(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Poisson / Produit concerné *</label>
                      <select
                        required
                        value={lotProductId}
                        onChange={(e) => setLotProductId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">-- Sélectionner un poisson --</option>
                        {products.filter(p => p.sellerId === user.id).map(p => (
                          <option key={p.id} value={p.id}>{p.title} (Stock: {p.stock} {p.unit || 'kg'})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Numéro de Lot *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: LOT-BAR-202"
                          value={lotNumberInput}
                          onChange={(e) => setLotNumberInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Date d'Arrivée</label>
                        <input
                          type="date"
                          value={lotArrivalDate}
                          onChange={(e) => setLotArrivalDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Quantité Pesée *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Ex: 50"
                          value={lotQuantity}
                          onChange={(e) => setLotQuantity(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Unité</label>
                        <select
                          value={lotUnit}
                          onChange={(e) => setLotUnit(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                        >
                          <option value="kg">kilogrammes (kg)</option>
                          <option value="unité">unités (pces)</option>
                          <option value="douzaine">douzaines</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Fournisseur / Navire de Pêche</label>
                      <input
                        type="text"
                        value={lotSupplierName}
                        onChange={(e) => setLotSupplierName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div className="bg-slate-950/40 p-3 border border-slate-850 rounded-xl space-y-2">
                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block">Conditions bio-sanitaires</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Fraîcheur</label>
                          <select
                            value={lotFreshness}
                            onChange={(e) => setLotFreshness(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-none"
                          >
                            <option value="Extra Frais ✨">Extra Frais ✨</option>
                            <option value="Frais - Lit de glace 🧊">Lit de glace 🧊</option>
                            <option value="Surgelé à bord ❄️">Surgelé à bord ❄️</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Température</label>
                          <input
                            type="text"
                            value={lotTemperature}
                            onChange={(e) => setLotTemperature(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] text-slate-505 text-slate-500 font-bold uppercase mb-0.5">Zone d'origine / Port d'attache</label>
                        <input
                          type="text"
                          placeholder="Zone FAO ou Port autonome"
                          value={lotOrigin}
                          onChange={(e) => setLotOrigin(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold font-sans transition shadow disabled:opacity-50 active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
                    >
                      {formLoading ? "Enregistrement..." : "💾 Enregistrer cet arrivage"}
                    </button>
                  </form>
                </div>

                {/* Lots grid and list */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-300">📋 Registre de Traçabilité active</h3>
                      <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">Liste des lots enregistrés avec indices de fraîcheur et contrôle thermique.</p>
                    </div>
                    <span className="bg-cyan-950 text-cyan-400 border border-cyan-900/30 text-[9px] font-black px-2 py-0.5 rounded-md font-mono">{fishLots.length} LOTS</span>
                  </div>

                  {fishLots.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                      Aucun lot de poissonnerie répertorié. Utilisez le panneau ci-contre pour déclarer votre premier arrivage.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fishLots.map((lot, index) => {
                        const matchedProduct = products.find(p => p.id === lot.productId);
                        return (
                          <div key={lot.id || index} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none"></div>
                            
                            <div className="space-y-1 relative">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] font-mono font-black text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-900/40">{lot.lotNumber}</span>
                                <span className="text-[10px] text-slate-505 text-slate-500 font-mono font-bold">{lot.arrivalDate}</span>
                              </div>
                              <h4 className="text-xs font-black text-white mt-1.5">{matchedProduct ? matchedProduct.title : "Poissonnerie sauvage"}</h4>
                              <p className="text-[10px] text-slate-400 font-medium font-sans flex items-center gap-1">Navire: <strong className="text-slate-200">{lot.supplierName}</strong></p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/50 font-mono text-[10px]">
                              <div className="text-slate-450 uppercase text-[8px] font-sans font-black space-y-0.5">
                                <span>Contrôle thermique</span>
                                <span className="text-white block mt-0.5 text-[10.5px] font-mono">{lot.temperature || 'N/A'}</span>
                              </div>
                              <div className="text-slate-450 uppercase text-[8px] font-sans font-black space-y-0.5">
                                <span>Quantité Initiale</span>
                                <span className="text-cyan-300 block mt-0.5 text-[10.5px] font-mono">{lot.quantity} {lot.unit || 'kg'}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-slate-850/60 font-sans">
                              <span className="text-slate-500">Origine: <strong className="text-slate-300">{lot.origin}</strong></span>
                              <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded-md font-bold tracking-tight text-[9px] border border-emerald-900/30">
                                {lot.freshness}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 2: LOSSES / REBUTS */}
            {poissonnerieTab === 'losses' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to declare loss */}
                <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2.5">
                    <h3 className="text-xs font-black uppercase text-rose-400 tracking-wider">⚠️ Déclarer une Perte de Poisson</h3>
                    <p className="text-[10px] text-slate-400">Si un stock s'abîme ou dépasse le délai de fraîcheur, déduisez-le légalement ici.</p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!lossProductId || !lossQuantity || !lossReason) {
                        setFormError("Le poisson, la quantité et le motif sont requis.");
                        return;
                      }
                      setFormLoading(true);
                      setFormError('');
                      setFormSuccess('');

                      const selectedProd = products.find(p => p.id === lossProductId);
                      const title = selectedProd ? selectedProd.title : "Poisson sauvage";
                      const estimatedCost = selectedProd ? selectedProd.price * Number(lossQuantity) : 0;

                      try {
                        const response = await fetch('/api/poissonnerie/losses', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            productId: lossProductId,
                            productTitle: title,
                            quantity: Number(lossQuantity),
                            unit: lossUnit,
                            reason: lossReason,
                            cost: estimatedCost || Number(lossCost || 0)
                          })
                        });

                        if (response.ok) {
                          setFormSuccess(`Perte enregistrée avec succès. La quantité a été déduite de votre stock vitrine.`);
                          setLossQuantity('');
                          setLossCost('');
                          onRefreshState();
                        } else {
                          const errData = await response.json();
                          setFormError(errData.error || "Une erreur est survenue.");
                        }
                      } catch (err: any) {
                        setFormError("Erreur réseau: " + err.message);
                      } finally {
                        setFormLoading(false);
                      }
                    }}
                    className="space-y-3.5"
                  >
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Poisson concerné</label>
                      <select
                        required
                        value={lossProductId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setLossProductId(id);
                          const sp = products.find(p => p.id === id);
                          if (sp) {
                            setLossUnit(sp.unit || 'kg');
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      >
                        <option value="">-- Sélectionner l'article --</option>
                        {products.filter(p => p.sellerId === user.id).map(p => (
                          <option key={p.id} value={p.id}>{p.title} (Dispo: {p.stock} {p.unit || 'kg'})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Quantité perdue</label>
                        <input
                          type="number"
                          required
                          step="0.1"
                          placeholder="Ex: 2.5"
                          value={lossQuantity}
                          onChange={(e) => setLossQuantity(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Unité</label>
                        <input
                          type="text"
                          disabled
                          value={lossUnit}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Motif du Rebut</label>
                      <select
                        value={lossReason}
                        onChange={(e) => setLossReason(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                      >
                        <option value="Invendu périmé">Invendu périmé / qualité requise dépassée</option>
                        <option value="Altération/Abîmé">Altération / Poisson abîmé</option>
                        <option value="Rupture de froid">Rupture de froid (panne ou incident de stockage)</option>
                        <option value="Autre motif">Autre anomalie de stockage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Coût estimé estimatif (FCFA)</label>
                      <input
                        type="number"
                        placeholder="Calcule d'après prix de vente"
                        value={lossCost}
                        onChange={(e) => setLossCost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none font-mono"
                      />
                      {lossProductId && lossQuantity && (
                        <span className="text-[9.5px] text-slate-500 mt-1 block">
                          Coût théorique basé sur le catalogue : <strong className="text-slate-350">
                            {((products.find(p => p.id === lossProductId)?.price || 0) * Number(lossQuantity)).toLocaleString()} FCFA
                          </strong>
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full py-2 bg-rose-900/40 hover:bg-rose-900 text-rose-200 border border-rose-800/40 rounded-xl text-xs font-bold transition disabled:opacity-50 active:scale-95 flex items-center justify-center space-x-1 border cursor-pointer mt-2"
                    >
                      <span>🔥 Déclarer la Perte</span>
                    </button>
                  </form>
                </div>

                {/* Loss logs list */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-300">📈 Journal des Pertes & Saisies Sanitaires</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Registre officiel des produits déclassés ou jetés pour des motifs d'hygiène et de sécurité.</p>
                    </div>
                    <span className="bg-rose-950/50 text-rose-400 border border-rose-905 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold">
                      {fishLossLogs.reduce((sum, l) => sum + l.cost, 0).toLocaleString()} FCFA Perdus
                    </span>
                  </div>

                  {fishLossLogs.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                      Aucune perte de stock enregistrée récemment. Parfait !
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-inner">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            <th className="py-3 px-4">Poisson</th>
                            <th className="py-3 px-4">Quantité</th>
                            <th className="py-3 px-4">Motif du rebut</th>
                            <th className="py-3 px-4">Coût d'achat perdu</th>
                            <th className="py-3 px-4">Date de saisie</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 font-normal">
                          {fishLossLogs.map((log, index) => (
                            <tr key={log.id || index} className="hover:bg-slate-900/30 transition">
                              <td className="py-3 px-4 font-bold text-white">{log.productTitle}</td>
                              <td className="py-3 px-4 text-cyan-400 font-mono font-semibold">{log.quantity} {log.unit || 'kg'}</td>
                              <td className="py-3 px-4 text-rose-300 font-sans">
                                <span className="inline-block bg-rose-950/40 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-900/30">
                                  {log.reason}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-350 font-mono font-bold text-[11px]">{log.cost ? `${log.cost.toLocaleString()} FCFA` : 'N/A'}</td>
                              <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">{new Date(log.date).toLocaleDateString('fr-FR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 3: ALERTS */}
            {poissonnerieTab === 'alerts' && (
              <div className="space-y-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider">🔔 Abonnés d'Arrivage sur Poisson de Marée</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                      Lorsqu'un client s'abonne à un poisson en rupture de stock, son email reste sur cette liste. Dès que vous enregistrez un lot fraîchement arrivé ci-contre, WeLink transmet instantanément des notifications de retour en stock !
                    </p>
                  </div>
                  <div className="flex bg-slate-950 px-4 py-2 border border-slate-800 rounded-xl space-x-2 font-mono text-xs items-center justify-center shrink-0">
                    <span className="text-slate-500 font-sans uppercase text-[9px] font-black">État :</span>
                    <strong className="text-indigo-305 font-black text-indigo-300">Cliquer l'arrivage envoie automatiquement</strong>
                  </div>
                </div>

                <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <h4 className="text-sm font-bold text-white">Registre des inscriptions reçues</h4>
                    <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold">{fishAlerts.length} inscrits</span>
                  </div>

                  {fishAlerts.length === 0 ? (
                    <div className="text-center p-8 text-slate-550 text-xs italic">
                      Aucune alerte d'arrivage enregistrée pour le moment.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-450 text-[10px] font-black uppercase tracking-wider">
                            <th className="py-3 px-4">Client</th>
                            <th className="py-3 px-4">Adresse E-mail</th>
                            <th className="py-3 px-4">Poisson désiré</th>
                            <th className="py-3 px-4">Statut de notification</th>
                            <th className="py-3 px-4">Date de demande</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {fishAlerts.map((alert, index) => {
                            const matchedProduct = products.find(p => p.id === alert.productId);
                            return (
                              <tr key={alert.id || index} className="hover:bg-slate-900/20 transition font-sans">
                                <td className="py-3 px-4 font-bold text-white">{alert.clientName}</td>
                                <td className="py-3 px-4 text-cyan-400 font-mono font-medium">{alert.buyerEmail}</td>
                                <td className="py-3 px-4 text-slate-350">{matchedProduct ? matchedProduct.title : "Poissonnerie sauvage"}</td>
                                <td className="py-3 px-4">
                                  {alert.status === 'sent' ? (
                                    <span className="inline-flex items-center gap-1 bg-emerald-950/40 text-emerald-300 border border-emerald-900/30 text-[9.5px] font-bold px-2 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                                      Notifié {alert.sentAt ? `(${new Date(alert.sentAt).toLocaleDateString('fr-FR')})` : ''}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-amber-950/40 text-amber-300 border border-amber-900/30 text-[9.5px] font-bold px-2 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                                      En attente d'arrivage
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">{new Date(alert.createdAt).toLocaleString('fr-FR')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: BOUCHERIE - MEATS, WEIGHING, DECOUPE, LOSSES & SUPPLIERS */}
        {activeTab === 'boucherie' && user.enterpriseType === 'boucher' && (
          <div id="business-boucherie-tab" className="space-y-6 animate-fade-in text-slate-100 font-sans">
            <div className="border-b border-slate-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span className="text-rose-500">🥩</span>
                  <span>Espace Gestion Atelier Boucherie</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Pilotez les arrivages de bétail/carcasses, le désossage et la découpe fine, enregistrez les pesées et les pertes au crochet, et suivez les demandes clients.
                </p>
              </div>

              {/* Sub tabs selector */}
              <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setBoucherieTab('lots')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${boucherieTab === 'lots' ? 'bg-rose-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  📦 Arrivages & Viandes
                </button>
                <button
                  type="button"
                  onClick={() => setBoucherieTab('cuts')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${boucherieTab === 'cuts' ? 'bg-rose-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  🔪 Découpe & Transformation
                </button>
                <button
                  type="button"
                  onClick={() => setBoucherieTab('losses')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${boucherieTab === 'losses' ? 'bg-rose-950 text-rose-300 border border-rose-900/40' : 'text-slate-400 hover:text-white'}`}
                >
                  ⚠️ Pertes & Crochet
                </button>
                <button
                  type="button"
                  onClick={() => setBoucherieTab('suppliers')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${boucherieTab === 'suppliers' ? 'bg-emerald-950 text-emerald-300 border border-emerald-900/40' : 'text-slate-400 hover:text-white'}`}
                >
                  🤝 Fournisseurs B2B
                </button>
              </div>
            </div>

            {/* SUBTAB 1: ARRIVAGES & VIANDES (Lots) */}
            {boucherieTab === 'lots' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Declaring meat arrivals (re-weighting) */}
                <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2.5">
                    <h3 className="text-xs font-black uppercase text-rose-400 tracking-wider">⚖️ Déclarer un nouvel arrivage</h3>
                    <p className="text-[10px] text-slate-400">Enregistrez un lot de viande brute pesée à l'entrée et mettez à jour votre stock vitrine.</p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!bLotProductId || !bLotNumberInput || !bLotQuantity) {
                        setFormError("Veuillez sélectionner une viande, saisir un numéro de lot et la quantité pesée.");
                        return;
                      }
                      setFormLoading(true);
                      setFormError('');
                      setFormSuccess('');

                      try {
                        const response = await fetch('/api/boucherie/lots', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            productId: bLotProductId,
                            supplierName: bLotSupplierName,
                            lotNumber: bLotNumberInput,
                            arrivalDate: bLotArrivalDate,
                            quantity: Number(bLotQuantity),
                            unit: bLotUnit,
                            freshness: bLotFreshness,
                            temperature: bLotTemperature,
                            origin: bLotOrigin,
                            veterinaryCert: bLotVeterinaryCert
                          })
                        });

                        if (response.ok) {
                          setFormSuccess(`Nouvel arrivage enregistré ! Le stock a été augmenté de ${bLotQuantity} ${bLotUnit}.`);
                          setBLotNumberInput('');
                          setBLotQuantity('');
                          onRefreshState();
                        } else {
                          const errData = await response.json();
                          setFormError(errData.error || "Une erreur est survenue lors de l'enregistrement de l'arrivage.");
                        }
                      } catch (err: any) {
                        setFormError("Erreur de connexion : " + err.message);
                      } finally {
                        setFormLoading(false);
                      }
                    }}
                    className="space-y-3 font-sans text-left"
                  >
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Viande / Produit Vitrine *</label>
                      <select
                        required
                        value={bLotProductId}
                        onChange={(e) => setBLotProductId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      >
                        <option value="">-- Sélectionner l'article --</option>
                        {products.filter(p => p.sellerId === user.id).map(p => (
                          <option key={p.id} value={p.id}>{p.title} (Vitrine: {p.stock} {p.unit || 'kg'})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Lot / Traçabilité *</label>
                        <input
                          type="text"
                          required
                          placeholder="LOT-BOEUF-902"
                          value={bLotNumberInput}
                          onChange={(e) => setBLotNumberInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Fournisseur</label>
                        <input
                          type="text"
                          placeholder="La Ferme des Savanes"
                          value={bLotSupplierName}
                          onChange={(e) => setBLotSupplierName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Poids Pesé * (kg/g)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Ex: 50"
                          value={bLotQuantity}
                          onChange={(e) => setBLotQuantity(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-105 text-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Unité</label>
                        <select
                          value={bLotUnit}
                          onChange={(e) => setBLotUnit(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                        >
                          <option value="kg">kg (Kilo)</option>
                          <option value="unité">unité</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Certificat Vétérinaire / Sanitaire</label>
                      <input
                        type="text"
                        placeholder="Ex: Certificat N° 4492-Yaoundé"
                        value={bLotVeterinaryCert}
                        onChange={(e) => setBLotVeterinaryCert(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono text-rose-300"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Temp. de Pesage</label>
                        <input
                          type="text"
                          placeholder="Ex: 2°C"
                          value={bLotTemperature}
                          onChange={(e) => setBLotTemperature(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-101 focus:outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Origine de l'Élevage</label>
                        <input
                          type="text"
                          placeholder="Ex: Bouaké Savanes"
                          value={bLotOrigin}
                          onChange={(e) => setBLotOrigin(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Date d'Abattage / Réception</label>
                      <input
                        type="date"
                        value={bLotArrivalDate}
                        onChange={(e) => setBLotArrivalDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">État des viandes</label>
                      <select
                        value={bLotFreshness}
                        onChange={(e) => setBLotFreshness(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100' focus:outline-none focus:border-rose-500"
                      >
                        <option value="Frais - Abattu récemment 🥩">Frais - Abattu récemment 🥩</option>
                        <option value="Maturé 14 jours 🥩">Maturé 14 jours 🥩</option>
                        <option value="Maturé 21 jours 🥩">Maturé 21 jours 🥩</option>
                        <option value="Congelé Sec (Grand Froid) ❄️">Congelé Sec (Grand Froid) ❄️</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full py-2.5 bg-rose-700 hover:bg-rose-600 disabled:bg-rose-900/60 transition font-bold text-white text-xs uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {formLoading ? 'Arrivage en cours...' : '💾 Enregistrer la Pesée d\'Arrivée'}
                    </button>
                  </form>
                </div>

                {/* Show active arrivals register and current inventory analysis */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Quick stats board */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-left">
                      <span className="block text-[9.5px] uppercase font-black tracking-wider text-slate-400">Total Arrivages (Poids)</span>
                      <span className="text-[21px] font-black text-rose-400 font-mono mt-0.5 block">
                        {butcherLots.reduce((sum, lot) => sum + lot.quantity, 0).toLocaleString()} kg
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">Matière brute brute pesée au crochet</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-left">
                      <span className="block text-[9.5px] uppercase font-black tracking-wider text-slate-400">Alertes Viandes Faibles</span>
                      <span className="text-[21px] font-black text-rose-400 font-mono mt-0.5 block">
                        {products.filter(p => p.sellerId === user.id && p.stock < 10).length} coupes
                      </span>
                      <span className="text-[9px] text-slate-500 block">Stock inférieur à 10 kg</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-left">
                      <span className="block text-[9.5px] uppercase font-black tracking-wider text-slate-400">Maturité Moyenne</span>
                      <span className="text-[21px] font-black text-amber-500 font-mono mt-0.5 block">14.5 jours</span>
                      <span className="text-[9px] text-slate-500 block">Chambre de maturation active</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-2xl border border-slate-850 p-5 text-left">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">🥩 Registre de Traçabilité des carcasses & quartiers</h3>
                      <span className="text-[10px] font-mono text-slate-500">{butcherLots.length} arrivées répertoriées</span>
                    </div>

                    {butcherLots.length === 0 ? (
                      <p className="text-center text-xs py-10 text-slate-400">Aucun lot de viande brut enregistré. Utilisez le panneau de gauche.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-bold">
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Numéro Lot</th>
                              <th className="py-2.5 px-3">Viande Cible</th>
                              <th className="py-2.5 px-3">Poids Pesé</th>
                              <th className="py-2.5 px-3">Provenance (Élevage)</th>
                              <th className="py-2.5 px-3">Qualité / Certificat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {butcherLots.map((lot) => {
                              const matchedProduct = products.find(p => p.id === lot.productId);
                              return (
                                <tr key={lot.id} className="border-b border-slate-800/55 hover:bg-slate-900/40 text-slate-300">
                                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{lot.arrivalDate}</td>
                                  <td className="py-3 px-3"><span className="font-mono font-bold bg-slate-900 px-2 py-0.5 border border-slate-800/80 rounded text-rose-400">{lot.lotNumber}</span></td>
                                  <td className="py-3 px-3 text-slate-100 font-semibold">{matchedProduct ? matchedProduct.title : "Viande artisanale"}</td>
                                  <td className="py-3 px-3 font-mono font-black text-rose-300">{lot.quantity} {lot.unit || 'kg'}</td>
                                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                                    <div className="font-bold">{lot.supplierName}</div>
                                    <div className="text-[10px] text-slate-500">{lot.origin}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="text-[11px] text-slate-200">{lot.freshness}</div>
                                    <div className="text-[10px] text-emerald-400 font-mono font-semibold">🛡️ {lot.veterinaryCert}</div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2: DECOUPE & TRANSFORMATION (Workshop) */}
            {boucherieTab === 'cuts' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                {/* Cutting order processing form */}
                <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2.5">
                    <h3 className="text-xs font-black uppercase text-rose-400 tracking-wider">🔪 Émulation Fiche de Découpe & Transformation</h3>
                    <p className="text-[10px] text-slate-400">Déclarez les opérations de transformation de carcasse brute en quartiers marchands.</p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!bCutSourceCarcass || !bCutTargetProductId || !bCutTargetWeight) {
                        setFormError("Veuillez sélectionner la pièce d'origine, le produit vitrine d'arrivée et le poids fini.");
                        return;
                      }
                      setFormLoading(true);
                      setFormError('');
                      setFormSuccess('');

                      const computedLoss = Math.max(0, Number(bCutSourceWeight || 0) - Number(bCutTargetWeight));

                      try {
                        const response = await fetch('/api/boucherie/cuts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sourceCarcass: bCutSourceCarcass,
                            sourceWeight: Number(bCutSourceWeight || 0),
                            targetProductId: bCutTargetProductId,
                            targetWeight: Number(bCutTargetWeight),
                            lossWeight: computedLoss,
                            piecesCount: Number(bCutPiecesCount || 1),
                            operator: bCutOperator
                          })
                        });

                        if (response.ok) {
                          setFormSuccess(`Découpe enregistrée ! Le stock a été crédité et la perte de parage a été calculée (${computedLoss.toFixed(2)} kg).`);
                          setBCutSourceWeight('');
                          setBCutTargetWeight('');
                          onRefreshState();
                        } else {
                          const errData = await response.json();
                          setFormError(errData.error || "Une erreur est survenue lors de l'enregistrement de l'opération.");
                        }
                      } catch (err: any) {
                        setFormError("Erreur : " + err.message);
                      } finally {
                        setFormLoading(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Carcasse ou Pièce de Gros d'Origine</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Demi-Carcasse de Bœuf #45"
                        value={bCutSourceCarcass}
                        onChange={(e) => setBCutSourceCarcass(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Poids Brut Carcasse (kg)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Ex: 140"
                          value={bCutSourceWeight}
                          onChange={(e) => setBCutSourceWeight(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nombre pièces coupées</label>
                        <input
                          type="number"
                          placeholder="Ex: 20"
                          value={bCutPiecesCount}
                          onChange={(e) => setBCutPiecesCount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-800/60 my-2 pt-2 space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-emerald-400 mb-1">🛍️ Produit Vitrine Cible Finition</label>
                        <select
                          required
                          value={bCutTargetProductId}
                          onChange={(e) => setBCutTargetProductId(e.target.value)}
                          className="w-full bg-slate-950 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                        >
                          <option value="">-- Sélectionner l'article fini --</option>
                          {products.filter(p => p.sellerId === user.id).map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-emerald-400 mb-1">Poids Fini Commercialisé (kg)</label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Ex: 110"
                            value={bCutTargetWeight}
                            onChange={(e) => setBCutTargetWeight(e.target.value)}
                            className="w-full bg-slate-950 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-rose-400 mb-1">Déchets de parage estimé (kg)</label>
                          <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-rose-300 font-mono font-bold">
                            {Number(bCutSourceWeight) && Number(bCutTargetWeight) 
                              ? (Math.max(0, Number(bCutSourceWeight) - Number(bCutTargetWeight))).toFixed(2) + " kg"
                              : "Calcul auto..."}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Artisan Boucher Opérateur</label>
                      <input
                        type="text"
                        required
                        value={bCutOperator}
                        onChange={(e) => setBCutOperator(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full py-2.5 bg-rose-700 hover:bg-rose-600 disabled:bg-rose-900/60 transition font-bold text-white text-xs uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {formLoading ? 'Traitement...' : '🔪 Valider et créditer la vitrine'}
                    </button>
                  </form>
                </div>

                {/* Cutting list log and Custom requests of buyers */}
                <div className="lg:col-span-7 space-y-4">
                  {/* CLIENT SPECIAL CUTTING REQUEST LOGS - VERY POWERFUL! */}
                  <div className="bg-slate-950 rounded-2xl border border-rose-900/30 p-5">
                    <div className="flex items-center justify-between border-b border-rose-900/30 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">🙋‍♂️</span>
                        <h3 className="text-xs font-black uppercase text-rose-400 tracking-wider">Demandes de Découpe Personnalisées de vos clients</h3>
                      </div>
                      <span className="bg-rose-950 text-rose-300 border border-rose-900/40 text-[9px] font-bold px-2 py-0.5 rounded">Vente au poids</span>
                    </div>

                    {(() => {
                      // Filter incoming orders for meat products that have cutting selections or we can display all orders for this boucher to allow custom cuts actioning
                      const myBoucherOrders = orders.filter(o => o.sellerId === user.id);
                      if (myBoucherOrders.length === 0) {
                        return <p className="text-xs text-slate-400 py-6 text-center">Aucune commande client active pour l'instant.</p>;
                      }

                      return (
                        <div className="space-y-2.5">
                          {myBoucherOrders.map((o) => {
                            // Let's randomize a cut type if not fully defined to present gorgeous demo data:
                            const typeDecoupe = o.paymentMethod?.includes('Orange') ? 'Effeuillé fin premium (Carpaccio) 🥩' : 'Haché à la commande 🩸';
                            return (
                              <div key={o.id} className="p-3 bg-slate-900/85 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-rose-900/30 transition">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">CMD #{o.id.substring(0, 5)}</span>
                                    <span className="text-xs font-bold text-slate-200">{o.buyerName}</span>
                                  </div>
                                  <p className="text-xs text-rose-300 font-semibold">{o.productTitle} • <span className="text-white font-black">{o.quantity} kg</span></p>
                                  <div className="text-[10.5px] bg-amber-950/40 border border-amber-900/40 text-amber-300 p-1.5 rounded flex items-center gap-1.5 font-mono">
                                    <span>🪓 Découpe demandée :</span>
                                    <span className="font-bold text-white">{typeDecoupe}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 self-start md:self-center">
                                  <button
                                    onClick={() => alert(`Découpe préparée avec soin pour la commande #${o.id}. Les morceaux sont empaquetés sous vide.`)}
                                    className="px-2.5 py-1.5 bg-slate-850 hover:bg-rose-900/30 border border-slate-800 hover:border-rose-900/50 rounded-lg text-[10px] font-bold text-rose-300 transition cursor-pointer"
                                  >
                                    🩸 Prêt à découper
                                  </button>
                                  <span className="text-[9.5px] text-slate-500 font-mono">{o.scheduledTime ? `Prévu : ${o.scheduledTime}` : 'Retrait rapide'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Registered cuts list */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-850 p-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">📋 Journal des transformations d'atelier</h3>
                      <span className="text-[10px] font-mono text-slate-500">{butcherCuts.length} opérations enregistrées</span>
                    </div>

                    {butcherCuts.length === 0 ? (
                      <p className="text-center text-xs py-6 text-slate-400">Aucun log de transformation pour l'instant.</p>
                    ) : (
                      <div className="space-y-2">
                        {butcherCuts.map((cut) => {
                          const product = products.find(p => p.id === cut.targetProductId);
                          const yieldEfficiency = cut.sourceWeight ? ((cut.targetWeight / cut.sourceWeight) * 100).toFixed(1) : '100';

                          return (
                            <div key={cut.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed">
                              <div>
                                <span className="text-[10px] bg-rose-950 text-rose-400 font-bold px-1.5 py-0.5 rounded block w-max mb-1">
                                  {yieldEfficiency}% Rendement utile
                                </span>
                                <p className="font-bold text-slate-200">
                                  Transformation de : <span className="font-mono text-rose-300">{cut.sourceCarcass} ({cut.sourceWeight} kg)</span>
                                </p>
                                <p className="text-slate-400 text-[11px] mt-0.5">
                                  Produit fini : <strong className="text-white">{product ? product.title : 'Viande Vitrine'}</strong> • <span className="font-mono text-emerald-400 font-bold">{cut.targetWeight} kg obtenus</span> ({cut.piecesCount} parts)
                                </p>
                              </div>
                              <div className="text-right sm:text-right text-[10px] text-slate-500 space-y-0.5">
                                <p className="font-semibold text-slate-400">🧑‍🍳 {cut.operator}</p>
                                <p className="font-mono">{cut.date ? new Date(cut.date).toLocaleString('fr-FR') : 'Date inconnue'}</p>
                                <p className="text-rose-400 font-mono font-bold">Chutes: {cut.lossWeight} kg</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: GESTION DES PERTES (Losses) */}
            {boucherieTab === 'losses' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                {/* Declaring raw meat wastage/spoils */}
                <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2.5">
                    <h3 className="text-xs font-black uppercase text-rose-400 tracking-wider">⚠️ Enregistrer une perte / Freinte</h3>
                    <p className="text-[10px] text-slate-400">Déclarez les viandes périmées, invendus, chutes d'os jetées ou défaillances de frigo.</p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!bLossProductId || !bLossQuantity || !bLossReason) {
                        setFormError("Veuillez remplir les informations obligatoires de perte.");
                        return;
                      }
                      setFormLoading(true);
                      setFormError('');
                      setFormSuccess('');

                      const selectedProduct = products.find(p => p.id === bLossProductId);
                      const cost = Number(bLossCost) || (selectedProduct ? selectedProduct.price * Number(bLossQuantity) : 0);

                      try {
                        const response = await fetch('/api/boucherie/losses', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            productId: bLossProductId,
                            productTitle: selectedProduct ? selectedProduct.title : "Viande artisanale",
                            quantity: Number(bLossQuantity),
                            unit: bLossUnit,
                            reason: bLossReason,
                            cost
                          })
                        });

                        if (response.ok) {
                          setFormSuccess(`Perte enregistrée avec succès. ${bLossQuantity} kg déduits du stock commercialisable.`);
                          setBLossQuantity('');
                          setBLossCost('');
                          onRefreshState();
                        } else {
                          const errData = await response.json();
                          setFormError(errData.error || "Une erreur est survenue lors de l'enregistrement de la perte.");
                        }
                      } catch (err: any) {
                        setFormError("Erreur : " + err.message);
                      } finally {
                        setFormLoading(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Viande concernée *</label>
                      <select
                        required
                        value={bLossProductId}
                        onChange={(e) => setBLossProductId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-101 focus:outline-none focus:border-rose-500"
                      >
                        <option value="">-- Sélectionner l'article --</option>
                        {products.filter(p => p.sellerId === user.id).map(p => (
                          <option key={p.id} value={p.id}>{p.title} (Vitrine: {p.stock} kg)</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Poids perdu (kg) *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Ex: 2.5"
                          value={bLossQuantity}
                          onChange={(e) => setBLossQuantity(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Unité</label>
                        <select
                          value={bLossUnit}
                          onChange={(e) => setBLossUnit(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                        >
                          <option value="kg">kg</option>
                          <option value="unité">unité</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-450 text-rose-300 mb-1">Motif du déchet / de la freinte *</label>
                      <select
                        value={bLossReason}
                        onChange={(e) => setBLossReason(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      >
                        <option value="Altération de couleur/odeur ⚠️">Altération de couleur/odeur ⚠️</option>
                        <option value="Chute de température (Panne vitrine) ❄️">Chute de température (Panne vitrine) ❄️</option>
                        <option value="Parures et chutes de découpe (Trim non commercialisable) 🔪">Parures et chutes de découpe (Trim non commercialisable) 🔪</option>
                        <option value="Invendu périmé ⏳">Invendu périmé ⏳</option>
                        <option value="Vol / Casse comptoir">Vol / Casse comptoir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Coût financier estimé (CFA)</label>
                      <input
                        type="number"
                        placeholder="Laisser vide pour calcul auto"
                        value={bLossCost}
                        onChange={(e) => setBLossCost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono font-bold text-rose-300"
                      />
                      <span className="text-[9px] text-slate-500 italic block mt-1">Calculé sur la base du d'achat de la viande s'il n'est pas spécifié.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full py-2.5 bg-rose-950 border border-rose-900/60 hover:bg-rose-900 text-rose-300 transition font-bold text-xs uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {formLoading ? 'Enregistrement...' : '⚠️ Déduire et loger en perte'}
                    </button>
                  </form>
                </div>

                {/* Loss logs and charts emulator list */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/20">
                      <span className="block text-[9.5px] uppercase font-black tracking-wider text-rose-400">Pertes de viandes cumulées</span>
                      <strong className="text-[22px] font-black text-rose-300 font-mono block mt-1">
                        {butcherLossLogs.reduce((sum, item) => sum + item.quantity, 0).toFixed(1)} kg
                      </strong>
                      <span className="text-[9px] text-slate-500 mt-1 block">Déduit automatiquement pour l'inventaire</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/20">
                      <span className="block text-[9.5px] uppercase font-black tracking-wider text-rose-450 text-slate-400">Coût Financier des pertes</span>
                      <strong className="text-[22px] font-black text-rose-400 font-mono block mt-1">
                        {butcherLossLogs.reduce((sum, item) => sum + item.cost, 0).toLocaleString()} F
                      </strong>
                      <span className="text-[9px] text-rose-400/70 mt-1 block">Perte de valeur marchande</span>
                    </div>
                  </div>

                  {/* Registered loss logs register */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-850 p-5">
                    <div className="flex items-center justify-between border-b border-rose-955 border-slate-800 pb-3 mb-4">
                      <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">📋 Journal des Pertes au Crochet & Écarts</h3>
                      <span className="text-[10px] font-mono text-slate-500">{butcherLossLogs.length} logs d'écarts</span>
                    </div>

                    {butcherLossLogs.length === 0 ? (
                      <p className="text-center text-xs py-10 text-slate-400 font-bold">Aucune perte de viande signalée. Votre chaîne reste optimale !</p>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {butcherLossLogs.map((log) => {
                          return (
                            <div key={log.id} className="p-3 bg-slate-905 bg-rose-950/20 border-2 border-rose-950/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                              <div>
                                <span className="text-[9px] font-mono bg-rose-950 text-rose-400 font-bold border border-rose-900/50 px-2 py-0.5 rounded">
                                  {log.reason}
                                </span>
                                <h4 className="font-bold text-slate-200 mt-1">{log.productTitle}</h4>
                                <p className="text-slate-400 text-[10px] font-mono">{log.date ? new Date(log.date).toLocaleString('fr-FR') : ''}</p>
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-bold text-rose-300 block">{log.quantity} {log.unit || 'kg'}</span>
                                <span className="text-rose-500 text-[10px] font-bold">-{log.cost.toLocaleString()} FCFA</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4: SUPPLIERS B2B (Breeders, farms, b2b catalogs) */}
            {boucherieTab === 'suppliers' && (
              <div className="space-y-6 text-left">
                <div className="bg-slate-950 rounded-2xl border border-slate-850 p-5">
                  <div className="border-b border-slate-800 pb-3 mb-4">
                    <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">🌾 Répertoire d'Éleveurs & Coopératives B2B Partenaires</h3>
                    <p className="text-[10.5px] text-slate-400">Achetez vos bovins, ovins, carcasses entières et pièces de gros à nos éleveurs authentiques certifiés.</p>
                  </div>

                  {/* Connected suppliers card layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Supplier card 1: La Ferme des Savanes */}
                    <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900/30">🐴 Élevage Pastoral</span>
                          <span className="text-xs text-slate-500 font-semibold font-mono">ID: s3</span>
                        </div>
                        <h4 className="font-bold text-white text-base">La Ferme des Savanes</h4>
                        <p className="text-xs text-slate-350 leading-relaxed font-semibold text-slate-300">
                          Élevage responsable de volailles de brousse, chèvres, lapins, et carcasses de jeunes agneaux ou d'ovins en plein air.
                        </p>
                        <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                          <p>📍 Garoua, Cameroun</p>
                          <p>📞 +237 699 09 09 09</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert("Restock automatique : Fiche de passation de commande B2B ouverte. Envoyez vos exigences en kg et vos chartes de coupe.")}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow transition active:scale-95 cursor-pointer"
                      >
                        🌾 Demander un devis agro-viande
                      </button>
                    </div>

                    {/* Supplier card 2: Gérard l'Agriculteur */}
                    <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900/30">🥕 Aliments & Fourrage</span>
                          <span className="text-xs text-slate-500 font-mono">ID: s1</span>
                        </div>
                        <h4 className="font-bold text-white text-base">Gérard l'Agriculteur</h4>
                        <p className="text-xs text-slate-350 leading-relaxed font-semibold text-slate-300">
                          Fourniture de tubercules d'excellence, de racines d'Afrique et de fourrage/céréales de premier choix pour alimenter sainement les troupeaux.
                        </p>
                        <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                          <p>📍 Foumban, Cameroun</p>
                          <p>📞 +237 677 02 03 04</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert("Contact Fournisseur Gérard en direct pour commande de céréales herbeuses.")}
                        className="w-full py-2 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-800 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-300 transition cursor-pointer"
                      >
                        📞 Entrer en contact
                      </button>
                    </div>

                    {/* Supplier card 3: L'Abattoir National */}
                    <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-[10px] font-black uppercase text-rose-450 text-rose-300 tracking-widest bg-rose-955 bg-rose-950 px-2 py-0.5 rounded border border-rose-900/30">🔬 Service Sanitaire</span>
                          <span className="text-xs text-slate-500 font-mono font-bold">A-44</span>
                        </div>
                        <h4 className="font-bold text-white text-base">Syndicat des Abattoirs de Douala (SAD)</h4>
                        <p className="text-xs text-slate-350 leading-relaxed font-semibold text-slate-300">
                          Pièces de gros découpées sous contrôle vétérinaire constant. Fournit les certificats sanitaires officiels requis pour la législation.
                        </p>
                        <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                          <p>📍 Douala Bonabéri, Cameroun</p>
                          <p>📞 +237 233 44 55 66</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert("Consulter la liste officielle des vétérinaires en exercice et obtenir les d'agrément actuels.")}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                      >
                        📜 Télécharger la Charte Véterinaire
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: STOCKS & CUISINE FOR RESTAURANTS */}
        {activeTab === 'stocks' && user.enterpriseType === 'restaurant' && (
          <div id="business-stocks-tab" className="space-y-6 animate-fade-in text-slate-100">
            <div className="border-b border-slate-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  <span>Espace Stocks & Cuisine (Ingrédients)</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Gerez vos matieres premieres, ingredients frais et ustensiles. Le stock augmente automatiquement lorsque vos achats B2B ou au supermarche sont confirmes livres !
                </p>
              </div>
            </div>

            {/* Micro KPI Cards for Stocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Nombre d'ingredients</span>
                <span className="text-xl font-bold text-white">
                  {enterpriseStocks.filter(s => s.buyerId === user.id).length}
                </span>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Alerte Stock Bas (Critique)</span>
                <span className="text-xl font-bold text-red-400">
                  {enterpriseStocks.filter(s => s.buyerId === user.id && s.quantity < 5).length} Ingredients
                </span>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Derniere Mise a Jour</span>
                <span className="text-xs font-mono text-amber-400 block mt-1.5">Mise à jour en temps réel</span>
              </div>
            </div>

            {/* List of active stocked products */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Mon Inventaire Sec & Frais en Cuisine ({enterpriseStocks.filter(s => s.buyerId === user.id).length})
              </h3>

              {(() => {
                const currentStocks = enterpriseStocks.filter(s => s.buyerId === user.id);
                if (currentStocks.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-500 border border-dashed border-slate-850 rounded-2xl bg-slate-950/20">
                      <p className="text-sm">Votre espace de stockage est actuellement vide.</p>
                      <p className="text-xs text-slate-600 mt-1">Faites des achats dans le "Marché / Supermarché" ou "Approvisionner" pour ajouter vos premiers ingrédients !</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentStocks.map((item) => {
                      const isLow = item.quantity < 5;
                      const manualQty = adjustQtys[item.id] !== undefined ? adjustQtys[item.id] : item.quantity;

                      return (
                        <div key={item.id} className={`p-4 rounded-2xl bg-slate-950/60 border transition flex flex-col justify-between ${isLow ? 'border-red-900/40 shadow-red-955/10 shadow-lg' : 'border-slate-850 hover:border-slate-800'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">
                                {item.category.toLowerCase().includes('volaille') || item.title.toLowerCase().includes('poulet') ? '🍗' : 
                                 item.title.toLowerCase().includes('poisson') ? '🐟' : 
                                 item.title.toLowerCase().includes('manioc') || item.category.toLowerCase().includes('tubercule') ? '🥔' :
                                 item.category.toLowerCase().includes('legume') || item.title.toLowerCase().includes('tomate') ? '🍅' : '📦'}
                              </span>
                              <div>
                                <h4 className="font-bold text-sm text-slate-200">{item.title}</h4>
                                <span className="text-[10px] text-slate-500 font-semibold">{item.category} • {item.unit}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-black font-mono block ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                                {item.quantity} {item.unit}
                              </span>
                              {isLow && <span className="text-[9px] bg-red-950/60 text-red-400 px-1.5 py-0.5 rounded font-black uppercase inline-block mt-1 animate-pulse">🔥 Stock critique</span>}
                            </div>
                          </div>

                          {/* Controls to adjust stock */}
                          <div className="border-t border-slate-900/60 pt-3 mt-4 flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Ajuster:</span>
                              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 h-8">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextVal = Math.max(0, manualQty - 1);
                                    setAdjustQtys(prev => ({ ...prev, [item.id]: nextVal }));
                                  }}
                                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-bold"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={manualQty}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setAdjustQtys(prev => ({ ...prev, [item.id]: val }));
                                  }}
                                  className="w-10 text-center bg-transparent border-0 text-white text-xs font-bold p-0 focus:ring-0 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextVal = manualQty + 1;
                                    setAdjustQtys(prev => ({ ...prev, [item.id]: nextVal }));
                                  }}
                                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-bold"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSaveStockAdjust(item.id, manualQty)}
                                className="bg-violet-600/40 hover:bg-violet-600 text-violet-200 hover:text-white text-[10px] px-2.5 py-1.5 h-8 rounded-lg font-bold transition cursor-pointer"
                              >
                                Modifier ✓
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteStock(item.id)}
                              className="p-1 px-2 border border-red-950 hover:bg-red-950 text-red-500 hover:text-red-400 rounded-lg text-[10px] transition font-bold"
                              title="Retirer"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB: MARKET SHOPPING FOR RESTAURANTS */}
        {activeTab === 'market-shop' && user.enterpriseType === 'restaurant' && (
          <div id="business-market-shop-tab" className="space-y-6 animate-fade-in text-slate-100">
            <div className="border-b border-slate-800/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-pink-400" />
                  <span>Caisse d'Achats - Supermarche & Marche local</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Faites vos courses d'ingredients auprès des supermarches et marches locaux de la plateforme, exactement comme vos propres clients !
                </p>
              </div>
              
              {/* Micro Shopping Basket Status */}
              <div className="shrink-0 bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center space-x-3.5">
                <div>
                  <span className="block text-[9px] text-slate-550 font-bold uppercase">Articles de cuisine</span>
                  <span className="inline-block text-xs font-black text-pink-400">
                    {Object.values(shopCart).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0)} elements
                  </span>
                </div>
                {Object.values(shopCart).some((q: any) => (Number(q) || 0) > 0) && (
                  <button
                    onClick={handleCheckoutShop}
                    className="bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg cursor-pointer transition"
                  >
                    Valider le Panier
                  </button>
                )}
              </div>
            </div>

            {/* Shopping List Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main Shelf Products Grid */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center space-x-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                  <input
                    type="text"
                    placeholder="Rechercher des graines, légumes, viandes, boissons, paniers de manioc..."
                    value={shopSearchQuery}
                    onChange={(e) => setShopSearchQuery(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-205 placeholder-slate-600 focus:outline-none"
                  />
                  <X className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer" onClick={() => setShopSearchQuery('')} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(() => {
                    const shelfProducts = products.filter(p => {
                      const matchesMockedSellers = p.sellerType === 'entreprise' && (
                        p.id.includes('demo-marche') || 
                        p.id.includes('demo-alimentation') || 
                        p.sellerName.toLowerCase().includes('marche') ||
                        p.sellerName.toLowerCase().includes('marché') ||
                        p.sellerName.toLowerCase().includes('panier') ||
                        p.sellerName.toLowerCase().includes('épicerie') ||
                        p.sellerName.toLowerCase().includes('plateau') ||
                        p.sellerName.toLowerCase().includes('market') ||
                        p.category === 'Légumes' || 
                        p.category === 'Fruits' || 
                        p.category === 'Alimentation' || 
                        p.category === 'Épices' || 
                        p.category === 'Boissons'
                      );
                      const matchesSearch = p.title.toLowerCase().includes(shopSearchQuery.toLowerCase()) || p.category.toLowerCase().includes(shopSearchQuery.toLowerCase());
                      return matchesMockedSellers && matchesSearch;
                    });

                    if (shelfProducts.length === 0) {
                      return (
                        <div className="sm:col-span-2 text-center py-12 text-slate-500 text-xs">
                          Aucun aliment correspondant trouve. Essayez une autre recherche !
                        </div>
                      );
                    }

                    return shelfProducts.map((p) => {
                      const cartQty = shopCart[p.id] || 0;

                      return (
                        <div key={p.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex flex-col justify-between hover:border-pink-900/40 transition hover:scale-[1.015] hover:shadow-lg hover:shadow-pink-950/20 shadow">
                          <div>
                            {p.imageUrl && (
                              <div className="w-full h-24 rounded-lg overflow-hidden mb-2.5 bg-slate-900">
                                <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <div className="flex justify-between text-[10px] items-center text-slate-500 mb-1.5">
                              <span className="bg-pink-950/40 text-pink-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{p.category}</span>
                              <span className="truncate max-w-[120px]" title={p.sellerName}>{p.sellerName}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-200">{p.title}</h4>
                            <p className="text-[11px] text-slate-450 mt-1 max-h-[40px] overflow-hidden truncate leading-relaxed">{p.description}</p>
                          </div>

                          <div className="border-t border-slate-900/60 pt-2.5 mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-extrabold text-slate-100">{p.price.toLocaleString()} FCFA</span>
                              <span className="text-[10px] text-slate-550">Unite: {p.unit || 'unités'} ({p.stock} dispo)</span>
                            </div>

                            <div className="flex items-center justify-between gap-2.5">
                              {cartQty > 0 ? (
                                <div className="flex items-center justify-between w-full bg-slate-900 border border-slate-850 p-1 rounded-xl h-8">
                                  <button
                                    type="button"
                                    onClick={() => setShopCart(prev => ({ ...prev, [p.id]: Math.max(0, cartQty - 1) }))}
                                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:bg-slate-800 rounded font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-black text-slate-100">{cartQty}</span>
                                  <button
                                    type="button"
                                    onClick={() => setShopCart(prev => ({ ...prev, [p.id]: Math.min(p.stock, cartQty + 1) }))}
                                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:bg-slate-800 rounded font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShopCart(prev => ({ ...prev, [p.id]: 1 }))}
                                  disabled={p.stock <= 0}
                                  className="w-full bg-pink-900/40 hover:bg-pink-600 text-pink-200 hover:text-white text-[11px] font-bold py-1.5 rounded-lg border border-pink-900/30 transition cursor-pointer"
                                >
                                  {p.stock <= 0 ? 'Stock Epuise' : 'Ajouter au Panier'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Basket tracking & Orders tracking list */}
              <div className="lg:col-span-4 space-y-6">
                {/* Active Basket Panel */}
                <div className="bg-slate-950 p-4 rounded-3xl border border-slate-850 relative">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-pink-400" />
                    <span>Mon Panier Actuel</span>
                  </h3>

                  {Object.entries(shopCart).filter(([_, qty]) => (qty as number) > 0).length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-6 text-center italic">Le panier est vide</p>
                  ) : (
                    <div className="space-y-3 font-sans">
                      <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                        {Object.entries(shopCart).filter(([_, qty]) => (qty as number) > 0).map(([prodId, qty]) => {
                          const p = products.find(p => p.id === prodId);
                          if (!p) return null;
                          const currentQty = qty as number;
                          return (
                            <div key={prodId} className="flex justify-between items-center text-xs bg-slate-900 p-2 rounded-xl">
                              <div className="truncate pr-2">
                                <span className="font-semibold text-slate-300 block truncate">{p.title}</span>
                                <span className="text-[10px] text-slate-505">{(p.price * currentQty).toLocaleString()} FCFA</span>
                              </div>
                              <span className="text-xs text-pink-400 font-bold shrink-0 font-mono">x{currentQty}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-800 pt-2.5 flex justify-between items-center text-xs text-slate-300">
                        <span>Total estime:</span>
                        <span className="font-extrabold text-pink-400">
                          {Object.entries(shopCart).reduce((sum, [pId, qty]) => {
                            const p = products.find(p => p.id === pId);
                            return sum + (p ? p.price * (qty as number) : 0);
                          }, 0).toLocaleString()} FCFA
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCheckoutShop}
                        className="w-full bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2 rounded-xl text-xs transition shadow-lg cursor-pointer"
                      >
                        Valider et commander d'urgence
                      </button>
                    </div>
                  )}
                </div>

                {/* Purchases tracking */}
                <div className="bg-slate-950/60 p-4 rounded-3xl border border-slate-850 shadow space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <Truck className="w-3.5 h-3.5 text-pink-400" />
                    <span>Mes commandes passees</span>
                  </h3>

                  {(() => {
                    const shopOrders = orders.filter(o => o.buyerId === user.id);
                    if (shopOrders.length === 0) {
                      return <p className="text-[11px] text-slate-550 text-center py-4">Aucune commande n'a été passée.</p>;
                    }

                    return (
                      <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                        {shopOrders.map((o) => {
                          const isDelivered = o.status === 'delivered';
                          return (
                            <div key={o.id} className="bg-slate-900 p-3 rounded-xl border border-slate-850/60 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="text-[11px] font-bold text-slate-200 truncate">{o.productTitle}</h4>
                                  <span className="text-[10px] text-slate-500 block truncate">Vendeur: {o.sellerName}</span>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 ${
                                  o.status === 'delivered' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' :
                                  o.status === 'shipped' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/50' :
                                  o.status === 'accepted' ? 'bg-blue-950 text-blue-400 border border-blue-900/50' :
                                  'bg-amber-950 text-amber-405 border border-amber-900/40'
                                }`}>
                                  {o.status === 'delivered' ? '✓ Reçu / Livré' : 
                                   o.status === 'shipped' ? '🚚 Expédié' :
                                   o.status === 'accepted' ? '✓ Accepté' : '⌛ En attente'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                <span>Quantite: <strong className="text-white">{o.quantity}</strong></span>
                                <span>Total: <strong className="text-pink-400">{(o.price * o.quantity).toLocaleString()} F</strong></span>
                              </div>

                              {!isDelivered ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!confirm("Avez-vous bien reçu cette livraison ? Cela ajoutera automatiquement les ingrédients à votre stock !")) return;
                                    try {
                                      const response = await fetch(`/api/orders/${o.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'delivered' })
                                      });
                                      if (response.ok) {
                                        setFormSuccess("Livraison confirmée ! Les produits ont été ajoutés directement à votre Espace Stock.");
                                        onRefreshState();
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded-lg text-[10px] transition cursor-pointer"
                                >
                                  ✓ Valider Réception & Stocker
                                </button>
                              ) : (
                                <div className="text-[9px] text-emerald-500 text-center font-bold">
                                  ✓ Ajouté au stock cuisine
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CONDITIONAL DETAILED APPLICANT CV DOSSIER OVERLAY */}
      {selectedAppToView && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden text-slate-100 animate-fade-in">
            {/* Modal header */}
            <div className="p-5 border-b border-slate-850 flex items-center justify-between bg-slate-950/40">
              <div>
                <span className="text-[10px] bg-violet-950 text-violet-300 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Examen de Candidature Officielle
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                  Candidat : <span className="text-violet-400">{selectedAppToView.clientName}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Poste ciblé : <strong className="text-slate-350">{selectedAppToView.jobTitle}</strong> • Déposé le {selectedAppToView.appliedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppToView(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-850 rounded-xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Applicant Credentials of Contact */}
              <div className="md:col-span-5 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2.5">
                    Coordonnées du Postulant
                  </h3>
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-4">
                    <div className="flex items-start space-x-3">
                      <Mail className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Adresse E-mail</span>
                        <a href={`mailto:${selectedAppToView.clientEmail}`} className="text-xs text-indigo-300 font-mono underline hover:text-indigo-200">
                          {selectedAppToView.clientEmail}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Phone className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">N° de Téléphone</span>
                        <a href={`tel:${selectedAppToView.clientPhone}`} className="text-xs text-slate-200 font-mono font-bold">
                          {selectedAppToView.clientPhone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Calendar className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Date de Transmission</span>
                        <span className="text-xs text-slate-350">
                          {selectedAppToView.appliedAt}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FileText className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Type de Curriculum</span>
                        <span className="text-xs text-slate-350 font-bold">
                          {selectedAppToView.cvType === 'file' ? '📁 Fichier PDF Originel' : '✍️ Rédigé et compilé en ligne'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-violet-950/20 border border-violet-900/40 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-violet-300 mb-1">Action Recruteur :</h4>
                  <p className="text-xs text-slate-305 leading-relaxed">
                    Vous pouvez contacter directement ce postulant en lui envoyant un message personnalisé dans sa boîte mail.
                  </p>
                  <a
                    href={`mailto:${selectedAppToView.clientEmail}?subject=${encodeURIComponent(`Candidature : ${selectedAppToView.jobTitle}`)}&body=${encodeURIComponent(`Bonjour ${selectedAppToView.clientName},\n\nNous avons examiné votre candidature avec intérêt pour notre offre de "${selectedAppToView.jobTitle}".\n\nNous aimerions prendre contact avec vous...\n\nCordialement,\n${user.name}`)}`}
                    className="w-full flex items-center justify-center space-x-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contacter le candidat</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Dynamic formatted curriculum display */}
              <div className="md:col-span-7 bg-slate-950 border border-slate-850 rounded-2xl p-6 min-h-[400px]">
                {selectedAppToView.cvType === 'built' && selectedAppToView.cvBuilderData ? (
                  <div className="space-y-4">
                    <div className="border-b border-indigo-905 pb-3">
                      <h4 className="font-extrabold text-white text-md leading-tight">
                        {selectedAppToView.clientName}
                      </h4>
                      <p className="text-xs text-violet-400 font-extrabold tracking-wide uppercase mt-0.5">
                        {selectedAppToView.cvBuilderData.title || "Titre Professionnel"}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Accroche / Profil</span>
                        <p className="text-xs text-slate-200 leading-relaxed italic mt-1 bg-slate-900/60 p-3 rounded-lg border border-slate-850/60">
                          "{selectedAppToView.cvBuilderData.summary}"
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Compétences maîtrisées</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedAppToView.cvBuilderData.skills.split(',').map((sk: string, sidx: number) => (
                            <span key={sidx} className="bg-violet-950/65 border border-violet-900/50 text-violet-300 text-[10px] px-2 py-0.5 rounded">
                              {sk.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2.5 border-t border-slate-900/65">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Expérience Professionnelle</span>
                          <p className="text-[11px] text-slate-300 font-mono whitespace-pre-line mt-1 bg-slate-900/40 p-2 rounded">
                            {selectedAppToView.cvBuilderData.experience}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Formations & Diplômes</span>
                          <p className="text-[11px] text-slate-300 font-mono whitespace-pre-line mt-1 bg-slate-900/40 p-2 rounded">
                            {selectedAppToView.cvBuilderData.education}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex flex-col justify-between h-full min-h-[340px]">
                    <div className="space-y-4">
                      <div className="border-b border-indigo-900 pb-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-white text-md leading-tight">
                            {selectedAppToView.clientName}
                          </h4>
                          <span className="text-[10px] text-indigo-400 font-extrabold tracking-wide uppercase font-mono block mt-0.5">
                            Fichier original : {selectedAppToView.cvFileName}
                          </span>
                        </div>
                        <FileText className="w-10 h-10 text-violet-400" />
                      </div>
                      
                      <div className="bg-slate-900 p-5 rounded-xl border border-slate-850/65 flex flex-col items-center justify-center text-center space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                        <div>
                          <h5 className="text-xs text-slate-200 font-bold">Fiche de CV Importée avec Succès</h5>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-sm font-sans">
                            Le CV d'origine de {selectedAppToView.clientName} ({selectedAppToView.cvFileName}) a été transféré de façon sécurisée depuis son appareil et scanné sans erreur.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 text-xs">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Aperçu Meta-Données</span>
                        <div className="font-mono text-[10px] text-slate-350 space-y-1">
                          <div>Fichier : {selectedAppToView.cvFileName}</div>
                          <div>Date d'upload : {selectedAppToView.appliedAt}</div>
                          <div>Stream Signature : SHA256-CLIENT-CV-OK</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center-text pt-4">
                      <span className="text-[10px] text-slate-500 font-sans block">
                        Pour télécharger ou modifier le fichier importé original, utilisez les coordonnées directes de {selectedAppToView.clientName}.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-4 border-t border-slate-850 bg-slate-950/40 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleRejectApplication(selectedAppToView.id)}
                className="px-4 py-2 bg-red-950/40 hover:bg-red-900 border border-red-900/40 text-red-300 hover:text-red-200 text-xs rounded-xl font-bold cursor-pointer transition"
              >
                Rejeter cette Candidature
              </button>
              <button
                type="button"
                onClick={() => setSelectedAppToView(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-xs text-slate-200 rounded-xl font-semibold cursor-pointer border border-slate-800"
              >
                Fermer l'Examen de Candidature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONDITIONAL DELIVERY INSTANT CHAT OVERLAY */}
      {activeDeliveryChatOrder && (
        <div id="delivery-chat-overlay" className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-950 text-indigo-400 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest leading-none">Support & Livraison Client</h3>
                  <h2 className="text-sm font-extrabold text-white mt-1.5 leading-tight">
                    {activeDeliveryChatOrder.productTitle} x{activeDeliveryChatOrder.quantity}
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Client : <strong className="text-slate-200">{activeDeliveryChatOrder.buyerName}</strong> • Commande <span className="font-mono text-indigo-400">#{activeDeliveryChatOrder.id}</span>
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setActiveDeliveryChatOrder(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 rounded-xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Warning / Explanation Banner */}
            <div className="bg-indigo-950/30 px-4 py-2 border-b border-indigo-900/30 text-[11px] text-indigo-200 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="shrink-0 flex items-center gap-1">🔒 Messagerie de livraison sécurisée</span>
              <button
                type="button"
                onClick={() => fetchDeliveryMessages(activeDeliveryChatOrder.id)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold shrink-0 p-1 flex items-center gap-1 cursor-pointer"
              >
                🔄 Actualiser
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/30 h-[280px]">
              {isFetchingDeliveryMessages && deliveryChatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-500">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Chargement de la discussion...</span>
                </div>
              ) : deliveryChatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-6 space-y-2.5 text-slate-500">
                  <span className="text-3xl">📨</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-355">Aucun message pour le moment</h4>
                    <p className="text-[10.5px] text-slate-450 leading-relaxed max-w-xs">
                      Engagez la discussion avec le client pour lui préciser le délai estimé, fixer une heure, ou confirmer son adresse de livraison.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {deliveryChatMessages.map((msg: any) => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-normal ${
                          isMe 
                            ? 'bg-indigo-650 text-white rounded-tr-none shadow-md' 
                            : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-750'
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[9px] text-slate-500 font-mono">
                          <span className="font-bold">{isMe ? "Votre Boutique" : msg.senderName}</span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick replies */}
            <div className="p-3 bg-slate-950 border-t border-slate-850 overflow-x-auto whitespace-nowrap flex items-center gap-2">
              <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wide mr-1 select-none">Raccourcis Boutique :</span>
              {[
                "Bonjour ! Votre commande est validée et en cours de préparation.",
                "Le livreur vient de partir, il devrait arriver d'ici 20 minutes.",
                "Bonjour, pouvez-vous confirmer votre adresse précise, s'il vous plaît ?",
                "Livraison terminée avec succès, à bientôt !",
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDeliveryChatInput(suggestion)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-800 text-[10px] font-medium px-2.5 py-1 rounded-full shrink-0 transition cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendDeliveryMessage} className="p-4 bg-slate-950 border-t border-slate-850 flex gap-2">
              <input
                type="text"
                value={deliveryChatInput}
                onChange={(e) => setDeliveryChatInput(e.target.value)}
                placeholder="Écrivez un message..."
                className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSendingDeliveryMessage || !deliveryChatInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold px-4 rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer font-sans"
              >
                <span>Envoyer</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          buyer={allUsers.find(u => u.id === selectedInvoiceOrder.buyerId)}
          seller={user}
          isOpen={true}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
