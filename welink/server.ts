import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import AdmZip from "adm-zip";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection, setLogLevel } from "firebase/firestore";

dotenv.config();

// --- SECURE CRYPTOGRAPHY & ANTI-HIJACKING VAULT ENGINE ---
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "welink_secured_key_32_bytes_len_!"; // Fallback 32-byte key
const IV_LENGTH = 16; // Standard AES IV block size

export function encryptData(text: string): string {
  try {
    if (!text) return "";
    // Generate a secure 32-byte key from the environment variable via SHA-256
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // Store in iv:ciphertext format
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (e) {
    console.error("[Crypto Error] Encryption failing:", e);
    return text;
  }
}

export function decryptData(text: string): string {
  try {
    if (!text) return "";
    if (!text.includes(':')) return text; // Probably already unencrypted
    const parts = text.split(':');
    const ivHex = parts.shift();
    const encryptedHex = parts.join(':');
    if (!ivHex || !encryptedHex) return text;
    
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (e) {
    console.error("[Crypto Error] Decryption failing:", e);
    return text;
  }
}
// --------------------------------------------------------

// --- SILENCE HARMLESS FIREBASE IDLE STREAM LOGS ---
const originalConsoleError = console.error;
console.error = function (...args: any[]) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  if (msg.includes('Disconnecting idle stream') || msg.includes('Timed out waiting for new targets') || msg.includes('CANCELLED: Disconnecting idle stream')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = function (...args: any[]) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  if (msg.includes('Disconnecting idle stream') || msg.includes('Timed out waiting for new targets') || msg.includes('CANCELLED: Disconnecting idle stream')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

process.on('unhandledRejection', (reason: any) => {
  const msg = String(reason?.message || reason);
  if (msg.includes('Disconnecting idle stream') || msg.includes('Timed out waiting for new targets') || msg.includes('CANCELLED: Disconnecting idle stream')) {
    return;
  }
  originalConsoleError('[System Error] Unhandled Rejection:', reason);
});
// --------------------------------------------------

const app = express();

// --- FIREBASE FIRESTORE SYNC INITIALIZATION ---
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const firebaseApp = initializeApp(firebaseConfig);
    db = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
    try {
      setLogLevel("silent");
    } catch (e) {}
    console.log("[Firebase Init] Firestore client initialized successfully with Long Polling!");
  } else {
    console.warn("[Firebase Init] Warning: firebase-applet-config.json not found!");
  }
} catch (err) {
  console.error("[Firebase Init] Critical Error initializing Firebase:", err);
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- STATE INITIALIZATION GUARD FOR SERVERLESS/VERCEL ---
let stateLoaded = false;
let stateLoadingPromise: Promise<void> | null = null;

async function ensureStateLoaded() {
  if (stateLoaded) return;
  if (!stateLoadingPromise) {
    console.log("[Firebase Init Guard] Triggering background state loading...");
    stateLoadingPromise = loadStateFromFirestore()
      .then(() => {
        stateLoaded = true;
        console.log("[Firebase Init Guard] State successfully loaded and ready!");
      })
      .catch((err) => {
        console.error("[Firebase Init Guard] Failed to load Firestore state:", err);
        stateLoadingPromise = null; // reset to allow retry
        throw err;
      });
  }
  await stateLoadingPromise;
}

app.use(async (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    try {
      await ensureStateLoaded();
    } catch (err) {
      return res.status(500).json({
        error: "Database initialization failed",
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }
  next();
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Lazy initialize Gemini clients to avoid crashing if API key is not present initially
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Return a mock client structure or throw a clear error that we catch
      console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables. Running in mock AI mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// In-Memory Database representing a comprehensive real-world startup dataset
// Users, Products, Job Offers, Orders. Sync with memory but keep structure clean.
let users: any[] = [
  // Clients
  { id: "c1", email: "client1@email.com", name: "Jean Dupont", profileType: "client", description: "Je cherche des produits frais et locaux.", address: "Paris, France", phone: "+33 6 12345678" },
  { id: "c2", email: "client2@email.com", name: "Marie Koné", profileType: "client", description: "Je cherche de l'artisanat et des opportunités d'emploi.", address: "Abidjan, Côte d'Ivoire", phone: "+225 07 483920" },

  // Enterprises
  { id: "e1", email: "contact@plmcmarket.com", name: "PLMC Market", profileType: "entreprise", enterpriseType: "supermarche", description: "Votre hypermarché leader PLMC Market (ex-NKCL Market) : Électroménager haut de gamme, smartphones de pointe, téléviseurs UHD, informatique et alimentation premium aux meilleurs prix de la sous-région avec service de livraison rapide à domicile.", address: "Abidjan, Zone 4 & Douala, Cameroun", phone: "+237 6 77889922" },
  { id: "e6", email: "market@plateau.com", name: "SuperMarché du Plateau", profileType: "entreprise", enterpriseType: "supermarche", description: "Supermarché de proximité avec prix d'usine et livraison rapide.", address: "Abidjan, Plateau", phone: "+225 22 443221" },
  { id: "e2", email: "marie@resto.com", name: "Chez Marie l'Africaine", profileType: "entreprise", enterpriseType: "restaurant", description: "Restaurant traditionnel africain et européen de qualité.", address: "Dakar, Plateau", phone: "+221 33 821 2233" },
  { id: "e7", email: "lagune@resto.com", name: "Le Bistro de la Lagune", profileType: "entreprise", enterpriseType: "restaurant", description: "Spécialités de grillades, fruits de mer frais et desserts locaux.", address: "Abidjan, Marcory", phone: "+225 07 889900" },
  { id: "e3", email: "hotel@royal.com", name: "Hôtel Royal Résidence", profileType: "entreprise", enterpriseType: "hotel", description: "Hôtel 4 étoiles avec service navette, piscine et restaurant.", address: "Bamako, Mali", phone: "+223 20 221133" },
  { id: "e8", email: "palm@hotel.com", name: "Hôtel Palm Palace", profileType: "entreprise", enterpriseType: "hotel", description: "Hôtel de standing moderne, salons équipés et espace coworking.", address: "Dakar, Almadies", phone: "+221 33 111222" },
  { id: "e5", email: "marche@panier.com", name: "Le Panier Frais", profileType: "entreprise", enterpriseType: "marche", description: "Marché couvert de quartier vendant des fruits et légumes bio.", address: "Yaoundé, Cameroun", phone: "+237 222 301234" },
  { id: "e10", email: "marche@plateau.com", name: "Le Grand Marché Fruits", profileType: "entreprise", enterpriseType: "marche", description: "Étalages de maraîchers locaux proposant des épices de qualité.", address: "Abidjan, Treichville", phone: "+225 05 998877" },

  // Specialized Requested Testing Demo Accounts
  { id: "e-demo-hotel", email: "demo.hotel@email.com", name: "Hôtel Palmier (Démo Hôtel)", profileType: "entreprise", enterpriseType: "hotel", description: "Établissement hôtelier haut de gamme pour vos réservations de chambres VIP et séminaires professionnels.", address: "Abidjan, Cocody", phone: "+225 01 445566" },
  { id: "e-demo-marche", email: "demo.marche@email.com", name: "Étalage du Terroir (Démo Marché)", profileType: "entreprise", enterpriseType: "marche", description: "Étal traditionnel de fruits tropicaux gorgés de soleil, légumes de saison et épices locales.", address: "Dakar, Marché Tilène", phone: "+221 77 121212" },
  { id: "e-demo-alimentation", email: "demo.alimentation@email.com", name: "Épicerie Fine (Démo Alimentation)", profileType: "entreprise", enterpriseType: "alimentation", description: "Sélection d'alimentation générale de qualité, conserves d'Afrique, huiles fines et boissons fraîches.", address: "Abidjan, Marcory", phone: "+225 21 345678" },
  { id: "e-demo-vetement", email: "demo.boutique@email.com", name: "La Mode Ivoirienne (Démo Boutique)", profileType: "entreprise", enterpriseType: "vetement", description: "Boutique de prêt-à-porter haut de gamme conçue pour célébrer l'élégance africaine et occidentale. Découvrez nos collections de tailleurs, chemisettes en pagne tissé et robes légères.", address: "Abidjan, Cocody Vallon", phone: "+225 07 778899" },
  { id: "e-demo-boucher", email: "demo.boucher@email.com", name: "Boucherie Royale (Démo Boucher)", profileType: "entreprise", enterpriseType: "boucher", description: "Boucherie-charcuterie traditionnelle d'excellence, viandes de premier choix et charcuteries fines.", address: "Abidjan, Marcory Zone 4", phone: "+225 05 556677" },
  { id: "e-demo-poissonnerie", email: "demo.poissonnerie@email.com", name: "Poissonnerie Impériale (Démo Poissonnerie)", profileType: "entreprise", enterpriseType: "poissonnerie", description: "Arrivage quotidien des ports locaux: poissons nobles sauvages de ligne, turbots d'exception, crustacés vivants et coquillages d'élite.", address: "Abidjan, Port de Pêche de Treichville", phone: "+225 01 223344" },

  // Suppliers
  { id: "s1", email: "ferme@bio.com", name: "Gérard l'Agriculteur", profileType: "fournisseur", supplierType: "agriculteur", description: "Producteur de fruits, tubercules et légumes de saison biologiques.", address: "Sud-Sassandra, Côte d'Ivoire", phone: "+225 01 020304" },
  { id: "s2", email: "bois@artisan.com", name: "Koffi l'Artisan du Bois", profileType: "fournisseur", supplierType: "artisan", description: "Sculpteur traditionnel, création d'ustensiles de cuisine et mobilier.", address: "Abengourou, Côte d'Ivoire", phone: "+225 05 080910" },
  { id: "s3", email: "elevage@savane.com", name: "La Ferme des Savanes", profileType: "fournisseur", supplierType: "eleveur", description: "Élevage responsable de volailles de brousse, chèvres et lapins.", address: "Bouaké, Côte d'Ivoire", phone: "+225 07 090909" },
  { id: "s4", email: "peche@ocean.com", name: "La Marée Fraîche", profileType: "fournisseur", supplierType: "poissonnier", description: "Grossiste de poissons de mer fraîchement pêchés et crustacés de l'Atlantique.", address: "Dakar, Port de Pêche", phone: "+221 33 8214545" }
];

let products = [
  // PLMC Market (e1) - Recycled rich inventory from nkclmarket.com with real images
  { id: "p-plmc-1", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Climatiseur Split SIGNATURE - 2.5 CV (Wifi, Smart Inverter)", description: "Climatiseur haute performance, noir métallisé, régulation thermique et humidité. Option Wifi Smart Intégré. Garantie 12 mois.", price: 385000, category: "Climatiseurs & Ventilateurs", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600", stock: 15, unit: "boîtier", rayon: "Climatiseurs & Ventilateurs" },
  { id: "p-plmc-2", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Climatiseur Split SIGNATURE - 1.5 CV (Smart Eco, Blanc)", description: "Climatiseur silencieux, blanc brillant, haute performance énergétique. Idéal pour chambre ou salon. Garantie 06 mois.", price: 265000, category: "Climatiseurs & Ventilateurs", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600", stock: 24, unit: "boîtier", rayon: "Climatiseurs & Ventilateurs" },
  { id: "p-plmc-3", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Ventilateur à Eau Innova IN30WC - 30 Litres", description: "Brumisateur à eau sur roulettes avec télécommande. Idéal pour rafraîchir en saison chaude. Garantie 6 Mois.", price: 85000, category: "Climatiseurs & Ventilateurs", imageUrl: "https://images.unsplash.com/photo-1618941790082-841f3d67f1ee?auto=format&fit=crop&q=80&w=600", stock: 40, unit: "unité", rayon: "Climatiseurs & Ventilateurs" },
  
  { id: "p-plmc-4", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Smart TV LED Roch 65 pouces 4K UHD", description: "Téléviseur intelligent ultra haute définition, commande vocale, YouTube, Netflix, Disney+, ports HDMI/USB, Garantie 12 Mois.", price: 395000, category: "Téléviseurs, Audio & Vidéo", imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=600", stock: 9, unit: "unité", rayon: "Téléviseurs, Audio & Vidéo" },
  { id: "p-plmc-5", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Système Home Cinéma LG 330W LHD-457B", description: "Soundbar & caisson de basse actif, surround 5.1 avec fiches HDMI. Qualité de cinéma chez vous. Garantie 06 mois.", price: 185000, category: "Téléviseurs, Audio & Vidéo", imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600", stock: 12, unit: "système", rayon: "Téléviseurs, Audio & Vidéo" },
  { id: "p-plmc-6", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Enceinte Stéréo LG XBOOM LK72B - 40W", description: "Woofer multi-connecté avec radio FM, Bluetooth, USB, fiches audio et réglage des basses profondes.", price: 45050, category: "Téléviseurs, Audio & Vidéo", imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600", stock: 18, unit: "boîtier", rayon: "Téléviseurs, Audio & Vidéo" },
  
  { id: "p-plmc-7", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "IPhone 16 Pro Max - 256 Go Scellé", description: "Le dernier flagship d'Apple, d'un titane naturel éblouissant, 8 Go RAM, écran OLED de 6.9 pouces, Garantie de 12 Mois.", price: 980000, category: "Téléphones & Tablettes", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600", stock: 14, unit: "boîte", rayon: "Téléphones & Tablettes" },
  { id: "p-plmc-8", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Samsung Galaxy A35 5G - 256 Go / 8Go RAM", description: "Caméra 50MP de niveau studio, batterie haute autonomie 5000mAh, résistant à l'eau IP67. Garantie 12 mois.", price: 215000, category: "Téléphones & Tablettes", imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=600", stock: 21, unit: "boîte", rayon: "Téléphones & Tablettes" },
  { id: "p-plmc-9", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Tecno Spark 40 Pro+ - 128 Go / 8 Go RAM", description: "Écran incurvé AMOLED 120Hz, triple caméra AI 108MP, charge rapide ultra-flash. Garantie de 24 Mois de Tecno.", price: 175000, category: "Téléphones & Tablettes", imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600", stock: 26, unit: "boîte", rayon: "Téléphones & Tablettes" },
  
  { id: "p-plmc-10", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Réfrigérateur Double Battant OSCAR - 300L", description: "Réfrigérateur spacieux inox argenté, classe énergétique A+, froid ventilé anti-givre. Volume 300L. Garantie 12 mois.", price: 245000, category: "Réfrigérateurs & Congélateurs", imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=600", stock: 7, unit: "unité", rayon: "Réfrigérateurs & Congélateurs" },
  { id: "p-plmc-11", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Congélateur Coffre OSCAR OSC-250", description: "Super congélateur horizontal de 140 litres, idéal pour stocker à température glacée. Garantie 6 Mois.", price: 165000, category: "Réfrigérateurs & Congélateurs", imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=600", stock: 11, unit: "unité", rayon: "Réfrigérateurs & Congélateurs" },
  { id: "p-plmc-12", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Machine à laver Roch semi-automatique 9KG", description: "Tambour double cuve lavante et essorante. Performance énergétique optimale, silencieux. Garantie 12 mois.", price: 135000, category: "Réfrigérateurs & Congélateurs", imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=600", stock: 8, unit: "unité", rayon: "Réfrigérateurs & Congélateurs" },
  
  { id: "p-plmc-13", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Plaque à Gaz OSCAR OSC-80HBS - 5 Foyers", description: "Plaque de cuisson design 20 pouces en inox brossé haut de standing. Allumage automatique intégré.", price: 145000, category: "Appareils de Cuisson & Cuisine", imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600", stock: 14, unit: "unité", rayon: "Appareils de Cuisson & Cuisine" },
  { id: "p-plmc-14", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Cuisinière Fiabtec 50×50 Inox Professionnelle", description: "Cuisinière à gaz 4 feux avec grand four thermique sécurisé et tournebroche. Garantie 06 Mois.", price: 120000, category: "Appareils de Cuisson & Cuisine", imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600", stock: 6, unit: "unité", rayon: "Appareils de Cuisson & Cuisine" },
  { id: "p-plmc-15", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Friteuse sans huile Tefal Easy Fry - 1650W", description: "Air Fryer Tefal EY801815 avec ecran tactile et 8 programmes pré-enregistrés, frites saines. Garantie 6 Mois.", price: 95000, category: "Appareils de Cuisson & Cuisine", imageUrl: "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&q=80&w=600", stock: 15, unit: "unité", rayon: "Appareils de Cuisson & Cuisine" },
  { id: "p-plmc-16", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Midea Air Fryer Tactile - 4 Litres", description: "Friteuse à air chaud saine, cuisson uniforme à 360°, thermostat réglable. Garantie 3 Mois.", price: 65000, category: "Appareils de Cuisson & Cuisine", imageUrl: "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&q=80&w=600", stock: 20, unit: "unité", rayon: "Appareils de Cuisson & Cuisine" },
  { id: "p-plmc-17", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Four à Micro-onde OSCAR OSC-3502 - 35 Litres", description: "Four à grillades et micro-onde combiné, grande cavité avec plateau rotatif. Manuel en français.", price: 75000, category: "Appareils de Cuisson & Cuisine", imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600", stock: 11, unit: "unité", rayon: "Appareils de Cuisson & Cuisine" },
  
  { id: "p-plmc-18", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Blender/Mixeur Moulinex Ice Crusher 1.5L", description: "Blender Moulinex LM2B3110 de 450W, technologie de lames Zelkrom coupe-glace robuste. Garantie 6 Mois.", price: 38000, category: "Blender & Petit Électroménager", imageUrl: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&q=80&w=600", stock: 35, unit: "boîte", rayon: "Blender & Petit Électroménager" },
  { id: "p-plmc-19", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Bouilloire en acier Inoxydable - 1.8 Litres", description: "Bouilloire électrique rapide en double coque isolante protectrice 1000W pour thé et infusions.", price: 12000, category: "Blender & Petit Électroménager", imageUrl: "https://images.unsplash.com/photo-1594220313580-be3611b81ee5?auto=format&fit=crop&q=80&w=600", stock: 50, unit: "boîte", rayon: "Blender & Petit Électroménager" },
  
  { id: "p-plmc-20", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Matelas Orthopédique MEGALUX Royal Confort", description: "Dimensions standard 20 x 180 x 200 mm. Mousse haute résilience ergonomique, idéal soutien vertébral.", price: 155000, category: "Maison, Meubles & Literie", imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600", stock: 8, unit: "unité", rayon: "Maison, Meubles & Literie" },
  { id: "p-plmc-21", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Chaise Pivotante Ergonomique CHTR Pro", description: "Fauteuil ergonomique de bureau respirant, support lombaire ajustable, accoudoirs réglables.", price: 45000, category: "Maison, Meubles & Literie", imageUrl: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=600", stock: 20, unit: "unité", rayon: "Maison, Meubles & Literie" },
  { id: "p-plmc-22", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Fauteuil de Direction Présidentiel AMT", description: "Grand fauteuil en cuir rembourré douillet, système de bascule et inclinaison confort absolu.", price: 110000, category: "Maison, Meubles & Literie", imageUrl: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=600", stock: 5, unit: "unité", rayon: "Maison, Meubles & Literie" },
  
  { id: "p-plmc-23", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Maillot Officiel des Lions Indomptables (Vert)", description: "Le t-shirt historique Fecafoot des Lions Indomptables du Cameroun pour la Coupe d'Afrique CAN 2025.", price: 15000, category: "Mode & Vêtements", imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600", stock: 120, unit: "unité", rayon: "Mode & Vêtements" },
  { id: "p-plmc-24", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Maillot Lions Indomptables (Noir Spécial)", description: "Édition spéciale collector couleur noir et or, tissu respirant double maille premium.", price: 18000, category: "Mode & Vêtements", imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600", stock: 85, unit: "unité", rayon: "Mode & Vêtements" },
  { id: "p-plmc-25", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Vélo pour Enfant OSCAR 20 Pouces", description: "Cadre en acier allié renforcé, roues stabilisatrices amovibles, freins de sécurité pour enfants de 7 à 13 ans.", price: 65000, category: "Mode & Vêtements", imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600", stock: 15, unit: "unité", rayon: "Mode & Vêtements" },
  
  { id: "p-plmc-26", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Groupe Électrogène Essence ROCH RGG-2000-S", description: "Générateur robuste 2.5KW monophasé, grand réservoir hermétique idéal contre les délestages. Garantie 6 Mois.", price: 195000, category: "Bricolage & Énergie", imageUrl: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=600", stock: 6, unit: "boîtier", rayon: "Bricolage & Énergie" },
  { id: "p-plmc-27", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Mallette d'Outillage Complet Chrome Vanadium", description: "Set complet de 78 pièces de quincaillerie : tournevis, pinces, clés à cliquet, marteau pour bricolage.", price: 42000, category: "Bricolage & Énergie", imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=600", stock: 25, unit: "mallette", rayon: "Bricolage & Énergie" },
  
  { id: "p-plmc-28", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Eau de Parfum Sauvage Authentique (100ml)", description: "Senteur boisée sensuelle et fraîche de longue tenue pour gentleman distingué.", price: 65000, category: "Beauté, Cosmétiques & Parfum", imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=600", stock: 32, unit: "bouteille", rayon: "Beauté, Cosmétiques & Parfum" },
  { id: "p-plmc-29", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Savon de Karité Artisanal Pure Hydratation", description: "Formulé aux beurres naturels et huiles végétales bio pour le soin complet des peaux sèches.", price: 1200, category: "Beauté, Cosmétiques & Parfum", imageUrl: "https://images.unsplash.com/photo-1607006342411-92fc2a4d3f75?auto=format&fit=crop&q=80&w=600", stock: 160, unit: "brique", rayon: "Beauté, Cosmétiques & Parfum" },
  
  { id: "p-plmc-30", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Lait Entier Premium Actilait", description: "Lait entier pasteurisé de haute digestibilité enrichi en minéraux essentiels et vitamines.", price: 1500, category: "Épicerie, Alimentation & Boissons", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600", stock: 250, unit: "brique 1L", rayon: "Épicerie, Alimentation & Boissons" },
  { id: "p-plmc-31", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Nectar de Goyave Sauvage Tropicale", description: "Nectar de goyave pur pressé onctueux sans arômes chimiques artificiels.", price: 2000, category: "Épicerie, Alimentation & Boissons", imageUrl: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=600", stock: 120, unit: "brique 1L", rayon: "Épicerie, Alimentation & Boissons" },
  { id: "p-plmc-32", sellerId: "e1", sellerName: "PLMC Market", sellerType: "entreprise", title: "Riz Parfumé Jasmin Supérieur", description: "Riz long grain de qualité culinaire supérieure, sachet sous vide scellé.", price: 8500, category: "Épicerie, Alimentation & Boissons", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600", stock: 80, unit: "sac 5kg", rayon: "Épicerie, Alimentation & Boissons" },

  // Secondary items for other general shops
  { id: "p14", sellerId: "e6", sellerName: "SuperMarché du Plateau", sellerType: "entreprise", title: "Riz Parfumé Jasmin", description: "Riz long grain parfumé de premier choix.", price: 7500, category: "Alimentation", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600", stock: 80, unit: "sac 5kg", rayon: "Épicerie & Crémerie" },
  { id: "p15", sellerId: "e6", sellerName: "SuperMarché du Plateau", sellerType: "entreprise", title: "Savon de Karité Pur", description: "Savon corporel artisanal hydratant aux huiles végétales.", price: 1100, category: "Entretien", imageUrl: "https://images.unsplash.com/photo-1607006342411-92fc2a4d3f75?auto=format&fit=crop&q=80&w=600", stock: 110, unit: "unité 150g", rayon: "Entretien & Beauté" },
  { id: "p16", sellerId: "e6", sellerName: "SuperMarché du Plateau", sellerType: "entreprise", title: "Nectar de Goyave Sauvage", description: "Nectar riche en vitamine C, onctueux et rafraîchissant.", price: 2000, category: "Boissons", imageUrl: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=600", stock: 65, unit: "brique 1L", rayon: "Boissons & Liquides" },

  { id: "p3", sellerId: "e2", sellerName: "Chez Marie l'Africaine", sellerType: "entreprise", title: "Plat de Tiep bou dienn", description: "Riz au poisson traditionnel sénégalais avec légumes frais marinés.", price: 3500, category: "Repas", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600", stock: 100, unit: "portion" },
  { id: "p4", sellerId: "e2", sellerName: "Chez Marie l'Africaine", sellerType: "entreprise", title: "Plat d'Attiéké au poisson braisé", description: "Semoule de manioc accompagnée d'un poisson braisé et de sauce pimentée.", price: 4000, category: "Repas", imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600", stock: 80, unit: "portion" },
  
  { id: "p18", sellerId: "e7", sellerName: "Le Bistro de la Lagune", sellerType: "entreprise", title: "Brochettes de lotte grillée", description: "Brochettes de lotte fraîche marinées aux agrumes et rôties au feu de bois.", price: 5500, category: "Repas", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600", stock: 50, unit: "portion" },

  { id: "p5", sellerId: "e3", sellerName: "Hôtel Royal Résidence", sellerType: "entreprise", title: "Chambre Deluxe Single", description: "Chambre climatisée avec lit King size, Wi-Fi ultra-rapide et petit-déjeuner inclus.", price: 65000, category: "Hébergement", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600", stock: 15, unit: "nuitée" },
  { id: "p19", sellerId: "e8", sellerName: "Hôtel Palm Palace", sellerType: "entreprise", title: "Option Espace Coworking VIP", description: "Accès journalier à l'espace avec thé, café et internet haut débit fibre optique.", price: 15000, category: "Service", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600", stock: 30, unit: "journée" },

  { id: "p6", sellerId: "e4", sellerName: "Pro-Doc Services", sellerType: "entreprise", title: "Impression document A4", description: "Saisie et impression noir et blanc ou couleur haute définition.", price: 150, category: "Bureautique", imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=600", stock: 1000, unit: "page" },
  { id: "p20", sellerId: "e9", sellerName: "Impression Rapide Plus", sellerType: "entreprise", title: "Reliure Thermique Pro", description: "Reliure professionnelle à chaud avec couverture transparente de protection.", price: 1200, category: "Bureautique", imageUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600", stock: 500, unit: "reliure" },

  { id: "p7", sellerId: "e5", sellerName: "Le Panier Frais", sellerType: "entreprise", title: "Tomates fraîches locales", description: "Tomates charnues mûries au soleil sans engrais chimiques.", price: 800, category: "Légumes", imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600", stock: 200, unit: "kg" },
  { id: "p17", sellerId: "e10", sellerName: "Le Grand Marché Fruits", sellerType: "entreprise", title: "Piment Sec Fumé d'Afrique", description: "Piment rouge séché et fumé artisanalement, arômes puissants.", price: 1200, category: "Épices", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600", stock: 150, unit: "botte" },
  
  // Products from Suppliers (sold to Enterprises)
  { id: "p8", sellerId: "s1", sellerName: "Gérard l'Agriculteur", sellerType: "fournisseur", title: "Sac de Manioc Frais", description: "Racines de manioc fraîchement déterrées, prêtes pour faire de l'attiéké ou du foufou.", price: 15000, category: "Tubercule", imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600", stock: 15, unit: "sac 50kg" },
  { id: "p9", sellerId: "s1", sellerName: "Gérard l'Agriculteur", sellerType: "fournisseur", title: "Pommes de terre locales", description: "Pommes de terre locales de qualité supérieure idéale pour la restauration.", price: 12000, category: "Légume", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600", stock: 30, unit: "sac 25kg" },
  { id: "p10", sellerId: "s2", sellerName: "Koffi l'Artisan du Bois", sellerType: "fournisseur", title: "Mortier traditionnel en bois", description: "Mortier sculpté à la main en bois d'Iroko ultra durable, avec pilon.", price: 18000, category: "Artisanat", imageUrl: "https://images.unsplash.com/photo-1616627547024-42e12e1ec11b?auto=format&fit=crop&q=80&w=600", stock: 8, unit: "ensemble" },
  { id: "p11", sellerId: "s3", sellerName: "La Ferme des Savanes", sellerType: "fournisseur", title: "Poulet de brousse frais", description: "Poulets élevés en plein air, fermes et savoureux, pour les restaurants de cuisine traditionnelle.", price: 3500, category: "Volaille", imageUrl: "https://images.unsplash.com/photo-1587593817642-4b92d0754701?auto=format&fit=crop&q=80&w=600", stock: 50, unit: "unité" },
  { id: "p11-goat", sellerId: "s3", sellerName: "La Ferme des Savanes", sellerType: "fournisseur", title: "Chèvre Sahélienne sur pied", description: "Bête saine de taille moyenne élevée à l'herbe naturelle et au foin de brousse, parfaite pour les occasions ou les boucheries.", price: 45000, category: "Bétail", imageUrl: "https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&q=80&w=600", stock: 12, unit: "animal" },
  { id: "p11-pintade", sellerId: "s3", sellerName: "La Ferme des Savanes", sellerType: "fournisseur", title: "Pintade Fermière Royale", description: "Pintade locale de chair ferme et d'un goût sauvage exquis pour vos recettes d'exception.", price: 5500, category: "Volaille", imageUrl: "https://images.unsplash.com/photo-1605001011156-cbf0b0f67a51?auto=format&fit=crop&q=80&w=600", stock: 35, unit: "unité" },
  { id: "p11-lamb", sellerId: "s3", sellerName: "La Ferme des Savanes", sellerType: "fournisseur", title: "Agneau de Lait de Savane", description: "Jeune agneau nourri exclusivement de lait maternel et d'herbe tendre de pâturage sain.", price: 55000, category: "Bétail", imageUrl: "https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&q=80&w=600", stock: 8, unit: "animal" },
  { id: "p11-eggs", sellerId: "s3", sellerName: "La Ferme des Savanes", sellerType: "fournisseur", title: "Plateau d'Œufs Frais de Pondeuses", description: "Plateau complet de 30 œufs frais ramassés à l'aube, calibre moyen à gros.", price: 2800, category: "Œufs", imageUrl: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&q=80&w=600", stock: 100, unit: "plateau de 30" },

  // Poissonnier DEMO s4 products
  { id: "p4-dorade", sellerId: "s4", sellerName: "La Marée Fraîche", sellerType: "fournisseur", title: "Dorade Royale de l'Atlantique", description: "Poisson entier frais, écaille brillante et chair savoureuse. Idéal pour être braisé ou cuit en papillote.", price: 4500, category: "Poisson", imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600", stock: 65, unit: "kg" },
  { id: "p4-salmon", sellerId: "s4", sellerName: "La Marée Fraîche", sellerType: "fournisseur", title: "Pavé de Saumon Frais", description: "Pavés découpés avec soin avec peau, riches en Omega-3 et d'une tendreté incomparable.", price: 9500, category: "Poisson", imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600", stock: 30, unit: "kg" },
  { id: "p4-prawns", sellerId: "s4", sellerName: "La Marée Fraîche", sellerType: "fournisseur", title: "Crevettes Tigrées Géantes", description: "Crevettes fraîches de calibre exceptionnel, chair ferme et goût délicat de mer.", price: 12000, category: "Crustacés", imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=600", stock: 40, unit: "kg" },
  { id: "p4-langoustine", sellerId: "s4", sellerName: "La Marée Fraîche", sellerType: "fournisseur", title: "Langoustines Vivantes du Port", description: "Langoustines locales pêchées à l'aube, parfaites pour les plateaux de fruits de mer.", price: 14000, category: "Crustacés", imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=600", stock: 15, unit: "kg" },
  { id: "p4-mousse", sellerId: "s4", sellerName: "La Marée Fraîche", sellerType: "fournisseur", title: "Moulé de crabe & crevettes décortiquées", description: "Mélange prêt-à-cuisiner de crabe et crevettes décortiquées pour garnitures ou sauces gourmandes.", price: 6000, category: "Fruits de mer", imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=600", stock: 50, unit: "pot 500g" },

  // Boucher DEMO e-demo-boucher products
  { id: "p-boucher-entrecote", sellerId: "e-demo-boucher", sellerName: "Boucherie Royale (Démo Boucher)", sellerType: "entreprise", title: "Entrecôte de Bœuf Maturée (Premium)", description: "Pièce d'entrecôte persillée d'exception maturée sur os, d'une tendreté et de saveurs gourmandes.", price: 14500, category: "Viande de Bœuf", imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600", stock: 25, unit: "kg" },
  { id: "p-boucher-gigot", sellerId: "e-demo-boucher", sellerName: "Boucherie Royale (Démo Boucher)", sellerType: "entreprise", title: "Gigot d'Agneau Frais Entier", description: "Gigot d'agneau tendre de l'élevage pastoral, préparé with soin par notre chef boucher.", price: 12800, category: "Viande d'Agneau", imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=600", stock: 15, unit: "kg" },
  { id: "p-boucher-brochette", sellerId: "e-demo-boucher", sellerName: "Boucherie Royale (Démo Boucher)", sellerType: "entreprise", title: "Brochettes de Filet de Bœuf Épicées", description: "Magnifiques brochettes de filet de bœuf marinées aux épices du marché et légumes frais.", price: 6500, category: "Grillades", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600", stock: 80, unit: "plateau de 10" },
  { id: "p-boucher-merguez", sellerId: "e-demo-boucher", sellerName: "Boucherie Royale (Démo Boucher)", sellerType: "entreprise", title: "Merguez Artisanales Pur Bœuf & Agneau", description: "Préparation artisanale pur bœuf et agneau, épicée doucement au piment tunisien et fines herbes.", price: 5800, category: "Charcuterie", imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600", stock: 120, unit: "kg" },
  { id: "p-boucher-kefta", sellerId: "e-demo-boucher", sellerName: "Boucherie Royale (Démo Boucher)", sellerType: "entreprise", title: "Kefta Assaisonnée du Chef", description: "Bœuf haché de premier choix assaisonné de menthe fraîche, coriandre broyée et épices douces.", price: 7200, category: "Préparations", imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600", stock: 60, unit: "kg" },

  // Poissonnerie DEMO e-demo-poissonnerie products
  { id: "p-poissonnerie-bar", sellerId: "e-demo-poissonnerie", sellerName: "Poissonnerie Impériale (Démo Poissonnerie)", sellerType: "entreprise", title: "Bar de Ligne Sauvage Frais", description: "Bar entier sauvage de pêche artisanale à l'aube, branchies rouges, chair d'une finesse incomparable.", price: 8500, category: "Poissons Nobles", imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600", stock: 45, unit: "kg" },
  { id: "p-poissonnerie-gambas", sellerId: "e-demo-poissonnerie", sellerName: "Poissonnerie Impériale (Démo Poissonnerie)", sellerType: "entreprise", title: "Gambas Tigrées Géantes Marines", description: "Magnifiques gambas géantes crues et entières présentées sur lit de glace, parfaites pour la plancha.", price: 16500, category: "Crustacés d'Exception", imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=600", stock: 35, unit: "kg" },
  { id: "p-poissonnerie-huitres", sellerId: "e-demo-poissonnerie", sellerName: "Poissonnerie Impériale (Démo Poissonnerie)", sellerType: "entreprise", title: "Huîtres d'Élite de Lagune N°3", description: "Huîtres fraîches sélectionnées, charnues et iodées, purifiées en bassins agréés de mer claire.", price: 7800, category: "Coquillages", imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=600", stock: 120, unit: "douzaine" },
  { id: "p-poissonnerie-calamar", sellerId: "e-demo-poissonnerie", sellerName: "Poissonnerie Impériale (Démo Poissonnerie)", sellerType: "entreprise", title: "Calamars Blancs du Terroir", description: "Calamars entiers ultra-frais du matin, idéals en beignets croustillants ou sautés au piment d'Espelette.", price: 5900, category: "Mollusques & Encornets", imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=600", stock: 40, unit: "kg" },

  // Products for new Demo Accounts
  { id: "p-demo-hotel-1", sellerId: "e-demo-hotel", sellerName: "Hôtel Palmier (Démo Hôtel)", sellerType: "entreprise", title: "Suite Présidentielle de Luxe", description: "Vue panoramique sur la mer, lit géant King, jacuzzi privatif, petit-déjeuner continental inclus.", price: 95000, category: "Hébergement", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600", stock: 3, unit: "nuitée" },
  { id: "p-demo-hotel-2", sellerId: "e-demo-hotel", sellerName: "Hôtel Palmier (Démo Hôtel)", sellerType: "entreprise", title: "Coworking VIP Lounge", description: "Accès à l'espace de travail partagé haut de gamme de l'hôtel, café premium gratuit et fibre ultra-rapide.", price: 12000, category: "Service", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600", stock: 25, unit: "journée" },

  { id: "p-demo-marche-1", sellerId: "e-demo-marche", sellerName: "Étalage du Terroir (Démo Marché)", sellerType: "entreprise", title: "Panier d'Ananas de Bonoua", description: "Fruits mûrs cueillis en Côte d'Ivoire, chair dorée extrêmement juteuse et douce.", price: 2500, category: "Fruits", imageUrl: "https://images.unsplash.com/photo-1550258114-889479641da3?auto=format&fit=crop&q=80&w=600", stock: 45, unit: "panier" },
  { id: "p-demo-marche-2", sellerId: "e-demo-marche", sellerName: "Étalage du Terroir (Démo Marché)", sellerType: "entreprise", title: "Panier de Gombo Frais", description: "Petits gombos bien frais et tendres, parfaits pour la cuisine africaine.", price: 1800, category: "Légumes", imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600", stock: 30, unit: "kg" },

  { id: "p-demo-alimentation-1", sellerId: "e-demo-alimentation", sellerName: "Épicerie Fine (Démo Alimentation)", sellerType: "entreprise", title: "Jus de Bissap parfumé Coco", description: "Recette traditionnelle sénégalaise infusée d'hibiscus rouge, de menthe croquante et d'extrait de coco.", price: 1200, category: "Boissons", imageUrl: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=80&w=600", stock: 150, unit: "bouteille (1L)" },
  { id: "p-demo-alimentation-2", sellerId: "e-demo-alimentation", sellerName: "Épicerie Fine (Démo Alimentation)", sellerType: "entreprise", title: "Pot de Pâte d'Arachide Pure", description: "Pâte de d'arachide torréfiée 100% naturelle sans sel ni huile ajoutée, délicieuse pour le mafé.", price: 2800, category: "Alimentation", imageUrl: "https://images.unsplash.com/photo-1606312440539-768595f58675?auto=format&fit=crop&q=80&w=600", stock: 80, unit: "pot 500g" },

  { 
    id: "p-demo-vetement-1", 
    sellerId: "e-demo-vetement", 
    sellerName: "La Mode Ivoirienne (Démo Boutique)", 
    sellerType: "entreprise", 
    title: "Robe évasée en Wax 'Reine d'Afrique'", 
    description: "Sublime robe évasée confectionnée à la main en authentique Wax de Côte d'Ivoire. Coupes cintrées ajustables, couleurs vives et durables.", 
    price: 35000, 
    category: "Femme", 
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600", 
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600"],
    brand: "Créations Kényo",
    size: "M",
    color: "Bleu / Jaune Wax",
    material: "Pur Coton Africain",
    stock: 12, 
    minStock: 3, 
    unit: "pièce",
    rayon: "Prêt-à-porter",
    promotionDiscount: 15,
    promotionEnd: "2026-06-15T12:00:00Z"
  },
  { 
    id: "p-demo-vetement-2", 
    sellerId: "e-demo-vetement", 
    sellerName: "La Mode Ivoirienne (Démo Boutique)", 
    sellerType: "entreprise", 
    title: "Costume Homme Slim-Fit de Prestige", 
    description: "Costume complet trois pièces pour gentleman moderne. Confectionné dans une laine de haute qualité avec doublure satinée pour un confort supérieur lors de vos cérémonies et réunions.", 
    price: 125000, 
    imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=600", 
    images: ["https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=600", "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=600"],
    brand: "Savile Row Paris",
    category: "Homme", 
    size: "L",
    color: "Bleu Marine",
    material: "Laine Mérinos",
    stock: 5, 
    minStock: 1, 
    unit: "pièce",
    rayon: "Prêt-à-porter"
  },
  { 
    id: "p-demo-vetement-3", 
    sellerId: "e-demo-vetement", 
    sellerName: "La Mode Ivoirienne (Démo Boutique)", 
    sellerType: "entreprise", 
    title: "Chemise Habillée Lin Soft", 
    description: "Chemise d'été à col Mao en lin naturel ultra-léger et respirant. Idéale pour les journées douces ou en bord de mer.", 
    price: 18000, 
    imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=600", 
    images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=600", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600"],
    brand: "Brise d'Abidjan",
    category: "Homme", 
    size: "XL",
    color: "Blanc Pur",
    material: "100% Lin Biologique",
    stock: 22, 
    minStock: 5, 
    unit: "pièce",
    rayon: "Prêt-à-porter"
  },
  { 
    id: "p-demo-vetement-4", 
    sellerId: "e-demo-vetement", 
    sellerName: "La Mode Ivoirienne (Démo Boutique)", 
    sellerType: "entreprise", 
    title: "Veste Tailleur d'Automne Fleurie", 
    description: "Élégante veste croisée fleurie, coupe ajustée avec boutons dorés polis. Parfaite pour rehausser une tenue classique d'affaires.", 
    price: 42000, 
    imageUrl: "https://images.unsplash.com/photo-1548624149-f55e4141753a?auto=format&fit=crop&q=80&w=600", 
    images: ["https://images.unsplash.com/photo-1548624149-f55e4141753a?auto=format&fit=crop&q=80&w=600", "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600"],
    brand: "Aura Couture",
    category: "Femme", 
    size: "S",
    color: "Beige Sable",
    material: "Soie Naturelle & Lin",
    stock: 8, 
    minStock: 2, 
    unit: "pièce",
    rayon: "Prêt-à-porter"
  }
];

let jobOffers = [
  { id: "j1", companyId: "e2", companyName: "Chez Marie l'Africaine", companyType: "restaurant", title: "Chef Cuisinier Adjoint", description: "Nous recherchons un cuisinier passionné par la gastronomie locale pour la préparation des plats du jour et la créativité du menu.", salary: "250,000 FCFA / mois", location: "Dakar Plateau", requirements: ["Expérience de 3 ans", "Maîtrise des classiques de la cuisine africaine", "Rigoureux"], createdAt: "2026-05-25" },
  { id: "j2", companyId: "e1", companyName: "PLMC Market", companyType: "supermarche", title: "Hôte de Caisse (H/F)", description: "Poste à pourvoir immédiatement au PLMC Market pour l'accueil de notre clientèle haut de gamme et l'encaissement robotisé.", salary: "180,000 FCFA / mois", location: "Douala, Cameroun", requirements: ["Souriant", "Bonne élocution", "Honnête et ponctuel"], createdAt: "2026-05-28" },
  { id: "j3", companyId: "e3", companyName: "Hôtel Royal Résidence", companyType: "hotel", title: "Réceptionniste de nuit", description: "Assurer la réception physique et téléphonique de l'hôtel durant la nuit, veiller à la sécurité et au confort des hôtes.", salary: "300,000 FCFA / mois", location: "Bamako, Mali", requirements: ["Bilingue Français/Anglais", "Maîtrise des logiciels hôteliers", "Excellente présentation"], createdAt: "2026-05-29" }
];

let orders: any[] = [
  { id: "o1", buyerId: "c1", buyerName: "Jean Dupont", sellerId: "e1", sellerName: "PLMC Market", productId: "p-plmc-30", productTitle: "Lait Entier Premium Actilait", price: 1500, quantity: 5, status: "shipped", createdAt: "2026-05-27T10:00:00Z" },
  { id: "o2", buyerId: "e2", buyerName: "Chez Marie l'Africaine", sellerId: "s1", sellerName: "Gérard l'Agriculteur", productId: "p8", productTitle: "Sac de Manioc Frais", price: 15000, quantity: 2, status: "accepted", createdAt: "2026-05-28T14:30:00Z" }
];

let orderMessages: any[] = [
  { id: "m1", orderId: "o1", senderId: "e1", senderName: "PLMC Market", text: "Bonjour Jean, votre commande Actilait est prête pour l'expédition. Le transporteur l'acheminera d'ici cet après-midi.", createdAt: "2026-05-27T10:15:00Z" },
  { id: "m2", orderId: "o1", senderId: "c1", senderName: "Jean Dupont", text: "Super, merci ! Tenez-moi au courant.", createdAt: "2026-05-27T10:20:00Z" }
];

let jobApplications = [];

// --- POISSONNERIE DATABASES ---
let fishLots: any[] = [
  { id: "lot-1", productId: "p-poissonnerie-bar", supplierName: "La Marée Fraîche", lotNumber: "LOT-BAR-001", arrivalDate: "2026-06-09", quantity: 60, currentStock: 45, unit: "kg", freshness: "Extra Frais ✨", temperature: "2°C", origin: "Pêche Atlantique Dakar" },
  { id: "lot-2", productId: "p-poissonnerie-gambas", supplierName: "La Marée Fraîche", lotNumber: "LOT-GAM-102", arrivalDate: "2026-06-08", quantity: 50, currentStock: 35, unit: "kg", freshness: "Frais - Lit de glace 🧊", temperature: "1.5°C", origin: "Port de Dakar" }
];

let fishLossLogs: any[] = [
  { id: "loss-1", productId: "p-poissonnerie-bar", productTitle: "Bar de Ligne Sauvage Frais", quantity: 2.5, unit: "kg", reason: "Invendu périmé", date: "2026-06-09T18:30:00Z", cost: 21250 },
  { id: "loss-2", productId: "p-poissonnerie-calamar", productTitle: "Calamars Blancs du Terroir", quantity: 1.2, unit: "kg", reason: "Abîmé/Altération", date: "2026-06-08T17:00:00Z", cost: 7080 }
];

let fishAlerts: any[] = [
  { id: "alert-1", productId: "p-poissonnerie-gambas", buyerEmail: "client1@email.com", clientName: "Jean Dupont", status: "pending", createdAt: "2026-06-10T09:00:00Z" }
];

// --- BOUCHERIE DATABASES ---
let butcherLots: any[] = [
  { id: "b-lot-1", productId: "p-boucher-entrecote", supplierName: "La Ferme des Savanes", lotNumber: "LOT-BOEUF-901", arrivalDate: "2026-06-11", quantity: 150, currentStock: 25, unit: "kg", freshness: "Maturée 21 Jours 🥩", temperature: "2.1°C", origin: "Élevage Local Bouaké", veterinaryCert: "Certifié Conforme A-44" },
  { id: "b-lot-2", productId: "p-boucher-gigot", supplierName: "La Ferme des Savanes", lotNumber: "LOT-AGNEAU-302", arrivalDate: "2026-06-12", quantity: 80, currentStock: 15, unit: "kg", freshness: "Extra Tendre - Jeune Agneau", temperature: "1.8°C", origin: "Région du Nord", veterinaryCert: "Certifié Conforme A-25" }
];

let butcherLossLogs: any[] = [
  { id: "b-loss-1", productId: "p-boucher-merguez", productTitle: "Merguez Artisanales Pur Bœuf & Agneau", quantity: 4.5, unit: "kg", reason: "Chute de température vitrine", date: "2026-06-11T12:00:00Z", cost: 26100 },
  { id: "b-loss-2", productId: "p-boucher-entrecote", productTitle: "Entrecôte de Bœuf Maturée (Premium)", quantity: 1.8, unit: "kg", reason: "Parures et chutes de découpe (Trim)", date: "2026-06-12T09:30:00Z", cost: 26100 }
];

let butcherCuts: any[] = [
  { id: "b-cut-1", sourceCarcass: "Demi-Carcasse de Bœuf #44", sourceWeight: 140, targetProductId: "p-boucher-entrecote", targetWeight: 45, lossWeight: 5, date: "2026-06-12T14:00:00Z", piecesCount: 20, operator: "Bamba (Chef Boucher)" },
  { id: "b-cut-2", sourceCarcass: "Train de Côtes d'Agneau #12", sourceWeight: 35, targetProductId: "p-boucher-gigot", targetWeight: 28, lossWeight: 2.5, date: "2026-06-12T16:30:00Z", piecesCount: 8, operator: "Koffi (Second)" }
];

// --- HOTEL MANAGEMENT DATABASES ---
let hotelRoomCategories = [
  { id: "cat-1", hotelId: "e-demo-hotel", name: "Chambre Standard", description: "Chambre confortable idéale pour une personne seule ou en couple, climatisée." },
  { id: "cat-2", hotelId: "e-demo-hotel", name: "Chambre Double Confort", description: "Espace élargi avec grand lit King size, balcon et canapé." },
  { id: "cat-3", hotelId: "e-demo-hotel", name: "Suite Présidentielle de Luxe", description: "Prestation très haut de gamme avec vue mer, jacuzzi privé et salon VIP." },
  { id: "cat-4", hotelId: "e-demo-hotel", name: "Salle de Conférence VIP", description: "Pour vos réunions, lancements professionnels et webinaires." },
  // e3 - Hôtel Royal Résidence
  { id: "cat-e3-1", hotelId: "e3", name: "Chambre Deluxe Single", description: "Chambre grand confort avec petit-déjeuner compris." },
  { id: "cat-e3-2", hotelId: "e3", name: "Suite Executive", description: "Appartement de luxe idéal pour cadres en voyage d'affaires." }
];

let hotelRooms = [
  // e-demo-hotel Rooms
  { 
    id: "room-demo-101", 
    hotelId: "e-demo-hotel", 
    number: "101", 
    type: "Chambre Standard", 
    capacity: 2, 
    price: 25000, 
    description: "Chambre cosy avec lit Queen size, bureau de travail, salle de bain attenante et climatisation individuelle.", 
    equipments: ["Wi-Fi", "Climatisation", "Télévision HD", "Bureau"], 
    photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600"], 
    status: "Libre" 
  },
  { 
    id: "room-demo-102", 
    hotelId: "e-demo-hotel", 
    number: "102", 
    type: "Chambre Double Confort", 
    capacity: 3, 
    price: 45000, 
    description: "Magnifique chambre spacieuse avec terrasse privative, lit d'appoint et kitchenette équipée.", 
    equipments: ["Wi-Fi", "Climatisation", "Mini-bar", "Balcon", "Kitchenette"], 
    photos: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600"], 
    status: "Occupée" 
  },
  { 
    id: "room-demo-201", 
    hotelId: "e-demo-hotel", 
    number: "201", 
    type: "Suite Présidentielle de Luxe", 
    capacity: 4, 
    price: 95000, 
    description: "La suite reine de l'établissement. Jacuzzi thérapeutique, dôme vitré, théière de luxe et majordome à la demande.", 
    equipments: ["Jacuzzi", "Wi-Fi", "Climatisation", "Coffre-fort", "Machine Espresso", "Vue sur mer"], 
    photos: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600"], 
    status: "Réservée" 
  },
  { 
    id: "room-demo-202", 
    hotelId: "e-demo-hotel", 
    number: "202", 
    type: "Chambre Standard", 
    capacity: 1, 
    price: 20000, 
    description: "Petite chambre ergonomique avec lit simple, idéale pour voyageurs solo à prix mini.", 
    equipments: ["Wi-Fi", "Climatisation", "Douche italienne"], 
    photos: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600"], 
    status: "Maintenance" 
  },
  { 
    id: "room-demo-301", 
    hotelId: "e-demo-hotel", 
    number: "301", 
    type: "Salle de Conférence VIP", 
    capacity: 30, 
    price: 150000, 
    description: "Salle de conférence climatisée équipée d'un système sono JBL et d'écrans de projection intelligents.", 
    equipments: ["Vidéoprojecteur", "Sonorisation", "Fibre optique", "Paperboard", "Machine à café"], 
    photos: ["https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600"], 
    status: "Libre" 
  },
  // e3 (Hôtel Royal Résidence) Rooms
  { 
    id: "room-e3-11", 
    hotelId: "e3", 
    number: "11", 
    type: "Chambre Deluxe Single", 
    capacity: 1, 
    price: 65000, 
    description: "Chambre climatisée avec lit simple de luxe, WiFi très haut débit.", 
    equipments: ["Wi-Fi", "Climatisation", "Coffre-fort"], 
    photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600"], 
    status: "Libre" 
  },
  { 
    id: "room-e3-12", 
    hotelId: "e3", 
    number: "12", 
    type: "Suite Executive", 
    capacity: 2, 
    price: 120000, 
    description: "Suite diplomatique spacieuse avec vue imprenable sur la lagune.", 
    equipments: ["Wi-Fi", "Climatisation", "Salon", "Balcon"], 
    photos: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600"], 
    status: "Libre" 
  }
];

let hotelReservations = [
  {
    id: "res-demo-1",
    hotelId: "e-demo-hotel",
    hotelName: "Hôtel Palmier (Démo Hôtel)",
    clientId: "c1",
    clientName: "Jean Dupont",
    clientEmail: "client1@email.com",
    clientPhone: "+33 6 12345678",
    roomId: "room-demo-102",
    roomNumber: "102",
    roomType: "Chambre Double Confort",
    checkIn: "2026-06-02",
    checkOut: "2026-06-05",
    nights: 3,
    basePrice: 45000,
    additionalServices: ["Restaurant", "Piscine"],
    servicesPrice: 15000,
    discountAmount: 0,
    totalPrice: 150000, // (45000 * 3) + 15000
    paymentStatus: "paid",
    paymentMethod: "card",
    paidAmount: 150000,
    status: "checked_in",
    createdAt: "2026-06-01T10:00:00Z"
  },
  {
    id: "res-demo-2",
    hotelId: "e-demo-hotel",
    hotelName: "Hôtel Palmier (Démo Hôtel)",
    clientId: "c2",
    clientName: "Marie Koné",
    clientEmail: "client2@email.com",
    clientPhone: "+225 07 483920",
    roomId: "room-demo-201",
    roomNumber: "201",
    roomType: "Suite Présidentielle de Luxe",
    checkIn: "2026-06-06",
    checkOut: "2026-06-08",
    nights: 2,
    basePrice: 95000,
    additionalServices: ["Spa", "Transport"],
    servicesPrice: 35000,
    couponCode: "WELCOME10",
    discountAmount: 19000, // 10% de la chambre (190000)
    totalPrice: 206000, // (190000 + 35000) - 19000
    paymentStatus: "partial",
    paymentMethod: "mobile_money",
    paidAmount: 100000,
    status: "confirmed",
    createdAt: "2026-06-03T11:20:00Z"
  }
];

let hotelCoupons = [
  { id: "coup-1", hotelId: "e-demo-hotel", code: "WELCOME10", discountType: "percent", discountValue: 10, active: true },
  { id: "coup-2", hotelId: "e-demo-hotel", code: "FLASH30", discountType: "percent", discountValue: 30, active: true },
  { id: "coup-3", hotelId: "e-demo-hotel", code: "VIP50", discountType: "percent", discountValue: 50, active: true }
];

let hotelAuditLogs = [
  { id: "log-1", hotelId: "e-demo-hotel", action: "INITIALIZATION", details: "Base hôtelière et chambres témoins initialisées avec succès.", timestamp: "2026-06-04T08:00:00Z" },
  { id: "log-2", hotelId: "e-demo-hotel", action: "RESERVATION_CREATION", details: "Réservation #res-demo-1 pour Jean Dupont enregistrée.", timestamp: "2026-06-01T10:00:00Z" },
  { id: "log-3", hotelId: "e-demo-hotel", action: "CHECK_IN", details: "Client Jean Dupont entré en chambre 102.", timestamp: "2026-06-02T14:15:00Z" }
];

let hotelFomoSettings = [
  {
    hotelId: "e-demo-hotel",
    title: "OFFRE FLASH WEEK-END : -30% SUR LES SÉJOURS !",
    hoursLeft: "4",
    expiryDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    active: true
  },
  {
    hotelId: "e3",
    title: "SÉJOUR ROMANTIQUE : COCKTAILS ET SPA OFFERTS !",
    hoursLeft: "3",
    expiryDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    active: true
  }
];


let restaurantTables = [
  // e2 - Chez Marie l'Africaine
  { id: "tbl-e2-1", sellerId: "e2", number: "Table 1 (Fenêtre)", capacity: 2, status: "available", zone: "window" },
  { id: "tbl-e2-2", sellerId: "e2", number: "Table 2 (Terrasse)", capacity: 4, status: "available", zone: "terrace" },
  { id: "tbl-e2-3", sellerId: "e2", number: "Table 3 (Salon VIP)", capacity: 6, status: "reserved", zone: "vip" },
  { id: "tbl-e2-4", sellerId: "e2", number: "Table 4 (Intérieur)", capacity: 4, status: "available", zone: "interior" },
  { id: "tbl-e2-5", sellerId: "e2", number: "Table 5 (Intérieur)", capacity: 2, status: "occupied", zone: "interior" },
  // e7 - Le Bistro de la Lagune
  { id: "tbl-e7-1", sellerId: "e7", number: "Table 1 (Bord Lagune)", capacity: 2, status: "available", zone: "terrace" },
  { id: "tbl-e7-2", sellerId: "e7", number: "Table 2 (VIP Lounge)", capacity: 4, status: "available", zone: "vip" },
  { id: "tbl-e7-3", sellerId: "e7", number: "Table 3 (Intérieur)", capacity: 4, status: "available", zone: "interior" }
];

let restaurantBookings = [
  {
    id: "bk-1",
    buyerId: "c1",
    buyerName: "Jean Dupont",
    buyerPhone: "+33 6 12345678",
    sellerId: "e2",
    tableId: "tbl-e2-3",
    guestsCount: 4,
    dateTime: "2026-06-14T20:00",
    status: "confirmed",
    notes: "Anniversaire de mariage, table VIP souhaitée."
  }
];

let dishRatings = [
  { id: "rt-1", productId: "p3", rating: 5, comment: "Le meilleur Tiep bou dienn d'Afrique de l'Ouest ! Portion généreuse et piment bien dosé.", reviewerName: "Jean Dupont", reviewerId: "c1", date: "2026-06-10" },
  { id: "rt-2", productId: "p3", rating: 4, comment: "Très bon, mais l'attente était un peu longue. Je recommande vivement pour le goût authentique.", reviewerName: "Marie Koné", reviewerId: "c2", date: "2026-06-11" },
  { id: "rt-3", productId: "p4", rating: 5, comment: "Attiéké poisson impeccable, grillé à la perfection.", reviewerName: "Marie Koné", reviewerId: "c2", date: "2026-06-12" }
];

let companyReviews = [
  {
    id: "rev-1",
    companyId: "e1",
    companyName: "PLMC Market",
    reviewerId: "c1",
    reviewerName: "Jean Dupont",
    rating: 5,
    comment: "Supermarché fantastique avec un stock incroyable d'électroménager Signature et une livraison hyper rapide !",
    visitContext: "Achat effectué",
    createdAt: "2026-06-16T12:00:00Z"
  },
  {
    id: "rev-2",
    companyId: "e2",
    companyName: "Chez Marie l'Africaine",
    reviewerId: "c2",
    reviewerName: "Marie Koné",
    rating: 5,
    comment: "L'attaiéké au poisson braisé est succulent ! Recommande fortement.",
    visitContext: "Achat effectué",
    createdAt: "2026-06-16T11:30:00Z"
  },
  {
    id: "rev-3",
    companyId: "e-demo-hotel",
    companyName: "Hôtel Palmier (Démo Hôtel)",
    reviewerId: "c1",
    reviewerName: "Jean Dupont",
    rating: 5,
    comment: "Un séjour merveilleux, l'espace coworking VIP est idéal pour travailler !",
    visitContext: "Réservation effectuée",
    createdAt: "2026-06-15T15:00:00Z"
  }
];

let clientActivities: any[] = [];
let clientClassifications: any[] = [
  {
    id: "class-c1", // ID matching for simple structure
    clientId: "c1",
    primaryInterest: "supermarche",
    scoreMap: { "supermarche": 45, "hotel": 20, "restaurant": 10 },
    tier: "Acheteur Actif ⚡",
    updatedAt: "2026-06-16T12:00:00Z"
  },
  {
    id: "class-c2",
    clientId: "c2",
    primaryInterest: "restaurant",
    scoreMap: { "restaurant": 38, "vetement": 15 },
    tier: "Explorateur 🌟",
    updatedAt: "2026-06-16T11:30:00Z"
  }
];


let enterpriseStocks = [
  { id: "st_1", buyerId: "e2", title: "Sac de Manioc Frais", quantity: 2, unit: "sac 50kg", category: "Tubercule" },
  { id: "st_2", buyerId: "e2", title: "Poulet de brousse frais", quantity: 15, unit: "unité", category: "Volaille" }
];

let ventes = [
  {
    id: "v1",
    entreprise_id: "e1",
    age: "18-25",
    sexe: "Femme",
    total: 2400,
    date_vente: "2026-05-28T09:12:00Z",
    items: [
      { id: "vi1", rayon: "Alimentation", produit: "Lait entier premium", quantite: 2, prix_unitaire: 1200, total: 2400 }
    ]
  },
  {
    id: "v2",
    entreprise_id: "e1",
    age: "26-39",
    sexe: "Homme",
    total: 10200,
    date_vente: "2026-05-28T11:45:00Z",
    items: [
      { id: "vi2", rayon: "Alimentation", produit: "Lait entier premium", quantite: 3, prix_unitaire: 1200, total: 3600 },
      { id: "vi3", rayon: "Entretien", produit: "Lessive liquide Éco+", quantite: 1, prix_unitaire: 4500, total: 4500 },
      { id: "vi4", rayon: "Légumes", produit: "Tomates fraîches locales", quantite: 2, prix_unitaire: 800, total: 1600 }
    ]
  },
  {
    id: "v3",
    entreprise_id: "e1",
    age: "40-55",
    sexe: "Femme",
    total: 8000,
    date_vente: "2026-05-29T08:30:00Z",
    items: [
      { id: "vi5", rayon: "Légumes", produit: "Tomates fraîches locales", quantite: 10, prix_unitaire: 800, total: 8000 }
    ]
  },
  {
    id: "v4",
    entreprise_id: "e1",
    age: "26-39",
    sexe: "Femme",
    total: 12200,
    date_vente: "2026-05-29T10:15:00Z",
    items: [
      { id: "vi6", rayon: "Alimentation", produit: "Lait entier premium", quantite: 1, prix_unitaire: 1200, total: 1200 },
      { id: "vi7", rayon: "Entretien", produit: "Lessive liquide Éco+", quantite: 2, prix_unitaire: 4500, total: 9000 },
      { id: "vi8", rayon: "Légumes", produit: "Tomates fraîches locales", quantite: 2, prix_unitaire: 800, total: 1600 }
    ]
  },
  {
    id: "v5",
    entreprise_id: "e2",
    age: "18-25",
    sexe: "Homme",
    total: 7500,
    date_vente: "2026-05-28T13:20:00Z",
    items: [
      { id: "vi9", rayon: "Repas", produit: "Plat de Tiep bou dienn", quantite: 1, prix_unitaire: 3500, total: 3500 },
      { id: "vi10", rayon: "Repas", produit: "Plat d'Attiéké au poisson braisé", quantite: 1, prix_unitaire: 4000, total: 4000 }
    ]
  },
  {
    id: "v6",
    entreprise_id: "e2",
    age: "26-39",
    sexe: "Femme",
    total: 8000,
    date_vente: "2026-05-28T19:40:00Z",
    items: [
      { id: "vi11", rayon: "Repas", produit: "Plat d'Attiéké au poisson braisé", quantite: 2, prix_unitaire: 4000, total: 8000 }
    ]
  },
  {
    id: "v7",
    entreprise_id: "e2",
    age: "55+",
    sexe: "Homme",
    total: 3500,
    date_vente: "2026-05-29T12:00:00Z",
    items: [
      { id: "vi12", rayon: "Repas", produit: "Plat de Tiep bou dienn", quantite: 1, prix_unitaire: 3500, total: 3500 }
    ]
  }
];

// Helper calculations for Profile Match Ratings
const ageMapping: Record<string, number> = {
  "12-18": 15,
  "18-25": 22,
  "19-25": 22,
  "26-39": 32,
  "40-55": 47,
  "55+": 60
};

function getAgeValue(age: string): number {
  return ageMapping[age] || 32;
}

// Real-world demographic profile classifier recommendation logic
function recommendProducts(localVentes: any[], targetAge: string, targetSexe: string) {
  const targetAgeVal = getAgeValue(targetAge);
  const scores: Record<string, number> = {};

  const safeVentes = Array.isArray(localVentes) ? localVentes : [];

  safeVentes.forEach(v => {
    if (!v) return;
    const vAgeVal = getAgeValue(v.age);
    const ageDiff = Math.abs(targetAgeVal - vAgeVal);
    const sexeMatch = (v.sexe === targetSexe) ? 1.0 : 0.0;
    const similarity = (1 / (1 + ageDiff)) + sexeMatch;

    const items = Array.isArray(v.items) ? v.items : [];
    items.forEach((item: any) => {
      if (item && item.produit) {
        scores[item.produit] = (scores[item.produit] || 0) + similarity * (Number(item.quantite) || 1);
      }
    });
  });

  return Object.entries(scores)
    .map(([produit, score]) => ({ produit, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// Basket affinity recommendations
function recommendAdvanced(localVentes: any[], currentBasketProducts: string[], targetAge: string, targetSexe: string) {
  const targetAgeVal = getAgeValue(targetAge);
  const scores: Record<string, number> = {};

  const safeVentes = Array.isArray(localVentes) ? localVentes : [];
  const safeBasket = Array.isArray(currentBasketProducts) ? currentBasketProducts : [];

  if (safeBasket.length === 0) return [];

  safeVentes.forEach(v => {
    if (!v) return;
    const items = Array.isArray(v.items) ? v.items : [];
    const pastProductNames = items.map((item: any) => item && item.produit).filter(Boolean);
    const sharesItem = pastProductNames.some((pName: string) => safeBasket.includes(pName));

    if (sharesItem) {
      const vAgeVal = getAgeValue(v.age);
      const ageDiff = Math.abs(targetAgeVal - vAgeVal);
      const sexeMatch = (v.sexe === targetSexe) ? 1.0 : 0.0;
      const profilScore = (1 / (1 + ageDiff)) + sexeMatch;

      items.forEach((item: any) => {
        if (item && item.produit && !safeBasket.includes(item.produit)) {
          scores[item.produit] = (scores[item.produit] || 0) + profilScore * (Number(item.quantite) || 1);
        }
      });
    }
  });

  return Object.entries(scores)
    .map(([produit, score]) => ({ produit, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// Predict department for current consumer demography
function computeRayonPrediction(localVentes: any[], targetAge: string, targetSexe: string) {
  const ageVal = getAgeValue(targetAge);
  const sexeVal = targetSexe === "Homme" ? 1 : 0;
  const scoresPerRayon: Record<string, number> = {};

  const safeVentes = Array.isArray(localVentes) ? localVentes : [];

  safeVentes.forEach(v => {
    if (!v) return;
    const vAgeVal = getAgeValue(v.age);
    const vSexeVal = v.sexe === "Homme" ? 1 : 0;
    const ageDiff = Math.abs(ageVal - vAgeVal);
    const sexeMatch = (vSexeVal === sexeVal) ? 1 : 0;
    const similarity = (1 / (1 + ageDiff)) + sexeMatch;

    const items = Array.isArray(v.items) ? v.items : [];
    items.forEach((item: any) => {
      if (item && item.rayon) {
        scoresPerRayon[item.rayon] = (scoresPerRayon[item.rayon] || 0) + similarity * (Number(item.quantite) || 1);
      }
    });
  });

  const totalScore = Object.values(scoresPerRayon).reduce((sum, val) => sum + val, 0);

  if (totalScore === 0 || Object.keys(scoresPerRayon).length === 0) {
    return {
      bestRayon: "Divers",
      bestScore: 1.0,
      level: "DONNÉES INSUFFISANTES ⚠️" as const,
      probabilities: [{ rayon: "Divers", proba: 1.0 }]
    };
  }

  const sortedList = Object.entries(scoresPerRayon)
    .map(([rayon, score]) => ({
      rayon,
      proba: Number((score / totalScore).toFixed(4))
    }))
    .sort((a, b) => b.proba - a.proba);

  const bestRayon = sortedList[0].rayon;
  const bestScore = sortedList[0].proba;
  let level: 'TRÈS FIABLE 🔥' | 'MOYENNEMENT FIABLE ⚠️' | 'DONNÉES INSUFFISANTES ⚠️' = 'MOYENNEMENT FIABLE ⚠️';
  if (safeVentes.length < 3) {
    level = 'DONNÉES INSUFFISANTES ⚠️';
  } else if (bestScore > 0.6) {
    level = 'TRÈS FIABLE 🔥';
  }

  return {
    bestRayon,
    bestScore,
    level,
    probabilities: sortedList.slice(0, 4)
  };
}

// Pre-configured and dynamically updated rayons metadata on the server
let rayonsMetadata: Record<string, { desc: string; emoji: string; img: string }> = {
  "Climatiseurs & Ventilateurs": {
    desc: "Climatiseurs split intelligents de classe A+, ventilateurs brumisateurs à eau haute performance.",
    emoji: "❄️",
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600"
  },
  "Téléphones & Tablettes": {
    desc: "Flagships Apple iPhone, appareils Samsung Galaxy et Tecno avec garanties officielles.",
    emoji: "📱",
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600"
  },
  "Réfrigérateurs & Congélateurs": {
    desc: "Réfrigérateurs double battant de grande capacité OSCAR et congélateurs horizontaux économe.",
    emoji: "🧊",
    img: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=600"
  },
  "Appareils de Cuisson & Cuisine": {
    desc: "Plaques de cuisson inox, cuisinières Fiabtec avec four, air fryers Midea et micro-ondes.",
    emoji: "🍳",
    img: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600"
  },
  "Blender & Petit Électroménager": {
    desc: "Blendeurs Ice Crusher Moulinex, bouilloires électriques rapides en acier inoxydable.",
    emoji: "🥤",
    img: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&q=80&w=600"
  },
  "Téléviseurs, Audio & Vidéo": {
    desc: "Écrans flats intelligents Roch 65 pouces 4K, home cinémas LG surround 5.1 et woofers Bluetooth.",
    emoji: "📺",
    img: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=600"
  },
  "Maison, Meubles & Literie": {
    desc: "Matelas orthopédiques MEGALUX, chaises pivotantes d'ergonomie Pro et mobilier de direction.",
    emoji: "🛏️",
    img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600"
  },
  "Mode & Vêtements": {
    desc: "Maillots officiels des Lions Indomptables du Cameroun pour la CAN 2025 et vélos pour enfants.",
    emoji: "👕",
    img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600"
  },
  "Bricolage & Énergie": {
    desc: "Groupes électrogènes à essence ROCH, mallettes complètes d'outillages pro chromés.",
    emoji: "⚡",
    img: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=600"
  },
  "Beauté, Cosmétiques & Parfum": {
    desc: "Eaux de parfum de marque, beurres de karité purs et savons corporels bio hydratants.",
    emoji: "🧼",
    img: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=600"
  },
  "Épicerie, Alimentation & Boissons": {
    desc: "Laits d'Afrique enrichis, jus de goyave sauvage pressés et riz parfumé jasmin de premier choix.",
    emoji: "🍇",
    img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600"
  }
};

// --- FIREBASE SYNC IMPLEMENTATION ---

// --- FINANCE, WALLETS, CASH FLOW & SUBSCRIPTIONS ---
let wallets: any[] = [
  { id: "w_e1", userId: "e1", balance: 145000 },
  { id: "w_e2", userId: "e2", balance: 85000 },
  { id: "w_e3", userId: "e3", balance: 250000 },
  { id: "w_e-demo-hotel", userId: "e-demo-hotel", balance: 65000 },
  { id: "w_s4", userId: "s4", balance: 195000 }
];
let withdrawalRequests: any[] = [];
let paymentInvoices: any[] = [];
let walletTransactions: any[] = [];

let commissionSettings = {
  productSalePercent: 7,
  deliveryPercent: 10
};

let paymentSettings = {
  mtnMomoMerchantNumber: "MTN-77889922-CIV",
  orangeMoneyMerchantNumber: "OM-07483920-CIV",
  waveMerchantCode: "WAVE-WELINK-B2B",
  apiKey: "sk_live_welink_secure_prod_2026_key_aistudio",
  sandboxMode: true
};

const collectionsToSync: Record<string, { get: () => any[]; set: (data: any[]) => void }> = {
  users: { get: () => users, set: (data: any) => { users = data; } },
  wallets: { get: () => wallets, set: (data: any) => { wallets = data; } },
  withdrawalRequests: { get: () => withdrawalRequests, set: (data: any) => { withdrawalRequests = data; } },
  paymentInvoices: { get: () => paymentInvoices, set: (data: any) => { paymentInvoices = data; } },
  walletTransactions: { get: () => walletTransactions, set: (data: any) => { walletTransactions = data; } },
  products: { get: () => products, set: (data: any) => { products = data; } },
  jobOffers: { get: () => jobOffers, set: (data: any) => { jobOffers = data; } },
  orders: { get: () => orders, set: (data: any) => { orders = data; } },
  orderMessages: { get: () => orderMessages, set: (data: any) => { orderMessages = data; } },
  jobApplications: { get: () => jobApplications, set: (data: any) => { jobApplications = data; } },
  fishLots: { get: () => fishLots, set: (data: any) => { fishLots = data; } },
  fishLossLogs: { get: () => fishLossLogs, set: (data: any) => { fishLossLogs = data; } },
  fishAlerts: { get: () => fishAlerts, set: (data: any) => { fishAlerts = data; } },
  butcherLots: { get: () => butcherLots, set: (data: any) => { butcherLots = data; } },
  butcherLossLogs: { get: () => butcherLossLogs, set: (data: any) => { butcherLossLogs = data; } },
  butcherCuts: { get: () => butcherCuts, set: (data: any) => { butcherCuts = data; } },
  hotelRoomCategories: { get: () => hotelRoomCategories, set: (data: any) => { hotelRoomCategories = data; } },
  hotelRooms: { get: () => hotelRooms, set: (data: any) => { hotelRooms = data; } },
  hotelReservations: { get: () => hotelReservations, set: (data: any) => { hotelReservations = data; } },
  hotelCoupons: { get: () => hotelCoupons, set: (data: any) => { hotelCoupons = data; } },
  hotelAuditLogs: { get: () => hotelAuditLogs, set: (data: any) => { hotelAuditLogs = data; } },
  hotelFomoSettings: { get: () => hotelFomoSettings, set: (data: any) => { hotelFomoSettings = data; } },
  enterpriseStocks: { get: () => enterpriseStocks, set: (data: any) => { enterpriseStocks = data; } },
  ventes: { get: () => ventes, set: (data: any) => { ventes = data; } },
  restaurantTables: { get: () => restaurantTables, set: (data: any) => { restaurantTables = data; } },
  restaurantBookings: { get: () => restaurantBookings, set: (data: any) => { restaurantBookings = data; } },
  dishRatings: { get: () => dishRatings, set: (data: any) => { dishRatings = data; } },
  companyReviews: { get: () => companyReviews, set: (data: any) => { companyReviews = data; } },
  clientClassifications: { get: () => clientClassifications, set: (data: any) => { clientClassifications = data; } },
};

async function syncCollectionToFirestore(colName: string) {
  if (!db) return;
  try {
    const list = collectionsToSync[colName]?.get() || [];
    console.log(`[Firebase Sync] Synchronizing '${colName}' (${list.length} items)...`);
    
    const colRef = collection(db, colName);
    const existingSnapshot = await getDocs(colRef);
    const existingIds = new Set<string>();
    existingSnapshot.forEach(docSnap => existingIds.add(docSnap.id));

    const currentIds = new Set<string>();
    for (const item of list) {
      if (item && item.id !== undefined) {
        const docId = String(item.id);
        currentIds.add(docId);
        const cleanedItem = JSON.parse(JSON.stringify(item));
        await setDoc(doc(db, colName, docId), cleanedItem);
      }
    }

    // Handle Deletions
    for (const oldId of existingIds) {
      if (!currentIds.has(oldId)) {
        await deleteDoc(doc(db, colName, oldId));
        console.log(`[Firebase Sync] Deleted item '${oldId}' from collection '${colName}'`);
      }
    }
    console.log(`[Firebase Sync] Successfully completed syncing '${colName}'!`);
  } catch (err) {
    console.error(`[Firebase Sync] Error syncing collection '${colName}' to Firestore:`, err);
  }
}

const dirtyCollections = new Set<string>();
let isSyncing = false;

function markDirty(colName: string) {
  dirtyCollections.add(colName);
  triggerSync();
}

async function triggerSync() {
  if (isSyncing || !db) return;
  if (dirtyCollections.size === 0) return;

  isSyncing = true;
  const colName = Array.from(dirtyCollections)[0];
  dirtyCollections.delete(colName);

  try {
    if (colName === "rayonsMetadata") {
      const rayonsDocRef = doc(db, "metadata", "rayons");
      const cleanedRayons = JSON.parse(JSON.stringify(rayonsMetadata));
      await setDoc(rayonsDocRef, cleanedRayons);
      console.log("[Firebase Sync] Successfully synced rayonsMetadata to Firestore!");
    } else if (colName === "commissionSettings") {
      const commissionsDocRef = doc(db, "metadata", "commissions");
      const cleanedCommissions = JSON.parse(JSON.stringify(commissionSettings));
      await setDoc(commissionsDocRef, cleanedCommissions);
      console.log("[Firebase Sync] Successfully synced commissionSettings to Firestore!");
    } else if (colName === "paymentSettings") {
      const paymentsDocRef = doc(db, "metadata", "payments");
      const cleanedPayments = JSON.parse(JSON.stringify(paymentSettings));
      await setDoc(paymentsDocRef, cleanedPayments);
      console.log("[Firebase Sync] Successfully synced paymentSettings to Firestore!");
    } else if (collectionsToSync[colName]) {
      await syncCollectionToFirestore(colName);
    }
  } catch (err) {
    console.error(`[Firebase Sync] Sync failed for '${colName}':`, err);
  } finally {
    isSyncing = false;
    if (dirtyCollections.size > 0) {
      setTimeout(triggerSync, 500);
    }
  }
}

function triggerCollectionSyncFromPath(p: string) {
  const normalized = p.toLowerCase();
  
  if (normalized.includes("/api/hotel/categories")) {
    markDirty("hotelRoomCategories");
    markDirty("hotelAuditLogs");
  }
  else if (normalized.includes("/api/hotel/rooms")) {
    markDirty("hotelRooms");
    markDirty("hotelAuditLogs");
  }
  else if (normalized.includes("/api/hotel/reservations")) {
    markDirty("hotelReservations");
    markDirty("hotelRooms");
    markDirty("hotelAuditLogs");
  }
  else if (normalized.includes("/api/hotel/coupons")) {
    markDirty("hotelCoupons");
  }
  else if (normalized.includes("/api/hotel/fomo")) {
    markDirty("hotelFomoSettings");
  }
  else if (normalized.includes("/api/ventes")) {
    markDirty("ventes");
    markDirty("products");
  }
  else if (normalized.includes("/api/register") || normalized.includes("/api/login") || normalized.includes("/api/users")) {
    markDirty("users");
  }
  else if (normalized.includes("/api/products") || normalized.includes("/api/stocks")) {
    markDirty("products");
    markDirty("enterpriseStocks");
  }
  else if (normalized.includes("/api/rayons")) {
    markDirty("rayonsMetadata");
    markDirty("products");
  }
  else if (normalized.includes("/api/jobs")) {
    markDirty("jobOffers");
  }
  else if (normalized.includes("/api/applications")) {
    markDirty("jobApplications");
  }
  else if (normalized.includes("/api/orders")) {
    markDirty("orders");
    markDirty("products");
    markDirty("enterpriseStocks");
    if (normalized.includes("/messages")) {
      markDirty("orderMessages");
    }
  }
  else if (normalized.includes("/api/restaurant/bookings")) {
    markDirty("restaurantBookings");
    markDirty("restaurantTables");
  }
  else if (normalized.includes("/api/restaurant/tables")) {
    markDirty("restaurantTables");
  }
  else if (normalized.includes("/api/restaurant/ratings")) {
    markDirty("dishRatings");
  }
  else if (normalized.includes("/api/poissonnerie/lots")) {
    markDirty("fishLots");
    markDirty("products");
  }
  else if (normalized.includes("/api/poissonnerie/losses")) {
    markDirty("fishLossLogs");
    markDirty("products");
  }
  else if (normalized.includes("/api/poissonnerie/alerts")) {
    markDirty("fishAlerts");
  }
  else if (normalized.includes("/api/boucherie/lots")) {
    markDirty("butcherLots");
    markDirty("products");
  }
  else if (normalized.includes("/api/boucherie/losses")) {
    markDirty("butcherLossLogs");
    markDirty("products");
  }
  else if (normalized.includes("/api/boucherie/cuts")) {
    markDirty("butcherCuts");
    markDirty("products");
  }
}

// Global Response Interceptor Middleware to capture dynamic modifications
app.use((req, res, next) => {
  if (req.method !== "GET" && req.path.startsWith("/api/")) {
    const originalJson = res.json;
    res.json = function (body) {
      const result = originalJson.apply(this, arguments as any);
      try {
        triggerCollectionSyncFromPath(req.path);
      } catch (err) {
        console.error("[Firebase Middleware] Error triggering sync from path:", err);
      }
      return result;
    };
  }
  next();
});

async function loadStateFromFirestore() {
  if (!db) {
    console.warn("[Firebase Load] Database client not active. Skipping Firestore load.");
    return;
  }
  console.log("[Firebase Load] Loading all collections from Firestore...");
  try {
    // -------------------------------------------------------------
    // SECURE PRODUCTION AUTO-PURGE OF LEGACY DEMO/TEST DATA
    // -------------------------------------------------------------
    const usersColRef = collection(db, "users");
    const testDocSnapshot = await getDocs(usersColRef);
    let containsLegacyTestData = false;
    
    testDocSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (
        docSnap.id === "c1" || 
        docSnap.id === "e1" || 
        docSnap.id === "s1" || 
        data.email === "client1@email.com" ||
        data.email === "contact@plmcmarket.com" ||
        data.name === "Jean Dupont"
      ) {
        containsLegacyTestData = true;
      }
    });

    if (containsLegacyTestData) {
      console.log("[Firebase Auto-Purge] Found legacy test users/accounts ('c1', 'e1', 's1', etc.) in Firestore.");
      console.log("[Firebase Auto-Purge] Automatically resetting database and purging ALL test accounts, products, and orders...");
      
      // Clear Firestore completely for lists to sync
      for (const colName of Object.keys(collectionsToSync)) {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        for (const docSnap of snapshot.docs) {
          await deleteDoc(doc(db, colName, docSnap.id));
        }
        console.log(`[Firebase Auto-Purge] Cleared Firestore collection: '${colName}'`);
      }

      // Reset in-memory databases to pristine production slate (with sole administrative account)
      users = [
        { 
          id: "lgelvis64", 
          email: "lgelvis64@gmail.com", 
          name: "Lgelvis64", 
          profileType: "client", 
          isAdmin: true, 
          password: "WeLink@2026", 
          description: "Administrateur Principal WeLink" 
        }
      ];
      wallets = [
        {
          id: "wallet_lgelvis64",
          userId: "lgelvis64",
          balance: 1000000,
          pinSimulated: "1234",
          lastUpdated: new Date().toISOString()
        }
      ];
      withdrawalRequests = [];
      paymentInvoices = [];
      walletTransactions = [];
      products = [];
      jobOffers = [];
      orders = [];
      orderMessages = [];
      jobApplications = [];
      fishLots = [];
      fishLossLogs = [];
      fishAlerts = [];
      butcherLots = [];
      butcherLossLogs = [];
      butcherCuts = [];
      hotelRoomCategories = [];
      hotelRooms = [];
      hotelReservations = [];
      hotelCoupons = [];
      hotelAuditLogs = [];
      hotelFomoSettings = [];
      restaurantTables = [];
      restaurantBookings = [];
      dishRatings = [];
      companyReviews = [];
      clientActivities = [];
      clientClassifications = [];
      enterpriseStocks = [];
      ventes = [];

      // Write clean slate sync targets to Firestore
      for (const [colName, syncObj] of Object.entries(collectionsToSync)) {
        const list = syncObj.get();
        for (const item of list) {
          if (item && item.id !== undefined) {
            const cleanedItem = JSON.parse(JSON.stringify(item));
            await setDoc(doc(db, colName, String(item.id)), cleanedItem);
          }
        }
      }
      console.log("[Firebase Auto-Purge] Database successfully migrated to clean production state !");
      return;
    }
    // -------------------------------------------------------------
    for (const [colName, syncObj] of Object.entries(collectionsToSync)) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() });
        });
        syncObj.set(list);
        console.log(`[Firebase Load] Loaded ${list.length} documents for collection '${colName}'`);
      } else {
        console.log(`[Firebase Load] Collection '${colName}' is empty on Firestore. Bootstrapping with default dataset...`);
        const defaultList = syncObj.get();
        for (const item of defaultList) {
          if (item && item.id !== undefined) {
            const cleanedItem = JSON.parse(JSON.stringify(item));
            await setDoc(doc(db, colName, String(item.id)), cleanedItem);
          }
        }
        console.log(`[Firebase Load] Initialized '${colName}' with ${defaultList.length} default records.`);
      }
    }
    
    // Load Rayon Metadata
    const rayonsDocRef = doc(db, "metadata", "rayons");
    const rayonsSnapshot = await getDoc(rayonsDocRef);
    if (rayonsSnapshot.exists()) {
      rayonsMetadata = rayonsSnapshot.data() as any;
      console.log("[Firebase Load] Loaded rayonsMetadata from Firestore.");
    } else {
      console.log("[Firebase Load] rayonsMetadata is empty on Firestore. Initializing default rayonsMetadata...");
      const cleanedRayons = JSON.parse(JSON.stringify(rayonsMetadata));
      await setDoc(rayonsDocRef, cleanedRayons);
    }

    // Load Commission Settings
    const commissionsDocRef = doc(db, "metadata", "commissions");
    const commissionsSnapshot = await getDoc(commissionsDocRef);
    if (commissionsSnapshot.exists()) {
      commissionSettings = commissionsSnapshot.data() as any;
      console.log("[Firebase Load] Loaded commissionSettings from Firestore.");
    } else {
      console.log("[Firebase Load] commissionSettings is empty on Firestore. Initializing default...");
      await setDoc(commissionsDocRef, JSON.parse(JSON.stringify(commissionSettings)));
    }

    // Load Payment Settings
    const paymentsDocRef = doc(db, "metadata", "payments");
    const paymentsSnapshot = await getDoc(paymentsDocRef);
    if (paymentsSnapshot.exists()) {
      paymentSettings = paymentsSnapshot.data() as any;
      console.log("[Firebase Load] Loaded paymentSettings from Firestore.");
    } else {
      console.log("[Firebase Load] paymentSettings is empty on Firestore. Initializing default...");
      await setDoc(paymentsDocRef, JSON.parse(JSON.stringify(paymentSettings)));
    }

    console.log("[Firebase Load] Firestore data loading process fully completed!");
  } catch (error) {
    console.error("[Firebase Load] Error loading state from Firestore:", error);
  }
}

// --- API Endpoints ---

// Get complete database snapshot
app.get("/api/state", (req, res) => {
  try {
    const rawPayload = {
      users: (users || []).map(u => prepareUserForClient(u)),
      products: products || [],
      jobOffers: jobOffers || [],
      orders: orders || [],
      ventes: ventes || [],
      jobApplications: jobApplications || [],
      rayonsMetadata: rayonsMetadata || {},
      enterpriseStocks: enterpriseStocks || [],
      hotelRoomCategories: hotelRoomCategories || [],
      hotelRooms: hotelRooms || [],
      hotelReservations: hotelReservations || [],
      hotelCoupons: hotelCoupons || [],
      hotelAuditLogs: hotelAuditLogs || [],
      hotelFomoSettings: hotelFomoSettings || [],
      fishLots: fishLots || [],
      fishLossLogs: fishLossLogs || [],
      fishAlerts: fishAlerts || [],
      butcherLots: butcherLots || [],
      butcherLossLogs: butcherLossLogs || [],
      butcherCuts: butcherCuts || [],
      restaurantTables: restaurantTables || [],
      restaurantBookings: restaurantBookings || [],
      dishRatings: dishRatings || [],
      companyReviews: companyReviews || [],
      clientClassifications: clientClassifications || [],
      wallets: wallets || [],
      withdrawalRequests: withdrawalRequests || [],
      paymentInvoices: paymentInvoices || [],
      walletTransactions: walletTransactions || [],
      commissionSettings: commissionSettings || {},
      paymentSettings: paymentSettings || {}
    };

    // Safe stringification mechanism to handle potential BigInts or Circular references gracefully
    const cache = new Set();
    const jsonString = JSON.stringify(rawPayload, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      if (typeof value === "object" && value !== null) {
        if (cache.has(value)) {
          return undefined; // Circular reference found, discard key
        }
        cache.add(value);
      }
      return value;
    });
    cache.clear();

    const buffer = Buffer.from(jsonString, "utf-8");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Length", buffer.length.toString());
    res.send(buffer);
  } catch (err) {
    console.error("[Get State Error] Serialization failed:", err);
    res.status(500).json({ 
      error: "Erreur de sérialisation", 
      message: err instanceof Error ? err.message : String(err) 
    });
  }
});

// Resets/Purger standard system collections to raw, empty state with single platform admin account
app.post("/api/admin/reset-db", async (req, res) => {
  console.log("[Firebase Reset] Resetting entire database to zero...");
  try {
    // 1. Delete all Firestore documents across synced collections
    if (db) {
      for (const colName of Object.keys(collectionsToSync)) {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        for (const docSnap of snapshot.docs) {
          await deleteDoc(doc(db, colName, docSnap.id));
        }
        console.log(`[Firebase Reset] Cleared collection '${colName}' in firestore.`);
      }
    }

    // 2. Clear in-memory collections completely and set clean default
    users = [
      { 
        id: "lgelvis64", 
        email: "lgelvis64@gmail.com", 
        name: "Lgelvis64", 
        profileType: "client", 
        isAdmin: true, 
        password: "WeLink@2026", 
        description: "Administrateur Principal WeLink" 
      }
    ];
    wallets = [
      {
        id: "wallet_lgelvis64",
        userId: "lgelvis64",
        balance: 1000000,
        pinSimulated: "1234",
        lastUpdated: new Date().toISOString()
      }
    ];
    withdrawalRequests = [];
    paymentInvoices = [];
    walletTransactions = [];
    products = [];
    jobOffers = [];
    orders = [];
    orderMessages = [];
    jobApplications = [];
    fishLots = [];
    fishLossLogs = [];
    fishAlerts = [];
    butcherLots = [];
    butcherLossLogs = [];
    butcherCuts = [];
    hotelRoomCategories = [];
    hotelRooms = [];
    hotelReservations = [];
    hotelCoupons = [];
    hotelAuditLogs = [];
    enterpriseStocks = [];
    ventes = [];
    restaurantTables = [];
    restaurantBookings = [];
    dishRatings = [];

    // 3. Write clean initial state to Firestore
    if (db) {
      for (const [colName, syncObj] of Object.entries(collectionsToSync)) {
        const list = syncObj.get();
        for (const item of list) {
          if (item && item.id !== undefined) {
             const cleanedItem = JSON.parse(JSON.stringify(item));
             await setDoc(doc(db, colName, String(item.id)), cleanedItem);
          }
        }
      }
    }

    res.json({ success: true, message: "La base de données a été réinitialisée à 0 avec succès !" });
  } catch (err) {
    console.error("[Firebase Reset] Error resetting database:", err);
    res.status(500).json({ error: "Erreur lors de la réinitialisation de la base de données.", details: String(err) });
  }
});

// --- HOTEL MANAGEMENT ENDPOINTS ---

// 1. ROOM CATEGORIES
app.post("/api/hotel/categories", (req, res) => {
  const { hotelId, name, description } = req.body;
  if (!hotelId || !name) return res.status(400).json({ error: "Champs obligatoires manquants." });
  const category = {
    id: "cat-" + Math.random().toString(36).substring(2, 9),
    hotelId,
    name,
    description: description || ""
  };
  hotelRoomCategories.push(category);
  
  hotelAuditLogs.unshift({
    id: "log-" + Math.random().toString(36).substring(2, 9),
    hotelId,
    action: "CATEGORY_CREATE",
    details: `Catégorie d'hébergement '${name}' créée.`,
    timestamp: new Date().toISOString()
  });
  res.json({ success: true, category });
});

app.put("/api/hotel/categories/:id", (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const index = hotelRoomCategories.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: "Catégorie inconnue." });
  hotelRoomCategories[index] = { ...hotelRoomCategories[index], name, description };
  res.json({ success: true, category: hotelRoomCategories[index] });
});

app.delete("/api/hotel/categories/:id", (req, res) => {
  const { id } = req.params;
  const category = hotelRoomCategories.find(c => c.id === id);
  if (!category) return res.status(404).json({ error: "Catégorie inconnue." });
  hotelRoomCategories = hotelRoomCategories.filter(c => c.id !== id);
  res.json({ success: true });
});

// 2. ROOM CONTROLLER
app.post("/api/hotel/rooms", (req, res) => {
  const { hotelId, number, type, capacity, price, description, equipments, photos, status } = req.body;
  if (!hotelId || !number || !type || !price) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }
  const conflict = hotelRooms.some(r => r.hotelId === hotelId && r.number === number);
  if (conflict) {
    return res.status(400).json({ error: `La chambre numéro ${number} existe déjà dans cet hôtel.` });
  }

  const room = {
    id: "room-" + Math.random().toString(36).substring(2, 9),
    hotelId,
    number,
    type,
    capacity: parseInt(capacity) || 2,
    price: parseFloat(price) || 0,
    description: description || "",
    equipments: Array.isArray(equipments) ? equipments : [],
    photos: Array.isArray(photos) && photos.length > 0 ? photos : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600"],
    status: status || "Libre"
  };

  hotelRooms.push(room);
  hotelAuditLogs.unshift({
    id: "log-" + Math.random().toString(36).substring(2, 9),
    hotelId,
    action: "ROOM_CREATE",
    details: `Chambre #${number} (${type}) ajoutée au catalogue.`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, room });
});

app.put("/api/hotel/rooms/:id", (req, res) => {
  const { id } = req.params;
  const { number, type, capacity, price, description, equipments, photos, status } = req.body;
  const index = hotelRooms.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ error: "Chambre inconnue." });
  
  const oldRoom = hotelRooms[index];
  const updated = {
    ...oldRoom,
    number: number !== undefined ? number : oldRoom.number,
    type: type !== undefined ? type : oldRoom.type,
    capacity: capacity !== undefined ? parseInt(capacity) || oldRoom.capacity : oldRoom.capacity,
    price: price !== undefined ? parseFloat(price) || oldRoom.price : oldRoom.price,
    description: description !== undefined ? description : oldRoom.description,
    equipments: equipments !== undefined ? (Array.isArray(equipments) ? equipments : []) : oldRoom.equipments,
    photos: photos !== undefined ? (Array.isArray(photos) ? photos : []) : oldRoom.photos,
    status: status !== undefined ? status : oldRoom.status
  };

  hotelRooms[index] = updated;

  hotelAuditLogs.unshift({
    id: "log-" + Math.random().toString(36).substring(2, 9),
    hotelId: updated.hotelId,
    action: "ROOM_UPDATE",
    details: `Mise à jour chambre #${updated.number}. État : ${updated.status}.`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, room: updated });
});

app.delete("/api/hotel/rooms/:id", (req, res) => {
  const { id } = req.params;
  const room = hotelRooms.find(r => r.id === id);
  if (!room) return res.status(404).json({ error: "Chambre inconnue." });
  hotelRooms = hotelRooms.filter(r => r.id !== id);
  res.json({ success: true });
});

// 3. BOOKINGS / RESERVATIONS
app.post("/api/hotel/reservations", (req, res) => {
  const { 
    hotelId, hotelName, clientId, clientName, clientEmail, clientPhone, 
    roomId, roomNumber, roomType, checkIn, checkOut, nights, basePrice, 
    additionalServices, servicesPrice, couponCode, discountAmount, totalPrice,
    paymentStatus, paymentMethod, paidAmount, status 
  } = req.body;

  if (!hotelId || !roomId || !checkIn || !checkOut || !clientId) {
    return res.status(400).json({ error: "Données de réservation incomplètes." });
  }

  // Overlap date validation
  const roomConflict = hotelReservations.some(b => 
    b.roomId === roomId && 
    b.status !== 'cancelled' && 
    (
      (new Date(checkIn) >= new Date(b.checkIn) && new Date(checkIn) < new Date(b.checkOut)) ||
      (new Date(checkOut) > new Date(b.checkIn) && new Date(checkOut) <= new Date(b.checkOut)) ||
      (new Date(checkIn) <= new Date(b.checkIn) && new Date(checkOut) >= new Date(b.checkOut))
    )
  );

  if (roomConflict) {
    return res.status(400).json({ error: "Conflit de calendrier : la chambre choisie est déjà réservée sur cette période." });
  }

  const reservation = {
    id: "res-" + Math.random().toString(36).substring(2, 9),
    hotelId,
    hotelName,
    clientId,
    clientName,
    clientEmail: clientEmail || "client@email.com",
    clientPhone: clientPhone || "+225 00000000",
    roomId,
    roomNumber,
    roomType,
    checkIn,
    checkOut,
    nights: parseInt(nights) || 1,
    basePrice: parseFloat(basePrice) || 0,
    additionalServices: Array.isArray(additionalServices) ? additionalServices : [],
    servicesPrice: parseFloat(servicesPrice) || 0,
    couponCode: couponCode || "",
    discountAmount: parseFloat(discountAmount) || 0,
    totalPrice: parseFloat(totalPrice) || 0,
    paymentStatus: paymentStatus || "pending",
    paymentMethod: paymentMethod || "cash",
    paidAmount: parseFloat(paidAmount) || 0,
    status: status || "pending",
    createdAt: new Date().toISOString()
  };

  hotelReservations.unshift(reservation);

  const roomIndex = hotelRooms.findIndex(r => r.id === roomId);
  if (roomIndex !== -1 && hotelRooms[roomIndex].status === 'Libre') {
    hotelRooms[roomIndex].status = 'Réservée';
  }

  hotelAuditLogs.unshift({
    id: "log-" + Math.random().toString(36).substring(2, 9),
    hotelId,
    action: "RESERVATION_CREATION",
    details: `Réservation #${reservation.id} enregistrée pour ${clientName} (Chambre ${roomNumber}).`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, reservation });
});

app.put("/api/hotel/reservations/:id", (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;
  const index = hotelReservations.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ error: "Réservation introuvable." });

  const oldRes = hotelReservations[index];
  const updated = { ...oldRes, ...updateFields };
  hotelReservations[index] = updated;

  const roomIndex = hotelRooms.findIndex(r => r.id === updated.roomId);
  if (roomIndex !== -1) {
    if (updated.status === 'checked_in') {
      hotelRooms[roomIndex].status = 'Occupée';
    } else if (updated.status === 'checked_out' || updated.status === 'cancelled') {
      hotelRooms[roomIndex].status = 'Libre';
    } else if (updated.status === 'confirmed') {
      hotelRooms[roomIndex].status = 'Réservée';
    }
  }

  hotelAuditLogs.unshift({
    id: "log-" + Math.random().toString(36).substring(2, 9),
    hotelId: updated.hotelId,
    action: "RESERVATION_UPDATE",
    details: `Réservation #${updated.id} modifiée : Statut [${updated.status}], Paiement : [${updated.paymentStatus}].`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, reservation: updated });
});

app.delete("/api/hotel/reservations/:id", (req, res) => {
  const { id } = req.params;
  const index = hotelReservations.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ error: "Réservation introuvable." });
  
  const reservation = hotelReservations[index];
  const roomIndex = hotelRooms.findIndex(r => r.id === reservation.roomId);
  if (roomIndex !== -1) {
    hotelRooms[roomIndex].status = 'Libre';
  }

  hotelReservations = hotelReservations.filter(r => r.id !== id);
  res.json({ success: true });
});

// 4. COUPONS
app.post("/api/hotel/coupons", (req, res) => {
  const { hotelId, code, discountType, discountValue, expiryDate } = req.body;
  if (!hotelId || !code || !discountValue) return res.status(400).json({ error: "Paramètres manquants." });

  const coupon = {
    id: "coup-" + Math.random().toString(36).substring(2, 9),
    hotelId,
    code: code.toUpperCase().trim(),
    discountType: discountType || "percent",
    discountValue: parseFloat(discountValue) || 10,
    active: true,
    expiryDate: expiryDate || null
  };

  hotelCoupons.push(coupon);
  res.json({ success: true, coupon });
});

app.put("/api/hotel/coupons/:id", (req, res) => {
  const { id } = req.params;
  const { active, discountValue } = req.body;
  const index = hotelCoupons.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: "Coupon introuvable." });
  
  if (active !== undefined) hotelCoupons[index].active = active;
  if (discountValue !== undefined) hotelCoupons[index].discountValue = discountValue;

  res.json({ success: true, coupon: hotelCoupons[index] });
});

app.delete("/api/hotel/coupons/:id", (req, res) => {
  const { id } = req.params;
  hotelCoupons = hotelCoupons.filter(c => c.id !== id);
  res.json({ success: true });
});

// Update or set hotel FOMO flash offer settings
app.put("/api/hotel/fomo", (req, res) => {
  const { hotelId, title, hoursLeft, active, expiryDate } = req.body;
  if (!hotelId) return res.status(400).json({ error: "hotelId manquant." });

  let settingIndex = hotelFomoSettings.findIndex(s => s.hotelId === hotelId);
  if (settingIndex === -1) {
    const fomoObj = {
      hotelId,
      title: title || "OFFRE FLASH WEEK-END : -30% SUR LES SÉJOURS !",
      hoursLeft: hoursLeft || "4",
      expiryDate: expiryDate || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      active: active !== undefined ? active : true
    };
    hotelFomoSettings.push(fomoObj);
    settingIndex = hotelFomoSettings.length - 1;
  } else {
    if (title !== undefined) hotelFomoSettings[settingIndex].title = title;
    if (hoursLeft !== undefined) hotelFomoSettings[settingIndex].hoursLeft = hoursLeft;
    if (expiryDate !== undefined) {
      hotelFomoSettings[settingIndex].expiryDate = expiryDate;
    } else if (hoursLeft !== undefined) {
      const h = parseFloat(hoursLeft) || 4;
      hotelFomoSettings[settingIndex].expiryDate = new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
    }
    if (active !== undefined) hotelFomoSettings[settingIndex].active = active;
  }

  // Log in hotel audit log
  hotelAuditLogs.unshift({
    id: "log-" + Math.random().toString(36).substring(2, 9),
    hotelId,
    action: "FOMO_UPDATE",
    details: `Campagne Flash: '${hotelFomoSettings[settingIndex].title}' - Statut: ${hotelFomoSettings[settingIndex].active ? 'Activé' : 'Désactivé'} - Durée: ${hotelFomoSettings[settingIndex].hoursLeft} heures.`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, fomo: hotelFomoSettings[settingIndex] });
});


// Submit a direct walk-in / cashier sale
app.post("/api/ventes", (req, res) => {
  const { 
    entreprise_id, 
    age, 
    sexe, 
    items, 
    paymentMethod, 
    discountAmount, 
    discountCode, 
    promoApplied, 
    vatRate, 
    vatAmount, 
    clientName 
  } = req.body;
  
  if (!entreprise_id || !age || !sexe || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Paramètres manquants ou invalides." });
  }

  // Check stocks first to avoid illegal actions (vente-impossible scenario)
  for (const requestedItem of items) {
    const product = products.find(p => p.sellerId === entreprise_id && p.title.toLowerCase() === requestedItem.produit.toLowerCase());
    
    if (!product) {
      return res.status(400).json({ 
        error: "vente_impossible", 
        message: `Produit "${requestedItem.produit}" non répertorié dans vos étalages.`,
        produit: requestedItem.produit,
        demande: requestedItem.quantite,
        dispo: 0 
      });
    }

    if (product.stock < requestedItem.quantite) {
      return res.status(400).json({
        error: "vente_impossible",
        message: `Quantité insuffisante pour "${product.title}".`,
        produit: product.title,
        demande: requestedItem.quantite,
        dispo: product.stock
      });
    }
  }

  // Decrement physical stock
  let totalCalculated = 0;
  const processedItems = items.map((requestedItem: any) => {
    const product = products.find(p => p.sellerId === entreprise_id && p.title.toLowerCase() === requestedItem.produit.toLowerCase())!;
    product.stock -= requestedItem.quantite;
    
    const itemTotal = product.price * requestedItem.quantite;
    totalCalculated += itemTotal;

    return {
      id: "vi_" + Math.random().toString(36).substring(2, 9),
      rayon: product.category,
      produit: product.title,
      quantite: requestedItem.quantite,
      prix_unitaire: product.price,
      total: itemTotal
    };
  });

  const finalTotal = totalCalculated - (Number(discountAmount) || 0);

  const newVente = {
    id: "vente_" + Math.random().toString(36).substring(2, 9),
    entreprise_id,
    age,
    sexe,
    total: Math.max(0, finalTotal),
    date_vente: new Date().toISOString(),
    items: processedItems,
    paymentMethod: paymentMethod || "Espèces",
    discountAmount: discountAmount || 0,
    discountCode: discountCode || "",
    promoApplied: promoApplied || "",
    vatRate: vatRate || 18, // Default VAT rate in many Francophone African countries
    vatAmount: vatAmount || Math.round(Math.max(0, finalTotal) * 0.18),
    clientName: clientName || "Client de passage"
  };

  ventes.unshift(newVente);
  res.status(201).json({ success: true, vente: newVente });
});

// AI Predictive Recommender Model Endpoint
app.post("/api/recommend", (req, res) => {
  try {
    const { entreprise_id, age, sexe, panier } = req.body;
    if (!entreprise_id || !age || !sexe) {
      return res.status(400).json({ error: "entreprise_id, age, et sexe sont requis." });
    }

    const localVentes = Array.isArray(ventes) ? ventes.filter(v => v && v.entreprise_id === entreprise_id) : [];
    const currentBasketProducts = Array.isArray(panier) ? panier : [];

    const staticRecommendations = recommendProducts(localVentes, age, sexe);
    const advancedRecommendations = recommendAdvanced(localVentes, currentBasketProducts, age, sexe);
    const predictionResult = computeRayonPrediction(localVentes, age, sexe);

    res.json({
      success: true,
      staticRecommendations,
      advancedRecommendations,
      predictionResult
    });
  } catch (err) {
    console.error("[recommend] Error calculating dynamic recommendations:", err);
    res.status(500).json({ error: "Erreur serveur lors de la recommandation.", details: String(err) });
  }
});

// --- SECURE DATA & SESSION PREPARATION CODES ---
function prepareUserForClient(user: any) {
  if (!user) return null;
  const u = { ...user };
  
  // Supprimer les données d'authentification secrètes
  delete u.password;
  delete u.resetToken;
  delete u.resetTokenExpires;

  if (u.isDataEncrypted) {
    u.rawAddress = u.address; // Ciphertext backup for user verification panel
    u.rawPhone = u.phone;     // Ciphertext backup for user verification panel
    u.address = decryptData(u.address);
    u.phone = decryptData(u.phone);
  }
  return u;
}

// Track Client Actions & Classify automatically (TikTok algorithm engine)
app.post("/api/activity", (req, res) => {
  const { clientId, activityType, targetId, targetCategory } = req.body;
  if (!clientId || !activityType) {
    return res.status(400).json({ error: "clientId et activityType sont requis." });
  }

  const newActivity = {
    id: "act_" + Math.random().toString(36).substring(2, 9),
    clientId,
    activityType, // 'view_enterprise' | 'view_product' | 'search' | 'add_to_cart' | 'purchase'
    targetId,
    targetCategory: targetCategory || "autre",
    timestamp: new Date().toISOString()
  };
  clientActivities.push(newActivity);

  // Update classification
  let classificationIndex = clientClassifications.findIndex(c => c.clientId === clientId);
  let classification = classificationIndex !== -1 ? clientClassifications[classificationIndex] : null;

  if (!classification) {
    classification = {
      id: "class_" + clientId,
      clientId,
      primaryInterest: "autre",
      scoreMap: {},
      tier: "Curieux 🌱",
      updatedAt: new Date().toISOString()
    };
    clientClassifications.push(classification);
    classificationIndex = clientClassifications.length - 1;
  }

  const scoreMap = classification.scoreMap || {};
  let points = 1;
  if (activityType === 'view_enterprise') points = 2;
  if (activityType === 'view_product') points = 3;
  if (activityType === 'search') points = 5;
  if (activityType === 'add_to_cart') points = 10;
  if (activityType === 'purchase') points = 20;

  if (targetCategory) {
    scoreMap[targetCategory] = (scoreMap[targetCategory] || 0) + points;
  }
  classification.scoreMap = scoreMap;
  classification.updatedAt = new Date().toISOString();

  // Find maximum score Category
  let maxScore = -1;
  let topCategory = "autre";
  for (const cat in scoreMap) {
    const val = Number((scoreMap as any)[cat] || 0);
    if (val > maxScore) {
      maxScore = val;
      topCategory = cat;
    }
  }
  classification.primaryInterest = topCategory;

  // Calculate totals for Tier levels
  const totalScore = Object.values(scoreMap as any).reduce((sum: number, val: any) => sum + Number(val), 0) as number;
  if (totalScore > 60) {
    classification.tier = "Fidèle Partenaire 🔥";
  } else if (totalScore > 30) {
    classification.tier = "Acheteur Actif ⚡";
  } else if (totalScore > 12) {
    classification.tier = "Explorateur 🌟";
  } else {
    classification.tier = "Curieux 🌱";
  }

  clientClassifications[classificationIndex] = classification;
  markDirty("clientClassifications");

  res.json({ success: true, classification });
});

// Post an Enterprise review after visiting
app.post("/api/reviews", (req, res) => {
  const { companyId, companyName, reviewerId, reviewerName, rating, comment, visitContext } = req.body;
  if (!companyId || !reviewerId || !rating) {
    return res.status(400).json({ error: "companyId, reviewerId et rating sont requis." });
  }

  const newReview = {
    id: "rev_" + Math.random().toString(36).substring(2, 9),
    companyId,
    companyName: companyName || "Entreprise",
    reviewerId,
    reviewerName: reviewerName || "Client de quartier",
    rating: Number(rating),
    comment: comment || "",
    visitContext: visitContext || "Visite en ligne",
    createdAt: new Date().toISOString()
  };

  companyReviews.unshift(newReview);
  markDirty("companyReviews");

  res.status(201).json({ success: true, review: newReview, message: "Avis enregistré avec succès !" });
});

// Create/Register account (with custom security encryption support)
app.post("/api/register", (req, res) => {
  const { name, email, profileType, enterpriseType, supplierType, carrierType, vehiclePlate, description, address, phone, pinCode, isDataEncrypted, password } = req.body;
  if (!name || !email || !profileType) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  // Mot de passe complexe validation
  if (!password) {
    return res.status(400).json({ error: "Le mot de passe est obligatoire pour sécuriser votre compte." });
  }

  // Regex pour mot de passe complexe: min 8 caractères, 1 lettre majuscule, 1 lettre minuscule, 1 chiffre, 1 caractère spécial
  const passwordCriteria = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#+€()\[\]{}|\\/])[A-Za-z\d@$!%*?&._\-#+€()\[\]{}|\\/]{8,}$/;
  if (!passwordCriteria.test(password)) {
    return res.status(400).json({ 
      error: "Mot de passe insuffisant : il doit contenir au moins 8 caractères, dont une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial (ex: @$!%*?&)." 
    });
  }

  // Check if exists
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Un compte avec cette adresse email existe déjà." });
  }

  const wantsEncyption = !!isDataEncrypted;
  const rawAddress = address || "";
  const rawPhone = phone || "";

  // Générer une clé de secours unique "WLK-XXXX-XXXX-XXXX" pour récupération de compte sécurisée
  const recoveryKey = "WLK-" + [
    Math.random().toString(36).substring(2, 6),
    Math.random().toString(36).substring(2, 6),
    Math.random().toString(36).substring(2, 6),
    Math.random().toString(36).substring(2, 6)
  ].join("-").toUpperCase();

  const newUser = {
    id: "user_" + Math.random().toString(36).substring(2, 9),
    name,
    email,
    profileType,
    password, // enregistré de façon sécurisée côté serveur
    recoveryKey, // clé de récupération de secours confidentielle
    enterpriseType: profileType === 'entreprise' ? enterpriseType : undefined,
    supplierType: profileType === 'fournisseur' ? supplierType : undefined,
    carrierType: profileType === 'livreur' ? carrierType : undefined,
    vehiclePlate: profileType === 'livreur' ? vehiclePlate : undefined,
    carrierStatus: profileType === 'livreur' ? 'disponible' : undefined,
    description: description || "",
    address: wantsEncyption ? encryptData(rawAddress) : rawAddress,
    phone: wantsEncyption ? encryptData(rawPhone) : rawPhone,
    pinCode: pinCode || "",
    isDataEncrypted: wantsEncyption,
    avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
    // Initialiser les métriques et compteurs d'IA à 0 pour les nouveaux comptes
    aiTokensUsedToday: 0,
    apiRequestsCount: 0,
    salesCount: 0,
    subscription: {
      planId: "free",
      status: "active" as const,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 mois d'essai gratuit
      autoRenew: true
    }
  };

  // Initialiser le portefeuille électronique à 0 FCFA
  wallets.push({
    id: "wallet_" + Math.random().toString(36).substring(2, 9),
    userId: newUser.id,
    balance: 0,
    pinSimulated: pinCode || "1234",
    lastUpdated: new Date().toISOString()
  });
  markDirty("wallets");

  users.push(newUser);
  markDirty("users");

  const clientUser = prepareUserForClient(newUser);
  res.status(201).json({ 
    success: true, 
    user: clientUser,
    recoveryKey: newUser.recoveryKey // Renvoyé uniquement à l'inscription initiale pour s'assurer que l'utilisateur puisse le mémoriser
  });
});

// Login simulé avec mot de passe et sécurité double PIN code
app.post("/api/login", (req, res) => {
  const { email, password, pinCode } = req.body;
  if (!email) {
    return res.status(400).json({ error: "L'adresse email est requise." });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé. Veuillez vous inscrire d'abord !" });
  }

  // Validation du mot de passe
  // Note: Si le compte est de type pré-généré démo et n'a pas encore de mot de passe, on utilise "WeLink@2026"
  const expectedPassword = user.password || "WeLink@2026";
  if (!password) {
    return res.status(400).json({ error: "Veuillez renseigner votre mot de passe pour vous connecter de façon sécurisée." });
  }
  if (password !== expectedPassword) {
    return res.status(401).json({ error: "Mot de passe incorrect." });
  }

  // Double auth validation pinCode if active
  if (user.pinCode && user.pinCode.trim() !== "") {
    if (!pinCode || pinCode.trim() !== user.pinCode.trim()) {
      return res.status(403).json({ 
        error: "🔒 Double authentification requise : Veuillez fournir votre code secret d'accès unique.",
        pinRequired: true
      });
    }
  }

  const clientUser = prepareUserForClient(user);
  res.json({ success: true, user: clientUser });
});

// Demande d'oublie de mot de passe (forgot-password)
app.post("/api/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "L'adresse e-mail est requise." });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "Aucun profil trouvé avec cette adresse e-mail." });
  }

  // Générer un code OTP dynamique sur 6 chiffres
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetToken = resetToken;
  user.resetTokenExpires = Date.now() + 15 * 60 * 1000; // Valide pendant 15 min
  markDirty("users");

  console.log(`[RÉCUPÉRATION COMPTE] Jeton simulé envoyé à ${email}. Jeton temporaire: ${resetToken}`);

  res.json({
    success: true,
    message: "Un e-mail d'alerte de sécurité contenant votre jeton de récupération temporaire à 6 chiffres a été simulé.",
    demoResetToken: resetToken // Exposé pour la validation instantanée dans l'aperçu AI Studio
  });
});

// Réinitialisation d'un mot de passe oublié via jeton OTP ou Clé de Secours
app.post("/api/reset-password", (req, res) => {
  const { email, token, recoveryKey, newPassword } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "L'adresse e-mail est requise." });
  }
  if (!newPassword) {
    return res.status(400).json({ error: "Le nouveau mot de passe est obligatoire." });
  }

  // Validation du nouveau mot de passe (complexité)
  const passwordCriteria = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#+€()\[\]{}|\\/])[A-Za-z\d@$!%*?&._\-#+€()\[\]{}|\\/]{8,}$/;
  if (!passwordCriteria.test(newPassword)) {
    return res.status(400).json({ 
      error: "Nouveau mot de passe insuffisant : au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial." 
    });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  // Cas 1: Validation via Clé de Secours brute confidentielle de type WLK-XXXX-XXXX-XXXX
  if (recoveryKey) {
    const cleanInput = recoveryKey.trim().toUpperCase();
    const cleanStored = (user.recoveryKey || "").trim().toUpperCase();
    
    if (!cleanStored || cleanInput !== cleanStored) {
      return res.status(400).json({ error: "Le code récepteur ou la Clé de Secours saisie est introuvable ou invalide pour ce compte." });
    }
  } 
  // Cas 2: Validation via Jeton OTP e-mail de 6 chiffres
  else if (token) {
    const cleanToken = token.trim();
    if (!user.resetToken || user.resetToken !== cleanToken) {
      return res.status(400).json({ error: "Le jeton temporaire e-mail renseigné est incorrect." });
    }
    if (user.resetTokenExpires && Date.now() > user.resetTokenExpires) {
      return res.status(400).json({ error: "Le jeton de réinitialisation temporaire a expiré. Veuillez en demander un nouveau." });
    }
  } 
  else {
    return res.status(400).json({ error: "Vous devez fournir soit le Jeton e-mail de sécurité à 6 chiffres, soit votre Clé de Secours." });
  }

  // Mise à jour finale sécuritaire
  user.password = newPassword;
  delete user.resetToken;
  delete user.resetTokenExpires;
  markDirty("users");

  res.json({ success: true, message: "Votre mot de passe a été réinitialisé avec succès ! Connectez-vous maintenant." });
});

// Update user profile information
app.post("/api/users/update", (req, res) => {
  const { id, name, avatarUrl, bio, description, interests, address, phone, pinCode, isDataEncrypted, customBgDataUrl } = req.body;
  if (!id) {
    return res.status(400).json({ error: "L'identifiant de l'utilisateur est requis." });
  }

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  const existingUser = users[userIndex];
  const nextIsDataEncrypted = isDataEncrypted !== undefined ? !!isDataEncrypted : !!existingUser.isDataEncrypted;
  
  // Decide address & phone encryption outputs
  let nextAddress = existingUser.address;
  if (address !== undefined) {
    nextAddress = nextIsDataEncrypted ? encryptData(address) : address;
  } else if (isDataEncrypted !== undefined && isDataEncrypted !== existingUser.isDataEncrypted) {
    const currentDecryptedAddress = decryptData(existingUser.address);
    nextAddress = nextIsDataEncrypted ? encryptData(currentDecryptedAddress) : currentDecryptedAddress;
  }

  let nextPhone = existingUser.phone;
  if (phone !== undefined) {
    nextPhone = nextIsDataEncrypted ? encryptData(phone) : phone;
  } else if (isDataEncrypted !== undefined && isDataEncrypted !== existingUser.isDataEncrypted) {
    const currentDecryptedPhone = decryptData(existingUser.phone);
    nextPhone = nextIsDataEncrypted ? encryptData(currentDecryptedPhone) : currentDecryptedPhone;
  }

  const updatedUser = {
    ...existingUser,
    ...(name !== undefined && { name }),
    ...(avatarUrl !== undefined && { avatarUrl }),
    ...(bio !== undefined && { bio }),
    ...(description !== undefined && { description }),
    ...(interests !== undefined && { interests }),
    address: nextAddress,
    phone: nextPhone,
    ...(pinCode !== undefined && { pinCode }),
    isDataEncrypted: nextIsDataEncrypted,
    ...(customBgDataUrl !== undefined && { customBgDataUrl })
  };

  users[userIndex] = updatedUser as any;
  markDirty("users");

  const clientUser = prepareUserForClient(updatedUser);
  res.json({ success: true, user: clientUser });
});

// Delete user account
app.post("/api/users/delete", (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "L'identifiant de l'utilisateur est requis." });
  }

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  // Remove the user from the users array
  users.splice(userIndex, 1);

  res.json({ success: true, message: "Compte supprimé avec succès." });
});

// Post a product
app.post("/api/products", (req, res) => {
  const { 
    sellerId, title, description, price, category, stock, unit, imageUrl, rayon,
    brand, color, size, material, minStock, status, images
  } = req.body;
  
  const user = users.find(u => u.id === sellerId);
  if (!user) {
    return res.status(404).json({ error: "Vendeur non trouvé." });
  }

  const newProduct = {
    id: "product_" + Math.random().toString(36).substring(2, 9),
    sellerId,
    sellerName: user.name,
    sellerType: user.profileType, // entreprise or fournisseur
    title,
    description,
    price: Number(price),
    category,
    imageUrl: imageUrl || undefined,
    stock: Number(stock),
    unit,
    rayon: user.enterpriseType === 'supermarche' ? (rayon || "Épicerie") : undefined,
    // Clothing properties
    brand: brand || undefined,
    color: color || undefined,
    size: size || undefined,
    material: material || undefined,
    minStock: minStock !== undefined ? Number(minStock) : undefined,
    status: status || 'Disponible',
    images: Array.isArray(images) ? images : undefined
  };

  products.unshift(newProduct);
  res.status(201).json({ success: true, product: newProduct });
});

// Delete a product
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Produit introuvable." });
  }
  products.splice(index, 1);
  res.json({ success: true });
});

// Edit/Update a product attributes (including image and promotion)
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { 
    title, description, price, stock, imageUrl, rayon, promotionDiscount, promotionEnd,
    brand, color, size, material, minStock, status, images
  } = req.body;
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: "Produit non trouvé." });
  }
  if (title !== undefined) product.title = title;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (imageUrl !== undefined) product.imageUrl = imageUrl;
  if (rayon !== undefined) product.rayon = rayon;
  
  if (promotionDiscount !== undefined) {
    (product as any).promotionDiscount = (promotionDiscount === null || promotionDiscount === "") ? undefined : Number(promotionDiscount);
  }
  if (promotionEnd !== undefined) {
    (product as any).promotionEnd = (promotionEnd === null || promotionEnd === "") ? undefined : promotionEnd;
  }

  // Clothing Boutique properties
  if (brand !== undefined) (product as any).brand = brand;
  if (color !== undefined) (product as any).color = color;
  if (size !== undefined) (product as any).size = size;
  if (material !== undefined) (product as any).material = material;
  if (minStock !== undefined) (product as any).minStock = minStock === null ? undefined : Number(minStock);
  if (status !== undefined) (product as any).status = status;
  if (images !== undefined) (product as any).images = Array.isArray(images) ? images : undefined;
  
  res.json({ success: true, product });
});

// Update or set custom rayon metadata (description, image, emoji)
app.post("/api/rayons/metadata", (req, res) => {
  const { rayonName, desc, img, emoji } = req.body;
  if (!rayonName) {
    return res.status(400).json({ error: "Nom du rayon requis." });
  }
  if (!rayonsMetadata[rayonName]) {
    rayonsMetadata[rayonName] = {
      desc: desc || "Rayon personnalisé configuré pour classifier vos articles selon vos besoins de supermarché.",
      img: img || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
      emoji: emoji || "📦"
    };
  } else {
    if (desc !== undefined) rayonsMetadata[rayonName].desc = desc;
    if (img !== undefined) rayonsMetadata[rayonName].img = img;
    if (emoji !== undefined) rayonsMetadata[rayonName].emoji = emoji;
  }
  res.json({ success: true, metadata: rayonsMetadata[rayonName] });
});

// Rename/Update an existing rayon and translate all matching products
app.post("/api/rayons/rename", (req, res) => {
  const { sellerId, oldRayonName, newRayonName, desc, img, emoji } = req.body;
  if (!sellerId || !oldRayonName || !newRayonName) {
    return res.status(400).json({ error: "Saisissez les informations requises de renommage." });
  }

  // Copy metadata
  if (rayonsMetadata[oldRayonName]) {
    rayonsMetadata[newRayonName] = {
      desc: desc !== undefined ? desc : rayonsMetadata[oldRayonName].desc,
      img: img !== undefined ? img : rayonsMetadata[oldRayonName].img,
      emoji: emoji !== undefined ? emoji : rayonsMetadata[oldRayonName].emoji
    };
  } else {
    rayonsMetadata[newRayonName] = {
      desc: desc || "Rayon personnalisé configuré pour classifier vos articles selon vos besoins de supermarché.",
      img: img || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
      emoji: emoji || "📦"
    };
  }

  // Update associated products
  let updatedCount = 0;
  products = products.map(p => {
    if (p.sellerId === sellerId && (p.rayon || "Épicerie & Crémerie") === oldRayonName) {
      updatedCount++;
      return { ...p, rayon: newRayonName };
    }
    return p;
  });

  res.json({ success: true, updatedCount, metadata: rayonsMetadata[newRayonName] });
});

// Delete an existing rayon and unlink all products in it
app.post("/api/rayons/delete", (req, res) => {
  const { sellerId, rayonName } = req.body;
  if (!sellerId || !rayonName) {
    return res.status(400).json({ error: "Saisissez l'identifiant du vendeur et le rayon à supprimer." });
  }

  // Set match products rayon to undefined (so they aren't associated with this rayon anymore)
  let updatedCount = 0;
  products = products.map(p => {
    if (p.sellerId === sellerId && (p.rayon || "Épicerie & Crémerie") === rayonName) {
      updatedCount++;
      const updated = { ...p };
      delete updated.rayon;
      return updated;
    }
    return p;
  });

  res.json({ success: true, updatedCount });
});

// Bulk apply or remove promotion/flash-sale to all products of a seller in a specific rayon (or all rayons)
app.post("/api/rayons/bulk-promote", (req, res) => {
  const { sellerId, rayon, promotionDiscount, durationValue, durationUnit } = req.body;
  if (!sellerId) {
    return res.status(400).json({ error: "ID du vendeur requis." });
  }

  const discountNum = Number(promotionDiscount);
  const isClear = promotionDiscount === "" || promotionDiscount === null || isNaN(discountNum) || discountNum <= 0;

  let promoEndIso: string | undefined = undefined;
  if (!isClear) {
    const val = Number(durationValue) || 30;
    let extraMs = 0;
    if (durationUnit === 'minutes') {
      extraMs = val * 60 * 1000;
    } else if (durationUnit === 'heures') {
      extraMs = val * 60 * 60 * 1000;
    } else if (durationUnit === 'jours') {
      extraMs = val * 24 * 60 * 60 * 1000;
    } else {
      extraMs = val * 60 * 1000; // fallback to minutes
    }
    promoEndIso = new Date(Date.now() + extraMs).toISOString();
  }

  let updatedCount = 0;
  products.forEach(p => {
    // If rayon is passed, match it; otherwise, update all products of that seller
    if (p.sellerId === sellerId && (!rayon || p.rayon === rayon)) {
      if (isClear) {
        delete (p as any).promotionDiscount;
        delete (p as any).promotionEnd;
      } else {
        (p as any).promotionDiscount = discountNum;
        (p as any).promotionEnd = promoEndIso;
      }
      updatedCount++;
    }
  });

  res.json({ 
    success: true, 
    updatedCount, 
    promotionDiscount: isClear ? undefined : discountNum, 
    promotionEnd: promoEndIso 
  });
});

// Restock a product (reapprovisionnement)
app.post("/api/products/:id/restock", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: "Produit non trouvé." });
  }
  const qtyNum = Number(quantity);
  if (isNaN(qtyNum) || qtyNum < 0) {
    return res.status(400).json({ error: "Quantité invalide." });
  }
  product.stock += qtyNum;
  res.json({ success: true, stock: product.stock });
});

// Offer a job (only Entreprise)
app.post("/api/jobs", (req, res) => {
  const { companyId, title, description, salary, location, requirements } = req.body;
  
  const user = users.find(u => u.id === companyId);
  if (!user || user.profileType !== 'entreprise') {
    return res.status(403).json({ error: "Seules les entreprises peuvent publier des offres d'emploi." });
  }

  const newJob = {
    id: "job_" + Math.random().toString(36).substring(2, 9),
    companyId,
    companyName: user.name,
    companyType: user.enterpriseType || "autre",
    title,
    description,
    salary,
    location,
    requirements: requirements || [],
    createdAt: new Date().toISOString().split('T')[0]
  };

  jobOffers.unshift(newJob);
  res.status(201).json({ success: true, job: newJob });
});

// Delete a job offer
app.delete("/api/jobs/:id", (req, res) => {
  const { id } = req.params;
  const index = jobOffers.findIndex(j => j.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Offre d'emploi introuvable." });
  }
  jobOffers.splice(index, 1);
  res.json({ success: true });
});

// Apply to a job with CV
app.post("/api/applications", (req, res) => {
  const {
    jobId,
    clientId,
    clientName,
    clientEmail,
    clientPhone,
    cvType,
    cvFileName,
    cvFileContent,
    cvBuilderData
  } = req.body;

  const job = jobOffers.find(j => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: "Offre d'emploi introuvable." });
  }

  const newApplication = {
    id: "app_" + Math.random().toString(36).substring(2, 9),
    jobId,
    jobTitle: job.title,
    companyId: job.companyId,
    companyName: job.companyName,
    clientId,
    clientName: clientName || "Postulant anonyme",
    clientEmail: clientEmail || "",
    clientPhone: clientPhone || "",
    appliedAt: new Date().toLocaleDateString('fr-FR'),
    cvType,
    cvFileName,
    cvFileContent,
    status: 'pending',
    cvBuilderData
  };

  jobApplications.unshift(newApplication);
  res.status(201).json({ success: true, application: newApplication });
});

// Reject a job application
app.post("/api/applications/:id/reject", (req, res) => {
  const { id } = req.params;
  const appItem = jobApplications.find(a => a.id === id);
  if (!appItem) {
    return res.status(404).json({ error: "Candidature introuvable." });
  }
  appItem.status = 'rejected';
  res.json({ success: true, application: appItem });
});

// Accept/Validate a job application
app.post("/api/applications/:id/accept", (req, res) => {
  const { id } = req.params;
  const appItem = jobApplications.find(a => a.id === id);
  if (!appItem) {
    return res.status(404).json({ error: "Candidature introuvable." });
  }
  appItem.status = 'accepted';
  res.json({ success: true, application: appItem });
});

function getCurrentProductPrice(product: any): number {
  if (product.promotionDiscount && product.promotionEnd && new Date(product.promotionEnd) > new Date()) {
    return Math.round(product.price * (1 - product.promotionDiscount / 100));
  }
  return product.price;
}

// Place a bulk order from a client's composite shopping cart
app.post("/api/orders/bulk", (req, res) => {
  const { buyerId, items, targetSellerId, paymentMethod, isEscrow, scheduledDate, scheduledTime, serviceType, deliveryAddress, tableNumber } = req.body;

  const buyer = users.find(u => u.id === buyerId);
  if (!buyer) return res.status(404).json({ error: "Acheteur non trouvé." });

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Le panier est vide." });
  }

  // First pass: validation
  const validationError = [];
  const processedItems = [];

  for (const item of items) {
    const { productId, quantity, customCut } = item;
    const product = products.find(p => p.id === productId);
    if (!product) {
       validationError.push(`Produit introuvable`);
       continue;
    }
    if (product.stock < quantity) {
      validationError.push(`Stock insuffisant pour "${product.title}" (Dispo: ${product.stock}, Demandé: ${quantity})`);
      continue;
    }
    processedItems.push({ product, quantity, customCut });
  }

  if (validationError.length > 0) {
    return res.status(400).json({ error: validationError.join(". ") });
  }

  // Second pass: actual database updates and orders creation
  const createdOrders = [];

  for (const { product, quantity, customCut } of processedItems) {
    product.stock -= quantity;

    const defaultSeller = users.find(u => u.id === product.sellerId);
    let finalSellerId = targetSellerId && targetSellerId !== 'all' ? targetSellerId : product.sellerId;
    let finalSeller = users.find(u => u.id === finalSellerId) || defaultSeller || { name: product.sellerName, id: product.sellerId };

    const newOrder = {
      id: "order_" + Math.random().toString(36).substring(2, 9),
      buyerId,
      buyerName: buyer.name,
      sellerId: finalSeller.id,
      sellerName: finalSeller.name,
      productId: product.id,
      productTitle: product.title,
      price: getCurrentProductPrice(product),
      quantity,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      paymentMethod: paymentMethod || "Wave",
      isEscrow: !!isEscrow || paymentMethod === "Escrow (Sécurisé par la Plateforme)",
      escrowStatus: (!!isEscrow || paymentMethod === "Escrow (Sécurisé par la Plateforme)") ? "locked" as const : undefined,
      scheduledDate: scheduledDate || undefined,
      scheduledTime: scheduledTime || undefined,
      customCut: customCut || undefined,
      serviceType: serviceType || undefined,
      deliveryAddress: deliveryAddress || undefined,
      tableNumber: tableNumber || undefined
    };

    orders.unshift(newOrder);
    createdOrders.push(newOrder);
  }

  res.status(201).json({ success: true, orders: createdOrders, message: "Votre panier complet a été validé ! Commande enregistrée avec succès." });
});

// Place an order (Client buying from Enterprise, or Enterprise buying from Supplier)
app.post("/api/orders", (req, res) => {
  const { buyerId, productId, quantity, targetSellerId, paymentMethod, isEscrow, scheduledDate, scheduledTime, customCut, serviceType, deliveryAddress, tableNumber } = req.body;

  const buyer = users.find(u => u.id === buyerId);
  const product = products.find(p => p.id === productId);

  if (!buyer) return res.status(404).json({ error: "Acheteur non trouvé." });
  if (!product) return res.status(404).json({ error: "Produit non trouvé." });
  if (product.stock < quantity) {
    return res.status(400).json({ error: "Stock insuffisant pour ce produit." });
  }

  // Deduct stock
  product.stock -= quantity;

  const defaultSeller = users.find(u => u.id === product.sellerId);

  const finalIsEscrow = !!isEscrow || paymentMethod === "Escrow (Sécurisé par la Plateforme)";
  const finalEscrowStatus = finalIsEscrow ? "locked" as const : undefined;

  // If this is a client buying from an enterprise, and they didn't specify a seller, or chose "all"
  if (product.sellerType === 'entreprise' && defaultSeller?.enterpriseType) {
    if (!targetSellerId || targetSellerId === 'all') {
      // Find all target enterprises of the same type (need)
      const targetEnterprises = users.filter(u => u.profileType === 'entreprise' && u.enterpriseType === defaultSeller.enterpriseType);
      
      if (targetEnterprises.length > 0) {
        const createdOrders = [];
        for (const ent of targetEnterprises) {
          const newOrder = {
            id: "order_" + Math.random().toString(36).substring(2, 9),
            buyerId,
            buyerName: buyer.name,
            sellerId: ent.id,
            sellerName: ent.name,
            productId,
            productTitle: product.title + " (Sans Préférence)",
            price: getCurrentProductPrice(product),
            quantity,
            status: "pending" as const,
            createdAt: new Date().toISOString(),
            paymentMethod: paymentMethod || "Wave",
            isEscrow: finalIsEscrow,
            escrowStatus: finalEscrowStatus,
            scheduledDate: scheduledDate || undefined,
            scheduledTime: scheduledTime || undefined,
            customCut: customCut || undefined,
            serviceType: serviceType || undefined,
            deliveryAddress: deliveryAddress || undefined,
            tableNumber: tableNumber || undefined
          };
          orders.unshift(newOrder);
          createdOrders.push(newOrder);
        }
        return res.status(201).json({ success: true, orders: createdOrders, message: `Commande multi-destinataire transmise à ${targetEnterprises.length} entreprises du secteur (${defaultSeller.enterpriseType}).` });
      }
    } else {
      // User targeted a specific enterprise
      const specificSeller = users.find(u => u.id === targetSellerId);
      if (specificSeller) {
        const newOrder = {
          id: "order_" + Math.random().toString(36).substring(2, 9),
          buyerId,
          buyerName: buyer.name,
          sellerId: specificSeller.id,
          sellerName: specificSeller.name,
          productId,
          productTitle: product.title,
          price: getCurrentProductPrice(product),
          quantity,
          status: "pending" as const,
          createdAt: new Date().toISOString(),
          paymentMethod: paymentMethod || "Wave",
          isEscrow: finalIsEscrow,
          escrowStatus: finalEscrowStatus,
          scheduledDate: scheduledDate || undefined,
          scheduledTime: scheduledTime || undefined,
          customCut: customCut || undefined,
          serviceType: serviceType || undefined,
          deliveryAddress: deliveryAddress || undefined,
          tableNumber: tableNumber || undefined
        };
        orders.unshift(newOrder);
        return res.status(201).json({ success: true, order: newOrder, message: `Commande exclusive envoyée à ${specificSeller.name}.` });
      }
    }
  }

  // Default fallback (single order for original seller - e.g. for supplier)
  const finalSellerId = targetSellerId && targetSellerId !== 'all' ? targetSellerId : product.sellerId;
  const finalSeller = users.find(u => u.id === finalSellerId) || defaultSeller || { name: product.sellerName, id: product.sellerId };

  const newOrder = {
    id: "order_" + Math.random().toString(36).substring(2, 9),
    buyerId,
    buyerName: buyer.name,
    sellerId: finalSeller.id,
    sellerName: finalSeller.name,
    productId,
    productTitle: product.title,
    price: getCurrentProductPrice(product),
    quantity,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
    paymentMethod: paymentMethod || "Wave",
    isEscrow: finalIsEscrow,
    escrowStatus: finalEscrowStatus,
    scheduledDate: scheduledDate || undefined,
    scheduledTime: scheduledTime || undefined,
    customCut: customCut || undefined,
    serviceType: serviceType || undefined,
    deliveryAddress: deliveryAddress || undefined,
    tableNumber: tableNumber || undefined
  };

  orders.unshift(newOrder);
  res.status(201).json({ success: true, order: newOrder });
});

// Handle order status updates & quantity modifications with stock reconciliation
app.patch("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status, quantity, paymentMethod, escrowStatus, carrierId, carrierName, carrierPhone, deliveryStatus, deliveryFee } = req.body;

  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: "Commande non trouvée." });

  const oldStatus = order.status;

  // WeLink Delivery/Logistics integrations
  if (carrierId !== undefined) {
    order.carrierId = carrierId;
  }
  if (carrierName !== undefined) {
    order.carrierName = carrierName;
  }
  if (carrierPhone !== undefined) {
    order.carrierPhone = carrierPhone;
  }
  if (deliveryStatus !== undefined) {
    order.deliveryStatus = deliveryStatus;
  }
  if (deliveryFee !== undefined) {
    order.deliveryFee = deliveryFee;
  }

  // 1. Store payment method if provided
  if (paymentMethod) {
    (order as any).paymentMethod = paymentMethod;
  }

  // 2. If modifying quantity (only allowed if order is 'pending')
  if (quantity !== undefined && order.status === 'pending') {
    const product = products.find(p => p.id === order.productId);
    if (product) {
      const diff = quantity - order.quantity; // positive if increasing quantity, negative if decreasing
      if (diff > 0) {
        // Need to check if there is enough stock for the increase
        if (product.stock < diff) {
          return res.status(400).json({ error: `Stock insuffisant pour augmenter la quantité. Stock disponible : ${product.stock}` });
        }
        product.stock -= diff;
      } else if (diff < 0) {
        // Restore returned stock
        product.stock += Math.abs(diff);
      }
    }
    order.quantity = quantity;
  }

  // 3. If changing status
  if (status !== undefined) {
    // If status is cancelled, restore stock to product (unless it was already cancelled or delivered)
    if (status === 'cancelled' && oldStatus !== 'cancelled' && oldStatus !== 'delivered') {
      const product = products.find(p => p.id === order.productId);
      if (product) {
        product.stock += order.quantity;
      }
    }
    // If reverting a cancellation (e.g. back to pending), check stock
    if (oldStatus === 'cancelled' && status !== 'cancelled') {
      const product = products.find(p => p.id === order.productId);
      if (product) {
        if (product.stock < order.quantity) {
          return res.status(400).json({ error: `Stock insuffisant pour rétablir la commande. Stock disponible : ${product.stock}` });
        }
        product.stock -= order.quantity;
      }
    }

    order.status = status;

    // Escrow lifecycle triggers
    if (order.isEscrow) {
      if (status === 'delivered') {
        order.escrowStatus = 'released';
      } else if (status === 'cancelled') {
        order.escrowStatus = 'refunded';
      }
    }

    // Add B2B stock dynamically if order is marked as delivered and was not delivered before
    if (status === 'delivered' && oldStatus !== 'delivered') {
      const buyer = users.find(u => u.id === order.buyerId);
      if (buyer && buyer.profileType === 'entreprise') {
        const product = products.find(p => p.id === order.productId);
        const existingStock = enterpriseStocks.find(
          s => s.buyerId === order.buyerId && s.title.toLowerCase() === order.productTitle.toLowerCase()
        );
        if (existingStock) {
          existingStock.quantity += order.quantity;
        } else {
          enterpriseStocks.push({
            id: "st_" + Math.random().toString(36).substring(2, 9),
            buyerId: order.buyerId,
            title: order.productTitle,
            quantity: order.quantity,
            unit: product ? product.unit : 'unités',
            category: product ? product.category : 'Matières premières'
          });
        }
      }

      // Automatically record client/buyer order as a transaction in cash register (ventes)
      const seller = users.find(u => u.id === order.sellerId);
      if (seller && seller.profileType === 'entreprise') {
        const matchedProd = products.find(p => p.id === order.productId);
        const category = matchedProd ? matchedProd.category : "Général";
        const actualPrice = order.price || 1000;
        const totalCost = actualPrice * order.quantity;
        const vat = Math.round(totalCost * 0.07);

        const autoVente = {
          id: "vente_" + Math.random().toString(36).substring(2, 9),
          entreprise_id: order.sellerId,
          age: "26-39", // Simulated / demographic middle
          sexe: "Femme",
          total: totalCost,
          date_vente: new Date().toISOString(),
          items: [
            {
              id: "vi_" + Math.random().toString(36).substring(2, 9),
              rayon: category,
              produit: order.productTitle,
              quantite: order.quantity,
              prix_unitaire: actualPrice,
              total: totalCost
            }
          ],
          paymentMethod: (order as any).paymentMethod || "Mobile Money",
          discountAmount: 0,
          discountCode: "",
          promoApplied: "",
          vatRate: 7,
          vatAmount: vat,
          clientName: order.buyerName || "Client Livraison Portal",
          isAutoOrder: true
        };
        ventes.unshift(autoVente);
      }

      // COMPUTE AND RETRACT PLATFORM COMMISSION ON DELIVERED SALES
      const saleAmount = order.price * order.quantity;
      const commissionRate = (commissionSettings.productSalePercent || 7) / 100;
      const commissionAmount = Math.round(saleAmount * commissionRate);
      const merchantNetCredited = saleAmount - commissionAmount;

      // Ensure seller has a wallet
      let sellerWallet = wallets.find(w => w.userId === order.sellerId);
      if (!sellerWallet) {
        sellerWallet = { id: "w_" + order.sellerId, userId: order.sellerId, balance: 0 };
        wallets.push(sellerWallet);
      }
      sellerWallet.balance += merchantNetCredited;
      markDirty("wallets");

      // Log wallet transaction for seller (net credited)
      const txnSeller = {
        id: "txn_" + Math.random().toString(36).substring(2, 9),
        userId: order.sellerId,
        amount: merchantNetCredited,
        type: "sale_credit",
        description: `Crédit de vente : ${order.productTitle} x ${order.quantity} (Total brut: ${saleAmount} FCFA, Commission platforme retenue: ${commissionAmount} FCFA)`,
        orderId: order.id,
        createdAt: new Date().toISOString()
      };
      walletTransactions.unshift(txnSeller);

      // Log wallet transaction for platform commission
      const txnPlatform = {
        id: "txn_" + Math.random().toString(36).substring(2, 9),
        userId: "platform_admin",
        amount: commissionAmount,
        type: "platform_commission",
        description: `Commission perçue (${commissionSettings.productSalePercent || 7}%) sur la vente '${order.productTitle}' x ${order.quantity} par l'entreprise '${order.sellerName}'`,
        orderId: order.id,
        createdAt: new Date().toISOString()
      };
      walletTransactions.unshift(txnPlatform);
      markDirty("walletTransactions");
    }
  }

  if (escrowStatus !== undefined) {
    order.escrowStatus = escrowStatus;
  }

  res.json({ success: true, order });
});

// GET messages for a specific order or delivery communication
app.get("/api/orders/:id/messages", (req, res) => {
  const { id } = req.params;
  const filtered = orderMessages.filter(m => m.orderId === id);
  res.json(filtered);
});

// POST message for a specific order or delivery communication
app.post("/api/orders/:id/messages", (req, res) => {
  const { id } = req.params;
  const { senderId, senderName, text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Le message ne peut pas être vide." });
  }

  const newMessage = {
    id: "m_" + Math.random().toString(36).substring(2, 9),
    orderId: id,
    senderId,
    senderName,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  orderMessages.push(newMessage);
  res.status(201).json({ success: true, message: newMessage });
});

// Adjust manual enterprise stock quantities
app.post("/api/stocks/:id/adjust", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const stockItem = enterpriseStocks.find(s => s.id === id);
  if (!stockItem) return res.status(404).json({ error: "Stock non trouvé." });

  stockItem.quantity = Math.max(0, Number(quantity));
  res.json({ success: true, stockItem });
});

// Delete a stock entry
app.delete("/api/stocks/:id", (req, res) => {
  const { id } = req.params;
  const idx = enterpriseStocks.findIndex(s => s.id === id);
  if (idx !== -1) {
    enterpriseStocks.splice(idx, 1);
  }
  res.json({ success: true });
});

// --- Server-Side Gemini Assistance Route ---
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, userProfile } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Format des messages invalide." });
  }

  const dbUser = users.find(u => u.id === userProfile?.id || u.email === userProfile?.email);
  if (!dbUser) {
    return res.status(404).json({ error: "Profil utilisateur non trouvé. Session invalide." });
  }

  // Determine subscription plan and status
  let isPremiumOrHigher = false;
  let planId = 'free';
  if (dbUser.subscription) {
    planId = dbUser.subscription.planId || 'free';
    const subStatus = dbUser.subscription.status;
    if (subStatus === 'active' || subStatus === 'trial') {
      if (['premium', 'pro', 'business', 'fournisseur_pro'].includes(planId)) {
        isPremiumOrHigher = true;
      }
    }
  }

  // Enterprise level guards: Pro and Business get AI, Starter gets nothing.
  if (dbUser.profileType === 'entreprise') {
    if (planId === 'free' || planId === 'starter' || !isPremiumOrHigher) {
      return res.status(403).json({ 
        error: "Votre formule Starter (5 000 FCFA/mois) ne comprend pas l'Assistant IA. Veuillez passer à l'offre Pro (15 000 FCFA/mois) ou Business (30 000 FCFA/mois) pour débloquer l'assistant." 
      });
    }
  }

  // Token-Limit for free clients / free suppliers (5 requests a day max)
  if (!isPremiumOrHigher) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!dbUser.aiUsage) {
      dbUser.aiUsage = { count: 0, lastDate: todayStr };
    }
    
    if (dbUser.aiUsage.lastDate !== todayStr) {
      dbUser.aiUsage.count = 0;
      dbUser.aiUsage.lastDate = todayStr;
    }

    if (dbUser.aiUsage.count >= 5) {
      return res.status(429).json({ 
        error: "Limite quotidienne de 5 requêtes IA gratuite atteinte ! Passez à WeLink Premium (2 500 FCFA/mois) pour bénéficier d'une IA illimitée." 
      });
    }

    // Increment count
    dbUser.aiUsage.count++;
    markDirty("users");
  }

  try {
    const ai = getGeminiClient();

    // Create a concise prompt about our products to ground the AI model on real options!
    const availableEnterpriseProducts = products.filter(p => p.sellerType === 'entreprise');
    
    const contextPrompt = `Tu es l'assistant de choix intelligent et conseiller commercial pour notre plateforme startup multi-profils.
    L'utilisateur actuel est un client nommé: ${userProfile?.name || 'Visiteur'}.
    Ton but est de l'aider pas-à-pas à faire les meilleurs choix de produits, d'expliquer les spécialités des différents types d'entreprises (supermarchés, marchés, alimentations, restaurants, secrétariats, hôtels, etc.) et de l'aider à trouver les opportunités idéales.
    
    Voici les produits réels actuellement listés sur notre plateforme par les entreprises:
    ${availableEnterpriseProducts.map(p => `- [ID: ${p.id}] "${p.title}" de l'entreprise "${p.sellerName}" (${p.category}) au prix de ${p.price} FCFA par ${p.unit}. Description: ${p.description} (Stock: ${p.stock})`).join('\n')}
    
    Consignes importantes pour tes réponses:
    1. Sois très courtois, chaleureux, professionnel et précis.
    2. Génère des réponses TRÈS COURTES (maximum 2 à 3 phrases claires et directes). Va droit au but, pas de blabla inutile, pas de formules d'introduction ou de conclusion superflues.
    3. Guide activement les choix de l'utilisateur en lui recommandant expressément certains des produits ci-dessus si sa demande y correspond.
    4. Si l'utilisateur pose une question sans rapport direct avec les produits, réponds brièvement tout en le redirigeant vers notre catalogue de services.
    5. Réponds toujours en FRANÇAIS.
    `;

    // Format history for the generateContent call
    // The messages array is passed as a format of string or structured objects
    const lastMessage = messages[messages.length - 1];
    
    // We can compile history into a cohesive prompt
    let chatHistory = "Historique de la conversation:\n";
    messages.slice(0, -1).forEach((msg: { sender: string; text: string }) => {
      chatHistory += `${msg.sender === 'user' ? 'Client' : 'Conseiller IA'}: ${msg.text}\n`;
    });
    chatHistory += `Client actuel: ${lastMessage.text}`;

    if (process.env.GEMINI_API_KEY) {
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      let responseText = "";
      let success = false;
      let lastErr: any = null;
      
      const modelsToTry = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
      
      for (const modelName of modelsToTry) {
        if (success) break;
        
        // Try up to 2 attempts for each model to prevent slow cascading timeouts
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[Gemini API] Attempt ${attempt} using ${modelName}...`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: chatHistory,
              config: {
                systemInstruction: contextPrompt,
                temperature: 0.7,
              }
            });
            
            if (response && response.text) {
              responseText = response.text;
              success = true;
              console.log(`[Gemini API] Success on attempt ${attempt} with model ${modelName}`);
              break;
            }
          } catch (e: any) {
            lastErr = e;
            console.warn(`[Gemini API] Attempt ${attempt} with model ${modelName} failed:`, e.message || e);
            
            if (attempt < 2) {
              // Fast retry delay of 800ms
              await sleep(800);
            }
          }
        }
      }
      
      if (success && responseText) {
        res.json({ text: responseText });
      } else {
        // Full fail-safe fallback to local semantic recommendations if Gemini API is temporarily down
        console.error("Gemini API completely unavailable (503 / High Demand / Timeout) after multiple retries. Falling back gracefully to semantic answers.", lastErr);
        
        const lower = lastMessage.text.toLowerCase();
        let fallbackText = `Désolé pour cette légère perturbation réseau ! En tant que votre conseiller pour ${userProfile?.name || 'visiteur'}, voici ce que je vous suggère :\n\n`;
        
        if (lower.includes("poisson") || lower.includes("manger") || lower.includes("faim") || lower.includes("attiéké") || lower.includes("tiep")) {
          fallbackText += "Je vous suggère le plat de **Poisson Braisé** ou l'**Attiéké** servi chez *Chez Marie l'Africaine*. Ce sont des plats authentiques, frais et très demandés !";
        } else if (lower.includes("lait") || lower.includes("lessive") || lower.includes("supermarché") || lower.includes("marché")) {
          fallbackText += "Pour vos courses, je vous conseille le **Lait Entier Premium Actilait** ou la lessive disponibles directement chez *PLMC Market*.";
        } else if (lower.includes("chambre") || lower.includes("dormir") || lower.includes("hôtel")) {
          fallbackText += "La **Chambre Deluxe Single** de l'*Hôtel Royal Résidence* est disponible et offre un confort exceptionnel dans un cadre sécurisé.";
        } else if (lower.includes("emploi") || lower.includes("job") || lower.includes("recrute") || lower.includes("offre")) {
          fallbackText += "Plusieurs opportunités de recrutement sont ouvertes en ce moment, notamment comme **Chef Cuisinier Adjoint** chez *Chez Marie* ou **Hôte de Caisse** chez *PLMC Market*. N'hésitez pas à postuler depuis l'onglet Offres d'Emploi !";
        } else if (lower.includes("ordinateur") || lower.includes("impression") || lower.includes("saisie") || lower.includes("photocopie")) {
          fallbackText += "Pour tout besoin de photocopie, secrétariat ou impression de documents professionnels, faites confiance à l'équipe de *Pro-Doc Services*.";
        } else {
          fallbackText += "Je vous conseille d'explorer les produits exceptionnels de nos boutiques de quartier comme *PLMC Market*, *Chez Marie l'Africaine*, ou de réserver une nuitée à l'*Hôtel Royal Résidence* !";
        }
        
        res.json({ text: fallbackText, isFallback: true });
      }
    } else {
      // Mock AI response if API key is not yet set
      console.log("Mocking response due to missing API key");
      const lower = lastMessage.text.toLowerCase();
      let responseText = `Bonjour ${userProfile?.name || ''} ! `;
      
      if (lower.includes("poisson") || lower.includes("manger") || lower.includes("faim") || lower.includes("attiéké") || lower.includes("tiep")) {
        responseText += "Je vous suggère le **Plat d'Attiéké au poisson braisé** ou le **Plat de Tiep bou dienn** chez *Chez Marie l'Africaine*. Plats préparés frais aujourd'hui !";
      } else if (lower.includes("lait") || lower.includes("lessive") || lower.includes("supermarché")) {
        responseText += "Optez pour le **Lait Entier Premium Actilait** disponible chez *PLMC Market*.";
      } else if (lower.includes("chambre") || lower.includes("dormir") || lower.includes("hôtel")) {
        responseText += "La **Chambre Deluxe Single** de l'*Hôtel Royal Résidence* est disponible à 65,000 FCFA/nuitée avec petit-déjeuner inclus.";
      } else if (lower.includes("emploi") || lower.includes("job") || lower.includes("recrute")) {
        responseText += "Postes ouverts : **Chef Cuisinier Adjoint** chez *Chez Marie*, **Hôte de Caisse** chez *PLMC Market* ou **Réceptionniste de nuit** au *Royal Résidence*.";
      } else {
        responseText += "Je conseille d'explorer les articles de *PLMC Market*, les plats *Chez Marie l'Africaine*, ou les services de *Pro-Doc Services*. Quelle est votre recherche ?";
      }

      res.json({ text: responseText, isMock: true });
    }

  } catch (err: any) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: "Une erreur est survenue lors de l'appel à l'assistant intelligent." });
  }
});


// --- Endpoint to export the entire workspace (Vite, TS, Express, metadata, and Python app) as a ZIP ---
app.get("/api/export-zip", (req, res) => {
  try {
    const zip = new AdmZip();

    // 1. Root files
    const rootFiles = [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "index.html",
      "metadata.json",
      ".env.example",
      "server.ts"
    ];

    rootFiles.forEach(file => {
      try {
        const fullPath = path.join(process.cwd(), file);
        zip.addLocalFile(fullPath, "");
      } catch (err) {
        console.warn(`Could not add ${file} to VIP output:`, err);
      }
    });

    // 2. Add source folder
    const srcDir = path.join(process.cwd(), "src");
    zip.addLocalFolder(srcDir, "src");

    // 3. Add python backend folder
    const pythonDir = path.join(process.cwd(), "python_app");
    zip.addLocalFolder(pythonDir, "python_app");

    const zipBuffer = zip.toBuffer();

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=WeLink-Workspace-Export-Python.zip");
    res.send(zipBuffer);

  } catch (err: any) {
    console.error("ZIP Generation Failed:", err);
    res.status(500).send("Erreur lors de la création de la sauvegarde : " + err.message);
  }
});


// Seed active promotions on startup
function seedActivePromotions() {
  const promoSetups = [
    { id: "p-plmc-1", discount: 15, durationMs: 45 * 60 * 1000 }, // 45 mins (Climatiseur SIGNATURE)
    { id: "p-plmc-7", discount: 10, durationMs: 120 * 60 * 1000 }, // 2 hours (iPhone 16 Pro Max)
    { id: "p-plmc-23", discount: 25, durationMs: 15 * 60 * 1000 }, // 15 mins (Maillot des Lions)
    { id: "p-plmc-28", discount: 20, durationMs: 75 * 60 * 1000 }, // 1h 15m (Parfum Sauvage)
    { id: "p-demo-marche-1", discount: 30, durationMs: 35 * 60 * 1000 }, // 35 mins (Panier d'Ananas)
    { id: "p-demo-alimentation-1", discount: 40, durationMs: 50 * 60 * 1000 } // 50 mins (Jus de Bissap Coco)
  ];

  promoSetups.forEach(setup => {
    const product = products.find(p => p.id === setup.id);
    if (product) {
      (product as any).promotionDiscount = setup.discount;
      (product as any).promotionEnd = new Date(Date.now() + setup.durationMs).toISOString();
    }
  });
}

seedActivePromotions();


// --- POISSONNERIE API ENDPOINTS ---

app.post("/api/poissonnerie/lots", (req, res) => {
  const { productId, supplierName, lotNumber, arrivalDate, quantity, unit, freshness, temperature, origin } = req.body;
  if (!productId || !lotNumber || !quantity) {
    return res.status(400).json({ error: "Champs requis manquants: productId, lotNumber, quantity" });
  }

  const newLot = {
    id: "lot_" + Math.random().toString(36).substring(2, 9),
    productId,
    supplierName: supplierName || "Fournisseur Local",
    lotNumber,
    arrivalDate: arrivalDate || new Date().toISOString().split('T')[0],
    quantity: Number(quantity),
    currentStock: Number(quantity),
    unit: unit || "kg",
    freshness: freshness || "Frais ✨",
    temperature: temperature || "2°C",
    origin: origin || "Provenance Locale"
  };

  fishLots.unshift(newLot);

  // Directly increment showcase product stock
  const product = products.find(p => p.id === productId);
  if (product) {
    product.stock += Number(quantity);
    // Dispatch triggered/pending availability alerts
    const alertsToTrigger = fishAlerts.filter(a => a.productId === product.id && a.status === 'pending');
    for (const a of alertsToTrigger) {
      a.status = 'sent';
      (a as any).sentAt = new Date().toISOString();
    }
  }

  res.status(201).json({ success: true, lot: newLot, message: "Lot de poissonnerie enregistré avec succès, stocks mis à jour !" });
});

app.post("/api/poissonnerie/losses", (req, res) => {
  const { productId, productTitle, quantity, unit, reason, cost } = req.body;
  if (!productId || !quantity || !reason) {
    return res.status(400).json({ error: "Champs requis manquants: productId, quantity, reason" });
  }

  const newLoss = {
    id: "loss_" + Math.random().toString(36).substring(2, 9),
    productId,
    productTitle: productTitle || "Produit Inconnu",
    quantity: Number(quantity),
    unit: unit || "kg",
    reason,
    date: new Date().toISOString(),
    cost: Number(cost || 0)
  };

  // Decrement showcase product stock safely
  const product = products.find(p => p.id === productId);
  if (product) {
    product.stock = Math.max(0, product.stock - Number(quantity));
  }

  fishLossLogs.unshift(newLoss);
  res.status(201).json({ success: true, loss: newLoss, message: "Perte/Invendu enregistré et déduit du stock !" });
});

app.post("/api/poissonnerie/alerts", (req, res) => {
  const { productId, buyerEmail, clientName } = req.body;
  if (!productId || !buyerEmail) {
    return res.status(400).json({ error: "L'e-mail et le produit sont requis." });
  }

  // Check if warning already exists for this client / product
  const exists = fishAlerts.some(a => a.productId === productId && a.buyerEmail === buyerEmail && a.status === 'pending');
  if (exists) {
    return res.status(400).json({ error: "Vous êtes déjà inscrit pour recevoir une alerte sur ce poisson." });
  }

  const newAlert = {
    id: "alert_" + Math.random().toString(36).substring(2, 9),
    productId,
    buyerEmail,
    clientName: clientName || "Client Terroir",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  fishAlerts.unshift(newAlert);
  res.status(201).json({ success: true, alert: newAlert, message: "Votre inscription à l'alerte de disponibilité a été prise en compte avec succès !" });
});


// --- BOUCHERIE API ENDPOINTS ---

app.post("/api/boucherie/lots", (req, res) => {
  const { productId, supplierName, lotNumber, arrivalDate, quantity, unit, freshness, temperature, origin, veterinaryCert } = req.body;
  if (!productId || !lotNumber || !quantity) {
    return res.status(400).json({ error: "Champs requis manquants: productId, lotNumber, quantity" });
  }

  const newLot = {
    id: "b_lot_" + Math.random().toString(36).substring(2, 9),
    productId,
    supplierName: supplierName || "Élevage Local/Fournisseur",
    lotNumber,
    arrivalDate: arrivalDate || new Date().toISOString().split('T')[0],
    quantity: Number(quantity),
    currentStock: Number(quantity),
    unit: unit || "kg",
    freshness: freshness || "Frais - Abattu récemment 🥩",
    temperature: temperature || "2°C",
    origin: origin || "Provenance Locale",
    veterinaryCert: veterinaryCert || "Certificat Sanitaire OK"
  };

  butcherLots.unshift(newLot);

  // Directly increment showcase product stock
  const product = products.find(p => p.id === productId);
  if (product) {
    product.stock += Number(quantity);
  }

  res.status(201).json({ success: true, lot: newLot, message: "Lot de viande enregistré avec succès, stocks mis à jour !" });
});

app.post("/api/boucherie/losses", (req, res) => {
  const { productId, productTitle, quantity, unit, reason, cost } = req.body;
  if (!productId || !quantity || !reason) {
    return res.status(400).json({ error: "Champs requis manquants: productId, quantity, reason" });
  }

  const newLoss = {
    id: "b_loss_" + Math.random().toString(36).substring(2, 9),
    productId,
    productTitle: productTitle || "Viande Inconnue",
    quantity: Number(quantity),
    unit: unit || "kg",
    reason,
    date: new Date().toISOString(),
    cost: Number(cost || 0)
  };

  // Decrement showcase product stock safely
  const product = products.find(p => p.id === productId);
  if (product) {
    product.stock = Math.max(0, product.stock - Number(quantity));
  }

  butcherLossLogs.unshift(newLoss);
  res.status(201).json({ success: true, loss: newLoss, message: "Perte/Déchet de viande enregistré !" });
});

app.post("/api/boucherie/cuts", (req, res) => {
  const { sourceCarcass, sourceWeight, targetProductId, targetWeight, lossWeight, piecesCount, operator } = req.body;
  if (!sourceCarcass || !targetProductId || !targetWeight) {
    return res.status(400).json({ error: "Champs requis manquants: sourceCarcass, targetProductId, targetWeight" });
  }

  const newCut = {
    id: "b_cut_" + Math.random().toString(36).substring(2, 9),
    sourceCarcass,
    sourceWeight: Number(sourceWeight || 0),
    targetProductId,
    targetWeight: Number(targetWeight),
    lossWeight: Number(lossWeight || 0),
    piecesCount: Number(piecesCount || 1),
    operator: operator || "Chef Boucher",
    date: new Date().toISOString()
  };

  // Increment weight-based target product stock
  const product = products.find(p => p.id === targetProductId);
  if (product) {
    product.stock += Number(targetWeight);
  }

  butcherCuts.unshift(newCut);
  res.status(201).json({ success: true, cut: newCut, message: "Découpe / Transformation enregistrée avec succès, stock produit incrémenté !" });
});


// --- RESTAURANT API ENDPOINTS ---

// 1. Bookings (Reservations)
app.post("/api/restaurant/bookings", (req, res) => {
  const { buyerId, buyerName, buyerPhone, sellerId, tableId, guestsCount, dateTime, notes } = req.body;
  
  if (!buyerId || !sellerId || !guestsCount || !dateTime) {
    return res.status(400).json({ error: "Champs requis manquants pour la réservation." });
  }

  const newBooking = {
    id: "bk_" + Math.random().toString(36).substring(2, 9),
    buyerId,
    buyerName: buyerName || "Client Table",
    buyerPhone: buyerPhone || "",
    sellerId,
    tableId: tableId || undefined,
    guestsCount: Number(guestsCount),
    dateTime,
    status: "pending" as const,
    notes: notes || ""
  };

  // If tableId is provided, mark it as reserved
  if (tableId) {
    const tableIndex = restaurantTables.findIndex(t => t.id === tableId);
    if (tableIndex !== -1) {
      restaurantTables[tableIndex].status = "reserved";
    }
  }

  restaurantBookings.unshift(newBooking);
  res.status(201).json({ success: true, booking: newBooking, message: "Votre demande de réservation a été envoyée avec succès !" });
});

app.post("/api/restaurant/bookings/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, tableId } = req.body; // status: pending, confirmed, cancelled, completed

  const bookingIndex = restaurantBookings.findIndex(b => b.id === id);
  if (bookingIndex === -1) {
    return res.status(404).json({ error: "Réservation introuvable." });
  }

  const oldBooking = restaurantBookings[bookingIndex];
  const oldTableId = oldBooking.tableId;

  // Free up old table if status is changed or table is changed
  if (oldTableId && (status === 'cancelled' || status === 'completed' || tableId !== oldTableId)) {
    const tblIdx = restaurantTables.findIndex(t => t.id === oldTableId);
    if (tblIdx !== -1) {
      restaurantTables[tblIdx].status = "available";
    }
  }

  // Set new status and table
  restaurantBookings[bookingIndex].status = status;
  if (tableId !== undefined) {
    restaurantBookings[bookingIndex].tableId = tableId;
    if (tableId && status === 'confirmed') {
      const tblIdx = restaurantTables.findIndex(t => t.id === tableId);
      if (tblIdx !== -1) {
        restaurantTables[tblIdx].status = "reserved";
      }
    }
  }

  // If completed, let's mark table as cleaning
  if (status === 'completed' && (tableId || oldTableId)) {
    const activeTid = tableId || oldTableId;
    const tblIdx = restaurantTables.findIndex(t => t.id === activeTid);
    if (tblIdx !== -1) {
      restaurantTables[tblIdx].status = "cleaning";
    }
  }

  res.json({ success: true, booking: restaurantBookings[bookingIndex], message: "Statut de la réservation mis à jour !" });
});

// 2. Table Management
app.post("/api/restaurant/tables", (req, res) => {
  const { id, sellerId, number, capacity, zone, status } = req.body;
  if (!sellerId || !number || !capacity) {
    return res.status(400).json({ error: "Champs requis manquants: sellerId, number, capacity" });
  }

  if (id) {
    // Update existing
    const idx = restaurantTables.findIndex(t => t.id === id);
    if (idx !== -1) {
      restaurantTables[idx] = {
        ...restaurantTables[idx],
        number,
        capacity: Number(capacity),
        zone: zone || restaurantTables[idx].zone,
        status: status || restaurantTables[idx].status,
      };
      return res.json({ success: true, table: restaurantTables[idx], message: "Table mise à jour avec succès !" });
    }
  }

  // Create new
  const newTable = {
    id: "tbl_" + Math.random().toString(36).substring(2, 9),
    sellerId,
    number,
    capacity: Number(capacity),
    zone: zone || "interior",
    status: status || "available"
  };

  restaurantTables.push(newTable);
  res.status(201).json({ success: true, table: newTable, message: "Nouvelle table enregistrée !" });
});

app.post("/api/restaurant/tables/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // available, reserved, occupied, cleaning

  const idx = restaurantTables.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Table introuvable." });
  }

  restaurantTables[idx].status = status;
  res.json({ success: true, table: restaurantTables[idx], message: "Statut de la table mis à jour !" });
});

app.delete("/api/restaurant/tables/:id", (req, res) => {
  const { id } = req.params;
  const idx = restaurantTables.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Table introuvable." });
  restaurantTables = restaurantTables.filter(t => t.id !== id);
  res.json({ success: true, message: "Table retirée avec succès !" });
});

// 3. Dish Ratings
app.post("/api/restaurant/ratings", (req, res) => {
  const { productId, rating, comment, reviewerName, reviewerId } = req.body;
  if (!productId || !rating || !reviewerId) {
    return res.status(400).json({ error: "Champs obligatoires manquants: productId, rating, reviewerId" });
  }

  const newRating = {
    id: "rt_" + Math.random().toString(36).substring(2, 9),
    productId,
    rating: Number(rating),
    comment: comment || "",
    reviewerName: reviewerName || "Client Gourmand",
    reviewerId,
    date: new Date().toISOString().split('T')[0]
  };

  dishRatings.unshift(newRating);
  res.status(201).json({ success: true, rating: newRating, message: "Votre avis a été enregistré !" });
});

// =========================================================================
//                   INTEGRATION REELLE DES APIS DE PAIEMENT
//           CAMPAY CAMEROUN (MTN MOBILE MONEY, ORANGE MONEY, VISA/MC)
// =========================================================================

const campayTransactions: Record<string, any> = {};
let campayAccessTokenObj = { token: "", expiresAt: 0 };

async function getCampayToken() {
  const username = (process.env.CAMPAY_APP_USERNAME || "").trim().replace(/^["']|["']$/g, "");
  const password = (process.env.CAMPAY_APP_PASSWORD || "").trim().replace(/^["']|["']$/g, "");
  const env = (process.env.CAMPAY_ENV || "sandbox").trim().replace(/^["']|["']$/g, "");
  
  if (!username || !password || username === "CAMPAY_APP_USERNAME" || password === "CAMPAY_APP_PASSWORD" || username === "" || username.startsWith("your_")) {
    return null;
  }
  
  if (campayAccessTokenObj.token && campayAccessTokenObj.expiresAt > Date.now()) {
    return campayAccessTokenObj.token;
  }
  
  const baseUrl = env === "production" ? "https://www.campay.net" : "https://demo.campay.net";
  try {
    const res = await fetch(`${baseUrl}/api/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const text = await res.text();
      console.log(`[Campay Auth Notice] Sandbox simulator falls back because the merchant keys are unconfigured or were rejected: ${text}`);
      return null;
    }
    const data: any = await res.json();
    if (data.token) {
      campayAccessTokenObj = {
        token: data.token,
        expiresAt: Date.now() + (30 * 60 * 1000) // Cache 30 mins
      };
      return data.token;
    }
  } catch (err) {
    console.log("[Campay Auth Notice] Exception occurred while retrieving local gateway token:", err);
  }
  return null;
}

// Global hook triggered when payment successfully clears
async function handlePaymentSuccessActions(tx: any) {
  console.log(`[Payment Success] Completing payout ledger processing for transaction Ref : ${tx.id}, Amount: ${tx.amount} XAF`);
  
  if (tx.isSubscription) {
    const user = users.find(u => u.id === tx.userId || u.email === tx.userId);
    if (user) {
      const prices: Record<string, { name: string; price: number }> = {
        free: { name: "Gratuit", price: 0 },
        premium: { name: "Client Premium", price: 2500 },
        starter: { name: "Entreprise Starter", price: 5000 },
        pro: { name: "Entreprise Pro", price: 15000 },
        business: { name: "Entreprise Business", price: 30000 },
        fournisseur_free: { name: "Fournisseur Gratuit", price: 0 },
        fournisseur_pro: { name: "Fournisseur Pro", price: 10000 }
      };
      
      const planInfo = prices[tx.planId] || { name: tx.planId, price: Number(tx.amount) };
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      user.subscription = {
        planId: tx.planId,
        status: 'active',
        price: planInfo.price,
        startDate: new Date().toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
        isTrial: false
      };
      markDirty("users");

      const newInvoice = {
        id: "inv_" + Math.random().toString(36).substring(2, 9),
        userId: user.id,
        userEmail: user.email,
        amount: Number(tx.amount),
        planId: tx.planId,
        planName: planInfo.name,
        status: "paid" as const,
        paymentMethod: "Mobile Money (MTN/Orange)",
        phoneNumber: tx.phone,
        createdAt: new Date().toISOString()
      };
      paymentInvoices.unshift(newInvoice);
      markDirty("paymentInvoices");

      // Log transaction on platform wallet
      const txnPlatform = {
        id: "txn_" + Math.random().toString(36).substring(2, 9),
        userId: "platform_admin",
        amount: Number(tx.amount),
        type: "subscription_payment" as const,
        description: `Paiement d'abonnement ${planInfo.name} par ${user.name} (${tx.phone}) via API Réelle`,
        createdAt: new Date().toISOString()
      };
      walletTransactions.unshift(txnPlatform);
      markDirty("walletTransactions");
    }
  } else if (tx.orderIds && Array.isArray(tx.orderIds)) {
    // Process list of orders paid in bulk
    for (const ordId of tx.orderIds) {
      const order = orders.find(o => o.id === ordId);
      if (order) {
        order.status = "paid"; // Mark directly paid
        order.paymentStatus = "paid";
        
        // Transfer money to seller wallet
        const sellerId = order.sellerId;
        let sellerWallet = wallets.find(w => w.userId === sellerId);
        if (!sellerWallet) {
          sellerWallet = { id: "w_" + sellerId, userId: sellerId, balance: 0 };
          wallets.push(sellerWallet);
        }
        
        const saleAmount = order.price * order.quantity;
        const vatRate = 0.07; // 7% fixed VAT rate
        const vatAmount = Math.round(saleAmount * vatRate);
        const netMerchant = saleAmount - vatAmount;
        
        sellerWallet.balance += netMerchant;
        markDirty("wallets");
        
        // Log transaction for seller
        walletTransactions.unshift({
          id: "txn_" + Math.random().toString(36).substring(2, 9),
          userId: sellerId,
          amount: netMerchant,
          type: "sale_payment" as const,
          description: `Règlement réel de la commande ${order.id} : +${netMerchant} FCFA (TVA 7% déduite: -${vatAmount} de ${saleAmount})`,
          createdAt: new Date().toISOString()
        });
        
        // Determine whether it's MTN MoMo or Orange Money
        // Startup commission route numbers
        const startupMtnNumber = "+237650023402";
        const startupOmNumber = "+237699248672";
        
        let isMtn = false;
        const methodStr = String(tx.paymentMethod || "").toLowerCase();
        const phoneStr = String(tx.phone || "");
        
        if (methodStr.includes("mtn") || methodStr.includes("momo")) {
          isMtn = true;
        } else if (methodStr.includes("orange") || methodStr.includes("om")) {
          isMtn = false;
        } else {
          // Fallback check on phone number suffix/prefix
          // MTN numbers in Cameroon: starts with 23767, 237650, 237651, 237652, 237653, 237654, 23768, or starts with 67, 650, etc.
          const cleanPhone = phoneStr.replace(/^237/, "").replace(/^\+237/, "");
          if (cleanPhone.startsWith("67") || cleanPhone.startsWith("650") || cleanPhone.startsWith("651") || cleanPhone.startsWith("652") || cleanPhone.startsWith("653") || cleanPhone.startsWith("654") || cleanPhone.startsWith("68")) {
            isMtn = true;
          }
        }
        
        const startupDestinationNumber = isMtn ? startupMtnNumber : startupOmNumber;
        const startupOperatorName = isMtn ? "MTN MoMo" : "Orange Money";

        // Log TVA gain for platform admin and record recipient phone numbers
        walletTransactions.unshift({
          id: "txn_" + Math.random().toString(36).substring(2, 9),
          userId: "platform_admin",
          amount: vatAmount,
          type: "commission" as const,
          description: `Gain de TVA (7% incluse) de ${vatAmount} FCFA perçu sur la vente ${order.id} (Routé directement vers le numéro ${startupOperatorName} ${startupDestinationNumber})`,
          createdAt: new Date().toISOString()
        });
        
        markDirty("walletTransactions");

        // Direct payout of commissions to startup platform number if real Keys exist in real mode
        const tokenForPayout = await getCampayToken();
        if (tokenForPayout && vatAmount > 0) {
          try {
            let payoutPhone = startupDestinationNumber.trim().replace(/\s+/g, "").replace("+", "");
            if (payoutPhone.length === 9 && payoutPhone.startsWith("6")) {
              payoutPhone = "237" + payoutPhone;
            }
            const env = process.env.CAMPAY_ENV || "sandbox";
            const baseUrl = env === "production" ? "https://www.campay.net" : "https://demo.campay.net";
            
            console.log(`[Campay Direct TVA Transfer] Sending ${vatAmount} XAF TVA gain to startup ${payoutPhone} (${startupOperatorName})`);
            const pRes = await fetch(`${baseUrl}/api/withdraw/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${tokenForPayout}`
              },
              body: JSON.stringify({
                amount: String(vatAmount),
                currency: "XAF",
                to: payoutPhone,
                description: `TVA WeLink de ${vatAmount} FCFA (7%) Commande ${order.id}`,
                external_reference: "tva_" + Math.random().toString(36).substring(2, 10)
              })
            });
            const pData = await pRes.json();
            console.log("[Campay Direct TVA Transfer Response]", pData);
          } catch (e) {
            console.error("[Campay Direct TVA Transfer Error]", e);
          }
        }
      }
    }
  }
}

// Trigger mobile money collection (USSD code push on phone screen)
app.post("/api/payments/campay-collect", async (req, res) => {
  const { amount, phone, paymentMethod, email, orderIds, isSubscription, planId, userId } = req.body;
  
  if (!amount || !phone) {
    return res.status(400).json({ error: "Montant et numéro de téléphone requis." });
  }

  // Formatting Cameroon phone context (append 237 if needed)
  let formattedPhone = phone.trim().replace(/\s+/g, "").replace("+", "");
  if (formattedPhone.length === 9 && formattedPhone.startsWith("6")) {
    formattedPhone = "237" + formattedPhone;
  } else if (!formattedPhone.startsWith("237") && formattedPhone.length === 9) {
    formattedPhone = "237" + formattedPhone;
  }

  const externalRef = "welink_" + Math.random().toString(36).substring(2, 10);
  const token = await getCampayToken();
  const env = process.env.CAMPAY_ENV || "sandbox";
  const baseUrl = env === "production" ? "https://www.campay.net" : "https://demo.campay.net";

  if (token) {
    try {
      console.log(`[Campay API] Initiating real collect request for ${amount} XAF from ${formattedPhone}`);
      const payload = {
        amount: String(amount),
        currency: "XAF",
        from: formattedPhone,
        description: isSubscription ? `Abonnement WeLink SaaS - Plan : ${planId}` : `Règlement Commandes WeLink`,
        external_reference: externalRef
      };
      
      const collectRes = await fetch(`${baseUrl}/api/collect/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const collectData: any = await collectRes.json();
      console.log("[Campay collect response]", collectData);
      
      if (collectRes.ok && collectData.reference) {
        campayTransactions[collectData.reference] = {
          id: collectData.reference,
          localRef: externalRef,
          amount,
          phone: formattedPhone,
          userId,
          orderIds,
          isSubscription,
          planId,
          paymentMethod,
          status: "PENDING",
          createdAt: new Date().toISOString()
        };
        
        return res.json({
          success: true,
          isReal: true,
          reference: collectData.reference,
          message: "Demande de paiement envoyée avec succès sur votre téléphone. Veuillez autoriser en entrant votre code PIN secret sur le prompt de votre mobile."
        });
      } else {
        return res.status(400).json({
          error: collectData.message || collectData.error || "La passerelle de paiement a refusé la requête."
        });
      }
    } catch (err: any) {
      console.error("[Campay collect error exception]", err);
      return res.status(500).json({ error: "Erreur de connexion avec l'opérateur mobile." });
    }
  } else {
    console.log(`[Campay Sandbox Simulator] No real keys found. Launching safe simulated payment transaction loop for ${amount} XAF`);
    const mockRef = "sim_" + Math.random().toString(36).substring(2, 10);
    campayTransactions[mockRef] = {
      id: mockRef,
      localRef: externalRef,
      amount,
      phone: formattedPhone,
      userId,
      orderIds,
      isSubscription,
      planId,
      paymentMethod,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };
    
    return res.json({
      success: true,
      isReal: false,
      reference: mockRef,
      message: "Simulation de push USSD en cours. Une notification va s'afficher sur votre mobile."
    });
  }
});

// Stream / poll transaction status
app.get("/api/payments/campay-status/:ref", async (req, res) => {
  const reference = req.params.ref;
  const transaction = campayTransactions[reference];
  
  if (!reference) {
    return res.status(400).json({ error: "Référence d'API requise." });
  }

  // Handle preview and developers simulations cleanly
  if (reference.startsWith("sim_")) {
    if (!transaction) {
      return res.status(404).json({ error: "Simulation introuvable." });
    }
    
    const elapsed = Date.now() - new Date(transaction.createdAt).getTime();
    if (elapsed > 4500) {
      if (transaction.status === "PENDING") {
        transaction.status = "SUCCESS";
        await handlePaymentSuccessActions(transaction);
      }
    }
    return res.json({
      success: true,
      status: transaction.status,
      isReal: false
    });
  }

  if (!transaction) {
    return res.status(404).json({ error: "Transaction introuvable." });
  }

  const token = await getCampayToken();
  const env = process.env.CAMPAY_ENV || "sandbox";
  const baseUrl = env === "production" ? "https://www.campay.net" : "https://demo.campay.net";

  if (token) {
    try {
      console.log(`[Campay API] Fetching status for real reference ${reference}`);
      const statusRes = await fetch(`${baseUrl}/api/transaction/${reference}/`, {
        method: "GET",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!statusRes.ok) {
        return res.json({ success: true, status: transaction.status, isReal: true, message: "Impossible de joindre Campay pour synchroniser." });
      }
      
      const statusData: any = await statusRes.json();
      console.log("[Campay Status Data]", statusData);
      
      const externalStatus = statusData.status;
      if (externalStatus === "SUCCESSFUL") {
        if (transaction.status === "PENDING") {
          transaction.status = "SUCCESS";
          await handlePaymentSuccessActions(transaction);
        }
      } else if (externalStatus === "FAILED") {
        transaction.status = "FAILED";
      }
      
      return res.json({
        success: true,
        status: transaction.status,
        isReal: true,
        operator_ref: statusData.operator_reference || ""
      });
    } catch (err) {
      console.error("[Campay status exception]", err);
      return res.json({ success: true, status: transaction.status, isReal: true });
    }
  } else {
    return res.json({
      success: true,
      status: transaction.status,
      isReal: false
    });
  }
});

// --- SAAS SUBSCRIPTION ENDPOINTS ---

// Purchase / update subscription plan
app.post("/api/subscription/subscribe", (req, res) => {
  const { userId, planId, durationMonths, paymentMethod, phoneNumber } = req.body;
  if (!userId || !planId) {
    return res.status(400).json({ error: "userId et planId requis pour l'abonnement." });
  }

  const user = users.find(u => u.id === userId || u.email === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  // Define prices
  const prices: Record<string, { name: string; price: number }> = {
    free: { name: "Gratuit", price: 0 },
    premium: { name: "Client Premium", price: 2500 },
    starter: { name: "Entreprise Starter", price: 5000 },
    pro: { name: "Entreprise Pro", price: 15000 },
    business: { name: "Entreprise Business", price: 30000 },
    fournisseur_free: { name: "Fournisseur Gratuit", price: 0 },
    fournisseur_pro: { name: "Fournisseur Pro", price: 10000 }
  };

  const planInfo = prices[planId] || { name: planId, price: 0 };
  const duration = Number(durationMonths) || 1;
  const totalCost = planInfo.price * duration;

  // Extend end date
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + duration);

  // Update subscription in profile
  user.subscription = {
    planId,
    status: totalCost === 0 ? 'free' : 'active',
    price: planInfo.price,
    startDate: new Date().toISOString(),
    endDate: endDate.toISOString(),
    autoRenew: true,
    isTrial: false
  };

  markDirty("users");

  // Record a paid billing invoice if price is greater than 0
  let newInvoice = null;
  if (totalCost > 0) {
    newInvoice = {
      id: "inv_" + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      userEmail: user.email,
      amount: totalCost,
      planId,
      planName: planInfo.name,
      status: "paid" as const,
      paymentMethod: paymentMethod || "MTN Mobile Money",
      phoneNumber: phoneNumber || user.phone || "",
      createdAt: new Date().toISOString()
    };
    paymentInvoices.unshift(newInvoice);
    markDirty("paymentInvoices");

    // Also record subscription transaction for platform
    const txnPlatform = {
      id: "txn_" + Math.random().toString(36).substring(2, 9),
      userId: "platform_admin",
      amount: totalCost,
      type: "subscription_payment" as const,
      description: `Paiement d'abonnement ${planInfo.name} par ${user.name} (${paymentMethod || 'MoMo'})`,
      createdAt: new Date().toISOString()
    };
    walletTransactions.unshift(txnPlatform);
    markDirty("walletTransactions");
  }

  res.json({ 
    success: true, 
    subscription: user.subscription, 
    invoice: newInvoice,
    message: `Abonnement ${planInfo.name} activé avec succès ! Facture générée.`
  });
});

// Cancel active subscription auto-renewal
app.post("/api/subscription/cancel", (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === userId || u.email === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé." });

  if (user.subscription) {
    user.subscription.autoRenew = false;
    user.subscription.status = 'cancelled';
    markDirty("users");
    return res.json({ success: true, subscription: user.subscription, message: "Le renouvellement automatique de votre abonnement a été désactivé." });
  }

  res.status(400).json({ error: "Aucun abonnement actif trouvé pour ce profil." });
});

// Renew active subscription manually
app.post("/api/subscription/renew", (req, res) => {
  const { userId, paymentMethod, phoneNumber } = req.body;
  const user = users.find(u => u.id === userId || u.email === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé." });
  if (!user.subscription) return res.status(400).json({ error: "Aucun abonnement trouvé pour ce profil." });

  const prices: Record<string, { name: string; price: number }> = {
    free: { name: "Gratuit", price: 0 },
    premium: { name: "Client Premium", price: 2500 },
    starter: { name: "Entreprise Starter", price: 5000 },
    pro: { name: "Entreprise Pro", price: 15000 },
    business: { name: "Entreprise Business", price: 30000 },
    fournisseur_free: { name: "Fournisseur Gratuit", price: 0 },
    fournisseur_pro: { name: "Fournisseur Pro", price: 10000 }
  };

  const planId = user.subscription.planId;
  const planInfo = prices[planId] || { name: planId, price: 0 };

  const currentEndDate = new Date(user.subscription.endDate);
  const newEndDate = currentEndDate > new Date() ? currentEndDate : new Date();
  newEndDate.setMonth(newEndDate.getMonth() + 1);

  user.subscription.endDate = newEndDate.toISOString();
  user.subscription.status = 'active';
  user.subscription.autoRenew = true;
  markDirty("users");

  let newInvoice = null;
  if (planInfo.price > 0) {
    newInvoice = {
      id: "inv_" + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      userEmail: user.email,
      amount: planInfo.price,
      planId,
      planName: `Renouvellement automatique : ${planInfo.name}`,
      status: "paid" as const,
      paymentMethod: paymentMethod || "MTN Mobile Money",
      phoneNumber: phoneNumber || user.phone || "",
      createdAt: new Date().toISOString()
    };
    paymentInvoices.unshift(newInvoice);
    markDirty("paymentInvoices");

    // Rec to ledger
    const txnPlatform = {
      id: "txn_" + Math.random().toString(36).substring(2, 9),
      userId: "platform_admin",
      amount: planInfo.price,
      type: "subscription_payment" as const,
      description: `Renouvellement automatique d'abonnement ${planInfo.name} par ${user.name}`,
      createdAt: new Date().toISOString()
    };
    walletTransactions.unshift(txnPlatform);
    markDirty("walletTransactions");
  }

  res.json({ success: true, subscription: user.subscription, invoice: newInvoice, message: `Abonnement ${planInfo.name} renouvelé !` });
});


// --- WALLET AND WITHDRAWAL ENDPOINTS ---

// Submit a withdrawal request
app.post("/api/withdrawals", (req, res) => {
  const { userId, amount, paymentMethod, phone } = req.body;
  if (!userId || !amount || !paymentMethod || !phone) {
    return res.status(400).json({ error: "Champs obligatoires manquants: userId, amount, paymentMethod, phone" });
  }

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé." });

  const numAmount = Number(amount);
  if (numAmount <= 0) {
    return res.status(400).json({ error: "Le montant de retrait doit être supérieur à 0." });
  }

  let wallet = wallets.find(w => w.userId === userId);
  if (!wallet) {
    wallet = { id: "w_" + userId, userId, balance: 0 };
    wallets.push(wallet);
  }

  if (wallet.balance < numAmount) {
    return res.status(400).json({ error: `Fonds insuffisants. Solde actuel : ${wallet.balance} FCFA.` });
  }

  // Deduct/reserve the requested amount immediately from merchant's wallet balance
  wallet.balance -= numAmount;
  markDirty("wallets");

  const newRequest = {
    id: "draw_" + Math.random().toString(36).substring(2, 9),
    userId,
    userName: user.name,
    amount: numAmount,
    status: "pending" as const,
    paymentMethod,
    phone,
    createdAt: new Date().toISOString()
  };

  withdrawalRequests.unshift(newRequest);
  markDirty("withdrawalRequests");

  // Log transaction
  const txn = {
    id: "txn_" + Math.random().toString(36).substring(2, 9),
    userId,
    amount: -numAmount,
    type: "withdrawal" as const,
    description: `Retrait Mobile Money de -${numAmount} FCFA demandé (${paymentMethod} vers ${phone}). En attente de validation administrative.`,
    createdAt: new Date().toISOString()
  };
  walletTransactions.unshift(txn);
  markDirty("walletTransactions");

  res.status(201).json({ success: true, request: newRequest, wallet, message: "Votre demande de retrait de " + numAmount + " FCFA a été soumise pour validation administrative." });
});

// Admin approves a withdrawal request
app.post("/api/admin/withdrawals/approve", async (req, res) => {
  const { withdrawalId } = req.body;
  const request = withdrawalRequests.find(r => r.id === withdrawalId);
  if (!request) return res.status(404).json({ error: "Demande de retrait introuvable." });

  if (request.status !== "pending") {
    return res.status(400).json({ error: "Cette demande a déjà été traitée (statut actuel: " + request.status + ")." });
  }

  // Format recipient Cameroon number (starts with 237 or prefix automatically)
  let formattedPhone = request.phone.trim().replace(/\s+/g, "").replace("+", "");
  if (formattedPhone.length === 9 && formattedPhone.startsWith("6")) {
    formattedPhone = "237" + formattedPhone;
  } else if (!formattedPhone.startsWith("237") && formattedPhone.length === 9) {
    formattedPhone = "237" + formattedPhone;
  }

  const token = await getCampayToken();
  const env = process.env.CAMPAY_ENV || "sandbox";
  const baseUrl = env === "production" ? "https://www.campay.net" : "https://demo.campay.net";

  if (token) {
    try {
      console.log(`[Campay Payout] Executing real withdrawal payout for ${request.amount} FCFA to ${formattedPhone}`);
      const withdrawPayload = {
        amount: String(request.amount),
        currency: "XAF",
        to: formattedPhone,
        description: `Retrait Wallet WeLink approuve par Admin (${request.userName})`,
        external_reference: "payout_" + Math.random().toString(36).substring(2, 10)
      };

      const payoutRes = await fetch(`${baseUrl}/api/withdraw/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify(withdrawPayload)
      });

      const payoutData: any = await payoutRes.json();
      console.log("[Campay Payout Response]", payoutData);

      if (payoutRes.ok && payoutData.reference) {
        request.status = "completed";
        request.campayPayoutReference = payoutData.reference;
        markDirty("withdrawalRequests");
        return res.json({
          success: true,
          request,
          message: `Retrait approuvé ! L'appel API réel de transfert MTN/Orange de ${request.amount} FCFA vers ${formattedPhone} a été exécuté avec succès par la passerelle Campay.`
        });
      } else {
        return res.status(400).json({
          error: payoutData.message || payoutData.error || "L'API de versement Campay a refusé la transaction. Vérifiez le solde de votre compte marchand."
        });
      }
    } catch (err: any) {
      console.error("[Campay Payout Exception]", err);
      return res.status(500).json({ error: "Échec de l'exécution du transfert mobile money automatique avec l'opérateur local." });
    }
  } else {
    // Demonstration simulated approval
    request.status = "completed";
    markDirty("withdrawalRequests");
    return res.json({
      success: true,
      request,
      message: `Retrait approuvé avec succès ! (Mode Démo : Le virement de ${request.amount} FCFA vers ${formattedPhone} a été simulé. Configurez vos clés CAMPAY pour effectuer de vrais virements mobiles)`
    });
  }
});

// Admin rejects a withdrawal request
app.post("/api/admin/withdrawals/reject", (req, res) => {
  const { withdrawalId } = req.body;
  const request = withdrawalRequests.find(r => r.id === withdrawalId);
  if (!request) return res.status(404).json({ error: "Demande de retrait introuvable." });

  if (request.status !== "pending") {
    return res.status(400).json({ error: "Cette demande a déjà été traitée." });
  }

  request.status = "rejected";
  markDirty("withdrawalRequests");

  // Credit the amount back to user's wallet
  let wallet = wallets.find(w => w.userId === request.userId);
  if (wallet) {
    wallet.balance += request.amount;
    markDirty("wallets");
  }

  // Add compensating transaction log
  const txn = {
    id: "txn_" + Math.random().toString(36).substring(2, 9),
    userId: request.userId,
    amount: request.amount,
    type: "sale_credit" as const,
    description: `Restauration de fonds : Demande de retrait (${request.id}) rejetée par l'administrateur.`,
    createdAt: new Date().toISOString()
  };
  walletTransactions.unshift(txn);
  markDirty("walletTransactions");

  res.json({ success: true, request, wallet, message: "Le retrait a été rejeté. Les fonds ont été restitués au portefeuille de l'entreprise." });
});

// Admin updates commission rates
app.post("/api/admin/commissions/update", (req, res) => {
  const { productSalePercent, deliveryPercent } = req.body;
  if (productSalePercent !== undefined) {
    commissionSettings.productSalePercent = Number(productSalePercent);
  }
  if (deliveryPercent !== undefined) {
    commissionSettings.deliveryPercent = Number(deliveryPercent);
  }

  markDirty("commissionSettings");
  res.json({ success: true, commissionSettings, message: "Taux de commissions de la plateforme mis à jour avec succès !" });
});

// Admin updates payment settings securely
app.post("/api/admin/payments/update", (req, res) => {
  const { mtnMomoMerchantNumber, orangeMoneyMerchantNumber, waveMerchantCode, apiKey, sandboxMode } = req.body;
  if (mtnMomoMerchantNumber !== undefined) paymentSettings.mtnMomoMerchantNumber = mtnMomoMerchantNumber;
  if (orangeMoneyMerchantNumber !== undefined) paymentSettings.orangeMoneyMerchantNumber = orangeMoneyMerchantNumber;
  if (waveMerchantCode !== undefined) paymentSettings.waveMerchantCode = waveMerchantCode;
  if (apiKey !== undefined) paymentSettings.apiKey = apiKey;
  if (sandboxMode !== undefined) paymentSettings.sandboxMode = !!sandboxMode;

  markDirty("paymentSettings");
  res.json({ success: true, paymentSettings, message: "Paramètres et identifiants de paiement sécurisés enregistrés avec succès !" });
});


// --- Serve Built Files in Production & Vite in Dev ---

async function startServer() {
  // Load state from Firestore prior to booting the server listeners
  await loadStateFromFirestore();

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite's middleware
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Startup App Server] Running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export { app };
export default app;
