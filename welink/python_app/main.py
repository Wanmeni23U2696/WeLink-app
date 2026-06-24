import os
import uuid
import math
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from . import models

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WeLink API",
    description="Backend Python / FastAPI équivalent au serveur Node de l'application",
    version="1.0.0"
)

# Enable CORS for frontend connection (port 3000 by default or production domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Initial Seed Data ---
def seed_database(db: Session):
    if db.query(models.User).count() == 0:
        initial_users = [
            models.User(id="c1", email="client1@email.com", name="Jean Dupont", profileType="client", description="Je cherche des produits frais et locaux.", address="Paris, France", phone="+33 6 12345678"),
            models.User(id="c2", email="client2@email.com", name="Marie Koné", profileType="client", description="Je cherche de l'artisanat et des opportunités d'emploi.", address="Abidjan, Côte d'Ivoire", phone="+225 07 483920"),
            models.User(id="e1", email="super@prestige.com", name="Prestige Market", profileType="entreprise", enterpriseType="supermarche", description="Supermarché haut de gamme offrant des produits locaux et importés.", address="Abidjan, Zone 4", phone="+225 21 001122"),
            models.User(id="e2", email="marie@resto.com", name="Chez Marie l'Africaine", profileType="entreprise", enterpriseType="restaurant", description="Restaurant traditionnel africain et européen de qualité.", address="Dakar, Plateau", phone="+221 33 821 2233"),
            models.User(id="e3", email="hotel@royal.com", name="Hôtel Royal Résidence", profileType="entreprise", enterpriseType="hotel", description="Hôtel 4 étoiles avec service navette, piscine et restaurant.", address="Bamako, Mali", phone="+223 20 221133"),
            models.User(id="e4", email="doc@pro.com", name="Pro-Doc Services", profileType="entreprise", enterpriseType="secretariat", description="Services administratifs, reliure thermique, traduction et photocopie.", address="Lomé, Togo", phone="+228 22 214578"),
            models.User(id="e5", email="marche@panier.com", name="Le Panier Frais", profileType="entreprise", enterpriseType="marche", description="Marché couvert de quartier vendant des fruits et légumes bio.", address="Yaoundé, Cameroun", phone="+237 222 301234"),
            models.User(id="s1", email="ferme@bio.com", name="Gérard l'Agriculteur", profileType="fournisseur", supplierType="agriculteur", description="Producteur de fruits, tubercules et légumes de saison biologiques.", address="Sud-Sassandra, Côte d'Ivoire", phone="+225 01 020304"),
            models.User(id="s2", email="bois@artisan.com", name="Koffi l'Artisan du Bois", profileType="fournisseur", supplierType="artisan", description="Sculpteur traditionnel, création d'ustensiles de cuisine et mobilier.", address="Abengourou, Côte d'Ivoire", phone="+225 05 080910"),
            models.User(id="s3", email="elevage@savane.com", name="La Ferme des Savanes", profileType="fournisseur", supplierType="eleveur", description="Élevage responsable de volailles de brousse, chèvres et lapins.", address="Bouaké, Côte d'Ivoire", phone="+225 07 090909")
        ]
        db.add_all(initial_users)
        db.commit()

    if db.query(models.Product).count() == 0:
        initial_products = [
            models.Product(id="p1", sellerId="e1", sellerName="Prestige Market", sellerType="entreprise", title="Lait entier premium", description="Lait entier pasteurisé de qualité supérieure.", price=1200, category="Alimentation", stock=150, unit="brique 1L"),
            models.Product(id="p2", sellerId="e1", sellerName="Prestige Market", sellerType="entreprise", title="Lessive liquide Éco+", description="Lessive écologique parfum lavande très efficace.", price=4500, category="Entretien", stock=40, unit="bidon 3L"),
            models.Product(id="p3", sellerId="e2", sellerName="Chez Marie l'Africaine", sellerType="entreprise", title="Plat de Tiep bou dienn", description="Riz au poisson traditionnel sénégalais avec légumes frais marinés.", price=3500, category="Repas", stock=100, unit="portion"),
            models.Product(id="p4", sellerId="e2", sellerName="Chez Marie l'Africaine", sellerType="entreprise", title="Plat d'Attiéké au poisson braisé", description="Semoule de manioc accompagnée d'un poisson braisé et de sauce pimentée.", price=4000, category="Repas", stock=80, unit="portion"),
            models.Product(id="p5", sellerId="e3", sellerName="Hôtel Royal Résidence", sellerType="entreprise", title="Nuitée Chambre Standard", description="Chambre climatisée confortable, Wifi haut débit et petit déjeuner inclus.", price=45000, category="Hébergement", stock=15, unit="nuitée"),
            models.Product(id="p6", sellerId="e4", sellerName="Pro-Doc Services", sellerType="entreprise", title="Saisie de rapport + reliure", description="Saisie et mise en page professionnelle avec couverture transparente et dos plastique.", price=5000, category="Bureautique", stock=50, unit="dossier"),
            models.Product(id="p7", sellerId="e5", sellerName="Le Panier Frais", sellerType="entreprise", title="Tomates fraîches locales", description="Tomates rouges et fermes récoltées le matin même.", price=800, category="Légumes", stock=200, unit="kg"),
            models.Product(id="p8", sellerId="s1", sellerName="Gérard l'Agriculteur", sellerType="fournisseur", title="Sac de Manioc Frais", description="Manioc de table de variété améliorée, riche en amidon.", price=15000, category="Tubercule", stock=30, unit="sac 50kg"),
            models.Product(id="p9", sellerId="s3", sellerName="La Ferme des Savanes", sellerType="fournisseur", title="Volailles - Poulet bicyclette local", description="Poulet fermier élevé en plein air de façon responsable.", price=3500, category="Élevage", stock=120, unit="tête"),
            models.Product(id="p10", sellerId="s2", sellerName="Koffi l'Artisan du Bois", sellerType="fournisseur", title="Mortier en bois d'Iroko", description="Mortier traditionnel sculpté à la main, durable et lourd.", price=12000, category="Artisanat", stock=10, unit="colis")
        ]
        db.add_all(initial_products)
        db.commit()

    if db.query(models.JobOffer).count() == 0:
        initial_jobs = [
            models.JobOffer(id="j1", companyId="e1", companyName="Prestige Market", companyType="supermarche", title="Caissier comptoir principal", description="Gérer la caisse enregistreuse principale et accueillir les clients.", salary="150 000 FCFA / mois", location="Abidjan, Zone 4", requirements="Avoir une première expérience en caisse, rigueur et réactivité."),
            models.JobOffer(id="j2", companyId="e2", companyName="Chez Marie l'Africaine", companyType="restaurant", title="Aide de Cuisine / Plongeur", description="Assister le chef cuisinier dans la préparation des marinades et s'occuper de la propreté de la vaisselle.", salary="80 000 FCFA / mois", location="Dakar, Plateau", requirements="Amour de la cuisine locale, rapidité d'exécution et hygiène irréprochable.")
        ]
        db.add_all(initial_jobs)
        db.commit()

    if db.query(models.Order).count() == 0:
        initial_orders = [
            models.Order(id="o1", buyerId="e1", buyerName="Prestige Market", sellerId="s3", sellerName="La Ferme des Savanes", productId="p9", productTitle="Volailles - Poulet bicyclette local", price=3500, quantity=10, status="pending", createdAt="2026-05-28T10:00:00Z"),
            models.Order(id="o2", buyerId="e2", buyerName="Chez Marie l'Africaine", sellerId="s1", sellerName="Gérard l'Agriculteur", productId="p8", productTitle="Sac de Manioc Frais", price=15000, quantity=2, status="accepted", createdAt="2026-05-28T14:30:00Z")
        ]
        db.add_all(initial_orders)
        db.commit()

    if db.query(models.Vente).count() == 0:
        v1 = models.Vente(id="v1", entreprise_id="e1", age="18-25", sexe="Femme", total=2400, date_vente="2026-05-28T09:12:00Z")
        v1_items = [models.VenteItem(id="vi1", vente_id="v1", rayon="Alimentation", produit="Lait entier premium", quantite=2, prix_unitaire=1200, total=2400)]
        
        v2 = models.Vente(id="v2", entreprise_id="e1", age="26-39", sexe="Homme", total=10200, date_vente="2026-05-28T11:45:00Z")
        v2_items = [
            models.VenteItem(id="vi2", vente_id="v2", rayon="Alimentation", produit="Lait entier premium", quantite=3, prix_unitaire=1200, total=3600),
            models.VenteItem(id="vi3", vente_id="v2", rayon="Entretien", produit="Lessive liquide Éco+", quantite=1, prix_unitaire=4500, total=4500),
            models.VenteItem(id="vi4", vente_id="v2", rayon="Légumes", produit="Tomates fraîches locales", quantite=2, prix_unitaire=800, total=1600)
        ]
        
        v3 = models.Vente(id="v3", entreprise_id="e1", age="40-55", sexe="Femme", total=8000, date_vente="2026-05-29T08:30:00Z")
        v3_items = [models.VenteItem(id="vi5", vente_id="v3", rayon="Légumes", produit="Tomates fraîches locales", quantite=10, prix_unitaire=800, total=8000)]

        v4 = models.Vente(id="v4", entreprise_id="e1", age="26-39", sexe="Femme", total=12200, date_vente="2026-05-29T10:15:00Z")
        v4_items = [
            models.VenteItem(id="vi6", vente_id="v4", rayon="Alimentation", produit="Lait entier premium", quantite=1, prix_unitaire=1200, total=1200),
            models.VenteItem(id="vi7", vente_id="v4", rayon="Entretien", produit="Lessive liquide Éco+", quantite=2, prix_unitaire=4500, total=9000),
            models.VenteItem(id="vi8", vente_id="v4", rayon="Légumes", produit="Tomates fraîches locales", quantite=2, prix_unitaire=800, total=1600)
        ]

        v5 = models.Vente(id="v5", entreprise_id="e2", age="18-25", sexe="Homme", total=7500, date_vente="2026-05-28T13:20:00Z")
        v5_items = [
            models.VenteItem(id="vi9", vente_id="v5", rayon="Repas", produit="Plat de Tiep bou dienn", quantite=1, prix_unitaire=3500, total=3500),
            models.VenteItem(id="vi10", vente_id="v5", rayon="Repas", produit="Plat d'Attiéké au poisson braisé", quantite=1, prix_unitaire=4000, total=4000)
        ]

        v6 = models.Vente(id="v6", entreprise_id="e2", age="26-39", sexe="Femme", total=8000, date_vente="2026-05-28T19:40:00Z")
        v6_items = [models.VenteItem(id="vi11", vente_id="v6", rayon="Repas", produit="Plat d'Attiéké au poisson braisé", quantite=2, prix_unitaire=4000, total=8000)]

        v7 = models.Vente(id="v7", entreprise_id="e2", age="55+", sexe="Homme", total=3500, date_vente="2026-05-29T12:00:00Z")
        v7_items = [models.VenteItem(id="vi12", vente_id="v7", rayon="Repas", produit="Plat de Tiep bou dienn", quantite=1, prix_unitaire=3500, total=3500)]

        db.add_all([v1, v2, v3, v4, v5, v6, v7])
        db.add_all(v1_items + v2_items + v3_items + v4_items + v5_items + v6_items + v7_items)
        db.commit()


# --- Pydantic Schemas for Requests ---
class UserRegister(BaseModel):
    name: str
    email: str
    profileType: str
    enterpriseType: Optional[str] = None
    supplierType: Optional[str] = None
    description: Optional[str] = ""
    address: Optional[str] = ""
    phone: Optional[str] = ""

class UserLogin(BaseModel):
    email: str

class ProductCreate(BaseModel):
    sellerId: str
    title: str
    description: Optional[str] = ""
    price: float
    category: str
    imageUrl: Optional[str] = None
    stock: int
    unit: str

class JobOfferCreate(BaseModel):
    companyId: str
    title: str
    description: str
    salary: str
    location: str
    requirements: List[str]

class OrderCreate(BaseModel):
    buyerId: str
    productId: str
    quantity: int

class OrderStatusUpdate(BaseModel):
    status: str

class VenteItemRequest(BaseModel):
    produit: str
    quantite: int

class VenteRequest(BaseModel):
    entreprise_id: str
    age: str
    sexe: str
    items: List[VenteItemRequest]

class RecommendRequest(BaseModel):
    entreprise_id: str
    age: str
    sexe: str
    panier: Optional[List[str]] = []


# --- Demography & AI Predictive Recommendation Helpers ---
AGE_MAPPING = {
    "12-18": 15,
    "18-25": 22,
    "19-25": 22,
    "26-39": 32,
    "40-55": 47,
    "55+": 60
}

def get_age_value(age: str) -> int:
    return AGE_MAPPING.get(age, 32)

def recommend_products(local_ventes: List[models.Vente], target_age: str, target_sexe: str):
    target_age_val = get_age_value(target_age)
    scores = {}

    for v in local_ventes:
        v_age_val = get_age_value(v.age)
        age_diff = abs(target_age_val - v_age_val)
        sexe_match = 1.0 if v.sexe == target_sexe else 0.0
        similarity = (1 / (1 + age_diff)) + sexe_match

        for item in v.items:
            scores[item.produit] = scores.get(item.produit, 0) + similarity * item.quantite

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [{"produit": name, "score": float(score)} for name, score in sorted_scores[:5]]

def recommend_advanced(local_ventes: List[models.Vente], current_basket: List[str], target_age: str, target_sexe: str):
    if not current_basket:
        return []
        
    target_age_val = get_age_value(target_age)
    scores = {}

    for v in local_ventes:
        past_product_names = [item.produit for item in v.items]
        shares_item = any(p in current_basket for p in past_product_names)

        if shares_item:
            v_age_val = get_age_value(v.age)
            age_diff = abs(target_age_val - v_age_val)
            sexe_match = 1.0 if v.sexe == target_sexe else 0.0
            profil_score = (1 / (1 + age_diff)) + sexe_match

            for item in v.items:
                if item.produit not in current_basket:
                    scores[item.produit] = scores.get(item.produit, 0) + profil_score * item.quantite

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [{"produit": name, "score": float(score)} for name, score in sorted_scores[:5]]

def compute_rayon_prediction(local_ventes: List[models.Vente], target_age: str, target_sexe: str):
    age_val = get_age_value(target_age)
    sexe_val = 1 if target_sexe == "Homme" else 0
    scores_per_rayon = {}

    for v in local_ventes:
        v_age_val = get_age_value(v.age)
        v_sexe_val = 1 if v.sexe == "Homme" else 0
        age_diff = abs(age_val - v_age_val)
        sexe_match = 1 if v_sexe_val == sexe_val else 0
        similarity = (1 / (1 + age_diff)) + sexe_match

        for item in v.items:
            scores_per_rayon[item.rayon] = scores_per_rayon.get(item.rayon, 0) + similarity * item.quantite

    total_score = sum(scores_per_rayon.values())

    if total_score == 0 or not scores_per_rayon:
        return {
            "bestRayon": "Divers",
            "bestScore": 1.0,
            "level": "DONNÉES INSUFFISANTES ⚠️",
            "probabilities": [{"rayon": "Divers", "proba": 1.0}]
        }

    sorted_list = [
        {"rayon": rayon, "proba": round(score / total_score, 4)}
        for rayon, score in scores_per_rayon.items()
    ]
    sorted_list = sorted(sorted_list, key=lambda x: x["proba"], reverse=True)

    best_rayon = sorted_list[0]["rayon"]
    best_score = sorted_list[0]["proba"]
    
    level = "MOYENNEMENT FIABLE ⚠️"
    if len(local_ventes) < 3:
        level = "DONNÉES INSUFFISANTES ⚠️"
    elif best_score > 0.6:
        level = "TRÈS FIABLE 🔥"

    return {
        "bestRayon": best_rayon,
        "bestScore": best_score,
        "level": level,
        "probabilities": sorted_list[:4]
    }


# --- API Routes ---

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    seed_database(db)

@app.get("/api/state")
def get_state(db: Session = Depends(get_db)):
    users_list = db.query(models.User).all()
    products_list = db.query(models.Product).order_by(models.Product.id.desc()).all()
    jobs_list = db.query(models.JobOffer).order_by(models.JobOffer.id.desc()).all()
    orders_list = db.query(models.Order).order_by(models.Order.id.desc()).all()
    
    # Retrieve ventes with items joined
    ventes_list = db.query(models.Vente).order_by(models.Vente.id.desc()).all()
    serialized_ventes = []
    for v in ventes_list:
        v_items = [{"id": it.id, "rayon": it.rayon, "produit": it.produit, "quantite": it.quantite, "prix_unitaire": it.prix_unitaire, "total": it.total} for it in v.items]
        serialized_ventes.append({
            "id": v.id,
            "entreprise_id": v.entreprise_id,
            "age": v.age,
            "sexe": v.sexe,
            "total": v.total,
            "date_vente": v.date_vente,
            "items": v_items
        })

    return {
        "users": users_list,
        "products": products_list,
        "jobOffers": jobs_list,
        "orders": orders_list,
        "ventes": serialized_ventes
    }

@app.post("/api/login")
def login(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé. S'inscrire d'abord !")
    return {"success": True, "user": user}

@app.post("/api/register", status_code=201)
def register(req: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == req.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un compte avec cette adresse email existe déjà.")
    
    new_id = f"user_{uuid.uuid4().hex[:7]}"
    new_user = models.User(
        id=new_id,
        name=req.name,
        email=req.email.strip().lower(),
        profileType=req.profileType,
        enterpriseType=req.enterpriseType,
        supplierType=req.supplierType,
        description=req.description,
        address=req.address,
        phone=req.phone,
        avatarUrl=f"https://api.dicebear.com/7.x/adventurer/svg?seed={req.name}"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"success": True, "user": new_user}

@app.post("/api/products", status_code=201)
def create_product(req: ProductCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == req.sellerId).first()
    if not user:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé.")
    
    new_product = models.Product(
        id=f"product_{uuid.uuid4().hex[:7]}",
        sellerId=req.sellerId,
        sellerName=user.name,
        sellerType=user.profileType,
        title=req.title,
        description=req.description,
        price=req.price,
        category=req.category,
        imageUrl=req.imageUrl,
        stock=req.stock,
        unit=req.unit
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return {"success": True, "product": new_product}

@app.delete("/api/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable.")
    db.delete(product)
    db.commit()
    return {"success": True}

@app.post("/api/jobs", status_code=201)
def create_job(req: JobOfferCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == req.companyId).first()
    if not user or user.profileType != "entreprise":
        raise HTTPException(status_code=403, detail="Seules les entreprises qualifiées peuvent publier des emplois.")
    
    new_job = models.JobOffer(
        id=f"job_{uuid.uuid4().hex[:7]}",
        companyId=req.companyId,
        companyName=user.name,
        companyType=user.enterpriseType or "autre",
        title=req.title,
        description=req.description,
        salary=req.salary,
        location=req.location,
        requirements=", ".join(req.requirements)
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return {"success": True, "job": new_job}

@app.post("/api/orders", status_code=201)
def create_order(req: OrderCreate, db: Session = Depends(get_db)):
    buyer = db.query(models.User).filter(models.User.id == req.buyerId).first()
    product = db.query(models.Product).filter(models.Product.id == req.productId).first()
    
    if not buyer:
        raise HTTPException(status_code=404, detail="Acheteur non trouvé.")
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé.")
    if product.stock < req.quantity:
        raise HTTPException(status_code=400, detail="Stock physique insuffisant.")

    # Deduct stock
    product.stock -= req.quantity
    
    new_order = models.Order(
        id=f"order_{uuid.uuid4().hex[:7]}",
        buyerId=req.buyerId,
        buyerName=buyer.name,
        sellerId=product.sellerId,
        sellerName=product.sellerName,
        productId=req.productId,
        productTitle=product.title,
        price=product.price,
        quantity=req.quantity,
        status="pending"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return {"success": True, "order": new_order}

@app.patch("/api/orders/{order_id}")
def update_order_status(order_id: str, req: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée.")
    
    order.status = req.status
    db.commit()
    db.refresh(order)
    return {"success": True, "order": order}

@app.post("/api/ventes", status_code=201)
def create_vente(req: VenteRequest, db: Session = Depends(get_db)):
    # Stock verification check
    for item in req.items:
        product = db.query(models.Product).filter(
            models.Product.sellerId == req.entreprise_id,
            models.Product.title == item.produit
        ).first()

        if not product:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "vente_impossible",
                    "message": f"Produit '{item.produit}' non trouvé dans votre magasin.",
                    "produit": item.produit,
                    "demande": item.quantite,
                    "dispo": 0
                }
            )
        
        if product.stock < item.quantite:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "vente_impossible",
                    "message": f"Quantité insuffisante pour {product.title}.",
                    "produit": product.title,
                    "demande": item.quantite,
                    "dispo": product.stock
                }
            )

    total_calculated = 0.0
    processed_items = []
    vente_id = f"vente_{uuid.uuid4().hex[:7]}"

    for item in req.items:
        product = db.query(models.Product).filter(
            models.Product.sellerId == req.entreprise_id,
            models.Product.title == item.produit
        ).first()

        product.stock -= item.quantite
        item_total = product.price * item.quantite
        total_calculated += item_total

        vi = models.VenteItem(
            id=f"vi_{uuid.uuid4().hex[:7]}",
            vente_id=vente_id,
            rayon=product.category,
            produit=product.title,
            quantite=item.quantite,
            prix_unitaire=product.price,
            total=item_total
        )
        processed_items.append(vi)

    new_vente = models.Vente(
        id=vente_id,
        entreprise_id=req.entreprise_id,
        age=req.age,
        sexe=req.sexe,
        total=total_calculated
    )
    db.add(new_vente)
    db.add_all(processed_items)
    db.commit()

    serialized_items = [{"id": it.id, "rayon": it.rayon, "produit": it.produit, "quantite": it.quantite, "prix_unitaire": it.prix_unitaire, "total": it.total} for it in processed_items]
    return {
        "success": True,
        "vente": {
            "id": new_vente.id,
            "entreprise_id": new_vente.entreprise_id,
            "age": new_vente.age,
            "sexe": new_vente.sexe,
            "total": new_vente.total,
            "date_vente": new_vente.date_vente,
            "items": serialized_items
        }
    }

@app.post("/api/recommend")
def get_recommendations(req: RecommendRequest, db: Session = Depends(get_db)):
    local_ventes_query = db.query(models.Vente).filter(models.Vente.entreprise_id == req.entreprise_id).all()
    
    static_recommendations = recommend_products(local_ventes_query, req.age, req.sexe)
    advanced_recommendations = recommend_advanced(local_ventes_query, req.panier, req.age, req.sexe)
    prediction_result = compute_rayon_prediction(local_ventes_query, req.age, req.sexe)

    return {
        "success": True,
        "staticRecommendations": static_recommendations,
        "advancedRecommendations": advanced_recommendations,
        "predictionResult": prediction_result
    }

@app.post("/api/gemini/chat")
def run_chat_assistant(req: dict):
    # Simulated support helpdesk fallback or simple mock answer
    return {
        "text": "Bonjour ! Je suis le conseiller d'aide locale WeLink. Comment puis-je vous aider aujourd'hui à gérer votre inventaire ou vos recrutements ?"
    }
