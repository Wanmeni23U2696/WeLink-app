import React, { useState } from 'react';
import { UserProfile, Product, JobOffer, Order } from '../types';
import { 
  Shirt, Sparkles, Tag, Sliders, RefreshCw, PlusCircle, Trash2, Edit3, 
  ShoppingBag, Eye, Percent, CheckCircle, AlertTriangle, Image as ImageIcon, 
  X, Filter, Grid, List, Search, ArrowRight, TrendingUp, Info, Package, 
  Check, Play, DollarSign, Archive, Ban, Upload
} from 'lucide-react';

interface ClothingBoutiqueDashboardProps {
  user: UserProfile;
  products: Product[];
  jobOffers: JobOffer[];
  orders: Order[];
  onRefreshState: () => void;
  allUsers?: UserProfile[];
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const CATEGORIES = [
  { id: 'Homme', label: 'Homme 👔', defaultImg: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=600' },
  { id: 'Femme', label: 'Femme 👗', defaultImg: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600' },
  { id: 'Enfant', label: 'Enfant 👦', defaultImg: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=600' },
  { id: 'Bébé', label: 'Bébé 👶', defaultImg: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600' },
  { id: 'Sport', label: 'Sport 👟', defaultImg: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=600' },
  { id: 'Accessoires', label: 'Accessoires 👜', defaultImg: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600' },
  { id: 'Chaussures', label: 'Chaussures 👠', defaultImg: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600' }
];

const POPULAR_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42', '44', 'Taille Unique'];
const POPULAR_MATERIALS = ['Coton d\'Égypte', 'Soie Naturelle', 'Lin Respirant', 'Laine Mérinos', 'Cuir Véritable', 'Denim Robuste', 'Polyester Recyclé', 'Cachemire'];
const POPULAR_COLORS = [
  { name: 'Noir Ébène', hex: '#1a1a1a' },
  { name: 'Blanc Pur', hex: '#f9f9f9' },
  { name: 'Bleu Marine', hex: '#1e3a8a' },
  { name: 'Gris Sidéral', hex: '#64748b' },
  { name: 'Bordeaux Chic', hex: '#881337' },
  { name: 'Vert Forêt', hex: '#14532d' },
  { name: 'Rose Poudré', hex: '#fbcfe8' },
  { name: 'Beige Sable', hex: '#f5f5dc' }
];

function HoverImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [intervalId, setIntervalId] = useState<any | null>(null);

  React.useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const handleMouseEnter = () => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 1200);
    setIntervalId(id);
  };

  const handleMouseLeave = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setActiveIndex(0);
  };

  return (
    <div 
      className="w-full h-full relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={images[activeIndex] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'}
        alt={alt}
        className="w-full h-full object-cover transition-all duration-350 ease-in-out group-hover:scale-105"
      />
      {images.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10 bg-slate-950/70 backdrop-blur px-2 py-1 rounded-full border border-slate-800/85">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-350 ${
                idx === activeIndex ? 'bg-indigo-400 w-3.5' : 'bg-slate-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClothingBoutiqueDashboard({
  user,
  products,
  jobOffers,
  orders,
  onRefreshState,
  activeTab,
  setActiveTab,
}: ClothingBoutiqueDashboardProps) {

  // List of products and incoming orders from this specific boutique
  const myProducts = products.filter(p => p.sellerId === user.id);
  const myIncomingOrders = orders.filter(o => o.sellerId === user.id);

  // Sub-Navigation State (catalog vs sales cycle)
  const [internalTab, setInternalTab] = useState<'catalog' | 'sales'>(
    activeTab === 'sales' ? 'sales' : 'catalog'
  );

  // Sync internal sub-tab state when the parent tab prop updates
  React.useEffect(() => {
    if (activeTab === 'inventory') {
      setInternalTab('catalog');
    } else if (activeTab === 'sales') {
      setInternalTab('sales');
    }
  }, [activeTab]);

  // Search & Filters (Catalog)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Tous');
  const [filterStatus, setFilterStatus] = useState<string>('Tous');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filters (Sales)
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Tous');

  // Form Management states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Common Form Fields
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Homme');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('Noir Ébène');
  const [size, setSize] = useState('M');
  const [material, setMaterial] = useState('Coton d\'Égypte');
  const [price, setPrice] = useState('');
  const [promotionDiscount, setPromotionDiscount] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [status, setStatus] = useState<'Disponible' | 'Rupture' | 'Archivé'>('Disponible');
  const [imagesInput, setImagesInput] = useState<string[]>(['']);
  
  // Status message
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quick action states
  const [quickRestockId, setQuickRestockId] = useState<string | null>(null);
  const [quickRestockQty, setQuickRestockQty] = useState('');

  // Handle Photo input helpers
  const handleAddPhotoField = () => {
    setImagesInput([...imagesInput, '']);
  };

  const handleRemovePhotoField = (index: number) => {
    const updated = [...imagesInput];
    updated.splice(index, 1);
    setImagesInput(updated.length ? updated : ['']);
  };

  const handlePhotoUrlChange = (index: number, val: string) => {
    const updated = [...imagesInput];
    updated[index] = val;
    setImagesInput(updated);
  };

  // Pre-fill form for Edit Mode
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title || '');
    setBrand(p.brand || '');
    setCategory(p.category || 'Homme');
    setDescription(p.description || '');
    setColor(p.color || 'Noir Ébène');
    setSize(p.size || 'M');
    setMaterial(p.material || 'Coton d\'Égypte');
    setPrice(p.price ? p.price.toString() : '');
    setPromotionDiscount(p.promotionDiscount ? p.promotionDiscount.toString() : '');
    setStock(p.stock ? p.stock.toString() : '0');
    setMinStock(p.minStock ? p.minStock.toString() : '5');
    setStatus(p.status || 'Disponible');
    setImagesInput(p.images && p.images.length ? [...p.images] : [p.imageUrl || '']);
    
    setFormError(null);
    setFormSuccess(null);
    setShowEditModal(true);
  };

  const openAddModal = () => {
    setTitle('');
    setBrand('');
    setCategory('Homme');
    setDescription('');
    setColor('Noir Ébène');
    setSize('M');
    setMaterial('Coton d\'Égypte');
    setPrice('');
    setPromotionDiscount('');
    setStock('');
    setMinStock('5');
    setStatus('Disponible');
    setImagesInput(['']);
    
    setFormError(null);
    setFormSuccess(null);
    setShowAddModal(true);
  };

  // Save / Edit Clothing Product
  const handleSaveProduct = async (e: React.FormEvent, isEditMode: boolean) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim() || !price || !stock) {
      setFormError('Le nom de l\'article, le prix et le stock disponible sont obligatoires.');
      return;
    }

    const priceNum = Number(price);
    const stockNum = Number(stock);
    const minStockNum = Number(minStock || 0);
    const discountNum = promotionDiscount ? Number(promotionDiscount) : undefined;

    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Veuillez saisir un prix de vente valide supérieur à 0.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Le stock disponible doit être un entier supérieur ou égal à 0.');
      return;
    }
    if (discountNum !== undefined && (isNaN(discountNum) || discountNum < 0 || discountNum > 100)) {
      setFormError('La remise applicable doit être un pourcentage compris entre 0 et 100 %.');
      return;
    }

    setSubmitting(true);

    // Get non-empty images
    const validImages = imagesInput.filter(img => img.trim() !== '');
    // If no custom photos provide category default image
    const finalImageUrl = validImages.length ? validImages[0] : (CATEGORIES.find(c => c.id === category)?.defaultImg || '');
    const finalImagesList = validImages.length ? validImages : [finalImageUrl];

    // Determine auto-status in case of 0 stock
    let finalStatus = status;
    if (stockNum === 0 && status === 'Disponible') {
      finalStatus = 'Rupture';
    } else if (stockNum > 0 && status === 'Rupture') {
      finalStatus = 'Disponible';
    }

    const requestPayload = {
      sellerId: user.id,
      title: title.trim(),
      brand: brand.trim() || 'Générique',
      category,
      description: description.trim() || `Élégant vêtement ${category} en ${material}.`,
      price: priceNum,
      stock: stockNum,
      minStock: minStockNum,
      status: finalStatus,
      color,
      size,
      material,
      imageUrl: finalImageUrl,
      images: finalImagesList,
      unit: 'pièce',
      rayon: 'Prêt-à-porter',
      promotionDiscount: discountNum || null,
      promotionEnd: discountNum ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null // 1 week default
    };

    try {
      const url = isEditMode && editingProduct 
        ? `/api/products/${editingProduct.id}` 
        : '/api/products';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        setFormSuccess(isEditMode ? 'Article mis à jour avec succès !' : 'Nouvel article ajouté avec succès !');
        setTimeout(() => {
          setShowAddModal(false);
          setShowEditModal(false);
          onRefreshState();
        }, 1000);
      } else {
        const err = await response.json();
        setFormError(err.error || 'Une erreur est survenue lors de l\'enregistrement.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Erreur de réseau ou serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Voulez-vous supprimer cet article du catalogue ?')) return;
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        onRefreshState();
      } else {
        alert('Impossible de supprimer le produit.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick re-appro stock
  const handleQuickRestockSubmit = async (productId: string) => {
    const qty = Number(quickRestockQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Veuillez spécifier une quantité positive.');
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty })
      });

      if (response.ok) {
        setQuickRestockId(null);
        setQuickRestockQty('');
        onRefreshState();
      } else {
        alert('Erreur d\'approvisionnement.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Catalog
  const filteredProducts = myProducts.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.material && p.material.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.color && p.color.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCat = filterCategory === 'Tous' || p.category === filterCategory;
    
    let matchesStat = true;
    if (filterStatus !== 'Tous') {
      if (filterStatus === 'Disponible') matchesStat = p.stock > 0 && p.status !== 'Archivé';
      else if (filterStatus === 'Rupture') matchesStat = p.stock === 0 || p.status === 'Rupture';
      else if (filterStatus === 'Archivé') matchesStat = p.status === 'Archivé';
      else if (filterStatus === 'AlerteStock') matchesStat = p.stock <= (p.minStock || 5) && p.stock > 0;
    }

    return matchesSearch && matchesCat && matchesStat;
  });

  // Action update for customer order
  const handleOrderStatusChange = async (orderId: string, newStatus: 'accepted' | 'shipped' | 'delivered' | 'cancelled') => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        onRefreshState();
      } else {
        alert('Erreur lors du changement de statut de la commande.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Orders
  const filteredOrders = myIncomingOrders.filter(o => {
    const matchesSearch = 
      o.productTitle.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase());

    const matchesStatus = orderStatusFilter === 'Tous' || o.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalArticles = myProducts.length;
  const currentStockValue = myProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const lowStockAlerts = myProducts.filter(p => p.stock <= (p.minStock || 5)).length;
  
  // Total Revenue from orders (accepted shipped delivered count as sales)
  const totalRevenue = myIncomingOrders
    .filter(o => o.status === 'accepted' || o.status === 'shipped' || o.status === 'delivered')
    .reduce((acc, o) => acc + (o.price * o.quantity), 0);

  const pendingOrdersCount = myIncomingOrders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-8 pb-16 text-slate-100">
      
      {/* Title Header with branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Shirt className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Boutique de Mode & Prêt-à-Porter</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{user.name}</span>
            <span className="bg-indigo-650/30 text-indigo-300 border border-indigo-900/40 text-xs font-extrabold px-3 py-1 rounded-full uppercase">
              Pro Boutique
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Module professionnel de gestion : approvisionnez vos articles, réglez les tailles/matières complexes, appliquez les soldes saisonnières et suivez les ventes jusqu'à la livraison finale.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouveau Vêtement</span>
          </button>
          
          <button
            onClick={onRefreshState}
            className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition active:scale-95 cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats widgets designed in visual bento blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Collection</span>
            <span className="block text-xl font-black text-white mt-1">{totalArticles} articles</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Disponibles au catálogo</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-950/40 border border-indigo-900/30 flex items-center justify-center text-indigo-400">
            <Shirt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Seuil minima atteints</span>
            <span className="block text-xl font-black text-amber-400 mt-1">{lowStockAlerts} alertes</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Demandes de réappro</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Recettes Enregistrées</span>
            <span className="block text-xl font-black text-emerald-400 mt-1">{totalRevenue.toLocaleString('fr-FR')} F</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Ventes validées et livrées</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/30 border border-emerald-900/40 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Commandes clientes</span>
            <span className="block text-xl font-black text-rose-400 mt-1">{pendingOrdersCount} en attente</span>
            <span className="text-[9px] text-rose-450 font-bold block mt-0.5 animate-pulse">Nouvelles requêtes reçues</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-950/30 border border-rose-900/40 flex items-center justify-center text-rose-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Tab Switcher for workspace management */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => {
            setInternalTab('catalog');
            if (setActiveTab) setActiveTab('inventory');
          }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            internalTab === 'catalog' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-450 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Gestion du Catalogue</span>
        </button>

        <button
          onClick={() => {
            setInternalTab('sales');
            if (setActiveTab) setActiveTab('sales');
          }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer relative ${
            internalTab === 'sales' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-450 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Ventes & Commandes ({myIncomingOrders.length})</span>
          {pendingOrdersCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-4 animate-ping" />
          )}
        </button>
      </div>

      {/* TAB CONTENT: CATALOG MANAGEMENT */}
      {internalTab === 'catalog' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Low stock alert bar */}
          {lowStockAlerts > 0 && (
            <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-2xl flex items-start gap-3 text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Alerte approvisionnement nécessaire</h4>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Vos stocks pour certains articles clés sont sous le seuil d'alerte configuré. Cliquez sur le bouton <strong>+ Réappro</strong> d'un vêtement pour l'alimenter en stock instantanément.
                </p>
              </div>
            </div>
          )}

          {/* Interactive controls */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80 space-y-4">
            
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
              
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par vêtement, marque, couleur dominante, matière textile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                
                <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-black pl-1 font-bold">Catégorie:</span>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-transparent border-none text-xs text-slate-300 focus:outline-none focus:ring-0 cursor-pointer font-bold"
                  >
                    <option value="Tous" className="bg-slate-940 bg-slate-900">Tous les vestiaires</option>
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900">{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-black pl-1 font-bold">Stocks:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent border-none text-xs text-slate-300 focus:outline-none focus:ring-0 cursor-pointer font-bold"
                  >
                    <option value="Tous" className="bg-slate-900">Tout l'inventaire</option>
                    <option value="Disponible" className="bg-slate-900">En stock</option>
                    <option value="Rupture" className="bg-slate-900">Épuisés (ruptures)</option>
                    <option value="AlerteStock" className="bg-slate-900">⚠️ Sous seuil d'alerte</option>
                    <option value="Archivé" className="bg-slate-900">Archivés</option>
                  </select>
                </div>

                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Vue Galerie Grille"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Vue Tableau Liste"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

            {/* Quick click categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800 select-none">
              <button
                onClick={() => setFilterCategory('Tous')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase transition tracking-wider shrink-0 cursor-pointer ${
                  filterCategory === 'Tous' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                }`}
              >
                Tous les vestiaires
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase transition tracking-wider shrink-0 cursor-pointer ${
                    filterCategory === cat.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

          </div>

          {/* Catalog grid view */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 p-6">
              <Shirt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold">Aucun article de collection trouvé.</p>
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-xl transition"
              >
                Créer la première pièce +
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(p => {
                const hasPromo = p.promotionDiscount && p.promotionDiscount > 0;
                const netPrice = hasPromo ? Math.round(p.price * (1 - p.promotionDiscount! / 100)) : p.price;
                const isLowStock = p.stock <= (p.minStock || 5);
                const isOutOfStock = p.stock === 0 || p.status === 'Rupture';
                const isArchived = p.status === 'Archivé';
                const photoList = p.images && p.images.length ? p.images : [p.imageUrl || ''];

                return (
                  <div 
                    key={p.id}
                    className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between transition duration-200 hover:border-slate-700 relative group ${
                      isArchived ? 'opacity-60 border-slate-850' : isOutOfStock ? 'border-red-900/30' : isLowStock ? 'border-amber-900/40 shadow' : 'border-slate-850'
                    }`}
                  >
                    <div className="h-48 relative bg-slate-950 overflow-hidden">
                      <HoverImageGallery images={photoList} alt={p.title || 'Produit'} />
                      
                      <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black uppercase text-slate-300 border border-slate-800">
                        {p.category}
                      </span>

                      {p.brand && (
                        <span className="absolute bottom-3 left-3 bg-indigo-950/85 backdrop-blur-md px-2.5 py-0.5 rounded text-[8px] font-bold text-indigo-300 border border-indigo-900/30">
                          🏷️ {p.brand}
                        </span>
                      )}

                      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                        {isArchived ? (
                          <span className="bg-amber-950 text-amber-300 border border-amber-900/30 text-[8px] font-black px-1.5 py-0.5 rounded select-none">
                            ARCHIVÉ
                          </span>
                        ) : isOutOfStock ? (
                          <span className="bg-red-950 text-red-400 border border-red-900/40 text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse select-none">
                            RUPTURE
                          </span>
                        ) : isLowStock ? (
                          <span className="bg-amber-950 text-amber-300 border border-amber-900/40 text-[8px] font-black px-1.5 py-0.5 rounded select-none">
                            ⚠️ BAS {p.stock}
                          </span>
                        ) : (
                          <span className="bg-emerald-950 text-emerald-450 border border-emerald-900/40 text-[8px] font-black px-1.5 py-0.5 rounded select-none">
                            ACTIF
                          </span>
                        )}

                        {hasPromo && (
                          <span className="bg-rose-950 border border-rose-900 text-rose-400 text-[9px] font-black px-2 py-0.5 rounded mt-1 select-none">
                            -{p.promotionDiscount}% SALE
                          </span>
                        )}
                      </div>

                      {photoList.length > 1 && (
                        <span className="absolute bottom-3 right-3 bg-slate-950/95 backdrop-blur text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-800">
                          +{photoList.length - 1} Visuels
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="font-extrabold text-xs text-white uppercase group-hover:text-indigo-400 truncate">{p.title}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 h-7 leading-normal">{p.description}</p>
                        
                        <div className="grid grid-cols-3 gap-1 bg-slate-950/40 p-2 border border-slate-850 rounded-xl mt-3 text-[10px]">
                          <div>
                            <span className="text-slate-500 block uppercase font-black text-[7px] leading-none">Taille</span>
                            <span className="text-slate-200 font-extrabold block truncate mt-1">{p.size || 'M'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase font-black text-[7px] leading-none">Couleur</span>
                            <span className="text-slate-205 block truncate mt-1 font-bold">{p.color || 'Noir'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase font-black text-[7px] leading-none">Tissu</span>
                            <span className="text-slate-205 block truncate mt-1 font-bold">{p.material || 'Coton'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-850 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[9px] text-slate-500 block">PRIX DE VENTE</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-extrabold text-white text-sm">{netPrice.toLocaleString()} FCFA</span>
                              {hasPromo && <span className="text-[10px] text-slate-500 line-through">{p.price}</span>}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 block">STOCK DISPO</span>
                            <span className={`font-black uppercase block ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-slate-200'}`}>
                              {p.stock} pce <span className="text-[8px] text-slate-500 font-normal">({p.minStock || 5} min)</span>
                            </span>
                          </div>
                        </div>

                        {quickRestockId === p.id ? (
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-indigo-900/30 flex items-center space-x-1.5">
                            <input
                              type="number"
                              placeholder="+ Ajouter qte"
                              value={quickRestockQty}
                              onChange={(e) => setQuickRestockQty(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 text-xs text-slate-200 placeholder:text-slate-650 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleQuickRestockSubmit(p.id)}
                              className="px-2 py-1 bg-indigo-600 text-white rounded text-[9px] font-bold cursor-pointer"
                            >
                              Confirmer
                            </button>
                            <button onClick={() => setQuickRestockId(null)} className="text-slate-400 hover:text-white px-1">X</button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-1.5 select-none text-[10px]">
                            <button
                              onClick={() => openEditModal(p)}
                              className="py-1 bg-slate-950 hover:bg-slate-850 hover:text-white text-slate-400 rounded-lg border border-slate-800 transition font-bold text-center cursor-pointer"
                            >
                              Éditer
                            </button>
                            <button
                              onClick={() => { setQuickRestockId(p.id); setQuickRestockQty(''); }}
                              className="py-1 bg-indigo-950/20 hover:bg-indigo-950/45 text-indigo-300 border border-indigo-900/30 rounded-lg transition font-bold text-center cursor-pointer"
                            >
                              + Stock
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="py-1 bg-red-950/10 hover:bg-red-950/35 text-red-400 border border-red-900/10 rounded-lg transition font-bold text-center cursor-pointer"
                            >
                              Suppr.
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Catalog List View */
            <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-500 uppercase text-[9px] font-black border-b border-slate-800">
                      <th className="py-3 px-4">Modèle & Collection</th>
                      <th className="py-3 px-4">Marque / Designer</th>
                      <th className="py-3 px-4 text-center">Taille & Tissu</th>
                      <th className="py-3 px-4">Disponible</th>
                      <th className="py-3 px-4">Alerte Minimale</th>
                      <th className="py-3 px-4">Prix Public</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredProducts.map(p => {
                      const hasPromo = p.promotionDiscount && p.promotionDiscount > 0;
                      const netPrice = hasPromo ? Math.round(p.price * (1 - p.promotionDiscount! / 100)) : p.price;
                      const isLowStock = p.stock <= (p.minStock || 5);
                      const isOutOfStock = p.stock === 0 || p.status === 'Rupture';
                      const isArchived = p.status === 'Archivé';

                      return (
                        <tr key={p.id} className="hover:bg-slate-950/30 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <img src={p.imageUrl} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0" />
                              <div>
                                <span className="font-extrabold text-white block uppercase text-xs">{p.title}</span>
                                <span className="text-[9px] font-medium text-indigo-400 bg-indigo-950/30 border border-indigo-900/10 px-2 py-0.5 rounded mt-0.5 inline-block">{p.category}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-300">{p.brand || 'Générique'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-slate-950 px-2 py-1 rounded text-slate-100 font-extrabold border border-slate-850">{p.size || 'M'}</span>
                            <span className="text-[10px] text-slate-500 block mt-1 font-mono">{p.material || 'Coton'}</span>
                          </td>
                          <td className="py-3 px-4">
                            {isOutOfStock ? (
                              <span className="text-red-400 font-bold">Rupture (0)</span>
                            ) : (
                              <span className={`font-bold ${isLowStock ? 'text-amber-400' : 'text-slate-100'}`}>{p.stock} unités</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">{p.minStock || 5} pces</td>
                          <td className="py-3 px-4">
                            <span className="font-black text-sm text-white">{netPrice.toLocaleString()} F</span>
                            {hasPromo && <span className="text-[10px] text-slate-500 line-through block italic">({p.price})</span>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <button onClick={() => openEditModal(p)} className="p-1 text-slate-400 hover:text-white bg-slate-950 border border-slate-850 rounded">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  const qty = prompt("Combien d'unités de stock à ajouter ?");
                                  if (qty && !isNaN(Number(qty))) {
                                    setQuickRestockQty(qty);
                                    handleQuickRestockSubmit(p.id);
                                  }
                                }} 
                                className="px-2 py-1 bg-indigo-950/40 text-indigo-300 hover:bg-slate-800 border border-indigo-900/30 rounded text-[9px] font-black uppercase"
                              >
                                + appro
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="p-1 text-red-400 hover:text-red-300 bg-red-955/10 border border-red-900/10 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SALES & CUSTOMER ORDERS TRACKING */}
      {internalTab === 'sales' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Revenue and Orders statistics layout */}
          <div className="bg-slate-950/30 p-4 border border-slate-850 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-950/40 text-emerald-450 border border-emerald-900/30 rounded-2xl flex items-center justify-center font-bold text-xl">
                💰
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-550 uppercase tracking-widest pl-0.5">Livre de compte caisse</h4>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-white">{totalRevenue.toLocaleString('fr-FR')} FCFA</span>
                  <span className="text-xs text-slate-400 font-medium">de chiffre d'affaires</span>
                </div>
              </div>
            </div>

            <div className="text-xs bg-slate-950 p-3 border border-slate-850 rounded-xl text-slate-400 max-w-sm leading-relaxed shrink-0">
              💡 <strong>Cycle de vente :</strong> Les commandes reçoivent le statut "Attente", puis reçoivent "Acceptée". Vous les expédiez "Expédiée", puis le client confirme sa réception.
            </div>
          </div>

          {/* Filters for invoices orders */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-center gap-3 justify-between">
            
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par client, article commandé, référence..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850 w-full sm:w-auto shrink-0 justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase select-none">Statut de livraison:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-indigo-305 font-bold cursor-pointer focus:outline-none"
              >
                <option value="Tous" className="bg-slate-900">Toutes les commandes</option>
                <option value="pending" className="bg-slate-900">En attente (Attente)</option>
                <option value="accepted" className="bg-slate-900">Acceptées</option>
                <option value="shipped" className="bg-slate-900">Expédiées</option>
                <option value="delivered" className="bg-slate-900">Livrées (Vente finale) ✓</option>
                <option value="cancelled" className="bg-slate-900">Annulées</option>
              </select>
            </div>

          </div>

          {/* Invoices list */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-450">
              <ShoppingBag className="w-10 h-10 text-slate-650 mx-auto mb-3 animate-pulse" />
              <p className="font-semibold text-xs text-white">Aucune commande enregistrée pour l'instant.</p>
              <p className="text-[10px] text-slate-500 mt-1">Dès qu'un shopper passera commande depuis le catalogue, elle sera listée ici en temps réel.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const totalInvoice = order.price * order.quantity;
                const matchesPrd = products.find(p => p.id === order.productId);
                
                return (
                  <div 
                    key={order.id} 
                    className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:border-slate-750"
                  >
                    {/* Item and Client name */}
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="text-[9px] font-mono bg-slate-900 text-indigo-400 px-2 py-0.5 rounded font-black uppercase">
                          Ref: {order.id.slice(-6)}
                        </span>
                        
                        {/* Status Label badge */}
                        {order.status === 'pending' && <span className="bg-rose-950 text-rose-400 border border-rose-900/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Attente validation</span>}
                        {order.status === 'accepted' && <span className="bg-blue-950 text-blue-400 border border-blue-900/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Acceptée</span>}
                        {order.status === 'shipped' && <span className="bg-indigo-950 text-indigo-300 border border-indigo-900/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-bold animate-pulse">En cours d'expédition</span>}
                        {order.status === 'delivered' && <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Livrée (Vente Finale) Checked ✓</span>}
                        {order.status === 'cancelled' && <span className="bg-slate-900 text-slate-500 border border-slate-800 text-[9px] px-2 py-0.5 rounded uppercase">Annulée</span>}
                      </div>

                      <h3 className="font-black text-sm text-white mt-1.5 uppercase tracking-wide">
                        {order.productTitle}
                      </h3>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-400">
                        <span>Client : <strong className="text-white font-semibold">{order.buyerName}</strong></span>
                        {matchesPrd && (
                          <>
                            <span>Taille : <strong className="text-indigo-400">{matchesPrd.size || 'M'}</strong></span>
                            <span>Tissu : <strong className="text-indigo-400">{matchesPrd.material || 'Coton'}</strong></span>
                            <span>Color : <strong className="text-indigo-400">{matchesPrd.color || 'Noir'}</strong></span>
                          </>
                        )}
                        <span>Canal : <strong className="text-slate-205 font-mono">{order.paymentMethod || 'Orange Money'}</strong></span>
                      </div>
                    </div>

                    {/* Quantity and Price tag and order handling */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3.5 border-t border-slate-850 pt-3 md:border-none md:pt-0 shrink-0">
                      
                      <div className="text-left md:text-right">
                        <span className="text-[9px] text-slate-550 block font-bold leading-none">FACTURE</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-black text-white">{totalInvoice.toLocaleString()} F</span>
                          <span className="text-[10px] text-slate-400 font-medium">({order.quantity} pce x {order.price.toLocaleString()})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 select-none">
                        {order.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOrderStatusChange(order.id, 'accepted');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-xs transition active:scale-95 cursor-pointer"
                            >
                              Accepter ✓
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOrderStatusChange(order.id, 'cancelled');
                              }}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-red-955/20 hover:text-red-400 text-slate-550 rounded-lg text-[10px] transition cursor-pointer"
                            >
                              Refuser
                            </button>
                          </>
                        )}

                        {order.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOrderStatusChange(order.id, 'shipped');
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-white" /> Expédier le colis
                          </button>
                        )}

                        {order.status === 'shipped' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOrderStatusChange(order.id, 'delivered');
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 font-bold" /> Marquer Livrée (Finaliser)
                          </button>
                        )}

                        {order.status === 'delivered' && (
                          <div className="flex items-center space-x-1 text-emerald-450 text-[11px] font-bold select-none">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Recette complétée</span>
                          </div>
                        )}

                        {order.status === 'cancelled' && (
                          <span className="text-slate-500 text-xs font-medium italic">Annulée</span>
                        )}

                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* CREATE NEW ARTICLE MODAL POPUP */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Shirt className="text-indigo-400" />
                <span>Nouveau Vêtement de Collection</span>
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-950/40 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveProduct(e, false)} className="p-6 space-y-6">
              
              {formError && (
                <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-400 text-xs font-bold rounded-xl">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs font-semibold rounded-xl">
                  {formSuccess}
                </div>
              )}

              {/* Two Columnfields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Article Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Nom de l'article de mode *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Robe de Soirée Satinée"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-205 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {/* 2. Brand */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Marque / Designer</label>
                  <input
                    type="text"
                    placeholder="ex: Chanel, Nike, marque locale, Générique"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-205 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {/* 3. Category selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Catégorie cible *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Fabrics Material */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Composition Matière *</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    {POPULAR_MATERIALS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Color text / selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Couleur dominante</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    {POPULAR_COLORS.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Sizes choices dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Taille disponible *</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    {POPULAR_SIZES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Description box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Description Coupe & Entretien</label>
                <textarea
                  rows={2}
                  placeholder="ex: Coupe cintrée près du corps. Laver à 30°C à l'envers, pas de sèche-linge."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-205 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Financial parameters (Price, Discounts) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/30 p-4 border border-slate-850 rounded-2xl">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Prix d'achat unitaire public (FCFA) *</label>
                  <input
                    type="number"
                    required
                    placeholder="ex: 15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2 px-3 text-xs text-slate-202 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Remise applicable (%)</label>
                  <input
                    type="number"
                    placeholder="Optionnel, ex: 20 (pour 20 % de rabais)"
                    value={promotionDiscount}
                    onChange={(e) => setPromotionDiscount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {price && (
                  <div className="col-span-1 md:col-span-2 text-xs flex justify-between bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-900/30 text-indigo-305 text-indigo-300">
                    <span>Prix de facturation net :</span>
                    <strong className="font-extrabold text-white">
                      {Math.round(Number(price) * (1 - (Number(promotionDiscount) || 0) / 100)).toLocaleString('fr-FR')} FCFA
                    </strong>
                  </div>
                )}

              </div>

              {/* Stock (Current, Safety Minimum, Status) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block font-black text-indigo-400">Stock initial disponible *</label>
                  <input
                    type="number"
                    required
                    placeholder="ex: 30"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-202 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Seuil d'Alerte Minimum *</label>
                  <input
                    type="number"
                    required
                    placeholder="ex: 5"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-202 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Statut catalogue</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Disponible">Disponible (Affiché aux clients)</option>
                    <option value="Rupture">Rupture de stock</option>
                    <option value="Archivé">Archivé (Masqué)</option>
                  </select>
                </div>

              </div>

              {/* PHOTO LIST */}
              <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider font-bold">Galerie Photos (Multiples)</label>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Ajoutez d'autres photos de votre collection pour enrichir la fiche produit.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPhotoField}
                    className="px-2.5 py-1 bg-indigo-900/30 text-indigo-305 bg-slate-950 rounded border border-indigo-900/30 text-[10px] font-black hover:bg-slate-900 transition"
                  >
                    + Autre photo URL
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {imagesInput.map((url, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="bg-slate-950 text-slate-550 font-bold text-[10px] w-6 h-6 rounded flex items-center justify-center border border-slate-800 shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        placeholder="URL de l'image (ou téléversez ci-contre)"
                        value={url}
                        onChange={(e) => handlePhotoUrlChange(idx, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-200 focus:outline-none"
                      />
                      
                      <label className="cursor-pointer bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg p-1.5 shrink-0 transition flex items-center justify-center" title="Téléverser une image de votre galerie">
                        <Upload className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  handlePhotoUrlChange(idx, event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      
                      {url.trim() && (
                        <img 
                          src={url} 
                          alt="preview thumbnail" 
                          className="w-6 h-6 rounded object-cover border border-slate-850 shrink-0 animate-fadeIn"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      )}

                      {imagesInput.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhotoField(idx)}
                          className="text-red-400 hover:text-red-300 p-1 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex justify-end space-x-3.5 pt-4 border-t border-slate-800 select-none">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-405 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-55 rounded-xl font-bold text-white text-xs shadow transition active:scale-95 cursor-pointer"
                >
                  {submitting ? 'Création...' : 'Publier et valider'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL POPUP */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="text-indigo-400" />
                <span>Modifier le Vêtement</span>
              </h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-950/40 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveProduct(e, true)} className="p-6 space-y-6">
              
              {formError && (
                <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-400 text-xs font-bold rounded-xl">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs font-semibold rounded-xl">
                  {formSuccess}
                </div>
              )}

              {/* Two Column fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Nom */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Nom de l'article *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-202 text-slate-200 focus:outline-none"
                  />
                </div>

                {/* 2. Marque */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Marque / Designer</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-202 text-slate-200 focus:outline-none"
                  />
                </div>

                {/* 3. Catégorie */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Catégorie cible *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Matière */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Matière textile *</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    {POPULAR_MATERIALS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Couleur */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Couleur dominante</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    {POPULAR_COLORS.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Taille */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Taille disponible *</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    {POPULAR_SIZES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Description box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Description Coupe & Entretien</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-202 text-slate-200 focus:outline-none"
                />
              </div>

              {/* Financial parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/30 p-4 border border-slate-850 rounded-2xl">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Prix d'achat unitaire public (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2 px-3 text-xs text-slate-202 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Remise applicable (%)</label>
                  <input
                    type="number"
                    value={promotionDiscount}
                    onChange={(e) => setPromotionDiscount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2 px-3 text-xs text-slate-202 text-slate-200 focus:outline-none"
                  />
                </div>

                {price && (
                  <div className="col-span-1 md:col-span-2 text-xs flex justify-between bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-900/30 text-indigo-305 text-indigo-300">
                    <span>Prix net actualisé :</span>
                    <strong className="font-extrabold text-white">
                      {Math.round(Number(price) * (1 - (Number(promotionDiscount) || 0) / 100)).toLocaleString('fr-FR')} FCFA
                    </strong>
                  </div>
                )}

              </div>

              {/* Stock and Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-400 block font-bold">Stock physique disponible *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-202 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Seuil d'Alerte Minimum *</label>
                  <input
                    type="number"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-202 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Statut catalogue</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Disponible">Disponible (Affiché)</option>
                    <option value="Rupture">Rupture de stock</option>
                    <option value="Archivé">Archivé (Masqué)</option>
                  </select>
                </div>

              </div>

              {/* PHOTO LIST */}
              <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider font-bold">Galerie Photos (Multiples)</label>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Organisez au mieux le rendu visuel de votre collection.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPhotoField}
                    className="px-2.5 py-1 bg-indigo-900/30 text-indigo-305 rounded border border-indigo-900/30 text-[10px] font-black hover:bg-slate-900 transition"
                  >
                    + Autre photo
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {imagesInput.map((url, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="bg-slate-950 text-slate-550 font-bold text-[10px] w-6 h-6 rounded flex items-center justify-center border border-slate-800 shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        placeholder="URL de l'image (ou téléversez ci-contre)"
                        value={url}
                        onChange={(e) => handlePhotoUrlChange(idx, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-200 focus:outline-none"
                      />
                      
                      <label className="cursor-pointer bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg p-1.5 shrink-0 transition flex items-center justify-center" title="Téléverser une image de votre galerie">
                        <Upload className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  handlePhotoUrlChange(idx, event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      
                      {url.trim() && (
                        <img 
                          src={url} 
                          alt="preview thumbnail" 
                          className="w-6 h-6 rounded object-cover border border-slate-850 shrink-0 animate-fadeIn"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      )}

                      {imagesInput.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhotoField(idx)}
                          className="text-red-400 hover:text-red-300 p-1 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Changes */}
              <div className="flex justify-end space-x-3.5 pt-4 border-t border-slate-800 select-none">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-55 rounded-xl font-bold text-white text-xs shadow transition active:scale-95 cursor-pointer"
                >
                  {submitting ? 'Validation...' : 'Enregistrer'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
