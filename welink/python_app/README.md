# StartupConnect - Backend Python FastAPI

Ce répertoire contient une implémentation complète et autonome du serveur de l'application **StartupConnect** écrite en **Python (FastAPI)** avec persistence de données locale dans une base **SQLite** (via l'ORM SQLAlchemy).

Il réplique trait pour trait les fonctionnalités de notre serveur Node.js/Express, y compris :
- La gestion des profils multi-utilisateurs (Clients, Commerces de quartier, Fournisseurs)
- L'historique et le flux de commandes (B2C et B2B)
- La publication d'offres d'emplois locales
- **La Caisse Enregistreuse avec décrémentation automatique de stock**
- **Notre Algorithme d'Intelligence Artificielle de recommandation** et de prédiction démographique (score d'affinité profil et corrélation de panier/combos).

---

## 🚀 Comment lancer le serveur de l'application

### 1. Prérequis (Python 3.8+)
Avoir Python installé sur votre machine.

### 2. Installation des dépendances
Installez les bibliothèques requises :
```bash
pip install fastapi uvicorn sqlalchemy pydantic
```

### 3. Lancement du serveur d'API locale
Depuis le répertoire du projet, exécutez la commande suivante :
```bash
uvicorn python_app.main:app --reload --port 3000
```

Le serveur sera alors actif sur : **`http://localhost:3000`**

- Vous pouvez visualiser la documentation interactive complète de l'API (Swagger UI) sur : **`http://localhost:3000/docs`**
- Une base de données SQLite locale `startupconnect.db` sera créée automatiquement, avec toutes les données initiales de test injectées au premier lancement.
