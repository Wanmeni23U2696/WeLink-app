import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Product, JobOffer, Order, Vente, JobApplication, EnterpriseStock, HotelRoom, HotelReservation, HotelCoupon, HotelAuditLog, HotelFomoSetting, RestaurantTable, RestaurantBooking, DishRating } from './types';
import AuthScreen from './components/AuthScreen';
import ClientDashboard from './components/ClientDashboard';
import BusinessDashboard from './components/BusinessDashboard';
import SaaSERPDashboard from './components/SaaSERPDashboard';
import SupplierDashboard from './components/SupplierDashboard';
import { CarrierDashboard } from './components/CarrierDashboard';
import SaaSSubscriptionPanel from './components/SaaSSubscriptionPanel';
import WelcomeScreen from './components/WelcomeScreen';
import { WeLinkLogo } from './components/WeLinkLogo';
import { 
  Network, Power, Users, ShoppingBag, Briefcase, RefreshCw, Layers, Download, HelpCircle, 
  Bell, BellRing, Moon, Sun, CheckCheck, Trash2, Inbox, Volume2, VolumeX,
  TrendingUp, Tractor, ShoppingCart, Truck, Flame, Package, CreditCard, ListTodo, User,
  Lightbulb, Calendar, Maximize2
} from 'lucide-react';

const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 900, quality = 0.70): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [visitingShopId, setVisitingShopId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  
  // Real-time Database Snapshot
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [rayonsMetadata, setRayonsMetadata] = useState<Record<string, { desc: string; emoji: string; img: string }>>({});
  const [enterpriseStocks, setEnterpriseStocks] = useState<EnterpriseStock[]>([]);
  
  const [fishLots, setFishLots] = useState<any[]>([]);
  const [fishLossLogs, setFishLossLogs] = useState<any[]>([]);
  const [fishAlerts, setFishAlerts] = useState<any[]>([]);

  const [butcherLots, setButcherLots] = useState<any[]>([]);
  const [butcherLossLogs, setButcherLossLogs] = useState<any[]>([]);
  const [butcherCuts, setButcherCuts] = useState<any[]>([]);

  const [hotelRoomCategories, setHotelRoomCategories] = useState<any[]>([]);
  const [hotelRooms, setHotelRooms] = useState<HotelRoom[]>([]);
  const [hotelReservations, setHotelReservations] = useState<HotelReservation[]>([]);
  const [hotelCoupons, setHotelCoupons] = useState<HotelCoupon[]>([]);
  const [hotelAuditLogs, setHotelAuditLogs] = useState<HotelAuditLog[]>([]);
  const [hotelFomoSettings, setHotelFomoSettings] = useState<HotelFomoSetting[]>([]);

  const [restaurantTables, setRestaurantTables] = useState<RestaurantTable[]>([]);
  const [restaurantBookings, setRestaurantBookings] = useState<RestaurantBooking[]>([]);
  const [dishRatings, setDishRatings] = useState<DishRating[]>([]);
  const [companyReviews, setCompanyReviews] = useState<any[]>([]);
  const [clientClassifications, setClientClassifications] = useState<any[]>([]);
  
  // Financial, SaaS Subscriptions & Admin configuration states
  const [wallets, setWallets] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [paymentInvoices, setPaymentInvoices] = useState<any[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [commissionSettings, setCommissionSettings] = useState<any>({ productSalePercent: 5, deliveryPercent: 10 });
  const [paymentSettings, setPaymentSettings] = useState<any>({ mtnMomoMerchantNumber: '', orangeMoneyMerchantNumber: '', waveMerchantCode: '', apiKey: '', sandboxMode: true });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Theme state: support light and dark modes
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  // Notifications state managing alerts
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: 'order' | 'job_application';
    unread: boolean;
    createdAt: string;
    dataId: string;
  }>>([]);

  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const isFirstSyncRef = useRef<boolean>(true);

  // Profile editing/deletion states
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCustomBgDataUrl, setEditCustomBgDataUrl] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditAddress(currentUser.address || '');
      setEditPhone(currentUser.phone || '');
      setEditDescription(currentUser.description || '');
      setEditAvatarUrl(currentUser.avatarUrl || '');
      setEditBio(currentUser.bio || '');
      setEditCustomBgDataUrl(currentUser.customBgDataUrl || '');
    }
  }, [currentUser, showAccountModal]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setEditSaving(true);
    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          name: editName,
          address: editAddress,
          phone: editPhone,
          description: editDescription,
          avatarUrl: editAvatarUrl,
          bio: editBio,
          customBgDataUrl: editCustomBgDataUrl
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setShowAccountModal(false);
          fetchState(); // Synchronize all states
        } else {
          alert(data.error || "Erreur de mise à jour");
        }
      } else {
        const errData = await response.json();
        alert(errData.error || "Impossible de mettre à jour le profil.");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de communication avec le serveur.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    
    const textConfirmation = `Pour confirmer, veuillez saisir votre nom exact : "${currentUser.name}"`;
    const confirmNameInput = window.prompt(textConfirmation);
    if (confirmNameInput !== currentUser.name) {
      alert("Confirmation rejetée: Le nom saisi ne correspond pas.");
      return;
    }

    if (!window.confirm("Êtes-vous absolument sûr ? Cette action est irréversible et supprimera l'intégralité de votre compte, produits, annonces, et données de la plateforme WeLink.")) {
      return;
    }

    setEditSaving(true);
    try {
      const response = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser.id })
      });
      if (response.ok) {
        alert("Votre compte a été supprimé avec succès. WeLink vous remercie pour votre présence.");
        setShowAccountModal(false);
        setCurrentUser(null);
        fetchState();
      } else {
        const errData = await response.json();
        alert(errData.error || "Impossible de supprimer le compte.");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de suppression du compte.");
    } finally {
      setEditSaving(false);
    }
  };

  // Flag to display the visual indicator on the bell icon, persisting until the menu is opened.
  const [hasNewNotifsVisual, setHasNewNotifsVisual] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('has_new_notifs_visual');
      return saved === 'true';
    }
    return false;
  });

  // Sound alert enabled helper togglable in parameters/menu
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notif_sound_enabled');
      return saved !== 'false';
    }
    return true;
  });

  // Notifications filtering state (all, order, job_application)
  const [activeNotifTab, setActiveNotifTab] = useState<'all' | 'order' | 'job_application'>('all');

  // Notifications time filter state (all, today, week)
  const [notifTimeFilter, setNotifTimeFilter] = useState<'all' | 'today' | 'week'>('all');

  // Persist sound & visual indicator state changes
  useEffect(() => {
    localStorage.setItem('has_new_notifs_visual', String(hasNewNotifsVisual));
  }, [hasNewNotifsVisual]);

  useEffect(() => {
    localStorage.setItem('notif_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  // Synthesis engine for discrete soft bell audio chime using Web Audio API
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 (fifth chord)
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.warn("Could not play synthesized chime sound:", err);
    }
  };

  // Sync theme with document class list
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persist notifications list in localStorage keyed by logged in account
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`notifications_${currentUser.id}`, JSON.stringify(notifications));
    }
  }, [notifications, currentUser?.id]);

  // Load user-specific notifications and reset tracking when user logs out/changes
  useEffect(() => {
    isFirstSyncRef.current = true;
    setShowNotifications(false);
    if (currentUser) {
      const saved = localStorage.getItem(`notifications_${currentUser.id}`);
      setNotifications(saved ? JSON.parse(saved) : []);
    } else {
      setNotifications([]);
    }
  }, [currentUser?.id]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    if (!showNotifications) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const wrapper = document.getElementById('notifications-wrapper');
      if (wrapper && !wrapper.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showNotifications]);

  // Handle detecting and alert creating
  useEffect(() => {
    if (!currentUser) return;
    
    let hasChanges = false;
    const newNotifications = [...notifications];
    const markAsUnread = !isFirstSyncRef.current;

    const isClient = currentUser.profileType === 'client';
    const isEntreprise = currentUser.profileType === 'entreprise';

    // 1. Order Updates or Additions
    orders.forEach(order => {
      const trackerId = `order_${order.id}_${order.status}`;
      if (!newNotifications.some(n => n.dataId === trackerId)) {
        const isBuyer = order.buyerId === currentUser.id;
        const isSeller = order.sellerId === currentUser.id;

        if (isBuyer || isSeller) {
          // Rule for client: "juste les commandes livrées" (only notify when order is delivered!)
          if (isClient && isBuyer && order.status !== 'delivered') {
            return; // ignore other order states for the client to avoid cluttering
          }

          // Rule for entreprise: only notify about NEW incoming orders (pending) or deliveries!
          if (isEntreprise && isSeller && order.status !== 'pending' && order.status !== 'delivered') {
            return; // ignore self-actions (like "accepting/shipping" which they do themselves)
          }

          const statusLabel = order.status === 'pending' ? 'en attente de validation' :
                              order.status === 'accepted' ? 'acceptée par le vendeur' :
                              order.status === 'shipped' ? 'expédiée' : 'livrée avec succès !';
          
          const sellerStatusLabel = order.status === 'pending' ? 'nouvelle' :
                                    order.status === 'accepted' ? 'marquée comme acceptée' :
                                    order.status === 'shipped' ? 'marquée comme expédiée' : 'marquée comme livrée';

          newNotifications.unshift({
            id: 'notif_' + Math.random().toString(36).substring(2, 9),
            title: isBuyer 
              ? (order.status === 'delivered' ? "Commande livrée ! 🎉" : "Mise à jour commande 📦")
              : (order.status === 'pending' ? "Nouvelle commande reçue ! 🛍️" : "Commande de quartier livrée"),
            message: isBuyer
              ? `Votre commande pour '${order.productTitle}' (${order.quantity} p.) auprès de ${order.sellerName} : ${statusLabel}.`
              : `${order.buyerName} - Commande : '${order.productTitle}' x${order.quantity} (${(order.price * order.quantity).toLocaleString()} F). Statut : ${sellerStatusLabel}.`,
            type: 'order',
            unread: markAsUnread,
            createdAt: order.createdAt || new Date().toISOString(),
            dataId: trackerId
          });
          hasChanges = true;
        }
      }
    });

    // 2. Job Application Updates or Additions
    jobApplications.forEach(app => {
      const statusValue = app.status || 'pending';
      const trackerId = `app_${app.id}_${statusValue}`;

      if (!newNotifications.some(n => n.dataId === trackerId)) {
        const isAppClient = app.clientId === currentUser.id;
        const isAppCompany = app.companyId === currentUser.id;

        if (isAppClient || isAppCompany) {
          // Rule for client: only notify when accepted / rejected by the company
          if (isClient && isAppClient && statusValue === 'pending') {
            return; // skip pending since they just applied
          }

          const statusLabel = statusValue === 'pending' ? 'transmise' :
                              statusValue === 'accepted' ? 'acceptée 🎉' : 'refusée 📁';
          const companyStatusLabel = statusValue === 'pending' ? 'reçue' :
                                     statusValue === 'accepted' ? 'acceptée' : 'refusée';

          newNotifications.unshift({
            id: 'notif_' + Math.random().toString(36).substring(2, 9),
            title: isAppClient
              ? "Candidature mise à jour 💼"
              : "Nouvelle candidature reçue ! 📄",
            message: isAppClient
              ? `Votre candidature pour '${app.jobTitle}' chez ${app.companyName} est : ${statusLabel}.`
              : `${app.clientName} a postulé pour votre offre : '${app.jobTitle}'.`,
            type: 'job_application',
            unread: markAsUnread,
            createdAt: app.appliedAt || new Date().toISOString(),
            dataId: trackerId
          });
          hasChanges = true;
        }
      }
    });

    // 3. New Job Offers ("pour un client juste les nouvelles offres d'emploi")
    if (isClient) {
      jobOffers.forEach(offer => {
        const trackerId = `job_offer_${offer.id}`;
        if (!newNotifications.some(n => n.dataId === trackerId)) {
          newNotifications.unshift({
            id: 'notif_' + Math.random().toString(36).substring(2, 9),
            title: "Nouvelle offre d'emploi ! 💼",
            message: `Une nouvelle opportunité est disponible : '${offer.title}' chez ${offer.companyName} (${offer.location}). Salaire : ${offer.salary}.`,
            type: 'job_application',
            unread: markAsUnread,
            createdAt: offer.createdAt || new Date().toISOString(),
            dataId: trackerId
          });
          hasChanges = true;
        }
      });

      // 4. New Promotions ("les promotions etc...")
      products.forEach(p => {
        const hasPromo = p.promotionDiscount && p.promotionDiscount > 0 && p.sellerType === 'entreprise';
        if (hasPromo) {
          const trackerId = `promo_${p.id}_${p.promotionDiscount}`;
          if (!newNotifications.some(n => n.dataId === trackerId)) {
            newNotifications.unshift({
              id: 'notif_' + Math.random().toString(36).substring(2, 9),
              title: `Promotion Flash ! ⚡ -${p.promotionDiscount}%`,
              message: `Économisez sur '${p.title}' auprès de ${p.sellerName} ! Nouveau prix : ${Math.round(p.price * (1 - p.promotionDiscount / 100)).toLocaleString()} F (au lieu de ${p.price.toLocaleString()} F)`,
              type: 'order',
              unread: markAsUnread,
              createdAt: p.promotionEnd || new Date().toISOString(),
              dataId: trackerId
            });
            hasChanges = true;
          }
        }
      });
    }

    if (hasChanges) {
      setNotifications(newNotifications.slice(0, 40));
      if (markAsUnread) {
        setHasNewNotifsVisual(true);
        playNotificationSound();
      }
    }

    if (orders.length > 0 || jobApplications.length > 0 || jobOffers.length > 0) {
      isFirstSyncRef.current = false;
    }
  }, [orders, jobApplications, jobOffers, products, currentUser]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  // Fetch full state from backend
  const fetchState = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/state');
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setUsers(data.users || []);
          setProducts(data.products || []);
          setJobOffers(data.jobOffers || []);
          setOrders(data.orders || []);
          setVentes(data.ventes || []);
          setJobApplications(data.jobApplications || []);
          setRayonsMetadata(data.rayonsMetadata || {});
          setEnterpriseStocks(data.enterpriseStocks || []);
          setFishLots(data.fishLots || []);
          setFishLossLogs(data.fishLossLogs || []);
          setFishAlerts(data.fishAlerts || []);
          setButcherLots(data.butcherLots || []);
          setButcherLossLogs(data.butcherLossLogs || []);
          setButcherCuts(data.butcherCuts || []);
          setHotelRoomCategories(data.hotelRoomCategories || []);
          setHotelRooms(data.hotelRooms || []);
          setHotelReservations(data.hotelReservations || []);
          setHotelCoupons(data.hotelCoupons || []);
          setHotelAuditLogs(data.hotelAuditLogs || []);
          setHotelFomoSettings(data.hotelFomoSettings || []);
          setRestaurantTables(data.restaurantTables || []);
          setRestaurantBookings(data.restaurantBookings || []);
          setDishRatings(data.dishRatings || []);
          setCompanyReviews(data.companyReviews || []);
          setClientClassifications(data.clientClassifications || []);
          // Hydrate SaaS specific state arrays
          setWallets(data.wallets || []);
          setWithdrawalRequests(data.withdrawalRequests || []);
          setPaymentInvoices(data.paymentInvoices || []);
          setWalletTransactions(data.walletTransactions || []);
          if (data.commissionSettings) setCommissionSettings(data.commissionSettings);
          if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
        } else {
          console.warn("[Fetch State] Expected JSON but received content-type:", contentType);
        }
      } else {
        console.warn("[Fetch State] Response has failed with state:", response.status);
      }
    } catch (err) {
      console.error("Erreur d'acquisition de l'état:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Update current user references when refreshing lists in case it has updated info
  useEffect(() => {
    if (currentUser) {
      const matched = users.find(u => u.id === currentUser.id);
      if (matched) {
        setCurrentUser(matched);
      }
    }
  }, [users]);

  // Handle active dashboard tab default selection when user logs in
  const currentUserId = currentUser?.id || null;
  useEffect(() => {
    if (currentUser) {
      if (!activeTab) {
        if (currentUser.profileType === 'client') {
          setActiveTab('shop');
        } else if (currentUser.profileType === 'entreprise') {
          const isSuper = currentUser.enterpriseType === 'supermarche';
          const isMarche = currentUser.enterpriseType === 'marche';
          setActiveTab((isSuper || isMarche) ? 'supermarket-stats' : 'inventory');
        } else if (currentUser.profileType === 'fournisseur') {
          setActiveTab('catalog');
        }
      }
    } else {
      setActiveTab('');
    }
  }, [currentUserId]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div id="app-loading-container" className="min-h-screen bg-welink-ambient flex flex-col items-center justify-center text-slate-150 py-12">
        <div className="flex items-center space-x-3 mb-6 animate-pulse">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
            <Network className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">WeLink</h2>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-md">
          <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Chargement et synchronisation de WeLink...</span>
        </div>
      </div>
    );
  }

  // Count active stats for informational cards and pre-auth landing page
  const activeBusinessesCount = users.filter(u => u.profileType === 'entreprise').length;
  const activeSuppliersCount = users.filter(u => u.profileType === 'fournisseur').length;
  const clientViewProducts = products.filter(p => p.sellerType === 'entreprise');

  // Not logged in -> Show Startup Presentation first, then transition to Auth screen
  if (!currentUser) {
    if (showWelcome) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
          <WelcomeScreen
            activeBusinessesCount={activeBusinessesCount}
            activeSuppliersCount={activeSuppliersCount}
            activeJobsCount={jobOffers.length}
            activeProductsCount={products.length}
            onDismiss={() => setShowWelcome(false)}
          />
        </div>
      );
    }

    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
        availableUsers={users}
        onRefreshState={fetchState}
        onBackToLanding={() => setShowWelcome(true)}
      />
    );
  }

  // Process and filter notifications using the selected category/tab and the temporal period filters.
  const getProcessedNotifications = () => {
    // 1. Filter by category tab
    const tabFiltered = notifications.filter(notif => {
      if (activeNotifTab === 'all') return true;
      if (activeNotifTab === 'order') return notif.type === 'order';
      if (activeNotifTab === 'job_application') return notif.type === 'job_application';
      return true;
    });

    // 2. Filter by time window/range
    const finalFiltered = tabFiltered.filter(notif => {
      if (notifTimeFilter === 'all') return true;
      const diffMs = Date.now() - new Date(notif.createdAt).getTime();
      if (notifTimeFilter === 'today') {
        // Today = within 24 hours
        return diffMs <= 24 * 60 * 60 * 1000;
      }
      if (notifTimeFilter === 'week') {
        // This week = within 7 days (168 hours)
        return diffMs <= 7 * 24 * 60 * 60 * 1000;
      }
      return true;
    });

    // Sort by Date descending (newest first)
    return [...finalFiltered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getEnterpriseClass = (): string => {
    if (!currentUser) return 'enterprise-bg-default';
    if (currentUser.profileType === 'entreprise') {
      return `enterprise-bg-${currentUser.enterpriseType || 'default'}`;
    }
    if (currentUser.profileType === 'fournisseur') {
      return `enterprise-bg-${currentUser.supplierType || 'default'}`;
    }
    if (currentUser.profileType === 'client' && visitingShopId) {
      const shop = users.find(u => u.id === visitingShopId);
      if (shop) {
        if (shop.profileType === 'fournisseur') {
          return `enterprise-bg-${shop.supplierType || 'default'}`;
        }
        return `enterprise-bg-${shop.enterpriseType || 'default'}`;
      }
    }
    return 'enterprise-bg-default';
  };

  const processedNotifications = getProcessedNotifications();

  const isViewingShop = currentUser && currentUser.profileType === 'client' && visitingShopId !== null;
  const visitingShopObj = isViewingShop ? users.find(u => u.id === visitingShopId) : null;
  const isVisitingHotel = visitingShopObj?.enterpriseType === 'hotel';
  const isViewingCustomShop = isViewingShop && !isVisitingHotel;
  const isSaaSUser = currentUser && currentUser.profileType === 'entreprise' && currentUser.enterpriseType === 'autre';

  return (
    <div 
      id="app-workspace-main" 
      className={`h-screen w-screen bg-slate-950 flex flex-row overflow-hidden font-sans selection:bg-indigo-650 selection:text-white ${getEnterpriseClass()}`}
      style={currentUser?.customBgDataUrl ? { backgroundImage: `url(${currentUser.customBgDataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : undefined}
    >
      {currentUser?.customBgDataUrl && (
        <style dangerouslySetInnerHTML={{ __html: `
          #app-workspace-main, html, body, #root {
            background-image: url(${currentUser.customBgDataUrl}) !important;
          }
        `}} />
      )}
      
      {/* Modern Left Sidebar Panel (Sticky, Fullscreen Height) */}
      {!isViewingCustomShop && !isSaaSUser && (
        <div id="welink-main-sidebar" className="h-[105%] w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between shrink-0 overflow-hidden z-30 select-none pb-10">
          <div className="p-5 flex flex-col h-full overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {/* Brand logo at top */}
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-800/60 shrink-0">
              <WeLinkLogo iconSize="md" isDarkBackground={true} />
            </div>

            {/* Profile info section */}
            <div className="flex items-center space-x-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60 shrink-0">
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentUser.name)}`}
                alt="avatar"
                className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 object-cover"
              />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold text-slate-100 block truncate leading-tight">{currentUser.name}</span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wider ${
                  currentUser.profileType === 'client' 
                    ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/40' 
                    : currentUser.profileType === 'entreprise' 
                      ? 'bg-violet-950/50 text-violet-400 border border-violet-900/35' 
                      : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40'
                }`}>
                  {currentUser.profileType === 'client' 
                    ? 'Abonné Client' 
                    : currentUser.profileType === 'entreprise' 
                      ? `${currentUser.enterpriseType || 'Entreprise'}`
                      : `${currentUser.supplierType || 'Fournisseur'}`
                  }
                </span>
              </div>
            </div>

            {/* Primary Sidebar Tabs */}
            <div className="space-y-1.5 flex-1">
              <p className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-2 px-1">Menu Principal</p>
              
              {/* Render Tabs based on profileType */}
              {currentUser.profileType === 'client' && (
                <>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'shop' ? 'bg-indigo-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                  >
                    <ShoppingBag className={`w-4 h-4 shrink-0 ${activeTab === 'shop' ? 'text-white' : 'text-indigo-400'}`} />
                    <span>Boutique de Proximité</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('for-you')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'for-you' ? 'bg-gradient-to-r from-red-600 to-indigo-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                  >
                    <span className="flex items-center space-x-3 min-w-0">
                      <Flame className={`w-4 h-4 shrink-0 ${activeTab === 'for-you' ? 'text-white' : 'text-red-500 animate-pulse'}`} />
                      <span className="truncate flex-1 font-semibold text-rose-300">Pour Vous 🎬</span>
                    </span>
                    <span className="bg-red-950 text-red-300 text-[8px] font-black px-1.5 py-0.5 rounded shrink-0">ALGO</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('ai-chat')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'ai-chat' ? 'bg-indigo-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                  >
                    <span className="flex items-center space-x-3 min-w-0">
                      <Lightbulb className={`w-4 h-4 shrink-0 ${activeTab === 'ai-chat' ? 'text-white' : 'text-amber-400'}`} />
                      <span className="truncate flex-1">Conseils & Produits</span>
                    </span>
                    <span className="bg-indigo-900/50 text-indigo-300 text-[8px] font-black px-1.5 py-0.5 rounded shrink-0">AI</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'jobs' ? 'bg-indigo-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                  >
                    <span className="flex items-center space-x-3 min-w-0">
                      <Briefcase className={`w-4 h-4 shrink-0 ${activeTab === 'jobs' ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate flex-1">Offres d'Emploi</span>
                    </span>
                    <span className="bg-slate-850 text-slate-300 text-[10px] rounded-full px-2 shrink-0">{jobOffers.length}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'orders' ? 'bg-indigo-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                  >
                    <span className="flex items-center space-x-3 min-w-0">
                      <ListTodo className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate flex-1">Mes Commandes</span>
                    </span>
                    <span className="bg-slate-850 text-slate-300 text-[10px] rounded-full px-2 shrink-0">
                      {orders.filter(o => o.buyerId === currentUser.id).length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'payments' ? 'bg-indigo-600 font-bold text-white' : 'text-slate-400 hover:bg-slate-855 hover:text-white'}`}
                  >
                    <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'payments' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Moyens de Paiement</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('subscription')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'subscription' ? 'bg-indigo-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-855 hover:text-white bg-indigo-950/20 border border-indigo-900/30'}`}
                  >
                    <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'subscription' ? 'text-white' : 'text-slate-400'}`} />
                    <span className="font-bold text-indigo-300">Abonnement WeLink</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'profile' ? 'bg-indigo-600 font-bold text-white' : 'text-slate-400 hover:bg-slate-855 hover:text-white'}`}
                  >
                    <User className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Mon Profil</span>
                  </button>
                </>
              )}

              {currentUser.profileType === 'entreprise' && (
                <>
                  {currentUser.enterpriseType === 'hotel' ? (
                    <>
                      <button
                        onClick={() => setActiveTab('hotel-stats')}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'hotel-stats' || activeTab === '' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                      >
                        <TrendingUp className={`w-4 h-4 shrink-0 ${activeTab === 'hotel-stats' || activeTab === '' ? 'text-white' : 'text-violet-400'}`} />
                        <span>📈 Stats & Analyses</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('inventory')}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'inventory' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                      >
                        <ShoppingBag className={`w-4 h-4 shrink-0 ${activeTab === 'inventory' ? 'text-white' : 'text-violet-400'}`} />
                        <span>🏨 Chambres & Catégories</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('bookings')}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'bookings' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                      >
                        <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'bookings' ? 'text-white' : 'text-emerald-400'}`} />
                        <span>📅 Réservations & Clients</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('audit-logs')}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'audit-logs' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-855 hover:text-white'}`}
                      >
                        <ListTodo className={`w-4 h-4 shrink-0 ${activeTab === 'audit-logs' ? 'text-white' : 'text-amber-400'}`} />
                        <span>📋 Journaux d'Audit</span>
                      </button>
                    </>
                  ) : (currentUser.enterpriseType === 'supermarche' || currentUser.enterpriseType === 'marche') ? (
                    <>
                      <button
                        onClick={() => setActiveTab('supermarket-stats')}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'supermarket-stats' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                      >
                        <TrendingUp className={`w-4 h-4 shrink-0 ${activeTab === 'supermarket-stats' ? 'text-white' : 'text-violet-400'}`} />
                        <span>📈 Stats & Analyses</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('supermarket-rayons')}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'supermarket-rayons' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                      >
                        <ShoppingBag className={`w-4 h-4 shrink-0 ${activeTab === 'supermarket-rayons' ? 'text-white' : 'text-violet-400'}`} />
                        <span>{currentUser.enterpriseType === 'marche' ? "🎪 Mon Étalage" : "🛒 Mes Rayons"}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveTab('inventory')}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'inventory' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                      >
                        <ShoppingBag className={`w-4 h-4 shrink-0 ${activeTab === 'inventory' ? 'text-white' : 'text-violet-400'}`} />
                        <span>{currentUser.enterpriseType === 'restaurant' ? "🍳 Mon Menu" : "Mon Inventaire"}</span>
                      </button>

                      {currentUser.enterpriseType === 'poissonnerie' && (
                        <button
                          onClick={() => setActiveTab('poissonnerie')}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'poissonnerie' ? 'bg-cyan-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                        >
                          <ListTodo className={`w-4 h-4 shrink-0 ${activeTab === 'poissonnerie' ? 'text-white' : 'text-cyan-400'}`} />
                          <span>🐟 Traçabilité & Lots</span>
                        </button>
                      )}

                      {currentUser.enterpriseType === 'boucher' && (
                        <button
                          onClick={() => setActiveTab('boucherie')}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'boucherie' ? 'bg-rose-700 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                        >
                          <ListTodo className={`w-4 h-4 shrink-0 ${activeTab === 'boucherie' ? 'text-white' : 'text-rose-400'}`} />
                          <span>🥩 Gestion Boucherie</span>
                        </button>
                      )}
                    </>
                  )}
                  
                  <button
                    onClick={() => setActiveTab('promotions')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'promotions' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                  >
                    <span className="flex items-center space-x-3 min-w-0">
                      <Flame className={`w-4 h-4 shrink-0 ${activeTab === 'promotions' ? 'text-white' : 'text-rose-400 animate-pulse'}`} />
                      <span className="truncate flex-1 font-medium">🏷️ Promos & Flash</span>
                    </span>
                    <span className="bg-rose-950 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded border border-rose-900/40 shrink-0">Promo</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('recruitment')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'recruitment' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                  >
                    <span className="flex items-center space-x-3 min-w-0">
                      <Briefcase className={`w-4 h-4 shrink-0 ${activeTab === 'recruitment' ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate flex-1">Offres d'Emploi</span>
                    </span>
                    <span className="bg-violet-950 text-violet-300 text-[10px] font-bold rounded px-2.5 shrink-0">Recruter</span>
                  </button>

                  {currentUser.enterpriseType !== 'hotel' && currentUser.enterpriseType !== 'restaurant' && (
                    <button
                      onClick={() => setActiveTab('b2b-procure')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'b2b-procure' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                    >
                      <span className="flex items-center space-x-3 min-w-0">
                        <Tractor className={`w-4 h-4 shrink-0 ${activeTab === 'b2b-procure' ? 'text-white' : 'text-emerald-400'}`} />
                        <span className="truncate flex-1">Gros de Terroir</span>
                      </span>
                      <span className="bg-emerald-905 bg-emerald-900 text-emerald-300 text-[8px] font-black px-1.5 shrink-0 rounded-sm">B2B</span>
                    </button>
                  )}

                  {currentUser.enterpriseType !== 'hotel' && (
                    <button
                      onClick={() => setActiveTab('sales')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'sales' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                    >
                      <span className="flex items-center space-x-3 min-w-0">
                        <ShoppingCart className={`w-4 h-4 shrink-0 ${activeTab === 'sales' ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate flex-1">Commandes Reçues</span>
                      </span>
                    </button>
                  )}
                  
                  {currentUser.enterpriseType !== 'hotel' && currentUser.enterpriseType !== 'restaurant' && (
                    <button
                      onClick={() => setActiveTab('my-orders')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'my-orders' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                    >
                      <span className="flex items-center space-x-3 min-w-0">
                        <Truck className={`w-4 h-4 shrink-0 ${activeTab === 'my-orders' ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">Suivi Fournisseurs</span>
                      </span>
                    </button>
                  )}

                  {currentUser.enterpriseType !== 'hotel' && (
                    <button
                      onClick={() => setActiveTab('pos')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'pos' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-855 hover:text-white'}`}
                    >
                      <span className="flex items-center space-x-3 min-w-0">
                        <TrendingUp className={`w-4 h-4 shrink-0 ${activeTab === 'pos' ? 'text-white' : 'text-violet-400'}`} />
                        <span className="truncate font-semibold">Caisse Express</span>
                      </span>
                      <span className="bg-violet-500/20 text-violet-300 text-[8px] px-1.5 py-0.5 rounded font-black shrink-0">COMPTOIR</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('subscription')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'subscription' ? 'bg-violet-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-855 hover:text-white bg-indigo-950/20 border border-indigo-900/30'}`}
                  >
                    <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'subscription' ? 'text-white' : 'text-violet-400'}`} />
                    <span className="font-bold text-violet-350">Abonnement & Wallet</span>
                  </button>
                </>
              )}

              {currentUser.profileType === 'fournisseur' && (
                <>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'catalog' ? 'bg-emerald-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                  >
                    <Tractor className={`w-4 h-4 shrink-0 ${activeTab === 'catalog' ? 'text-white' : 'text-emerald-400'}`} />
                    <span>Mon Offre B2B</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('supplies')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'supplies' ? 'bg-emerald-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                  >
                    <span className="flex items-center space-x-3 min-w-0">
                      <ShoppingCart className={`w-4 h-4 shrink-0 ${activeTab === 'supplies' ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate flex-1">Commandes Reçues</span>
                    </span>
                    <span className="bg-emerald-900/50 text-emerald-300 text-[10px] rounded-full px-2 shrink-0">B2B</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('businesses')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 ${activeTab === 'businesses' ? 'bg-emerald-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                  >
                    <span className="flex items-center space-x-3 min-w-0">
                      <Users className={`w-4 h-4 shrink-0 ${activeTab === 'businesses' ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate font-semibold flex-1">Réseau d'Acheteurs</span>
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('subscription')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-sm transition duration-155 ${activeTab === 'subscription' ? 'bg-emerald-600 font-bold text-white shadow-lg' : 'text-slate-400 hover:bg-slate-855 hover:text-white bg-indigo-950/20 border border-indigo-900/30'}`}
                  >
                    <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'subscription' ? 'text-white' : 'text-emerald-400'}`} />
                    <span className="font-bold text-emerald-350">Abonnement & Wallet</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bottom block layout with Sync & Power Logout */}
          <div className="p-4 border-t border-slate-800/60 bg-slate-950/30 space-y-3 mr-1 selection:bg-transparent shrink-0">
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-850">
              <span className="text-[10px] text-slate-400 font-bold uppercase pl-1.5">Direct WeLink</span>
              <div className="flex items-center space-x-2">
                {/* Sync Trigger */}
                <button
                  onClick={fetchState}
                  disabled={refreshing}
                  className="p-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-95 transition"
                  title="Rafraîchir les données"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Account Profile Settings Button */}
            <a
              href="https://wa.me/237650023402?text=Bonjour%20l'administrateur%20WeLink,%20je%20vous%20contacte%20depuis%20l'application"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center space-x-3 px-3 py-2.5 bg-emerald-950/20 hover:bg-emerald-900/15 border border-emerald-850 hover:border-emerald-700/60 text-emerald-400 hover:text-emerald-300 rounded-xl transition duration-155 text-xs font-bold cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0 text-emerald-400 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-11.75c-.124-.207-.464-.329-.977-.585s1.424-.754 1.89-1.011c.469-.172.812-.258 1.153.259.34.515 1.318 1.664 1.614 2 .297.334-.593.376 1.107.12a14.502 14.502 0 0 0 4.089-2.528c1.093-.974 1.83-2.178 2.045-2.548.215-.371.023-.57.192-.784-.193-.19-.464-.537-.696-.807-.23-.27-.307-.456-.461-.759-.153-.304-.077-.571-.038-.827.115-.257-.977-2.355-1.339-3.227-.353-.849-.714-.734-.977-.747-.253-.013-.541-.015-.83-.015s-.758.11-1.153.541c-.395.432-1.51 1.478-1.51 3.606 0 2.129 1.548 4.183 1.761 4.47 1.168 1.562 2.502 2.871 4.103 3.562.953.41 1.696.656 2.274.839.957.304 1.83.261 2.518.158.767-.115 2.355-.962 2.686-1.892.33-.93.33-1.727.23-1.892-.099-.165-.395-.256-.91-.512z"/>
              </svg>
              <span>CONTACTER L'ADMIN</span>
            </a>

            <button
              onClick={() => setShowAccountModal(true)}
              className="w-full flex items-center space-x-3 px-3 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 text-indigo-400 hover:text-indigo-300 rounded-xl transition duration-155 text-xs font-bold cursor-pointer"
            >
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>GÉRER MON COMPTE</span>
            </button>

            {/* Red Log-out trigger button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 hover:text-red-300 rounded-xl transition duration-150 text-xs font-black cursor-pointer"
            >
              <Power className="w-4 h-4 text-red-500 shrink-0" />
              <span>DÉCONNEXION</span>
            </button>
          </div>
        </div>
      )}

      {/* Right panel layout workspace content area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {/* Universal Sticky Top Bar inside Right Panel workspace */}
        {!isViewingCustomShop && !isSaaSUser && (
          <header className="h-16 border-b border-slate-800/80 bg-slate-900/65 backdrop-blur-md px-6 flex items-center justify-between shrink-0 relative z-50">
            <div className="flex items-center space-x-2.5">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Espace de Travail</span>
              <span className="text-slate-700 text-xs">/</span>
              <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">{activeTab ? activeTab.replace('supermarket-', '').replace('b2b-', '').replace('market-', '') : 'Accueil'}</span>
            </div>

            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition cursor-pointer select-none">
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Changer d'Arrière-plan</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64data = reader.result as string;
                            const compressed = await compressImage(base64data);
                            // Instant background update for smooth visual feedback
                            setCurrentUser(prev => prev ? { ...prev, customBgDataUrl: compressed } : null);
                            setEditCustomBgDataUrl(compressed);
                            try {
                              const response = await fetch('/api/users/update', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: currentUser.id,
                                  customBgDataUrl: compressed
                                })
                              });
                              if (response.ok) {
                                const data = await response.json();
                                if (data.success && data.user) {
                                  setCurrentUser(data.user);
                                  fetchState(); // Synchronize all states
                                }
                              }
                            } catch (err) {
                              console.error("Error updating user background:", err);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  {currentUser.customBgDataUrl && (
                    <button
                      onClick={async () => {
                        // Reset background locally
                        setCurrentUser(prev => prev ? { ...prev, customBgDataUrl: '' } : null);
                        setEditCustomBgDataUrl('');
                        try {
                          const response = await fetch('/api/users/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: currentUser.id,
                              customBgDataUrl: ''
                            })
                          });
                          if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.user) {
                              setCurrentUser(data.user);
                              fetchState();
                            }
                          }
                        } catch (err) {
                          console.error("Error resetting user background:", err);
                        }
                      }}
                      className="flex items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-red-950/40 border border-slate-850 hover:border-red-900/50 text-slate-400 hover:text-red-400 transition cursor-pointer"
                      title="Réinitialiser l'arrière-plan par défaut"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
                title={theme === 'dark' ? "Passer en mode clair" : "Passer en mode sombre"}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </button>

              {/* Notifications Dropdown Container */}
              <div className="relative" id="notifications-wrapper">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setHasNewNotifsVisual(false);
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition flex items-center justify-center relative cursor-pointer"
                  title={`${notifications.filter(n => n.unread).length} notifications non lues`}
                >
                  {notifications.some(n => n.unread) ? (
                    <>
                      <BellRing className="w-4 h-4 text-indigo-400 animate-pulse" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-[9px]">
                        {notifications.filter(n => n.unread).length}
                      </span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 text-slate-400" />
                      {hasNewNotifsVisual && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 w-2 bg-indigo-500 rounded-full" />
                      )}
                    </>
                  )}
                </button>

                {showNotifications && (
                  <div 
                    id="notifications-dropdown-menu" 
                    className="absolute right-0 mt-2 w-[340px] sm:w-[400px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[999999] p-4 space-y-3.5 text-slate-900 dark:text-slate-100"
                  >
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <span>Notifications</span>
                        {notifications.some(n => n.unread) && (
                          <span className="bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {notifications.filter(n => n.unread).length}
                          </span>
                        )}
                      </h3>
                      
                      <div className="flex items-center gap-1 ml-auto mr-1.5">
                        <button
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className={`p-1 px-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[9px] font-semibold ${
                            soundEnabled 
                              ? 'border-indigo-900/30 bg-indigo-950/30 text-indigo-300' 
                              : 'border-slate-800 bg-slate-950/50 text-slate-500'
                          }`}
                        >
                          {soundEnabled ? <Volume2 className="w-3 h-3 text-indigo-400" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
                          <span>Sons</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <>
                            <button
                              onClick={markAllAsRead}
                              className="text-[10px] text-slate-400 hover:text-indigo-400 transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCheck className="w-3 h-3" /> <span className="hidden sm:inline">Tout lire</span>
                            </button>
                            <button
                              onClick={clearNotifications}
                              className="text-[10px] text-red-500 hover:text-red-400 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> <span className="hidden sm:inline font-bold">Vider</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-950/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-850 text-[10px] font-bold text-center">
                      <button
                        onClick={() => setActiveNotifTab('all')}
                        className={`py-1 rounded-lg transition-all cursor-pointer ${activeNotifTab === 'all' ? 'bg-indigo-650 dark:bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                      >
                        Tous ({notifications.length})
                      </button>
                      <button
                        onClick={() => setActiveNotifTab('order')}
                        className={`py-1 rounded-lg transition-all cursor-pointer ${activeNotifTab === 'order' ? 'bg-indigo-650 dark:bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                      >
                        Ventes ({notifications.filter(n => n.type === 'order').length})
                      </button>
                      <button
                        onClick={() => setActiveNotifTab('job_application')}
                        className={`py-1 rounded-lg transition-all cursor-pointer ${activeNotifTab === 'job_application' ? 'bg-indigo-650 dark:bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                      >
                        Offres ({notifications.filter(n => n.type === 'job_application').length})
                      </button>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
                      {processedNotifications.length === 0 ? (
                        <div className="py-6 flex flex-col items-center justify-center text-center bg-slate-950/10 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs dark:bg-slate-950/20 dark:border-slate-850">
                          Aucune notification correspondante.
                        </div>
                      ) : (
                        processedNotifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`p-2.5 rounded-xl border text-xs flex flex-col space-y-1 relative transition ${
                              notif.unread 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-950 dark:bg-indigo-950/30 dark:border-indigo-800/50 dark:text-slate-150 font-bold' 
                                : 'bg-slate-50/50 border-slate-200 text-slate-800 dark:bg-slate-950/40 dark:border-slate-800/60 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="pl-1 min-w-0 flex-1">
                                <span className="font-extrabold text-[11px] block text-slate-900 dark:text-slate-100">{notif.title}</span>
                                <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5 whitespace-pre-wrap leading-relaxed">{notif.message}</span>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                {notif.unread && (
                                  <button
                                    onClick={() => markNotificationAsRead(notif.id)}
                                    className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold cursor-pointer rounded"
                                  >
                                    Lu
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notif.id)}
                                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 cursor-pointer rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Minimalist Profile Pill */}
              <button
                id="profile-settings-pill-btn"
                onClick={() => setShowAccountModal(true)}
                className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 p-1 rounded-xl pr-3 select-none cursor-pointer transition active:scale-95 text-left"
                title="Gérer mon compte & profil"
              >
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentUser.name)}`}
                  alt="avatar"
                  className="w-6 h-6 rounded-lg bg-slate-900"
                />
                <span className="text-[11px] font-black text-slate-200 block truncate max-w-[120px]">{currentUser.name}</span>
              </button>
            </div>
          </header>
        )}

        {/* Dedicated Workspace Scroll Container (Occupy remaining height in fullscreen) */}
        <main className={`flex-1 overflow-y-auto ${isSaaSUser ? 'p-0' : 'p-4 md:p-8'}`}>
          {activeTab === 'subscription' ? (
            <div className="max-w-7xl mx-auto p-4 md:p-8">
              <SaaSSubscriptionPanel
                user={currentUser}
                allUsers={users}
                wallets={wallets}
                withdrawalRequests={withdrawalRequests}
                paymentInvoices={paymentInvoices}
                walletTransactions={walletTransactions}
                commissionSettings={commissionSettings}
                paymentSettings={paymentSettings}
                onRefreshState={fetchState}
              />
            </div>
          ) : (
            <>
              {/* Render Profile Specific Dashboard */}
              {currentUser.profileType === 'client' && (
                <ClientDashboard
                  user={currentUser}
                  products={products}
                  jobOffers={jobOffers}
                  orders={orders}
                  jobApplications={jobApplications}
                  allUsers={users}
                  onRefreshState={fetchState}
                  onShopViewChange={(shopId) => setVisitingShopId(shopId)}
                  hotelRooms={hotelRooms}
                  hotelRoomCategories={hotelRoomCategories}
                  hotelReservations={hotelReservations}
                  hotelCoupons={hotelCoupons}
                  hotelAuditLogs={hotelAuditLogs}
                  hotelFomoSettings={hotelFomoSettings}
                  restaurantTables={restaurantTables}
                  restaurantBookings={restaurantBookings}
                  dishRatings={dishRatings}
                  companyReviews={companyReviews}
                  clientClassifications={clientClassifications}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              )}

              {currentUser.profileType === 'entreprise' && currentUser.enterpriseType === 'autre' && (
                <SaaSERPDashboard
                  user={currentUser}
                  allUsers={users}
                  onRefreshState={fetchState}
                  onLogout={handleLogout}
                  wallets={wallets}
                  withdrawalRequests={withdrawalRequests}
                  paymentInvoices={paymentInvoices}
                  walletTransactions={walletTransactions}
                  commissionSettings={commissionSettings}
                  paymentSettings={paymentSettings}
                  onOpenProfile={() => setShowAccountModal(true)}
                  theme={theme}
                  setTheme={setTheme}
                />
              )}

              {currentUser.profileType === 'entreprise' && currentUser.enterpriseType !== 'autre' && (
                <BusinessDashboard
                  user={currentUser}
                  products={products}
                  jobOffers={jobOffers}
                  orders={orders}
                  ventes={ventes}
                  jobApplications={jobApplications}
                  onRefreshState={fetchState}
                  rayonsMetadata={rayonsMetadata}
                  enterpriseStocks={enterpriseStocks}
                  allUsers={users}
                  hotelRooms={hotelRooms}
                  hotelRoomCategories={hotelRoomCategories}
                  hotelReservations={hotelReservations}
                  hotelCoupons={hotelCoupons}
                  hotelAuditLogs={hotelAuditLogs}
                  hotelFomoSettings={hotelFomoSettings}
                  fishLots={fishLots}
                  fishLossLogs={fishLossLogs}
                  fishAlerts={fishAlerts}
                  butcherLots={butcherLots}
                  butcherLossLogs={butcherLossLogs}
                  butcherCuts={butcherCuts}
                  restaurantTables={restaurantTables}
                  restaurantBookings={restaurantBookings}
                  dishRatings={dishRatings}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              )}

              {currentUser.profileType === 'fournisseur' && (
                <SupplierDashboard
                  user={currentUser}
                  products={products}
                  orders={orders}
                  onRefreshState={fetchState}
                  allBusinesses={users.filter(u => u.profileType === 'entreprise')}
                  activeTab={activeTab as any}
                  setActiveTab={setActiveTab}
                />
              )}

              {currentUser.profileType === 'livreur' && (
                <CarrierDashboard
                  user={currentUser}
                  orders={orders}
                  allUsers={users}
                  onRefreshState={fetchState}
                />
              )}
            </>
          )}
        </main>
      </div>

      {showAccountModal && currentUser && (
        <div id="account-settings-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-0.5">Paramètres WeLink</span>
                <h3 className="text-md font-black text-white">Mon Profil & Compte</h3>
              </div>
              <button
                id="close-account-modal-btn"
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Scroll Body */}
            <form onSubmit={handleUpdateProfile} className="p-5 space-y-4 max-h-[460px] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                  {currentUser.profileType === 'entreprise' ? "Raison Sociale / Nom d'Entreprise" : "Nom Complet"}
                </label>
                <input
                  id="edit-profile-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-600 transition"
                  placeholder="Ex: Supermarché du Plateau"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">Téléphone</label>
                  <input
                    id="edit-profile-phone"
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-600 transition"
                    placeholder="Ex: +221 77 123 45 67"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">Adresse / Localisation</label>
                  <input
                    id="edit-profile-address"
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-600 transition"
                    placeholder="Ex: Douala Akwa, Blvd de la Liberté"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">Avatar / Logo (URL)</label>
                <div className="flex gap-2">
                  <input
                    id="edit-profile-avatar"
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-600 transition"
                    placeholder="Lien HTTP de l'image"
                  />
                  <button
                    type="button"
                    id="profile-random-avatar-btn"
                    onClick={() => {
                      const seed = Math.floor(Math.random() * 10000);
                      setEditAvatarUrl(`https://api.dicebear.com/7.x/adventurer/svg?seed=welink-${seed}`);
                    }}
                    className="px-3 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded-xl border border-slate-850 text-[10px] font-bold transition shrink-0 cursor-pointer"
                  >
                    🎲 Aléatoire
                  </button>
                </div>
                {editAvatarUrl && (
                  <div className="mt-2 flex items-center space-x-2 bg-slate-950/40 border border-slate-850/30 p-1.5 rounded-lg w-max max-w-full">
                    <img src={editAvatarUrl} alt="Visualisation" className="w-10 h-10 object-contain rounded bg-slate-950 shrink-0" referrerPolicy="no-referrer" />
                    <span className="text-[10px] text-slate-500 truncate max-w-[200px]">Aperçu de l'image</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                  {currentUser.profileType === 'entreprise' ? "Description de l'activité commerciale" : "À propos / Biographie"}
                </label>
                <textarea
                  id="edit-profile-description"
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-600 transition mb-3"
                  placeholder="Présentez votre activité, vos services ou vos préférences..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-indigo-400 tracking-wider mb-1">
                  🏞️ Image d'Arrière-plan Personnalisé
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-850 rounded-xl text-xs font-bold transition cursor-pointer select-none">
                    <span>📁 Importer une image locale...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const raw = reader.result as string;
                            const comp = await compressImage(raw);
                            setEditCustomBgDataUrl(comp);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {editCustomBgDataUrl && (
                    <button
                      type="button"
                      onClick={() => setEditCustomBgDataUrl('')}
                      className="px-3 py-2 border border-rose-950/40 bg-rose-950/15 text-rose-450 hover:bg-rose-950/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                {editCustomBgDataUrl && (
                  <div className="mt-2.5 flex items-center space-x-2 bg-slate-950/45 border border-slate-850/40 p-2 rounded-xl">
                    <div className="w-16 h-10 rounded-lg border border-slate-800 bg-cover bg-center shrink-0 shadow-sm" style={{ backgroundImage: `url(${editCustomBgDataUrl})` }} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-300">Votre image d'arrière-plan</span>
                      <span className="text-[8px] text-slate-500 font-mono">Prête à être appliquée à votre espace</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Profile Update */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="save-profile-btn"
                  disabled={editSaving}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-650/20 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
                >
                  {editSaving ? "Enregistrement en cours..." : "Sauvegarder les modifications"}
                </button>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800/80 my-4 pt-4">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-950/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <span className="text-red-700 dark:text-red-450 text-xs font-black shrink-0">⚠️ Zone de Danger</span>
                    <p className="text-xs text-red-900 dark:text-zinc-100 leading-relaxed font-extrabold">
                      En supprimant votre compte, toutes vos données (profil, produits, annonces, stocks) seront définitivement effacées de la plateforme WeLink.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="delete-account-btn"
                    onClick={handleDeleteAccount}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-900/80 dark:hover:bg-red-800 dark:text-red-100 border border-red-500 dark:border-red-800 text-xs font-bold rounded-xl transition active:scale-[0.99] cursor-pointer block text-center"
                  >
                    Supprimer mon compte définitivement et résilier mon accès
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
