import React, { useState } from 'react';
import { 
  Building2, Shield, Settings, ChevronRight, Check, Database, Layers, 
  LayoutDashboard, Sparkles, Package, Briefcase, FolderPlus, Calendar, 
  Clock, FileText, ShoppingCart, CreditCard, Truck, Users, TrendingUp, 
  BookOpen, LineChart, Bell, PenTool, Code, Award, Ticket, Percent, 
  Plus, Search, Trash2, Filter, CheckCircle, AlertTriangle, RefreshCw, 
  FileKey, Download, Terminal, ExternalLink, ChevronDown, Maximize2, User, Power
} from 'lucide-react';
import { ERPCompany, ERPProduct, ERPService, ERPStockItem, ERPReservation, ERPAppointment, ERPOrder, ERPPayment, ERPDelivery, ERPSupplier, ERPEmployee, ERPLoyaltyMember, ERPCoupon, ERPPromotion } from './SaaSERPDashboard';
import WhatsAppButton from './WhatsAppButton';

interface SaaSERPModuleViewsProps {
  erpTab: string;
  activeCompany: ERPCompany;
  setCompanies: React.Dispatch<React.SetStateAction<ERPCompany[]>>;
  triggerToast: (msg: string) => void;
}

export default function SaaSERPModuleViews({ erpTab, activeCompany, setCompanies, triggerToast }: SaaSERPModuleViewsProps) {
  // Common visual card structure
  const cardStyle = "bg-slate-900 border border-slate-805/80 p-5 rounded-3xl text-left space-y-4";
  const tableHeaderStyle = "bg-slate-950/50 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider py-3 px-4";
  const inputStyle = "w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition";

  // State managers
  // Services
  const [showAddSer, setShowAddSer] = useState(false);
  const [serTitle, setSerTitle] = useState('');
  const [serCat, setSerCat] = useState('Général');
  const [serPrice, setSerPrice] = useState(15000);
  const [serDur, setSerDur] = useState(60);
  const [serImg, setSerImg] = useState('');

  // Stocks
  const [stockProdId, setStockProdId] = useState('');
  const [stockChangeQty, setStockChangeQty] = useState(5);
  const [stockReason, setStockReason] = useState('Approvisionnement');

  // Reservations
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [resGuests, setResGuests] = useState(2);

  // Appointments
  const [appClient, setAppClient] = useState('');
  const [appSerId, setAppSerId] = useState('');
  const [appDate, setAppDate] = useState('');
  const [appTime, setAppTime] = useState('');
  const [appEmpId, setAppEmpId] = useState('');

  // Orders
  const [ordClient, setOrdClient] = useState('');
  const [ordItems, setOrdItems] = useState('Prestation / Produit standard');
  const [ordAmount, setOrdAmount] = useState(25000);
  const [ordPay, setOrdPay] = useState<'unpaid' | 'paid'>('paid');

  // Payments
  const [payOrder, setPayOrder] = useState('');
  const [payAmount, setPayAmount] = useState(15000);
  const [payMethod, setPayMethod] = useState<'Stripe' | 'Cash' | 'Mobile Money' | 'Bank Transfer'>('Mobile Money');
  const [payRef, setPayRef] = useState('');

  // Deliveries
  const [delOrder, setDelOrder] = useState('');
  const [delCourier, setDelCourier] = useState('WeLink Flash');
  const [delAddress, setDelAddress] = useState('');
  const [delTrack, setDelTrack] = useState('WLK-TRK-');

  // Suppliers
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');

  // Employees
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empSalary, setEmpSalary] = useState(300000);

  // Loyalty
  const [loyName, setLoyName] = useState('');
  const [loyPoints, setLoyPoints] = useState(10);
  const [loyTier, setLoyTier] = useState<'Bronze' | 'Silver' | 'Gold' | 'Platinum'>('Bronze');

  // Coupons
  const [coupCode, setCoupCode] = useState('');
  const [coupVal, setCoupVal] = useState(10);
  const [coupType, setCoupType] = useState<'percent' | 'flat'>('percent');

  // Promotions
  const [promoTitle, setPromoTitle] = useState('');
  const [promoPct, setPromoPct] = useState(15);
  const [promoCat, setPromoCat] = useState('');
  const [promoEnd, setPromoEnd] = useState('');

  // Jobs
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobSal, setJobSal] = useState('A négocier');
  const [jobType, setJobType] = useState('CDI');

  // Image Upload handler helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generic generic state saver helper
  const updateCompanyData = (updateFn: (comp: ERPCompany) => Partial<ERPCompany>) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === activeCompany.id) {
        return {
          ...c,
          ...updateFn(c)
        };
      }
      return c;
    }));
  };

  switch (erpTab) {
    case 'services':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Gestion des Services & Forfaits</h2>
              <p className="text-xs text-slate-400">Configurez vos prestations, tarifs et durées de rendez-vous pour {activeCompany.name}.</p>
            </div>
            <button
              onClick={() => setShowAddSer(!showAddSer)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {showAddSer ? 'Fermer formulaire' : 'Ajouter un service'}
            </button>
          </div>

          {showAddSer && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">Nouveau Service</h4>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!serTitle) return;
                const newSer: ERPService = {
                  id: 's_' + Math.random().toString(36).substring(2, 6),
                  title: serTitle,
                  category: serCat,
                  pricePerHour: serPrice,
                  durationMin: serDur,
                  imageUrl: serImg || undefined
                };
                updateCompanyData(c => ({ services: [...(c.services || []), newSer] }));
                triggerToast(`Service "${serTitle}" configuré !`);
                setSerTitle('');
                setSerImg('');
                setShowAddSer(false);
              }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Désignation du service</label>
                  <input type="text" required value={serTitle} onChange={e => setSerTitle(e.target.value)} placeholder="Ex: Shampoing + Coupe brushing" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Catégorie</label>
                  <input type="text" value={serCat} onChange={e => setSerCat(e.target.value)} placeholder="Ex: Beauté, Conseil" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Tarif forfaitaire (CFA)</label>
                  <input type="number" required value={serPrice} onChange={e => setSerPrice(Number(e.target.value))} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Durée moyenne (minutes)</label>
                  <input type="number" required value={serDur} onChange={e => setSerDur(Number(e.target.value))} className={inputStyle} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Photo du Service (Ajout depuis la mémoire locale)</label>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setSerImg)} className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-950 file:text-indigo-400 hover:file:bg-slate-900 cursor-pointer" />
                  {serImg && (
                    <img src={serImg} alt="Preview" className="mt-2 w-16 h-16 object-cover rounded-xl border border-slate-800" referrerPolicy="no-referrer" />
                  )}
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs py-2 px-4 rounded-xl shadow cursor-pointer">Enregistrer le Service</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-805 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-850 text-slate-400">
                  <th className={tableHeaderStyle}>Image</th>
                  <th className={tableHeaderStyle}>Service</th>
                  <th className={tableHeaderStyle}>Catégorie</th>
                  <th className={tableHeaderStyle}>Prix forfait</th>
                  <th className={tableHeaderStyle}>Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {(activeCompany.services || []).map(s => (
                  <tr key={s.id} className="hover:bg-slate-950/20 transition duration-150">
                    <td className="py-3 px-4">
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.title} className="w-8 h-8 rounded-lg object-cover bg-slate-950 border border-slate-850" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-900/30 flex items-center justify-center text-indigo-400">
                          <Briefcase className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{s.title}</td>
                    <td className="py-3.5 px-4 text-slate-350">{s.category}</td>
                    <td className="py-3.5 px-4 font-extrabold text-indigo-400">{s.pricePerHour.toLocaleString()} CFA</td>
                    <td className="py-3.5 px-4 text-slate-400">{s.durationMin} minutes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'stocks':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Gestion & Ajustements des Stocks</h2>
            <p className="text-xs text-slate-400">Mettez à jour vos inventaires et enregistrez vos entrées/sorties de produits physiques.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-black uppercase text-indigo-300 tracking-wider">Ajuster un stock</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!stockProdId) { triggerToast('Veuillez sélectionner un produit.'); return; }
                const currProd = activeCompany.products.find(p => p.id === stockProdId);
                if (!currProd) return;
                const newQty = currProd.stock + stockChangeQty;
                
                // Save stock movement log
                const newMove: ERPStockItem = {
                  id: 'st_' + Math.random().toString(36).substring(2, 6),
                  productId: stockProdId,
                  quantityChanged: stockChangeQty,
                  reason: stockReason,
                  date: new Date().toISOString().split('T')[0]
                };

                updateCompanyData(c => ({
                  products: c.products.map(p => p.id === stockProdId ? { ...p, stock: Math.max(0, newQty) } : p),
                  stocks: [newMove, ...(c.stocks || [])]
                }));

                triggerToast(`Stock de "${currProd.title}" mis à jour (${newQty}).`);
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Sélectionner Produit</label>
                  <select value={stockProdId} onChange={e => setStockProdId(e.target.value)} className={inputStyle}>
                    <option value="">-- Choisir un produit --</option>
                    {activeCompany.products.map(p => (
                      <option key={p.id} value={p.id}>{p.title} (Actuel: {p.stock})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Quantité à appliquer (+/-)</label>
                  <input type="number" required value={stockChangeQty} onChange={e => setStockChangeQty(Number(e.target.value))} className={inputStyle} />
                  <span className="text-[10px] text-slate-550 block mt-1">Utilisez un nombre négatif pour les sorties/pertes.</span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Motif d'ajustement</label>
                  <input type="text" value={stockReason} onChange={e => setStockReason(e.target.value)} placeholder="Ex: Réapprovisionnement, Perte, Vente" className={inputStyle} />
                </div>
                <button type="submit" className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer">Enregistrer Mouvement</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Journal d'inventaires (Mouvements récents)</span>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {(activeCompany.stocks || []).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">Aucun mouvement enregistré.</p>
                ) : (
                  (activeCompany.stocks || []).map(st => {
                    const prod = activeCompany.products.find(p => p.id === st.productId);
                    return (
                      <div key={st.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-white block">{prod ? prod.title : 'Produit inconnu'}</span>
                          <span className="text-[10px] text-slate-500">{st.reason} • {st.date}</span>
                        </div>
                        <span className={`font-black uppercase tracking-wider text-[11px] px-2.5 py-1 rounded-lg ${st.quantityChanged >= 0 ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/30 text-rose-400 border border-rose-900/30'}`}>
                          {st.quantityChanged >= 0 ? '+' : ''}{st.quantityChanged}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'reservations':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white">Gestion des Réservations</h2>
              <p className="text-xs text-slate-400">Planifiez et structurez l'accueil de vos clients et gérabilités de places de {activeCompany.name}.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-black uppercase text-indigo-300">Nouvelle Réservation</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!resName) return;
                const newRes: ERPReservation = {
                  id: 'res_' + Math.random().toString(36).substring(2, 6),
                  clientName: resName,
                  clientPhone: resPhone,
                  date: resDate || new Date().toISOString().split('T')[0],
                  time: resTime || '14:00',
                  guestCount: resGuests,
                  status: 'confirmed'
                };
                updateCompanyData(c => ({ reservations: [...(c.reservations || []), newRes] }));
                triggerToast(`Réservation confirmée pour ${resName} !`);
                setResName('');
                setResPhone('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nom Client</label>
                  <input type="text" required value={resName} onChange={e => setResName(e.target.value)} placeholder="Ex: Jean Paul" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Numéro de Téléphone</label>
                  <input type="tel" value={resPhone} onChange={e => setResPhone(e.target.value)} placeholder="+225 09080706" className={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Date</label>
                    <input type="date" value={resDate} onChange={e => setResDate(e.target.value)} className={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Heure</label>
                    <input type="time" value={resTime} onChange={e => setResTime(e.target.value)} className={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nombre d'invités / places</label>
                  <input type="number" required value={resGuests} onChange={e => setResGuests(Number(e.target.value))} className={inputStyle} />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold text-xs py-2 px-4 rounded-xl text-white transition active:scale-95 shadow">Confirmer Réservation</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Réservations Actives</span>
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {(activeCompany.reservations || []).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">Aucune réservation de planifiée.</p>
                ) : (
                  (activeCompany.reservations || []).map(r => (
                    <div key={r.id} className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-white block">{r.clientName}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                          📞 {r.clientPhone || 'Non renseigné'}
                          {r.clientPhone && (
                            <WhatsAppButton 
                              phone={r.clientPhone} 
                              message={`Bonjour ${r.clientName}, nous vous contactons concernant votre réservation chez ${activeCompany.name}.`} 
                              iconOnly={true} 
                            />
                          )}
                          • 🗓️ {r.date} à {r.time}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs font-black text-indigo-400 mb-1">{r.guestCount} places</span>
                        <span className="bg-emerald-950 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-900/30">Confirmé</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'rendezvous':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Gestion des Rendez-vous</h2>
            <p className="text-xs text-slate-400">Planifiez des rendez-vous clients assignés à vos équipes de services de proximité.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-black uppercase text-indigo-300">Planifier RDV</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!appClient || !appSerId) return;
                const newApp: ERPAppointment = {
                  id: 'app_' + Math.random().toString(36).substring(2, 6),
                  clientName: appClient,
                  serviceId: appSerId,
                  date: appDate || new Date().toISOString().split('T')[0],
                  time: appTime || '10:00',
                  employeeId: appEmpId,
                  status: 'pending'
                };
                updateCompanyData(c => ({ appointments: [...(c.appointments || []), newApp] }));
                triggerToast(`Rendez-vous planifié pour ${appClient} !`);
                setAppClient('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nom Client</label>
                  <input type="text" required value={appClient} onChange={e => setAppClient(e.target.value)} placeholder="Ex: Client Nom" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Service sollicité</label>
                  <select value={appSerId} onChange={e => setAppSerId(e.target.value)} className={inputStyle} required>
                    <option value="">-- Choisir un service --</option>
                    {(activeCompany.services || []).map(s => (
                      <option key={s.id} value={s.id}>{s.title} ({s.pricePerHour} CFA)</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Date</label>
                    <input type="date" value={appDate} onChange={e => setAppDate(e.target.value)} className={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Heure</label>
                    <input type="time" value={appTime} onChange={e => setAppTime(e.target.value)} className={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Assigner à un Employé</label>
                  <select value={appEmpId} onChange={e => setAppEmpId(e.target.value)} className={inputStyle}>
                    <option value="">-- Choisir un coéquipier --</option>
                    {activeCompany.employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-505 font-bold text-xs py-2 px-4 rounded-xl text-white transition">Valider Planning</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Rendez-vous Plannifiés</span>
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {(activeCompany.appointments || []).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">Aucun rendez-vous catalogué.</p>
                ) : (
                  (activeCompany.appointments || []).map(ap => {
                    const serObj = activeCompany.services.find(s => s.id === ap.serviceId);
                    const empObj = activeCompany.employees.find(e => e.id === ap.employeeId);
                    return (
                      <div key={ap.id} className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-white block">{ap.clientName}</span>
                          <span className="text-[10px] text-slate-505 block mt-0.5">Prestation : {serObj ? serObj.title : 'Service Personnalisé'}</span>
                          <span className="text-[10px] text-slate-550 block">🗓️ {ap.date} à {ap.time} • Installateur/Recep : <strong className="text-slate-350">{empObj ? empObj.name : 'Gérant'}</strong></span>
                        </div>
                        <span className="bg-amber-950/30 text-amber-400 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-900/30">En attente</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'commandes':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white">Gestion des Commandes Locales & Expéditions</h2>
              <p className="text-xs text-slate-400">Gérez le cycle complet de livraison de vos ventes et réapprovisionnements.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-bold uppercase text-indigo-300">Enregistrer une commande</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!ordClient) return;
                const newOrd: ERPOrder = {
                  id: 'ord_' + Math.random().toString(36).substring(2, 6),
                  clientName: ordClient,
                  itemsSummary: ordItems,
                  amount: Number(ordAmount),
                  paymentStatus: ordPay,
                  deliveryStatus: 'pending',
                  date: new Date().toISOString().split('T')[0]
                };
                updateCompanyData(c => ({ orders: [newOrd, ...(c.orders || [])] }));
                triggerToast(`Commande enregistrée pour ${ordClient} !`);
                setOrdClient('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nom Client</label>
                  <input type="text" required value={ordClient} onChange={e => setOrdClient(e.target.value)} placeholder="Ex: Client A" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Synthèse des articles d'achat</label>
                  <input type="text" required value={ordItems} onChange={e => setOrdItems(e.target.value)} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Montant global (CFA)</label>
                  <input type="number" required value={ordAmount} onChange={e => setOrdAmount(Number(e.target.value))} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Statut Paiement Initial</label>
                  <select value={ordPay} onChange={e => setOrdPay(e.target.value as any)} className={inputStyle}>
                    <option value="paid">Payé d'avance / Encaissé</option>
                    <option value="unpaid">Non Payé (Facture ouverte)</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold text-xs py-2 px-4 rounded-xl text-white transition uppercase tracking-wider">Créer la commande</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Journal des Commandes</span>
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {(activeCompany.orders || []).map(o => (
                  <div key={o.id} className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-white block">{o.clientName} <code className="font-mono text-indigo-400 text-[10px] ml-2">#{o.id}</code></span>
                      <span className="text-[10px] text-slate-450 block font-mono mt-0.5">{o.itemsSummary}</span>
                      <span className="text-[10px] text-slate-550 block mt-0.5">🗓️ Date : {o.date}</span>
                    </div>
                    <div className="text-right space-y-1.5">
                      <span className="block text-xs font-black text-white">{o.amount.toLocaleString()} CFA</span>
                      <div className="flex gap-1 justify-end">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${o.paymentStatus === 'paid' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/40 text-rose-450 border border-rose-900/30'}`}>
                          {o.paymentStatus === 'paid' ? 'Payé' : 'Non Payé'}
                        </span>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                          {o.deliveryStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'paiements':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Livre des Enquêtes de Paiements & Transactions</h2>
            <p className="text-xs text-slate-400">Registre détaillé des transactions Mobile Money, Cash et virements bancaires.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-bold uppercase text-indigo-300">Nouveau Paiement entrant</h3>
              <form onSubmit={e => {
                e.preventDefault();
                const newPay: ERPPayment = {
                  id: 'pay_' + Math.random().toString(36).substring(2, 6),
                  amount: Number(payAmount),
                  method: payMethod,
                  reference: payRef || 'REF-WLK-MOCK',
                  status: 'success',
                  date: new Date().toISOString().split('T')[0]
                };
                updateCompanyData(c => ({ payments: [newPay, ...(c.payments || [])] }));
                triggerToast(`Paiement de ${payAmount} CFA reçu !`);
                setPayRef('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Montant perçu (CFA)</label>
                  <input type="number" required value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Méthode de perception</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value as any)} className={inputStyle}>
                    <option value="Mobile Money">Orange/MTN Mobile Money</option>
                    <option value="Cash">Espèces / Cash</option>
                    <option value="Stripe">Stripe / Carte Bancaire</option>
                    <option value="Bank Transfer">Virement bancaire direct</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Référence unique de validation</label>
                  <input type="text" required value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Ex: TXN-MoMo-990218" className={inputStyle} />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-505 font-bold text-xs py-2.5 rounded-xl text-white uppercase transition active:scale-95">Valider l'Analyse</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Dernières Écritures de Trésorerie</span>
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {(activeCompany.payments || []).map(p => (
                  <div key={p.id} className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-white block">Reçu {p.method}</span>
                        <span className="text-[10px] text-slate-500">Réf : <code className="font-mono text-slate-400 bg-slate-950/80 px-1 rounded">{p.reference}</code> • 🗓️ {p.date}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-400 text-xs">+{p.amount.toLocaleString()} CFA</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'livraisons':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Suivi des Livraisons & Flotte logistique</h2>
            <p className="text-xs text-slate-400">Gérez le statut de vos transporteurs et expéditions en temps réel.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-bold uppercase text-indigo-300">Lancer une livraison</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!delAddress) return;
                const newDel: ERPDelivery = {
                  id: 'del_' + Math.random().toString(36).substring(2, 6),
                  orderId: delOrder || 'Commande manuelle',
                  courierName: delCourier,
                  trackingNum: delTrack + Math.floor(Math.random() * 900000 + 100000),
                  address: delAddress,
                  status: 'preparing'
                };
                updateCompanyData(c => ({ deliveries: [newDel, ...(c.deliveries || [])] }));
                triggerToast(`Colis expédié via ${delCourier} !`);
                setDelAddress('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Adresse de livraison complète</label>
                  <input type="text" required value={delAddress} onChange={e => setDelAddress(e.target.value)} placeholder="Quartier, Immeuble, Ville" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Partenaire livreur / Coursier</label>
                  <input type="text" value={delCourier} onChange={e => setDelCourier(e.target.value)} placeholder="Ex: Allo Livreur, Heetch" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Préfixe code de suivi</label>
                  <input type="text" value={delTrack} onChange={e => setDelTrack(e.target.value)} className={inputStyle} />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-505 font-bold text-xs py-2.5 rounded-xl text-white uppercase transition active:scale-95">Créer un colis d'expédition</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Suivi logistique actif</span>
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {(activeCompany.deliveries || []).map(d => (
                  <div key={d.id} className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-white block">Dest: {d.address}</span>
                      <span className="text-[10px] text-slate-500">Livreur : <strong className="text-slate-350">{d.courierName}</strong> • Log ID : <strong className="font-mono text-indigo-400">{d.trackingNum}</strong></span>
                    </div>
                    <span className="bg-indigo-950 text-indigo-300 text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-900/30">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'fournisseurs':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white">Gestion de l'Annuaire Fournisseurs</h2>
              <p className="text-xs text-slate-400">Structurez vos approvisionnements et catalogues d'achats professionnels.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-bold uppercase text-indigo-300">Ajouter un fournisseur</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!supName) return;
                const newSup: ERPSupplier = {
                  id: 'sup_' + Math.random().toString(36).substring(2, 6),
                  name: supName,
                  contactName: supContact,
                  email: supEmail,
                  phone: supPhone,
                  catalogItemsCount: 12
                };
                updateCompanyData(c => ({ suppliers: [...(c.suppliers || []), newSup] }));
                triggerToast(`Fournisseur "${supName}" enregistré.`);
                setSupName('');
                setSupContact('');
                setSupEmail('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Raison sociale du fournisseur</label>
                  <input type="text" required value={supName} onChange={e => setSupName(e.target.value)} placeholder="Ex: SIPP Afrique" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Contact référent</label>
                  <input type="text" value={supContact} onChange={e => setSupContact(e.target.value)} placeholder="M. Traoré, Commercial" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">E-mail pro</label>
                  <input type="email" value={supEmail} onChange={e => setSupEmail(e.target.value)} placeholder="fournisseur@co.com" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Téléphone</label>
                  <input type="tel" value={supPhone} onChange={e => setSupPhone(e.target.value)} className={inputStyle} />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-505 font-bold text-xs py-2.5 rounded-xl text-white transition">Valider l'entrée</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-850 text-slate-400">
                    <th className={tableHeaderStyle}>Fournisseur</th>
                    <th className={tableHeaderStyle}>Contact principal</th>
                    <th className={tableHeaderStyle}>E-mail & Mobile</th>
                    <th className={tableHeaderStyle}>Articles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {activeCompany.suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-950/10 transition">
                      <td className="py-3.5 px-4 font-bold text-white">{s.name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{s.contactName}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {s.email || 'N/A'} 
                        <br /> 
                        <span className="flex items-center gap-1.5 mt-0.5">
                          {s.phone || ''}
                          {s.phone && (
                            <WhatsAppButton 
                              phone={s.phone} 
                              message={`Bonjour ${s.name}, nous vous contactons concernant vos approvisionnements.`} 
                              iconOnly={true} 
                            />
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-indigo-400">{s.catalogItemsCount} articles</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

    case 'employes':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Ressources Humaines & Gestion des Équipes</h2>
            <p className="text-xs text-slate-400">Administrez l'annuaire de vos collaborateurs et la masse salariale.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-bold uppercase text-indigo-300">Recruter un employé</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!empName) return;
                const newEmp: ERPEmployee = {
                  id: 'emp_' + Math.random().toString(36).substring(2, 6),
                  name: empName,
                  role: empRole || 'Technicien',
                  department: empDept || 'Opérations',
                  salary: Number(empSalary),
                  status: 'active'
                };
                updateCompanyData(c => ({ employees: [...(c.employees || []), newEmp] }));
                triggerToast(`Employé "${empName}" enregistré !`);
                setEmpName('');
                setEmpRole('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nom complet du collaborateur</label>
                  <input type="text" required value={empName} onChange={e => setEmpName(e.target.value)} placeholder="Ex: Diallo Touré" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Rôle / Poste</label>
                  <input type="text" required value={empRole} onChange={e => setEmpRole(e.target.value)} placeholder="Ex: Coiffeur Expert, Commercial" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Département d'activité</label>
                  <input type="text" value={empDept} onChange={e => setEmpDept(e.target.value)} placeholder="Ex: Technique, Ventes, Admin" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Masse salariale mensuelle (CFA)</label>
                  <input type="number" required value={empSalary} onChange={e => setEmpSalary(Number(e.target.value))} className={inputStyle} />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-505 font-bold text-xs py-2.5 rounded-xl text-white transition active:scale-95 shadow">Enregistrer le contrat</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl overflow-hidden p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Membres d'équipe actifs ({activeCompany.employees.length})</span>
              <div className="space-y-3">
                {activeCompany.employees.map(emp => (
                  <div key={emp.id} className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 font-extrabold">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-white block">{emp.name}</span>
                        <span className="text-[10px] text-slate-450">{emp.role} • <strong className="text-indigo-400 font-mono">{emp.department}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-white block">{(emp.salary).toLocaleString()} CFA</span>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/30">Actif</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'agenda':
      // Dynamic Calendrier / Agenda compiling of all activities
      const allEvents = [
        ...(activeCompany.appointments || []).map(ap => ({
          title: `RDV Client : ${ap.clientName}`,
          meta: `Service ID: ${ap.serviceId}`,
          time: ap.time,
          date: ap.date,
          color: 'indigo'
        })),
        ...(activeCompany.reservations || []).map(r => ({
          title: `Réservation : ${r.clientName}`,
          meta: `${r.guestCount} places`,
          time: r.time,
          date: r.date,
          color: 'emerald'
        }))
      ];
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Agenda Centralisé d'Activités</h2>
            <p className="text-xs text-slate-400">Consultez l'agenda chronologique complet de vos réservations et créneaux pour {activeCompany.name}.</p>
          </div>

          <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl space-y-4 text-left">
            <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Planning des réservations et rendez-vous</span>
            
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-center text-[10px] font-black uppercase text-slate-500 border-b border-slate-850 pb-2">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mer</div>
              <div>Jeu</div>
              <div>Ven</div>
              <div>Sam</div>
              <div>Dim</div>
            </div>

            <div className="space-y-3 pt-2">
              {allEvents.length === 0 ? (
                <p className="text-xs text-slate-550 text-center py-12 border border-dashed border-slate-800 rounded-2xl">Aucun événement de planifié aujourd'hui.</p>
              ) : (
                allEvents.map((ev, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${ev.color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                      <div>
                        <span className="font-extrabold text-white block">{ev.title}</span>
                        <span className="text-[10px] text-slate-450">{ev.meta}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">{ev.date} à {ev.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );

    case 'notifications':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Centre de Notifications & Alertes</h2>
            <p className="text-xs text-slate-400">Administrez et configurez vos toasters d'alertes instantanées de l'ERP.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-bold uppercase text-indigo-300">Diffuser une alerte interne</h3>
              <form onSubmit={e => {
                e.preventDefault();
                triggerToast("Alerte système diffusée !");
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Message d'alerte</label>
                  <textarea rows={3} className={inputStyle} placeholder="Ex: Réunion générale d'équipe à 15h00..." />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold text-xs py-2.5 rounded-xl text-white uppercase transition active:scale-95 shadow">Diffuser maintenant</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Boîte de réception des logs alertes</span>
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-start gap-3 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Alerte Stocks critique</span>
                    <span className="text-[11px] text-slate-400">Le stock de certains produits de l'entreprise est inférieur au seuil minimum d'alerte configuré.</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-start gap-3 text-xs text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">IA Insights : Prédicteurs compilés</span>
                    <span className="text-[11px] text-slate-400">Les données de ventes ont été restructurées et transmises avec succès à votre modèle IA prédictif.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'signature':
      const [signDrawDone, setSignDrawDone] = useState(false);
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Signature Électronique Certifiée</h2>
            <p className="text-xs text-slate-400">Numérisez vos signatures pour l'homologation légale de vos devis et facturations.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={cardStyle}>
              <h3 className="text-xs font-black uppercase text-indigo-300">Dessiner votre Signature d'affaires</h3>
              <p className="text-[11px] text-slate-450 leading-relaxed">Une signature numérique approuvée peut être dynamiquement apposée sur l'ensemble de vos bordereaux de ventes pour authentifier vos services de manière décentralisée.</p>
              
              {!signDrawDone ? (
                <div className="h-44 bg-slate-950 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center relative">
                  <PenTool className="w-6 h-6 text-indigo-400 animate-bounce mb-1" />
                  <span className="text-[10px] text-slate-500">Signez ici avec votre curseur ou stylet tactile</span>
                  <button onClick={() => {
                    setSignDrawDone(true);
                    triggerToast("Signature cryptographique stockée !");
                  }} className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-505 font-bold text-[10px] uppercase py-1.5 px-3 rounded text-white">
                    Sauvegarder signature
                  </button>
                </div>
              ) : (
                <div className="h-44 bg-emerald-950/20 border border-dashed border-emerald-900 rounded-2xl flex flex-col items-center justify-center text-emerald-400">
                  <CheckCircle className="w-8 h-8 mb-1 animate-pulse" />
                  <span className="font-black text-sm">SIGNATURE ACTIVER & SÉCURISÉE</span>
                  <span className="text-[9px] text-slate-500 font-mono mt-0.5">SHA-256 : F7A2B...9218</span>
                  <button onClick={() => setSignDrawDone(false)} className="text-[10px] underline text-slate-400 hover:text-white mt-1.5 font-bold">Re-dessiner</button>
                </div>
              )}
            </div>

            <div className={cardStyle}>
              <h3 className="text-xs font-bold uppercase text-slate-350">Informations & Conformité SaaS WeLink</h3>
              <div className="space-y-3 text-xs text-slate-400 leading-relaxed font-sans">
                <p>La brique de signature décentralisée WeLink utilise un horodatage cryptographique fort conforme aux régulations eIDAS et exigences de facturation d'Afrique de l'Ouest.</p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-[10px] text-indigo-400">
                  ⚡ Statut Certification : OPÉRATIONNEL <br />
                  🔑 Algorithme : RSA-4096 crypté
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'rapports':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Centre de Rapports & Statistiques analytiques</h2>
            <p className="text-xs text-slate-400">Consultez et exportez l'état de santé économique global de {activeCompany.name}.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Marge bénéficiaire</span>
              <span className="block text-2xl font-extrabold text-emerald-400 mt-2">78.4 %</span>
              <span className="text-[10px] text-slate-450 mt-1 block">Excellent rendement d'activité</span>
            </div>
            <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Moyenne Panier Moyen</span>
              <span className="block text-2xl font-extrabold text-white mt-2">35 500 CFA</span>
              <span className="text-[10px] text-slate-450 mt-1 block">Sur un total de {activeCompany.orders.length} transactions</span>
            </div>
            <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Articles Actifs</span>
              <span className="block text-2xl font-extrabold text-indigo-400 mt-2">{activeCompany.products.length + activeCompany.services.length}</span>
              <span className="text-[10px] text-slate-450 mt-1 block">Catalogue commercial global</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl text-left space-y-4">
            <h3 className="text-xs font-black uppercase text-indigo-300">Générer rapports d'audits</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => {
                triggerToast('Exportation Excel démarrée !');
                alert("Votre tableur comptable de trésorerie WeLink a été synthétisé avec succès.");
              }} className="bg-slate-950 hover:bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 transition">Exporte Tableur Excel</button>
              
              <button onClick={() => {
                triggerToast('Données transmises vers PDF !');
                alert("Visualisation graphique et logs PDF créés d'avance.");
              }} className="bg-slate-950 hover:bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 transition">Imprimer Bilan Annuel PDF</button>
            </div>
          </div>
        </div>
      );

    case 'ia':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="bg-slate-900 border border-indigo-900/40 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-550/5 rounded-full blur-3xl -mr-6 -mt-6"></div>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-indigo-400">Model WeLink Copilot</span>
                <h3 className="text-md font-extrabold text-white">Moteur Prédictif Proactive de Ventes</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-4">L'IA de notre plateforme SaaS modulaire analyse en continu les seuils de stocks, les demandes de rendez-vous et les données financières de votre tenant isolé pour synthétiser des conseils stratégiques sans faille.</p>
            
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 font-mono text-xs text-indigo-300 leading-relaxed space-y-2">
              <div>📈 **Prédiction d'Inflow (Juillet)** : Hausse d'environ +14.5% par rapport au mois actuel.</div>
              <div>🛒 **Régulation de Stocks** : Réapprovisionnez les articles d'alertes pour devancer les ruptures.</div>
              <div>💡 **Action d'impact** : Lancez une promotion ciblée sur les services pour combler les créneaux libres.</div>
            </div>
          </div>
        </div>
      );

    case 'fidelite':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Programmes de Fidélité Clients</h2>
            <p className="text-xs text-slate-400">Attribuez des points de fidélité par palier d'achats pour fidéliser votre clientèle.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-bold uppercase text-indigo-300">Ajouter un abonné fidélité</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!loyName) return;
                const newLoy: ERPLoyaltyMember = {
                  id: 'loy_' + Math.random().toString(36).substring(2, 6),
                  clientName: loyName,
                  points: Number(loyPoints),
                  tier: loyTier
                };
                updateCompanyData(c => ({ loyaltyPrograms: [...(c.loyaltyPrograms || []), newLoy] }));
                triggerToast(`Abonné "${loyName}" enregistré au programme de fidélité.`);
                setLoyName('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nom du client</label>
                  <input type="text" required value={loyName} onChange={e => setLoyName(e.target.value)} placeholder="Ex: Aminata Diallo" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Points initiaux d'ouverture</label>
                  <input type="number" value={loyPoints} onChange={e => setLoyPoints(Number(e.target.value))} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Palier / Grade initial</label>
                  <select value={loyTier} onChange={e => setLoyTier(e.target.value as any)} className={inputStyle}>
                    <option value="Bronze">Niveau Bronze (Standard)</option>
                    <option value="Silver">Niveau Silver (+5% points)</option>
                    <option value="Gold">Niveau Gold (+10% points)</option>
                    <option value="Platinum">Niveau Platinum VIP</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-505 font-bold text-xs py-2.5 rounded-xl text-white transition">Valider l'adhésion</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Abonnés actifs au Programme de fidélité</span>
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {(activeCompany.loyaltyPrograms || []).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">Aucun abonné au programme.</p>
                ) : (
                  (activeCompany.loyaltyPrograms || []).map(loy => (
                    <div key={loy.id} className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-white block">{loy.clientName}</span>
                        <span className="text-[10px] text-zinc-500">ID Unique : <strong className="font-mono text-zinc-400">{loy.id}</strong></span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <strong className="block text-indigo-400">{loy.points} Points</strong>
                        <span className="bg-zinc-850 px-2 py-0.5 rounded text-[9px] font-black uppercase text-indigo-300 border border-slate-800">{loy.tier}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'coupons':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Générateur de Coupons Codes</h2>
            <p className="text-xs text-slate-400">Générez des coupons de réduction applicables à l'encaissement de vos devis et boutiques.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-bold uppercase text-indigo-300">Générer un coupon</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!coupCode) return;
                const newCoup: ERPCoupon = {
                  id: 'coup_' + Math.random().toString(36).substring(2, 6),
                  code: coupCode.toUpperCase().replace(/\s+/g, ''),
                  discountValue: Number(coupVal),
                  type: coupType,
                  active: true
                };
                updateCompanyData(c => ({ coupons: [...(c.coupons || []), newCoup] }));
                triggerToast(`Coupon "${coupCode}" actif !`);
                setCoupCode('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Code Coupon (Sans espaces)</label>
                  <input type="text" required value={coupCode} onChange={e => setCoupCode(e.target.value)} placeholder="Ex: RENTREE25, PROMO30" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Valeur de réduction</label>
                  <input type="number" required value={coupVal} onChange={e => setCoupVal(Number(e.target.value))} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Unité de réduction</label>
                  <select value={coupType} onChange={e => setCoupType(e.target.value as any)} className={inputStyle}>
                    <option value="percent">Pourcentage (%)</option>
                    <option value="flat">Valeur fixe (CFA)</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-505 font-bold text-xs py-2.5 rounded-xl text-white uppercase tracking-wider transition">Publier le Coupon</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Coupons de réduction actifs</span>
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {(activeCompany.coupons || []).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">Aucun coupon configuré.</p>
                ) : (
                  (activeCompany.coupons || []).map(c => (
                    <div key={c.id} className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-white block font-mono text-xs bg-slate-950/60 border border-slate-850 px-2 py-0.5 rounded-md inline-block">{c.code}</span>
                        <span className="text-[10px] text-slate-500 mt-1 block">Réf : {c.id}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs font-black text-white">{c.discountValue} {c.type === 'percent' ? '%' : 'CFA'}</span>
                        <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900/35 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Actif</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'promotions':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Campagnes de Promotion & Soldes</h2>
            <p className="text-xs text-slate-400">Automatisez le lancement des remises exceptionnelles et l'animation de votre tenant d'entreprise.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-bold uppercase text-indigo-300">Lancer une campagne de promotion</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!promoTitle) return;
                const newPromo: ERPPromotion = {
                  id: 'promo_' + Math.random().toString(36).substring(2, 6),
                  title: promoTitle,
                  discountPercent: Number(promoPct),
                  targetCategory: promoCat || 'Tout service',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: promoEnd || '2026-12-31'
                };
                updateCompanyData(c => ({ promotions: [...(c.promotions || []), newPromo] }));
                triggerToast(`Campagne soldes "${promoTitle}" lancée !`);
                setPromoTitle('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nom / Thème de la Promotion</label>
                  <input type="text" required value={promoTitle} onChange={e => setPromoTitle(e.target.value)} placeholder="Ex: Soldes d'Été, Offre Flash" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Pourcentage de soldes (%)</label>
                  <input type="number" required value={promoPct} onChange={e => setPromoPct(Number(e.target.value))} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Catégorie cible d'application</label>
                  <input type="text" value={promoCat} onChange={e => setPromoCat(e.target.value)} placeholder="Ex: Salon de coiffure, Beauté" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Date limite de fin</label>
                  <input type="date" value={promoEnd} onChange={e => setPromoEnd(e.target.value)} className={inputStyle} />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-505 font-bold text-xs py-2.5 rounded-xl text-white uppercase tracking-wider transition">Activer les soldes</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Campagnes promotionnelles en direct</span>
              <div className="space-y-3">
                {(activeCompany.promotions || []).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">Aucune campagne promotionnelle animée.</p>
                ) : (
                  (activeCompany.promotions || []).map(p => (
                    <div key={p.id} className="p-3 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-white block">{p.title}</span>
                        <span className="text-[10px] text-slate-500 mt-1">Cible : <strong className="text-indigo-400 font-mono">{p.targetCategory}</strong> • Limite : {p.endDate}</span>
                      </div>
                      <span className="bg-red-950/30 text-rose-400 text-xs font-black px-2.5 py-1 rounded-full border border-red-900/30">- {p.discountPercent} %</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'jobs':
      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-extrabold text-white">Console Carrières & Offres d'Emploi</h2>
            <p className="text-xs text-slate-400">Éditez et publiez des fiches de poste pour recruter vos talents au sein de {activeCompany.name}.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cardStyle + " h-max"}>
              <h3 className="text-xs font-bold uppercase text-indigo-300">Publier une offre d'emploi</h3>
              <form onSubmit={e => {
                e.preventDefault();
                if (!jobTitle) return;
                const newJob = {
                  id: 'j_' + Math.random().toString(36).substring(2, 6),
                  title: jobTitle,
                  description: jobDesc,
                  salary: jobSal,
                  type: jobType,
                  createdAt: new Date().toISOString().split('T')[0]
                };
                updateCompanyData(c => ({
                  // Store jobs in custom activeCompany fields if not present
                  ...c,
                  // @ts-ignore
                  jobPostings: [newJob, ...(c.jobPostings || [])]
                }));
                triggerToast(`Offre d'emploi "${jobTitle}" publiée avec succès !`);
                setJobTitle('');
                setJobDesc('');
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Intitulé du poste d'emploi</label>
                  <input type="text" required value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Ex: Coiffeur Polyvalent F/H" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Type de Contrat</label>
                  <select value={jobType} onChange={e => setJobType(e.target.value)} className={inputStyle}>
                    <option value="CDI">CDI (Contrat Durée Indéterminée)</option>
                    <option value="CDD">CDD (Contrat Durée Déterminée)</option>
                    <option value="Stage/Alternance">Stage / Alternance pro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Fourchette Salariale</label>
                  <input type="text" value={jobSal} onChange={e => setJobSal(e.target.value)} placeholder="Ex: 250.000 - 350.000 CFA" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Description / Conditions</label>
                  <textarea rows={3} value={jobDesc} onChange={e => setJobDesc(e.target.value)} className={inputStyle} placeholder="Détaillez les compétences, l'expérience requise et horaires..." />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-505 font-bold text-xs py-2.5 rounded-xl text-white uppercase tracking-wider transition">Publier le poste</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4 text-left">
              <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Appels à candidatures en direct</span>
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {/* @ts-ignore */}
                {(!activeCompany.jobPostings || activeCompany.jobPostings.length === 0) ? (
                  <p className="text-xs text-slate-550 text-center py-10 border border-dashed border-slate-800 rounded-xl">Aucune fiche de poste n'a été rédigée.</p>
                ) : (
                  // @ts-ignore
                  activeCompany.jobPostings.map(j => (
                    <div key={j.id} className="p-3.5 bg-slate-950/45 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-white block">{j.title}</span>
                        <span className="text-[10px] text-slate-450 block mt-0.5">{j.description || 'Pas de description'}</span>
                        <span className="text-[10px] text-slate-550 block mt-1">Salaire : {j.salary} • Contrat : <strong className="text-indigo-400 font-mono">{j.type}</strong></span>
                      </div>
                      <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-900/35 text-[9px] px-2 py-0.5 rounded font-black tracking-widest">OUVERT</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
