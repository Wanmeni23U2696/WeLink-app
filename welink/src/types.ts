/**
 * Types & Interfaces for the Multi-Profile B2B2C Marketplace
 */

export type ProfileType = 'client' | 'entreprise' | 'fournisseur' | 'livreur';

export type EnterpriseType = 
  | 'supermarche' 
  | 'marche' 
  | 'alimentation' 
  | 'restaurant' 
  | 'secretariat' 
  | 'hotel'
  | 'vetement'
  | 'boucher'
  | 'poissonnerie'
  | 'autre';

export type SupplierType = 
  | 'agriculteur' 
  | 'artisan' 
  | 'eleveur' 
  | 'poissonnier'
  | 'autre';

export type CarrierType = 'moto' | 'tricycle' | 'voiture' | 'agence';

export interface Subscription {
  planId: 'free' | 'premium' | 'starter' | 'pro' | 'business' | 'fournisseur_free' | 'fournisseur_pro';
  status: 'active' | 'expired' | 'trial' | 'cancelled';
  price: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  trialEndDate?: string;
  isTrial?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  profileType: ProfileType;
  // Dynamic fields based on profile type
  enterpriseType?: EnterpriseType;
  supplierType?: SupplierType;
  carrierType?: CarrierType;
  vehiclePlate?: string;
  carrierStatus?: 'disponible' | 'en_livraison' | 'hors_ligne';
  description?: string;
  address?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  interests?: string[];
  // Platform security
  pinCode?: string; // Opt-in secure PIN code for validation
  isDataEncrypted?: boolean; // Toggle for military-grade data encryption (phone & address)
  password?: string; // Optionnel côté client (non partagé pour la sécurité)
  recoveryKey?: string; // Clé de secours pour la récupération de compte
  // SaaS Subscriptions & Wallets
  subscription?: Subscription;
  isAdmin?: boolean;
  customBgDataUrl?: string;
}

export interface Product {
  id: string;
  sellerId: string; // User ID (Enterprise or Supplier)
  sellerName: string;
  sellerType: ProfileType; // 'entreprise' (selling to client) or 'fournisseur' (selling to enterprise)
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  unit: string; // e.g. "kg", "unité", "litres"
  rayon?: string; // For supermarkets, organize by department/rayon
  promotionDiscount?: number; // Pourcentage de réduction, ex: 15 (pour 15%)
  promotionEnd?: string; // Date de fin au format ISO string, ex: "2026-06-04T15:00:00Z"
  // Clothing Boutique Specific Properties
  brand?: string;
  color?: string;
  size?: string;
  material?: string;
  minStock?: number;
  status?: 'Disponible' | 'Rupture' | 'Archivé';
  images?: string[];
}

export interface JobOffer {
  id: string;
  companyId: string;
  companyName: string;
  companyType: EnterpriseType;
  title: string;
  description: string;
  salary: string;
  location: string;
  requirements: string[];
  createdAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  productId: string;
  productTitle: string;
  price: number;
  quantity: number;
  status: 'pending' | 'accepted' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  paymentMethod?: string;
  isEscrow?: boolean;
  escrowStatus?: 'locked' | 'released' | 'refunded';
  scheduledDate?: string;
  scheduledTime?: string;
  customCut?: string;
  serviceType?: 'takeout' | 'delivery' | 'dinein';
  deliveryAddress?: string;
  tableNumber?: string;
  // WeLink Delivery Logistics Integration
  carrierId?: string;
  carrierName?: string;
  carrierPhone?: string;
  deliveryStatus?: 'unassigned' | 'assigned' | 'picked_up' | 'delivered';
  deliveryFee?: number;
}

export interface VenteItem {
  id: string;
  rayon: string;
  produit: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

export interface Vente {
  id: string;
  entreprise_id: string;
  age: string; // e.g. "18-25", "26-39", "40-55", "55+"
  sexe: string; // e.g. "Homme", "Femme"
  total: number;
  date_vente: string;
  items: VenteItem[];
  paymentMethod?: string; // "Espèces" | "Carte bancaire" | "Orange Money" | "MTN MoMo" | "Mobile Money" | "Mixte"
  discountAmount?: number;
  discountCode?: string;
  promoApplied?: string;
  vatRate?: number;
  vatAmount?: number;
  clientName?: string;
  isAutoOrder?: boolean;
}

export interface PredictionResult {
  bestRayon: string;
  bestScore: number;
  level: 'TRÈS FIABLE 🔥' | 'MOYENNEMENT FIABLE ⚠️' | 'DONNÉES INSUFFISANTES ⚠️';
  probabilities: { rayon: string; proba: number }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  appliedAt: string;
  cvType: 'file' | 'built';
  cvFileName?: string;
  cvFileContent?: string; // base64 data URL or representation
  status?: 'pending' | 'rejected' | 'accepted';
  cvBuilderData?: {
    title: string;
    summary: string;
    skills: string;
    experience: string;
    education: string;
  };
}

export interface EnterpriseStock {
  id: string;
  buyerId: string;
  title: string;
  quantity: number;
  unit: string;
  category: string;
}

export type RoomStatus = 'Libre' | 'Occupée' | 'Réservée' | 'Maintenance';

export interface HotelRoom {
  id: string;
  hotelId: string;
  number: string;
  type: string;
  capacity: number;
  price: number;
  description: string;
  equipments: string[];
  photos: string[];
  status: RoomStatus;
}

export interface HotelReservation {
  id: string;
  hotelId: string;
  hotelName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  basePrice: number;
  additionalServices: string[];
  servicesPrice: number;
  couponCode?: string;
  discountAmount: number;
  totalPrice: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentMethod?: 'cash' | 'mobile_money' | 'card' | 'transfer';
  paidAmount: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  createdAt: string;
}

export interface HotelCoupon {
  id: string;
  hotelId: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  active: boolean;
  expiryDate?: string;
}

export interface HotelAuditLog {
  id: string;
  hotelId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface HotelFomoSetting {
  hotelId: string;
  title: string;
  hoursLeft: string;
  expiryDate: string;
  active: boolean;
}

export interface RestaurantTable {
  id: string;
  sellerId: string;
  number: string;
  capacity: number;
  status: 'available' | 'reserved' | 'occupied' | 'cleaning';
  zone: 'window' | 'terrace' | 'vip' | 'interior';
}

export interface RestaurantBooking {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  tableId?: string;
  guestsCount: number;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface DishRating {
  id: string;
  productId: string;
  rating: number; // 1-5
  comment: string;
  reviewerName: string;
  reviewerId: string;
  date: string;
}

export interface CompanyReview {
  id: string;
  companyId: string;
  companyName: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
  visitContext?: string; // e.g., "Visite en ligne", "Achat effectué", "Réservation"
  createdAt: string;
}

export interface ClientActivity {
  id: string;
  clientId: string;
  activityType: 'view_enterprise' | 'view_product' | 'search' | 'add_to_cart' | 'purchase';
  targetId: string;
  targetCategory?: string;
  timestamp: string;
}

export interface ClientClassification {
  id: string; // compatibility with synced list
  clientId: string;
  primaryInterest: string; // e.g., 'supermarche', 'restaurant', 'hotel', 'vetement'
  scoreMap: Record<string, number>;
  tier: 'Curieux 🌱' | 'Explorateur 🌟' | 'Acheteur Actif ⚡' | 'Fidèle Partenaire 🔥';
  updatedAt: string;
}

export interface PaymentInvoice {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  planId: string;
  planName: string;
  status: 'paid' | 'pending' | 'failed';
  paymentMethod: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  paymentMethod: string;
  phone: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'sale_credit' | 'platform_commission' | 'withdrawal' | 'subscription_payment';
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface CommissionSettings {
  productSalePercent: number;
  deliveryPercent: number;
}

export interface PaymentSettings {
  mtnMomoMerchantNumber: string;
  orangeMoneyMerchantNumber: string;
  waveMerchantCode: string;
  apiKey: string;
  sandboxMode: boolean;
}

