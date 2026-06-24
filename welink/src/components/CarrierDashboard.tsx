import React, { useState } from 'react';
import { 
  Play, 
  MapPin, 
  CheckCircle, 
  Phone, 
  DollarSign, 
  Compass, 
  Package, 
  Navigation, 
  ToggleLeft, 
  ToggleRight, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  Truck,
  AlertCircle,
  FileText,
  Receipt
} from 'lucide-react';
import { Order, UserProfile } from '../types';
import { WeLinkLogoIcon } from './WeLinkLogo';
import { InvoiceModal } from './InvoiceModal';

interface CarrierDashboardProps {
  user: UserProfile & any;
  orders: Order[];
  allUsers: UserProfile[];
  onRefreshState: () => void;
}

export const CarrierDashboard: React.FC<CarrierDashboardProps> = ({
  user,
  orders,
  allUsers,
  onRefreshState,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available');
  const [isAvailable, setIsAvailable] = useState(user.carrierStatus !== 'hors_ligne');
  const [actionSuccess, setActionSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Filter orders
  // 1. Available deliveries are those marked for delivery and unassigned to any carrier yet, and not cancelled/delivered
  const availableDeliveries = orders.filter(
    o => o.serviceType === 'delivery' && 
         (!o.carrierId || o.carrierId === '') && 
         o.status !== 'cancelled' && 
         o.status !== 'delivered'
  );

  // 2. Active assigned deliveries to this carrier
  const myActiveDeliveries = orders.filter(
    o => o.carrierId === user.id && o.status !== 'delivered' && o.status !== 'cancelled'
  );

  // 3. Past completed deliveries
  const myCompletedDeliveries = orders.filter(
    o => o.carrierId === user.id && o.status === 'delivered'
  );

  // Calculated stats
  const deliveryFeeRate = 1500; // Flat fee per delivery
  const totalEarnings = myCompletedDeliveries.reduce((sum, o) => sum + (o.deliveryFee || deliveryFeeRate), 0);

  const toggleAvailability = async () => {
    const nextState = !isAvailable ? 'disponible' : 'hors_ligne';
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierStatus: nextState }),
      });
      if (res.ok) {
        setIsAvailable(!isAvailable);
        onRefreshState();
      }
    } catch (e) {
      console.error('Error toggling availability:', e);
    }
  };

  const handleAcceptDelivery = async (orderId: string) => {
    setErrorMessage('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierId: user.id,
          carrierName: user.name,
          carrierPhone: user.phone || 'Non spécifié',
          deliveryStatus: 'assigned',
          deliveryFee: deliveryFeeRate,
          status: 'shipped' // transition client order to shipped mode immediately
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Impossible d\'accepter la livraison');
      }

      setActionSuccess('Course WeLink Delivery acceptée avec succès ! Équipez-vous et en route.');
      onRefreshState();
      setActiveTab('active');
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleUpdateDeliveryStatus = async (orderId: string, nextStatus: 'picked_up' | 'delivered') => {
    setErrorMessage('');
    setActionSuccess('');
    try {
      const payload: any = {
        deliveryStatus: nextStatus,
      };

      if (nextStatus === 'delivered') {
        payload.status = 'delivered'; // transition standard order status to completed delivered
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur lors du changement de statut');
      }

      // If delivered, we credit the carrier's wallet instantly with deliveryFeeRate (1500 FCFA)
      if (nextStatus === 'delivered') {
        // Let's trigger a wallet credit update for the carrier
        const walletRes = await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount: deliveryFeeRate,
            description: `Rémunération WeLink Delivery - Course de livraison terminée pour l'ID de commande #${orderId.substring(0, 8)}`,
            skipVerification: true
          }),
        });
        if (walletRes.ok) {
          setActionSuccess(`Félicitations ! Course livrée. Votre portefeuille a été crédité de ${deliveryFeeRate} FCFA ! 🎉`);
        } else {
          setActionSuccess('Félicitations ! Course de livraison confirmée livrée chez le client.');
        }
      } else {
        setActionSuccess('Statut mis à jour : vous avez récupéré les colis chez le vendeur !');
      }

      onRefreshState();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 text-slate-100 font-sans">
      
      {/* WeLink Delivery Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-black uppercase">
            <Truck className="w-3.5 h-3.5" />
            <span>WeLink Delivery • Transporteur</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Espace Logistique Mutuelle
          </h1>
          <p className="text-sm text-slate-300">
            Bienvenue, <strong className="text-indigo-400">{user.name}</strong>. Accédez instantanément aux demandes de livraison locales pour augmenter vos gains quotidiens.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-400">
            <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">🛵 Type: <span className="capitalize font-bold text-white">{user.carrierType || 'Moto'}</span></span>
            {user.vehiclePlate && (
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">🪪 Plaque: <span className="font-bold text-white">{user.vehiclePlate}</span></span>
            )}
          </div>
        </div>

        {/* Current status toggle */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-center items-center text-center space-y-2 min-w-[180px] shrink-0">
          <span className="text-[10px] uppercase font-black tracking-wide text-slate-500">Statut Disponibilité</span>
          <button 
            onClick={toggleAvailability}
            className="flex items-center space-x-2 cursor-pointer transition duration-150 transform active:scale-95"
          >
            {isAvailable ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400">EN SERVICE (ACTIF)</span>
                <ToggleRight className="w-10 h-10 text-emerald-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">HORS LIGNE</span>
                <ToggleLeft className="w-10 h-10 text-slate-600" />
              </div>
            )}
          </button>
          <p className="text-[10px] text-slate-400">
            {isAvailable ? "Prêt à être assigné à des livraisons" : "Invisible pour les commerçants"}
          </p>
        </div>
      </div>

      {/* Grid Earnings Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Earnings */}
        <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide block">Gains cumulés</span>
            <span className="text-2xl font-mono font-black text-emerald-400">{totalEarnings.toLocaleString()} FCFA</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Rémunération par course flat : {deliveryFeeRate} FCFA
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Deliveries count */}
        <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide block">Courses Terminées</span>
            <span className="text-2xl font-mono font-black text-indigo-400">{myCompletedDeliveries.length}</span>
            <span className="text-[10px] text-slate-500">Taux de réussite logistique : 100%</span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <CheckCircle2 className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        {/* Active courses count */}
        <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide block">Courses assignées</span>
            <span className="text-2xl font-mono font-black text-amber-500">{myActiveDeliveries.length}</span>
            <span className="text-[10px] text-slate-500">En préparation ou en chemin</span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Notifications Banners */}
      {actionSuccess && (
        <div id="action-success-notification" className="bg-emerald-950/60 border border-emerald-900 p-4 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {errorMessage && (
        <div id="action-error-notification" className="bg-red-950/60 border border-red-900 p-4 rounded-xl text-red-350 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider relative flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'available' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-450 hover:text-slate-300'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Offres Disponibles ({availableDeliveries.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider relative flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'active' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-450 hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Mes Courses Actives ({myActiveDeliveries.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider relative flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'history' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-450 hover:text-slate-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Historique ({myCompletedDeliveries.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'available' && (
          <div className="space-y-4">
            {!isAvailable ? (
              <div className="text-center py-12 bg-slate-950/20 border border-slate-850 rounded-2xl p-6 text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-extrabold text-sm text-slate-400">Vous êtes hors ligne.</p>
                <p className="text-xs">Activez votre disponibilité dans le bandeau ci-dessus pour accéder aux livraisons.</p>
              </div>
            ) : availableDeliveries.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-950/10 border border-slate-900 rounded-2xl p-6">
                Aucune commande n'est actuellement en attente de livreur autour de vous. Les nouvelles demandes apparaîtront instantanément ici.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableDeliveries.map((o) => {
                  const sellerProfile = allUsers.find(u => u.id === o.sellerId);
                  const buyerProfile = allUsers.find(u => u.id === o.buyerId);

                  return (
                    <div id={`available-delivery-${o.id}`} key={o.id} className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-4 shadow-sm hover:border-indigo-900 transition flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded">ID: {o.id.substring(0, 8)}</span>
                          <span className="text-emerald-400 font-mono font-bold text-xs">+{deliveryFeeRate} FCFA</span>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Marchandises à récupérer</span>
                          <p className="text-sm font-extrabold text-white">{o.productTitle} (x{o.quantity})</p>
                        </div>

                        {/* Location details */}
                        <div className="space-y-2.5 pt-2 border-t border-slate-900 text-xs">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-slate-500 font-extrabold text-[9px] uppercase block">Point de Collecte (Vendeur)</span>
                              <strong className="text-slate-205">{o.sellerName}</strong>
                              <p className="text-slate-400 text-[11px] mt-0.5">{sellerProfile?.address || "Adresse vendeur non spécifiée"}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Navigation className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-slate-500 font-extrabold text-[9px] uppercase block">Destination (Acheteur / Client)</span>
                              <strong className="text-slate-205">{o.buyerName}</strong>
                              <p className="text-slate-400 text-[11px] mt-0.5">{o.deliveryAddress || buyerProfile?.address || "Adresse client de proximité"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Course acceptance Action */}
                      <div className="pt-4 flex items-center justify-between border-t border-slate-900 gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceOrder(o)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850/60 text-slate-300 border border-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 shadow"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Devis Pro Forma</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAcceptDelivery(o.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md transition duration-150 transform hover:scale-[1.02] cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" fill="white" />
                          <span>Accepter la livraison 🚚</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-4">
            {myActiveDeliveries.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-950/10 border border-slate-900 rounded-2xl p-6">
                Vous n'avez pas de livraison en cours de transport actuellement.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myActiveDeliveries.map((o) => {
                  const sellerProfile = allUsers.find(u => u.id === o.sellerId);
                  const buyerProfile = allUsers.find(u => u.id === o.buyerId);
                  const statusLabel = o.deliveryStatus === 'picked_up' ? 'En livraison' : 'Assigné';

                  return (
                    <div id={`active-delivery-${o.id}`} key={o.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 shadow flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-900 px-2 py-0.5 rounded">STATUT : {statusLabel}</span>
                          <span className="text-emerald-400 font-mono font-bold text-xs">{deliveryFeeRate} FCFA</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Produit</span>
                          <p className="text-base font-extrabold text-white">{o.productTitle} (x{o.quantity})</p>
                          <p className="text-xs text-slate-400">Total marchandise : {o.price * o.quantity} FCFA</p>
                        </div>

                        {/* Contacts and Locations */}
                        <div className="space-y-4 pt-3 border-t border-slate-900 text-xs text-slate-300">
                          {/* Point de collecte */}
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <div>
                                <span className="text-slate-500 font-extrabold text-[9px] uppercase block">Récupérer chez le Vendeur</span>
                                <strong className="text-white text-sm">{o.sellerName}</strong>
                              </div>
                              <p className="text-slate-400">{sellerProfile?.address || "Adresse non fournie"}</p>
                              {sellerProfile?.phone && (
                                <div className="flex items-center gap-1.5 pt-1">
                                  <a href={`tel:${sellerProfile.phone}`} className="text-indigo-400 hover:underline flex items-center gap-1 font-bold">
                                    <Phone className="w-3 h-3" />
                                    {sellerProfile.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Point de livraison */}
                          <div className="flex items-start gap-2">
                            <Navigation className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <div>
                                <span className="text-slate-500 font-extrabold text-[9px] uppercase block">Livrer à Destination (Client)</span>
                                <strong className="text-white text-sm">{o.buyerName}</strong>
                              </div>
                              <p className="text-slate-400">{o.deliveryAddress || buyerProfile?.address || "Lieu convenu"}</p>
                              {buyerProfile?.phone && (
                                <div className="flex items-center gap-1.5 pt-1">
                                  <a href={`tel:${buyerProfile.phone}`} className="text-violet-400 hover:underline flex items-center gap-1 font-bold">
                                    <Phone className="w-3 h-3" />
                                    {buyerProfile.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Operations update triggers */}
                      <div className="pt-4 border-t border-slate-900 flex flex-wrap gap-2.5 items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceOrder(o)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850/60 text-slate-300 border border-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 shadow"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Voir Facture</span>
                        </button>

                        {o.deliveryStatus !== 'picked_up' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateDeliveryStatus(o.id, 'picked_up')}
                            className="flex-1 bg-indigo-650 hover:bg-indigo-600 font-black text-white px-4 py-2 rounded-xl text-xs shadow cursor-pointer transition flex items-center justify-center gap-1"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Réceptionné chez Marchand</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateDeliveryStatus(o.id, 'delivered')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-black text-white px-4 py-2 rounded-xl text-xs shadow cursor-pointer transition flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Livré chez Client (Terminer)</span>
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

        {activeTab === 'history' && (
          <div className="space-y-4">
            {myCompletedDeliveries.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-950/10 border border-slate-900 rounded-2xl p-6">
                Aucune commande n'a encore été marquée comme livrée dans votre historique logistique.
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wide">Journal des Courses Effectuées</h3>
                </div>
                <div className="divide-y divide-slate-905 overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-350 min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-950 font-bold text-slate-450 uppercase text-[9px] tracking-wider border-b border-slate-850">
                        <th className="p-4">ID Commande</th>
                        <th className="p-4">Désignation</th>
                        <th className="p-4">Vendeur</th>
                        <th className="p-4">Destinataire</th>
                        <th className="p-4 text-right">Rémunération</th>
                        <th className="p-4 text-center">Factures</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-medium bg-slate-950/20">
                      {myCompletedDeliveries.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-900/40">
                          <td className="p-4 font-mono font-bold text-slate-400">#{o.id.substring(0, 8)}</td>
                          <td className="p-4">
                            <span className="font-bold text-slate-200">{o.productTitle}</span>
                            <span className="text-[10px] text-slate-500 block">Qté: {o.quantity}</span>
                          </td>
                          <td className="p-4">{o.sellerName}</td>
                          <td className="p-4">{o.buyerName}</td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-400">+{o.deliveryFee || deliveryFeeRate} FCFA</td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceOrder(o)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-lg text-[10.5px] border border-slate-800 font-bold transition"
                            >
                              Facture PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reusable invoice and devis proforma preview modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          buyer={allUsers.find(u => u.id === selectedInvoiceOrder.buyerId)}
          seller={allUsers.find(u => u.id === selectedInvoiceOrder.sellerId)}
          isOpen={true}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

    </div>
  );
};
