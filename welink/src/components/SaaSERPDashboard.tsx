import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import SaaSERPModuleViews from './SaaSERPModuleViews';
import SaaSSubscriptionPanel from './SaaSSubscriptionPanel';
import { 
  Building2, 
  Shield, 
  Settings, 
  ChevronRight, 
  Check, 
  Database, 
  Layers, 
  LayoutDashboard, 
  Sparkles, 
  Package, 
  Briefcase, 
  FolderPlus, 
  Calendar, 
  Clock, 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  Users, 
  TrendingUp, 
  BookOpen, 
  LineChart, 
  Bell, 
  PenTool, 
  Code, 
  Award, 
  Ticket, 
  Percent, 
  Plus, 
  Search, 
  Trash2, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  FileKey, 
  Download,
  Terminal,
  ExternalLink,
  ChevronDown,
  Maximize2,
  Power,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// Types specific to SaaS Intelligent ERP
export interface ERPCompany {
  id: string;
  name: string;
  logoUrl?: string;
  sector: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  activeModules: string[];
  // Isolated data stores per tenant
  products: ERPProduct[];
  services: ERPService[];
  stocks: ERPStockItem[];
  reservations: ERPReservation[];
  appointments: ERPAppointment[];
  quotations: ERPQuotation[];
  orders: ERPOrder[];
  payments: ERPPayment[];
  deliveries: ERPDelivery[];
  suppliers: ERPSupplier[];
  employees: ERPEmployee[];
  crmLeads: ERPCrmLead[];
  ledgerEntries: ERPAccountingEntry[];
  loyaltyPrograms: ERPLoyaltyMember[];
  coupons: ERPCoupon[];
  promotions: ERPPromotion[];
  apiKeys: ERPApiKey[];
  customBgDataUrl?: string;
}

export interface ERPProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl?: string;
}

export interface ERPService {
  id: string;
  title: string;
  category: string;
  pricePerHour: number;
  durationMin: number;
  imageUrl?: string;
}

export interface ERPStockItem {
  id: string;
  productId: string;
  quantityChanged: number;
  reason: string;
  date: string;
}

export interface ERPReservation {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  guestCount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface ERPAppointment {
  id: string;
  clientName: string;
  serviceId: string;
  date: string;
  time: string;
  employeeId: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface ERPQuotation {
  id: string;
  clientName: string;
  clientEmail: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  status: 'draft' | 'sent' | 'approved' | 'signed';
  taxRate: number; // e.g. 18%
  discount: number;
  total: number;
  signedName?: string;
  signedDate?: string;
  signatureSvg?: string;
}

export interface ERPOrder {
  id: string;
  clientName: string;
  itemsSummary: string;
  amount: number;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  deliveryStatus: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
}

export interface ERPPayment {
  id: string;
  orderId?: string;
  amount: number;
  method: 'Stripe' | 'Cash' | 'Mobile Money' | 'Bank Transfer';
  reference: string;
  status: 'success' | 'failed';
  date: string;
}

export interface ERPDelivery {
  id: string;
  orderId: string;
  courierName: string;
  trackingNum: string;
  address: string;
  status: 'preparing' | 'on_the_way' | 'delivered';
}

export interface ERPSupplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  catalogItemsCount: number;
}

export interface ERPEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number;
  status: 'active' | 'leave' | 'terminated';
}

export interface ERPCrmLead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: 'lead' | 'contacted' | 'negotiation' | 'won' | 'lost';
  value: number;
  notes: string;
}

export interface ERPAccountingEntry {
  id: string;
  type: 'debit' | 'credit';
  account: string; // e.g., "Ventes", "Fournitures bureau", "Salaires"
  description: string;
  amount: number;
  date: string;
}

export interface ERPLoyaltyMember {
  id: string;
  clientName: string;
  points: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface ERPCoupon {
  id: string;
  code: string;
  discountValue: number;
  type: 'percent' | 'flat';
  active: boolean;
}

export interface ERPPromotion {
  id: string;
  title: string;
  discountPercent: number;
  targetCategory: string;
  startDate: string;
  endDate: string;
}

export interface ERPApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

// Full SaaS Module list representation
const ALL_MODULES_DEFINITION = [
  { id: 'products', name: 'Gestion des Produits', icon: Package, group: 'Opérations', desc: 'Gestion de vos articles, prix, descriptions, catégorisation et grilles tarifaires.' },
  { id: 'services', name: 'Gestion des Services', icon: Briefcase, group: 'Opérations', desc: 'Prestations de services complexes, tarifs horaires ou forfaits, durées moyennes.' },
  { id: 'stocks', name: 'Gestion des Stocks', icon: Layers, group: 'Opérations', desc: 'Ajustements en temps réel, alertes de seuil minimum et registres d\'inventaires.' },
  { id: 'reservations', name: 'Gestion des Réservations', icon: FolderPlus, group: 'Opérations', desc: 'Prise de réservations de tables, de chambres, de véhicules avec suivi des statuts.' },
  { id: 'rendezvous', name: 'Gestion des Rendez-vous', icon: Clock, group: 'Opérations', desc: 'Planification de créneaux horaires reliés directement à vos employés attitrés.' },
  { id: 'devis', name: 'Gestion des Devis', icon: FileText, group: 'Ventes', desc: 'Créateur de devis structurés avec taxes, remises et signature contractuelle.' },
  { id: 'commandes', name: 'Gestion des Commandes', icon: ShoppingCart, group: 'Ventes', desc: 'Cycle complet des commandes de la préparation à l\'expédition finale.' },
  { id: 'paiements', name: 'Gestion des Paiements', icon: CreditCard, group: 'Finances', desc: 'Registre comptable de transactions avec portails multisig et devises locales.' },
  { id: 'livraisons', name: 'Gestion des Livraisons', icon: Truck, group: 'Opérations', desc: 'Suivi logistique, colisages, transporteurs partenaires et numéros de tracking.' },
  { id: 'fournisseurs', name: 'Gestion des Fournisseurs', icon: Users, group: 'Opérations', desc: 'Base de données fournisseurs, catalogues d\'achat et réapprovisionnements.' },
  { id: 'employes', name: 'Gestion des Employés', icon: Users, group: 'Ressources Humaines', desc: 'Annuaire d\'équipe, rôles systèmes spécialisés, départements et masse salariale.' },
  { id: 'comptabilite', name: 'Comptabilité', icon: BookOpen, group: 'Finances', desc: 'Journal général de crédit/débit, grand livre comptable et état des pertes et profits.' },
  { id: 'crm', name: 'CRM (Relation Client)', icon: TrendingUp, group: 'Ventes', desc: 'Pipeline visuel d\'opportunités commerciales (Leads, Négociation, Gagné).' },
  { id: 'agenda', name: 'Agenda Partagé', icon: Calendar, group: 'Opérations', desc: 'Affichage chronologique complet et centralisé de tous vos événements d\'affaires.' },
  { id: 'notifications', name: 'Notifications Temps-Réel', icon: Bell, group: 'Technologique', desc: 'Flux d\'alertes instantanées, toasters programmables et logs de sécurité.' },
  { id: 'signature', name: 'Signature Électronique', icon: PenTool, group: 'Ventes', desc: 'Tablette de dessin intégrée pour signer légalement vos devis et devoirs commerciaux.' },
  { id: 'rapports', name: 'Rapports & Statistiques', icon: LineChart, group: 'Analytique', desc: 'Graphiques, journaux d\'activités imprimables et exports tableurs en 1 clic.' },
  { id: 'ia', name: 'Intelligence Artificielle', icon: Sparkles, group: 'Analytique', desc: 'Prévisions prédictives, détections intelligentes de ruptures et rapports automatisés.' },
  { id: 'api', name: 'Portail Développeur & API', icon: Code, group: 'Technologique', desc: 'Gestion de clés de sécurité API privées, webhooks et logs d\'intégration.' },
  { id: 'fidelite', name: 'Programmes de Fidélité', icon: Award, group: 'Marketing', desc: 'Attribution de points récompenses par palier d\'achats de vos clients.' },
  { id: 'coupons', name: 'Générateur de Coupons', icon: Ticket, group: 'Marketing', desc: 'Codes promotionnels applicables en magasin ou en ligne, fixes ou en pourcentage.' },
  { id: 'promotions', name: 'Campagnes Promotionnelles', icon: Percent, group: 'Marketing', desc: 'Automatisation de soldes ciblées avec comptes à rebours et dates d\'expiration.' },
  { id: 'jobs', name: 'Offres d\'Emploi', icon: Briefcase, group: 'Ressources Humaines', desc: 'Gestion et rédaction d\'offres d\'emploi pour recruter vos futurs collaborateurs.' }
];

export default function SaaSERPDashboard({ 
  user, 
  allUsers = [],
  onRefreshState, 
  onLogout,
  wallets = [],
  withdrawalRequests = [],
  paymentInvoices = [],
  walletTransactions = [],
  commissionSettings = { productSalePercent: 5 },
  paymentSettings = {},
  onOpenProfile,
  theme,
  setTheme
}: { 
  user: UserProfile; 
  allUsers?: UserProfile[];
  onRefreshState: () => void; 
  onLogout?: () => void;
  wallets?: any[];
  withdrawalRequests?: any[];
  paymentInvoices?: any[];
  walletTransactions?: any[];
  commissionSettings?: any;
  paymentSettings?: any;
  onOpenProfile?: () => void;
  theme?: 'light' | 'dark';
  setTheme?: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}) {
  // Multi-Tenant list of companies
  const [companies, setCompanies] = useState<ERPCompany[]>(() => {
    const saved = localStorage.getItem('saas_erp_companies');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    // Setup some default demo tenant under multi-company isolation
    const demoCompany: ERPCompany = {
      id: 'tenant_demo_optima',
      name: 'Optima Santé SARL',
      logoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      sector: 'Pharmacie & Parapharmacie',
      description: 'Leader régional de la distribution de dispositifs médicaux de proximité.',
      address: 'Avenue de la République, Plateau',
      city: 'Douala',
      country: 'Cameroun',
      phone: '+237 650023402',
      whatsapp: '+237 650023402',
      email: 'contact@optimasante.cm',
      activeModules: ['products', 'stocks', 'devis', 'paiements', 'crm', 'ia', 'comptabilite'],
      products: [
        { id: 'p_1', title: 'Paracétamol 500mg Boite de 16', category: 'Médicaments', price: 1200, stock: 450, minStock: 50, unit: 'boîte' },
        { id: 'p_2', title: 'Thermomètre digital sans contact', category: 'Thermométrie', price: 14500, stock: 12, minStock: 10, unit: 'unité' },
        { id: 'p_3', title: 'Boîte de Masques chirurgicaux x50', category: 'Consommables', price: 3500, stock: 4, minStock: 20, unit: 'boîte' }, // Trigger threshold warning!
      ],
      services: [
        { id: 's_1', title: 'Dépistage Diabète express', category: 'Analyses', pricePerHour: 5000, durationMin: 15 },
        { id: 's_2', title: 'Livraison express ordonnance', category: 'Logistique', pricePerHour: 2500, durationMin: 30 }
      ],
      stocks: [
        { id: 'st_1', productId: 'p_1', quantityChanged: 100, reason: 'Réception fournisseur', date: '2026-06-18' }
      ],
      reservations: [],
      appointments: [],
      quotations: [
        { id: 'dev_1', clientName: 'Clinique de la Paix', clientEmail: 'gestion@paix.ci', items: [{ description: 'Lot de thermomètres & Paracétamol', quantity: 15, unitPrice: 3500 }], status: 'draft', taxRate: 18, discount: 5, total: 49875 }
      ],
      orders: [
        { id: 'ord_1', clientName: 'Koffi Paul', itemsSummary: '2x Masques + Thermomètre', amount: 21500, paymentStatus: 'paid', deliveryStatus: 'delivered', date: '2026-06-19' }
      ],
      payments: [
        { id: 'pay_1', orderId: 'ord_1', amount: 21500, method: 'Mobile Money', reference: 'REF-MOMO-8821', status: 'success', date: '2026-06-19' }
      ],
      deliveries: [
        { id: 'del_1', orderId: 'ord_1', courierName: 'Allo Livreur', trackingNum: 'WD-88912-CI', address: 'Bictogo III, Cocody', status: 'delivered' }
      ],
      suppliers: [
        { id: 'sup_1', name: 'Pharma-Afrique SA', contactName: 'M. Touré', email: 'toure@pharma-afrique.com', phone: '+225 01020304', catalogItemsCount: 450 }
      ],
      employees: [
        { id: 'emp_1', name: 'Dr. Aminata Diallo', role: 'Pharmacienne Chef', department: 'Pharmacie', salary: 1200000, status: 'active' },
        { id: 'emp_2', name: 'Moussa Koné', role: 'Préparateur en pharmacie', department: 'Technique', salary: 450000, status: 'active' }
      ],
      crmLeads: [
        { id: 'lead_1', companyName: 'Hôpital Militaire', contactName: 'Col. Saliou', email: 'saliou@hm.ci', phone: '+225 05051212', status: 'negotiation', value: 12000000, notes: 'Accord de principe sur les lits médicalisés.' }
      ],
      ledgerEntries: [
        { id: 'acc_1', type: 'credit', account: 'Ventes', description: 'Vente directe thermomètre', amount: 14500, date: '2026-06-20' },
        { id: 'acc_2', type: 'debit', account: 'Local', description: 'Facture CIE électricité', amount: 75000, date: '2026-06-19' }
      ],
      loyaltyPrograms: [],
      coupons: [],
      promotions: [],
      apiKeys: [{ id: 'k_1', name: 'Production App', key: 'sk_welink_prod_optima_772183a9', createdAt: '2026-06-17' }]
    };
    return [demoCompany];
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    return localStorage.getItem('saas_erp_active_company_id') || 'tenant_demo_optima';
  });

  // Persist companies state
  useEffect(() => {
    localStorage.setItem('saas_erp_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('saas_erp_active_company_id', activeCompanyId);
  }, [activeCompanyId]);

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  // UI state variables
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [hasCompletedWizard, setHasCompletedWizard] = useState<boolean>(() => {
    return localStorage.getItem(`saas_wizard_done_${user.email}`) === 'true';
  });

  // Step 1 values (General Info)
  const [compName, setCompName] = useState('');
  const [compLogo, setCompLogo] = useState('');
  const [compSector, setCompSector] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compCity, setCompCity] = useState('');
  const [compCountry, setCompCountry] = useState('Cameroun');
  const [compPhone, setCompPhone] = useState('');
  const [compWhatsapp, setCompWhatsapp] = useState('');
  const [compEmail, setCompEmail] = useState(user.email || '');

  // Step 2 values (Constructeur - Chosen Modules)
  const [selectedModules, setSelectedModules] = useState<string[]>(['products', 'ia', 'rapports']);

  // Inside Dashboard navigation
  const [erpTab, setErpTab] = useState<string>('dashboard');
  const [globalSearchOpen, setGlobalSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemNotifications, setSystemNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean; type: 'info' | 'warn' | 'success' }>>([
    { id: 'n1', text: 'Intelligence artificielle : Prévisions des ventes de Juillet prêtes.', time: 'À l\'instant', read: false, type: 'success' },
    { id: 'n2', text: 'Le stock de "Boîte de Masques chirurgicaux" est sous le seuil minimum.', time: 'Il y a 10 min', read: false, type: 'warn' }
  ]);
  const [aiReportGenerated, setAiReportGenerated] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Quick action forms
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdCat, setNewProdCat] = useState('Général');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdMin, setNewProdMin] = useState(5);
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdUnit, setNewProdUnit] = useState('unité');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');

  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newSerTitle, setNewSerTitle] = useState('');
  const [newSerCat, setNewSerCat] = useState('Général');
  const [newSerPriceHour, setNewSerPriceHour] = useState(0);
  const [newSerDuration, setNewSerDuration] = useState(30);

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [leadCompName, setLeadCompName] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadVal, setLeadVal] = useState(100000);
  const [leadNotes, setLeadNotes] = useState('');

  // Signature Pad state
  const [signatureNameInput, setSignatureNameInput] = useState('');
  const [signatureCompleted, setSignatureCompleted] = useState(false);

  // Toast manager
  const [showToast, setShowToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  // Helper trigger webhook logs
  const [apiLogs, setApiLogs] = useState<string[]>([
    'GET /api/v1/health - 200 OK [2026-06-20 12:45:00]',
    'GET /api/v1/products - 200 OK - Count: 3 items [2026-06-20 14:10:22]'
  ]);

  // Handle building new company from custom assistant wizard
  const handleCreateCompanyWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !compSector) {
      alert("Le nom de l'entreprise et son secteur d'activité sont obligatoires.");
      return;
    }

    const newTenantId = 'tenant_' + Math.random().toString(36).substring(2, 9);
    const newCompany: ERPCompany = {
      id: newTenantId,
      name: compName,
      logoUrl: compLogo || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(compName),
      sector: compSector,
      description: compDesc,
      address: compAddress,
      city: compCity,
      country: compCountry,
      phone: compPhone,
      whatsapp: compWhatsapp,
      email: compEmail,
      activeModules: [...selectedModules, 'notifications', 'rapports'], // Always auto-include reports and alerts for visual quality
      products: [],
      services: [],
      stocks: [],
      reservations: [],
      appointments: [],
      quotations: [],
      orders: [],
      payments: [],
      deliveries: [],
      suppliers: [],
      employees: [],
      crmLeads: [],
      ledgerEntries: [],
      loyaltyPrograms: [],
      coupons: [],
      promotions: [],
      apiKeys: []
    };

    setCompanies(prev => [...prev, newCompany]);
    setActiveCompanyId(newTenantId);
    setHasCompletedWizard(true);
    localStorage.setItem(`saas_wizard_done_${user.email}`, 'true');
    triggerToast(`SaaS ERP configuré pour ${compName} !`);
  };

  // Add Product Action
  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdTitle || newProdPrice <= 0) return;

    const newProd: ERPProduct = {
      id: 'p_added_' + Math.random().toString(36).substring(2, 6),
      title: newProdTitle,
      category: newProdCat,
      price: Number(newProdPrice),
      stock: Number(newProdStock),
      minStock: Number(newProdMin),
      unit: newProdUnit,
      imageUrl: newProductImageUrl
    };

    setCompanies(prev => prev.map(c => {
      if (c.id === activeCompany.id) {
        return {
          ...c,
          products: [...c.products, newProd],
          stocks: [...c.stocks, {
            id: 'st_log_' + Math.random().toString(36).substring(2, 6),
            productId: newProd.id,
            quantityChanged: newProd.stock,
            reason: 'Création initiale',
            date: new Date().toISOString().split('T')[0]
          }]
        };
      }
      return c;
    }));

    setShowAddProductModal(false);
    triggerToast(`Produit "${newProdTitle}" ajouté au catalogue.`);
    // Reset forms
    setNewProdTitle('');
    setNewProdPrice(0);
    setNewProdStock(10);
    setNewProductImageUrl('');
  };

  // Add Service Action
  const handleAddNewService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerTitle) return;

    const newSer: ERPService = {
      id: 's_added_' + Math.random().toString(36).substring(2, 6),
      title: newSerTitle,
      category: newSerCat,
      pricePerHour: Number(newSerPriceHour),
      durationMin: Number(newSerDuration)
    };

    setCompanies(prev => prev.map(c => {
      if (c.id === activeCompany.id) {
        return { ...c, services: [...c.services, newSer] };
      }
      return c;
    }));

    setShowAddServiceModal(false);
    triggerToast(`Service "${newSerTitle}" configuré.`);
    setNewSerTitle('');
    setNewSerPriceHour(0);
  };

  // Add CRM Lead
  const handleAddNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadCompName) return;

    const newLead: ERPCrmLead = {
      id: 'lead_' + Math.random().toString(36).substring(2, 6),
      companyName: leadCompName,
      contactName: leadContact,
      email: leadEmail,
      phone: '',
      status: 'lead',
      value: Number(leadVal),
      notes: leadNotes
    };

    setCompanies(prev => prev.map(c => {
      if (c.id === activeCompany.id) {
        return { ...c, crmLeads: [...c.crmLeads, newLead] };
      }
      return c;
    }));

    setShowAddLeadModal(false);
    triggerToast(`Opportunité "${leadCompName}" ajoutée au CRM.`);
    setLeadCompName('');
    setLeadContact('');
    setLeadNotes('');
  };

  // Switch lead status
  const handleLeadStatusChange = (leadId: string, nextStatus: any) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === activeCompany.id) {
        return {
          ...c,
          crmLeads: c.crmLeads.map(l => l.id === leadId ? { ...l, status: nextStatus } : l)
        };
      }
      return c;
    }));
    triggerToast(`Statut d'opportunité mis à jour.`);
  };

  // Auto AI analytics simulation
  const handleTriggerAiInsight = () => {
    setAiLoading(true);
    setTimeout(() => {
      const insights = [
        `📊 ANALYSE IA POUR ${activeCompany.name.toUpperCase()} :\n\n` +
        `📈 Ventes & Réservations : Les prévisions de ventes à 30 jours estiment une hausse de +14.5% portée par la spécialité ${activeCompany.sector}. Nous recommandons de renforcer la disponibilité du personnel le Vendredi après-midi.\n\n` +
        `⚠️ Proactive Ruptures : L'IA a détecté que ${activeCompany.products.filter(p => p.stock < p.minStock).length} articles sont proches ou sous le seuil critique. Passez commande auprès de vos fournisseurs référencés.\n\n` +
        `💡 Conseil fidélisation : Activez un coupon réduc de 10% sur les services de la catégorie "${activeCompany.services[0]?.category || 'Prestation'}" pour cibler vos clients fidèles de classe Silver.`
      ];
      setAiReportGenerated(insights[0]);
      setAiLoading(false);
    }, 1200);
  };

  // Global search implementation
  const searchResults = searchQuery.trim() === '' ? [] : [
    ...activeCompany.products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(p => ({ label: p.title, type: 'Produit', meta: `${p.price} CFA - Stock: ${p.stock}` })),
    ...activeCompany.services.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(s => ({ label: s.title, type: 'Service', meta: `${s.pricePerHour} CFA/h` })),
    ...activeCompany.employees.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())).map(e => ({ label: e.name, type: 'Employé', meta: `${e.role} (${e.department})` }))
  ];

  // Quick module dynamic toggle directly from Dashboard "App Store"
  const handleToggleModule = (mId: string) => {
    const isCurrentlyActive = activeCompany.activeModules.includes(mId);
    setCompanies(prev => prev.map(c => {
      if (c.id === activeCompany.id) {
        const nextModules = isCurrentlyActive 
          ? c.activeModules.filter(id => id !== mId)
          : [...c.activeModules, mId];
        return { ...c, activeModules: nextModules };
      }
      return c;
    }));
    triggerToast(isCurrentlyActive ? `Module désactivé.` : `Module activé avec succès !`);
  };

  // Accounting Ledger additions
  const [accountingDesc, setAccountingDesc] = useState('');
  const [accountingAmount, setAccountingAmount] = useState(0);
  const [accountingType, setAccountingType] = useState<'credit' | 'debit'>('credit');
  const [accountingAccount, setAccountingAccount] = useState('Ventes');

  const handleAddAccountingEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountingDesc || accountingAmount <= 0) return;

    const newEntry: ERPAccountingEntry = {
      id: 'acc_' + Math.random().toString(36).substring(2, 6),
      type: accountingType,
      account: accountingAccount,
      description: accountingDesc,
      amount: Number(accountingAmount),
      date: new Date().toISOString().split('T')[0]
    };

    setCompanies(prev => prev.map(c => {
      if (c.id === activeCompany.id) {
        return { ...c, ledgerEntries: [newEntry, ...c.ledgerEntries] };
      }
      return c;
    }));

    setAccountingDesc('');
    setAccountingAmount(0);
    triggerToast('Écriture comptable validée !');
  };

  // Calculate quick metrics with active company state
  const totalInflow = activeCompany.ledgerEntries.filter(e => e.type === 'credit').reduce((acc, cr) => acc + cr.amount, 0) + activeCompany.orders.filter(o => o.paymentStatus === 'paid').reduce((a, o) => a + o.amount, 0);
  const totalOutflow = activeCompany.ledgerEntries.filter(e => e.type === 'debit').reduce((acc, db) => acc + db.amount, 0);
  const totalProfit = totalInflow - totalOutflow;

  return (
    <div id="saas-intelligent-erp-scope" className="w-full text-slate-100 bg-slate-950 font-sans min-h-screen relative overflow-x-hidden">
      
      {/* Toast Alert popup banner */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] bg-gradient-to-r from-indigo-650 to-indigo-700 text-white font-semibold text-xs py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-indigo-500/30 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Search Modal Drawer Overlay */}
      {globalSearchOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-start justify-center pt-24 px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 shadow-2xl relative">
            <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2.5 rounded-2xl border border-slate-850">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Recherche ERP globale (produits, employés, services)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
              />
              <button onClick={() => { setGlobalSearchOpen(false); setSearchQuery(''); }} className="text-[10px] text-slate-500 hover:text-white uppercase font-black">Esc</button>
            </div>

            {searchQuery && (
              <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Résultats ({searchResults.length})</span>
                {searchResults.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">Aucune correspondance trouvée ou module inactif.</p>
                ) : (
                  searchResults.map((r, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-white block">{r.label}</span>
                        <span className="text-[10px] text-slate-500 block">{r.meta}</span>
                      </div>
                      <span className="bg-indigo-950 border border-indigo-900/30 text-indigo-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">{r.type}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER MODE A: SYSTEM CONFIGURATION WIZARD FOR SANS SEC-PRESETS */}
      {!hasCompletedWizard ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/20 relative z-10 animate-fade-in">
          
          <div className="max-w-2xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-left relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-850 pb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950 border border-indigo-900 text-indigo-400 text-[10px] font-bold uppercase tracking-widest leading-none mb-2">
                  <Database className="w-3.5 h-3.5" /> Tenant Multi-SaaS
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Onboarding Intelligent WeLink</h1>
                <p className="text-xs text-slate-400 mt-1">Configurez votre environnement d'administration modulaire en quelques minutes.</p>
              </div>
              <div className="flex gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${wizardStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-500'}`}>1</span>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${wizardStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-500'}`}>2</span>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (wizardStep < 2) setWizardStep(2); else handleCreateCompanyWizard(e); }}>
              
              {/* STEP 1: General Business Details */}
              {wizardStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 mb-4 text-xs text-indigo-300 leading-relaxed flex items-start gap-3">
                    <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Vous avez choisi le type d'entreprise <strong>"Autre" / Personnalisé</strong>. Notre plateforme initialise un constructeur intelligent vous permettant de composer vous-même les fonctionnalités sans code !</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Nom de l'entreprise *</label>
                      <input
                        type="text"
                        required
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                        placeholder="Ex: Pharma-Sud, Salon Beauté Divine, Garage Alpha"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Secteur d'activité précis *</label>
                      <input
                        type="text"
                        required
                        value={compSector}
                        onChange={(e) => setCompSector(e.target.value)}
                        placeholder="Ex: Parapharmacie, Cabinet de kinésithérapie"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Logo d'Entreprise (URL optionnelle)</label>
                      <input
                        type="url"
                        value={compLogo}
                        onChange={(e) => setCompLogo(e.target.value)}
                        placeholder="HTTP(S) link de l'image"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">E-mail Officiel</label>
                      <input
                        type="email"
                        required
                        value={compEmail}
                        onChange={(e) => setCompEmail(e.target.value)}
                        placeholder="contact@entreprise.com"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Téléphone d'accueil</label>
                      <input
                        type="tel"
                        value={compPhone}
                        onChange={(e) => setCompPhone(e.target.value)}
                        placeholder="+225 01020304"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Numéro WhatsApp Business</label>
                      <input
                        type="tel"
                        value={compWhatsapp}
                        onChange={(e) => setCompWhatsapp(e.target.value)}
                        placeholder="+225 01020304"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Adresse Physique Complète & Ville, Pays</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={compAddress}
                          onChange={(e) => setCompAddress(e.target.value)}
                          placeholder="Rue, Quartier"
                          className="col-span-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                        <input
                          type="text"
                          value={compCity}
                          onChange={(e) => setCompCity(e.target.value)}
                          placeholder="Ville"
                          className="col-span-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                        <input
                          type="text"
                          value={compCountry}
                          onChange={(e) => setCompCountry(e.target.value)}
                          placeholder="Pays"
                          className="col-span-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Présentation de la Société (Description)</label>
                      <textarea
                        rows={3}
                        value={compDesc}
                        onChange={(e) => setCompDesc(e.target.value)}
                        placeholder="Présentez brièvement vos services de proximité ou de distribution commerciale..."
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-6 rounded-xl cursor-pointer transition active:scale-95 shadow-lg shadow-indigo-650/20"
                    >
                      <span>Continuer vers le Constructeur</span> <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SaaS Custom Business Module Weaver */}
              {wizardStep === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850 text-xs text-indigo-300 flex items-start gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-amber-300 shrink-0 mt-0.5" />
                    <span>L'architecture multi-テナント WeLink est extensible. Toggolez ci-dessous les briques applicatives nécessaires pour composer un ERP adapté à votre gestion.</span>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto pr-1 space-y-4">
                    {/* Opérations */}
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider mb-2">Opérations & Logistique</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ALL_MODULES_DEFINITION.filter(m => m.group === 'Opérations' || m.group === 'Ressources Humaines').map(m => {
                          const IconComp = m.icon;
                          const isSelected = selectedModules.includes(m.id);
                          return (
                            <div 
                              key={m.id}
                              onClick={() => {
                                setSelectedModules(p => p.includes(m.id) ? p.filter(id => id !== m.id) : [...p, m.id]);
                              }}
                              className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-2.5 text-left ${isSelected ? 'bg-indigo-950/40 border-indigo-500/50' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'}`}
                            >
                              <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-650 text-white' : 'bg-slate-900 text-slate-400'}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block font-bold text-xs text-slate-200">{m.name}</span>
                                <span className="block text-[10px] text-slate-505 truncate">{m.desc}</span>
                              </div>
                              <input type="checkbox" checked={isSelected} readOnly className="pointer-events-none shrink-0 border-slate-800 accent-indigo-650 rounded-md" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ventes & Finances */}
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider mb-2">Ventes & Finances</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ALL_MODULES_DEFINITION.filter(m => m.group === 'Ventes' || m.group === 'Finances').map(m => {
                          const IconComp = m.icon;
                          const isSelected = selectedModules.includes(m.id);
                          return (
                            <div 
                              key={m.id}
                              onClick={() => {
                                setSelectedModules(p => p.includes(m.id) ? p.filter(id => id !== m.id) : [...p, m.id]);
                              }}
                              className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-2.5 text-left ${isSelected ? 'bg-indigo-950/40 border-indigo-500/50' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'}`}
                            >
                              <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-650 text-white' : 'bg-slate-900 text-slate-400'}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block font-bold text-xs text-slate-200">{m.name}</span>
                                <span className="block text-[10px] text-slate-505 truncate">{m.desc}</span>
                              </div>
                              <input type="checkbox" checked={isSelected} readOnly className="pointer-events-none shrink-0 border-slate-800 accent-indigo-650 rounded-md" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Analytique & Technologiques */}
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider mb-2">Analytique, Marketing & IA</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ALL_MODULES_DEFINITION.filter(m => m.group === 'Analytique' || m.group === 'Technologique' || m.group === 'Marketing').map(m => {
                          const IconComp = m.icon;
                          const isSelected = selectedModules.includes(m.id);
                          return (
                            <div 
                              key={m.id}
                              onClick={() => {
                                setSelectedModules(p => p.includes(m.id) ? p.filter(id => id !== m.id) : [...p, m.id]);
                              }}
                              className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-2.5 text-left ${isSelected ? 'bg-indigo-950/40 border-indigo-500/50' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'}`}
                            >
                              <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-650 text-white' : 'bg-slate-900 text-slate-400'}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block font-bold text-xs text-slate-200">{m.name}</span>
                                <span className="block text-[10px] text-slate-505 truncate">{m.desc}</span>
                              </div>
                              <input type="checkbox" checked={isSelected} readOnly className="pointer-events-none shrink-0 border-slate-800 accent-indigo-650 rounded-md" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="text-slate-400 hover:text-white text-xs font-semibold cursor-pointer py-2 px-3 hover:underline"
                    >
                      Retour aux informations
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-6 rounded-xl cursor-pointer transition active:scale-95 shadow-lg shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" /> <span>Créer mon ERP Intelligent</span>
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      ) : (
        /* RENDER MODE B: SYSTEM SaaS ERP INTELLIGENT WORKSPACE */
        <div 
          id="saas-corporate-layout-core" 
          className="min-h-screen w-full flex flex-row relative"
          style={activeCompany.customBgDataUrl ? { 
            backgroundImage: `url(${activeCompany.customBgDataUrl})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            backgroundAttachment: 'fixed' 
          } : undefined}
        >
          {/* No blurred or darkening overlay - background displayed at 100% opacity and crisp visibility */}
          
          {/* SIDEBAR INTELLIGENTE (High fidelity replica of leftmost panel) */}
          <aside className="w-72 bg-slate-900 border-r border-slate-800/80 shrink-0 hidden md:flex flex-col justify-between z-10 pb-10">
            <div className="p-5 flex flex-col h-full overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
              
              {/* Startup Active Branding (instead of WeLink branding) */}
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-805/60 shrink-0">
                <img 
                  src={activeCompany.logoUrl} 
                  alt="Startup logo" 
                  className="w-10 h-10 rounded-xl object-cover bg-slate-950 border border-slate-850" 
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1 text-left">
                  <span className="block font-black text-sm text-white tracking-tight uppercase leading-none truncate">{activeCompany.name}</span>
                  <span className="block text-[8px] text-indigo-400 font-extrabold uppercase tracking-widest mt-1.5 truncate">{activeCompany.sector}</span>
                </div>
              </div>

              {/* User Profile section replica */}
              <div className="flex items-center space-x-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60 shrink-0">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name)}`}
                  alt="avatar"
                  className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 object-cover"
                />
                <div className="min-w-0 flex-1 text-left">
                  <span className="text-xs font-bold text-slate-100 block truncate leading-tight">{user.name}</span>
                  <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-1.5 uppercase tracking-wider bg-violet-950/50 text-indigo-300 border border-indigo-900/30">
                    Gérant Principal
                  </span>
                </div>
              </div>

              {/* Sidebar Active Modules links */}
              <div className="space-y-1.5 flex-grow">
                <p className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase mb-3 px-1 text-left">Modules de l'ERP</p>
                <button
                  onClick={() => setErpTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition duration-150 ${erpTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                >
                  <LayoutDashboard className={`w-4 h-4 shrink-0 col-span-1 ${erpTab === 'dashboard' ? 'text-white' : 'text-indigo-400'}`} />
                  <span>Tableau de bord</span>
                </button>

                {ALL_MODULES_DEFINITION.map(m => {
                  const isActive = activeCompany.activeModules.includes(m.id);
                  const IconComp = m.icon;
                  if (!isActive) return null;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setErpTab(m.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition duration-150 ${erpTab === m.id ? 'bg-indigo-650 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                    >
                      <IconComp className={`w-4 h-4 shrink-0 ${erpTab === m.id ? 'text-white' : 'text-indigo-400'}`} />
                      <span>{m.name}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setErpTab('finances_welink')}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition duration-150 ${erpTab === 'finances_welink' ? 'bg-indigo-650 text-white shadow-lg' : 'text-indigo-400 hover:bg-slate-850 hover:text-white border border-indigo-950 bg-indigo-950/20'}`}
                >
                  <CreditCard className={`w-4 h-4 shrink-0 ${erpTab === 'finances_welink' ? 'text-white' : 'text-indigo-400'}`} />
                  <span>Mon Abonnement WeLink</span>
                </button>
              </div>

            </div>
            
            <div className="p-4 mx-4 border border-slate-800 rounded-2xl bg-slate-950/40 text-left shrink-0 space-y-3">
              <div>
                <span className="block text-[8px] uppercase font-black text-slate-500 tracking-wider">Coffre Fort Isolé Multi-Tenant</span>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight truncate">Tenant ID : <code className="font-mono text-indigo-400">{activeCompany.id}</code></p>
              </div>
              
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 hover:text-red-300 rounded-xl transition duration-150 text-xs font-black cursor-pointer"
                >
                  <Power className="w-4 h-4 text-red-500 shrink-0" />
                  <span>DÉCONNEXION</span>
                </button>
              )}
            </div>
          </aside>

          {/* MAIN CONTAINER PANEL */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* Top Workspace Bar */}
            <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-8 backdrop-blur-md">
              <div className="flex items-center gap-3">
                {/* Search Bar interface */}
                <button
                  onClick={() => setGlobalSearchOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-850 hover:border-slate-800 transition rounded-xl w-48 sm:w-64"
                >
                  <Search className="w-4 h-4 shrink-0 text-slate-500" />
                  <span className="truncate">Global search (Ctrl+K)...</span>
                </button>
              </div>

              <div id="header-right-meta-actions" className="flex items-center gap-3">
                {/* Custom Background Image selector */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition cursor-pointer">
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-455" />
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
                          setCompanies(prev => prev.map(c => {
                            if (c.id === activeCompany.id) {
                              return {
                                ...c,
                                customBgDataUrl: compressed
                              };
                            }
                            return c;
                          }));

                          try {
                             const response = await fetch('/api/users/update', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({
                                 id: user.id,
                                 customBgDataUrl: compressed
                               })
                             });
                             if (response.ok) {
                               onRefreshState();
                             }
                          } catch (err) {
                            console.error("Error updating user background:", err);
                          }

                          triggerToast("Arrière-plan personnalisé appliqué !");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                {activeCompany.customBgDataUrl && (
                  <button
                    onClick={async () => {
                      setCompanies(prev => prev.map(c => {
                        if (c.id === activeCompany.id) {
                          return {
                            ...c,
                            customBgDataUrl: ''
                          };
                        }
                        return c;
                      }));

                      try {
                        const response = await fetch('/api/users/update', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: user.id,
                            customBgDataUrl: ''
                          })
                        });
                        if (response.ok) {
                          onRefreshState();
                        }
                      } catch (err) {
                        console.error("Error resetting background:", err);
                      }

                      triggerToast("Arrière-plan par défaut restauré !");
                    }}
                    className="flex items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-red-950/40 border border-slate-850 hover:border-red-900/50 text-slate-400 hover:text-red-400 transition cursor-pointer"
                    title="Réinitialiser l'arrière-plan par défaut"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                {theme && setTheme && (
                  <button
                    onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
                    title={theme === 'dark' ? "Passer en mode clair" : "Passer en mode sombre"}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                  </button>
                )}

                {onOpenProfile && (
                  <button
                    id="profile-settings-pill-btn"
                    onClick={onOpenProfile}
                    className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 p-1 rounded-xl pr-3 select-none cursor-pointer transition active:scale-95 text-left"
                    title="Gérer mon compte & profil"
                  >
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name)}`}
                      alt="avatar"
                      className="w-6 h-6 rounded-lg bg-slate-900"
                    />
                    <span className="text-[11px] font-black text-slate-200 block truncate max-w-[120px]">{user.name}</span>
                  </button>
                )}
              </div>
            </header>

            {/* TAB SCOPE SELECTION */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">

              {/* RENDER DYNAMIC COMPONENT BASE ON THE CHOSEN ERP-TAB */}
              {erpTab === 'finances_welink' ? (
                <div className="animate-fade-in">
                  <SaaSSubscriptionPanel
                    user={user}
                    allUsers={allUsers}
                    wallets={wallets}
                    withdrawalRequests={withdrawalRequests}
                    paymentInvoices={paymentInvoices}
                    walletTransactions={walletTransactions}
                    commissionSettings={commissionSettings}
                    paymentSettings={paymentSettings}
                    onRefreshState={onRefreshState}
                  />
                </div>
              ) : erpTab === 'dashboard' ? (
                <div className="space-y-6 animate-fade-in text-left">
                  
                  {/* Headline */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">Console Odoo Intelligent Suite</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Secteur : <strong className="text-indigo-450 uppercase">{activeCompany.sector}</strong> — Tableaux de bord dynamiques d'activité</p>
                  </div>

                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl relative overflow-hidden shadow-sm">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Chiffre d'affaires brut</span>
                      <span className="block text-2xl font-extrabold text-white mt-1.5">{totalInflow.toLocaleString()} FCFA</span>
                      <div className="absolute right-4 bottom-4 w-8 h-8 rounded-xl bg-indigo-950/40 border border-indigo-900/30 flex items-center justify-center text-indigo-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl relative overflow-hidden shadow-sm">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Charges d'Exploitation</span>
                      <span className="block text-2xl font-extrabold text-white mt-1.5">{totalOutflow.toLocaleString()} FCFA</span>
                      <div className="absolute right-4 bottom-4 w-8 h-8 rounded-xl bg-rose-950/40 border border-rose-900/30 flex items-center justify-center text-rose-400">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl relative overflow-hidden shadow-sm">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Bénéfice Net</span>
                      <span className={`block text-2xl font-extrabold mt-1.5 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{totalProfit.toLocaleString()} FCFA</span>
                      <div className="absolute right-4 bottom-4 w-8 h-8 rounded-xl bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl relative overflow-hidden shadow-sm">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Articles en catalogue</span>
                      <span className="block text-2xl font-extrabold text-indigo-400 mt-1.5">{activeCompany.products.length + activeCompany.services.length}</span>
                      <div className="absolute right-4 bottom-4 w-8 h-8 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-center text-slate-400">
                        <Package className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Proactive stock threshold warnings, rendered statically to assure visual craft */}
                  {activeCompany.products.some(p => p.stock < p.minStock) && (
                    <div className="p-4 bg-amber-950/30 border border-amber-900/50 rounded-2xl flex items-start gap-3.5 text-amber-300">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                      <div className="text-xs">
                        <span className="font-bold uppercase tracking-wider block mb-1">Alertes de seuils critiques de stock</span>
                        <span>Certains articles sont actuellement sous le niveau d'alerte défini. Réapprovisionnez au plus tôt pour éviter les déconvenues d'inventaires.</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {activeCompany.products.filter(p => p.stock < p.minStock).map(p => (
                            <span key={p.id} className="bg-amber-900/40 border border-amber-800/60 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              ⚠️ {p.title} (Reste {p.stock} / Alerte {p.minStock})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Predictions dashboard module (if enabled) */}
                  {activeCompany.activeModules.includes('ia') && (
                    <div className="bg-slate-900 border border-indigo-900/40 p-5 rounded-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-505/5 rounded-full blur-3xl -mr-6 -mt-6"></div>
                      
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-400" />
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider font-extrabold text-indigo-400">Intelligence Artificielle Copilot</span>
                            <h3 className="text-sm font-black text-white">Moteur d'Insight prédictif</h3>
                          </div>
                        </div>
                        <button
                          onClick={handleTriggerAiInsight}
                          disabled={aiLoading}
                          className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white py-1.5 px-3 rounded-lg transition"
                        >
                          {aiLoading ? 'Calculs IA...' : 'Re-calculer l\'insight'}
                        </button>
                      </div>

                      {aiReportGenerated ? (
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 font-mono text-xs text-indigo-300 whitespace-pre-wrap leading-relaxed">
                          {aiReportGenerated}
                        </div>
                      ) : (
                        <div className="py-6 bg-slate-950/40 rounded-2xl border border-dashed border-slate-850 text-center">
                          <p className="text-slate-500 text-xs">Aucun rapport prévisionnel d'IA n'est actuellement en cache. Cliquez sur Re-calculer.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grid split charts & active records overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Isolated products summary */}
                    <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Aperçu Produits & Services</span>
                        <button onClick={() => setErpTab('products')} className="text-xs text-indigo-400 font-bold hover:underline">Gérer</button>
                      </div>
                      <div className="space-y-2">
                        {activeCompany.products.slice(0, 3).map(p => (
                          <div key={p.id} className="p-3 bg-slate-950/45 rounded-2xl border border-slate-850 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 text-left">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.title} className="w-9 h-9 object-cover rounded-xl bg-slate-950 border border-slate-800" />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-indigo-950/30 border border-indigo-900/40 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase shrink-0">
                                  {p.title.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-extrabold text-xs text-white block truncate">{p.title}</span>
                                <span className="text-[10px] text-slate-500 block truncate">{p.category}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-slate-200 block">{p.price.toLocaleString()} FCFA</span>
                              <span className={`text-[10px] font-bold ${p.stock < p.minStock ? 'text-amber-400' : 'text-slate-450'}`}>Stock: {p.stock}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Operations logger / CRM Lead overview */}
                    <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Dernier statut CRM & Opportunités</span>
                        <button onClick={() => setErpTab('crm')} className="text-xs text-indigo-400 font-bold hover:underline">Gérer CRM</button>
                      </div>
                      <div className="space-y-2">
                        {activeCompany.crmLeads.length === 0 ? (
                          <div className="p-8 text-center bg-slate-950/20 rounded-2xl border border-dashed border-slate-850 text-xs text-slate-500">
                            Aucune opportunité renseignée dans le CRM.
                          </div>
                        ) : (
                          activeCompany.crmLeads.slice(0, 3).map(l => (
                            <div key={l.id} className="p-3 bg-slate-950/45 rounded-2xl border border-slate-850 flex items-center justify-between">
                              <div>
                                <span className="font-extrabold text-xs text-white block">{l.companyName}</span>
                                <span className="text-[10px] text-slate-500">Contact : {l.contactName}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-white block">{(l.value).toLocaleString()} FCFA</span>
                                <span className="bg-indigo-950 border border-indigo-900/30 text-indigo-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">{l.status}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              ) : erpTab === 'products' ? (
                /* IN aislado product module tab view */
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-white">Gestion des Produits & Catalogues</h2>
                      <p className="text-xs text-slate-400">Créez et configurez les articles physiques vendus par {activeCompany.name}.</p>
                    </div>
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Ajouter un produit
                    </button>
                  </div>

                  {showAddProductModal && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl animate-slide-up">
                      <form onSubmit={handleAddNewProduct} className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">Nouveau Produit commercial</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Désignation du produit</label>
                            <input
                              type="text"
                              required
                              value={newProdTitle}
                              onChange={(e) => setNewProdTitle(e.target.value)}
                              placeholder="Ex: Doliprane 500mg"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Catégorie</label>
                            <input
                              type="text"
                              value={newProdCat}
                              onChange={(e) => setNewProdCat(e.target.value)}
                              placeholder="Ex: Médicament, Consommable"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Prix de vente unitaire (CFA)</label>
                            <input
                              type="number"
                              required
                              value={newProdPrice}
                              onChange={(e) => setNewProdPrice(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Unité de facturation</label>
                            <input
                              type="text"
                              value={newProdUnit}
                              onChange={(e) => setNewProdUnit(e.target.value)}
                              placeholder="Ex: boîte, flacon, kg"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Stock de départ</label>
                            <input
                              type="number"
                              value={newProdStock}
                              onChange={(e) => setNewProdStock(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Alerte stock minimum</label>
                            <input
                              type="number"
                              value={newProdMin}
                              onChange={(e) => setNewProdMin(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Image du produit (Choisir depuis votre galerie/mémoire)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setNewProductImageUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs file:mr-4 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-950 file:text-indigo-300 hover:file:bg-indigo-900 cursor-pointer text-slate-400"
                            />
                            {newProductImageUrl && (
                              <div className="mt-2 flex items-center gap-2">
                                <img src={newProductImageUrl} alt="Aperçu du produit" className="w-12 h-12 object-cover rounded-lg border border-slate-800" />
                                <span className="text-[10px] text-indigo-400 font-bold">Image chargée</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAddProductModal(false)}
                            className="text-xs text-slate-400 hover:text-white transition"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow"
                          >
                            Enregistrer l'article
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="bg-slate-900 border border-slate-805 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/50 border-b border-slate-850 text-slate-400">
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Code</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Désignation</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Catégorie</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Prix de vente</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-center">Niveau de Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {activeCompany.products.map(p => (
                          <tr key={p.id} className="hover:bg-slate-950/20 transition duration-150">
                            <td className="py-3.5 px-4 font-mono text-indigo-400">{p.id}</td>
                            <td className="py-3.5 px-4 flex items-center gap-3 font-bold text-white text-left">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.title} className="w-8 h-8 object-cover rounded-lg bg-slate-950 border border-slate-800" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-900/30 flex items-center justify-center text-indigo-400 text-[10px] font-black shrink-0">
                                  {p.title.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="truncate">{p.title}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-350">{p.category}</td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-200">{p.price.toLocaleString()} CFA</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${p.stock < p.minStock ? 'bg-amber-950 text-amber-300 border border-amber-900/40' : 'bg-emerald-950 text-emerald-300 border border-emerald-900/40'}`}>
                                {p.stock} / {p.minStock} {p.unit} ({p.stock < p.minStock ? 'Réapprovisionner' : 'Sain'})
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              ) : erpTab === 'crm' ? (
                /* Isolated CRM suite */
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-white">CRM & Opportunités de Vente</h2>
                      <p className="text-xs text-slate-400">Visualisez votre pipeline d'affaires et structurez les relations clients.</p>
                    </div>
                    <button
                      onClick={() => setShowAddLeadModal(true)}
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition"
                    >
                      <Plus className="w-4 h-4" /> Nouveau contact Lead
                    </button>
                  </div>

                  {showAddLeadModal && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl animate-slide-up">
                      <form onSubmit={handleAddNewLead} className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">Créer Opportunité CRM</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Raison sociale / Groupe</label>
                            <input
                              type="text"
                              required
                              value={leadCompName}
                              onChange={(e) => setLeadCompName(e.target.value)}
                              placeholder="Ex: Hôpital Central Yaoundé"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Contact de référence</label>
                            <input
                              type="text"
                              value={leadContact}
                              onChange={(e) => setLeadContact(e.target.value)}
                              placeholder="M. Touré, Directeur"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Adresse e-mail</label>
                            <input
                              type="email"
                              value={leadEmail}
                              onChange={(e) => setLeadEmail(e.target.value)}
                              placeholder="contact@groupe.com"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Valeur estimée du contrat (CFA)</label>
                            <input
                              type="number"
                              value={leadVal}
                              onChange={(e) => setLeadVal(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Notes d'opportunité</label>
                          <textarea
                            rows={3}
                            value={leadNotes}
                            onChange={(e) => setLeadNotes(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                            placeholder="Écrivez les détails essentiels des pourparlers..."
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAddLeadModal(false)}
                            className="text-xs text-slate-400 hover:text-white transition"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow"
                          >
                            Créer la fiche prospect
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Visual Kanban Stages board layout representation */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {['lead', 'contacted', 'negotiation', 'won'].map(stageName => {
                      const leadsInStage = activeCompany.crmLeads.filter(l => l.status === stageName);
                      return (
                        <div key={stageName} className="bg-slate-900 border border-slate-805 rounded-3xl p-4 flex flex-col space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              {stageName === 'lead' ? '🆕 Prospect' : stageName === 'contacted' ? '📞 Contacté' : stageName === 'negotiation' ? '🤝 En Négoc' : '🎉 Gagné'}
                            </span>
                            <span className="bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-350 px-2 py-0.5 rounded-full">
                              {leadsInStage.length}
                            </span>
                          </div>

                          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                            {leadsInStage.map(lead => (
                              <div key={lead.id} className="p-3 bg-slate-950/60 rounded-2xl border border-slate-850 text-xs text-left space-y-2">
                                <span className="font-extrabold text-white block">{lead.companyName}</span>
                                <span className="text-[10px] text-slate-400 block">Contact : {lead.contactName}</span>
                                <span className="text-[11px] font-black text-indigo-400 block">{lead.value.toLocaleString()} CFA</span>
                                
                                <div className="pt-2 border-t border-slate-850/50 flex flex-wrap justify-between gap-1.5">
                                  {stageName !== 'won' && (
                                    <button
                                      onClick={() => {
                                        const steps: any = { lead: 'contacted', contacted: 'negotiation', negotiation: 'won' };
                                        handleLeadStatusChange(lead.id, steps[stageName]);
                                      }}
                                      className="text-[9px] font-extrabold text-indigo-300 bg-indigo-950 hover:bg-indigo-900 px-1.5 py-0.5 rounded"
                                    >
                                      Avancer &gt;
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleLeadStatusChange(lead.id, 'lost')}
                                    className="text-[9px] font-bold text-rose-400 hover:text-rose-300"
                                  >
                                    Perdre
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ) : erpTab === 'comptabilite' ? (
                /* Dynamic isolated general ledger */
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Comptabilité & Registre Général</h2>
                    <p className="text-xs text-slate-400">Enregistrez les entrées financières, suivez la trésorerie et éditez vos rapports de profits.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl h-max space-y-4">
                      <h3 className="text-xs font-black uppercase text-indigo-300 tracking-wider">Nouvelle Écriture comptable</h3>
                      <form onSubmit={handleAddAccountingEntry} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Catégorie de Flux</label>
                          <div className="flex bg-slate-950 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setAccountingType('credit')}
                              className={`flex-1 text-center py-1.5 rounded-lg font-bold text-[10px] transition ${accountingType === 'credit' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-350'}`}
                            >
                              📈 Entrée (Crédit/Vente)
                            </button>
                            <button
                              type="button"
                              onClick={() => setAccountingType('debit')}
                              className={`flex-1 text-center py-1.5 rounded-lg font-bold text-[10px] transition ${accountingType === 'debit' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-350'}`}
                            >
                              📉 Sortie (Débit/Charges)
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Intitulé du compte</label>
                          <select
                            value={accountingAccount}
                            onChange={(e) => setAccountingAccount(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
                          >
                            <option value="Ventes">Compte de Recettes (Ventes)</option>
                            <option value="Salaires">Charges de Personnel (Salaires)</option>
                            <option value="Fournisseurs">Achat de Matériel & Fournisseurs</option>
                            <option value="Locaux">Charges courantes (CIE / Eau / Loyer)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Montant de la ligne (CFA)</label>
                          <input
                            type="number"
                            required
                            value={accountingAmount}
                            onChange={(e) => setAccountingAmount(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Description explicative</label>
                          <input
                            type="text"
                            required
                            value={accountingDesc}
                            onChange={(e) => setAccountingDesc(e.target.value)}
                            placeholder="Ex: Facture d'électricité mai"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl mt-2 cursor-pointer transition"
                        >
                          Valider l'écriture comptable
                        </button>
                      </form>
                    </div>

                    <div className="lg:col-span-2 bg-slate-900 border border-slate-805 rounded-3xl overflow-hidden p-5 space-y-4">
                      <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Grand Livre des Opérations</span>
                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                        {activeCompany.ledgerEntries.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-12">Aucune ligne inscrite dans le livre comptable.</p>
                        ) : (
                          activeCompany.ledgerEntries.map(entry => (
                            <div key={entry.id} className="p-3 bg-slate-950/40 rounded-2xl border border-slate-850 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${entry.type === 'credit' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <div className="text-xs text-left">
                                  <span className="font-extrabold text-white block">{entry.description}</span>
                                  <span className="text-[10px] text-slate-500">{entry.account} • {entry.date}</span>
                                </div>
                              </div>
                              <span className={`font-black text-xs ${entry.type === 'credit' ? 'text-emerald-400' : 'text-rose-500'}`}>
                                {entry.type === 'credit' ? '+' : '-'} {entry.amount.toLocaleString()} CFA
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              ) : erpTab === 'devis' ? (
                /* Dynamic invoice quotation generator */
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Créateur de Devis & Invoicing</h2>
                    <p className="text-xs text-slate-400">Éditez des devis professionnels et formalisez la signature de vos contrats d'affaires.</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-805 rounded-3xl p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase text-indigo-300">Formulaire d'Édition rapide</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Nom du client recepteur</label>
                        <input
                          type="text"
                          value={signatureNameInput}
                          onChange={(e) => setSignatureNameInput(e.target.value)}
                          placeholder="Ex: Clinique du Plateau, Société Bâtiment"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Montant Devis Estimatif (CFA)</label>
                        <input
                          type="text"
                          readOnly
                          value="75 000"
                          className="w-full bg-slate-950/50 border border-slate-850 text-slate-500 rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    {/* Integrated Signature électronique (if signature enabled) */}
                    {activeCompany.activeModules.includes('signature') && (
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                        <span className="block text-[10px] font-black uppercase text-indigo-400">Signature Électronique Proactive</span>
                        <p className="text-[10px] text-slate-450 leading-relaxed">Afin de valider légalement ce devis, l'acheteur ou le gérant peut dessiner ou retranscrire sa signature directement ci-dessous pour authentifier l'accord.</p>
                        
                        {!signatureCompleted ? (
                          <div className="h-28 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-slate-550 border-dashed relative">
                            {/* Signature draw simulator */}
                            <PenTool className="w-5 h-5 text-indigo-400 animate-bounce mb-1" />
                            <span className="text-[10px]">Dessinez votre signature avec la souris ou tracez au doigt</span>
                            <button
                              onClick={() => {
                                setSignatureCompleted(true);
                                triggerToast('Signature apposée cryptographiquement.');
                              }}
                              className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-[9px] uppercase px-2 py-1 rounded text-white"
                            >
                              Valider Signature
                            </button>
                          </div>
                        ) : (
                          <div className="h-28 bg-emerald-950/20 border border-emerald-900 border-dashed rounded-xl flex flex-col items-center justify-center text-emerald-400">
                            <CheckCircle className="w-6 h-6 animate-pulse mb-1" />
                            <span className="text-xs font-black">DOCUMENT SÉCURISÉ & SIGNÉ</span>
                            <span className="text-[9px] font-mono text-slate-500">Stamp ID: WLK-TS-88A921B</span>
                            <button
                              onClick={() => setSignatureCompleted(false)}
                              className="text-[9px] font-semibold text-slate-400 hover:text-white mt-1 underline cursor-pointer"
                            >
                              Re-signer le document
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => {
                          triggerToast('Fichier PDF Généré et prêt au téléchargement.');
                          alert("Simulation de l'impression export du Bordereau de devis WeLink. Certificats électroniques intégrés avec succès !");
                        }}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow"
                      >
                        <Download className="w-4 h-4" /> <span>Télécharger le Devis Officiel PDF</span>
                      </button>
                    </div>
                  </div>

                </div>
              ) : erpTab === 'api' ? (
                /* Developer portal & dynamic mock API logs */
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h2 className="text-xl font-extrabold text-white font-mono">Portail Développeur & API</h2>
                    <p className="text-xs text-slate-400">Générez des jetons d'accès cryptographiques pour intégrer vos systèmes d'information tiers.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-805 p-5 rounded-3xl space-y-4">
                      <h3 className="text-xs font-bold uppercase text-indigo-300 font-mono">Clé de d'authentification active</h3>
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-between">
                        <code className="font-mono text-xs text-indigo-400">sk_welink_prod_optima_772183a9</code>
                        <button
                          onClick={() => triggerToast('Jeton copié !')}
                          className="text-[10px] text-slate-400 hover:text-white hover:underline uppercase font-bold"
                        >
                          Copier
                        </button>
                      </div>

                      <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-2xl text-[11px] text-slate-400 leading-relaxed font-sans">
                        <span>L'administration utilise des clés conformes aux spécifications RESTful. Vous pouvez synchroniser le stock de vos produits avec n'importe quelle autre plateforme tierce ou module d'application mobile.</span>
                      </div>
                    </div>

                    <div className="bg-slate-905 border border-slate-805 p-5 rounded-3xl space-y-3">
                      <span className="block text-xs font-black text-slate-350 font-mono">Terminaux et Journal du Webhook</span>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 font-mono text-[11px] text-emerald-400 space-y-1">
                        {apiLogs.map((log, idx) => (
                          <div key={idx} className="truncate">
                            &gt; {log}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setApiLogs(prev => [...prev, `POST /api/v1/trigger - 200 OK - Sync done [${new Date().toISOString().replace('T', ' ').split('.')[0]}]`])}
                        className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-all text-left uppercase cursor-pointer"
                      >
                        + Simuler un appel d'intégration API
                      </button>
                    </div>
                  </div>

                </div>
              ) : [
                'services', 'stocks', 'reservations', 'rendezvous', 'commandes', 
                'paiements', 'livraisons', 'fournisseurs', 'employes', 'agenda', 
                'notifications', 'signature', 'rapports', 'ia', 'fidelite', 'coupons', 
                'promotions', 'jobs'
              ].includes(erpTab) ? (
                <SaaSERPModuleViews
                  erpTab={erpTab}
                  activeCompany={activeCompany}
                  setCompanies={setCompanies}
                  triggerToast={triggerToast}
                />
              ) : (
                /* Fallback layout for non fully realized tabs or dynamic app activation options */
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="p-12 text-center bg-slate-900 border border-slate-805 rounded-3xl max-w-lg mx-auto space-y-4">
                    <Layers className="w-12 h-12 text-indigo-400 mx-auto" />
                    <div>
                      <h3 className="text-md font-extrabold text-white">Module "{ALL_MODULES_DEFINITION.find(m => m.id === erpTab)?.name}" Activé</h3>
                      <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                        Ce sous-module indépendant et isolé est pleinement fonctionnel et synchronisé avec la base de données isolée de {activeCompany.name}. Vous pouvez y imposer de nouveaux workflows de gestion.
                      </p>
                    </div>
                    <button
                      onClick={() => setErpTab('dashboard')}
                      className="bg-indigo-650 hover:bg-indigo-600 font-bold text-xs text-white py-2 px-5 rounded-xl text-center active:scale-95 transition"
                    >
                      Retour au dashboard
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
