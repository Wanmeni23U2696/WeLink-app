import React, { useState } from 'react';
import { UserProfile, Product, JobOffer, Order, HotelRoom, HotelReservation, HotelCoupon, HotelAuditLog } from '../types';
import { 
  Calendar, Plus, Edit2, Trash2, Shield, LayoutDashboard, Coffee, DollarSign, 
  TrendingUp, Users, Check, X, Tag, FileText, Activity, AlertTriangle, 
  Printer, Clock, ArrowRight, Loader2, BarChart2, Flame, MapPin, CheckSquare, Sparkles, Building, RefreshCw
} from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import hotelBg from '../assets/images/boutique_hotel_luxurious_bg_1781016397633.png';

interface HotelAdminDashboardProps {
  user: UserProfile;
  products: Product[];
  jobOffers: JobOffer[];
  orders: Order[];
  onRefreshState: () => void;
  allUsers: UserProfile[];
  hotelRooms: HotelRoom[];
  hotelRoomCategories: any[];
  hotelReservations: HotelReservation[];
  hotelCoupons: HotelCoupon[];
  hotelAuditLogs: HotelAuditLog[];
  hotelFomoSettings?: any[];
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function HotelAdminDashboard({
  user,
  products,
  jobOffers,
  orders,
  onRefreshState,
  allUsers,
  hotelRooms,
  hotelRoomCategories,
  hotelReservations,
  hotelCoupons,
  hotelAuditLogs,
  hotelFomoSettings = [],
  activeTab,
  setActiveTab
}: HotelAdminDashboardProps) {
  const [adminTab, setAdminTab] = useState<'stats' | 'rooms' | 'categories' | 'bookings' | 'marketing' | 'logs'>('stats');

  // Keep state synchronized when activeTab prop changes!
  React.useEffect(() => {
    if (activeTab === 'promotions') {
      setAdminTab('marketing');
    } else if (activeTab === 'inventory') {
      setAdminTab('rooms');
    } else if (activeTab === 'hotel-stats') {
      setAdminTab('stats');
    } else if (activeTab === 'bookings') {
      setAdminTab('bookings');
    } else if (activeTab === 'audit-logs') {
      setAdminTab('logs');
    }
  }, [activeTab]);

  // --- COMPONENT CRUD MODALS STATE ---
  // A. Room Manager States
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HotelRoom | null>(null);
  const [roomNumberInput, setRoomNumberInput] = useState('');
  const [roomTypeInput, setRoomTypeInput] = useState('Chambre Standard');
  const [roomCapacityInput, setRoomCapacityInput] = useState('2');
  const [roomPriceInput, setRoomPriceInput] = useState('');
  const [roomDescInput, setRoomDescInput] = useState('');
  const [roomEquipInput, setRoomEquipInput] = useState('');
  const [roomStatusInput, setRoomStatusInput] = useState<'Libre' | 'Occupée' | 'Réservée' | 'Maintenance'>('Libre');
  const [roomPhotoInput, setRoomPhotoInput] = useState('');

  // B. Category Manager States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catDescInput, setCatDescInput] = useState('');

  // C. Coupon Manager States
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponValInput, setCouponValInput] = useState('10');
  const [couponTypeInput, setCouponTypeInput] = useState<'percent' | 'flat'>('percent');

  // D. Booking Detail/Payment management State
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<HotelReservation | null>(null);
  const [showInvoicePrint, setShowInvoicePrint] = useState<HotelReservation | null>(null);

  // Marketing FOMO Settings State with real-time backend synchronization
  const currentFomo = hotelFomoSettings?.find(s => s.hotelId === user.id);
  
  const [fomoTitle, setFomoTitle] = useState(currentFomo?.title || 'OFFRE FLASH WEEK-END : -30% SUR LES SÉJOURS !');
  const [fomoHoursLeft, setFomoHoursLeft] = useState(currentFomo?.hoursLeft || '4');
  const [fomoActive, setFomoActive] = useState(currentFomo !== undefined ? currentFomo.active : true);
  const [fomoExpiryDate, setFomoExpiryDate] = useState<string>(() => {
    return currentFomo?.expiryDate || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  });

  // Keep state synchronized when currentFomo changes in database state
  React.useEffect(() => {
    if (currentFomo) {
      setFomoTitle(currentFomo.title);
      setFomoHoursLeft(currentFomo.hoursLeft);
      setFomoActive(currentFomo.active);
      setFomoExpiryDate(currentFomo.expiryDate);
    }
  }, [currentFomo]);

  const [savingFomo, setSavingFomo] = useState(false);

  const handleSaveFomo = async (overrideActive?: boolean) => {
    setSavingFomo(true);
    try {
      const activeState = overrideActive !== undefined ? overrideActive : fomoActive;
      const hours = parseFloat(fomoHoursLeft) || 4;
      const expiry = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      
      const response = await fetch('/api/hotel/fomo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: user.id,
          title: fomoTitle,
          hoursLeft: fomoHoursLeft,
          active: activeState,
          expiryDate: expiry
        })
      });
      if (response.ok) {
        onRefreshState();
      }
    } catch (err) {
      console.error("Erreur d'enregistrement FOMO:", err);
    } finally {
      setSavingFomo(false);
    }
  };

  // Filter list states
  const [roomSearch, setRoomSearch] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('all');

  // --- STATS ENGINE CALCULATIONS ---
  const activeRooms = hotelRooms.filter(r => r.hotelId === user.id);
  const activeBookings = hotelReservations.filter(r => r.hotelId === user.id);
  const activeCoupons = hotelCoupons.filter(c => c.hotelId === user.id);
  const activeLogs = hotelAuditLogs.filter(l => l.hotelId === user.id);

  // Total earnings (Paid + Partial amount collected)
  const totalEarningsCollected = activeBookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.paidAmount, 0);

  // Total revenue promised
  const totalBookedValue = activeBookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Occupation breakdown metric
  const occupiedCount = activeRooms.filter(r => r.status === 'Occupée').length;
  const reservedCount = activeRooms.filter(r => r.status === 'Réservée').length;
  const maintenanceCount = activeRooms.filter(r => r.status === 'Maintenance').length;
  const freeCount = activeRooms.filter(r => r.status === 'Libre').length;

  const occupancyRate = activeRooms.length > 0 
    ? Math.round(((occupiedCount + reservedCount) / activeRooms.length) * 100) 
    : 0;

  // Revenue per room type calculation
  const revenueByRoomType: Record<string, number> = {};
  activeBookings.filter(b => b.status !== 'cancelled').forEach(b => {
    revenueByRoomType[b.roomType] = (revenueByRoomType[b.roomType] || 0) + b.totalPrice;
  });

  // GUEST CLIENTS LIST (Extract dynamic distinct names from bookings)
  const clientSummaryList = Array.from(new Set(activeBookings.map(b => b.clientId))).map(cId => {
    const lastBooking = activeBookings.find(b => b.clientId === cId);
    const relatedTotalSpend = activeBookings.filter(b => b.clientId === cId && b.status !== 'cancelled').reduce((sum, b) => sum + b.totalPrice, 0);
    const bookingsCount = activeBookings.filter(b => b.clientId === cId).length;

    return {
      id: cId,
      name: lastBooking?.clientName || "Client standard",
      email: lastBooking?.clientEmail || "client@email.com",
      phone: lastBooking?.clientPhone || "Non renseigné",
      count: bookingsCount,
      totalSpend: relatedTotalSpend
    };
  });

  // --- CRUD DISPATCH FUNCTIONS ---
  // 1. ADD / EDIT CABINET ROOM
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumberInput || !roomTypeInput || !roomPriceInput) {
      alert("Veuillez remplir les informations obligatoires.");
      return;
    }

    const payload = {
      hotelId: user.id,
      number: roomNumberInput,
      type: roomTypeInput,
      capacity: parseInt(roomCapacityInput) || 2,
      price: parseFloat(roomPriceInput),
      description: roomDescInput,
      equipments: roomEquipInput ? roomEquipInput.split(',').map(x => x.trim()) : [],
      photos: roomPhotoInput ? [roomPhotoInput] : [],
      status: roomStatusInput
    };

    try {
      const url = editingRoom ? `/api/hotel/rooms/${editingRoom.id}` : '/api/hotel/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowRoomModal(false);
        setEditingRoom(null);
        setRoomNumberInput('');
        setRoomPriceInput('');
        setRoomDescInput('');
        setRoomEquipInput('');
        setRoomPhotoInput('');
        onRefreshState();
      } else {
        const d = await res.json();
        alert(d.error || "Erreur lors de l'enregistrement de la chambre.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditRoomClick = (room: HotelRoom) => {
    setEditingRoom(room);
    setRoomNumberInput(room.number);
    setRoomTypeInput(room.type);
    setRoomCapacityInput(room.capacity.toString());
    setRoomPriceInput(room.price.toString());
    setRoomDescInput(room.description || '');
    setRoomEquipInput(room.equipments ? room.equipments.join(', ') : '');
    setRoomStatusInput(room.status);
    setRoomPhotoInput(room.photos?.[0] || '');
    setShowRoomModal(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette chambre du parc hôtelier ?")) return;

    try {
      const res = await fetch(`/api/hotel/rooms/${roomId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshState();
      } else {
        alert("Une erreur s'est produite.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. ADD / EDIT CATEGORY
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput) return;

    const payload = {
      hotelId: user.id,
      name: catNameInput,
      description: catDescInput
    };

    try {
      const url = editingCategory ? `/api/hotel/categories/${editingCategory.id}` : '/api/hotel/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCatNameInput('');
        setCatDescInput('');
        onRefreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Supprimer cette catégorie d'hébergement hôtelier ?")) return;
    try {
      const res = await fetch(`/api/hotel/categories/${id}`, { method: 'DELETE' });
      if (res.ok) onRefreshState();
    } catch (err) {
      console.error(err);
    }
  };

  // 3. EDIT RESERVATION STATE / CHECK-IN / CHECK-OUT / RECORD PAYMENT
  const handleUpdateReservationStatus = async (resId: string, updates: Partial<HotelReservation>) => {
    try {
      const res = await fetch(`/api/hotel/reservations/${resId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        onRefreshState();
        setSelectedBookingDetails(prev => prev && prev.id === resId ? { ...prev, ...updates } : prev);
      } else {
        alert("La mise à jour de la réservation a échoué.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. ADD promo coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput || !couponValInput) return;

    const payload = {
      hotelId: user.id,
      code: couponCodeInput.toUpperCase().trim(),
      discountType: couponTypeInput,
      discountValue: parseFloat(couponValInput)
    };

    try {
      const res = await fetch('/api/hotel/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowCouponModal(false);
        setCouponCodeInput('');
        setCouponValInput('10');
        onRefreshState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCoupon = async (coupId: string) => {
    if (!window.confirm("Supprimer ce coupon promo ?")) return;
    try {
      const res = await fetch(`/api/hotel/coupons/${coupId}`, { method: 'DELETE' });
      if (res.ok) onRefreshState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadLogsPDF = () => {
    const timestamp = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Journal d'Audit de Sécurité - ${user.name}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333;
      padding: 40px;
      background-color: #faf8f5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
      padding: 40px;
      border: 1px solid #e7dfd5;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #5d5146;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-left h1 {
      font-size: 24px;
      margin: 0;
      color: #2c2520;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header-left p {
      margin: 5px 0 0 0;
      font-size: 13px;
      color: #7c6e62;
    }
    .header-right {
      text-align: right;
      font-size: 12px;
      color: #666;
    }
    .header-right strong {
      color: #2c2520;
    }
    .badge {
      background: #5d5146;
      color: #fff;
      font-size: 9px;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 11px;
    }
    th {
      background-color: #f7f5f2;
      color: #5d5146;
      font-weight: 700;
      text-align: left;
      padding: 12px 10px;
      border-bottom: 2px solid #e7dfd5;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px 10px;
      border-bottom: 1px solid #f0ece6;
      vertical-align: top;
      line-height: 1.4;
    }
    tr:nth-child(even) {
      background-color: #faf9f7;
    }
    .log-time {
      font-family: monospace;
      font-weight: bold;
      color: #666;
      white-space: nowrap;
    }
    .log-action {
      font-family: monospace;
      font-weight: 800;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      text-transform: uppercase;
    }
    .action-reservation { background: #e0e7ff; color: #3730a3; }
    .action-room { background: #e0f2fe; color: #075985; }
    .action-default { background: #e2e8f0; color: #334155; }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #937b67;
      margin-top: 60px;
      border-top: 1px solid #e7dfd5;
      padding-top: 20px;
    }
    @media print {
      body { padding: 0; background: none; }
      .container { box-shadow: none; padding: 0; border: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>Journal d'Audit Hôtelier</h1>
        <p>Registre légal et traçabilité des opérations de l'établissement</p>
      </div>
      <div class="header-right">
        <span class="badge">SÉCURITÉ & AUDIT</span>
        <p><strong>${user.name}</strong></p>
        <p>Extrait le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>
    </div>

    <p style="font-size: 11px; color: #666;">Ce registre contient la liste chronologique des traces d'activité et des modifications système effectuées sur l'inventaire hôtelier et le carnet de réservations. Nombre total d'enregistrements : <strong>${activeLogs.length}</strong>.</p>

    <table>
      <thead>
        <tr>
          <th style="width: 15%">Horodatage</th>
          <th style="width: 25%">Type d'Action</th>
          <th style="width: 60%">Détails de l'Activité</th>
        </tr>
      </thead>
      <tbody>
        ${activeLogs.length === 0 ? `
          <tr>
            <td colspan="3" style="text-align: center; color: #888; font-style: italic; padding: 30px;">Aucune trace d'audit enregistrée.</td>
          </tr>
        ` : activeLogs.map(log => {
          const isRes = log.action.includes('RESERVATION');
          const isRoom = log.action.includes('ROOM');
          const badgeClass = isRes ? 'action-reservation' : (isRoom ? 'action-room' : 'action-default');
          return `
            <tr>
              <td><span class="log-time">${new Date(log.timestamp).toLocaleDateString('fr-FR')} - ${new Date(log.timestamp).toLocaleTimeString('fr-FR')}</span></td>
              <td><span class="log-action ${badgeClass}">${log.action}</span></td>
              <td>${log.details}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>Registre officiel d'audit hôtelier généré pour l'établissement ${user.name}.</p>
      <p>© ${new Date().getFullYear()} WeLink Services. Certifié conforme.</p>
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journaux-audit-${user.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="lg:col-span-12 space-y-6 font-sans text-slate-100">
      
      {/* MAIN DATA MODULE DISPLAY WORKSPACE */}
      <div className="space-y-6">

        {/* TAB A: STATISTICS MODULE */}
        {adminTab === 'stats' && (
          <div className="space-y-6">
            
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between text-slate-505">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block pb-1">Taux d'occupation</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white">{occupancyRate}%</span>
                  <span className="text-[10.5px] text-slate-400 font-mono">({occupiedCount + reservedCount}/{activeRooms.length} ch.)</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-650 bg-indigo-505 bg-indigo-500 h-full rounded-full" style={{ width: `${occupancyRate}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between text-slate-505">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block pb-1">Revenu Réceptionné</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xl font-black text-emerald-400 font-mono">{totalEarningsCollected.toLocaleString()} F</span>
                  <p className="text-[10px] text-slate-400 pt-0.5">Liquidité perçue via acompte/séjours</p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between text-slate-505">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block pb-1">Revenu Contractuel</span>
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <span className="text-xl font-black text-sky-400 font-mono">{totalBookedValue.toLocaleString()} F</span>
                  <p className="text-[10px] text-slate-400 pt-0.5">Valeur globale des réservations</p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between text-slate-505">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block pb-1">Fiche Clients distincts</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <span className="text-xl font-black text-white">{clientSummaryList.length}</span>
                  <p className="text-[10px] text-slate-400 pt-0.5">Générés par réservations</p>
                </div>
              </div>
            </div>

            {/* Graphs / Breakdown section layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column distribution charts */}
              <div className="md:col-span-6 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-900 pb-2">
                  <h4 className="text-xs font-black uppercase text-slate-300">Etat d'occupation en temps réel</h4>
                </div>
                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-slate-200">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Libres ({freeCount})</span>
                      <span className="font-mono">{activeRooms.length > 0 ? Math.round((freeCount / activeRooms.length) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${activeRooms.length > 0 ? (freeCount / activeRooms.length) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-slate-200">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>Occupées en séjour ({occupiedCount})</span>
                      <span className="font-mono">{activeRooms.length > 0 ? Math.round((occupiedCount / activeRooms.length) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: `${activeRooms.length > 0 ? (occupiedCount / activeRooms.length) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-slate-200">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Réservées à venir ({reservedCount})</span>
                      <span className="font-mono">{activeRooms.length > 0 ? Math.round((reservedCount / activeRooms.length) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${activeRooms.length > 0 ? (reservedCount / activeRooms.length) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-slate-200">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Maintenance travaux ({maintenanceCount})</span>
                      <span className="font-mono">{activeRooms.length > 0 ? Math.round((maintenanceCount / activeRooms.length) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${activeRooms.length > 0 ? (maintenanceCount / activeRooms.length) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column billing report */}
              <div className="md:col-span-6 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-900 pb-2">
                  <h4 className="text-xs font-black uppercase text-slate-300">Répartition du revenu par catégorie d'hébergement</h4>
                </div>
                <div className="space-y-3.5 text-xs">
                  {Object.keys(revenueByRoomType).length === 0 ? (
                    <p className="text-xs text-slate-450 text-center py-6">Aucune donnée de facturation enregistrée.</p>
                  ) : (
                    Object.entries(revenueByRoomType).map(([type, total]) => {
                      const share = totalBookedValue > 0 ? Math.round((total / totalBookedValue) * 100) : 0;
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between items-center text-slate-200">
                            <span className="font-medium truncate max-w-[70%]">{type}</span>
                            <span className="font-mono font-bold">{total.toLocaleString()} F ({share}%)</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div className="bg-violet-500 h-full" style={{ width: `${share}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* EXPORT DATA BLOCK */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-white uppercase">Générateur de rapports administratifs</h4>
                <p className="text-[10.5px] text-slate-400">Exportez le listing des réservations et bilans financiers.</p>
              </div>
              <button 
                onClick={() => {
                  const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rapport d'Activité Hôtelière - ${user.name}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #2b2b2b;
      background: #fafaf9;
      margin: 0;
      padding: 40px;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border-top: 6px solid #c29668;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e7dfd5;
      padding-bottom: 25px;
      margin-bottom: 30px;
    }
    .header-left h1 {
      margin: 0;
      font-size: 24px;
      color: #111;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header-left p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #7b6d61;
    }
    .header-right {
      text-align: right;
    }
    .header-right .badge {
      display: inline-block;
      background: #c29668;
      color: #fff;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 12px;
      margin-bottom: 8px;
    }
    .header-right p {
      margin: 0;
      font-size: 12px;
      color: #777;
    }
    .stats-table {
      width: 100%;
      margin-bottom: 35px;
      border: 1px solid #e7dfd5;
      background: #fbf9f6;
      border-radius: 10px;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
    }
    .stats-table td {
      padding: 20px;
      text-align: center;
      border-right: 1px solid #e7dfd5;
      border-bottom: none;
    }
    .stats-table td:last-child {
      border-right: none;
    }
    .stats-table .label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #937b67;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .stats-table .value {
      font-size: 22px;
      font-weight: 800;
      color: #111;
    }
    .stats-table .detail {
      font-size: 11px;
      color: #777;
      margin-top: 4px;
    }
    h2 {
      font-size: 13px;
      text-transform: uppercase;
      color: #111;
      letter-spacing: 1px;
      border-bottom: 2px solid #261c15;
      padding-bottom: 8px;
      margin-top: 40px;
      margin-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #261c15;
      color: #ffffff;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: bold;
      padding: 12px 15px;
      text-align: left;
    }
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e7dfd5;
      font-size: 12px;
      color: #333;
    }
    tr:nth-child(even) td {
      background: #fdfdfc;
    }
    .status-pill {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 12px;
      display: inline-block;
    }
    .status-libre { background: #d1fae5; color: #065f46; }
    .status-occupee { background: #fee2e2; color: #991b1b; }
    .status-reservee { background: #dbeafe; color: #1e40af; }
    .status-maintenance { background: #fef3c7; color: #92400e; }
    
    .status-confirmed { background: #e0f2fe; color: #0369a1; }
    .status-checked_in { background: #d1fae5; color: #065f46; }
    .status-checked_out { background: #f3f4f6; color: #374151; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    
    .footer {
      text-align: center;
      font-size: 11px;
      color: #937b67;
      margin-top: 60px;
      border-top: 1px solid #e7dfd5;
      padding-top: 20px;
    }
    @media print {
      body { padding: 0; background: none; }
      .container { box-shadow: none; padding: 0; border: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>Bilan d'Activité Hôtelière</h1>
        <p>Document administratif de gestion et états financiers</p>
      </div>
      <div class="header-right">
        <span class="badge">ÉTABLISSEMENT</span>
        <p><strong>${user.name}</strong></p>
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>
    </div>

    <table class="stats-table">
      <tr>
        <td>
          <div class="label">Taux d'occupation</div>
          <div class="value">${occupancyRate}%</div>
          <div class="detail">${occupiedCount + reservedCount} chambres occupées/réservées sur ${activeRooms.length}</div>
        </td>
        <td>
          <div class="label">Revenu Réceptionné</div>
          <div class="value">${totalEarningsCollected.toLocaleString()} F</div>
          <div class="detail">Liquidités perçues par acomptes / soldes</div>
        </td>
        <td>
          <div class="label">Revenu Contractuel</div>
          <div class="value">${totalBookedValue.toLocaleString()} F</div>
          <div class="detail">Valeur globale des réservations signées</div>
        </td>
      </tr>
    </table>

    <h2>Parc Hôtelier des Chambres & Suites</h2>
    <table>
      <thead>
        <tr>
          <th>Numéro</th>
          <th>Type de Chambre</th>
          <th>Tarif Journalier</th>
          <th>Statut Actuel</th>
          <th>Équipements & Description</th>
        </tr>
      </thead>
      <tbody>
        ${activeRooms.map(room => `
          <tr>
            <td><strong>Chambre N° ${room.number}</strong></td>
            <td>${room.type}</td>
            <td><strong>${room.price.toLocaleString()} F</strong></td>
            <td>
              <span class="status-pill status-${room.status === 'Libre' ? 'libre' : room.status === 'Occupée' ? 'occupee' : room.status === 'Réservée' ? 'reservee' : 'maintenance'}">${room.status}</span>
            </td>
            <td>${room.description || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>Registre des Fiches de Réservations & Clients</h2>
    <table>
      <thead>
        <tr>
          <th>Client & Contact</th>
          <th>Désignation Chambre</th>
          <th>Période & Nuits</th>
          <th>Facturation</th>
          <th>Statut Séjour</th>
        </tr>
      </thead>
      <tbody>
        ${activeBookings.length === 0 ? `
          <tr>
            <td colspan="5" style="text-align: center; color: #888; font-style: italic; padding: 25px;">Aucune réservation enregistrée.</td>
          </tr>
        ` : activeBookings.map(b => `
          <tr>
            <td>
              <strong>${b.clientName}</strong><br>
              <small>${b.clientPhone || 'Pas de numéro'}</small>
            </td>
            <td>
              <strong>Chambre ${b.roomNumber}</strong><br>
              <small>${b.roomType}</small>
            </td>
            <td>
              <strong>${b.checkIn} ⟶ ${b.checkOut}</strong><br>
              <small>${b.nights} nuitées</small>
            </td>
            <td>
              <strong>${b.totalPrice.toLocaleString()} F</strong><br>
              <small>${b.paidAmount.toLocaleString()} F réglés (${b.paymentStatus === 'paid' ? 'Complet' : b.paymentStatus === 'partial' ? 'Acompte' : 'Non réglé'})</small>
            </td>
            <td>
              <span class="status-pill status-${(b.status || '').toLowerCase()}">${b.status}</span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>Bilan généré via l'application WeLink Administration Hôtelière - ${user.name}.</p>
      <p>© ${new Date().getFullYear()} WeLink. Document non contractuel.</p>
    </div>
  </div>
</body>
</html>`;
                  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `rapport-hotelier-${user.id}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Télécharger le rapport
              </button>
            </div>

          </div>
        )}

        {/* TAB B: ROOMS MODULE */}
        {adminTab === 'rooms' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Rooms Management Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">Gestion des Chambres du parc hôtelier</h2>
                  <span className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 font-mono text-[10px] text-slate-400">{activeRooms.length} insérées</span>
                </div>
                <button 
                  onClick={() => {
                    setEditingRoom(null);
                    setRoomNumberInput('');
                    setRoomPriceInput('');
                    setRoomDescInput('');
                    setRoomEquipInput('');
                    setRoomPhotoInput('');
                    setShowRoomModal(true);
                  }}
                  className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Ajouter une Chambre
                </button>
              </div>

              {/* Room List grid */}
              {activeRooms.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-dashed border-slate-850 p-6">
                  <p className="text-xs text-slate-400">Aucune chambre ajoutée.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeRooms.map(room => (
                    <div key={room.id} className="bg-slate-950/40 border border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between">
                      <div>
                        {/* Room Banner */}
                        <div className="w-full h-36 bg-slate-900 relative">
                          <img 
                            src={room.photos?.[0] || hotelBg} 
                            alt="Chambre"
                            className="w-full h-full object-cover select-none opacity-80"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span className="bg-black/95 text-white keep-white font-mono text-[10px] font-black px-2 py-0.5 rounded border border-slate-800">
                              Chambre N° {room.number}
                            </span>
                          </div>
                          <div className="absolute top-2.5 right-2.5">
                            <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full keep-white ${
                              room.status === 'Libre' ? 'bg-emerald-950 text-emerald-400' :
                              room.status === 'Occupée' ? 'bg-red-950 text-rose-455' :
                              room.status === 'Réservée' ? 'bg-blue-950 text-blue-400' :
                              'bg-amber-955 text-amber-300'
                            }`}>
                              {room.status}
                            </span>
                          </div>
                        </div>

                        {/* Info Body */}
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <strong className="text-slate-100">{room.type}</strong>
                            <span className="text-indigo-400 font-bold font-mono">{room.price.toLocaleString()} F / n</span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 line-clamp-2">{room.description || "Pas de description"}</p>
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-slate-900/30 mt-3 flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditRoomClick(room)}
                          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-2 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                          title="Éditer la chambre"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRoom(room.id)}
                          className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/45 p-2 rounded-lg text-red-400 transition cursor-pointer"
                          title="Retirer la chambre"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Room Categories Section (Merged!) */}
            <div className="pt-8 border-t border-slate-900 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Catégories de chambres hôtelières</h3>
                  <p className="text-[10px] text-slate-400">Définissez vos types de chambres, suites royales et tarifs de base.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingCategory(null);
                    setCatNameInput('');
                    setCatDescInput('');
                    setShowCategoryModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" /> Nouvelle Catégorie
                </button>
              </div>

              <div className="bg-slate-950/35 border border-slate-850 rounded-2xl overflow-hidden">
                <div className="divide-y divide-slate-900 text-xs text-left">
                  {hotelRoomCategories.filter(c => c.hotelId === user.id).length === 0 ? (
                    <div className="text-center py-6 text-slate-450 italic">Aucune catégorie enregistrée.</div>
                  ) : (
                    hotelRoomCategories.filter(c => c.hotelId === user.id).map(c => (
                      <div key={c.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/10">
                        <div>
                          <span className="font-bold text-slate-100 text-sm block">{c.name}</span>
                          <p className="text-slate-400 text-[11px] pt-0.5">{c.description || "Pas de description"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingCategory(c);
                              setCatNameInput(c.name);
                              setCatDescInput(c.description || '');
                              setShowCategoryModal(true);
                            }}
                            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-2 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(c.id)}
                            className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 p-2 rounded-lg text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB D: RESERVATIONS MODULE */}
        {adminTab === 'bookings' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3">
              <h2 className="text-sm font-black text-white uppercase tracking-tight">Fiches de réservations clients</h2>
              <div className="flex gap-2">
                {['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map(st => (
                  <button 
                    key={st}
                    onClick={() => setBookingFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                      bookingFilterStatus === st ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {st === 'all' ? 'Tous' : st === 'pending' ? 'Attentes' : st === 'confirmed' ? 'Confirmés' : st === 'checked_in' ? 'Check-In' : st === 'checked_out' ? 'Check-Out' : 'Annulés'}
                  </button>
                ))}
              </div>
            </div>

            {/* Reservations tabular summary view */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 uppercase font-bold text-[10px] text-slate-400 border-b border-slate-900">
                    <tr>
                      <th className="p-4">ID / Client</th>
                      <th className="p-4">Chambre / Dates</th>
                      <th className="p-4">Services / Code</th>
                      <th className="p-4">Montant / Paiement</th>
                      <th className="p-4">Satut / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-xs">
                    {(() => {
                      const list = activeBookings.filter(b => bookingFilterStatus === 'all' || b.status === bookingFilterStatus);
                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-slate-500 italic">Aucune fiche de réservation enregistrée.</td>
                          </tr>
                        );
                      }
                      return list.map(b => (
                        <tr key={b.id} className="hover:bg-slate-900/10">
                          <td className="p-4 space-y-1 whitespace-nowrap">
                            <span className="font-mono bg-slate-900 border border-slate-850 px-1.5 py-0.2 rounded text-[10.5px] text-indigo-400 font-extrabold block w-max">#{b.id}</span>
                            <strong className="block text-white font-bold">{b.clientName}</strong>
                            <span className="text-[10px] text-slate-450 block">{b.clientPhone}</span>
                          </td>
                          <td className="p-4 space-y-1">
                            <strong className="block text-slate-200">Chambre {b.roomNumber} ({b.roomType})</strong>
                            <span className="font-mono text-[10.5px] text-slate-400 block pb-0.5">{b.checkIn} ⟶ {b.checkOut} ({b.nights} nuits)</span>
                          </td>
                          <td className="p-4 space-y-1">
                            <span className="text-[10px] text-slate-350 block leading-relaxed">{b.additionalServices?.length > 0 ? b.additionalServices.join(', ') : 'Aucun'}</span>
                            {b.couponCode && (
                              <span className="bg-amber-950 text-amber-300 font-mono text-[9px] font-bold px-1.5 py-0.2 border border-amber-900/70 rounded">Coupon: {b.couponCode}</span>
                            )}
                          </td>
                          <td className="p-4 space-y-1">
                            <strong className="block text-indigo-400 font-mono font-black">{b.totalPrice.toLocaleString()} F</strong>
                            <div className="flex items-center gap-1 text-[9px] pt-0.5">
                              <span className={`px-1 rounded-full font-bold uppercase ${
                                b.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-400' :
                                b.paymentStatus === 'partial' ? 'bg-amber-955 text-amber-300' : 'bg-red-950 text-rose-455'
                              }`}>
                                {b.paymentStatus === 'paid' ? 'Complet' : b.paymentStatus === 'partial' ? 'Acompte' : 'Attente'}
                              </span>
                              <span className="text-slate-400 font-mono">({b.paidAmount.toLocaleString()} F réglés)</span>
                            </div>
                          </td>
                          <td className="p-4 space-y-1.5">
                            <span className={`text-[9.5px] font-black uppercase text-center px-2 py-0.5 rounded-full block w-max ${
                              b.status === 'confirmed' ? 'bg-blue-950 text-blue-400 border border-blue-900' :
                              b.status === 'checked_in' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                              b.status === 'checked_out' ? 'bg-slate-900 text-slate-500 border border-slate-800' :
                              b.status === 'cancelled' ? 'bg-red-950 text-rose-455 border border-red-900' :
                              'bg-amber-950/60 text-amber-400'
                            }`}>
                              {b.status}
                            </span>
                            
                            <div className="flex gap-2">
                              {b.status === 'confirmed' && (
                                <button 
                                  onClick={() => handleUpdateReservationStatus(b.id, { status: 'checked_in' })}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-1 rounded cursor-pointer"
                                >
                                  Check-In
                                </button>
                              )}
                              {b.status === 'checked_in' && (
                                <button 
                                  onClick={() => handleUpdateReservationStatus(b.id, { status: 'checked_out', paymentStatus: 'paid', paidAmount: b.totalPrice })}
                                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] px-2 py-1 rounded cursor-pointer"
                                >
                                  Check-Out
                                </button>
                              )}
                              <button 
                                onClick={() => setShowInvoicePrint(b)}
                                className="bg-slate-900 border border-slate-850 p-1 rounded hover:text-white"
                                title="Voir facture / Rédiger Reçu"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB E: MARKETING MODULE */}
        {adminTab === 'marketing' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* DYNAMIC FOMO COUNTDOWN BLOCK AS REQUESTED IN TICKETS */}
            {fomoActive && (
              <div className="bg-gradient-to-r from-red-950 via-orange-950 to-red-950 border-2 border-orange-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden animate-pulse">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="bg-red-800 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest inline-flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400 shrink-0" /> OFFRE ACTIVE MARKETING (FOMO)
                    </span>
                    <h3 className="font-extrabold text-white text-sm tracking-tight">{fomoTitle}</h3>
                    <p className="text-[10.5px] text-orange-200">Cette promotion encourage l'achat immédiat par l'effet de rareté sur la place de marché client.</p>
                  </div>

                  {/* Glowing warm Countdown timer widget */}
                  <div className="shrink-0 bg-black/50 p-3 rounded-2xl border border-red-500/20 flex items-center gap-3">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">Fin de l'offre :</span>
                    {/* Embedded dynamic countdown component */}
                    <CountdownTimer expiryDate={fomoExpiryDate} />
                  </div>
                </div>
              </div>
            )}
            
            {/* FOMO COUNTER SETUP CARD */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-900 pb-2">
                <h4 className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" /> Paramétrage de l'offre flash (Timer FOMO)
                </h4>
                <p className="text-[10.5px] text-slate-400">Réglez le titre de la promotion et le timer affiché en direct aux résidents.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[10.5px] text-slate-400 font-bold uppercase">Titre marketing de la vente flash</label>
                  <input 
                    type="text"
                    value={fomoTitle}
                    onChange={(e) => setFomoTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10.5px] text-slate-400 font-bold uppercase">Durée (Heures)</label>
                  <input 
                    type="number"
                    min={1}
                    value={fomoHoursLeft}
                    onChange={(e) => setFomoHoursLeft(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1"
                  />
                </div>
                <div className="sm:col-span-4 space-y-1 self-end flex gap-2 w-full">
                  <button 
                    onClick={() => {
                      const nextState = !fomoActive;
                      setFomoActive(nextState);
                      handleSaveFomo(nextState);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${fomoActive ? 'bg-red-950 border border-red-500 text-red-500 hover:bg-red-950/80' : 'bg-emerald-950 border border-emerald-500 text-emerald-400'}`}
                  >
                    {fomoActive ? 'Désactiver' : 'Activer'}
                  </button>
                  <button 
                    onClick={() => handleSaveFomo()}
                    disabled={savingFomo}
                    className="flex-1 bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {savingFomo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>

            {/* COUPONS CRUD BLOCK */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Coupons de réduction hôteliers configurés</h3>
                <button 
                  onClick={() => setShowCouponModal(true)}
                  className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] px-3.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Créer un coupon promo
                </button>
              </div>

              <div className="bg-slate-950/45 border border-slate-850 rounded-2xl overflow-hidden divide-y divide-slate-900 text-xs text-slate-300">
                {activeCoupons.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">Aucun coupon configuré pour l'instant.</p>
                ) : (
                  activeCoupons.map(cop => (
                    <div key={cop.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-white font-black text-sm">{cop.code}</span>
                        <p className="text-[10px] text-slate-400">
                          Réduction : <strong>-{cop.discountValue}{cop.discountType === 'percent' ? '%' : ' F'}</strong> sur le prix brut des nuitées
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteCoupon(cop.id)}
                        className="bg-red-900/10 hover:bg-red-900/30 text-rose-500 p-2 rounded border border-red-900/40 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB F: AUDIT LOGS MODULE */}
        {adminTab === 'logs' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3 flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-tight">Journaux et Traces d'activités hôtelières</h2>
                <p className="text-[10.5px] text-slate-400 pt-0.5">Retracez en direct toutes les assignations, modifications d'états hôteliers de l'établissement.</p>
              </div>
              <button
                onClick={handleDownloadLogsPDF}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Télécharger le journal d'audit
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-3xl p-5 font-mono text-[11px] leading-relaxed space-y-3.5 max-h-[500px] overflow-y-auto">
              {activeLogs.length === 0 ? (
                <p className="text-slate-500 text-center py-10">Aucune trace d'audit enregistrée.</p>
              ) : (
                activeLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 border-b border-slate-900 pb-3 last:border-0 last:pb-0">
                    <span className="text-slate-500 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <div>
                      <span className={`font-bold px-1.5 py-0.2 rounded ${
                        log.action.includes('RESERVATION') ? 'bg-indigo-950 text-indigo-400' :
                        log.action.includes('ROOM') ? 'bg-sky-955 bg-indigo-900 text-sky-400' : 'bg-slate-900 text-slate-400'
                      } mr-1.5 uppercase tracking-wide text-[9.5px]`}>
                        {log.action}
                      </span>
                      <span className="text-slate-355 text-slate-300">{log.details}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: ADD / UPDATE ROOMS FORM */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-850 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative flex flex-col justify-between">
            
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="font-extrabold text-sm text-white uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> {editingRoom ? 'Modifier la chambre' : 'Enregistrer une chambre'}
              </h3>
              <button onClick={() => setShowRoomModal(false)} className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 pt-4 flex-1 overflow-y-auto select-none">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Numéro Chambre *</label>
                  <input 
                    type="text"
                    required
                    value={roomNumberInput}
                    onChange={(e) => setRoomNumberInput(e.target.value)}
                    placeholder="Ex : 101"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Capacité Voyageur(s)</label>
                  <input 
                    type="number"
                    min={1}
                    value={roomCapacityInput}
                    onChange={(e) => setRoomCapacityInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Type d'Hébergement *</label>
                <select 
                  value={roomTypeInput}
                  onChange={(e) => setRoomTypeInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-505"
                >
                  <option value="Chambre Standard">Chambre Standard</option>
                  <option value="Chambre Double Confort">Chambre Double Confort</option>
                  <option value="Suite Présidentielle de Luxe">Suite Présidentielle de Luxe</option>
                  <option value="Salle de Conférence VIP">Salle de Conférence VIP</option>
                  {hotelRoomCategories.filter(c => c.hotelId === user.id).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Prix par Nuit (F CFA) *</label>
                <input 
                  type="number"
                  required
                  value={roomPriceInput}
                  onChange={(e) => setRoomPriceInput(e.target.value)}
                  placeholder="Ex : 35000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-510"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Lien Photo d'illustration (Optionnel)</label>
                <input 
                  type="url"
                  value={roomPhotoInput}
                  onChange={(e) => setRoomPhotoInput(e.target.value)}
                  placeholder="Ex : https://images.unsplash.com/..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-510"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Description hôtelière</label>
                <textarea 
                  value={roomDescInput}
                  onChange={(e) => setRoomDescInput(e.target.value)}
                  rows={2}
                  placeholder="Aménagement, literie Queen size, vue..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Équipements (Séparés par une virgule)</label>
                <input 
                  type="text"
                  value={roomEquipInput}
                  onChange={(e) => setRoomEquipInput(e.target.value)}
                  placeholder="Ex : Wi-Fi, Climatisation, Jacuzzi, Mini-bar"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">État Initial de la Chambre</label>
                <select 
                  value={roomStatusInput}
                  onChange={(e) => setRoomStatusInput(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1"
                >
                  <option value="Libre">Libre & Prête pour client</option>
                  <option value="Occupée">Occupée en séjour</option>
                  <option value="Réservée">Réservée d'avance</option>
                  <option value="Maintenance">En maintenance / Travaux de peinture</option>
                </select>
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-slate-900 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowRoomModal(false)}
                  className="bg-slate-900 hover:bg-slate-850 text-xs font-bold px-4 py-2 border border-slate-800 rounded-lg text-slate-400"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2 rounded-lg"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT CATEGORIES FORM */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-850 rounded-3xl w-full max-w-sm p-6 relative">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="font-extrabold text-sm text-white uppercase">{editingCategory ? "Modifier la catégorie" : "Déclarer une catégorie d'hébergement"}</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-405"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4 pt-4 select-none">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Intitulé de la catégorie *</label>
                <input 
                  type="text"
                  required
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="Ex : Suite Executive"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Descriptif hôtelier</label>
                <textarea 
                  value={catDescInput}
                  onChange={(e) => setCatDescInput(e.target.value)}
                  placeholder="Prestations associées, taille..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                ></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="bg-slate-900 hover:bg-slate-850 px-4 py-1.5 rounded-lg border border-slate-800 text-[11px] font-bold text-slate-400">Fermer</button>
                <button type="submit" className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-4 py-1.5 rounded-lg">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD COUPON IN MARKETING */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-850 rounded-3xl w-full max-w-sm p-6 relative">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="font-extrabold text-sm text-white uppercase">Créer un code promo</h3>
              <button onClick={() => setShowCouponModal(false)} className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-405"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveCoupon} className="space-y-4 pt-4 select-none">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">CODE COUPON (Majuscules) *</label>
                <input 
                  type="text"
                  required
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  placeholder="Ex : NOEL20"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-white focus:outline-none uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Type réduction</label>
                  <select 
                    value={couponTypeInput}
                    onChange={(e) => setCouponTypeInput(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="percent">Pourcentage (%)</option>
                    <option value="flat">Somme Fixe (F CFA)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Valeur réduction *</label>
                  <input 
                    type="number"
                    min={1}
                    value={couponValInput}
                    onChange={(e) => setCouponValInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCouponModal(false)} className="bg-slate-900 hover:bg-slate-850 px-4 py-1.5 rounded-lg border border-slate-800 text-[11px] font-bold text-slate-400">Annuler</button>
                <button type="submit" className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-4 py-1.5 rounded-lg">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: INVOICE GENERATOR PREVIEW FOR PRINTING FROM HOTEL ADMIN END */}
      {showInvoicePrint && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-lg shadow-2xl relative flex flex-col h-max overflow-hidden animate-fade-in">
            {/* Modal Actions Header */}
            <div className="bg-slate-950 p-4 flex justify-between items-center text-white shrink-0">
              <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Visualisation & Émission Facture client
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-[10.5px] font-bold tracking-wider flex items-center gap-1"
                >
                  Imprimer la pièce
                </button>
                <button 
                  onClick={() => setShowInvoicePrint(null)}
                  className="p-1 rounded-lg bg-slate-905 hover:bg-slate-805 text-slate-405 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invoice Layout ready for Print */}
            <div id="invoice-bill-print-frame" className="p-8 space-y-6 overflow-y-auto font-sans leading-relaxed text-xs">
              {/* Hotel Header info */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div className="space-y-1.5">
                  <span className="text-indigo-600 text-lg font-black tracking-tight">{showInvoicePrint.hotelName}</span>
                  <div className="text-[10px] text-slate-505 space-y-0.5">
                    <p>Douala / Yaoundé / Cameroun</p>
                    <p>Douala Akwa, Blvd de la Liberté</p>
                    <p>Email: contact@hotelresidence.com</p>
                    <p>Tél: {user.phone || "+237 650 02 34 02"}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">FACTURE DE PRESTATIONS</h4>
                  <p className="text-[10px] text-slate-500 font-mono">TOKEN: <strong className="text-slate-900 font-bold">{showInvoicePrint.id}</strong></p>
                  <p className="text-[9.5px] text-slate-500">Date d'édition : {new Date(showInvoicePrint.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Client specifications */}
              <div className="bg-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">DESTINATAIRE</span>
                  <strong className="text-slate-800 text-xs block">{showInvoicePrint.clientName}</strong>
                  <p className="text-[10.5px] text-slate-600">{showInvoicePrint.clientEmail}</p>
                  <p className="text-[10.5px] text-slate-600 font-mono">{showInvoicePrint.clientPhone}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">PROPRIÉTÉ ASSIGNÉE</span>
                  <strong className="text-slate-800 text-xs block">Chambre N° {showInvoicePrint.roomNumber}</strong>
                  <p className="text-[10.5px] text-slate-600 capitalize">Catégorie: {showInvoicePrint.roomType}</p>
                  <p className="text-[10.5px] text-slate-600 font-mono">Du {showInvoicePrint.checkIn} au {showInvoicePrint.checkOut}</p>
                </div>
              </div>

              {/* Billing Itemization Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 font-bold text-slate-600 uppercase text-[9px] border-b border-slate-300 pb-1.5 px-1">
                  <span className="col-span-6 text-left">Désignation de la prestation</span>
                  <span className="col-span-2 text-center">Tarif unitaire</span>
                  <span className="col-span-2 text-center">Multiplicateur</span>
                  <span className="col-span-2 text-right">Montant</span>
                </div>

                {/* Bedding rate */}
                <div className="grid grid-cols-12 text-slate-850 py-1.5 px-1 border-b border-slate-100 items-center">
                  <span className="col-span-6 font-semibold">Location chambre N° {showInvoicePrint.roomNumber} ({showInvoicePrint.roomType})</span>
                  <span className="col-span-2 text-center font-mono">{showInvoicePrint.basePrice.toLocaleString()} F</span>
                  <span className="col-span-2 text-center font-mono">{showInvoicePrint.nights} nuits</span>
                  <span className="col-span-2 text-right font-bold font-mono">{(showInvoicePrint.basePrice * showInvoicePrint.nights).toLocaleString()} F</span>
                </div>

                {/* Services details */}
                {showInvoicePrint.additionalServices && showInvoicePrint.additionalServices.length > 0 && (
                  <div className="grid grid-cols-12 text-indigo-600 py-1.5 px-1 border-b border-slate-100 items-center">
                    <span className="col-span-6 font-semibold">Consommations annexes choisies ({showInvoicePrint.additionalServices.join(', ')})</span>
                    <span className="col-span-2 text-center font-mono">-</span>
                    <span className="col-span-2 text-center font-mono">Forfait</span>
                    <span className="col-span-2 text-right font-bold font-mono">+{showInvoicePrint.servicesPrice.toLocaleString()} F</span>
                  </div>
                )}

                {/* Promo deduction */}
                {showInvoicePrint.discountAmount > 0 && (
                  <div className="grid grid-cols-12 text-amber-600 py-1.5 px-1 border-b border-slate-100 items-center">
                    <span className="col-span-6 font-semibold">Réduction Code promo hôtelier ({showInvoicePrint.couponCode || 'PROMOTIONAL'})</span>
                    <span className="col-span-2 text-center font-mono">-</span>
                    <span className="col-span-2 text-center font-mono">-</span>
                    <span className="col-span-2 text-right font-bold font-mono">-{showInvoicePrint.discountAmount.toLocaleString()} F</span>
                  </div>
                )}
              </div>

              {/* Total sum block */}
              <div className="space-y-1.5 pt-3 border-t-2 border-slate-350 flex flex-col items-end">
                <div className="flex justify-between w-48 text-[11px] font-bold text-slate-600">
                  <span>Montant brut :</span>
                  <span className="font-mono">{ (showInvoicePrint.basePrice * showInvoicePrint.nights + showInvoicePrint.servicesPrice).toLocaleString() } F</span>
                </div>
                {showInvoicePrint.discountAmount > 0 && (
                  <div className="flex justify-between w-48 text-[11px] font-bold text-amber-600">
                    <span>Réduction Code :</span>
                    <span className="font-mono">-{showInvoicePrint.discountAmount.toLocaleString()} F</span>
                  </div>
                )}
                <div className="flex justify-between w-48 text-xs font-black border-t border-slate-300 pt-1 text-indigo-600 uppercase">
                  <span>Montant Net global :</span>
                  <span className="font-mono">{showInvoicePrint.totalPrice.toLocaleString()} F CFA</span>
                </div>
                <div className="flex justify-between w-48 text-[11px] text-emerald-600 font-bold border-t border-dashed border-slate-300 pt-1">
                  <span>Somme Encaissée hôtelier :</span>
                  <span className="font-mono">{showInvoicePrint.paidAmount.toLocaleString()} F</span>
                </div>
              </div>

              {/* Signature stamp */}
              <div className="border-t border-slate-200 pt-5 flex items-center justify-between text-[9.5px] text-slate-505">
                <div>
                  <p className="font-bold uppercase text-slate-700">CANAL DE TRANSACTON VALIDÉ</p>
                  <p className="font-mono">Règlement : {showInvoicePrint.paymentMethod?.toUpperCase() || 'MOBILE_MONEY'}</p>
                </div>
                <div className="text-center p-3 border-2 border-dashed border-emerald-500 text-emerald-600 font-black tracking-widest rounded-xl rotate-3 uppercase">
                  PAYÉ EN LIGNE ✔️
                </div>
              </div>
            </div>

            {/* Print Footer */}
            <div className="bg-slate-100 p-3.5 text-center text-[10px] text-slate-500 shrink-0 border-t border-slate-200">
              Certifié conforme par les directions financières de {showInvoicePrint.hotelName}.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
