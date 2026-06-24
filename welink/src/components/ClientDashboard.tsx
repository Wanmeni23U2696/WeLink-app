import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Product, JobOffer, Order, ChatMessage, EnterpriseType, JobApplication, HotelRoom, HotelReservation, HotelCoupon, RestaurantTable, RestaurantBooking, DishRating } from '../types';
import { ShoppingBag, Lightbulb, Briefcase, ListTodo, Send, MessageSquare, MapPin, BadgePercent, CheckCircle2, ChevronRight, ShoppingCart, Upload, FileText, Plus, Check, Loader2, ArrowLeft, Bell, Flame, Zap, Percent, CreditCard, Trash2, Wallet, Lock, RefreshCw } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import HotelClientPortal from './HotelClientPortal';
import ShopShowcasePortal from './ShopShowcasePortal';
import WhatsAppButton from './WhatsAppButton';
import { InvoiceModal } from './InvoiceModal';

interface ClientDashboardProps {
  user: UserProfile;
  products: Product[];
  jobOffers: JobOffer[];
  orders: Order[];
  jobApplications: JobApplication[];
  allUsers: UserProfile[];
  onRefreshState: () => void;
  hotelRooms?: HotelRoom[];
  hotelRoomCategories?: any[];
  hotelReservations?: HotelReservation[];
  hotelCoupons?: HotelCoupon[];
  hotelAuditLogs?: any[];
  hotelFomoSettings?: any[];
  restaurantTables?: RestaurantTable[];
  restaurantBookings?: RestaurantBooking[];
  dishRatings?: DishRating[];
  companyReviews?: any[];
  clientClassifications?: any[];
  onShopViewChange?: (shopId: string | null) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export interface PaymentPreference {
  id: string;
  type: 'mobile_money' | 'bank_transfer' | 'card';
  label: string;
  holderName: string;
  provider: string;
  accountNumber: string;
  isDefault: boolean;
  createdAt: string;
}

export default function ClientDashboard({ 
  user, 
  products, 
  jobOffers, 
  orders, 
  jobApplications, 
  allUsers, 
  onRefreshState,
  hotelRooms = [],
  hotelRoomCategories = [],
  hotelReservations = [],
  hotelCoupons = [],
  hotelAuditLogs = [],
  hotelFomoSettings = [],
  restaurantTables = [],
  restaurantBookings = [],
  dishRatings = [],
  companyReviews = [],
  clientClassifications = [],
  onShopViewChange,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab
}: ClientDashboardProps) {
  const getProdCurrentPrice = (p: Product) => {
    if (p.promotionDiscount && p.promotionEnd && new Date(p.promotionEnd) > new Date()) {
      return Math.round(p.price * (1 - p.promotionDiscount / 100));
    }
    return p.price;
  };

  const [localActiveTab, setLocalActiveTab] = useState<'shop' | 'for-you' | 'ai-chat' | 'jobs' | 'orders' | 'payments' | 'profile'>('shop');
  const activeTab = (propActiveTab || localActiveTab) as 'shop' | 'for-you' | 'ai-chat' | 'jobs' | 'orders' | 'payments' | 'profile';
  const setActiveTab = (propSetActiveTab || setLocalActiveTab) as any;
  const [selectedSector, setSelectedSector] = useState<EnterpriseType | null>(null);

  // Client Payment Methods Preferences State
  const [paymentPreferences, setPaymentPreferences] = useState<PaymentPreference[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`payment_preferences_${user.id}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing payment preferences", e);
        }
      }
    }
    // Pre-seeded high-quality realistic simulation data
    return [
      {
        id: 'pref-momo-1',
        type: 'mobile_money',
        label: 'Mon Compte MoMo Principal',
        holderName: user.name || 'Jean-Pierre Kamer',
        provider: 'MTN MoMo',
        accountNumber: user.phone || '+237 650 02 34 02',
        isDefault: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'pref-bank-1',
        type: 'bank_transfer',
        label: 'Mon Compte Courant BNDE',
        holderName: user.name || 'El Hadji Malick',
        provider: 'BNDE Sénégal',
        accountNumber: 'SN128 01001 023456789012 34',
        isDefault: false,
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Client payment preference forms states
  const [isAddingPreference, setIsAddingPreference] = useState(false);
  const [editingPreference, setEditingPreference] = useState<PaymentPreference | null>(null);
  
  // Specific Form states
  const [formPrefType, setFormPrefType] = useState<'mobile_money' | 'bank_transfer' | 'card'>('mobile_money');
  const [formPrefLabel, setFormPrefLabel] = useState('');
  const [formPrefHolderName, setFormPrefHolderName] = useState('');
  const [formPrefProvider, setFormPrefProvider] = useState('MTN MoMo');
  const [formPrefAccountNumber, setFormPrefAccountNumber] = useState('');
  const [formPrefIsDefault, setFormPrefIsDefault] = useState(false);

  // Client Profile Editing Fields & Sync Effect
  const [profileName, setProfileName] = useState(user.name || '');
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl || '');
  const [profileBio, setProfileBio] = useState(user.bio || user.description || '');
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileAddress, setProfileAddress] = useState(user.address || '');
  const [profileInterests, setProfileInterests] = useState<string[]>(user.interests || []);
  const [profilePinCode, setProfilePinCode] = useState(user.pinCode || '');
  const [profileIsDataEncrypted, setProfileIsDataEncrypted] = useState(user.isDataEncrypted || false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileAvatar(user.avatarUrl || '');
      setProfileBio(user.bio || user.description || '');
      setProfilePhone(user.phone || '');
      setProfileAddress(user.address || '');
      setProfileInterests(user.interests || []);
      setProfilePinCode(user.pinCode || '');
      setProfileIsDataEncrypted(user.isDataEncrypted || false);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      triggerToast("⚠️ Le nom complet ne peut pas être vide.");
      return;
    }
    
    setIsUpdatingProfile(true);
    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: profileName,
          avatarUrl: profileAvatar,
          bio: profileBio,
          description: profileBio,
          phone: profilePhone,
          address: profileAddress,
          interests: profileInterests,
          pinCode: profilePinCode,
          isDataEncrypted: profileIsDataEncrypted
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue lors de la mise à jour.");
      }

      const result = await response.json();
      if (result.success) {
        triggerToast("✨ Profil de quartier mis à jour !");
        onRefreshState();
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(`❌ Erreur: ${err.message}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setProfileInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  // Helper to open form for editing or adding
  const handleOpenAddPreference = () => {
    setEditingPreference(null);
    setFormPrefType('mobile_money');
    setFormPrefLabel('');
    setFormPrefHolderName(user.name || '');
    setFormPrefProvider('MTN MoMo');
    setFormPrefAccountNumber('');
    setFormPrefIsDefault(paymentPreferences.length === 0); // Default if first preference
    setIsAddingPreference(true);
  };

  const handleOpenEditPreference = (pref: PaymentPreference) => {
    setEditingPreference(pref);
    setFormPrefType(pref.type);
    setFormPrefLabel(pref.label);
    setFormPrefHolderName(pref.holderName);
    setFormPrefProvider(pref.provider);
    setFormPrefAccountNumber(pref.accountNumber);
    setFormPrefIsDefault(pref.isDefault);
    setIsAddingPreference(true);
  };

  const handleSavePreference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrefLabel.trim() || !formPrefAccountNumber.trim() || !formPrefProvider.trim()) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    let updatedList: PaymentPreference[];
    
    const isDefaultSetting = formPrefIsDefault || paymentPreferences.length === 0;

    if (editingPreference) {
      // Modify actual preference
      updatedList = paymentPreferences.map(p => {
        if (p.id === editingPreference.id) {
          return {
            ...p,
            type: formPrefType,
            label: formPrefLabel,
            holderName: formPrefHolderName || user.name,
            provider: formPrefProvider,
            accountNumber: formPrefAccountNumber,
            isDefault: isDefaultSetting
          };
        }
        // If this is saved as default, strip default flag from other preferences
        return isDefaultSetting ? { ...p, isDefault: false } : p;
      });
    } else {
      // Create new preference
      const newPref: PaymentPreference = {
        id: 'pref_' + Math.random().toString(36).substring(2, 9),
        type: formPrefType,
        label: formPrefLabel,
        holderName: formPrefHolderName || user.name,
        provider: formPrefProvider,
        accountNumber: formPrefAccountNumber,
        isDefault: isDefaultSetting,
        createdAt: new Date().toISOString()
      };

      if (isDefaultSetting) {
        updatedList = paymentPreferences.map(p => ({ ...p, isDefault: false }));
        updatedList.push(newPref);
      } else {
        updatedList = [...paymentPreferences, newPref];
      }
    }

    setPaymentPreferences(updatedList);
    setIsAddingPreference(false);
    setEditingPreference(null);
    triggerToast(editingPreference ? "✏️ Préférence mise à jour !" : "🎉 Nouveau moyen de paiement enregistré !");
  };

  const handleDeletePreference = (prefId: string) => {
    const original = paymentPreferences.find(p => p.id === prefId);
    let updatedList = paymentPreferences.filter(p => p.id !== prefId);
    
    // If we delete the default one, make another one default if possible
    if (original?.isDefault && updatedList.length > 0) {
      updatedList[0].isDefault = true;
    }

    setPaymentPreferences(updatedList);
    triggerToast("🗑️ Moyen de paiement supprimé !");
  };

  const handleSetDefaultPreference = (prefId: string) => {
    const updatedList = paymentPreferences.map(p => ({
      ...p,
      isDefault: p.id === prefId
    }));
    setPaymentPreferences(updatedList);
    triggerToast("🌟 Moyen de paiement défini par défaut !");
  };

  // Sync to localStorage and state updates
  useEffect(() => {
    localStorage.setItem(`payment_preferences_${user.id}`, JSON.stringify(paymentPreferences));
    const defaultPref = paymentPreferences.find(p => p.isDefault);
    if (defaultPref) {
      setSelectedPaymentMethod(defaultPref.provider);
    }
  }, [paymentPreferences, user.id]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [activeRayonFilter, setActiveRayonFilter] = useState<string | null>(null);
  const [shopFilter, setShopFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeImageByProduct, setActiveImageByProduct] = useState<Record<string, string>>({});

  // Reset visited shop state when client navigates away from the shop tab to orders, etc.
  useEffect(() => {
    if (activeTab !== 'shop') {
      setSelectedShopId(null);
      setSelectedSector(null);
    }
  }, [activeTab]);
  
  // Guard reference to prevent infinite loops when refreshing parent state updates 'allUsers'
  const lastTrackedShopIdRef = useRef<string | null>(null);

  // Automatic TikTok-inspired Activity Tracking & Personalization Engine
  useEffect(() => {
    setActiveRayonFilter(null);
    if (onShopViewChange) {
      onShopViewChange(selectedShopId);
    }

    if (selectedShopId && selectedShopId !== 'all') {
      if (lastTrackedShopIdRef.current === selectedShopId) {
        // Redundant tracking trigger, skip to avoid infinite loop
        return;
      }
      lastTrackedShopIdRef.current = selectedShopId;

      const seller = allUsers.find(u => u.id === selectedShopId);
      if (seller) {
        // Track the visit
        fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: user.id,
            activityType: 'view_enterprise',
            targetId: selectedShopId,
            targetCategory: seller.enterpriseType || 'autre'
          })
        })
        .then(res => res.json().catch(() => ({})))
        .then(data => {
          if (data && data.success) {
            onRefreshState(); // Update classifications in memory
          }
        })
        .catch(() => {});
      }
    } else {
      // Clear/update tracked ref so returning to same shop later can be re-logged if needed
      lastTrackedShopIdRef.current = selectedShopId;
    }
  }, [selectedShopId, onShopViewChange, allUsers, user.id]);
  
  // Basket & Order Simulation
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutQty, setCheckoutQty] = useState<number>(1);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('all');

  // Multi-item Cart Subtle Success Toast Notification & Bulk Checkout
  const [successToast, setSuccessToast] = useState<string>('');
  
  // Custom secure states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('MTN MoMo');
  const [useEscrowPayment, setUseEscrowPayment] = useState<boolean>(true);
  const [orderConfirmation, setOrderConfirmation] = useState<{ isOpen: boolean; title: string; text: string; paymentMethod: string; orderIds?: string[]; amount?: number } | null>(null);
  
  // Active payment states for checkout MTN/Orange Money process
  const [orderPayStep, setOrderPayStep] = useState<'idle' | 'submitting' | 'waiting_pin' | 'success'>('idle');
  const [orderPayPhone, setOrderPayPhone] = useState<string>(user.phone || '');
  const [orderPayError, setOrderPayError] = useState<string>('');
  const [orderPayProgress, setOrderPayProgress] = useState<number>(0);
  const [orderPayRef, setOrderPayRef] = useState<string>('');

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(1);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [cancelOrderConfirmId, setCancelOrderConfirmId] = useState<string | null>(null);
  const [deliverOrderConfirmId, setDeliverOrderConfirmId] = useState<string | null>(null);

  // Delivery Instant Messaging Chat modal states
  const [activeDeliveryChatOrder, setActiveDeliveryChatOrder] = useState<any | null>(null);
  const [deliveryChatMessages, setDeliveryChatMessages] = useState<any[]>([]);
  const [deliveryChatInput, setDeliveryChatInput] = useState<string>('');
  const [isSendingDeliveryMessage, setIsSendingDeliveryMessage] = useState<boolean>(false);
  const [isFetchingDeliveryMessages, setIsFetchingDeliveryMessages] = useState<boolean>(false);

  const fetchDeliveryMessages = async (orderId: string) => {
    setIsFetchingDeliveryMessages(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setDeliveryChatMessages(data);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des messages de livraison:", err);
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
        triggerToast("❌ Impossible de transmettre le message.");
        setDeliveryChatInput(textToSend);
      }
    } catch (err) {
      console.error("Erreur d'envoi du message:", err);
      triggerToast("❌ Erreur de réseau.");
      setDeliveryChatInput(textToSend);
    } finally {
      setIsSendingDeliveryMessage(false);
    }
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(prev => prev === msg ? '' : prev);
    }, 4500);
  };

  const handleCheckoutBulk = async (
    schedDate?: string, 
    schedTime?: string, 
    itemCuts?: Record<string, string>,
    serviceType?: string,
    deliveryAddress?: string,
    tableNumber?: string
  ) => {
    const cartItems = Object.entries(cart).map(([productId, quantity]) => ({
      productId,
      quantity,
      customCut: itemCuts ? itemCuts[productId] : undefined
    }));

    if (cartItems.length === 0) {
      alert("Votre panier est vide.");
      return;
    }

    setOrderLoading(true);
    setOrderSuccess('');
    try {
      const response = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: user.id,
          items: cartItems,
          targetSellerId: selectedShopId && selectedShopId !== 'all' ? selectedShopId : undefined,
          paymentMethod: selectedPaymentMethod,
          isEscrow: useEscrowPayment,
          scheduledDate: schedDate || undefined,
          scheduledTime: schedTime || undefined,
          serviceType: serviceType || undefined,
          deliveryAddress: deliveryAddress || undefined,
          tableNumber: tableNumber || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur d\'achat');

      // Clear cart
      setCart({});
      
      let totalAmount = 0;
      cartItems.forEach((it: any) => {
        const prod = products.find(p => p.id === it.productId);
        if (prod) {
          totalAmount += getProdCurrentPrice(prod) * it.quantity;
        }
      });

      const orderIds = data.orders ? data.orders.map((o: any) => o.id) : [];

      setOrderConfirmation({
        isOpen: true,
        title: "Commande transmise avec succès ! 🚀",
        text: data.message || `Félicitations ! Votre commande groupée de ${cartItems.length} article(s) a bien été validée et envoyée aux commerçants de proximité.`,
        paymentMethod: selectedPaymentMethod,
        orderIds,
        amount: totalAmount
      });
      onRefreshState();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleExecuteOrderPayment = async (orderIds: string[], amount: number) => {
    if (!orderPayPhone) {
      setOrderPayError("Veuillez renseigner votre numéro de téléphone.");
      return;
    }
    setOrderPayError('');
    setOrderPayStep('submitting');
    
    try {
      const response = await fetch('/api/payments/campay-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phone: orderPayPhone,
          paymentMethod: selectedPaymentMethod,
          email: user.email,
          orderIds,
          userId: user.id
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        setOrderPayError(errData.error || "La transaction a été rejetée par l'opérateur local.");
        setOrderPayStep('idle');
        return;
      }
      
      const pData = await response.json();
      if (pData.success) {
        setOrderPayRef(pData.reference);
        setOrderPayStep('waiting_pin');
        setOrderPayProgress(10);
        
        let progress = 10;
        const interval = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/payments/campay-status/${pData.reference}`);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              
              progress = Math.min(progress + 15, 95);
              setOrderPayProgress(progress);
              
              if (checkData.status === 'SUCCESS') {
                clearInterval(interval);
                setOrderPayProgress(100);
                setOrderPayStep('success');
                onRefreshState();
              } else if (checkData.status === 'FAILED') {
                clearInterval(interval);
                setOrderPayError("Le virement mobile money a échoué (PIN erroné ou solde insuffisant).");
                setOrderPayStep('idle');
              }
            }
          } catch (e) {
            console.error(e);
          }
        }, 2500);
        
        setTimeout(() => {
          clearInterval(interval);
        }, 90000);
        
      } else {
        setOrderPayError("Échec d'initialisation du canal de facturation.");
        setOrderPayStep('idle');
      }
    } catch (err) {
      console.error(err);
      setOrderPayError("Erreur de connexion avec le serveur de facturation locale.");
      setOrderPayStep('idle');
    }
  };

  const handleReorder = async (productId: string, sellerId: string, qty: number, customCut?: string) => {
    setOrderLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: user.id,
          productId,
          quantity: qty,
          targetSellerId: sellerId,
          paymentMethod: selectedPaymentMethod,
          isEscrow: useEscrowPayment,
          customCut: customCut || undefined
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur de recommandation');
      
      triggerToast("🚀 Article commandé à nouveau avec succès !");
      onRefreshState();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancelOrderConfirmId(orderId);
  };

  const handleCancelOrderConfirm = async (orderId: string) => {
    setCancelOrderConfirmId(null);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const d = await response.json();
      if (!response.ok) throw new Error(d.error || "Impossible d'annuler.");
      
      triggerToast("❌ Commande annulée & fonds libérés");
      onRefreshState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmOrderDelivered = async (orderId: string) => {
    setDeliverOrderConfirmId(orderId);
  };

  const handleConfirmOrderDeliveredConfirm = async (orderId: string) => {
    setDeliverOrderConfirmId(null);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      });
      const d = await response.json();
      if (!response.ok) throw new Error(d.error || "Impossible de confirmer la livraison.");
      
      triggerToast("🎉 Livraison confirmée & Fonds débloqués !");
      onRefreshState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleModifyOrderQuantity = async (orderId: string, newQty: number) => {
    if (newQty <= 0) {
      alert("La quantité doit être supérieure ou égale à 1.");
      return;
    }
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      const d = await response.json();
      if (!response.ok) throw new Error(d.error || "Ajustement impossible.");
      
      setEditingOrderId(null);
      triggerToast("📝 Quantité ajustée !");
      onRefreshState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: `Bonjour ${user.name} ! Je suis votre conseiller d'achat intelligent. Je peux vous guider vers le bon produit, vous renseigner sur les spécialités de nos restaurants démo (comme "Chez Marie") ou vous aider à décrypter les offres d'emploi actives. Que cherchez-vous aujourd'hui ?`, timestamp: new Date().toLocaleTimeString() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Job Application State & CV Builder
  const [selectedJobToApply, setSelectedJobToApply] = useState<JobOffer | null>(null);
  const [cvType, setCvType] = useState<'file' | 'built'>('file');
  const [cvFileName, setCvFileName] = useState<string>('');
  const [cvFileContent, setCvFileContent] = useState<string>('');
  const [cvBuilderData, setCvBuilderData] = useState({
    title: '',
    summary: '',
    skills: '',
    experience: '',
    education: ''
  });
  const [applicantPhone, setApplicantPhone] = useState(user.phone || '');
  const [applicantEmail, setApplicantEmail] = useState(user.email || '');
  const [applyingInProgress, setApplyingInProgress] = useState(false);
  const [readRejections, setReadRejections] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`read_rejections_${user.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleMarkRejectionAsRead = (appId: string) => {
    const updated = [...readRejections, appId];
    setReadRejections(updated);
    try {
      localStorage.setItem(`read_rejections_${user.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  // Enterprise & Supplier Products
  const enterpriseProducts = products;

  // Find all enterprises matching the selected sector (strictly enterprises, suppliers are reserved for B2B)
  const enterprisesInSector = allUsers.filter(u => {
    if (u.profileType !== 'entreprise') return false;
    
    if ((selectedSector as string) === 'agriculteur') {
      return (u.enterpriseType as string) === 'agriculteur';
    }
    if ((selectedSector as string) === 'artisan') {
      return (u.enterpriseType as string) === 'artisan';
    }
    if ((selectedSector as string) === 'eleveur') {
      return (u.enterpriseType as string) === 'eleveur';
    }
    if ((selectedSector as string) === 'poissonnier') {
      return (u.enterpriseType as string) === 'poissonnier';
    }
    if ((selectedSector as string) === 'boucher') {
      return u.enterpriseType === 'boucher';
    }
    if ((selectedSector as string) === 'poissonnerie') {
      return u.enterpriseType === 'poissonnerie';
    }
    return u.enterpriseType === selectedSector;
  });

  // Filter products strictly based on selected sector & specific shop
  const filteredProducts = enterpriseProducts.filter(p => {
    // If no sector chosen, show nothing in list
    if (!selectedSector) return false;

    // Check if product belongs to an enterprise of this sector
    const belongsToSector = enterprisesInSector.some(ent => ent.id === p.sellerId);
    if (!belongsToSector) return false;

    // Filter by specific shop if chosen and isn't 'all'
    if (selectedShopId && selectedShopId !== 'all') {
      if (p.sellerId !== selectedShopId) return false;
    }

    // Match search query
    const matchSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    // Optional quick tag filter (shopFilter - if not 'all')
    if (shopFilter !== 'all') {
      return p.category.toLowerCase().includes(shopFilter.toLowerCase());
    }

    return true;
  });

  // Group products by rayon when isSupermarket or marche is active
  const productsByRayon: { [key: string]: Product[] } = {};
  if (selectedSector === 'supermarche' || selectedSector === 'marche') {
    filteredProducts.forEach(p => {
      const groupName = p.rayon || (selectedSector === 'marche' ? "Étalage de Saison" : "Articles Divers");
      if (!productsByRayon[groupName]) {
        productsByRayon[groupName] = [];
      }
      productsByRayon[groupName].push(p);
    });
  }

  // Add to basket
  const addToCart = (productId: string, maxStock: number) => {
    const currentQty = cart[productId] || 0;
    if (currentQty < maxStock) {
      setCart({ ...cart, [productId]: currentQty + 1 });
      const prod = products.find(p => p.id === productId);
      if (prod) {
        triggerToast(`🛒 "${prod.title}" ajouté au panier ! Quantité: ${currentQty + 1}`);
      }
    }
  };

  const removeFromCart = (productId: string) => {
    const currentQty = cart[productId] || 0;
    const prod = products.find(p => p.id === productId);
    if (currentQty <= 1) {
      const updated = { ...cart };
      delete updated[productId];
      setCart(updated);
      if (prod) {
        triggerToast(`🗑️ "${prod.title}" retiré du panier`);
      }
    } else {
      setCart({ ...cart, [productId]: currentQty - 1 });
      if (prod) {
        triggerToast(`➖ "${prod.title}" : quantité réduite à ${currentQty - 1}`);
      }
    }
  };

  // Place order
  const handleCheckout = async (productId: string, quantity: number) => {
    setOrderLoading(true);
    setOrderSuccess('');
    try {
      const targetProd = products.find(p => p.id === productId);
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: user.id,
          productId,
          quantity,
          targetSellerId: selectedShopId && selectedShopId !== 'all' ? selectedShopId : (targetProd?.sellerId),
          paymentMethod: selectedPaymentMethod,
          isEscrow: useEscrowPayment
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur d\'achat');

      setCart(prev => {
        const u = { ...prev };
        delete u[productId];
        return u;
      });
      let totalAmount = 0;
      if (targetProd) {
        totalAmount = getProdCurrentPrice(targetProd) * quantity;
      }
      const orderIds = data.order ? [data.order.id] : (data.orders ? data.orders.map((o: any) => o.id) : []);

      setOrderConfirmation({
        isOpen: true,
        title: "Commande transmise ! ⚡",
        text: `Votre commande exclusive de ${quantity}x '${targetProd?.title || 'Produit'}' a été validée avec succès et transmise en direct au commerçant de quartier.`,
        paymentMethod: selectedPaymentMethod,
        orderIds,
        amount: totalAmount
      });
      onRefreshState();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  // Chat with Gemini Advisor
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    
    const newUserMessage: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: userMsg,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, newUserMessage].map(m => ({ sender: m.sender, text: m.text })),
          userProfile: user
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        text: "Désolé, je rencontre quelques soucis de connexion. Recourez aux raccourcis d'achat ci-dessous pour commander !",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Apply to Job
  const handleApplyJob = (jobId: string) => {
    const offer = jobOffers.find(o => o.id === jobId);
    if (offer) {
      setSelectedJobToApply(offer);
      // Pre-fill CV builder to look highly credible and easy
      setCvBuilderData({
        title: offer.title + " Expérimenté",
        summary: `Professionnel rigoureux et passionné, motivé à rejoindre l'équipe de ${offer.companyName} au poste de ${offer.title}. Je possède les qualités idéales et les prérequis pour contribuer au succès de l'entreprise.`,
        skills: offer.requirements.join(', ') || "Rigoureux, Ponctuel, Travail d'équipe",
        experience: "2024 - Présent : Poste similaire dans le commerce de proximité.\n2022 - 2024 : Auxiliaire de service et relation clientèle.",
        education: "Baccalauréat Professionnel ou équivalent de formation de terrain."
      });
    }
  };

  const [applyError, setApplyError] = useState('');

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobToApply) return;
    setApplyingInProgress(true);
    setApplyError('');
    try {
      const payload = {
        jobId: selectedJobToApply.id,
        clientId: user.id,
        clientName: user.name,
        clientEmail: applicantEmail,
        clientPhone: applicantPhone,
        cvType,
        cvFileName: cvType === 'file' ? (cvFileName || 'mon_cv_prime.pdf') : `CV_${user.name.replace(/\s+/g, '_')}.pdf`,
        cvFileContent: cvType === 'file' ? (cvFileContent || 'Simulated PDF Binary Stream - Validated locally.') : undefined,
        cvBuilderData: cvType === 'built' ? cvBuilderData : undefined,
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onRefreshState();
        setSelectedJobToApply(null);
        setCvFileName('');
        setCvFileContent('');
      } else {
        const data = await response.json();
        setApplyError(data.error || "Une erreur est survenue lors de l'application.");
      }
    } catch (err: any) {
      setApplyError("Impossible de soumettre la candidature : " + err.message);
    } finally {
      setApplyingInProgress(false);
    }
  };

  const visitingSellerDetails = selectedShopId ? allUsers.find(u => u.id === selectedShopId) : null;
  const isVisitingCustomShop = activeTab === 'shop' && selectedSector !== null && selectedShopId !== null && visitingSellerDetails && visitingSellerDetails.enterpriseType !== 'hotel';

  if (isVisitingCustomShop && visitingSellerDetails) {
    return (
      <ShopShowcasePortal
        seller={visitingSellerDetails}
        user={user}
        products={products}
        orders={orders}
        cart={cart}
        onBack={() => {
          setSelectedShopId(null);
        }}
        onRefreshState={onRefreshState}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        setCart={setCart}
        getProdCurrentPrice={getProdCurrentPrice}
        handleCheckout={handleCheckout}
        handleCheckoutBulk={handleCheckoutBulk}
        paymentPreferences={paymentPreferences}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        useEscrowPayment={useEscrowPayment}
        setUseEscrowPayment={setUseEscrowPayment}
        orderLoading={orderLoading}
        triggerToast={triggerToast}
        restaurantTables={restaurantTables}
        restaurantBookings={restaurantBookings}
        dishRatings={dishRatings}
        companyReviews={companyReviews}
      />
    );
  }

  return (
    <div id="client-dashboard-root" className="w-full font-sans relative">
      
      {/* Floating Subtle Success Toast Notification */}
      {successToast && (
        <div id="subtle-success-toast" className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-emerald-500/80 text-emerald-300 font-medium text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-fade-in backdrop-blur">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span>{successToast}</span>
        </div>
      )}

      {/* Dynamic Cancel Order Confirmation Dialog */}
      {cancelOrderConfirmId && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 relative overflow-hidden animate-fade-in text-slate-100">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
            <div className="flex items-center space-x-3 text-red-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-sm font-black tracking-tight text-white uppercase">Annuler la commande ?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir annuler cette commande ? Les stocks d'articles et vos fonds engagés sous garantie séquestre seront instantanément libérés et restitués sur votre compte.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelOrderConfirmId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => handleCancelOrderConfirm(cancelOrderConfirmId)}
                className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-lg shadow-red-900/20"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Deliver Order Confirmation Dialog */}
      {deliverOrderConfirmId && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 relative overflow-hidden animate-fade-in text-slate-100">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="flex items-center space-x-3 text-emerald-400">
              <span className="text-2xl">🎉</span>
              <h3 className="text-sm font-black tracking-tight text-white uppercase">Confirmer la réception ?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Avez-vous bien reçu tous les articles correspondants ? En confirmant la livraison, vous débloquez définitivement les fonds séquestrés pour les transférer à l'entreprise de quartier. Cette opération est irréversible.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeliverOrderConfirmId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleConfirmOrderDeliveredConfirm(deliverOrderConfirmId)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-900/20"
              >
                Confirmer la livraison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Client Confirmation Checkbox Overlay Alert dialog */}
      {orderConfirmation && orderConfirmation.isOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div id="order-confirm-overlay" className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
            
            <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-8 h-8 shrink-0 animate-bounce" />
              <h3 className="text-sm font-black tracking-tight text-white">{orderConfirmation.title}</h3>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {orderConfirmation.text}
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-850 pb-2">
                <span className="text-slate-500 font-bold">MONTANT TOTAL :</span>
                <span className="font-black text-indigo-400 text-sm">{orderConfirmation.amount ? orderConfirmation.amount.toLocaleString() : '0'} FCFA</span>
              </div>

              {/* Real-time Payment Engine */}
              {orderPayStep === 'idle' && (
                <div className="space-y-3">
                  <span className="text-slate-400 font-black uppercase text-[8.5px] block">📲 Règlement Mobile Money Cameroun</span>
                  
                  {orderPayError && (
                    <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-2.5 rounded-xl text-[10px]">
                      {orderPayError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold block">Numéro de téléphone payeur (Orange / MTN Cameroun)</label>
                    <input
                      type="text"
                      value={orderPayPhone}
                      onChange={(e) => setOrderPayPhone(e.target.value)}
                      placeholder="Ex: 650023402, 699248672"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteOrderPayment(orderConfirmation.orderIds || [], orderConfirmation.amount || 0)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    🚀 Initier le Paiement Réel d'Achat
                  </button>
                  
                  <p className="text-[8.5px] text-slate-500 leading-snug italic text-center">
                    🔒 Les fonds seront débités en toute sécurité.
                  </p>
                </div>
              )}

              {orderPayStep === 'submitting' && (
                <div className="text-center py-6 space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-[11px] font-bold text-white">Connexion à l'opérateur MTN / Orange...</p>
                  <p className="text-[9px] text-slate-500">Génération du code de transaction sécurisé.</p>
                </div>
              )}

              {orderPayStep === 'waiting_pin' && (
                <div className="text-center py-4 space-y-3">
                  <div className="w-10 h-10 bg-amber-950/40 border border-amber-600 rounded-full flex items-center justify-center text-amber-400 mx-auto animate-pulse">
                    🔔
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-amber-300">Demande USSD envoyée</p>
                    <p className="text-[9.5px] text-slate-355">
                      Veuillez taper votre code secret PIN de validation sur votre téléphone <span className="font-bold text-white">{orderPayPhone}</span>.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${orderPayProgress}%` }} />
                    </div>
                    <p className="text-[8px] text-slate-500">Attente de validation PIN ... {orderPayProgress}%</p>
                  </div>
                </div>
              )}

              {orderPayStep === 'success' && (
                <div className="text-center py-5 space-y-3">
                  <div className="w-10 h-10 bg-emerald-950 border border-emerald-600 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-sm font-bold">
                    ✓
                  </div>
                  <h4 className="text-[11px] font-black text-white">Commande payée avec succès !</h4>
                  <p className="text-[9.5px] text-slate-400">
                    Votre paiement a été validé auprès de la passerelle de règlement. Un justificatif a été enregistré pour votre transaction.
                  </p>
                  <button
                    onClick={() => {
                      setOrderConfirmation(null);
                      setOrderPayStep('idle');
                      setActiveTab('orders');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Aller à mes commandes
                  </button>
                </div>
              )}
            </div>

            {orderPayStep !== 'success' && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                <span className="text-[9px] text-slate-500">Propulsé par Campay Cameroun</span>
                <button
                  id="close-order-confirm-btn"
                  onClick={() => {
                    setOrderConfirmation(null);
                    setOrderPayStep('idle');
                    setActiveTab('orders'); 
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs transition cursor-pointer"
                >
                  Payer plus tard / Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary Workspace Window - Normal Frame layout to prevent text overflow */}
      <div id="client-workspace-container" className="min-h-[550px] relative w-full space-y-6">
        
        {/* Dynamic Recruitment Message Alerts for Rejections */}
        {(() => {
          const activeRejectionMessages = jobApplications.filter(
            app => app.clientId === user.id && app.status === 'rejected' && !readRejections.includes(app.id)
          );
          if (activeRejectionMessages.length === 0) return null;

          return (
            <div className="mb-6 space-y-3" id="client-rejections-alerts-hub">
              {activeRejectionMessages.map((app) => (
                <div 
                  key={app.id} 
                  className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-900/50 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-pulse"
                >
                  <div className="flex items-start space-x-3.5">
                    <span className="text-xl shrink-0 mt-0.5">🚫</span>
                    <div>
                      <h4 className="font-bold text-sm text-red-400 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-red-400 animate-spin" />
                        <span>Recalage - Message de l'Entreprise Startup</span>
                      </h4>
                      <p className="text-xs text-slate-305 mt-1 leading-relaxed">
                        L'entreprise <strong className="text-white font-extrabold">{app.companyName}</strong> a décliné votre candidature pour le poste de <strong className="text-indigo-350">"{app.jobTitle}"</strong>. Vous êtes ainsi recalé pour cette offre. Ne vous découragez pas et tentez votre chance sur d'autres postes ouverts !
                      </p>
                      <span className="text-[9px] text-slate-500 block mt-1.5">Date d'application : {app.appliedAt}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkRejectionAsRead(app.id)}
                    className="shrink-0 text-slate-350 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800/80 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    Marquer comme lu ✓
                  </button>
                </div>
              ))}
            </div>
          );
        })()}

        {orderSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-sm flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{orderSuccess}</span>
          </div>
        )}

        {orderSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-sm flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{orderSuccess}</span>
          </div>
        )}

        {/* TAB 0: PERSONALIZED RECOMMENDED ALGORITHM FEED ("POUR VOUS" - TIKTOK INSPIRED!) */}
        {activeTab === 'for-you' && (
          <div id="client-foryou-view" className="space-y-6 animate-fade-in text-slate-100">
            {/* Header branding */}
            <div className="bg-gradient-to-r from-red-900/40 via-red-950/30 to-indigo-950/40 border border-red-900/30 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
                  <Flame className="w-3 h-3 text-red-500 animate-pulse" />
                  ALGORITHME RECOMMANDATION STYLE TIKTOK
                </span>
                <h1 className="text-2xl font-black text-white mt-2.5 tracking-tight">Pour Vous</h1>
                <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
                  Notre flux intelligent classe automatiquement vos activités (visites, ajouts au panier, achats) pour vous proposer des articles, services et chambres hautement personnalisés.
                </p>
              </div>

              {/* Algorithm Status Visual */}
              {(() => {
                const userClass = clientClassifications.find(c => c.clientId === user.id) || {
                  primaryInterest: "Non spécifié",
                  tier: "Curieux 🌱",
                  scoreMap: {},
                  updatedAt: new Date().toISOString()
                };
                
                return (
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shrink-0 w-full md:w-64 space-y-2.5 shadow-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Statut Algorithmique</span>
                      <span className="bg-rose-950 text-rose-300 text-[8px] font-black px-1.5 py-0.5 rounded">LIVE</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Votre Niveau :</p>
                      <p className="text-sm font-extrabold text-white">{userClass.tier}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Intérêt Majeur Détecté :</p>
                      <p className="text-xs font-bold text-red-400 uppercase mt-0.5">
                        {userClass.primaryInterest === 'supermarche' && "🛒 Supermarché & Alimentation"}
                        {userClass.primaryInterest === 'restaurant' && "🍗 Restauration Authentique"}
                        {userClass.primaryInterest === 'hotel' && "🏨 Club Hôtelier & Coworking"}
                        {userClass.primaryInterest === 'vetement' && "👗 Mode & Prêt-à-porter"}
                        {userClass.primaryInterest === 'autre' && "💡 Découverte Générale"}
                        {userClass.primaryInterest !== 'supermarche' && userClass.primaryInterest !== 'restaurant' && userClass.primaryInterest !== 'hotel' && userClass.primaryInterest !== 'vetement' && userClass.primaryInterest !== 'autre' && `✨ ${userClass.primaryInterest}`}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Main Content columns */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Left column: Feed recommended content */}
              <div className="xl:col-span-8 space-y-6">
                
                {(() => {
                  const userClass = clientClassifications.find(c => c.clientId === user.id);
                  const activeInterest = userClass ? userClass.primaryInterest : '';

                  // Fetch and score products
                  let recommendedProducts = [...products];

                  // Filter / Sort based on primary interest
                  if (activeInterest && activeInterest !== 'autre') {
                    recommendedProducts = products.filter(p => {
                      // Retrieve seller's business type
                      const seller = allUsers.find(u => u.id === p.sellerId);
                      return seller && seller.enterpriseType === activeInterest;
                    });
                  }

                  // Fallback to active items if empty
                  if (recommendedProducts.length === 0) {
                    recommendedProducts = products.slice(0, 4);
                  }

                  return (
                    <div className="space-y-4">
                      <h2 className="text-sm uppercase font-extrabold tracking-wider text-slate-300 flex items-center justify-between">
                        <span>Articles & Services Recommandés</span>
                        {activeInterest && (
                          <span className="text-[10px] text-indigo-400 bg-indigo-950/40 border border-indigo-950/30 px-2 py-0.5 rounded-full">
                            Trié par pertinence d'intérêt: <strong>{activeInterest}</strong>
                          </span>
                        )}
                      </h2>

                      {recommendedProducts.length === 0 ? (
                        <div className="p-8 text-center bg-slate-950/45 border border-slate-850 rounded-2xl">
                          <p className="text-slate-500 text-xs">Aucun produit ou service recommandé pour le moment.</p>
                          <p className="text-slate-600 text-[10px] mt-1">Visitez les différentes boutiques de quartier pour alimenter l'algorithme !</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {recommendedProducts.map((p) => {
                            const seller = allUsers.find(u => u.id === p.sellerId);
                            const currentPrice = getProdCurrentPrice(p);
                            const isPromo = p.promotionDiscount && p.promotionEnd && new Date(p.promotionEnd) > new Date();

                            // Track dynamic click before adding
                            const handleProductInteraction = () => {
                              fetch('/api/activity', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  clientId: user.id,
                                  activityType: 'add_to_cart',
                                  targetId: p.id,
                                  targetCategory: seller?.enterpriseType || 'autre'
                                })
                              })
                              .then(res => res.json().catch(() => ({})))
                              .then(() => {
                                onRefreshState();
                                triggerToast(`🛒 ${p.title} ajouté au panier !`);
                                // Call standard basket implementation
                                setCart(prev => ({
                                  ...prev,
                                  [p.id]: (prev[p.id] || 0) + 1
                                }));
                              })
                              .catch(() => {});
                            };

                            return (
                              <div key={p.id} className="bg-slate-950/65 border border-slate-850/80 rounded-2xl overflow-hidden hover:border-red-900/50 transition-all duration-300 flex flex-col group shadow-lg">
                                {/* Product Image banner */}
                                <div className="h-36 bg-slate-900 relative">
                                  <img 
                                    src={p.imageUrl || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=600'} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    alt={p.title}
                                    referrerPolicy="no-referrer"
                                  />
                                  {isPromo && (
                                    <span className="absolute top-2.5 left-2.5 bg-rose-650 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-lg flex items-center gap-1">
                                      <Flame className="w-3" />
                                      PROMO EN COURS
                                    </span>
                                  )}
                                  <span className="absolute bottom-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                                    {seller?.name || 'Vendeur Local'}
                                  </span>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                  <div>
                                    <h3 className="font-extrabold text-sm text-white tracking-tight">{p.title}</h3>
                                    <p className="text-slate-400 text-xs line-clamp-2 mt-1 leading-relaxed">{p.description}</p>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                                    <div>
                                      {isPromo ? (
                                        <div className="space-y-0.5">
                                          <p className="text-[10px] text-slate-500 line-through font-mono">{p.price} CFA</p>
                                          <p className="text-sm font-black text-emerald-450 font-mono">{currentPrice} CFA</p>
                                        </div>
                                      ) : (
                                        <p className="text-sm font-black text-white font-mono">{p.price} CFA</p>
                                      )}
                                    </div>

                                    <button 
                                      type="button"
                                      onClick={handleProductInteraction}
                                      className="py-1.5 px-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl text-[10px] transition cursor-pointer flex items-center space-x-1"
                                    >
                                      <ShoppingCart className="w-3 h-3" />
                                      <span>Ajouter au Panier</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Hotels and Bookings recommendation based on interests */}
                {(() => {
                  const userClass = clientClassifications.find(c => c.clientId === user.id);
                  const activeInterest = userClass ? userClass.primaryInterest : '';

                  if (activeInterest && activeInterest !== 'hotel' && activeInterest !== 'restaurant' && activeInterest !== 'autre') {
                    return null;
                  }

                  return (
                    <div className="bg-slate-950/25 border border-slate-850 rounded-2xl p-6 space-y-4">
                      <div>
                        <h3 className="text-white font-extrabold text-sm flex items-center gap-2">
                          <span>🏨 Activités & Services Partenaires Recommandés</span>
                          <span className="text-[9px] bg-red-950 text-red-400 font-bold px-2 py-0.5 rounded-full">Intérêt: {activeInterest || 'Général'}</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">L'algorithme vous recommande de réserver ou visiter ces établissements d'exception de votre quartier.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Hotel room promo sample */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900 font-extrabold rounded-lg px-2 py-0.5">CHAMBRE SPÉCIALE VIP</span>
                            <h4 className="text-white font-bold text-xs mt-2">Chambre Deluxe Premium - Hôtel Palmier</h4>
                            <p className="text-[11px] text-slate-400 mt-1">Espace de travail connecté et accès au lounge gastronomique à volonté.</p>
                          </div>
                          <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg">
                            <div>
                              <p className="text-[9px] text-slate-400">Prix exclusif :</p>
                              <p className="text-xs font-black text-emerald-450">35,000 CFA/nuit</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                fetch('/api/activity', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    clientId: user.id,
                                    activityType: 'view_enterprise',
                                    targetId: 'e-demo-hotel',
                                    targetCategory: 'hotel'
                                  })
                                })
                                .then(res => res.json().catch(() => ({})))
                                .then(() => {
                                  onRefreshState();
                                  setActiveTab('shop');
                                  setSelectedSector('hotel');
                                  triggerToast("✨ Redirection vers l'Hôtel Palmier !");
                                })
                                .catch(() => {});
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-950 rounded-lg text-[10px] font-bold cursor-pointer animate-pulse"
                            >
                              Découvrir 🏨
                            </button>
                          </div>
                        </div>

                        {/* Restaurant promo sample */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[8px] bg-amber-950 text-amber-400 border border-amber-900 font-extrabold rounded-lg px-2 py-0.5">PLAT SIGNATURE CHAUD</span>
                            <h4 className="text-white font-bold text-xs mt-2">Tiep Bou Dienn Prestige - Chez Marie</h4>
                            <p className="text-[11px] text-slate-450 mt-1">Le fleuron du patrimoine traditionnel sénégalais préparé sur commande d'exception.</p>
                          </div>
                          <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg">
                            <div>
                              <p className="text-[9px] text-slate-400">Prix exclusif :</p>
                              <p className="text-xs font-black text-amber-450">4,500 CFA</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                fetch('/api/activity', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    clientId: user.id,
                                    activityType: 'view_enterprise',
                                    targetId: 'e2',
                                    targetCategory: 'restaurant'
                                  })
                                })
                                .then(res => res.json().catch(() => ({})))
                                .then(() => {
                                  onRefreshState();
                                  setActiveTab('shop');
                                  setSelectedSector('restaurant');
                                  setSelectedShopId('e2');
                                  triggerToast("✨ Redirection chez Marie l'Africaine !");
                                })
                                .catch(() => {});
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-950 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Découvrir 🍗
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Right column: Algorithm stats & Interest breakdown */}
              <div className="xl:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
                    <span>🎬 Vos Scores d'Intérêts Recalculés</span>
                  </h3>
                  <p className="text-xs text-slate-405 mt-1">Vos points accumulés en temps réel en fonction de vos requêtes récentes au sein du quartier.</p>
                </div>

                {/* Score meters */}
                {(() => {
                  const userClass = clientClassifications.find(c => c.clientId === user.id) || {
                    scoreMap: {}
                  };
                  const scores = userClass.scoreMap || {};
                  
                  const categories = [
                    { id: 'supermarche', label: '🛒 Supermaché & Alimentation', color: 'bg-indigo-500' },
                    { id: 'restaurant', label: '🍗 Restauration Authentique', color: 'bg-amber-500' },
                    { id: 'hotel', label: '🏨 Club Hôtelier & Coworking', color: 'bg-emerald-500' },
                    { id: 'vetement', label: '👗 Mode & Prêt-à-porter', color: 'bg-rose-500' }
                  ];

                  const total: number = Number(Object.values(scores).reduce((a: number, b: any) => a + Number(b), 0)) || 1;

                  return (
                    <div className="space-y-4">
                      {categories.map(cat => {
                        const val = Number((scores as any)[cat.id] || 0);
                        const pct = Math.min(100, Math.round((val / total) * 100)) || 0;
                        
                        return (
                          <div key={cat.id} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-400">{cat.label}</span>
                              <span className="text-white font-mono">{pct}% ({val} pt)</span>
                            </div>
                            <div className="h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${cat.color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl text-[10px] text-slate-400 leading-relaxed space-y-1">
                        <p className="font-extrabold text-indigo-300">🔥 Fonctionnement des scores :</p>
                        <p>💡 <span className="font-bold text-white">Recherche / Visite</span> : +2-5 points</p>
                        <p>🛒 <span className="font-bold text-white">Ajout au panier</span> : +10 points</p>
                        <p>💰 <span className="font-bold text-white">Achat validé</span> : +20 points</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Clean user activity logs (TikTok styled card feed) */}
                <div className="space-y-3 pt-4 border-t border-slate-900">
                  <h4 className="text-white font-bold text-xs">Avis Récents du Quartier</h4>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto">
                    {companyReviews.slice(0, 3).map((rev: any) => (
                      <div key={rev.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono text-slate-500">{rev.createdAt ? rev.createdAt.split('T')[0] : 'Hier'}</span>
                          <div className="flex text-amber-500 text-[10px]">
                            {Array.from({ length: rev.rating }).map((_, i) => <span key={i}>★</span>)}
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-indigo-300">{rev.reviewerName} sur {rev.companyName}</p>
                        <p className="text-[11px] text-slate-300 italic line-clamp-2">"{rev.comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 1: SHOPPING */}
        {activeTab === 'shop' && (
          <div id="client-shop-view" className="space-y-6 animate-fade-in">
            
            {/* STAGE 1: CHOICE OF SECTOR */}
            {selectedSector === null && (
              <div className="space-y-6">
                <div className="border-b border-slate-800/60 pb-4">
                  <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-400" />
                    <span>Où souhaitez-vous faire vos courses aujourd'hui ?</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Sélectionnez un secteur commercial pour découvrir nos partenaires de proximité et passer votre commande.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      id: 'supermarche' as EnterpriseType,
                      title: 'Supermarchés Modernes 🛒',
                      desc: "Grande distribution organisée avec précision par rayons thématiques (créables librement par l'enseigne).",
                      badge: 'Rayons structurés & Point de vente intelligent',
                      color: 'border-violet-500/20 hover:border-violet-500/50 hover:bg-violet-950/10'
                    },
                    {
                      id: 'marche' as EnterpriseType,
                      title: 'Marchés Traditionnels / Épices 🍉',
                      desc: "Pas de rayons rigides ici ! Accédez directement à un grand étalage convivial de fruits, légumes et épices du terroir.",
                      badge: 'Grand Étalage direct & Éco-responsable',
                      color: 'border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/10'
                    },
                    {
                      id: 'restaurant' as EnterpriseType,
                      title: 'Restaurants, Cafés & Bistros 🍳',
                      desc: "Plats cuisinés locaux de qualité, tiep bou dienn, attiéké de poisson et desserts gourmands.",
                      badge: 'Cuisine traditionnelle à emporter/livrer',
                      color: 'border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-950/10'
                    },
                    {
                      id: 'hotel' as EnterpriseType,
                      title: 'Hôtels & Résidences Privées 🏨',
                      desc: "Réservation de chambres Deluxe ou espaces de coworking VIP connectés équipés de tout confort.",
                      badge: 'Hébergement de standing & Coworking',
                      color: 'border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-950/10'
                    },
                    {
                      id: 'alimentation' as EnterpriseType,
                      title: 'Alimentation Générale 🍎',
                      desc: "Épiceries de quartier et supérettes de proximité pour les conserves, boissons fraîches et condiments.",
                      badge: 'Produits de consommation & Épicerie',
                      color: 'border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-950/10'
                    },
                    {
                      id: 'vetement' as EnterpriseType,
                      title: 'Boutique de Vêtement & Mode 👚',
                      desc: "Prêt-à-porter, vêtements du terroir, chaussures de marque et styles tendances de créateurs locaux.",
                      badge: 'Habillement, Mode, Chaussures & Style',
                      color: 'border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-950/10'
                    },
                    {
                      id: 'danger-zone-placeholder' as any, // keep for list separation
                    }
                  ].filter(x => x.id !== 'danger-zone-placeholder').concat([
                    {
                      id: 'boucher' as EnterpriseType,
                      title: "Boucheries & Charcuteries 🥩",
                      desc: "Commandez des viandes de premier choix, rôtis d'agneau, entrecôtes maturées et charcuteries artisanales.",
                      badge: "Boucherie d'Excellence, Halal & Charcuterie",
                      color: 'border-red-500/20 hover:border-red-500/50 hover:bg-red-950/10'
                    },
                    {
                      id: 'poissonnerie' as EnterpriseType,
                      title: "Poissonneries & Traiteurs 🍤",
                      desc: "Dégustez nos poissons nobles, nos gambas royales tigrées fraîches et nos plateaux de crustacés fins.",
                      badge: "Poissonnerie Fine, Crustacés & Poissons Nobles",
                      color: 'border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-950/10'
                    },
                    {
                      id: 'autre' as EnterpriseType,
                      title: "Services, Salons & Bureaux 🏢",
                      desc: "Découvrez nos salons de beauté, cabinets de services professionnels et autres boutiques et commerces de quartier.",
                      badge: "Services aux Particuliers & Bureaux",
                      color: 'border-fuchsia-500/20 hover:border-fuchsia-500/50 hover:bg-fuchsia-950/10'
                    }
                  ]).map((sector) => {
                    const shopCount = allUsers.filter(u => {
                      if (u.profileType !== 'entreprise') return false;
                      if ((sector.id as string) === 'agriculteur') {
                        return (u.enterpriseType as string) === 'agriculteur';
                      }
                      if ((sector.id as string) === 'artisan') {
                        return (u.enterpriseType as string) === 'artisan';
                      }
                      if ((sector.id as string) === 'eleveur') {
                        return (u.enterpriseType as string) === 'eleveur';
                      }
                      if ((sector.id as string) === 'poissonnier') {
                        return (u.enterpriseType as string) === 'poissonnier';
                      }
                      if ((sector.id as string) === 'boucher') {
                        return u.enterpriseType === 'boucher';
                      }
                      if ((sector.id as string) === 'poissonnerie') {
                        return u.enterpriseType === 'poissonnerie';
                      }
                      return u.enterpriseType === sector.id;
                    }).length;
                    return (
                      <div
                        key={sector.id}
                        onClick={() => {
                          setSelectedSector(sector.id);
                          setSelectedShopId(null);
                        }}
                        className={`bg-slate-950/50 border rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between ${sector.color}`}
                      >
                        <div>
                          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 block w-max uppercase mb-3">
                            {sector.badge}
                          </span>
                          <h3 className="font-bold text-md text-white mb-2">{sector.title}</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">{sector.desc}</p>
                        </div>
                        <div className="border-t border-slate-900/60 pt-4 mt-4 flex items-center justify-between text-xs font-semibold text-slate-400 group">
                          <span>{shopCount} {shopCount > 1 ? 'établissements inscrits' : 'établissement inscrit'}</span>
                          <span className="text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Visiter <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STAGE 2: CHOICE OF SPECIFIC BUSINESS (OR ALL COPTIONS) */}
            {selectedSector !== null && selectedShopId === null && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedSector(null)}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 transition"
                      title="Retour aux secteurs"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h1 className="text-lg font-bold text-white flex items-center space-x-2">
                        <span>Sélectionnez votre commerce de proximité</span>
                      </h1>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Voici les commerces géolocalisés du secteur de type{" "}
                        <span className="text-indigo-300 font-bold uppercase">
                          {selectedSector === 'supermarche' 
                            ? 'Supermarché' 
                            : selectedSector === 'marche' 
                            ? 'Marché ouvert' 
                            : selectedSector === 'vetement' 
                            ? 'Boutique de vêtements' 
                            : (selectedSector as string) === 'agriculteur'
                            ? 'Agriculteurs / Maraîchers'
                            : (selectedSector as string) === 'artisan'
                            ? "Artisans d'Art / Fabricants"
                            : (selectedSector as string) === 'eleveur'
                            ? 'Éleveurs de Bétail / Volaille'
                            : (selectedSector as string) === 'poissonnier'
                            ? 'Poissonniers / Fruits de Mer'
                            : (selectedSector as string) === 'boucher'
                            ? 'Boucheries / Charcuteries'
                            : (selectedSector as string) === 'poissonnerie'
                            ? 'Poissonneries / Traiteurs de Mer'
                            : selectedSector === 'autre'
                            ? 'Services, Salons & Bureaux'
                            : selectedSector}
                        </span>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option to browse everything of the sector without preference */}
                <div
                  onClick={() => setSelectedShopId('all')}
                  className="bg-indigo-950/20 border-2 border-dashed border-indigo-500/30 rounded-2xl p-5 cursor-pointer hover:border-indigo-500/60 hover:bg-indigo-950/30 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-900/40 text-indigo-400">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <span>🛒 Naviguer sans préférence de boutique</span>
                        <span className="text-[9px] font-mono font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full">Sélecteur Flexible</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Cette option rassemble tous les produits du secteur. Utile pour comparer rapidement les prix et passer des commandes multi-destinataires.
                      </p>
                    </div>
                  </div>
                </div>

                {enterprisesInSector.length === 0 ? (
                  <div className="text-center py-10 bg-slate-950/45 rounded-xl border border-slate-850/60 p-6">
                    <p className="text-slate-400 text-xs">Aucun commerce de ce secteur n'est pour l'instant inscrit dans votre zone de livraison.</p>
                    <button
                      onClick={() => setSelectedSector(null)}
                      className="mt-3 bg-slate-900 duration-200 hover:bg-slate-850 text-xs font-semibold px-4 py-2 border border-slate-750 text-slate-200 rounded-lg"
                    >
                      Découvrir d'autres secteurs
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enterprisesInSector.map((ent) => {
                      const shopProductsCount = products.filter(p => p.sellerId === ent.id).length;
                      return (
                        <div
                          key={ent.id}
                          className="bg-white/95 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-800 rounded-3xl p-5 hover:border-indigo-500/50 shadow-md transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <h3 className="font-extrabold text-sm md:text-md text-slate-900 dark:text-white flex items-center gap-1.5">{ent.name}</h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                                {shopProductsCount} {shopProductsCount > 1 ? 'articles' : 'article'}
                              </span>
                            </div>

                            {/* Location / Geography criterion */}
                            <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 font-bold mb-3">
                              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-450 shrink-0" />
                              <span>Adresse : <strong className="text-slate-950 dark:text-slate-200 underline decoration-amber-500 font-black">{ent.address || "Non communiquée"}</strong></span>
                            </div>

                            {ent.description && (
                              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-300 font-semibold opacity-100 leading-relaxed mb-4">{ent.description}</p>
                            )}
                          </div>

                          <div className="border-t border-slate-150/20 dark:border-slate-900/60 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-900 dark:text-slate-400 font-mono font-bold">📞 {ent.phone || "Téléphone Indisponible"}</span>
                              {ent.phone && (
                                <WhatsAppButton
                                  phone={ent.phone}
                                  message={`Bonjour ${ent.name}, je suis intéressé par votre entreprise sur WeLink.`}
                                  iconOnly={true}
                                />
                              )}
                            </div>
                            <button
                              onClick={() => setSelectedShopId(ent.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                            >
                              <span>{ent.enterpriseType === 'hotel' ? 'Visiter' : 'Faire mes courses'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STAGE 3: DETAILED PRODUCTS FOR SPECIFIC BUSINESS / SECTOR */}
            {selectedSector !== null && selectedShopId !== null && (
              (() => {
                const seller = allUsers.find(u => u.id === selectedShopId);
                if (seller && seller.enterpriseType === 'hotel') {
                  return (
                    <HotelClientPortal
                      hotel={seller}
                      clientId={user.id}
                      clientName={user.name}
                      clientEmail={user.email}
                      clientPhone={user.phone || ''}
                      hotelRooms={hotelRooms}
                      hotelReservations={hotelReservations}
                      hotelCoupons={hotelCoupons}
                      hotelFomoSettings={hotelFomoSettings}
                      onRefreshState={onRefreshState}
                      onBack={() => { setSelectedShopId(null); }}
                    />
                  );
                }
                return (
                  <div className="space-y-6 animate-fade-in">
                <div className="bg-white/95 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-2">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-800 dark:text-slate-405 font-bold">
                      <button onClick={() => { setSelectedSector(null); setSelectedShopId(null); }} className="hover:text-indigo-400 underline">Boutique</button>
                      <span>/</span>
                      <button onClick={() => setSelectedShopId(null)} className="hover:text-indigo-450 dark:hover:text-indigo-400 underline animate-pulse">
                        {selectedSector === 'supermarche' 
                          ? 'Supermarchés' 
                          : selectedSector === 'marche' 
                          ? 'Marchés' 
                          : selectedSector === 'vetement' 
                          ? 'Boutiques de vêtements' 
                          : (selectedSector as string) === 'agriculteur'
                          ? 'Producteurs & Maraîchers'
                          : (selectedSector as string) === 'artisan'
                          ? "Artisans d'Art"
                          : (selectedSector as string) === 'eleveur'
                          ? 'Éleveurs & Volaille'
                          : (selectedSector as string) === 'poissonnier'
                          ? 'Poissonniers & Mer'
                          : (selectedSector as string) === 'boucher'
                          ? 'Boucheries & Charcuteries'
                          : (selectedSector as string) === 'poissonnerie'
                          ? 'Poissonneries & Traiteurs'
                          : selectedSector === 'autre'
                          ? 'Services, Salons & Bureaux'
                          : selectedSector}
                      </button>
                      <span>/</span>
                      <span className="text-indigo-700 dark:text-indigo-300 font-extrabold">
                        {selectedShopId === 'all' ? 'Toutes les boutiques' : allUsers.find(u => u.id === selectedShopId)?.name || 'Boutique active'}
                      </span>
                    </div>

                    {/* Shop Description Block */}
                    {selectedShopId === 'all' ? (
                      <div>
                        <h2 className="text-md font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Secteur : {selectedSector === 'supermarche' 
                            ? 'Tous les Supermarchés' 
                            : selectedSector === 'marche' 
                            ? 'Tous les Marchés' 
                            : selectedSector === 'vetement' 
                            ? 'Toutes les Boutiques de vêtements' 
                            : (selectedSector as string) === 'agriculteur'
                            ? 'Tous les Maraîchers Pro'
                            : (selectedSector as string) === 'artisan'
                            ? "Tous les Artisans d'Art"
                            : (selectedSector as string) === 'eleveur'
                            ? 'Tous les Éleveurs et Bergeries'
                            : (selectedSector as string) === 'poissonnier'
                            ? 'Tous les Poissonniers et Mareyeurs'
                            : (selectedSector as string) === 'boucher'
                            ? 'Toutes nos Boucheries & Charcuteries'
                            : (selectedSector as string) === 'poissonnerie'
                            ? 'Toutes nos Poissonneries & Traiteurs'
                            : selectedSector === 'autre'
                            ? 'Tous les Services, Salons & Bureaux'
                            : selectedSector}</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-300 font-semibold opacity-100 mt-1">Parcours étendu des produits de tous nos vendeurs partenaires de Douala à Yaoundé.</p>
                      </div>
                    ) : (
                      (() => {
                        const seller = allUsers.find(u => u.id === selectedShopId);
                        return seller ? (
                          <div className="space-y-1">
                            <h2 className="text-md sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                              <span>🛒 {seller.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 uppercase">En ligne</span>
                            </h2>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-800 dark:text-slate-350 font-bold">
                              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Situé à : <strong className="text-slate-950 dark:text-slate-100 font-black">{seller.address || "Non spécifié"}</strong></span>
                              </span>
                              <span>• Connexion sécurisée</span>
                              {seller.phone && (
                                <span className="flex items-center gap-1.5">• Direct : <strong className="text-indigo-650 dark:text-indigo-300">{seller.phone}</strong>
                                  <WhatsAppButton
                                    phone={seller.phone}
                                    message={`Bonjour ${seller.name}, je suis actuellement sur votre page WeLink et je souhaiterais vous contacter.`}
                                    iconOnly={true}
                                  />
                                </span>
                              )}
                            </div>
                            {seller.description && (
                              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-305 font-bold leading-relaxed italic pt-1.5 opacity-100">{seller.description}</p>
                            )}
                          </div>
                        ) : null;
                      })()
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      onClick={() => setSelectedShopId(null)}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-850 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Changer de boutique</span>
                    </button>

                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Chercher dans cette boutique..."
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-w-[200px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Products Grid Column */}
                  <div className={Object.keys(cart).length > 0 ? "lg:col-span-8 space-y-8" : "lg:col-span-12 space-y-8"}>

                    {/* SUPERMARKET & TRADITIONAL MARKET ISLE VIEW */}
                {(selectedSector === 'supermarche' || selectedSector === 'marche') && (
                  <div className="space-y-10 animate-fade-in">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12 text-slate-800 dark:text-slate-350 bg-white/80 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-2xl font-semibold">
                        Aucun produit n'est disponible en rayon ou étalage avec ces filtres.
                      </div>
                    ) : (selectedShopId && selectedShopId !== 'all' && activeRayonFilter === null) ? (
                      /* Rayons Menu Hub view - clicked first */
                      <div className="space-y-6">
                        <div className="border-b border-indigo-950/45 dark:border-indigo-955/20 pb-4">
                          <h2 className="text-md font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span>Découvrez les Étalages et Rayons de notre {selectedSector === 'marche' ? 'Marché' : 'Supermarché'}</span>
                          </h2>
                          <p className="text-xs text-slate-800 dark:text-slate-400 font-bold mt-1.5">Choisissez ci-dessous l'étalage ou le rayon que vous souhaitez visiter pour afficher ses articles frais du jour.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                          {(() => {
                            const rayonImages: Record<string, { img: string; desc: string }> = {
                              "Alimentation": {
                                img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
                                desc: "Produits de première nécessité, épices et ingrédients du quotidien."
                              },
                              "Épicerie": {
                                img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
                                desc: "Articles secs, conserves, huiles et condiments essentiels."
                              },
                              "Épicerie, Alimentation & Boissons": {
                                img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
                                desc: "Produits alimentaires de base et rafraîchissements de marque."
                              },
                              "Boissons": {
                                img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400",
                                desc: "Jus locaux, sodas énergisants, bières et eaux minérales."
                              },
                              "Produits Frais": {
                                img: "https://images.unsplash.com/photo-1573244514399-744c37afba58?auto=format&fit=crop&q=80&w=400",
                                desc: "Fruits frais, légumes de saison et produits laitiers importés."
                              },
                              "Boucherie & Poissonnerie": {
                                img: "https://images.unsplash.com/photo-1553082951-a17bd4092fea?auto=format&fit=crop&q=80&w=400",
                                desc: "Viandes sélectionnées et poissons frais locaux de première fraîcheur."
                              },
                              "Hygiène & Beauté": {
                                img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400",
                                desc: "Savons de douche, soins corporels, maquillage et parfumerie."
                              },
                              "Beauté, Cosmétiques & Parfum": {
                                img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400",
                                desc: "Soins d'élégance, cosmétiques haut de gamme et hygiène."
                              },
                              "Entretien": {
                                img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400",
                                desc: "Produits de nettoyage, détergents et entretien de maison."
                              },
                              "Appareils de Cuisson & Cuisine": {
                                img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400",
                                desc: "Petit électroménager et matériel culinaire professionnel."
                              },
                              "Climatiseurs & Ventilateurs": {
                                img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400",
                                desc: "Systèmes de climatisation de bureau et ventilateurs de maison."
                              },
                              "Téléphones & Tablettes": {
                                img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400",
                                desc: "Derniers smartphones, tablettes et accessoires certifiés."
                              },
                              "Téléviseurs, Audio & Vidéo": {
                                img: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=400",
                                desc: "Écrans plats, décodeurs de cinéma et enceintes portables."
                              },
                              "Mode & Vêtements": {
                                img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400",
                                desc: "Vêtements tendances, chaussures et accessoires de mode chic."
                              }
                            };

                            return Object.keys(productsByRayon).map((rayonName) => {
                              const rayonProducts = productsByRayon[rayonName];
                              const rayonConfig = rayonImages[rayonName] || {
                                img: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=400",
                                desc: "Explorez notre sélection complète d'articles haut de gamme."
                              };

                              return (
                                <div 
                                  key={rayonName} 
                                  onClick={() => setActiveRayonFilter(rayonName)}
                                  className="group bg-slate-950/65 border border-slate-850 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-md hover:shadow-indigo-950/25 transition duration-300 transform hover:scale-[1.015] cursor-pointer flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="w-full h-36 relative overflow-hidden bg-slate-900 border-b border-slate-850">
                                      <img 
                                        src={rayonConfig.img} 
                                        alt={rayonName} 
                                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                        <span className="text-[10px] uppercase font-bold bg-indigo-600/90 text-white keep-white px-2 py-0.5 rounded shadow">
                                          {rayonProducts.length} {rayonProducts.length > 1 ? 'articles' : 'article'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="p-4 space-y-1 bg-slate-100/10 dark:bg-slate-900/40 rounded-xl">
                                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">{rayonName}</h3>
                                      <p className="text-[11px] text-slate-800 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">{rayonConfig.desc}</p>
                                    </div>
                                  </div>

                                  <div className="p-4 pt-0">
                                    <button 
                                      type="button" 
                                      className="w-full border border-slate-800 group-hover:border-indigo-505/50 group-hover:bg-indigo-950/30 text-[10.5px] font-bold text-indigo-400 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5"
                                    >
                                      <span>Visiter ce Rayon</span>
                                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                                    </button>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ) : (
                      /* Specific Rayon Display or All Shops mode view (which lists everything) */
                      (() => {
                        const rayonList = (selectedShopId && selectedShopId !== 'all' && activeRayonFilter) 
                          ? [activeRayonFilter] 
                          : Object.keys(productsByRayon);

                        return (
                          <div className="space-y-10">
                            {selectedShopId && selectedShopId !== 'all' && activeRayonFilter && (
                              <div className="flex items-center justify-between pb-3 border-b border-slate-850 mb-4 bg-slate-950/25 p-3 rounded-xl animate-fade-in">
                                <span className="text-xs text-slate-300">
                                  Rayon actuel : <strong className="text-indigo-300">{activeRayonFilter}</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveRayonFilter(null)}
                                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl transition"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                  <span>Voir tous les rayons</span>
                                </button>
                              </div>
                            )}

                            {rayonList.map((rayonName) => {
                              const rayonProducts = productsByRayon[rayonName] || [];
                              if (rayonProducts.length === 0) return null;
                              return (
                                <div key={rayonName} className="space-y-4">
                                  {/* Rayon Shelf Ribbon Header */}
                                  <div className="flex items-center justify-between border-b border-indigo-950/60 pb-2">
                                    <h3 className="font-extrabold text-base text-indigo-900 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></span>
                                      <span>Rayon • {rayonName}</span>
                                      <span className="text-[10px] font-mono lowercase tracking-normal text-slate-500 normal-case bg-slate-950 border border-slate-900/80 px-2 py-0.5 rounded">
                                        {rayonProducts.length} {rayonProducts.length > 1 ? 'articles' : 'article'}
                                      </span>
                                    </h3>
                                    <span className="text-[10px] text-slate-500 font-mono italic">PLMC Aisle Configuration</span>
                                  </div>

                                  {/* Products on this shelf */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                                    {rayonProducts.map((p) => {
                                      const qtyInCart = cart[p.id] || 0;
                                      const hasPromo = p.promotionDiscount && p.promotionEnd && new Date(p.promotionEnd) > new Date();
                                      return (
                                        <div id={`product-card-${p.id}`} key={p.id} className={`rounded-2xl p-4 flex flex-col justify-between transition duration-300 hover:scale-[1.015] hover:shadow-lg ${hasPromo ? 'bg-rose-950/10 border border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.06)] hover:border-rose-500' : 'bg-slate-950/40 border border-slate-850/80 hover:border-violet-500/40 hover:shadow-violet-950/20'}`}>
                                          <div>
                                            {p.imageUrl && (
                                              <div>
                                                <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-slate-900 border border-slate-850 relative flex items-center justify-center">
                                                  <img 
                                                    src={activeImageByProduct[p.id] || p.imageUrl} 
                                                    alt={p.title} 
                                                    className="w-full h-full object-contain" 
                                                    referrerPolicy="no-referrer" 
                                                  />
                                                  {hasPromo && (
                                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-[9px] tracking-wide px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                                      <span>-{p.promotionDiscount}% FLASH</span>
                                                    </div>
                                                  )}
                                                </div>

                                                {p.images && p.images.length > 1 && (
                                                  <div className="flex items-center gap-1 mt-1 mb-3 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                                                    {p.images.map((img, idx) => {
                                                      const isSelected = (activeImageByProduct[p.id] || p.imageUrl) === img;
                                                      return (
                                                        <button 
                                                          key={idx}
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveImageByProduct(prev => ({ ...prev, [p.id]: img }));
                                                          }}
                                                          className={`w-9 h-9 rounded-md overflow-hidden border shrink-0 transition ${
                                                            isSelected ? 'border-violet-500 ring-1 ring-violet-500/50' : 'border-slate-800 hover:border-slate-700'
                                                          }`}
                                                        >
                                                          <img src={img} alt="thumbnail" className="w-full h-full object-contain bg-slate-950" />
                                                        </button>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-900/40 uppercase">
                                                {p.category}
                                              </span>
                                              {selectedShopId === 'all' && (
                                                <span className="text-[9px] text-slate-400 font-mono">
                                                  {p.sellerName}
                                                </span>
                                              )}
                                            </div>
                                            <h4 className="font-semibold text-xs text-slate-100 mb-0.5">{p.title}</h4>
                                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">{p.description}</p>
                                          </div>

                                          <div className="border-t border-slate-900/70 pt-2.5 flex items-center justify-between">
                                            <div>
                                              {hasPromo ? (
                                                <div className="space-y-1">
                                                  <div className="flex flex-col">
                                                    <span className="text-[9px] text-rose-450 font-bold uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                                                      <Flame className="w-3 h-3 text-red-500 animate-bounce" /> Vente Flash
                                                    </span>
                                                    <div className="flex items-baseline gap-1.5">
                                                      <span className="text-xs font-black text-rose-400 font-mono animate-fade-in">
                                                        {Math.round(p.price * (1 - p.promotionDiscount! / 100)).toLocaleString()} F
                                                      </span>
                                                      <span className="text-[9px] text-slate-550 line-through font-mono">
                                                        {p.price.toLocaleString()} F
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-1 mt-0.5">
                                                    <CountdownTimer expiryDate={p.promotionEnd!} onExpired={onRefreshState} className="text-[9px] font-bold" />
                                                  </div>
                                                </div>
                                              ) : (
                                                <>
                                                  <span className="text-xs font-bold text-violet-400 font-mono">{p.price.toLocaleString()} FCFA</span>
                                                  <span className="text-[9px] text-slate-500 block">la {p.unit}</span>
                                                </>
                                              )}
                                            </div>

                                            {p.stock === 0 ? (
                                              <span className="text-xs text-red-400 bg-red-950/20 px-2.5 py-1 rounded-lg">Rupture</span>
                                            ) : (
                                              <div className="flex items-center space-x-1">
                                                {qtyInCart > 0 ? (
                                                  <div className="flex items-center space-x-1.5 bg-slate-900 rounded-lg border border-slate-800 p-0.5">
                                                    <button
                                                      onClick={() => removeFromCart(p.id)}
                                                      className="w-5 h-5 rounded hover:bg-slate-800 text-xs text-slate-300 flex items-center justify-center transition"
                                                    >
                                                      -
                                                    </button>
                                                    <span className="text-xs font-bold text-slate-100">{qtyInCart}</span>
                                                    <button
                                                      onClick={() => addToCart(p.id, p.stock)}
                                                      className="w-5 h-5 rounded hover:bg-slate-800 text-xs text-slate-300 flex items-center justify-center transition"
                                                      disabled={qtyInCart >= p.stock}
                                                    >
                                                      +
                                                    </button>
                                                    <button
                                                      onClick={() => handleCheckout(p.id, qtyInCart)}
                                                      className="ml-1 bg-violet-600 hover:bg-violet-500 text-white text-[9px] font-bold px-2 py-0.5 rounded transition"
                                                    >
                                                      Prendre
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <button
                                                    onClick={() => addToCart(p.id, p.stock)}
                                                    className="bg-slate-900 border border-slate-800 hover:border-violet-500/30 hover:bg-slate-850 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 transition flex items-center space-x-1.5"
                                                  >
                                                    <ShoppingCart className="w-3 h-3 text-violet-400" />
                                                    <span>En rayon</span>
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

                {/* OTHER STANDARD BUSINESS TYPES (Resto, Corporate types) */}
                {selectedSector !== 'supermarche' && selectedSector !== 'marche' && (
                  <div>
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 bg-slate-950/20 border border-slate-850 rect-rounded">
                        Aucun service disponible pour le moment.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map((p) => {
                          const qtyInCart = cart[p.id] || 0;
                          const hasPromo = p.promotionDiscount && p.promotionEnd && new Date(p.promotionEnd) > new Date();
                          return (
                            <div 
                              id={`product-card-${p.id}`} 
                              key={p.id} 
                              className={`rounded-2xl p-4 flex flex-col justify-between transition duration-350 hover:scale-[1.015] hover:shadow-lg ${
                                hasPromo 
                                  ? 'bg-rose-50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.06)] hover:border-rose-400 dark:hover:border-rose-500' 
                                  : 'bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-slate-850 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 hover:shadow-md'
                              }`}
                            >
                              <div>
                                {p.imageUrl && (
                                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 relative flex items-center justify-center">
                                    <img 
                                      src={activeImageByProduct[p.id] || p.imageUrl} 
                                      alt={p.title} 
                                      className="w-full h-full object-contain" 
                                      referrerPolicy="no-referrer" 
                                    />
                                    {hasPromo && (
                                      <div className="absolute top-2 left-2 bg-gradient-to-r from-red-650 to-rose-600 text-white font-extrabold text-[9px] tracking-wide px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                        <span>-{p.promotionDiscount}% FLASH</span>
                                      </div>
                                    )}
                                    {selectedSector === 'vetement' && p.brand && (
                                      <span className="absolute bottom-2 left-2 bg-indigo-950/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-bold text-indigo-300 border border-indigo-900/40">
                                        🏷️ {p.brand}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {p.images && p.images.length > 1 && (
                                  <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800 font-sans">
                                    {p.images.map((img, idx) => {
                                      const isSelected = (activeImageByProduct[p.id] || p.imageUrl) === img;
                                      return (
                                        <button 
                                          key={idx}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveImageByProduct(prev => ({ ...prev, [p.id]: img }));
                                          }}
                                          className={`w-9 h-9 rounded-md overflow-hidden border shrink-0 transition ${
                                            isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-850'
                                          }`}
                                        >
                                          <img src={img} alt="thumbnail" className="w-full h-full object-contain bg-white dark:bg-slate-950" />
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-805 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                                    {p.category}
                                  </span>
                                  {selectedShopId === 'all' && (
                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                                      Chez • {p.sellerName}
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">{p.title}</h3>
                                <p className="text-xs text-slate-605 dark:text-slate-400 line-clamp-2 mb-2">{p.description}</p>
                                
                                {selectedSector === 'vetement' && (
                                  <div className="grid grid-cols-3 gap-1 bg-slate-950/50 p-2 border border-slate-850/65 rounded-xl text-[10px] mb-3 font-sans">
                                    <div className="text-center">
                                      <span className="text-slate-500 block uppercase font-black text-[7px] leading-none">Taille</span>
                                      <span className="text-slate-205 dark:text-slate-200 font-extrabold truncate block mt-1">{p.size || 'M'}</span>
                                    </div>
                                    <div className="text-center">
                                      <span className="text-slate-500 block uppercase font-black text-[7px] leading-none">Couleur</span>
                                      <span className="text-slate-205 dark:text-slate-200 font-bold truncate block mt-1">{p.color || 'Noir'}</span>
                                    </div>
                                    <div className="text-center">
                                      <span className="text-slate-500 block uppercase font-black text-[7px] leading-none">Matière</span>
                                      <span className="text-slate-205 dark:text-slate-200 font-bold truncate block mt-1">{p.material || 'Coton'}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="border-t border-slate-900/60 pt-3 flex items-center justify-between">
                                <div>
                                  {hasPromo ? (
                                    <div className="space-y-1">
                                      <div className="flex flex-col font-sans">
                                        <span className="text-[9px] text-rose-455 font-bold uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                                          <Flame className="w-3 h-3 text-red-500" /> Vente Flash
                                        </span>
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-xs font-black text-rose-400 font-mono">
                                            {Math.round(p.price * (1 - p.promotionDiscount! / 100)).toLocaleString()} F
                                          </span>
                                          <span className="text-[9px] text-slate-550 line-through font-mono">
                                            {p.price.toLocaleString()} F
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <CountdownTimer expiryDate={p.promotionEnd!} onExpired={onRefreshState} className="text-[9px] font-bold" />
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="text-sm font-bold text-indigo-400 font-mono">{p.price.toLocaleString()} FCFA</span>
                                      <span className="text-[10px] text-slate-500 block">le/la {p.unit}</span>
                                    </>
                                  )}
                                </div>

                                {p.stock === 0 ? (
                                  <span className="text-xs text-red-400 bg-red-950/20 px-2.5 py-1 rounded-lg">Épuisé</span>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    {qtyInCart > 0 ? (
                                      <div className="flex items-center space-x-1.5 bg-slate-900 rounded-lg border border-slate-800 p-0.5">
                                        <button
                                          onClick={() => removeFromCart(p.id)}
                                          className="w-5.5 h-5.5 rounded hover:bg-slate-800 text-xs text-slate-300 flex items-center justify-center transition"
                                        >
                                          -
                                        </button>
                                        <span className="text-xs font-bold text-slate-100">{qtyInCart}</span>
                                        <button
                                          onClick={() => addToCart(p.id, p.stock)}
                                          className="w-5.5 h-5.5 rounded hover:bg-slate-800 text-xs text-slate-300 flex items-center justify-center transition"
                                          disabled={qtyInCart >= p.stock}
                                        >
                                          +
                                        </button>
                                        <button
                                          onClick={() => handleCheckout(p.id, qtyInCart)}
                                          className="ml-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded transition"
                                        >
                                          Prendre
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => addToCart(p.id, p.stock)}
                                        className="bg-slate-900 border border-slate-800 hover:border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center space-x-1.5"
                                      >
                                        <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>Commander</span>
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
                )}

                </div> {/* End of HTML Products Left Grid Column */}

                {/* Column 2: Sticky Visual Shopping Cart Summary */}
                {Object.keys(cart).length > 0 && (
                    <div className="lg:col-span-4 lg:sticky lg:top-6 bg-black border-2 border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-indigo-400" />
                          <span>Mon Panier Complet</span>
                        </h3>
                        <span className="bg-indigo-900/60 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          {Object.values(cart).reduce((sum: number, q: number) => sum + q, 0)} articles
                        </span>
                      </div>

                      {/* Cart Items list */}
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {Object.entries(cart).map(([productId, quantity]) => {
                          const prod = products.find(p => p.id === productId);
                          if (!prod) return null;
                          const qty = Number(quantity);
                          const currentUnitPrice = getProdCurrentPrice(prod);
                          const unitPriceStr = currentUnitPrice !== prod.price ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="text-emerald-400 font-bold">{currentUnitPrice.toLocaleString()} FCFA</span>
                              <span className="text-slate-500 line-through text-[9px]">{prod.price.toLocaleString()} FCFA</span>
                            </span>
                          ) : (
                            <span>{prod.price.toLocaleString()} FCFA</span>
                          );

                          return (
                            <div key={productId} className="flex items-center justify-between bg-black p-2.5 rounded-xl border border-slate-800/80 text-xs shadow-sm">
                              <div className="flex-1 min-w-0 pr-2">
                                <h4 className="font-semibold text-slate-200 truncate">{prod.title}</h4>
                                <div className="text-[10px] text-slate-400 block font-mono">
                                  {unitPriceStr} <span className="text-slate-500 font-sans">/ {prod.unit}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                                  <button onClick={() => removeFromCart(productId)} className="px-1 text-slate-450 hover:text-white">-</button>
                                  <span className="px-1.5 text-slate-200 font-bold">{qty}</span>
                                  <button onClick={() => addToCart(productId, prod.stock)} className="px-1 text-slate-450 hover:text-white" disabled={qty >= prod.stock}>+</button>
                                </div>
                                <span className="font-bold text-slate-200 text-right min-w-[70px] shrink-0 text-[11px] font-mono">
                                  {(currentUnitPrice * qty).toLocaleString()} FCFA
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* AI-Powered Recommender Rules (Apriori and Association rules) */}
                      {(() => {
                        const aprioriRules = [
                          { item: "riz", recommendations: ["Huile", "Tomates", "Poisson"] },
                          { item: "lait", recommendations: ["Croissant", "Café premium", "Chocolat"] },
                          { item: "millet", recommendations: ["Arachide Pure", "Sucre"] },
                          { item: "biscuit", recommendations: ["Jus", "Yaourt"] },
                          { item: "savon", recommendations: ["Lotion", "Eau de cologne"] }
                        ];

                        const currentCartProducts = Object.keys(cart)
                          .map(id => products.find(p => p.id === id))
                          .filter(Boolean) as Product[];

                        const listRecs: Product[] = [];
                        currentCartProducts.forEach(prod => {
                          const matchingRule = aprioriRules.find(r => prod.title.toLowerCase().includes(r.item));
                          if (matchingRule) {
                            matchingRule.recommendations.forEach(recName => {
                              const found = products.find(p => 
                                p.title.toLowerCase().includes(recName.toLowerCase()) && 
                                p.sellerId === selectedShopId && 
                                p.stock > 0 &&
                                !cart[p.id]
                              );
                              if (found && !listRecs.some(pk => pk.id === found.id)) {
                                listRecs.push(found);
                              }
                            });
                          }
                        });

                        if (listRecs.length === 0) return null;

                        return (
                          <div className="bg-indigo-950/45 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2.5 animate-fade-in">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                              <span className="text-amber-400">💡</span>
                              <span>Règles Apriori • Suggestion d'achat</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">
                              Les clients ayant acheté des articles similaires ont aussi acheté :
                            </p>
                            <div className="space-y-1.5">
                              {listRecs.slice(0, 3).map((p) => (
                                <div key={p.id} className="bg-slate-950/70 py-1.5 px-2.5 rounded-xl border border-slate-900 flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs font-semibold text-slate-200 block truncate">{p.title}</span>
                                    <span className="text-[10px] font-mono font-bold text-indigo-400">{getProdCurrentPrice(p).toLocaleString()} F</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addToCart(p.id, p.stock)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white keep-white font-extrabold rounded-lg text-[9px] cursor-pointer transition whitespace-nowrap"
                                  >
                                    + Prendre
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Cart Total & Order button */}
                      <div className="border-t border-slate-855 pt-3.5 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span>Total :</span>
                          <span className="text-sm font-black text-emerald-400 font-mono">
                            {Object.entries(cart).reduce((sum: number, [pId, qty]) => {
                              const prod = products.find(p => p.id === pId);
                              return sum + (prod ? getProdCurrentPrice(prod) * Number(qty) : 0);
                            }, 0).toLocaleString()} FCFA
                          </span>
                        </div>

                        {/* Secure payment method selector */}
                        <div className="bg-black border border-slate-800 p-2.5 rounded-xl space-y-1.5">
                          <label className="block text-[8.5px] font-extrabold uppercase tracking-wider text-indigo-300">
                            🔒 Mode de Paiement Garanti
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            {paymentPreferences.length > 0 ? (
                              paymentPreferences.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setSelectedPaymentMethod(`${p.provider} (${p.label})`)}
                                  className={`px-2 py-1.5 rounded-lg text-left text-[9px] font-semibold border transition flex flex-col justify-between cursor-pointer ${
                                    selectedPaymentMethod === `${p.provider} (${p.label})` || selectedPaymentMethod === p.provider
                                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                  }`}
                                >
                                  <span className="flex items-center gap-1">
                                    <span>{p.type === 'mobile_money' ? '📲' : p.type === 'bank_transfer' ? '🏦' : '💳'}</span>
                                    <span className="truncate text-[8.5px] font-black">{p.provider}</span>
                                  </span>
                                  <span className="text-[8px] text-slate-500 truncate block mt-0.5">{p.label}</span>
                                </button>
                              ))
                            ) : (
                              [
                                { key: 'MTN MoMo', label: 'MTN MoMo Cameroun', icon: '📞' },
                                { key: 'Orange Money', label: 'Orange Money', icon: '🍊' },
                                { key: 'Express Union', label: 'Express Union', icon: '📲' },
                                { key: 'Carte Visa', label: 'Carte Bancaire', icon: '💳' }
                              ].map((m) => (
                                <button
                                  key={m.key}
                                  type="button"
                                  onClick={() => setSelectedPaymentMethod(m.key)}
                                  className={`px-2 py-1.5 rounded-lg text-left text-[9px] font-semibold border transition flex items-center gap-1 cursor-pointer ${
                                    selectedPaymentMethod === m.key
                                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                  }`}
                                >
                                  <span>{m.icon}</span>
                                  <span className="truncate">{m.key}</span>
                                </button>
                              ))
                            )}
                          </div>
                          <p className="text-[8px] text-slate-500 italic leading-snug">
                            💰 Les comptes Mobile Money ou bancaires configurés recevront une demande de validation push lors de l'expédition.
                          </p>
                        </div>

                        {/* Interactive Platform Escrow Switch Card */}
                        <div className="bg-indigo-950/20 border border-indigo-900/40 p-3 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-300 flex items-center gap-1">
                              🛡️ Option de Garantie Escrow
                            </span>
                            <span className="bg-indigo-950 text-indigo-300 font-extrabold text-[8px] px-1.5 py-0.5 rounded border border-indigo-805 uppercase">RECOMMANDÉ</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setUseEscrowPayment(!useEscrowPayment)}
                            className={`w-full py-2.5 px-3 rounded-xl text-left border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                              useEscrowPayment 
                                ? 'bg-indigo-950/60 border-indigo-505 text-indigo-200 font-extrabold shadow-sm' 
                                : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-350'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{useEscrowPayment ? '🔒' : '🔓'}</span>
                              <div className="flex flex-col">
                                <span className="text-[10px]">Paiement Bloqué (Séquestre)</span>
                                <span className="text-[8px] text-slate-400 font-normal leading-normal">
                                  L'argent reste bloqué sur la plateforme jusqu'à ce que vous confirmiez la réception de la commande.
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] font-extrabold shrink-0 pl-2">
                              {useEscrowPayment ? '🛡️ ACTIF' : '⚠️ SANS SÉQUESTRE'}
                            </span>
                          </button>
                          
                          <p className="text-[8.5px] text-slate-400 leading-snug">
                            {useEscrowPayment 
                              ? "🔒 Garantie double-protection active : l'entreprise prépare les articles, et l'argent est transféré uniquement quand vous validez la livraison."
                              : "⚠️ Sans Escrow, l'argent sera transféré immédiatement d'avance sans droit de réserve."}
                          </p>
                        </div>

                        {orderLoading ? (
                          <div className="w-full bg-slate-800 text-slate-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Validation du panier...</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <button
                              onClick={handleCheckoutBulk}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm transition duration-200 shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Valider la commande ({Object.keys(cart).length} produits)</span>
                            </button>
                            <button
                              onClick={() => {
                                setCart({});
                                triggerToast("🧹 Panier vidé !");
                              }}
                              className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:text-red-400 text-slate-400 text-[10.5px] py-1.5 rounded-xl transition cursor-pointer"
                            >
                              Vider le panier
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div> {/* End of grid layout wrapper */}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* TAB 2: GUIDED CATALOG OPTIONS */}
        {activeTab === 'ai-chat' && (
          <div id="client-ai-view" className="flex flex-col h-[500px]">
            <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <span>Assistant d'achat de Proximité</span>
                </h1>
                <p className="text-xs text-slate-400">Notre catalogue intelligent compare en temps réel tous les produits et services disponibles auprès des boutiques partenaires.</p>
              </div>
              <button
                id="clear-chat-btn"
                onClick={() => setChatMessages([
                  { id: '1', sender: 'ai', text: `Bonjour ${user.name} ! Qu'aimeriez-vous savoir sur nos produits ou sur les commerces aujourd'hui ?`, timestamp: new Date().toLocaleTimeString() }
                ])}
                className="text-slate-500 hover:text-slate-300 text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 transition"
              >
                Réinitialiser
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto bg-slate-950/70 border border-slate-850 rounded-2xl p-4 space-y-4 mb-4">
              {chatMessages.map((msg) => (
                <div id={`chat-msg-${msg.id}`} key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-900 text-slate-100 rounded-bl-none border border-slate-800/80 shadow-md'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-bold text-indigo-200/90 uppercase">{msg.sender === 'user' ? 'Moi' : 'Assistant Shopping'}</span>
                      <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-sm max-w-[80%] text-slate-400 flex items-center space-x-2 shadow-md">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                    <span className="text-xs ml-1">Recherche dans les catalogues partenaires...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef}></div>
            </div>

            {/* Suggestion Chips */}
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center">Idées :</span>
              {[
                "Qu'est-ce qu'on peut manger chez Chez Marie ?",
                "J'ai besoin d'une chambre d'hôtel de luxe",
                "Quels sont les produits de PLMC Market ?",
                "Y a-t-il des offres d'emploi pour moi ?"
              ].map((s, idx) => (
                <button
                  id={`chat-suggestion-${idx}`}
                  key={idx}
                  onClick={() => setChatInput(s)}
                  className="bg-slate-950/80 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-slate-400 hover:text-indigo-300 transition"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="flex space-x-2">
              <input
                id="chat-user-text-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Posez votre question à l'assistant IA..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
              <button
                id="chat-send-btn"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: JOB OFFERS */}
        {activeTab === 'jobs' && (
          <div id="client-jobs-view" className="space-y-6">
            <div className="border-b border-slate-800/60 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <span>Offres d'Emploi Actives</span>
              </h1>
              <p className="text-xs text-slate-400">Opportunités de carrières publiées par les entreprises locales. Seuls les clients peuvent postuler.</p>
            </div>

            {(() => {
              const mySentApps = jobApplications.filter(app => app.clientId === user.id);
              if (mySentApps.length > 0) {
                return (
                  <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                      <span>📊</span>
                      <span>Suivi de mes candidatures ({mySentApps.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mySentApps.map(app => (
                        <div key={app.id} className={`p-3 rounded-xl flex items-center justify-between border transition ${app.status === 'rejected' ? 'bg-red-955/10 border-red-900/30' : app.status === 'accepted' ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-slate-900 border-slate-800'}`}>
                          <div className="min-w-0 pr-2">
                            <span className="block text-xs font-extrabold text-slate-200 truncate">{app.jobTitle}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{app.companyName}</span>
                          </div>
                          <div className="shrink-0 font-sans">
                            {app.status === 'rejected' ? (
                              <span className="text-[10px] bg-red-955 text-red-400 border border-red-900/40 px-2 py-0.5 rounded font-extrabold shadow uppercase tracking-wide">
                                Refusée ❌
                              </span>
                            ) : app.status === 'accepted' ? (
                              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-extrabold shadow uppercase tracking-wide">
                                Acceptée 🎉
                              </span>
                            ) : (
                              <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900/40 px-2 py-0.5 rounded font-extrabold animate-pulse uppercase tracking-wide">
                                Transmise ⏳
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {jobOffers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Aucune offre d'emploi active pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {jobOffers.map((j) => {
                  const myApplication = jobApplications.find(app => app.jobId === j.id && app.clientId === user.id);
                  const hasApplied = !!myApplication;
                  return (
                    <div id={`job-card-${j.id}`} key={j.id} className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 hover:border-slate-350 dark:hover:border-slate-700/60 transition shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[10px] font-extrabold tracking-wider text-indigo-700 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-sm">
                            🏬 {j.companyType.toUpperCase()}
                          </span>
                          <h3 className="font-bold text-md text-slate-850 dark:text-slate-100 mt-1">{j.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Proposé par <strong className="text-slate-800 dark:text-slate-200 font-bold">{j.companyName}</strong></p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">{j.salary}</span>
                          <span className="text-[10px] text-slate-500 flex items-center justify-start sm:justify-end gap-1 font-medium font-mono">
                            <MapPin className="w-3 h-3" /> {j.location}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{j.description}</p>

                      <div className="mb-4">
                        <span className="block text-xs font-semibold text-slate-400 mb-1.5">Exigences requises :</span>
                        <div className="flex flex-wrap gap-1.5">
                          {j.requirements.map((req, idx) => (
                            <span id={`req-badge-${idx}`} key={idx} className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] px-2.5 py-1 rounded-full">
                              • {req}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-900/60 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-[10px] text-slate-500">Publiée le : {j.createdAt}</span>
                        {hasApplied ? (
                          myApplication.status === 'rejected' ? (
                            <div className="bg-red-950/45 text-red-350 border border-red-900/40 rounded-xl px-4 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2.5">
                              <span className="text-red-400 font-extrabold flex items-center space-x-1 shrink-0">
                                <span>❌ Candidature Refusée</span>
                              </span>
                              <span className="text-slate-400">Votre profil ou CV n'a pas été retenu pour ce poste par l'entreprise.</span>
                            </div>
                          ) : myApplication.status === 'accepted' ? (
                            <div className="bg-emerald-950/45 text-emerald-300 border border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2.5">
                              <span className="text-emerald-400 font-extrabold flex items-center space-x-1 shrink-0">
                                <span>🎉 Candidature Acceptée !</span>
                              </span>
                              <span className="text-slate-200">Félicitations, l'entreprise a validé votre profil ! Elle vous contactera très prochainement.</span>
                            </div>
                          ) : (
                            <div className="bg-emerald-950/45 text-emerald-300 border border-emerald-900/60 rounded-xl px-4 py-2 text-xs flex items-center space-x-2.5">
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Candidature transmise le {myApplication.appliedAt} ({myApplication.cvType === 'file' ? 'CV importé' : 'CV rédigé en ligne'}) • En attente de traitement ⏳</span>
                            </div>
                          )
                        ) : (
                          <button
                            id={`apply-job-btn-${j.id}`}
                            onClick={() => handleApplyJob(j.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                          >
                            Postuler à cette offre d'emploi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PERSONAL ORDERS */}
        {activeTab === 'orders' && (
          <div id="client-orders-view" className="space-y-6">
            <div className="border-b border-slate-800/60 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <ListTodo className="w-5 h-5 text-indigo-400" />
                <span>Mes Achats & Commandes de proximité</span>
              </h1>
              <p className="text-xs text-slate-400">Suivi en direct des commandes passées auprès de nos entreprises partenaires.</p>
            </div>

            {orders.filter(o => o.buyerId === user.id).length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Vous n'avez pas encore effectué d'achats sur la plateforme.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.filter(o => o.buyerId === user.id).map((o) => (
                  <div 
                    id={`order-card-${o.id}`} 
                    key={o.id} 
                    className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-800 transition shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-900">ID: {o.id}</span>
                          <span className="text-indigo-600 dark:text-indigo-300 font-extrabold text-xs">💻 Commerce : {o.sellerName}</span>
                        </div>
                        <h4 className="font-bold text-slate-850 dark:text-slate-100 text-sm">{o.productTitle}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Quantité : <strong className="text-slate-700 dark:text-slate-200 font-mono">{o.quantity} {o.productTitle.toLowerCase().includes('bar') || o.productTitle.toLowerCase().includes('gambas') || o.productTitle.toLowerCase().includes('poisson') || o.productTitle.toLowerCase().includes('calamar') ? 'kg' : ''}</strong> • Prix : <strong className="text-slate-700 dark:text-slate-200 font-mono">{(o.price * o.quantity).toLocaleString()} FCFA</strong>
                          {o.paymentMethod && (
                            <span className="ml-2.5 inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 text-[10px] font-bold">
                              🛡️ {o.paymentMethod}
                            </span>
                          )}
                        </p>

                        {o.customCut && (
                          <div className="mt-1 text-[11px] font-bold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-xl border border-red-100 dark:border-red-900/30 inline-flex items-center gap-1 mr-2">
                            <span>✂️ Découpe/Préparation :</span>
                            <span className="font-extrabold capitalize">{o.customCut === 'des_cubes' ? 'Cubes' : o.customCut === 'tranches' ? 'Tranches' : o.customCut === 'hache' ? 'Haché' : o.customCut === 'entier' ? 'Entier' : o.customCut}</span>
                          </div>
                        )}

                        {o.serviceType && (
                          <div className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-350 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-xl border border-rose-100 dark:border-rose-900/30 inline-flex items-center gap-1 mr-2">
                            <span>🍽️ Service :</span>
                            <span className="font-extrabold capitalize">
                              {o.serviceType === 'dinein' ? 'Sur Place' : o.serviceType === 'takeout' ? 'À Emporter' : 'En Livraison'}
                            </span>
                            {o.tableNumber && <span className="text-rose-400 dark:text-rose-300 font-extrabold">(Table {o.tableNumber})</span>}
                          </div>
                        )}

                        {o.deliveryAddress && (
                          <div className="mt-1 block text-xs text-slate-500 dark:text-slate-400 font-medium">
                            📍 <strong>Adresse de livraison :</strong> {o.deliveryAddress}
                          </div>
                        )}

                        {/* Scheduled livraison Info */}
                        {o.scheduledDate && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-100 dark:border-cyan-900/30 text-xs font-semibold flex-wrap">
                            <span>🚚 Livraison de proximité planifiée :</span>
                            <span className="font-bold">{new Date(o.scheduledDate).toLocaleDateString('fr-FR')}</span>
                            {o.scheduledTime && <span>à <span className="font-bold">{o.scheduledTime}</span></span>}
                          </div>
                        )}

                        {/* Interactive Platform Escrow Status details lock */}
                        {o.isEscrow && (
                          <div className="mt-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5 font-bold text-indigo-805 dark:text-indigo-300">
                                <span>🔒 Mode Escrow (Garantie Plateforme) :</span>
                                <span className={`text-[9.5px] uppercase font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                                  o.escrowStatus === 'released' 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-305 border-emerald-100 dark:border-emerald-900/40' 
                                    : o.escrowStatus === 'refunded'
                                    ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-705 dark:text-amber-305 border-amber-150 dark:border-amber-900/40'
                                }`}>
                                  {o.escrowStatus === 'released' ? '💸 Libéré au vendeur' : o.escrowStatus === 'refunded' ? '↩️ Remboursé' : '🔒 Bloqué par la Plateforme'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-medium">
                                {o.escrowStatus === 'released' 
                                  ? "Garantie dénouée : les fonds ont été libérés avec succès vers l'entreprise suite à votre confirmation."
                                  : o.escrowStatus === 'refunded'
                                  ? "La commande a été annulée. L'argent a été recrédité en toute sécurité sur votre moyen de paiement."
                                  : "Les fonds sont sécurisés sous séquestre. Dès réception ou livraison, cliquez sur le bouton de déblocage pour payer le commerçant."}
                              </p>
                            </div>
                            
                            {o.escrowStatus === 'locked' && o.status !== 'delivered' && o.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmOrderDelivered(o.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 font-extrabold px-3.5 py-2 rounded-xl text-white keep-white flex items-center justify-center gap-1 shrink-0 shadow-md cursor-pointer border border-emerald-500 transition duration-150 text-[10.5px]"
                              >
                                <span>✓ Débloquer & Confirmer</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Interactive direct-contact coordinates panel */}
                        {(() => {
                          const sellerProfile = allUsers.find(u => u.id === o.sellerId);
                          if (!sellerProfile) return null;
                          return (
                            <div className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-850">
                              <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase text-[9px] tracking-wide block sm:inline">📱 Coordonnées Client ⇆ Vendeur :</span>
                              {sellerProfile.phone && (
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={`tel:${sellerProfile.phone}`} 
                                    className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline font-bold flex items-center gap-1"
                                    title="Appeler le commerçant"
                                  >
                                    📞 {sellerProfile.phone}
                                  </a>
                                  <WhatsAppButton 
                                    phone={sellerProfile.phone} 
                                    message={`Bonjour ${sellerProfile.name}, je vous contacte concernant ma commande effectuée sur WeLink.`}
                                    iconOnly={true}
                                  />
                                </div>
                              )}
                              {sellerProfile.email && (
                                <a 
                                  href={`mailto:${sellerProfile.email}`} 
                                  className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline flex items-center gap-1"
                                  title="Envoyer un e-mail"
                                >
                                  ✉️ {sellerProfile.email}
                                </a>
                              )}
                              {sellerProfile.address && (
                                <span className="text-slate-500 dark:text-slate-450 text-[11px] flex items-center gap-1">
                                  📍 {sellerProfile.address}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2.5 shrink-0 self-stretch md:self-auto border-t md:border-t-0 border-slate-100 dark:border-slate-900 pt-2.5 md:pt-0">
                        <span className="text-[10px] font-mono font-bold text-slate-450 dark:text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                        
                        <div className="flex items-center gap-1">
                          {o.status === 'pending' && <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-805 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">⏳ En attente</span>}
                          {o.status === 'accepted' && <span className="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-805 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">✓ Confirmé</span>}
                          {o.status === 'shipped' && <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-805 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">🚚 En livraison</span>}
                          {o.status === 'delivered' && <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-805 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">🎉 Reçu</span>}
                          {o.status === 'cancelled' && <span className="bg-red-100 dark:bg-red-950/40 text-red-805 dark:text-red-300 border border-red-200 dark:border-red-900/50 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">❌ Annulée</span>}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Instant Messaging entry trigger & Order operations */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1.5 border-t border-slate-100 dark:border-slate-900/60">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDeliveryChat(o)}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/45 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-305 text-xs font-black border border-indigo-150 dark:border-indigo-900/60 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>💬 Contacter le vendeur</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceOrder(o)}
                          className="px-3.5 py-1.5 bg-slate-100/80 hover:bg-slate-205 dark:bg-slate-900 dark:hover:bg-slate-850/60 text-slate-700 dark:text-slate-300 text-xs font-black border border-slate-200 dark:border-slate-805 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{o.status === 'pending' ? '📑 Devis Pro Forma' : '🧾 Facture PDF'}</span>
                        </button>
                      </div>

                      {o.status !== 'delivered' && o.status !== 'shipped' && o.status !== 'cancelled' && (
                        <div>
                          {editingOrderId === o.id ? (
                            <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase">Qté :</label>
                              <input
                                type="number"
                                min="1"
                                className="w-14 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs px-2 py-0.5 rounded-lg text-slate-800 dark:text-white font-mono font-bold"
                                value={editingQuantity}
                                onChange={(e) => setEditingQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              />
                              <button
                                type="button"
                                onClick={() => handleModifyOrderQuantity(o.id, editingQuantity)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg text-[10.5px] transition cursor-pointer"
                              >
                                Enregistrer
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingOrderId(null)}
                                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-755 text-slate-600 dark:text-slate-350 font-extrabold rounded-lg text-[10.5px] transition cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingOrderId(o.id);
                                  setEditingQuantity(o.quantity);
                                }}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-250 dark:border-slate-800 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                ✏️ Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(o.id)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-650 dark:text-red-300 text-xs font-extrabold border border-red-200/40 dark:border-red-900/30 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                ✕ Annuler
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {(o.status === 'delivered' || o.status === 'cancelled') && (
                        <button
                          type="button"
                          onClick={() => handleReorder(o.productId, o.sellerId, o.quantity, o.customCut)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md border border-emerald-500"
                        >
                          🔄 Commander à nouveau
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PAYMENT PREFERENCES */}
        {activeTab === 'payments' && (
          <div id="client-payments-view" className="space-y-6">
            <div className="border-b border-slate-800/60 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span>Gestion de Mes Moyens de Paiement</span>
              </h1>
              <p className="text-xs text-slate-400">
                Configurez et gérez vos comptes de Mobile Money ou coordonnées bancaires pour accélérer vos commandes locales et simplifier les dénouements de transactions.
              </p>
            </div>

            {/* Layout Grid: Left Sidebar with list, Right Sidebar with form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left col: Saved Preferences cards */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vos Comptes Enregistrés</h3>
                  {!isAddingPreference && (
                    <button
                      id="btn-add-payment-pref"
                      onClick={handleOpenAddPreference}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Enregistrer un moyen
                    </button>
                  )}
                </div>

                {paymentPreferences.length === 0 ? (
                  <div className="text-center py-12 p-8 bg-slate-950/35 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                    <p className="mb-2">Aucun moyen de paiement configuré pour le moment.</p>
                    <button
                      onClick={handleOpenAddPreference}
                      className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
                    >
                      Ajouter votre premier compte maintenant
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentPreferences.map((pref) => {
                      const isDefault = pref.isDefault;
                      const isMobileMoney = pref.type === 'mobile_money';
                      const isBank = pref.type === 'bank_transfer';
                      const isCard = pref.type === 'card';

                      // Decide aesthetic themes
                      let cardBg = "bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-950 border-indigo-505/25";
                      let typeLabel = "Carte Bancaire";
                      let providerColor = "text-indigo-450";
                      let badgeIcon = "💳";

                      if (isMobileMoney) {
                        if (pref.provider.toLowerCase().includes('wave')) {
                          cardBg = "bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border-blue-500/30";
                          providerColor = "text-blue-400";
                        } else if (pref.provider.toLowerCase().includes('orange')) {
                          cardBg = "bg-gradient-to-br from-orange-950/40 via-slate-900 to-slate-950 border-orange-500/30";
                          providerColor = "text-orange-400";
                        } else {
                          cardBg = "bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/30";
                          providerColor = "text-emerald-400";
                        }
                        typeLabel = "Mobile Money";
                        badgeIcon = "📲";
                      } else if (isBank) {
                        cardBg = "bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-slate-955 border-slate-700";
                        typeLabel = "Virement Bancaire";
                        providerColor = "text-red-400";
                        badgeIcon = "🏦";
                      }

                      return (
                        <div
                          id={`pref-card-${pref.id}`}
                          key={pref.id}
                          className={`relative rounded-2xl p-4 border transition duration-300 flex flex-col justify-between h-44 shadow-lg overflow-hidden ${cardBg} ${isDefault ? 'border-indigo-500 shadow-indigo-950/20 ring-1 ring-indigo-500/55' : 'border-slate-850 hover:border-slate-700'}`}
                        >
                          {/* Top row */}
                          <div className="z-10 flex items-start justify-between">
                            <div>
                              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                                {badgeIcon} {typeLabel}
                              </span>
                              <h4 className="font-extrabold text-sm text-slate-100 line-clamp-1">
                                {pref.label}
                              </h4>
                            </div>
                            {isDefault && (
                              <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full">
                                PAR DÉFAUT
                              </span>
                            )}
                          </div>

                          {/* Account Info details */}
                          <div className="z-10 my-2">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block">
                              Coordonnées
                            </span>
                            <span className="font-mono text-xs text-white font-extrabold tracking-wide break-all block">
                              {pref.accountNumber}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block truncate mt-1">
                              Banque/Service : <strong className={`${providerColor} font-bold`}>{pref.provider}</strong>
                            </span>
                          </div>

                          {/* Footer details & action links */}
                          <div className="z-10 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            <span className="text-[9px] text-slate-550 font-medium truncate max-w-[100px]" title={pref.holderName}>
                              Titulaire : <strong className="text-slate-350">{pref.holderName}</strong>
                            </span>

                            <div className="flex items-center gap-2">
                              {!isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultPreference(pref.id)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-305 hover:underline font-bold transition cursor-pointer font-sans"
                                  title="Définir comme moyen principal"
                                >
                                  Défaut
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditPreference(pref)}
                                className="text-[10px] text-slate-400 hover:text-white transition font-bold cursor-pointer font-sans"
                                title="Modifier ce moyen"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePreference(pref.id)}
                                className="text-[10px] text-red-500 hover:text-red-400 transition font-bold cursor-pointer font-sans"
                                title="Supprimer ce moyen"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>

                          {/* Decorative overlay background design elements */}
                          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-slate-800/10 blur-xl pointer-events-none"></div>
                          <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none"></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Col: Editor/Builder Form & Live Preview card */}
              <div className="lg:col-span-12 xl:col-span-5 space-y-4">
                
                {isAddingPreference ? (
                  <div className="bg-slate-950/45 border border-slate-850 p-5 rounded-2xl space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-indigo-400" />
                        <span>{editingPreference ? "Modifier le moyen" : "Nouveau moyen de paiement"}</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingPreference(false);
                          setEditingPreference(null);
                        }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Annuler
                      </button>
                    </div>

                    {/* LIVE CARD PREVIEW BLOCK */}
                    <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 p-4 rounded-xl border border-indigo-900/40 relative overflow-hidden h-36 flex flex-col justify-between shadow-md">
                      <div className="z-10 flex items-start justify-between">
                        <div>
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-400 block">
                            Aperçu du Moyen de Paiement
                          </span>
                          <span className="text-xs font-black text-white mt-1 block">
                            {formPrefLabel || "Sans nom ..."}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-200">
                          {formPrefType === 'mobile_money' ? '📲 PHONE' : formPrefType === 'bank_transfer' ? '🏦 BANK' : '💳 CARD'}
                        </span>
                      </div>
                      
                      <div className="z-10 my-1">
                        <span className="text-[9px] text-indigo-300 font-mono block">NUMÉRO / IDENTIFIANT</span>
                        <span className="font-mono text-xs font-black text-white tracking-wider block">
                          {formPrefAccountNumber || "Saisir le numéro..."}
                        </span>
                      </div>

                      <div className="z-10 flex items-center justify-between text-[9px] text-indigo-300 border-t border-indigo-900/60 pt-2">
                        <span className="truncate max-w-[120px]">
                          Nom : <strong className="text-white font-bold">{formPrefHolderName || "Titulaire..."}</strong>
                        </span>
                        <span>
                          Service : <strong className="text-amber-300 font-black uppercase text-[10px]">{formPrefProvider || "WAVE"}</strong>
                        </span>
                      </div>

                      <div className="absolute right-[-10px] bottom-[-20px] w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none"></div>
                    </div>

                    {/* FORM COMPONENT */}
                    <form onSubmit={handleSavePreference} className="space-y-4 cursor-default">
                      
                      {/* Preference Type selection */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Type de compte</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'mobile_money', label: 'Mobile Mo.', icon: '📲' },
                            { key: 'bank_transfer', label: 'Virement', icon: '🏦' },
                            { key: 'card', label: 'Carte', icon: '💳' },
                          ].map((t) => (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => {
                                setFormPrefType(t.key as any);
                                // Set friendly default providers if empty or matching previous
                                if (t.key === 'mobile_money') setFormPrefProvider('MTN MoMo');
                                else if (t.key === 'bank_transfer') setFormPrefProvider('Société Générale Cameroun');
                                else setFormPrefProvider('Visa d\'Afrique');
                              }}
                              className={`py-1.5 px-1 rounded-xl text-center text-xs font-bold border transition duration-150 cursor-pointer ${formPrefType === t.key ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-white'}`}
                            >
                              <span className="block text-[15px] mb-0.5">{t.icon}</span>
                              <span className="text-[10px]">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Label nickname */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1" htmlFor="input_pref_label">Nom complet / Raccourci</label>
                        <input
                          id="input_pref_label"
                          type="text"
                          required
                          value={formPrefLabel}
                          onChange={(e) => setFormPrefLabel(e.target.value)}
                          placeholder="Ex: Mon Compte Principal MoMo, IBAN Epargne..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-605 focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>

                      {/* Nom du titulaire */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1" htmlFor="input_pref_holder">Titulaire de la ligne / du compte</label>
                        <input
                          id="input_pref_holder"
                          type="text"
                          required
                          value={formPrefHolderName}
                          onChange={(e) => setFormPrefHolderName(e.target.value)}
                          placeholder="Saisissez le nom complet"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-605 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Operator bank selection input */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1" htmlFor="input_pref_provider">Service / Opérateur ou Banque</label>
                        {formPrefType === 'mobile_money' ? (
                          <div className="grid grid-cols-3 gap-1.5">
                            {['Express Union', 'Orange Money', 'MTN MoMo'].map((op) => (
                              <button
                                key={op}
                                type="button"
                                onClick={() => setFormPrefProvider(op)}
                                className={`py-1.5 px-2 rounded-lg text-center text-xs font-bold border transition cursor-pointer ${formPrefProvider === op ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                              >
                                {op === 'Express Union' ? '📲 ' : op === 'Orange Money' ? '🍊 ' : '📞 '} {op}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input
                            id="input_pref_provider"
                            type="text"
                            required
                            value={formPrefProvider}
                            onChange={(e) => setFormPrefProvider(e.target.value)}
                            placeholder="Ex: Société Générale, Ecobank, Visa, BNDE..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-605 focus:outline-none focus:border-indigo-500"
                          />
                        )}
                      </div>

                      {/* Account identifier detail */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1" htmlFor="input_pref_account">
                          {formPrefType === 'mobile_money' ? 'Numéro de téléphone' : formPrefType === 'bank_transfer' ? 'Numéro de RIB / Compte' : 'Numéro de carte (Masqué)'}
                        </label>
                        <input
                          id="input_pref_account"
                          type="text"
                          required
                          value={formPrefAccountNumber}
                          onChange={(e) => setFormPrefAccountNumber(e.target.value)}
                          placeholder={formPrefType === 'mobile_money' ? '+221 77 123 45 67' : formPrefType === 'bank_transfer' ? 'SN012 03456 000123456789 22' : '4000 1234 5678 9010'}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-605 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      {/* Default checkbox */}
                      <div className="flex items-center space-x-2 pt-1 font-sans">
                        <input
                          id="input_pref_default"
                          type="checkbox"
                          checked={formPrefIsDefault}
                          onChange={(e) => setFormPrefIsDefault(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-800 rounded-sm focus:ring-indigo-550"
                        />
                        <label htmlFor="input_pref_default" className="text-xs text-slate-300 font-medium cursor-pointer">
                          Utiliser par défaut pour mes achats
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-slate-950 flex items-center gap-3 font-sans">
                        <button
                          type="submit"
                          className="flex-1 bg-indigo-605 hover:bg-indigo-600 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition duration-200 cursor-pointer text-center"
                        >
                          {editingPreference ? "Enregistrer" : "Enregistrer le moyen"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingPreference(false);
                            setEditingPreference(null);
                          }}
                          className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 font-extrabold py-2 px-4 rounded-xl text-xs transition cursor-pointer text-center"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-950/20 border border-slate-850 space-y-4">
                    <h3 className="font-bold text-xs text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      Environnement Sécurisé Simulé
                    </h3>
                    <p className="text-xs text-slate-450 leading-relaxed">
                      Vos paramètres de paiement sont sauvegardés de manière isolée dans le stockage local de votre navigateur. Rien n'est prélevé ni enregistré sur de vrais comptes bancaires externes.
                    </p>
                    <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-1.5">
                      <p className="text-xs text-slate-300 font-bold block">💡 Pourquoi configurer ces moyens ?</p>
                      <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-1">
                        <li>Bypass rapide lors de l'achat local direct.</li>
                        <li>Préréglage automatique de l'indicateur de paiement garanti.</li>
                        <li>Visualisation des données d'encaissement en direct.</li>
                      </ul>
                    </div>

                    <button
                      id="btn-trigger-add-flow"
                      onClick={handleOpenAddPreference}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1 font-sans"
                    >
                      <Plus className="w-4 h-4" /> Enregistrer un nouveau compte
                    </button>
                  </div>
                )}

              </div>

            </div> {/* End grid layout */}
          </div>
        )}

        {/* TAB 6: CLIENT PROFILE CONFIGURATION */}
        {activeTab === 'profile' && (
          <div id="client-profile-view" className="space-y-6">
            <div className="border-b border-slate-800/65 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <span className="text-indigo-400">👤</span>
                <span>Mon Profil de Quartier</span>
              </h1>
              <p className="text-xs text-slate-400">
                Personnalisez votre identité de consommateur local. Modifiez votre avatar, rédigez votre biographie d'achat et sélectionnez les thématiques de produits locales qui vous passionnent.
              </p>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Form Editors */}
              <div className="lg:col-span-12 xl:col-span-7 bg-slate-950/45 border border-slate-850 p-6 rounded-2xl space-y-6">
                
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Photo Profile Section */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Photo & Avatar de Profil</label>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-900 border border-slate-850 rounded-xl">
                      {/* Current Preview */}
                      <div className="relative group shrink-0">
                        {profileAvatar ? (
                          <img 
                            src={profileAvatar} 
                            alt="Aperçu" 
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-lg shadow-indigo-950/40" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-slate-700 flex items-center justify-center text-2xl">
                            👤
                          </div>
                        )}
                        <span className="absolute bottom-[-6px] right-[-6px] bg-indigo-600 text-white rounded-full px-1.5 py-0.5 text-[8px] font-bold">PREVIEW</span>
                      </div>

                      {/* Presets and URL Input */}
                      <div className="flex-1 space-y-3 w-full">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold mb-1">Choisissez parmi nos modèles disponibles :</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: "Jean", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jean" },
                              { label: "Marie", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Marie" },
                              { label: "Awa", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Awa" },
                              { label: "Koffi", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Koffi" },
                              { label: "Fatou", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Fatou" },
                              { label: "Moussa", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Moussa" }
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setProfileAvatar(preset.url)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] border font-bold transition duration-150 cursor-pointer ${profileAvatar === preset.url ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-semibold">Ou collez une adresse d'image externe :</p>
                          <input
                            type="url"
                            value={profileAvatar}
                            onChange={(e) => setProfileAvatar(e.target.value)}
                            placeholder="Ex: https://images.unsplash.com/photo-..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* General Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="profile_name_input">Nom Complet</label>
                      <input
                        id="profile_name_input"
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Ex: El Hadji Malick"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="profile_phone_input">Numéro de Téléphone</label>
                      <input
                        id="profile_phone_input"
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="Ex: +221 77 450 12 34"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="profile_address_input">Adresse de Résidence</label>
                      <input
                        id="profile_address_input"
                        type="text"
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        placeholder="Ex: Bonapriso, Douala, Cameroun"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Bio Description Area */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="profile_bio_input">Biographie / Description d'achat</label>
                    <textarea
                      id="profile_bio_input"
                      rows={3}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="Décrivez brièvement qui vous êtes et ce que vous recherchez au sein de la communauté de quartier..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Interests Selection */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intérêts & Catégories Favoris</label>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Sélectionnez les pôles d'activités de quartier pour lesquels vous souhaitez prioriser vos recherches ou vos recommandations de l'assistant IA.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {[
                        "Produits Bio 🌿", 
                        "High-Tech 🔌", 
                        "Gastronomie locale 🍲", 
                        "Bricolage 🛠️", 
                        "Mode & Beauté 💄", 
                        "Offres d'emploi 💼", 
                        "Hôtellerie 🏨", 
                        "Bureautique 🖨️",
                        "Alimentation Fine 🥫"
                      ].map((interest) => {
                        const isSelected = profileInterests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={`py-2 px-2.5 rounded-xl text-left text-xs transition duration-150 border flex items-center justify-between cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/20 font-bold' 
                                : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-850 hover:text-slate-300'
                            }`}
                          >
                            <span className="truncate">{interest}</span>
                            {isSelected && <span className="text-[9px]">✅</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* COFFRE FORT SECURE ACCESS & MILITARY ENCRYPTION PANEL */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/45 via-slate-900 to-slate-950 border border-indigo-900/40 space-y-4 shadow-xl relative overflow-hidden text-slate-100">
                    {/* Security aesthetic overlay elements */}
                    <div className="absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none"></div>
                    <div className="absolute left-[-20px] bottom-[-20px] w-16 h-16 rounded-full bg-blue-500/5 blur-2xl pointer-events-none"></div>

                    <div className="flex items-start gap-3">
                      <span className="text-xl p-2 bg-indigo-950 border border-indigo-805 text-indigo-400 rounded-xl">🛡️</span>
                      <div>
                        <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                          <span>Sécurité & Cryptage Anti-Piratage</span>
                          <span className="bg-emerald-950 text-emerald-400 text-[8px] font-black tracking-wider px-2 py-0.5 rounded-full uppercase border border-emerald-900">Actif IP/Sec</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                          Protégez vos informations de profil contre le piratage via le protocole matériel AES-256. Une fois activé, vos coordonnées de livraison et de contact sont cryptées avant d'être sauvegardées.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-900/80">
                      
                      {/* Toggle Encryption */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3.5 shadow-inner">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">État du chiffrement</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Activez le cryptage à clé symétrique pour votre adresse et téléphone.</p>
                        </div>
                        <label className="inline-flex items-center gap-3 cursor-pointer self-start">
                          <input 
                            type="checkbox"
                            checked={profileIsDataEncrypted}
                            onChange={(e) => setProfileIsDataEncrypted(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-slate-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-slate-350 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                          <span className={`text-[11px] font-bold ${profileIsDataEncrypted ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}>
                            {profileIsDataEncrypted ? '🔒 Cryptage AES-256 Activé' : '🔓 Non chiffré'}
                          </span>
                        </label>
                      </div>

                      {/* PIN code input */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3 shadow-inner">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5" htmlFor="security_pincode_settings">Code Secret PIN (4 chiffres)</label>
                          <p className="text-[10px] text-slate-500">Un code à 4 chiffres requis pour déverrouiller vos clés d'accès.</p>
                        </div>
                        <div className="relative">
                          <input 
                            id="security_pincode_settings"
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={profilePinCode}
                            onChange={(e) => {
                              // Only allow numeric digits up to 4 length
                              const clean = e.target.value.replace(/\D/g, '');
                              setProfilePinCode(clean);
                            }}
                            className="bg-slate-900 border border-slate-800 text-center tracking-widest font-black text-white text-xs rounded-lg py-1 w-24 focus:outline-none focus:border-indigo-500 font-mono"
                          />
                          <span className="text-[10px] text-slate-500 ml-2 font-semibold">Ex: 1234</span>
                        </div>
                      </div>

                    </div>

                    {/* Ciphertext Visualization Area */}
                    <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl text-[10px] font-mono select-none space-y-1.5 text-slate-500">
                      <div className="flex justify-between text-[9px] font-extrabold uppercase text-slate-400">
                        <span>Aperçu de la base de données brute...</span>
                        <span className="text-indigo-400">SQL SNAPSHOT</span>
                      </div>
                      <div className="space-y-1 leading-normal">
                        <div>
                          <span className="text-slate-400">phone:</span>{" "}
                          {profileIsDataEncrypted ? (
                            <span className="text-indigo-300 font-bold break-all">U2FsdGVkX19G+uL5fX7m...[AES-255-CIPHERTEXT]</span>
                          ) : (
                            <span className="text-emerald-500 font-bold">{profilePhone || "+221 77 ..."}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-400">address:</span>{" "}
                          {profileIsDataEncrypted ? (
                            <span className="text-indigo-300 font-bold break-all">U2FsdGVkX18H+zX4pL1a...[AES-255-CIPHERTEXT]</span>
                          ) : (
                            <span className="text-emerald-500 font-bold">{profileAddress || "Sacré-Cœur ..."}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-400">pincode:</span>{" "}
                          {profilePinCode ? (
                            <span className="text-amber-500 font-bold">SHA-256_HASH_PROTECTED (*{profilePinCode.substring(0,1)}***)</span>
                          ) : (
                            <span className="text-slate-600">aucun PIN configuré</span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Form Submission Buttons */}
                  <div className="pt-4 border-t border-slate-900 flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-black transition duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/20"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Mise à jour en cours...</span>
                        </>
                      ) : (
                        <span>Enregistrer les modifications</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('shop')}
                      className="py-2.5 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer text-center"
                    >
                      Retourner à la boutique
                    </button>
                  </div>

                </form>

              </div>

              {/* Right Column: Live Card Preview & Info */}
              <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                
                {/* Visual Identity Preview Card */}
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden h-64 flex flex-col justify-between">
                  {/* Glowing background circles */}
                  <div className="absolute right-[-10px] top-[-10px] w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>
                  <div className="absolute left-[-20px] bottom-[-20px] w-24 h-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none"></div>

                  <div className="z-10 flex items-start justify-between">
                    <div>
                      <span className="bg-indigo-650/30 text-indigo-300 border border-indigo-500/30 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full">
                        Badge Client Certifié
                      </span>
                      <h3 className="text-white font-extrabold text-lg mt-2 tracking-tight">
                        {profileName || "Sans Nom ..."}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <span>📧</span> {user.email}
                      </p>
                    </div>

                    {profileAvatar ? (
                      <img 
                        src={profileAvatar} 
                        alt="Avatar du client" 
                        className="w-14 h-14 rounded-2xl object-cover border border-indigo-500/40 shadow-inner shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-slate-850 flex items-center justify-center text-3xl">
                        👤
                      </div>
                    )}
                  </div>

                  <div className="z-10 my-3">
                    <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block mb-1">Résumé & Bio</span>
                    <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed italic">
                      "{profileBio || "Aucune biographie rédigée pour le moment. Racontez-nous ce que vous aimez acheter !"}"
                    </p>
                  </div>

                  <div className="z-10 border-t border-slate-800/80 pt-2.5 flex flex-wrap gap-1 items-center font-sans">
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider font-mono mr-1">Centres d'intérêt :</span>
                    {profileInterests.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">Aucun intérêt spécifié</span>
                    ) : (
                      profileInterests.slice(0, 3).map((interest, idx) => (
                        <span key={idx} className="bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                          {interest.split(" ")[0]}
                        </span>
                      ))
                    )}
                    {profileInterests.length > 3 && (
                      <span className="text-[10px] text-slate-500 font-mono font-bold">+{profileInterests.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Additional Info box */}
                <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-900">
                    <span className="text-lg">💡</span>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-sans">Conseils de Visibilité</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Les entreprises locales et les créateurs de boutiques de proximité peuvent consulter vos centres d'intérêt lors du traitement de vos commandes groupées.
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-2 font-sans">
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-400">✔️</span>
                      <span>Un numéro de téléphone valide permet un dénouement plus rapide par Mobile Money.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-400">✔️</span>
                      <span>Indiquez votre adresse de livraison exacte pour le calcul optimal des itinéraires.</span>
                    </li>
                  </ul>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* CONDITIONAL REAL-TIME CV BUILDER & APPLICATION PORTAL OVERLAY */}
      {selectedJobToApply && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Modal headers */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Candidature Officielle</span>
                <h2 className="text-md sm:text-lg font-bold text-white mt-1">Postuler au poste de : <span className="text-indigo-400">{selectedJobToApply.title}</span></h2>
                <p className="text-xs text-slate-400">Recruteur : <strong className="text-slate-300">{selectedJobToApply.companyName}</strong> • {selectedJobToApply.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobToApply(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl hover:bg-slate-850 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Form Section */}
              <div className="md:col-span-6 space-y-6">
                {applyError && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-300 text-xs rounded-xl">
                    {applyError}
                  </div>
                )}

                {/* Contact information */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">1. Vos Coordonnées de contact</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">E-mail *</label>
                      <input
                        type="email"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Téléphone *</label>
                      <input
                        type="text"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Choice of CV type */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">2. Source de votre Curriculum Vitae (CV)</h3>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                    <button
                      type="button"
                      onClick={() => setCvType('file')}
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg text-center transition ${cvType === 'file' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Upload className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Importer un fichier
                    </button>
                    <button
                      type="button"
                      onClick={() => setCvType('built')}
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg text-center transition ${cvType === 'built' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
                    >
                      <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Rédiger en ligne
                    </button>
                  </div>
                </div>

                {/* File picker layout */}
                {cvType === 'file' ? (
                  <div className="space-y-4">
                    <label className="block border-2 border-dashed border-slate-800 hover:border-indigo-500 bg-slate-950/60 p-6 rounded-2xl text-center cursor-pointer transition">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setCvFileName(file.name);
                            setCvFileContent(`Données simulées du fichier de CV : ${file.name} (${(file.size / 1024).toFixed(1)} Ko)`);
                          }
                        }}
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                      <span className="text-xs font-medium text-slate-300 block">Cliquez pour importer votre CV depuis votre appareil</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Formats acceptés : PDF, Word (.docx) • Max 5 Mo</span>
                    </label>

                    {cvFileName && (
                      <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-xs text-slate-200 truncate font-mono">{cvFileName}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase font-mono shrink-0">Prêt</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // CV Builder Forms
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Titre Professionnel</label>
                      <input
                        type="text"
                        value={cvBuilderData.title}
                        onChange={(e) => setCvBuilderData({ ...cvBuilderData, title: e.target.value })}
                        required
                        placeholder="ex: Chef Cuisinier Adjoint H/F, Réceptionniste bilingue"
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Résumé de carrière / Accroche</label>
                      <textarea
                        rows={2}
                        value={cvBuilderData.summary}
                        onChange={(e) => setCvBuilderData({ ...cvBuilderData, summary: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-indigo-500 resize-none animate-fade-in"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Compétences techniques & Savoir-être</label>
                      <input
                        type="text"
                        value={cvBuilderData.skills}
                        onChange={(e) => setCvBuilderData({ ...cvBuilderData, skills: e.target.value })}
                        required
                        placeholder="ex: Rigoureux, Maîtrise Word, Anglais fluide, Gestion de caisse"
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-indigo-500 animate-fade-in"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Expériences Professionnelles</label>
                      <textarea
                        rows={3}
                        value={cvBuilderData.experience}
                        onChange={(e) => setCvBuilderData({ ...cvBuilderData, experience: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-[11px] animate-fade-in"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Diplômes & Formations</label>
                      <textarea
                        rows={2}
                        value={cvBuilderData.education}
                        onChange={(e) => setCvBuilderData({ ...cvBuilderData, education: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-[11px] animate-fade-in"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE CV PREVIEW SHEET */}
              <div className="md:col-span-6 bg-slate-950 rounded-2xl border border-slate-850 p-6 flex flex-col justify-between shadow-inner min-h-[380px] text-slate-200">
                <div className="space-y-4">
                  <div className="border-b border-indigo-900 pb-3 flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-100 text-base leading-tight">{user.name}</h4>
                      <p className="text-[11px] text-indigo-400 font-bold tracking-wide uppercase mt-0.5">
                        {cvType === 'built' ? (cvBuilderData.title || "Titre Professionnel") : "CURRICULUM VITAE"}
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 space-y-0.5 font-mono">
                      <div>📧 {applicantEmail}</div>
                      <div>📞 {applicantPhone}</div>
                      <div>📍 {user.address || "Adresse non spécifiée"}</div>
                    </div>
                  </div>

                  {cvType === 'built' ? (
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1">Profil & Accroche</h5>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic">
                          "{cvBuilderData.summary || "Rédigez votre profil..."}"
                        </p>
                      </div>

                      <div>
                        <h5 className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1">Compétences Clés</h5>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(cvBuilderData.skills || "Compétences...").split(',').map((sk, sidx) => (
                            <span key={sidx} className="bg-indigo-950/60 border border-indigo-900/40 text-indigo-300 text-[10px] px-2 py-0.5 rounded">
                              {sk.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-slate-900">
                        <div>
                          <h5 className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1">Expériences</h5>
                          <p className="text-[10px] text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                            {cvBuilderData.experience || "Expériences professionnelles..."}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1">Formations</h5>
                          <p className="text-[10px] text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                            {cvBuilderData.education || "Formations..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                      <FileText className="w-14 h-14 text-indigo-400 animate-pulse" />
                      <div>
                        <h5 className="text-xs font-bold text-slate-300">{cvFileName || "Aucun fichier sélectionné"}</h5>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {cvFileName ? "Votre document original a été encapsulé et converti au format sécurisé WeLink." : "Veuillez téléverser votre fichier de CV pour en visualiser le conteneur."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-900 pt-4 flex flex-col space-y-2 mt-4">
                  <p className="text-[9px] text-slate-500 leading-normal">
                    * En postulant, vous confirmez l'exactitude des informations partagées et autorisez {selectedJobToApply.companyName} à accéder à vos coordonnées directes pour examen.
                  </p>
                  <div className="flex gap-3 mt-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedJobToApply(null)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={applyingInProgress || (cvType === 'file' && !cvFileName)}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {applyingInProgress ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Envoi de la candidature...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Transmettre mon dossier complet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
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
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest leading-none">Messagerie de Livraison</h3>
                  <h2 className="text-sm font-extrabold text-white mt-1.5 leading-tight">
                    {activeDeliveryChatOrder.productTitle} x{activeDeliveryChatOrder.quantity}
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Vendeur : <strong className="text-slate-200">{activeDeliveryChatOrder.sellerName}</strong> • Commande <span className="font-mono text-indigo-400">#{activeDeliveryChatOrder.id}</span>
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
              <span className="shrink-0 flex items-center gap-1">🔒 Messagerie chiffrée de bout en bout</span>
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
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs">Chargement de la discussion...</span>
                </div>
              ) : deliveryChatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-6 space-y-2.5 text-slate-500">
                  <span className="text-3xl">📨</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-355">Aucun message pour le moment</h4>
                    <p className="text-[10.5px] text-slate-450 leading-relaxed max-w-xs">
                      Engagez la discussion avec le vendeur pour valider le statut d'expédition, préciser votre adresse, ou fixer l'heure de livraison.
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
                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                            : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-750'
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[9px] text-slate-500 font-mono">
                          <span className="font-bold">{isMe ? "Vous" : msg.senderName}</span>
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
              <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wide mr-1 select-none">Raccourcis :</span>
              {[
                "Bonjour, où en est ma livraison ?",
                "Je serai disponible pour réceptionner dans 30 min.",
                "Merci d'appeler mon numéro de téléphone à l'approche !",
                "Tout est validé, merci beaucoup !",
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
                placeholder="Rédigez votre message..."
                className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSendingDeliveryMessage || !deliveryChatInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold px-4 rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer"
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
          buyer={user}
          seller={allUsers.find(u => u.id === selectedInvoiceOrder.sellerId)}
          isOpen={true}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
