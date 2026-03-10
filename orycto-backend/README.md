# Orycto Backend v2 — Professionnel

REST API complète · Node.js · Express · PostgreSQL  
Auth : JWT + Sessions · Super Admin · Workflow d'approbation · Audit complet

---

## Installation rapide

```bash
cd orycto-backend-v2
npm install

cp .env.example .env
# → Remplir DB_*, JWT_SECRET, SESSION_SECRET, CLIENT_ORIGIN

# Créer la base (psql)
CREATE DATABASE orycto_db;

# Migrations (toutes les tables)
npm run migrate

# Démarrer
npm run dev
```

---

## Initialisation — Premier démarrage

**Étape 1 : Créer le Super Admin** (route one-shot, bloquée si un SA existe déjà)

```bash
curl -X POST http://localhost:3001/api/auth/init-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email":     "narovanam@orycto.mg",
    "password":  "SuperSecurePassword123!",
    "firstName": "Super",
    "lastName":  "Admin"
  }'
```

**Étape 2 : Créer une exploitation via le panel admin**

```bash
curl -X POST http://localhost:3001/api/admin/exploitations \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nom": "Ferme Exemple", "ville": "Antananarivo", "plan": "pro"}'
```

**Étape 3 : Les utilisateurs s'inscrivent → le SA les approuve**

---

## Architecture des rôles

```
super_admin
  │  Gère la plateforme entière
  │  Approuve/refuse les comptes
  │  Crée/gère les exploitations
  │  Voit les logs d'audit globaux
  │
  └─ exploitation (farm)
       │
       ├─ admin          → Gère les users de l'exploitation
       ├─ eleveur        → Accès complet aux données
       ├─ veterinaire    → Accès complet santé + lecture autre
       ├─ ouvrier        → Saisie quotidienne (dist., pesées)
       └─ viewer         → Lecture seule
```

---

## Workflow d'inscription

```
[User] Inscription
    ↓
status = 'pending'
    ↓
Notification → Super Admin
    ↓
[SA] /api/admin/users/:id/approve  → status = 'active' + assigne exploitation + rôle
  ou /api/admin/users/:id/reject   → status = 'rejected' + motif
    ↓
[User] Notification + peut se connecter (si approuvé)
```

**Alternative : invitation directe**
```
[SA/Admin] POST /api/admin/invitations {email, exploitation_id, role}
    ↓  token d'invitation généré
[User] Inscription avec invitationToken → status = 'active' directement
```

---

## Schéma de base de données — Toutes les tables

| Table | Description |
|---|---|
| `exploitations` | Fermes/élevages (multi-tenant) |
| `users` | Utilisateurs avec rôles, statuts, consentements |
| `session` | Sessions PostgreSQL |
| `invitations` | Invitations par token |
| `audit_logs` | Journal complet de toutes les actions |
| `notifications` | Notifications in-app |
| `legal_consents` | Historique des acceptations CGU/Privacy |
| `races` | Races de lapins (par exploitation) |
| `cages` | Cages (par exploitation) |
| `lapins` | Cheptel complet avec race libre |
| `traitements` | Référentiel de traitements |
| `suivis` | Applications de traitements |
| `pathologies` | Maladies et pathologies |
| `accouplements` | Accouplements |
| `portees` | Portées |
| `lapins_portees` | Lapins individuels d'une portée |
| `aliments` | Aliments disponibles |
| `stocks` | Stocks d'aliments |
| `rations` | Protocoles alimentaires par type |
| `distributions` | Distributions quotidiennes |
| `evenements` | Événements (vente, achat, mort…) |
| `couts` | Dépenses |
| `perf` | KPIs reproducteurs |

---

## Routes API complètes

### Auth (public)
```
POST /api/auth/register          ← inscription (→ pending)
POST /api/auth/register          ← avec invitationToken (→ active)
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/init-super-admin  ← one-shot premier démarrage
```

### Legal (public)
```
GET  /api/legal/terms
GET  /api/legal/privacy
GET  /api/legal/versions
POST /api/legal/consent          ← (auth) enregistrer un consentement
GET  /api/legal/my-consents      ← (auth) historique mes consentements
```

### Admin (super_admin requis)
```
GET    /api/admin/stats
GET    /api/admin/users
GET    /api/admin/users/pending
GET    /api/admin/users/:id
PUT    /api/admin/users/:id
POST   /api/admin/users/:id/approve
POST   /api/admin/users/:id/reject
POST   /api/admin/users/:id/suspend
POST   /api/admin/users/:id/reactivate
DELETE /api/admin/users/:id
POST   /api/admin/users/:id/reset-password

GET    /api/admin/exploitations
POST   /api/admin/exploitations
PUT    /api/admin/exploitations/:id

GET    /api/admin/invitations
POST   /api/admin/invitations
DELETE /api/admin/invitations/:id

GET    /api/admin/audit
```

### Données exploitation (auth + exploitation requis)
```
/api/lapins         CRUD complet
/api/sante          Soins + pathologies
/api/reproduction   Accouplements + portées + naissances
/api/alimentation   Aliments + stocks + distributions + restock
/api/dashboard      KPIs + alertes + statistiques
/api/evenements     Événements
/api/couts          Dépenses
```

---

## Sécurité

- Mots de passe : **bcrypt** (coût 12)
- Tokens : **JWT RS256** ou HS256, expiration 7j
- Sessions : **PostgreSQL**, cookie HttpOnly + SameSite
- Verrouillage : **5 tentatives** → lock 15 min
- Isolation : toutes les données scoped par `exploitation_id`
- Audit : **toutes les actions** tracées avec IP + user agent
- Consentement : **horodaté, versionné, IP loguée**

---

## Variables d'environnement

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orycto_db
DB_USER=postgres
DB_PASSWORD=your_password

PORT=3001
NODE_ENV=development

JWT_SECRET=min_32_chars_random_string_here
JWT_EXPIRES_IN=7d

SESSION_SECRET=another_long_random_string
SESSION_MAX_AGE=604800000

CLIENT_ORIGIN=http://localhost:5173
```
