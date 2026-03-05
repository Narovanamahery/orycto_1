# Orycto Backend

REST API — Node.js · Express · PostgreSQL  
Auth : JWT + Sessions (connect-pg-simple)

---

## Prérequis

- Node.js 18+
- PostgreSQL 14+

---

## Installation

```bash
cd orycto-backend
npm install

cp .env.example .env
# Editer .env avec tes valeurs
```

### Créer la base de données

```sql
-- Dans psql :
CREATE DATABASE orycto_db;
```

### Lancer les migrations

```bash
npm run migrate
```

### Démarrer le serveur

```bash
# Développement (auto-reload)
npm run dev

# Production
npm start
```

Le serveur démarre sur **http://localhost:3001**

---

## Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `DB_HOST` | localhost | Host PostgreSQL |
| `DB_PORT` | 5432 | Port PostgreSQL |
| `DB_NAME` | orycto_db | Nom de la base |
| `DB_USER` | postgres | Utilisateur |
| `DB_PASSWORD` | — | Mot de passe |
| `PORT` | 3001 | Port du serveur |
| `JWT_SECRET` | — | Secret JWT (min 32 chars) |
| `JWT_EXPIRES_IN` | 7d | Durée du token |
| `SESSION_SECRET` | — | Secret session |
| `CLIENT_ORIGIN` | http://localhost:5173 | Origine CORS |

---

## Routes API

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| POST | `/api/auth/logout` | Se déconnecter |
| GET  | `/api/auth/me` | Profil courant |

### Lapins
| Method | Route | Description |
|---|---|---|
| GET    | `/api/lapins` | Liste (filtres: search, statut, sexe) |
| GET    | `/api/lapins/:id` | Détail |
| POST   | `/api/lapins` | Créer |
| PUT    | `/api/lapins/:id` | Modifier |
| DELETE | `/api/lapins/:id` | Supprimer |

### Santé
| Method | Route | Description |
|---|---|---|
| GET    | `/api/sante` | Soins (filtre: statut) |
| POST   | `/api/sante` | Créer soin |
| PUT    | `/api/sante/:id` | Modifier soin |
| DELETE | `/api/sante/:id` | Supprimer soin |
| GET    | `/api/sante/pathologies` | Liste pathologies |
| POST   | `/api/sante/pathologies` | Créer pathologie |
| DELETE | `/api/sante/pathologies/:id` | Supprimer pathologie |

### Reproduction
| Method | Route | Description |
|---|---|---|
| GET    | `/api/reproduction` | Accouplements |
| POST   | `/api/reproduction` | Créer |
| PUT    | `/api/reproduction/:id` | Modifier |
| DELETE | `/api/reproduction/:id` | Supprimer |
| POST   | `/api/reproduction/:id/naissance` | Enregistrer naissance |
| GET    | `/api/reproduction/portees` | Portées |
| POST   | `/api/reproduction/portees` | Créer portée |
| DELETE | `/api/reproduction/portees/:id` | Supprimer portée |

### Alimentation
| Method | Route | Description |
|---|---|---|
| GET    | `/api/alimentation/aliments` | Aliments |
| POST   | `/api/alimentation/aliments` | Créer aliment |
| DELETE | `/api/alimentation/aliments/:id` | Supprimer |
| GET    | `/api/alimentation/stocks` | Stocks |
| POST   | `/api/alimentation/stocks` | Créer/incrémenter stock |
| PUT    | `/api/alimentation/stocks/:id` | Modifier stock |
| POST   | `/api/alimentation/stocks/restock` | Réapprovisionner |
| DELETE | `/api/alimentation/stocks/:id` | Supprimer |
| GET    | `/api/alimentation/distributions` | Distributions |
| POST   | `/api/alimentation/distributions` | Enregistrer distribution |
| DELETE | `/api/alimentation/distributions/:id` | Supprimer |

### Dashboard
| Method | Route | Description |
|---|---|---|
| GET | `/api/dashboard` | KPIs + alertes + activités + stocks |
| GET | `/api/dashboard/statistiques` | Races + mensuel + coûts |

### Événements & Coûts
| Method | Route | Description |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/evenements` | Événements |
| GET/POST/DELETE | `/api/couts` | Coûts |

---

## Authentification

Deux mécanismes sont supportés simultanément :

**Session cookie** (navigateur)  
Automatique après login. Durée : 7 jours.

**JWT Bearer** (API / mobile)  
```
Authorization: Bearer <token>
```
Le token est retourné dans la réponse du login.

---

## Structure des fichiers

```
orycto-backend/
├── src/
│   ├── index.js              ← Entry point Express
│   ├── db/
│   │   ├── pool.js           ← Connexion PostgreSQL
│   │   └── migrate.js        ← Création des tables
│   ├── middleware/
│   │   └── auth.js           ← requireAuth (JWT + session)
│   └── routes/
│       ├── auth.js           ← /api/auth
│       ├── lapins.js         ← /api/lapins
│       ├── sante.js          ← /api/sante
│       ├── reproduction.js   ← /api/reproduction
│       ├── alimentation.js   ← /api/alimentation
│       ├── dashboard.js      ← /api/dashboard
│       └── misc.js           ← /api/evenements + /api/couts
├── .env.example
├── package.json
└── README.md
```

---

## Connexion avec le frontend

Dans `js/api.js`, remplacer le storage layer par les appels REST :

```js
const BASE_URL = 'http://localhost:3001/api';

async function request(method, endpoint, body = null) {
  const token = localStorage.getItem('orycto_token');
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    credentials: 'include',          // session cookie
    headers: {
      'Content-Type':  'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}
```
