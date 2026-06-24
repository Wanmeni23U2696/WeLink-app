import React, { useState } from 'react';
import { HotelRoom, HotelReservation, HotelCoupon, UserProfile } from '../types';
import { 
  Calendar, ShieldCheck, CreditCard, Sparkles, Coffee, Trash2, Check, 
  Download, AlertTriangle, Clock, MapPin, Tag, Plus, CheckCircle2, 
  Info, Flame, ChevronRight, X, Printer, HelpCircle, Phone, ArrowLeft, Loader2
} from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import hotelBg from '../assets/images/boutique_hotel_luxurious_bg_1781016397633.png';

interface HotelClientPortalProps {
  hotel: UserProfile;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  hotelRooms: HotelRoom[];
  hotelReservations: HotelReservation[];
  hotelCoupons: HotelCoupon[];
  hotelFomoSettings?: any[];
  onRefreshState: () => void;
  onBack: () => void;
}

export default function HotelClientPortal({
  hotel,
  clientId,
  clientName,
  clientEmail,
  clientPhone,
  hotelRooms,
  hotelReservations,
  hotelCoupons,
  hotelFomoSettings = [],
  onRefreshState,
  onBack
}: HotelClientPortalProps) {
  const [activePortalTab, setActivePortalTab] = useState<'rooms' | 'bookings' | 'offers'>('rooms');
  
  const currentFomo = hotelFomoSettings?.find(s => s.hotelId === hotel.id);
  const isFomoActive = currentFomo && currentFomo.active;
  
  // Date selection states for checking general availability
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [checkInDate, setCheckInDate] = useState<string>(todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowStr);
  const [dateFilterActive, setDateFilterActive] = useState<boolean>(false);

  // Booking Modal Flow States
  const [selectedRoomToBook, setSelectedRoomToBook] = useState<HotelRoom | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<HotelCoupon | null>(null);
  const [couponError, setCouponError] = useState<string>('');
  
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card' | 'transfer' | 'cash'>('mobile_money');
  const [mobileNumber, setMobileNumber] = useState<string>(clientPhone || '');
  const [cardNumber, setCardNumber] = useState<string>('');
  
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<HotelReservation | null>(null);

  // Active printing/viewing Invoice Modal State
  const [invoiceToView, setInvoiceToView] = useState<HotelReservation | null>(null);

  // Standard hotel services catalog
  const servicesCatalog = [
    { id: 'restaurant', name: 'Restaurant (Pension complète)', price: 12000, desc: 'Menu 3 services préparé par notre Chef local.', unit: 'jour' },
    { id: 'bar', name: 'Bar & Cocktail lounge access', price: 6000, desc: 'Crédit boisson et accès gratuit au bar VIP.', unit: 'jour' },
    { id: 'piscine', name: 'Accès Piscine Olympique', price: 4000, desc: 'Serviette, transat et cocktail de bienvenue compris.', unit: 'séjour' },
    { id: 'conf', name: 'Salle de Conférence VIP', price: 45000, desc: 'Location journalière d\'un espace de cotravail privatisable.', unit: 'jour' },
    { id: 'blanchisserie', name: 'Service Blanchisserie Express', price: 3000, desc: 'Lavage et repassage de 5 vêtements livrés le jour même.', unit: 'service' },
    { id: 'transport', name: 'Navette Aéroport Aller-Retour', price: 10000, desc: 'Véhicule climatisé privé avec chauffeur professionnel.', unit: 'trajet' },
    { id: 'spa', name: 'Espace Bien-être & Spa', price: 15000, desc: 'Massage relaxant de 60 mins aux huiles essentielles de karité.', unit: 'séance' }
  ];

  // Helper validation: Check if dates overlap with ANY already booked dates of a room
  const checkRoomAvailability = (roomId: string, start: string, end: string): boolean => {
    if (!start || !end) return true;
    const reqStart = new Date(start);
    const reqEnd = new Date(end);
    if (reqStart >= reqEnd) return false;

    // Find overlapping reservations
    const overlaps = hotelReservations.some(res => {
      if (res.roomId !== roomId || res.status === 'cancelled') return false;
      const resStart = new Date(res.checkIn);
      const resEnd = new Date(res.checkOut);
      return (reqStart < resEnd && reqEnd > resStart);
    });

    return !overlaps;
  };

  // Duration calculated in nights
  const calculateNightsCount = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff <= 0) return 1;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Open booking screen
  const handleOpenBooking = (room: HotelRoom) => {
    setSelectedRoomToBook(room);
    setSelectedServices([]);
    setCouponInput('');
    setAppliedCoupon(null);
    setCouponError('');
    setPaymentOption('full');
    setPaymentMethod('mobile_money');
    setBookingSuccessData(null);
  };

  // Try applying coupon
  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponInput) return;
    const codeUpper = couponInput.trim().toUpperCase();
    const matched = hotelCoupons.find(c => c.code === codeUpper && c.active && c.hotelId === hotel.id);
    if (matched) {
      setAppliedCoupon(matched);
      setCouponError('');
    } else {
      setAppliedCoupon(null);
      setCouponError('Code promotionnel invalide ou expiré pour cet hôtel.');
    }
  };

  // Pricing calculations
  const compileRates = (room: HotelRoom) => {
    const numNights = calculateNightsCount(checkInDate, checkOutDate);
    const rawRoomCost = room.price * numNights;
    
    // Services pricing
    let svCosts = 0;
    selectedServices.forEach(srvId => {
      const match = servicesCatalog.find(s => s.id === srvId);
      if (match) {
        if (match.unit === 'jour') {
          svCosts += match.price * numNights;
        } else {
          svCosts += match.price;
        }
      }
    });

    // Discount
    let discVal = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percent') {
        discVal = Math.round(rawRoomCost * (appliedCoupon.discountValue / 100));
      } else {
        discVal = Math.min(appliedCoupon.discountValue, rawRoomCost);
      }
    }

    const ultimatePrice = rawRoomCost + svCosts - discVal;
    const depositRequired = paymentOption === 'partial' ? Math.round(ultimatePrice * 0.3) : ultimatePrice;

    return {
      numNights,
      rawRoomCost,
      svCosts,
      discVal,
      ultimatePrice,
      depositRequired
    };
  };

  // Submit reserve request
  const handleConfirmReservation = async () => {
    if (!selectedRoomToBook) return;
    const rates = compileRates(selectedRoomToBook);
    
    setBookingInProgress(true);
    try {
      const payload = {
        hotelId: hotel.id,
        hotelName: hotel.name,
        clientId,
        clientName,
        clientEmail,
        clientPhone,
        roomId: selectedRoomToBook.id,
        roomNumber: selectedRoomToBook.number,
        roomType: selectedRoomToBook.type,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights: rates.numNights,
        basePrice: selectedRoomToBook.price,
        additionalServices: selectedServices,
        servicesPrice: rates.svCosts,
        couponCode: appliedCoupon?.code || undefined,
        discountAmount: rates.discVal,
        totalPrice: rates.ultimatePrice,
        paymentStatus: paymentOption === 'full' ? 'paid' : 'partial',
        paymentMethod,
        paidAmount: rates.depositRequired,
        status: 'confirmed'
      };

      const res = await fetch('/api/hotel/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const body = await res.json();
        setBookingSuccessData(body.reservation);
        onRefreshState(); // refresh App db state
      } else {
        const errData = await res.json();
        alert(errData.error || "Erreur de réservation.");
      }
    } catch (e) {
      console.error(e);
      alert("Une erreur de communication est survenue.");
    } finally {
      setBookingInProgress(false);
    }
  };

  // Handle Cancellation
  const handleCancelReservation = async (reservationId: string) => {
    const confirmChoice = window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ? Conforme aux règles, des frais d'annulation tardive de 5% calculés sur l'acompte s'appliquent s'il reste moins de 24h.");
    if (!confirmChoice) return;

    try {
      const res = await fetch(`/api/hotel/reservations/${reservationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', paymentStatus: 'pending' })
      });

      if (res.ok) {
        onRefreshState();
      } else {
        alert("Impossible d'annuler la réservation.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cover Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 p-6 md:p-8">
        <img 
          src={hotelBg} 
          alt="Hotel Banner" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 select-none pointer-events-none" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <button 
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-bold hover:text-indigo-300 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Retour à la place de marché
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-950/80 text-blue-400 border border-blue-900 px-2 py-0.5 rounded-full font-mono text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                🏨 Établissement Hôtelier Agréé
              </span>
              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded-full font-sans text-[9px] font-bold">
                ✓ Réservation Instantanée
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{hotel.name}</h1>
            <p className="text-xs text-slate-300 max-w-2xl">{hotel.description || "Un cadre haut standing, idéal pour des séjours personnalisés."}</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-405 pt-1.5">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-500" /> {hotel.address || "Akwa, Douala"}</span>
              {hotel.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {hotel.phone}</span>}
            </div>
          </div>

          <div className="flex md:flex-col gap-2 shrink-0">
            <button 
              onClick={() => setActivePortalTab('rooms')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activePortalTab === 'rooms' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-850'}`}
            >
              <Calendar className="w-4 h-4" /> Réserver une chambre
            </button>
            <button 
              onClick={() => setActivePortalTab('bookings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${activePortalTab === 'bookings' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-850'}`}
            >
              <Clock className="w-4 h-4" /> Mes Réservations
              {hotelReservations.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-extrabold text-[9.5px] px-1.5 py-0.2 rounded-full border border-slate-900">
                  {hotelReservations.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {isFomoActive && currentFomo && (
        <div className="relative rounded-3xl overflow-hidden border border-red-500/20 bg-gradient-to-r from-red-950/40 via-slate-950 to-slate-950 p-5 shadow-2xl shadow-red-950/50">
          <div className="absolute inset-0 bg-radial-gradient(circle_at_30%_20%,_rgba(239,68,68,0.06),_transparent_60%)"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 bg-red-950/80 border border-red-500/30 text-red-400 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse shrink-0" /> Offre Flash Exclusive (Temps Limité !)
              </div>
              <h3 className="font-extrabold text-white text-base tracking-tight">{currentFomo.title}</h3>
              <p className="text-xs text-slate-400">Le décompte a commencé ! Utilisez un code coupon hôtelier valide au moment de réserver pour en profiter.</p>
            </div>

            <div className="shrink-0 bg-black/60 px-4 py-2.5 rounded-2xl border border-red-500/20 flex items-center gap-3">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">Fin de l'offre :</span>
              {/* Jitter-free countdown timer */}
              <CountdownTimer expiryDate={currentFomo.expiryDate} onExpired={onRefreshState} />
            </div>
          </div>
        </div>
      )}

      {/* Date Search Filter Strip */}
      {activePortalTab === 'rooms' && (
        <div className="bg-slate-950/45 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-405 tracking-wider">Date d'Arrivée</label>
              <div className="relative">
                <input 
                  type="date" 
                  min={todayStr}
                  value={checkInDate}
                  onChange={(e) => {
                    setCheckInDate(e.target.value);
                    setDateFilterActive(true);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="text-slate-600 self-center hidden md:block pt-3">⟶</div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-405 tracking-wider">Date de Départ</label>
              <div className="relative font-mono">
                <input 
                  type="date" 
                  min={checkInDate || todayStr}
                  value={checkOutDate}
                  onChange={(e) => {
                    setCheckOutDate(e.target.value);
                    setDateFilterActive(true);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Durée estimée</span>
              <span className="text-xs font-black text-indigo-400 font-mono">{calculateNightsCount(checkInDate, checkOutDate)} Nuitée(s)</span>
            </div>
            {dateFilterActive && (
              <button 
                onClick={() => {
                  setCheckInDate(todayStr);
                  setCheckOutDate(tomorrowStr);
                  setDateFilterActive(false);
                }}
                className="text-[10.5px] font-bold text-slate-500 hover:text-slate-350 underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}

      {/* PORTAL CONTENT: NOS CHAMBRES DISPONIBLES */}
      {activePortalTab === 'rooms' && (
        <div className="space-y-4">
          <div className="border-b border-slate-900 pb-2 flex justify-between items-center">
            <h2 className="text-md font-bold text-white flex items-center gap-1.5">
              <span>Chambres, Suites & Salles {dateFilterActive && <span className="text-xs text-indigo-405 font-medium italic">(Filtre Disponibilité Actif)</span>}</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{hotelRooms.length} Hébergement(s)</span>
          </div>

          {hotelRooms.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-dashed border-slate-850 p-6">
              <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">Cet hôtel n'a enregistré aucune chambre pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotelRooms.map(room => {
                const isAvailable = checkRoomAvailability(room.id, checkInDate, checkOutDate);
                const hasMaintenance = room.status === 'Maintenance';
                
                return (
                  <div 
                    key={room.id}
                    className={`bg-slate-950/40 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                      hasMaintenance 
                        ? 'border-slate-900/60 opacity-60' 
                        : !isAvailable 
                        ? 'border-rose-950/50 bg-rose-950/5' 
                        : 'border-slate-850 hover:border-indigo-500/30'
                    }`}
                  >
                    <div>
                      {/* Room Photo */}
                      <div className="w-full h-40 bg-slate-900 overflow-hidden relative">
                        <img 
                          src={room.photos?.[0] || hotelBg} 
                          alt={`Chambre ${room.number}`}
                          className="w-full h-full object-cover select-none"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                          <span className="bg-black/80 backdrop-blur-md text-white keep-white font-mono text-[10px] font-black px-2 py-0.5 rounded border border-slate-800">
                            N° {room.number}
                          </span>
                        </div>

                        {/* Overlap Availability Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          {hasMaintenance ? (
                            <span className="bg-amber-955 text-amber-300 font-sans font-bold text-[9px] px-2 py-0.5 rounded-full capitalize">
                              🛠 Maintenance
                            </span>
                          ) : !isAvailable ? (
                            <span className="bg-rose-955 text-white keep-white bg-red-650 font-mono font-bold text-[9px] px-2 py-0.5 rounded-full">
                              ⚠ Déjà Réservée
                            </span>
                          ) : (
                            <span className="bg-emerald-950/90 text-emerald-400 border border-emerald-900/80 font-sans font-bold text-[9px] px-2 py-0.5 rounded-full">
                              ✓ Libre & Disponible
                            </span>
                          )}
                        </div>

                        {/* Capacity Mask */}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-slate-205 font-medium">
                          Capacité : <strong className="text-white keep-white">{room.capacity} voyageur(s)</strong>
                        </div>
                      </div>

                      {/* Room Specs */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-100">{room.type}</h3>
                          <span className="text-xs font-mono font-bold text-indigo-400">{room.price.toLocaleString()} F / nuit</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{room.description || "Aucune description fournie pour cet hébergement."}</p>
                        
                        {/* Equipments Tags */}
                        {room.equipments && room.equipments.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {room.equipments.map((eq, i) => (
                              <span key={i} className="text-[9px] bg-slate-900/80 text-slate-350 border border-slate-850 px-1.5 py-0.5 rounded">
                                {eq}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-slate-900/40 mt-3">
                      {hasMaintenance ? (
                        <button 
                          disabled
                          className="w-full text-center bg-slate-900 text-slate-600 text-xs font-bold py-2 rounded-xl cursor-not-allowed"
                        >
                          Indisponible pour travaux
                        </button>
                      ) : !isAvailable ? (
                        <div className="space-y-2">
                          <button 
                            disabled
                            className="w-full text-center bg-red-950/30 text-rose-500 border border-rose-950/60 text-xs font-bold py-2 rounded-xl cursor-not-allowed"
                          >
                            Non disponible pour ces dates
                          </button>
                          <span className="block text-[8.5px] text-center text-slate-500 italic">Essayez d'ajuster les dates de séjour ci-dessus.</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleOpenBooking(room)}
                          className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-xl hover:shadow-[0_0_12px_rgba(79,70,229,0.3)] transition duration-200 cursor-pointer"
                        >
                          Réserver cet Hébergement
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

      {/* PORTAL CONTENT: MES RESERVATIONS */}
      {activePortalTab === 'bookings' && (
        <div className="space-y-4">
          <div className="border-b border-slate-900 pb-2">
            <h2 className="text-sm font-bold text-white">Votre historique de réservations de chambres</h2>
          </div>

          {hotelReservations.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/20 rounded-2xl border border-dashed border-slate-850 p-6">
              <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-semibold">Aucune réservation active ou passée enregistrée dans cet établissement.</p>
              <button 
                onClick={() => setActivePortalTab('rooms')}
                className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
              >
                Parcourir les chambres
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {hotelReservations.map(res => {
                const isCancelled = res.status === 'cancelled';
                const isConfirmed = res.status === 'confirmed';
                const isCheckedIn = res.status === 'checked_in';
                const isCheckedOut = res.status === 'checked_out';

                return (
                  <div 
                    key={res.id}
                    className={`bg-slate-950/40 border rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition duration-250 ${
                      isCancelled ? 'border-slate-900/60 opacity-60 bg-slate-950/15' : 'border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] bg-slate-900 border border-slate-800 font-mono text-slate-400 font-black px-2 py-0.5 rounded">
                          RÉSER. #{res.id}
                        </span>

                        {/* Status Badges */}
                        {isCancelled && (
                          <span className="bg-red-955 text-red-400 border border-red-900/50 text-[9px] px-2 py-0.5 rounded-full uppercase font-bold font-mono">
                            Annulée
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="bg-blue-950 text-blue-400 border border-blue-900/50 text-[9px] px-2 py-0.5 rounded-full uppercase font-bold font-mono animate-pulse">
                            Confirmée
                          </span>
                        )}
                        {isCheckedIn && (
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/50 text-[9px] px-2 py-0.5 rounded-full uppercase font-bold font-mono">
                            En séjour (Arrivée d'ores et déjà enregistrée)
                          </span>
                        )}
                        {isCheckedOut && (
                          <span className="bg-slate-900 text-slate-505 border border-slate-800 text-[9px] px-2 py-0.5 rounded-full uppercase font-bold font-mono">
                            Séjour Terminé (Checkout)
                          </span>
                        )}

                        {/* Payment Status Badges */}
                        {res.paymentStatus === 'paid' ? (
                          <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-950 px-1.5 py-0.2 rounded font-sans text-[8.5px] font-extrabold capitalize">
                            Paiement Complet
                          </span>
                        ) : res.paymentStatus === 'partial' ? (
                          <span className="bg-amber-955 text-amber-400 border border-amber-900/60 px-1.5 py-0.2 rounded font-sans text-[8.5px] font-extrabold capitalize">
                            Acompte versé 30%
                          </span>
                        ) : (
                          <span className="bg-slate-900 text-rose-455 border border-red-900 px-1.5 py-0.2 rounded font-sans text-[8.5px] font-extrabold capitalize">
                            En attente de paiement
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                        <div>
                          <span className="text-[9.5px] text-slate-500 block uppercase font-bold">Chambre</span>
                          <span className="text-xs font-bold text-white">Chambre N° {res.roomNumber} ({res.roomType})</span>
                        </div>
                        <div>
                          <span className="text-[9.5px] text-slate-500 block uppercase font-bold">Séjour</span>
                          <span className="text-xs font-bold text-slate-200 font-mono">Du {res.checkIn} au {res.checkOut} ({res.nights} n.)</span>
                        </div>
                        <div>
                          <span className="text-[9.5px] text-slate-500 block uppercase font-bold">Services Optionnels</span>
                          <span className="text-xs font-medium text-indigo-300">
                            {res.additionalServices?.length > 0 ? res.additionalServices.join(', ') : 'Aucun'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9.5px] text-slate-500 block uppercase font-bold">Montant Global</span>
                          <span className="text-xs font-black text-rose-400 font-mono">{res.totalPrice.toLocaleString()} F CFA</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => setInvoiceToView(res)}
                        className="bg-slate-900 hover:bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-205 hover:text-white text-[11px] font-bold tracking-wide transition flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-400" /> Facture / Reçu
                      </button>

                      {isConfirmed && (
                        <button 
                          onClick={() => handleCancelReservation(res.id)}
                          className="bg-red-950/20 hover:bg-red-950/50 border border-red-900/50 text-red-400 px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Annuler la réservation
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

      {/* BOOKING FLOW MODAL */}
      {selectedRoomToBook && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-850 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            
            {/* Header */}
            <div className="border-b border-slate-900 p-5 flex justify-between items-center bg-slate-900/20">
              <div>
                <h3 className="font-extrabold text-md text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Réservation de la chambre N° {selectedRoomToBook.number}</span>
                </h3>
                <p className="text-[10.5px] text-indigo-305 font-mono">Type : {selectedRoomToBook.type} • {selectedRoomToBook.price.toLocaleString()} F CFA / nuit</p>
              </div>
              <button 
                onClick={() => setSelectedRoomToBook(null)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-405 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form */}
            {!bookingSuccessData ? (
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Dates Recap */}
                <div className="bg-indigo-950/15 border border-indigo-900/40 rounded-2xl p-4.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <div>
                      <span className="text-[10px] text-slate-405 block uppercase tracking-wider font-bold">Séjour Hôtelier Planifié</span>
                      <span className="text-xs font-bold text-white font-mono">Du {checkInDate} au {checkOutDate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Total</span>
                    <span className="text-xs font-black text-indigo-400 font-mono">{calculateNightsCount(checkInDate, checkOutDate)} nuitée(s)</span>
                  </div>
                </div>

                {/* Services additionnels */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                    <Coffee className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Services supplémentaires optionnels</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {servicesCatalog.map(srv => {
                      const isSelected = selectedServices.includes(srv.name);
                      return (
                        <div 
                          key={srv.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedServices(prev => prev.filter(x => x !== srv.name));
                            } else {
                              setSelectedServices(prev => [...prev, srv.name]);
                            }
                          }}
                          className={`border rounded-xl p-3 cursor-pointer transition flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-emerald-950/15 border-emerald-500/50 shadow-inner' 
                              : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/75'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-white block">{srv.name}</span>
                            <p className="text-[9.5px] text-slate-400 leading-tight">{srv.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-emerald-400 block">+{srv.price.toLocaleString()} F</span>
                            <span className="text-[8px] text-slate-500">par {srv.unit === 'jour' ? 'nuit' : srv.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coupon Code Block */}
                <div className="space-y-2.5 bg-slate-900/30 border border-slate-850 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-amber-500" /> Appliquer un code coupon / réduction</span>
                    <span className="text-[9.5px] text-slate-405 font-mono">Ex : WELCOME10, FLASH30, VIP50</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Saisir le code coupon"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1 uppercase"
                    />
                    <button 
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-white px-4 rounded-xl font-bold cursor-pointer transition"
                    >
                      Appliquer
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10.5px] font-black">
                      <Check className="w-3.5 h-3.5" /> Coupon validé : -{appliedCoupon.discountValue}{appliedCoupon.discountType === 'percent' ? '%' : ' F'} appliqué sur les nuitées de chambre !
                    </div>
                  )}
                  {couponError && (
                    <div className="text-rose-400 text-[10.5px] font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {couponError}
                    </div>
                  )}
                </div>

                {/* Online Payment Setup */}
                <div className="space-y-3.5 bg-slate-900/40 border border-slate-850 rounded-2xl p-4.5">
                  <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Acompte & Moyen de paiement en ligne</h4>
                  </div>

                  {/* Payment Type */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wide block">Formule de règlement</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setPaymentOption('full')}
                        className={`py-2 rounded-xl text-xs font-bold text-center border transition ${paymentOption === 'full' ? 'bg-indigo-605 bg-indigo-900 text-white border-indigo-500' : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900'}`}
                      >
                        Paiement Intégral (100%)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentOption('partial')}
                        className={`py-2 rounded-xl text-xs font-bold text-center border transition ${paymentOption === 'partial' ? 'bg-indigo-605 bg-indigo-900 text-white border-indigo-500' : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900'}`}
                      >
                        Acompte Partiel (30%)
                      </button>
                    </div>
                  </div>

                  {/* Payment Operator Choice */}
                  <div className="space-y-1.5 pt-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wide block">Sélectionnez le canal de paiement</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'mobile_money', label: '📱 Mobile Money (MoMo, OM)' },
                        { id: 'card', label: '💳 Carte Bancaire (Visa)' },
                        { id: 'transfer', label: '🏦 Virement' },
                        { id: 'cash', label: '🏨 À la réception' }
                      ].map((item) => (
                        <button 
                          key={item.id}
                          type="button"
                          onClick={() => setPaymentMethod(item.id as any)}
                          className={`py-2 px-1.5 rounded-xl text-[10px] sm:text-xs font-bold text-center border transition ${paymentMethod === item.id ? 'bg-emerald-950 text-emerald-400 border-emerald-500' : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* payment inputs helper fields */}
                  {paymentMethod === 'mobile_money' && (
                    <div className="space-y-1 pt-1 animate-fade-in">
                      <label className="text-[10px] text-slate-405 font-bold uppercase tracking-wide">Numéro de téléphone pour prélèvement direct SMS confirmation</label>
                      <input 
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="Ex: +225 07 11 22 33 44"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-[9px] text-slate-505 block italic">Vous recevrez une invite USSD automatique sur votre mobile pour valider la transaction.</span>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-1 pt-1 animate-fade-in">
                      <label className="text-[10px] text-slate-405 font-bold uppercase tracking-wide">Numéro de Carte de crédit (Simulé)</label>
                      <input 
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 •••• •••• 4242"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>

                {/* Final Price Breakdown Card Summary */}
                {(() => {
                  const rates = compileRates(selectedRoomToBook);
                  return (
                    <div className="bg-slate-900 text-slate-200 rounded-2xl p-4.5 border border-slate-850 space-y-2 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-850 text-xs font-black uppercase tracking-wider text-white">
                        <span>Détail de la facturation</span>
                        <span>F CFA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Chambre {selectedRoomToBook.number} (Standard rate) ({rates.numNights} nuitées)</span>
                        <span className="font-mono">{rates.rawRoomCost.toLocaleString()} F</span>
                      </div>
                      {rates.svCosts > 0 && (
                        <div className="flex justify-between items-center text-indigo-400">
                          <span>Services de conciergerie inclus</span>
                          <span className="font-mono">+{rates.svCosts.toLocaleString()} F</span>
                        </div>
                      )}
                      {rates.discVal > 0 && (
                        <div className="flex justify-between items-center text-amber-400">
                          <span>Réduction coupon</span>
                          <span className="font-mono">-{rates.discVal.toLocaleString()} F</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-850 text-indigo-400 text-sm font-black text-rose-455">
                        <span className="text-white">Prix Total Net</span>
                        <span className="font-mono text-white text-md">{(rates.ultimatePrice).toLocaleString()} F CFA</span>
                      </div>

                      {/* deposit status */}
                      {paymentOption === 'partial' && (
                        <div className="bg-amber-955/20 border border-amber-900/40 text-[10.5px] p-2 rounded-xl text-amber-300 font-bold flex justify-between items-center">
                          <span>Acompte de 30% requis à régler en ligne :</span>
                          <span className="font-mono text-xs">{rates.depositRequired.toLocaleString()} F</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Success screen after booking successfully! */
              <div className="p-8 text-center space-y-6 flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500/80 text-emerald-400 flex items-center justify-center animate-bounce shadow-lg shadow-emerald-950/40">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-white">Réservation validée au {hotel.name} !</h4>
                  <p className="text-xs text-slate-350 max-w-md mx-auto">Votre demande de réservation hôtelière a été enregistrée de manière automatique avec succès. Votre contrat de séjour et votre reçu de paiement sont d'ores et déjà disponibles pour téléchargement et consultation.</p>
                </div>

                {/* Simulated notifications alerts */}
                <div className="bg-slate-900/85 border border-slate-855 rounded-2xl p-4 w-full text-left max-w-md space-y-2.5">
                  <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" /> Logs des notifications directes
                  </div>
                  <div className="text-[10px] text-slate-350 font-mono space-y-1">
                    <p className="text-emerald-400">✓ SMTP : Mail de confirmation automatique transmis à {clientEmail}.</p>
                    <p className="text-sky-350">✓ SMS GATEWAY : Alerte envoyée sur {mobileNumber || clientPhone} pour le check-in du {checkInDate}.</p>
                    <p className="text-indigo-400">✓ AUDIT LOG : Token hôtelier #{bookingSuccessData.id} inscrit sur les serveurs de la résidence.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setInvoiceToView(bookingSuccessData);
                      setSelectedRoomToBook(null);
                    }}
                    className="bg-indigo-650 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Voir Facture & Reçu
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedRoomToBook(null);
                      setActivePortalTab('bookings');
                    }}
                    className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Fermer la fenêtre
                  </button>
                </div>
              </div>
            )}

            {/* Footer containing trigger cancel/confirm buttons */}
            {!bookingSuccessData && (
              <div className="border-t border-slate-900 p-4.5 bg-slate-900/10 flex justify-between items-center">
                <button 
                  type="button"
                  onClick={() => setSelectedRoomToBook(null)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-bold px-4 py-2 rounded-xl text-slate-400 transition"
                >
                  Fermer
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmReservation}
                  disabled={bookingInProgress}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold px-5 py-2 rounded-xl hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition cursor-pointer flex items-center gap-2"
                >
                  {bookingInProgress ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Règlement de l'acompte...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmer & Payer l'Acompte</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* PRINTABLE BEAUTIFUL INVOICE MODEL MODAL */}
      {invoiceToView && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-lg shadow-2xl relative flex flex-col h-max overflow-hidden animate-fade-in">
            {/* Modal Actions Header */}
            <div className="bg-slate-950 p-4 flex justify-between items-center text-white shrink-0">
              <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Visualiseur Document hôtelier (Impression PDF)
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-[10.5px] font-bold tracking-wider flex items-center gap-1"
                >
                  Imprimer
                </button>
                <button 
                  onClick={() => setInvoiceToView(null)}
                  className="p-1 rounded-lg bg-slate-905 hover:bg-slate-805 text-slate-405 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Structured Receipt Layout Ready for Print */}
            <div id="invoice-bill-print-frame" className="p-8 space-y-6 overflow-y-auto font-sans leading-relaxed text-xs">
              {/* Hotel Header info */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div className="space-y-1.5">
                  <span className="text-indigo-600 text-lg font-black tracking-tight">{invoiceToView.hotelName}</span>
                  <div className="text-[10px] text-slate-505 space-y-0.5">
                    <p>Douala / Yaoundé / Cameroun</p>
                    <p>Douala Akwa, Blvd de la Liberté</p>
                    <p>Email: contact@hotelresidence.com</p>
                    <p>Tél: {hotel.phone || "+237 650 02 34 02"}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">FACTURE DE SÉJOUR</h4>
                  <p className="text-[10px] text-slate-500 font-mono">CODE: <strong className="text-slate-900 font-bold">{invoiceToView.id}</strong></p>
                  <p className="text-[9.5px] text-slate-500">Date d'édition : {new Date(invoiceToView.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Client specifications */}
              <div className="bg-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">TITULAIRE DE RÉSERVATION</span>
                  <strong className="text-slate-800 text-xs block">{invoiceToView.clientName}</strong>
                  <p className="text-[10.5px] text-slate-600">{invoiceToView.clientEmail}</p>
                  <p className="text-[10.5px] text-slate-600 font-mono">{invoiceToView.clientPhone}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">SPÉCIFICATIONS SÉJOUR</span>
                  <strong className="text-slate-800 text-xs block">Chambre N° {invoiceToView.roomNumber}</strong>
                  <p className="text-[10.5px] text-slate-600 capitalize">Catégorie: {invoiceToView.roomType}</p>
                  <p className="text-[10.5px] text-slate-600 font-mono">Du {invoiceToView.checkIn} au {invoiceToView.checkOut}</p>
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
                  <span className="col-span-6 font-semibold">Location chambre N° {invoiceToView.roomNumber} ({invoiceToView.roomType})</span>
                  <span className="col-span-2 text-center font-mono">{invoiceToView.basePrice.toLocaleString()} F</span>
                  <span className="col-span-2 text-center font-mono">{invoiceToView.nights} nuits</span>
                  <span className="col-span-2 text-right font-bold font-mono">{(invoiceToView.basePrice * invoiceToView.nights).toLocaleString()} F</span>
                </div>

                {/* Services details */}
                {invoiceToView.additionalServices && invoiceToView.additionalServices.length > 0 && (
                  <div className="grid grid-cols-12 text-indigo-650 text-indigo-600 py-1.5 px-1 border-b border-slate-100 items-center">
                    <span className="col-span-6 font-semibold">Consommations annexes choisies ({invoiceToView.additionalServices.join(', ')})</span>
                    <span className="col-span-2 text-center font-mono">-</span>
                    <span className="col-span-2 text-center font-mono">Forfait</span>
                    <span className="col-span-2 text-right font-bold font-mono">+{invoiceToView.servicesPrice.toLocaleString()} F</span>
                  </div>
                )}

                {/* Promo deduction */}
                {invoiceToView.discountAmount > 0 && (
                  <div className="grid grid-cols-12 text-amber-600 py-1.5 px-1 border-b border-slate-100 items-center">
                    <span className="col-span-6 font-semibold">Dépôt coupon de réduction hôtelier ({invoiceToView.couponCode || 'PROMOTIONAL'})</span>
                    <span className="col-span-2 text-center font-mono">-</span>
                    <span className="col-span-2 text-center font-mono">-</span>
                    <span className="col-span-2 text-right font-bold font-mono">-{invoiceToView.discountAmount.toLocaleString()} F</span>
                  </div>
                )}
              </div>

              {/* Total sum block */}
              <div className="space-y-1.5 pt-3 border-t-2 border-slate-350 flex flex-col items-end">
                <div className="flex justify-between w-48 text-[11px] font-bold text-slate-600">
                  <span>Montant Total brut :</span>
                  <span className="font-mono">{ (invoiceToView.basePrice * invoiceToView.nights + invoiceToView.servicesPrice).toLocaleString() } F</span>
                </div>
                {invoiceToView.discountAmount > 0 && (
                  <div className="flex justify-between w-48 text-[11px] font-bold text-amber-600">
                    <span>Réduction Code :</span>
                    <span className="font-mono">-{invoiceToView.discountAmount.toLocaleString()} F</span>
                  </div>
                )}
                <div className="flex justify-between w-48 text-xs font-black border-t border-slate-300 pt-1 text-indigo-600 uppercase">
                  <span>Gracieuseté Net :</span>
                  <span className="font-mono">{invoiceToView.totalPrice.toLocaleString()} F CFA</span>
                </div>
                <div className="flex justify-between w-48 text-[11px] text-emerald-600 font-bold border-t border-dashed border-slate-300 pt-1">
                  <span>Partie Encaissée ({invoiceToView.paymentStatus === 'paid' ? '100%' : 'Acompte 30%'}) :</span>
                  <span className="font-mono">{invoiceToView.paidAmount.toLocaleString()} F</span>
                </div>
              </div>

              {/* Signature digital stamp info */}
              <div className="border-t border-slate-200 pt-5 flex items-center justify-between text-[9.5px] text-slate-500">
                <div className="space-y-1">
                  <p className="font-bold uppercase text-slate-700">CANAL DE TRANSACTON VALIDÉ</p>
                  <p className="font-mono">Mode : {invoiceToView.paymentMethod?.toUpperCase() || 'MOBILE_MONEY'}</p>
                  <p className="text-[8.5px]">Token verification hôtelière certifié par Blockchain de l'établissement.</p>
                </div>
                <div className="text-center p-3 border-2 border-dashed border-emerald-500 text-emerald-600 font-black tracking-widest rounded-xl rotate-3">
                  PAYÉ EN LIGNE ✔️
                </div>
              </div>
            </div>

            {/* Print Footer */}
            <div className="bg-slate-100 p-3.5 text-center text-[10px] text-slate-505 shrink-0 border-t border-slate-200">
              Merci pour votre confiance. Séjour de standing garanti à {invoiceToView.hotelName}.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
