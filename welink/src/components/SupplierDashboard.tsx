import React, { useState } from 'react';
import { UserProfile, Product, Order } from '../types';
import { Tractor, PlusCircle, ShoppingCart, Users, CheckCircle, Clock } from 'lucide-react';
import WhatsAppButton from './WhatsAppButton';

interface SupplierDashboardProps {
  user: UserProfile;
  products: Product[];
  orders: Order[];
  onRefreshState: () => void;
  allBusinesses: UserProfile[];
  activeTab?: 'catalog' | 'supplies' | 'businesses';
  setActiveTab?: (tab: 'catalog' | 'supplies' | 'businesses') => void;
}

export default function SupplierDashboard({ 
  user, 
  products, 
  orders, 
  onRefreshState, 
  allBusinesses,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab
}: SupplierDashboardProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'catalog' | 'supplies' | 'businesses'>('catalog');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;

  // Supplier Add Product State
  const [suppTitle, setSuppTitle] = useState('');
  const [suppDescription, setSuppDescription] = useState('');
  const [suppPrice, setSuppPrice] = useState('');
  const [suppStock, setSuppStock] = useState('');
  const [suppUnit, setSuppUnit] = useState('sac 50kg');
  const [suppImageUrl, setSuppImageUrl] = useState('https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600');
  
  // Custom supplier sector mapping based on type
  const getSubCategory = () => {
    if (user.supplierType === 'agriculteur') return 'Maraîcher / Récolte';
    if (user.supplierType === 'artisan') return 'Artisanat / Meuble';
    if (user.supplierType === 'eleveur') return 'Élevage / Produits Laitiers';
    if (user.supplierType === 'poissonnier') return 'Poissonnier / Produits de la Mer';
    if ((user.supplierType as string) === 'boucher') return 'Boucher / Halal & Charcuterie';
    return 'Fournitures Diverses';
  };

  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Filter supplier listings and sales orders
  const myProducts = products.filter(p => p.sellerId === user.id);
  const myB2BOrders = orders.filter(o => o.sellerId === user.id); // Companies buying from this supplier

  // Handle supply product upload
  const handleAddSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppTitle || !suppPrice || !suppStock) return;

    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user.id,
          title: suppTitle,
          description: suppDescription,
          price: Number(suppPrice),
          category: getSubCategory(),
          stock: Number(suppStock),
          unit: suppUnit,
          imageUrl: suppImageUrl
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setFormSuccess('Produit d\'approvisionnement ajouté avec succès au catalogue des entreprises !');
      setSuppTitle('');
      setSuppDescription('');
      setSuppPrice('');
      setSuppStock('');
      setSuppUnit('sac 50kg');
      setSuppImageUrl('https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600');
      onRefreshState();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Voulez-vous retirer cette fourniture du catalogue ?')) return;

    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        onRefreshState();
      }
    } catch (err) {
      alert('Erreur lors du retrait du produit');
    }
  };

  // Dispatch order status
  const handleUpdateOrderStatus = async (orderId: string, status: 'accepted' | 'shipped' | 'delivered') => {
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
      alert('Erreur lors de la mise à jour de la commande B2B');
    }
  };

  return (
    <div id="supplier-dashboard-root" className="w-full font-sans">
      
      {/* Main content frame */}
      <div id="supplier-workspace" className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 min-h-[550px]">
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

        {/* TAB 1: SUPPLIER CATALOGUE */}
        {activeTab === 'catalog' && (
          <div id="supplier-catalog-tab" className="space-y-6">
            <div className="border-b border-slate-800/60 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <Tractor className="w-5 h-5 text-emerald-400" />
                <span>Mon Catalogue de Matières Premières & Fournitures</span>
              </h1>
              <p className="text-xs text-slate-400">Présentez vos récoltes, bétails de boucherie ou articles pour la vente aux entreprises partenaires.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Form poster */}
              <div className="md:col-span-5 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 mb-3 flex items-center space-x-1.5 animate-pulse">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nouveau produit B2B</span>
                </h3>

                <form onSubmit={handleAddSupply} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nom du produit agricole/artisanal *</label>
                    <input
                      id="new-supply-title"
                      type="text"
                      placeholder="ex: Pommes de terre locales"
                      value={suppTitle}
                      onChange={(e) => setSuppTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Prix de gros négocié (FCFA) *</label>
                    <input
                      id="new-supply-price"
                      type="number"
                      placeholder="12000"
                      value={suppPrice}
                      onChange={(e) => setSuppPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Quantité Disponible *</label>
                      <input
                        id="new-supply-stock"
                        type="number"
                        placeholder="25"
                        value={suppStock}
                        onChange={(e) => setSuppStock(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Unité (Lot, sac, kg)</label>
                      <input
                        id="new-supply-unit"
                        type="text"
                        placeholder="sac 50kg, lot"
                        value={suppUnit}
                        onChange={(e) => setSuppUnit(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Rubrique automatique</label>
                    <div className="w-full bg-slate-950 text-emerald-400 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase">
                      ⭐ {getSubCategory()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Descriptif des produits de la ferme</label>
                    <textarea
                      id="new-supply-desc"
                      rows={3}
                      placeholder="Indiquez la qualité du lot, fraîcheur et conditions de récolte..."
                      value={suppDescription}
                      onChange={(e) => setSuppDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Image Selector & File Upload */}
                  <div className="space-y-2 border-t border-slate-900 pt-3">
                    <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">📷 Illustration du catalogue</label>
                    
                    {suppImageUrl && (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                        <img src={suppImageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-slate-900/85 text-[8px] text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Aperçu</span>
                      </div>
                    )}

                    {/* Presets Horizontal Scroll */}
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-1">Choisir un modèle de notre galerie :</span>
                      <div className="flex space-x-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                        {[
                          { name: '🌾 Manioc', url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600' },
                          { name: '🥔 Pomme', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600' },
                          { name: '🪵 Mortier', url: 'https://images.unsplash.com/photo-1616627547024-42e12e1ec11b?auto=format&fit=crop&q=80&w=600' },
                          { name: '🐔 Poulet', url: 'https://images.unsplash.com/photo-1587593817642-4b92d0754701?auto=format&fit=crop&q=80&w=600' },
                          { name: '🥦 Légume', url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600' },
                          { name: '🥩 Bétail', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600' }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSuppImageUrl(preset.url)}
                            className="flex-shrink-0 bg-slate-900 hover:bg-slate-850 p-1 rounded-md text-[9px] text-slate-300 border border-slate-800 flex flex-col items-center space-y-1 transition active:scale-95"
                          >
                            <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded object-cover" />
                            <span className="truncate max-w-[50px]">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Gallery File explorer trigger */}
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
                                setSuppImageUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[10px] text-slate-505 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-950 file:text-emerald-300 hover:file:bg-emerald-900 transition cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="Lien URL de l'image..."
                        value={suppImageUrl.startsWith('data:') ? '' : suppImageUrl}
                        onChange={(e) => setSuppImageUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    id="add-supply-submit"
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-2 bg-emerald-650 hover:bg-emerald-650/80 transition text-white font-semibold rounded-lg text-xs"
                  >
                    {formLoading ? 'Création...' : 'Ajouter au catalogue B2B'}
                  </button>
                </form>
              </div>

              {/* Supp products active */}
              <div className="md:col-span-7 space-y-3">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Mes ventes en gros actives ({myProducts.length})</span>
                
                {myProducts.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                    Aucun produit répertorié. Utilisez le formulaire de gauche pour en ajouter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myProducts.map((p) => (
                      <div id={`supp-prod-${p.id}`} key={p.id} className="bg-slate-950/40 border border-slate-855 rounded-xl p-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-start space-x-3">
                          {p.imageUrl && (
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-12 h-12 rounded bg-slate-900 border border-slate-800 object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div>
                            <h4 className="font-bold text-xs text-slate-200">{p.title}</h4>
                            <span className="text-[10px] text-emerald-400 font-semibold">{p.category}</span>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">{p.description}</p>
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-emerald-300 block">{p.price.toLocaleString()} FCFA</span>
                          <span className="text-[10px] text-slate-500 block">Lot : {p.stock} ({p.unit})</span>
                          <button
                            id={`del-supp-prod-${p.id}`}
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-[10px] text-red-400 bg-red-950/10 border border-red-950/40 hover:bg-red-950/30 px-2 py-0.5 rounded-sm mt-2 transition"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: INCOMING SUPPLIES ORDERS */}
        {activeTab === 'supplies' && (
          <div id="supplier-supplies-tab" className="space-y-6">
            <div className="border-b border-slate-800/60 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <span>Fournitures Commandées par les Entreprise</span>
              </h1>
              <p className="text-xs text-slate-400">Commandes de matières premières reçues par des restaurants, hôtels ou supermarchés.</p>
            </div>

            {myB2BOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Vous n'avez pas de commande de fournitures active pour l'instant.
              </div>
            ) : (
              <div className="space-y-3.5">
                {myB2BOrders.map((o) => (
                  <div id={`supplier-order-${o.id}`} key={o.id} className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 text-[10px] mb-1">
                        <span className="text-slate-500 font-mono">B2B ORDER ID: {o.id}</span>
                        <span className="text-slate-650">•</span>
                        <span className="text-emerald-350 font-semibold uppercase">Entreprise acheteuse : {o.buyerName}</span>
                      </div>
                      <h4 className="font-bold text-slate-200 text-sm">{o.productTitle}</h4>
                      <p className="text-xs text-slate-400 font-mono">Quantité Commandée : <strong>{o.quantity} lot(s)</strong> • Total : <strong className="text-emerald-450">{(o.price * o.quantity).toLocaleString()} FCFA</strong></p>
                      
                      {(() => {
                        const buyerProfile = allBusinesses.find(b => b.id === o.buyerId);
                        if (!buyerProfile) return null;
                        return (
                          <div className="mt-2.5 p-2 rounded bg-slate-900/60 border border-slate-850/60 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                            <span className="text-[10px] font-extrabold text-emerald-450 uppercase tracking-widest block w-full mb-0.5">Contact Acheteur (Entreprise) :</span>
                            {buyerProfile.phone && (
                              <div className="flex items-center gap-2">
                                <a href={`tel:${buyerProfile.phone}`} className="hover:text-white flex items-center gap-1 hover:underline">
                                  📞 {buyerProfile.phone}
                                </a>
                                <WhatsAppButton 
                                  phone={buyerProfile.phone} 
                                  message={`Bonjour ${buyerProfile.name}, nous préparons votre livraison de marchandises WeLink.`} 
                                  iconOnly={true} 
                                />
                              </div>
                            )}
                            {buyerProfile.email && (
                              <a 
                                href={`mailto:${buyerProfile.email}?subject=Commande B2B ${o.id}&body=Bonjour ${buyerProfile.name},\n\nNous préparons votre livraison de "${o.productTitle}".\n\nCordialement,\n${user.name}`} 
                                className="hover:text-white flex items-center gap-1 hover:underline text-emerald-400"
                              >
                                ✉️ {buyerProfile.email}
                              </a>
                            )}
                            {buyerProfile.address && (
                              <span className="text-slate-500">📍 {buyerProfile.address}</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                      
                      <div className="flex items-center gap-1.5">
                        {o.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              id={`sup-accept-order-${o.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUpdateOrderStatus(o.id, 'accepted');
                              }}
                              className="bg-emerald-900 hover:bg-emerald-855 px-2.5 py-1 text-xs text-white rounded-lg transition cursor-pointer"
                            >
                              Confirmer la vente
                            </button>
                            <span className="bg-amber-955/35 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded text-[9px] font-bold uppercase">⏳ En attente</span>
                          </>
                        )}
                        {o.status === 'accepted' && (
                          <>
                            <button
                              type="button"
                              id={`sup-ship-order-${o.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUpdateOrderStatus(o.id, 'shipped');
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-xs text-white rounded-lg transition cursor-pointer"
                            >
                              Lancer Livraison
                            </button>
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-900 px-2 py-0.5 rounded text-[9px] font-bold uppercase">✓ Validé</span>
                          </>
                        )}
                        {o.status === 'shipped' && (
                          <>
                            <button
                              type="button"
                              id={`sup-deliver-order-${o.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUpdateOrderStatus(o.id, 'delivered');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs text-white rounded-lg transition cursor-pointer"
                            >
                              Livré ✓
                            </button>
                            <span className="bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded text-[9px] font-bold uppercase">🚚 En livraison</span>
                          </>
                        )}
                        {o.status === 'delivered' && (
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-900 px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5">
                            ✓ Livré & encaissé
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALIGNED BUSINESS DIRECTORY */}
        {activeTab === 'businesses' && (
          <div id="supplier-businesses-tab" className="space-y-6">
            <div className="border-b border-slate-800/60 pb-4">
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Réseau d'Entreprises de Proximité</span>
              </h1>
              <p className="text-xs text-slate-400">Découvrez et contactez les entreprises (supermarchés, restaurants, hôtels, secrétariats) présentes sur notre réseau startup pour leur proposer vos matières premières ou services de gros.</p>
            </div>

            <div className="bg-slate-950/50 rounded-2xl border border-slate-850 p-4 space-y-4">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Répertoire B2B Actif ({allBusinesses.length} entreprises)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allBusinesses.map((b) => (
                  <div id={`biz-directory-card-${b.id}`} key={b.id} className="bg-slate-950 border border-slate-855 rounded-xl p-4 hover:border-slate-800 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold bg-indigo-950/50 text-indigo-400 px-2.5 py-0.5 rounded-sm uppercase tracking-wider">
                          🏬 {b.enterpriseType}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {b.id}</span>
                      </div>
                      <h4 className="font-bold text-slate-200 text-sm">{b.name}</h4>
                      <p className="text-xs text-slate-450 mt-1">{b.description}</p>
                    </div>

                    <div className="border-t border-slate-900 pt-3 mt-4 flex flex-col gap-2 text-[11px] text-slate-450">
                      <div className="flex items-center justify-between">
                        <span>📍 {b.address || 'Non spécifié'}</span>
                        {b.phone && (
                          <div className="flex items-center gap-2">
                            <a href={`tel:${b.phone}`} className="hover:text-white flex items-center gap-1 hover:underline">
                              📞 {b.phone}
                            </a>
                            <WhatsAppButton 
                              phone={b.phone} 
                              message={`Bonjour ${b.name}, nous sommes producteur/fournisseur local sur WeLink et serions ravis de collaborer.`} 
                              iconOnly={true} 
                            />
                          </div>
                        )}
                      </div>
                      {b.email && (
                        <div className="flex justify-end pt-1">
                          <a 
                            href={`mailto:${b.email}?subject=Collaboration avec ${user.name} (Fournisseur)&body=Bonjour ${b.name},\n\nNous sommes rattachés à votre espace local sous le nom de "${user.name}". Nous aimerions vous proposer une collaboration pour la fourniture de nos produits de qualité.\n\nCordialement,\n${user.name}`}
                            className="text-xs text-emerald-400 hover:text-emerald-350 hover:underline flex items-center gap-1 font-bold"
                          >
                            ✉️ Écrire un e-mail à l'entreprise
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
