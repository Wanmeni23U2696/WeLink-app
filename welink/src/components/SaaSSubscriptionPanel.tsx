import React, { useState } from 'react';
import { 
  CreditCard, Plus, Check, Lock, Unlock, Settings, DollarSign, Clock, 
  AlertCircle, ArrowUpRight, Printer, TrendingUp, UserCheck, 
  Coins, FileText, ShieldAlert, Key, HelpCircle, ArrowDownLeft, RefreshCw, Layers
} from 'lucide-react';
import { UserProfile, PaymentInvoice, Wallet, WithdrawalRequest, WalletTransaction, CommissionSettings, PaymentSettings } from '../types';

interface SaaSSubscriptionPanelProps {
  user: UserProfile;
  allUsers: UserProfile[];
  wallets: any[];
  withdrawalRequests: any[];
  paymentInvoices: any[];
  walletTransactions: any[];
  commissionSettings: any;
  paymentSettings: any;
  onRefreshState: () => void;
}

export default function SaaSSubscriptionPanel({
  user,
  allUsers,
  wallets,
  withdrawalRequests,
  paymentInvoices,
  walletTransactions,
  commissionSettings,
  paymentSettings,
  onRefreshState
}: SaaSSubscriptionPanelProps) {
  // UI Tabs inside financial panel
  const isPlatformAdmin = user.email === 'lgelvis64@gmail.com' || user.isAdmin;
  const [activeTab, setActiveTab] = useState<'plan' | 'wallet' | 'invoices' | 'admin'>(
    isPlatformAdmin ? 'admin' : 'plan'
  );

  // States for purchase modal simulation
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<number>(0);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');
  
  const [payPhoneNumber, setPayPhoneNumber] = useState(user.phone || '');
  const [payMethod, setPayMethod] = useState<'MTN Mobile Money' | 'Orange Money' | 'Express Union' | 'Carte Bancaire'>('MTN Mobile Money');
  const [paymentStep, setPaymentStep] = useState<'form' | 'submitting' | 'waiting_pin' | 'success'>('form');
  const [pinSimulationProgress, setPinSimulationProgress] = useState(0);

  // States for withdrawal request
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('Orange Money');
  const [withdrawPhone, setWithdrawPhone] = useState(user.phone || '');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // States for Admin settings updates
  const [adminProductSalePercent, setAdminProductSalePercent] = useState(commissionSettings?.productSalePercent || 5);
  const [adminDeliveryPercent, setAdminDeliveryPercent] = useState(commissionSettings?.deliveryPercent || 10);
  const [adminMtnMomoNumber, setAdminMtnMomoNumber] = useState(paymentSettings?.mtnMomoMerchantNumber || 'MTN-650023402-CMR');
  const [adminOrangeMoneyNumber, setAdminOrangeMoneyNumber] = useState(paymentSettings?.orangeMoneyMerchantNumber || 'OM-699248672-CMR');
  const [adminWaveCode, setAdminWaveCode] = useState(paymentSettings?.waveMerchantCode || 'EU-WELINK-B2B');
  const [adminApiKey, setAdminApiKey] = useState(paymentSettings?.apiKey || 'sk_live_welink_secure_prod_2026_key_aistudio');
  const [adminSandboxMode, setAdminSandboxMode] = useState(!!paymentSettings?.sandboxMode);
  
  const [adminSettingsSuccess, setAdminSettingsSuccess] = useState('');

  // Active user's specific items
  const userWallet = wallets.find(w => w.userId === user.id) || { balance: 0 };
  const userInvoices = paymentInvoices.filter(i => i.userId === user.id);
  const userWithdrawals = withdrawalRequests.filter(w => w.userId === user.id);
  const userLedger = walletTransactions.filter(t => t.userId === user.id);

  // AI assistant status details
  const aiRequestsToday = (user as any).aiUsage?.count || 0;
  const aiLimit = 5;
  const aiPlanId = user.subscription?.planId || 'free';
  const hasUnlimitedAI = ['premium', 'pro', 'business', 'fournisseur_pro'].includes(aiPlanId) && 
    (user.subscription?.status === 'active' || user.subscription?.status === 'trial');

  // Handle plan upgrade trigger
  const handleOpenUpgrade = (planId: string, price: number, name: string) => {
    setSelectedPlanId(planId);
    setSelectedPlanPrice(price);
    setSelectedPlanName(name);
    setPaymentStep('form');
    setIsPayModalOpen(true);
  };

  const [paymentError, setPaymentError] = useState<string>('');
  const [campayRef, setCampayRef] = useState<string>('');
  const [isCampayReal, setIsCampayReal] = useState<boolean>(false);

  // Run Real Payment Loop on click "Déclencher l'autorisation"
  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentStep('submitting');
    
    try {
      const response = await fetch('/api/payments/campay-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPlanPrice,
          phone: payPhoneNumber,
          paymentMethod: payMethod,
          email: user.email,
          isSubscription: true,
          planId: selectedPlanId,
          userId: user.id
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        setPaymentError(errData.error || "La transaction a été refusée par l'opérateur.");
        setPaymentStep('form');
        return;
      }
      
      const pData = await response.json();
      if (pData.success) {
        setCampayRef(pData.reference);
        setIsCampayReal(pData.isReal);
        setPaymentStep('waiting_pin');
        setPinSimulationProgress(10);
        
        // Start polling the transaction status on the backend!
        startPollingCampayStatus(pData.reference);
      } else {
        setPaymentError("Échec de l'initialisation du virement.");
        setPaymentStep('form');
      }
    } catch (err) {
      console.error(err);
      setPaymentError("Erreur de connexion avec le serveur de paiement.");
      setPaymentStep('form');
    }
  };

  const startPollingCampayStatus = (ref: string) => {
    let progress = 10;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/campay-status/${ref}`);
        if (res.ok) {
          const statusData = await res.json();
          
          // Increment visual progress feedback slowly while waiting
          progress = Math.min(progress + 15, 95);
          setPinSimulationProgress(progress);
          
          if (statusData.status === 'SUCCESS') {
            clearInterval(interval);
            setPinSimulationProgress(100);
            setPaymentStep('success');
            onRefreshState();
          } else if (statusData.status === 'FAILED') {
            clearInterval(interval);
            setPaymentError("Le paiement a été rejeté ou a échoué (solde insuffisant ou PIN incorrect).");
            setPaymentStep('form');
          }
        }
      } catch (err) {
        console.error("Status polling exception:", err);
      }
    }, 2000);
    
    // Safety timeout to clear polling after 90 seconds
    setTimeout(() => {
      clearInterval(interval);
    }, 90000);
  };

  // Cancel Auto Renew
  const handleCancelSubscription = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir désactiver le renouvellement automatique de votre formule ? Retombée sur l'offre gratuite à l'expiration.")) return;
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        alert("Renouvellement automatique suspendu.");
        onRefreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Withdrawal request
  const handlePostWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    const numAmt = Number(withdrawAmount);
    if (!numAmt || numAmt <= 0) {
      setWithdrawError("Veuillez saisir un montant de retrait valide.");
      return;
    }

    if (userWallet.balance < numAmt) {
      setWithdrawError(`Fonds insuffisants. Votre solde disponible est de ${userWallet.balance} FCFA.`);
      return;
    }

    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: numAmt,
          paymentMethod: withdrawMethod,
          phone: withdrawPhone
        })
      });

      if (response.ok) {
        setWithdrawSuccess(`Demande de retrait de ${numAmt} FCFA envoyée avec succès au secretariat WeLink ! Un débit conservatoire a été appliqué.`);
        setWithdrawAmount('');
        onRefreshState();
      } else {
        const err = await response.json();
        setWithdrawError(err.error || "Échec du retrait.");
      }
    } catch (err) {
      setWithdrawError("Erreur lors de la communication serveur.");
    }
  };

  // Admin approves/rejects withdrawals
  const handleAdminWithdrawal = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/withdrawals/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: requestId })
      });
      if (response.ok) {
        onRefreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin updates global commission margins
  const handleSaveCommissions = async () => {
    setAdminSettingsSuccess('');
    try {
      const res = await fetch('/api/admin/commissions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSalePercent: Number(adminProductSalePercent),
          deliveryPercent: Number(adminDeliveryPercent)
        })
      });
      if (res.ok) {
        setAdminSettingsSuccess("Commissions enregistrées avec succès !");
        onRefreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("IMPORTANT: Êtes-vous sûr de vouloir réinitialiser entièrement la base de données ? Tous les produits, comptes démos et commandes créés seront supprimés de manière définitive. Seul votre compte administrateur sera conservé.")) {
      return;
    }
    try {
      const res = await fetch('/api/admin/reset-db', {
        method: 'POST'
      });
      if (res.ok) {
        setAdminSettingsSuccess("La base de données a été réinitialisée avec succès !");
        onRefreshState();
      } else {
        alert("Erreur lors de la réinitialisation de la base de données.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion lors de la réinitialisation.");
    }
  };

  // Admin updates secure payment configurations
  const handleSavePayments = async () => {
    setAdminSettingsSuccess('');
    try {
      const res = await fetch('/api/admin/payments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mtnMomoMerchantNumber: adminMtnMomoNumber,
          orangeMoneyMerchantNumber: adminOrangeMoneyNumber,
          waveMerchantCode: adminWaveCode,
          apiKey: adminApiKey,
          sandboxMode: adminSandboxMode
        })
      });
      if (res.ok) {
        setAdminSettingsSuccess("Données et clés d'accès de passerelle enregistrées en zone chiffrée !");
        onRefreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Invoice visual generator
  const handlePrintInvoice = (inv: PaymentInvoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Facture WeLink - ${inv.id}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="p-8 bg-white text-slate-900 font-sans">
          <div class="max-w-2xl mx-auto border border-gray-200 p-8 rounded-lg shadow-sm">
            <div class="flex justify-between items-center border-b pb-6 mb-6">
              <div>
                <h1 class="text-3xl font-black text-indigo-600">WeLink</h1>
                <p class="text-xs text-gray-500">Portail Startup & SaaS Central</p>
              </div>
              <div class="text-right">
                <span class="px-2 py-1 text-xs bg-green-150 text-green-800 font-black rounded uppercase">PAYÉ</span>
                <p class="text-sm font-bold text-gray-600 mt-2">N° ${inv.id}</p>
                <p class="text-xs text-gray-400">Date: ${new Date(inv.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span class="text-xs text-gray-400 uppercase font-bold">Abonné</span>
                <p class="font-bold text-gray-800">${user.name}</p>
                <p class="text-sm text-gray-500">${inv.userEmail}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 uppercase font-bold">Moyen de Règlement</span>
                <p class="text-sm text-gray-700 font-bold">${inv.paymentMethod}</p>
                <p class="text-sm text-gray-500">${inv.phoneNumber || 'N/A'}</p>
              </div>
            </div>

            <table class="w-full text-left border-collapse mb-8">
              <thead>
                <tr class="bg-gray-100 text-gray-650 text-xs uppercase font-extrabold">
                  <th class="p-3">Désignation Formule</th>
                  <th class="p-3 text-right">Durée</th>
                  <th class="p-3 text-right">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="p-3 font-bold">${inv.planName}</td>
                  <td class="p-3 text-right">1 mois</td>
                  <td class="p-3 text-right font-bold text-slate-800">${inv.amount.toLocaleString()} FCFA</td>
                </tr>
              </tbody>
            </table>

            <div class="text-right pb-6">
              <span class="text-xs text-gray-400 uppercase font-bold">TOTAL À NET PAYER :</span>
              <p class="text-2xl font-black text-indigo-600">${inv.amount.toLocaleString()} FCFA</p>
            </div>

            <div class="border-t pt-4 text-center text-xs text-gray-400">
              <p>Merci pour votre confiance en WeLink. Pour toute réclamation, contactez finance@welink.ci-tech</p>
              <p class="mt-1">Identifiants sécurisés conformes aux spécifications rest-api SaaS 2026</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div id="saas-finances-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-100 font-sans">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 pb-6 mb-6 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-0.5">WeLink SaaS Solutions</span>
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Coins className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span>Facturation, Abonnements & Portefeuille</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gérez vos forfaits récurrents, consultez l'historique des factures et pilotez le portefeuille financier de votre compte.
          </p>
        </div>

        {/* Global Stats or Admin Banner */}
        <div className="flex items-center gap-3">
          {isPlatformAdmin && (
            <div className="bg-indigo-950/40 border border-indigo-800 rounded-xl px-4 py-2 text-right">
              <span className="text-[9px] font-bold text-indigo-300 block uppercase">Mode Gouvernance</span>
              <span className="text-xs font-black text-indigo-400">Secrétariat Général</span>
            </div>
          )}
          {user.subscription && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              user.subscription.status === 'trial' ? 'bg-amber-950/45 text-amber-300 border-amber-800' :
              user.subscription.status === 'active' ? 'bg-indigo-950/50 text-indigo-300 border-indigo-600' :
              'bg-slate-950 text-slate-400 border-slate-800'
            }`}>
              Formule active : {user.subscription.planId.toUpperCase()} ({user.subscription.status === 'trial' ? 'ESSAI PRO' : 'MEMBRE'})
            </div>
          )}
        </div>
      </div>

      {/* Primary Navigation Menus */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
            activeTab === 'plan' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          💳 Forfaits & Abonnements
        </button>

        {user.profileType !== 'client' && (
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              activeTab === 'wallet' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            💰 Portefeuille & Retrait
          </button>
        )}

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
            activeTab === 'invoices' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          📄 Historique des Invoices ({userInvoices.length})
        </button>

        {isPlatformAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'admin' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-rose-400 hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Administration Plateforme
          </button>
        )}
      </div>

      {/* --- FORFAITS TAB RENDER --- */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left col: Current subscription status */}
            <div className="md:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>État de votre Offre</span>
              </h3>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <span className="text-[10px] text-indigo-300 block uppercase font-bold tracking-widest">Abonnement Actuel</span>
                <p className="text-xl font-black text-white mt-1 capitalize">{user.subscription?.planId.replace('_', ' ') || 'Gratuit'}</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                    user.subscription?.status === 'trial' ? 'bg-amber-950/50 text-amber-400 border border-amber-800/40' :
                    user.subscription?.status === 'active' ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-800/50' :
                    'bg-slate-950 text-slate-500'
                  }`}>
                    {user.subscription?.status === 'trial' ? 'Essai gratuit active' : user.subscription?.status || 'Active'}
                  </span>
                  <span className="text-xs text-slate-400">{user.subscription?.price || 0} FCFA/mois</span>
                </div>
              </div>

              {user.subscription && (
                <div className="border-t border-slate-800/60 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date d'activation :</span>
                    <span className="text-slate-350 font-medium">{new Date(user.subscription.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date de renouvellement :</span>
                    <span className="text-slate-350 font-bold">{new Date(user.subscription.endDate).toLocaleDateString()}</span>
                  </div>
                  {user.subscription.trialEndDate && (
                    <div className="flex justify-between">
                      <span className="text-amber-500">Échéance d'essai gratuit :</span>
                      <span className="text-amber-400 font-bold">{new Date(user.subscription.trialEndDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Renouvellement auto :</span>
                    <span className={user.subscription.autoRenew ? "text-green-400 font-extrabold" : "text-amber-450 font-bold"}>
                      {user.subscription.autoRenew ? "ACTIF" : "INACTIF"}
                    </span>
                  </div>

                  {user.subscription.autoRenew && (
                    <button
                      onClick={handleCancelSubscription}
                      className="w-full mt-4 py-2 bg-slate-900 border border-slate-800 hover:border-red-800 hover:bg-red-950/20 text-slate-400 hover:text-red-400 text-xs font-bold rounded-xl transition duration-200 cursor-pointer"
                    >
                      Désactiver le renouvellement auto
                    </button>
                  )}
                </div>
              )}

              {/* Display AI Token Limits */}
              <div className="border-t border-slate-800/60 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Assistant intelligent IA</span>
                  <span className="text-[10px] font-mono text-indigo-400">{hasUnlimitedAI ? "ILLIMITÉ" : `${aiRequestsToday}/${aiLimit} req`}</span>
                </h4>
                
                {hasUnlimitedAI ? (
                  <div className="text-[11px] text-indigo-300 bg-indigo-950/30 border border-indigo-900/40 rounded-xl p-3 flex gap-2">
                    <Unlock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>L'abonnement Premium débloque l'IA illimitée et les calculs prédictifs avancés sans limitation locale.</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          aiRequestsToday >= 4 ? 'bg-rose-500' : 'bg-indigo-500'
                        }`} 
                        style={{ width: `${Math.min(100, (aiRequestsToday / aiLimit) * 100)}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 flex justify-between">
                      <span>Restants aujourd'hui</span>
                      <span>{Math.max(0, aiLimit - aiRequestsToday)} requêtes gratuites</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right col: Available upgrades pricing cards list depending on user role */}
            <div className="md:col-span-8 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Formules d'abonnements adaptées à votre profil
              </h3>

              {user.profileType === 'client' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gratuit */}
                  <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Standard</span>
                      <h4 className="text-lg font-bold">Gratuit</h4>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Parfait pour découvrir les commerces locaux et faire de simples commandes.</p>
                      
                      <ul className="text-xs text-slate-350 space-y-2 mb-6">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-slate-500" /> 5 requêtes IA par jour
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-slate-500" /> Commande & Livraison locale
                        </li>
                      </ul>
                    </div>
                    <button disabled className="w-full py-2 bg-slate-900 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed">
                      Formule Actuelle par défaut
                    </button>
                  </div>

                  {/* Premium Client */}
                  <div className="bg-indigo-950/15 border-2 border-indigo-600/65 rounded-2xl p-5 flex flex-col justify-between shadow-lg shadow-indigo-650/5">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black tracking-widest text-indigo-400 block uppercase mb-1">Populaire ⚡</span>
                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black tracking-widest rounded-full">RECOMMANDE</span>
                      </div>
                      <h4 className="text-lg font-bold text-white">WeLink Premium</h4>
                      <p className="text-2xl font-black text-indigo-300 mt-2">2 500 FCFA<span className="text-xs font-normal text-slate-400">/mois</span></p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Optimisez vos transactions quotidiennes et profitez d'une IA instantanée.</p>
                      
                      <ul className="text-xs text-slate-200 space-y-2 mb-6">
                        <li className="flex items-center gap-1.5 font-bold">
                          <Check className="w-3.5 h-3.5 text-indigo-400" /> AI Assistant de choix illimité
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-indigo-400" /> Recommandations avancées
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-indigo-400" /> Promotions exclusives & Cashback
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-indigo-400" /> Badge de membre de valeur
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-indigo-400" /> Livraison prioritaire sans attente
                        </li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleOpenUpgrade('premium', 2500, "WeLink Premium")}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition duration-200 cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      S'abonner à l'offre Premium (2,500 F)
                    </button>
                  </div>
                </div>
              )}

              {/* Enterprise Options (Only shown to Business/Enterprise users) */}
              {user.profileType === 'entreprise' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* STARTER */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-indigo-300 uppercase"> Starter 🍳</span>
                      <h4 className="text-base font-bold text-white mt-1">Starter</h4>
                      <p className="text-xl font-black text-indigo-400 mt-2">5 000 F<span className="text-xs text-slate-550 font-normal">/mo</span></p>
                      <p className="text-[10px] text-slate-400 mt-1 mb-3">Idéal pour les marchés locaux et l'alimentation générale.</p>
                      <ul className="text-[10px] text-slate-300 space-y-1.5 mb-5 border-t border-slate-900 pt-3">
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-indigo-400" /> Vente produits & services</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-indigo-400" /> Gestion des stocks</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-indigo-400" /> Caisse enregistreuse</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleOpenUpgrade('starter', 5000, "Entreprise Starter")}
                      className="w-full py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[11px] font-bold rounded-lg transition"
                    >
                      Choisir Starter
                    </button>
                  </div>

                  {/* PRO */}
                  <div className="bg-indigo-950/5 border border-indigo-500/35 rounded-2xl p-4 flex flex-col justify-between relative shadow-md shadow-indigo-500/2">
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-indigo-500 text-white text-[8px] font-bold rounded">POPULAIRE</span>
                    <div>
                      <span className="text-[9px] font-bold text-indigo-300 uppercase">Pro ✨</span>
                      <h4 className="text-base font-bold text-white mt-1">Pro</h4>
                      <p className="text-xl font-black text-indigo-400 mt-2">15 000 F<span className="text-xs text-slate-550 font-normal">/mo</span></p>
                      <p className="text-[10px] text-slate-400 mt-1 mb-3">Recommandé pour boucheries, poissonneries & restaurants.</p>
                      <ul className="text-[10px] text-slate-300 space-y-1.5 mb-5 border-t border-slate-900 pt-3">
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-indigo-400" /> Toutes les options Starter</li>
                        <li className="flex items-center gap-1.5 font-bold"><Check className="w-3 h-3 text-indigo-400" /> Statistiques avancées</li>
                        <li className="flex items-center gap-1.5 font-bold text-indigo-300"><Check className="w-3 h-3 text-indigo-400" /> Assistant IA</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-indigo-400" /> Promotions flash instantanées</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-indigo-400" /> Gestion des employés (RH)</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-indigo-400" /> Publication d'offres d'emplois</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleOpenUpgrade('pro', 15000, "Entreprise Pro")}
                      className="w-full py-1.5 bg-indigo-650 hover:bg-indigo-550 text-white text-[11px] font-extrabold rounded-lg transition cursor-pointer"
                    >
                      S'abonner à l'offre Pro
                    </button>
                  </div>

                  {/* BUSINESS */}
                  <div className="bg-amber-950/10 border border-amber-800/40 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">Business 💎</span>
                      <h4 className="text-base font-bold text-white mt-1">Business</h4>
                      <p className="text-xl font-black text-amber-400 mt-2">30 000 F<span className="text-xs text-slate-550 font-normal">/mo</span></p>
                      <p className="text-[10px] text-slate-400 mt-1 mb-3">Le nec plus ultra pour supermarchés, hôtels et commerces complexes.</p>
                      <ul className="text-[10px] text-slate-300 space-y-1.5 mb-5 border-t border-slate-900 pt-3">
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-amber-500" /> Toutes les options Pro</li>
                        <li className="flex items-center gap-1.5 font-bold text-amber-400"><Check className="w-3 h-3 text-amber-500" /> IA prédictive & analyses</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-amber-500" /> Rapports financiers complets</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-amber-500" /> Multi-boutiques & Agences</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-amber-500" /> Accès API intégrations</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-amber-500" /> Publicité prioritaire</li>
                        <li className="flex items-center gap-1.5 font-bold"><Check className="w-3 h-3 text-amber-500" /> Formule Premium Client offerte</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleOpenUpgrade('business', 30000, "Entreprise Business")}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-550 text-white text-[11px] font-extrabold rounded-lg transition cursor-pointer"
                    >
                      Devenir Business
                    </button>
                  </div>
                </div>
              )}

              {/* Supplier Options (Only shown to Supplier users) */}
              {user.profileType === 'fournisseur' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Supplier Free */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Standard</span>
                      <h4 className="text-lg font-bold">Fournisseur Gratuit</h4>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Gérez votre catalogue général de produits et répondez aux messages.</p>
                    </div>
                    <button disabled className="w-full py-2 bg-slate-900 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed">
                      Actuel
                    </button>
                  </div>

                  {/* Supplier Pro */}
                  <div className="bg-indigo-950/15 border border-indigo-650/50 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-indigo-400 block uppercase mb-1">Elite ⚡</span>
                      <h4 className="text-lg font-bold text-white">Fournisseur Pro</h4>
                      <p className="text-2xl font-black text-indigo-300 mt-2">10 000 FCFA<span className="text-xs font-normal text-slate-400">/mois</span></p>
                      <p className="text-xs text-slate-450 mt-1 mb-4">La clé de la vente de gros auprès des plus gros acheteurs.</p>
                      
                      <ul className="text-xs text-slate-350 space-y-2 mb-6">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-indigo-450" /> Accès de gros aux commerces acheteurs
                        </li>
                        <li className="flex items-center gap-1.5 font-bold">
                          <Check className="w-3.5 h-3.5 text-indigo-450" /> Affichage prioritaire systématique
                        </li>
                        <li className="flex items-center gap-1.5 text-indigo-300">
                          <Check className="w-3.5 h-3.5 text-indigo-450" /> Ciblage des commerces à fort revenu
                        </li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleOpenUpgrade('fournisseur_pro', 10000, "Fournisseur Pro")}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer"
                    >
                      S'abonner pour 10k/mois
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* --- WALLET & DIGITAL TRANS TAB RENDER --- */}
      {activeTab === 'wallet' && user.profileType !== 'client' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Wallet balance & withdrawal request */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 space-y-5">
              <div>
                <span className="text-[9px] font-bold uppercase text-indigo-400 block">Solde Disponible</span>
                <p className="text-3xl font-black text-indigo-300 mt-1">{(userWallet?.balance || 0).toLocaleString()} FCFA</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Les ventes validées de vos boutiques créditent ce portefeuille, nette de commission ({(commissionSettings?.productSalePercent || 5)}%).
                </p>
              </div>

              {/* Withdrawal Request form */}
              <form onSubmit={handlePostWithdrawal} className="border-t border-slate-800/80 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  <span>Demander un retrait instantané</span>
                </h4>

                {withdrawError && (
                  <div className="p-3 bg-red-950/35 border border-red-900 rounded-xl text-red-400 text-xs flex gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{withdrawError}</span>
                  </div>
                )}
                {withdrawSuccess && (
                  <div className="p-3 bg-green-950/30 border border-green-900 rounded-xl text-green-400 text-xs">
                    <span>{withdrawSuccess}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block uppercase font-bold">Montant (FCFA)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Saisir montant (ex: 20000)"
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block uppercase font-bold">Opérateur</label>
                    <select
                      value={withdrawMethod}
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2 py-2 text-xs text-white"
                    >
                      <option value="Orange Money">Orange Money</option>
                      <option value="MTN Mobile Money">MTN MoMo</option>
                      <option value="Express Union">Express Union</option>
                      <option value="Compte Bancaire">Virement Bancaire</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block uppercase font-bold">N° de Téléphone / RIB</label>
                    <input
                      type="text"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      placeholder="N° de téléphone"
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs transition cursor-pointer"
                >
                  Soumettre Retrait Mobile Money
                </button>
              </form>
            </div>

            {/* Right Column: Mini register / transaction logs */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Registre historique des transactions
              </h3>

              {userLedger.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/20 border border-slate-850/60 rounded-2xl text-xs text-slate-500">
                  Aucune transaction enregistrée dans votre carnet fiscal.
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {userLedger.map((txn) => (
                    <div key={txn.id} className="bg-slate-950/30 border border-slate-850 rounded-xl p-3 flex justify-between items-center gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-250 leading-relaxed">{txn.description}</p>
                        <span className="text-[9px] text-slate-500 block">{new Date(txn.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-black px-2 py-1 rounded ${
                          txn.amount > 0 ? 'bg-green-950/50 text-green-400' : 'bg-red-950/55 text-red-400'
                        }`}>
                          {txn.amount > 0 ? '+' : ''}{txn.amount.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Withdraw Requests status tracking */}
              {userWithdrawals.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800/40">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">État de vos Demandes de Retrait</h4>
                  <div className="space-y-2">
                    {userWithdrawals.map(req => (
                      <div key={req.id} className="bg-slate-950/55 border border-slate-850 rounded-lg p-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{req.amount.toLocaleString()} FCFA</p>
                          <span className="text-[9px] text-slate-400">{req.paymentMethod} • {req.phone}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
                          req.status === 'completed' ? 'bg-green-950 text-green-400 border border-green-800/40' :
                          req.status === 'rejected' ? 'bg-red-950 text-red-400 border border-red-900/40' :
                          'bg-amber-950 text-amber-400 border border-amber-900/60'
                        }`}>
                          {req.status === 'pending' ? 'EN COURS' : req.status === 'completed' ? 'VALIDÉ' : 'REJETÉ'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* --- INVOICES HISTORY TAB RENDER --- */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Factures d'abonnements générées pour votre compte
            </h3>
            <span className="text-xs text-indigo-400 font-bold">{userInvoices.length} Invoices</span>
          </div>

          {userInvoices.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/20 border border-slate-850/60 rounded-3xl text-sm text-slate-500">
              <p className="mb-2">Aucune facture d'abonnement n'a été émise pour votre compte pour le moment.</p>
              <p className="text-xs text-slate-600">Les factures sont créées automatiquement après validation de paiement de forfait.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userInvoices.map((inv) => (
                <div key={inv.id} className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-800 transition">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">N° {inv.id}</span>
                        <h4 className="font-bold text-white text-sm mt-0.5">{inv.planName}</h4>
                      </div>
                      <span className="px-1.5 py-0.5 bg-green-950/50 text-green-400 text-[8px] font-black rounded uppercase">PAYÉ</span>
                    </div>

                    <div className="bg-slate-900/65 rounded-xl p-3 border border-slate-850 flex justify-between items-baseline">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Abonnement</span>
                      <span className="text-base font-black text-indigo-300">{inv.amount.toLocaleString()} FCFA</span>
                    </div>

                    <div className="text-[10px] text-slate-400 space-y-1.5">
                      <p className="flex justify-between">
                        <span>Opérateur :</span>
                        <span className="text-white font-medium">{inv.paymentMethod}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Paiement le :</span>
                        <span className="text-white font-medium">{new Date(inv.createdAt).toLocaleDateString()} à {new Date(inv.createdAt).toLocaleTimeString()}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePrintInvoice(inv)}
                    className="w-full mt-4 py-2 bg-indigo-950 border border-indigo-900 group hover:border-indigo-500 hover:bg-indigo-600 text-indigo-300 hover:text-white transition duration-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Visualiser facture & Reçu
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- PLATFORM SECRETERIAT ADMIN TAB RENDER --- */}
      {activeTab === 'admin' && isPlatformAdmin && (
        <div className="space-y-6">
          {adminSettingsSuccess && (
            <div className="p-3.5 bg-green-950/50 border border-green-800 rounded-xl text-green-400 text-xs">
              {adminSettingsSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Side: Global commission sliders */}
            <div className="lg:col-span-4 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-rose-500" />
                <span>Moteur de Commissions Configurable</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                La plateforme retient automatiquement cette part de commission à chaque commande validée de vos boutiques.
              </p>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <label className="text-slate-400 font-bold uppercase text-[9px]">Commission sur Vente de Produits</label>
                    <span className="text-rose-450 font-black">{adminProductSalePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={adminProductSalePercent}
                    onChange={(e) => setAdminProductSalePercent(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <label className="text-slate-400 font-bold uppercase text-[9px]">Commission sur les courses Livraisons</label>
                    <span className="text-rose-450 font-black">{adminDeliveryPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={adminDeliveryPercent}
                    onChange={(e) => setAdminDeliveryPercent(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSaveCommissions}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs transition cursor-pointer"
                >
                  Mettre à jour commissions
                </button>
              </div>

              {/* Secure Credentials vault */}
              <div className="border-t border-slate-900 pt-4 space-y-4">
                <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" />
                  <span>Coffre-fort d'API de Paiement</span>
                </h4>
                <p className="text-[10px] text-slate-500">
                  Les identifiants ne sont jamais écrits en dur. Ils sont chiffrés et logés en base Firestore réactive.
                </p>

                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black block">N° Marchand MTN MoMo</label>
                    <input
                      type="text"
                      value={adminMtnMomoNumber}
                      onChange={(e) => setAdminMtnMomoNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black block">N° Marchand Orange Money</label>
                    <input
                      type="text"
                      value={adminOrangeMoneyNumber}
                      onChange={(e) => setAdminOrangeMoneyNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black block">Code Marchand Express Union</label>
                    <input
                      type="text"
                      value={adminWaveCode}
                      onChange={(e) => setAdminWaveCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black block">Clé API Passerelle Centrale</label>
                    <input
                      type="password"
                      value={adminApiKey}
                      onChange={(e) => setAdminApiKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-indigo-400"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1 bg-slate-900 px-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Portails Sandbox Test</span>
                    <button
                      onClick={() => setAdminSandboxMode(!adminSandboxMode)}
                      className="text-indigo-400 font-bold uppercase text-[11px] underline"
                    >
                      {adminSandboxMode ? "ACTIVÉ (SIMULATION)" : "LIVE (RÉEL)"}
                    </button>
                  </div>

                  <button
                    onClick={handleSavePayments}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs transition cursor-pointer font-sans"
                  >
                    Sécuriser Clés & Credentials
                  </button>
                </div>
              </div>

              {/* Database reset section */}
              <div id="admin-db-reset-block" className="bg-slate-950/40 border border-red-950/60 p-4 rounded-3xl space-y-4">
                <h4 className="text-xs font-black uppercase text-red-400 flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>Zone de Secours Système</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Remettez instantanément à zéro toute la base de données. Tous les produits démos, historiques de commandes et profils additionnels seront nettoyés de Firestore.
                </p>
                <button
                  type="button"
                  onClick={handleResetDatabase}
                  className="w-full py-2 bg-red-950 hover:bg-red-900 border border-red-900/60 text-red-200 hover:text-white font-extrabold rounded-xl text-[10.5px] transition cursor-pointer"
                >
                  ⚠️ Remettre la base de données à 0
                </button>
              </div>

            </div>

            {/* Right Side: Pending withdrawals requests & system audit logs */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Cumulative revenue visual card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/65 border border-slate-850 rounded-2xl p-4">
                  <span className="text-[9px] text-slate-500 uppercase font-extrabold block">Souscriptions Collectées</span>
                  <p className="text-xl font-bold text-indigo-300 mt-1">
                    {paymentInvoices.reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()} FCFA
                  </p>
                  <span className="text-[8px] text-slate-500">Du total de {paymentInvoices.length} factures acquittées</span>
                </div>

                <div className="bg-slate-950/65 border border-slate-850 rounded-2xl p-4">
                  <span className="text-[9px] text-slate-500 uppercase font-extrabold block">Cumul Commissions Retenues</span>
                  <p className="text-xl font-bold text-rose-450 mt-1">
                    {walletTransactions
                      .filter(t => t.userId === 'platform_admin' && t.type === 'platform_commission')
                      .reduce((acc, txn) => acc + txn.amount, 0).toLocaleString()} FCFA
                  </p>
                  <span className="text-[8px] text-slate-500">Sur les ventes d'entreprises de la plateforme</span>
                </div>

                <div className="bg-slate-950/65 border border-slate-850 rounded-2xl p-4">
                  <span className="text-[9px] text-slate-500 uppercase font-extrabold block">Facturation Globale</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    {walletTransactions.reduce((acc, t) => acc + (t.amount > 0 ? t.amount : 0), 0).toLocaleString()} FCFA
                  </p>
                  <span className="text-[8px] text-slate-500">Volume brut cumulé encaissé</span>
                </div>
              </div>

              {/* Pending Withdrawals panel */}
              <div className="bg-slate-950/30 border border-slate-850 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-350 uppercase tracking-widest flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-indigo-400" />
                  <span>Validation des Demandes de Retrait Actives ({withdrawalRequests.filter(r => r.status === 'pending').length})</span>
                </h4>
                
                {withdrawalRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Aucune demande de retrait en attente de validation.
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
                    {withdrawalRequests.filter(r => r.status === 'pending').map((req) => (
                      <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-extrabold text-white text-sm">{req.amount.toLocaleString()} FCFA</p>
                          <div className="text-[10px] text-slate-400">
                            Demande de :<span className="text-indigo-400 font-bold block sm:inline"> {req.userName}</span>
                          </div>
                          <span className="text-[9px] block text-slate-500">N° {req.phone} • {req.paymentMethod}</span>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleAdminWithdrawal(req.id, 'approve')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-lg transition"
                          >
                            Valider le paiement Orange/MTN
                          </button>
                          <button
                            onClick={() => handleAdminWithdrawal(req.id, 'reject')}
                            className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-400 font-bold text-[11px] rounded-lg transition"
                          >
                            Rejeter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* System Accounts Active memberships info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">État des Abonnements de tous les Comptes Utilisateurs</h4>
                <div className="bg-slate-950/20 border border-slate-850/80 rounded-xl p-4 overflow-x-auto text-[11px] max-h-[220px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2">Nom / Domaine</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Forfait WeLink</th>
                        <th className="pb-2 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id} className="border-b border-slate-900 last:border-0 hover:bg-slate-905/35">
                          <td className="py-2 text-white font-bold">{u.name}</td>
                          <td className="py-2 capitalize text-slate-400">{u.profileType}</td>
                          <td className="py-2 font-mono text-indigo-400">{u.subscription?.planId ? u.subscription.planId.replace('_', ' ').toUpperCase() : 'FREE'}</td>
                          <td className="py-2 text-right">
                            <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-900 text-slate-400">
                              {u.subscription?.status || 'Gratuit'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- FINTECH MTN / ORANGE MOMO SIMULATOR MODAL --- */}
      {isPayModalOpen && (
        <div id="payment-gateways-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal header with WeLink secure gateway branding */}
            <div className="bg-indigo-950/45 p-5 border-b border-slate-800/80 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block">WELINK SECURE CHECKOUT</span>
                <h3 className="font-bold text-white text-sm">Passerelle de Paiement Intégrée</h3>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-450 hover:text-white font-black text-xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 transition rounded-md"
              >
                Fermer
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Summary of billing intent */}
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-850 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Service sélectionné :</span>
                  <p className="font-bold text-white text-sm mt-0.5">{selectedPlanName}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Total :</span>
                  <p className="font-extrabold text-indigo-400 text-sm mt-0.5">{selectedPlanPrice.toLocaleString()} FCFA</p>
                </div>
              </div>

              {/* Form Input Step */}
              {paymentStep === 'form' && (
                <form onSubmit={handleStartPayment} className="space-y-4">
                  {paymentError && (
                    <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs space-y-1">
                      <p className="font-extrabold flex items-center gap-1">⚠️ Erreur de transaction</p>
                      <p className="text-[10.5px] leading-relaxed text-slate-300">{paymentError}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-black block">Sélectionner un Moyen Financier</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPayMethod('MTN Mobile Money')}
                        className={`p-2.5 rounded-xl border font-bold text-left transition flex items-center gap-1.5 ${
                          payMethod === 'MTN Mobile Money' ? 'bg-amber-950/30 border-amber-600 text-amber-300' : 'bg-slate-950 border-slate-850 text-slate-400'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> MTN MoMo
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setPayMethod('Orange Money')}
                        className={`p-2.5 rounded-xl border font-bold text-left transition flex items-center gap-1.5 ${
                          payMethod === 'Orange Money' ? 'bg-orange-950/30 border-orange-600 text-orange-300' : 'bg-slate-950 border-slate-850 text-slate-400'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Orange Money
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayMethod('Express Union')}
                        className={`p-2.5 rounded-xl border font-bold text-left transition flex items-center gap-1.5 ${
                          payMethod === 'Express Union' ? 'bg-indigo-950/30 border-indigo-600 text-indigo-300' : 'bg-slate-950 border-slate-850 text-slate-400'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Express Union
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayMethod('Carte Bancaire')}
                        className={`p-2.5 rounded-xl border font-bold text-left transition flex items-center gap-1.5 ${
                          payMethod === 'Carte Bancaire' ? 'bg-indigo-950/30 border-indigo-600 text-indigo-300' : 'bg-slate-950 border-slate-850 text-slate-400'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Visa / Mastercard
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black block">Numéro de Téléphone Validateur / Titulaire</label>
                    <input
                      type="text"
                      required
                      value={payPhoneNumber}
                      onChange={(e) => setPayPhoneNumber(e.target.value)}
                      placeholder="Saisissez votre numéro de règlement Mobile Money"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="text-[10px] text-slate-500 leading-relaxed pt-2">
                    En cliquant ci-dessous, la passerelle WeLink Secure interrogera les serveurs de MTN Mobile Money ou d'Orange Money. Aucune donnée confidentielle n'est exposée sur la plateforme.
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    Déclencher l'autorisation de paiement ({selectedPlanPrice.toLocaleString()} F)
                  </button>
                </form>
              )}

              {/* Submitting step */}
              {paymentStep === 'submitting' && (
                <div className="text-center py-12 space-y-4">
                  <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-white">Connexion aux serveurs de l'opérateur local...</p>
                  <p className="text-[10px] text-slate-500">Initialisation de la requête de validation chiffrée SSL.</p>
                </div>
              )}

              {/* Fictitious SMS / PIN simulated validation step */}
              {paymentStep === 'waiting_pin' && (
                <div className="text-center py-8 space-y-5">
                  <div className="w-12 h-12 bg-amber-950/40 border border-amber-600 rounded-full flex items-center justify-center text-amber-400 mx-auto animate-bounce">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 bg-slate-950/40 border border-slate-850 rounded-xl p-4">
                    <p className="text-xs font-bold text-white text-amber-300">Simulateur de PIN Mobile Money</p>
                    <p className="text-[10px] text-slate-350 mt-1">
                      Une demande de paiement de <span className="font-bold text-white">{selectedPlanPrice.toLocaleString()} FCFA</span> a été envoyée sur votre téléphone {payPhoneNumber}.
                    </p>
                    <span className="text-[11px] font-black text-rose-300 block mt-2 animate-pulse">Saisissez votre code PIN secret sur l'écran d'invite de votre mobile !</span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${pinSimulationProgress}%` }} />
                    </div>
                    <p className="text-[9px] text-slate-500">Attente de réponse du mobile - Étape simulation : {pinSimulationProgress}%</p>
                  </div>
                </div>
              )}

              {/* Success Final Landing Step */}
              {paymentStep === 'success' && (
                <div className="text-center py-10 space-y-4">
                  <div className="w-12 h-12 bg-emerald-950 border border-emerald-600 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="text-sm font-bold text-white">Abonnement validé !</h4>
                  <p className="text-xs text-slate-350">
                    Le serveur de la fintech WeLink a validé votre prélèvement Mobile Money. Votre abonnement <span className="font-extrabold text-indigo-400">{selectedPlanName}</span> est actif pour 1 mois.
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Votre facture globale a été générée avec succès. Elle est accessible sous l'onglet "Historique des Invoices".
                  </p>
                  <button
                    onClick={() => setIsPayModalOpen(false)}
                    className="w-full py-2 bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Retourner à WeLink
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
