from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    profileType = Column(String, nullable=False) # 'client' | 'entreprise' | 'fournisseur'
    enterpriseType = Column(String, nullable=True) # e.g. 'supermarche', 'marche', etc.
    supplierType = Column(String, nullable=True) # e.g. 'agriculteur', 'artisan', etc.
    description = Column(Text, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatarUrl = Column(String, nullable=True)

class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, index=True)
    sellerId = Column(String, ForeignKey("users.id"), nullable=False)
    sellerName = Column(String, nullable=False)
    sellerType = Column(String, nullable=False) # 'entreprise' | 'fournisseur'
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    imageUrl = Column(String, nullable=True)
    stock = Column(Integer, default=0)
    unit = Column(String, default="unité")

class JobOffer(Base):
    __tablename__ = "job_offers"
    id = Column(String, primary_key=True, index=True)
    companyId = Column(String, ForeignKey("users.id"), nullable=False)
    companyName = Column(String, nullable=False)
    companyType = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    salary = Column(String, nullable=False)
    location = Column(String, nullable=False)
    requirements = Column(Text, nullable=True) # JSON or Comma-separated list
    createdAt = Column(String, default=lambda: datetime.utcnow().isoformat())

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, index=True)
    buyerId = Column(String, nullable=False)
    buyerName = Column(String, nullable=False)
    sellerId = Column(String, nullable=False)
    sellerName = Column(String, nullable=False)
    productId = Column(String, nullable=False)
    productTitle = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String, default="pending") # 'pending' | 'accepted' | 'shipped' | 'delivered'
    createdAt = Column(String, default=lambda: datetime.utcnow().isoformat())

class Vente(Base):
    __tablename__ = "ventes"
    id = Column(String, primary_key=True, index=True)
    entreprise_id = Column(String, nullable=False)
    age = Column(String, nullable=False)
    sexe = Column(String, nullable=False)
    total = Column(Float, nullable=False)
    date_vente = Column(String, default=lambda: datetime.utcnow().isoformat())
    items = relationship("VenteItem", back_populates="vente", cascade="all, delete-orphan")

class VenteItem(Base):
    __tablename__ = "vente_items"
    id = Column(String, primary_key=True, index=True)
    vente_id = Column(String, ForeignKey("ventes.id"), nullable=False)
    rayon = Column(String, nullable=False)
    produit = Column(String, nullable=False)
    quantite = Column(Integer, nullable=False)
    prix_unitaire = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    
    vente = relationship("Vente", back_populates="items")
