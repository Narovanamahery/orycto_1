/**
 * GET /api/legal/terms        — Terms of Service
 * GET /api/legal/privacy      — Privacy Policy
 * GET /api/legal/versions     — Current versions
 * POST /api/legal/consent     — Record explicit consent (authenticated)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();

const TERMS_VERSION   = '1.0';
const PRIVACY_VERSION = '1.0';
const EFFECTIVE_DATE  = '1er janvier 2025';
const COMPANY_NAME    = 'Orycto';
const COMPANY_EMAIL   = 'legal@orycto.mg';

// ── GET /api/legal/versions ───────────────────────────────────────────────────
router.get('/versions', (_req, res) => {
  res.json({ terms: TERMS_VERSION, privacy: PRIVACY_VERSION, effectiveDate: EFFECTIVE_DATE });
});

// ── GET /api/legal/terms ──────────────────────────────────────────────────────
router.get('/terms', (_req, res) => {
  res.json({
    version:       TERMS_VERSION,
    effectiveDate: EFFECTIVE_DATE,
    language:      'fr',
    title:         "Conditions Générales d'Utilisation",
    content: `
# Conditions Générales d'Utilisation — Orycto
**Version ${TERMS_VERSION} — En vigueur depuis le ${EFFECTIVE_DATE}**

---

## 1. Présentation et acceptation

**Orycto** est une application professionnelle de gestion de cheptel cunicole (lapins), éditée par ${COMPANY_NAME}. En créant un compte ou en utilisant l'application, vous reconnaissez avoir lu, compris et accepté sans réserve les présentes Conditions Générales d'Utilisation (« CGU »).

Si vous n'acceptez pas ces conditions, vous n'êtes pas autorisé à utiliser Orycto.

---

## 2. Description du service

Orycto fournit un ensemble d'outils professionnels destinés à la gestion d'élevages cunicoles, incluant notamment :

- La gestion du cheptel (identification, suivi individuel, généalogie)
- Le suivi sanitaire (traitements, vaccins, pathologies)
- La gestion de la reproduction (accouplements, portées)
- La gestion de l'alimentation (stocks, rations, distributions)
- Le reporting et les indicateurs de performance
- La gestion multi-utilisateurs au sein d'une exploitation

Le service est accessible via une interface web et/ou une API REST. Certaines fonctionnalités peuvent être soumises à des plans tarifaires distincts (Free, Pro, Enterprise).

---

## 3. Création de compte et accès

### 3.1 Demande d'accès
L'accès à Orycto nécessite la création d'un compte. Toute nouvelle inscription est soumise à **validation par un administrateur**. Un compte en attente de validation ne bénéficie d'aucun accès aux données ou fonctionnalités.

### 3.2 Informations obligatoires
Vous vous engagez à fournir des informations exactes, complètes et à jour lors de la création de votre compte, notamment votre nom, prénom et adresse email professionnelle valide.

### 3.3 Responsabilité des identifiants
Vous êtes seul responsable de la confidentialité de vos identifiants (email et mot de passe). Toute activité réalisée depuis votre compte est réputée effectuée par vous. En cas de compromission de vos identifiants, vous devez en informer immédiatement l'administrateur de votre exploitation ou contacter ${COMPANY_EMAIL}.

### 3.4 Comptes d'exploitation
Au sein d'une même exploitation, plusieurs utilisateurs peuvent partager l'accès aux données. Les rôles définis (Admin, Éleveur, Vétérinaire, Ouvrier, Viewer) déterminent les permissions de chaque utilisateur.

---

## 4. Rôles et permissions

| Rôle | Permissions |
|---|---|
| **Super Admin** | Accès total à la plateforme, gestion des exploitations et utilisateurs |
| **Admin** | Gestion des utilisateurs de son exploitation, accès complet aux données |
| **Éleveur** | Création, modification, lecture de toutes les données de l'exploitation |
| **Vétérinaire** | Accès complet aux données sanitaires, lecture seule sur les autres modules |
| **Ouvrier** | Saisie des données quotidiennes (distributions, poids), lecture limitée |
| **Viewer** | Lecture seule sur toutes les données |

Les rôles sont attribués par l'administrateur de l'exploitation ou le super-administrateur d'Orycto.

---

## 5. Obligations de l'utilisateur

En utilisant Orycto, vous vous engagez à :

- Utiliser le service uniquement à des fins professionnelles légitimes liées à la gestion cunicole
- Ne pas partager votre compte avec des tiers non autorisés
- Ne pas tenter d'accéder aux données d'autres exploitations
- Ne pas effectuer d'opérations susceptibles de compromettre la sécurité ou la disponibilité du service
- Ne pas saisir de données fausses, trompeuses ou portant atteinte à des tiers
- Respecter la confidentialité des données des autres utilisateurs de votre exploitation
- Signaler tout dysfonctionnement ou faille de sécurité à ${COMPANY_EMAIL}

---

## 6. Données et propriété intellectuelle

### 6.1 Vos données
Les données saisies dans Orycto (données lapins, traitements, reproductions, etc.) vous appartiennent. Orycto ne revendique aucun droit de propriété sur vos données opérationnelles.

### 6.2 Logiciel et interface
L'application Orycto, son interface, son code source et l'ensemble de ses composants sont la propriété exclusive de ${COMPANY_NAME} et sont protégés par les lois en vigueur sur la propriété intellectuelle. Toute reproduction, distribution ou utilisation non autorisée est strictement interdite.

### 6.3 Export des données
Vous pouvez demander l'export de vos données à tout moment en contactant ${COMPANY_EMAIL}.

---

## 7. Disponibilité du service

Orycto s'efforce d'assurer une disponibilité maximale du service. Cependant, des interruptions peuvent survenir pour maintenance, mise à jour, ou en cas d'incident technique. Orycto ne saurait être tenu responsable des conséquences de ces interruptions sur votre activité.

---

## 8. Suspension et résiliation

### 8.1 Par l'utilisateur
Vous pouvez demander la suppression de votre compte à tout moment en contactant l'administrateur de votre exploitation ou ${COMPANY_EMAIL}.

### 8.2 Par Orycto
Orycto se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU, d'activité frauduleuse, ou de non-paiement (plan payant).

### 8.3 Effets de la résiliation
À la résiliation, vos données restent disponibles pendant 30 jours, après quoi elles sont définitivement supprimées, sauf obligation légale de conservation.

---

## 9. Limitation de responsabilité

Dans les limites autorisées par la loi applicable, Orycto ne peut être tenu responsable de :

- Pertes de données résultant d'une erreur utilisateur
- Perte de chiffre d'affaires ou de bénéfices liée à l'utilisation ou à l'indisponibilité du service
- Dommages indirects, accessoires ou consécutifs

La responsabilité totale d'Orycto, quelle que soit la cause, ne saurait excéder les sommes effectivement versées par l'utilisateur au cours des 12 derniers mois.

---

## 10. Modifications des CGU

Orycto se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront notifiés de toute modification substantielle et devront accepter les nouvelles conditions pour continuer à utiliser le service. La version en vigueur est toujours accessible dans l'application.

---

## 11. Droit applicable et litiges

Les présentes CGU sont régies par le droit applicable en République de Madagascar. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire.

---

## 12. Contact

Pour toute question relative aux présentes CGU :
**Email :** ${COMPANY_EMAIL}
**Orycto** — Application de gestion cunicole professionnelle
    `.trim(),
  });
});

// ── GET /api/legal/privacy ────────────────────────────────────────────────────
router.get('/privacy', (_req, res) => {
  res.json({
    version:       PRIVACY_VERSION,
    effectiveDate: EFFECTIVE_DATE,
    language:      'fr',
    title:         'Politique de Confidentialité',
    content: `
# Politique de Confidentialité — Orycto
**Version ${PRIVACY_VERSION} — En vigueur depuis le ${EFFECTIVE_DATE}**

---

## 1. Introduction

${COMPANY_NAME} (« nous ») prend très au sérieux la protection de vos données personnelles. La présente Politique de Confidentialité explique quelles données nous collectons, pourquoi nous les collectons, comment nous les utilisons et les droits dont vous disposez à leur égard, conformément aux principes généralement acceptés de protection des données.

---

## 2. Responsable du traitement

**Orycto**
Email : ${COMPANY_EMAIL}

---

## 3. Données collectées

### 3.1 Données de compte (fournies par vous)
- Prénom, nom de famille
- Adresse email professionnelle
- Numéro de téléphone (optionnel)
- Nom de votre exploitation
- Mot de passe (stocké sous forme hachée et salée — jamais en clair)

### 3.2 Données d'utilisation (collectées automatiquement)
- Adresse IP de connexion
- Horodatage des connexions et déconnexions
- Journal des actions effectuées dans l'application (audit log)
- Navigateur et système d'exploitation (user agent)
- Nombre et historique de connexions

### 3.3 Données opérationnelles (saisies par vous)
- Informations sur vos lapins (identification, santé, reproduction, alimentation)
- Données de votre exploitation (cages, stocks, coûts)
- Ces données sont vos propriétés et ne sont pas utilisées par Orycto à d'autres fins que le fonctionnement du service

### 3.4 Données de consentement
- Date, heure, adresse IP et version des CGU/Politique acceptées
- Historique complet des acceptations

---

## 4. Finalités et bases légales du traitement

| Finalité | Base légale |
|---|---|
| Création et gestion de votre compte | Exécution du contrat |
| Authentification et sécurité | Intérêt légitime |
| Fourniture du service | Exécution du contrat |
| Journal d'audit et traçabilité | Intérêt légitime / obligation légale |
| Amélioration du service (données anonymisées) | Intérêt légitime |
| Envoi de notifications liées au compte | Exécution du contrat |
| Conservation des preuves de consentement | Obligation légale |

---

## 5. Conservation des données

| Type de donnée | Durée de conservation |
|---|---|
| Données de compte actif | Durée de l'abonnement + 30 jours |
| Journal d'audit | 3 ans |
| Données de consentement | 5 ans |
| Logs de connexion | 12 mois |
| Données opérationnelles (lapins, etc.) | Durée de l'abonnement + 30 jours |

---

## 6. Partage des données

Orycto ne vend, ne loue et ne cède pas vos données personnelles à des tiers.

Vos données peuvent être partagées uniquement dans les cas suivants :

- **Au sein de votre exploitation** : les autres utilisateurs de votre exploitation ont accès aux données opérationnelles selon leur rôle
- **Hébergeurs techniques** : nos serveurs sont hébergés chez des prestataires qui s'engagent contractuellement à ne pas utiliser vos données
- **Obligation légale** : si la loi ou une autorité compétente l'exige

---

## 7. Sécurité des données

Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :

- **Mots de passe** : hachage bcrypt (facteur de coût 12) + sel aléatoire
- **Transmission** : chiffrement TLS/HTTPS obligatoire
- **Sessions** : tokens sécurisés, expiration automatique
- **Authentification** : verrouillage après 5 tentatives échouées
- **Accès** : contrôle strict par rôles, isolation des données par exploitation
- **Audit** : journalisation complète de toutes les actions sensibles

---

## 8. Vos droits

Conformément aux principes de protection des données, vous disposez des droits suivants :

### 8.1 Droit d'accès
Vous pouvez demander une copie de toutes les données personnelles que nous détenons vous concernant.

### 8.2 Droit de rectification
Vous pouvez corriger vos données personnelles directement dans votre profil ou en nous contactant.

### 8.3 Droit à l'effacement
Vous pouvez demander la suppression de votre compte et de vos données personnelles, sous réserve des obligations légales de conservation.

### 8.4 Droit à la portabilité
Vous pouvez demander l'export de vos données opérationnelles dans un format lisible (JSON/CSV).

### 8.5 Droit d'opposition
Vous pouvez vous opposer à certains traitements fondés sur notre intérêt légitime.

### 8.6 Exercice des droits
Pour exercer vos droits, contactez-nous à : **${COMPANY_EMAIL}**
Nous nous engageons à répondre dans un délai de **30 jours**.

---

## 9. Cookies et technologies similaires

Orycto utilise des cookies de session strictement nécessaires au fonctionnement de l'authentification. Aucun cookie de tracking ou publicitaire n'est utilisé.

---

## 10. Transferts internationaux

Vos données sont traitées et stockées dans des serveurs situés en [région à préciser]. Si des transferts vers d'autres pays sont nécessaires, nous nous assurons que des garanties adéquates sont en place.

---

## 11. Modifications de la Politique de Confidentialité

Toute modification substantielle de cette politique sera notifiée aux utilisateurs au moins 30 jours avant son entrée en vigueur. L'utilisation continue du service après notification vaut acceptation.

---

## 12. Contact et réclamations

Pour toute question ou réclamation relative à la protection de vos données :
**Email :** ${COMPANY_EMAIL}

---

*Orycto — Protection de vos données, transparence, et conformité.*
    `.trim(),
  });
});

// ── POST /api/legal/consent ───────────────────────────────────────────────────
router.post('/consent', requireAuth, async (req, res) => {
  try {
    const { type, version } = req.body;
    if (!type || !version) {
      return res.status(400).json({ error: 'type et version requis' });
    }
    if (!['terms','privacy','both'].includes(type)) {
      return res.status(400).json({ error: 'type invalide (terms|privacy|both)' });
    }

    await query(
      `INSERT INTO legal_consents (user_id, type, version, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, type, version, req.ip || null, req.headers['user-agent'] || null]
    );

    if (type === 'terms' || type === 'both') {
      await query(
        `UPDATE users SET terms_accepted = TRUE, terms_accepted_at = NOW(), terms_version = $1
         WHERE id = $2`,
        [version, req.user.id]
      );
    }
    if (type === 'privacy' || type === 'both') {
      await query(
        `UPDATE users SET privacy_accepted = TRUE, privacy_accepted_at = NOW() WHERE id = $1`,
        [req.user.id]
      );
    }

    res.json({ message: 'Consentement enregistré', type, version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/legal/my-consents ────────────────────────────────────────────────
router.get('/my-consents', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM legal_consents WHERE user_id = $1 ORDER BY accepted_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
