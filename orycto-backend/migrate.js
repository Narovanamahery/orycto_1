/**
 * Orycto — Migration complète v2
 * Schéma professionnel complet
 */

import { pool } from './pool.js';
import 'dotenv/config';

const SQL = `

-- ══════════════════════════════════════════════════════════════════════════════
-- RESET DATABASE (for development)
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS legal_consents CASCADE;
DROP TABLE IF EXISTS perf CASCADE;
DROP TABLE IF EXISTS couts CASCADE;
DROP TABLE IF EXISTS evenements CASCADE;
DROP TABLE IF EXISTS distributions CASCADE;
DROP TABLE IF EXISTS rations CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS aliments CASCADE;
DROP TABLE IF EXISTS lapins_portees CASCADE;
DROP TABLE IF EXISTS portees CASCADE;
DROP TABLE IF EXISTS accouplements CASCADE;
DROP TABLE IF EXISTS pathologies CASCADE;
DROP TABLE IF EXISTS suivis CASCADE;
DROP TABLE IF EXISTS traitements CASCADE;
DROP TABLE IF EXISTS lapins CASCADE;
DROP TABLE IF EXISTS cages CASCADE;
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS exploitations CASCADE;
DROP TABLE IF EXISTS session CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- recherche full-text

-- ══════════════════════════════════════════════════════════════════════════════
-- SESSIONS (connect-pg-simple)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS session (
  sid    VARCHAR     NOT NULL PRIMARY KEY,
  sess   JSON        NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);

-- ══════════════════════════════════════════════════════════════════════════════
-- EXPLOITATIONS (farms)
-- Une exploitation = un compte professionnel, peut avoir N utilisateurs
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exploitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          VARCHAR(200) NOT NULL,
  description  TEXT,
  adresse      TEXT,
  ville        VARCHAR(100),
  pays         VARCHAR(100) DEFAULT 'Madagascar',
  telephone    VARCHAR(30),
  email        VARCHAR(200),
  logo_url     VARCHAR(500),
  actif        BOOLEAN DEFAULT TRUE,
  plan         VARCHAR(20) DEFAULT 'free'
               CHECK (plan IN ('free','pro','enterprise')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- USERS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                VARCHAR(255) UNIQUE NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,
  first_name           VARCHAR(100),
  last_name            VARCHAR(100),
  phone                VARCHAR(30),
  avatar_url           VARCHAR(500),

  -- Rôle système global
  system_role          VARCHAR(20) DEFAULT 'user'
                       CHECK (system_role IN ('super_admin','user')),

  -- Statut du compte
  status               VARCHAR(20) DEFAULT 'pending'
                       CHECK (status IN ('pending','active','suspended','rejected')),

  -- Exploitation liée
  exploitation_id      UUID REFERENCES exploitations(id) ON DELETE SET NULL,

  -- Rôle au sein de l'exploitation
  exploitation_role    VARCHAR(20) DEFAULT 'eleveur'
                       CHECK (exploitation_role IN ('admin','eleveur','veterinaire','ouvrier','viewer')),

  -- Consentement légal
  terms_accepted       BOOLEAN DEFAULT FALSE,
  terms_accepted_at    TIMESTAMPTZ,
  terms_version        VARCHAR(10),
  privacy_accepted     BOOLEAN DEFAULT FALSE,
  privacy_accepted_at  TIMESTAMPTZ,

  -- Approbation
  approved_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at          TIMESTAMPTZ,
  rejected_reason      TEXT,

  -- Sécurité
  last_login_at        TIMESTAMPTZ,
  last_login_ip        VARCHAR(45),
  login_count          INTEGER DEFAULT 0,
  failed_login_count   INTEGER DEFAULT 0,
  locked_until         TIMESTAMPTZ,
  password_reset_token VARCHAR(255),
  password_reset_exp   TIMESTAMPTZ,
  email_verified       BOOLEAN DEFAULT FALSE,
  email_verify_token   VARCHAR(255),

  active               BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_exploitation   ON users(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_users_status         ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_system_role    ON users(system_role);

-- ══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG
-- Trace toutes les actions importantes
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email      VARCHAR(255),
  exploitation_id UUID REFERENCES exploitations(id) ON DELETE SET NULL,
  action          VARCHAR(100) NOT NULL,
  resource        VARCHAR(100),
  resource_id     VARCHAR(100),
  old_values      JSONB,
  new_values      JSONB,
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user        ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource    ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created     ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_exploitation ON audit_logs(exploitation_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- INVITATIONS
-- Le super_admin ou admin exploitation invite des users
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL,
  exploitation_id UUID REFERENCES exploitations(id) ON DELETE CASCADE,
  role            VARCHAR(20) DEFAULT 'eleveur'
                  CHECK (role IN ('admin','eleveur','veterinaire','ouvrier','viewer')),
  token           VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted        BOOLEAN DEFAULT FALSE,
  accepted_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- ══════════════════════════════════════════════════════════════════════════════
-- RACES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS races (
  id                 SERIAL PRIMARY KEY,
  exploitation_id    UUID REFERENCES exploitations(id) ON DELETE CASCADE,
  nom                VARCHAR(100) NOT NULL,
  description        TEXT,
  poids_adulte_moyen NUMERIC(6,3),
  duree_gestation    INTEGER,   -- jours
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_races_exploitation ON races(exploitation_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- CAGES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cages (
  id              SERIAL PRIMARY KEY,
  exploitation_id UUID REFERENCES exploitations(id) ON DELETE CASCADE,
  code            VARCHAR(20) NOT NULL,
  type            VARCHAR(20) DEFAULT 'individuelle'
                  CHECK (type IN ('individuelle','collective','maternite','quarantaine')),
  capacite_max    INTEGER DEFAULT 1,
  localisation    VARCHAR(100),
  statut          VARCHAR(20) DEFAULT 'disponible'
                  CHECK (statut IN ('disponible','occupee','maintenance')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exploitation_id, code)
);
CREATE INDEX IF NOT EXISTS idx_cages_exploitation ON cages(exploitation_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- LAPINS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS lapins (
  id                 SERIAL PRIMARY KEY,
  exploitation_id    UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  identifiant_unique VARCHAR(50) NOT NULL,
  nom                VARCHAR(100),
  sexe               VARCHAR(10) NOT NULL CHECK (sexe IN ('male','femelle')),
  date_naissance     DATE,
  race_id            INTEGER REFERENCES races(id) ON DELETE SET NULL,
  race_libre         VARCHAR(100),               -- saisie manuelle race croisée
  poids_actuel       NUMERIC(7,3),
  cage_id            INTEGER REFERENCES cages(id) ON DELETE SET NULL,
  statut             VARCHAR(20) DEFAULT 'actif'
                     CHECK (statut IN ('actif','vendu','mort','reforme','sevre','gestante','allaitante','malade')),
  mere_id            INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  pere_id            INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  date_deces         DATE,
  cause_deces        TEXT,
  notes              TEXT,
  created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exploitation_id, identifiant_unique)
);
CREATE INDEX IF NOT EXISTS idx_lapins_exploitation ON lapins(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_lapins_statut       ON lapins(statut);
CREATE INDEX IF NOT EXISTS idx_lapins_sexe         ON lapins(sexe);
CREATE INDEX IF NOT EXISTS idx_lapins_race         ON lapins(race_id);
CREATE INDEX IF NOT EXISTS idx_lapins_id_trgm      ON lapins USING gin(identifiant_unique gin_trgm_ops);

-- ══════════════════════════════════════════════════════════════════════════════
-- TRAITEMENTS (référentiel)
-- Protocoles / traitements types définis par l'exploitation
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS traitements (
  id                 SERIAL PRIMARY KEY,
  exploitation_id    UUID REFERENCES exploitations(id) ON DELETE CASCADE,
  nom                VARCHAR(200) NOT NULL,
  type               VARCHAR(30) DEFAULT 'autre'
                     CHECK (type IN ('vaccin','medicament','antiparasitaire','vitamine','supplement','autre')),
  description        TEXT,
  frequence_jours    INTEGER,
  delai_attente_jours INTEGER,
  dose_standard      VARCHAR(100),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_traitements_exploitation ON traitements(exploitation_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- SUIVIS SANTÉ (applications de traitements)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS suivis (
  id                SERIAL PRIMARY KEY,
  exploitation_id   UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  lapin_id          INTEGER REFERENCES lapins(id) ON DELETE CASCADE,
  traitement_id     INTEGER REFERENCES traitements(id) ON DELETE SET NULL,
  nom_traitement    VARCHAR(200),               -- fallback si pas de ref
  type_soin         VARCHAR(30) DEFAULT 'autre',
  date_administration DATE NOT NULL,
  date_fin          DATE,
  prochain_rappel   DATE,
  dose_administree  VARCHAR(100),
  veterinaire       VARCHAR(150),
  statut            VARCHAR(20) DEFAULT 'planifie'
                    CHECK (statut IN ('planifie','en_cours','termine','en_retard')),
  notes             TEXT,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suivis_exploitation ON suivis(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_suivis_lapin        ON suivis(lapin_id);
CREATE INDEX IF NOT EXISTS idx_suivis_statut       ON suivis(statut);
CREATE INDEX IF NOT EXISTS idx_suivis_rappel       ON suivis(prochain_rappel);

-- ══════════════════════════════════════════════════════════════════════════════
-- PATHOLOGIES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pathologies (
  id              SERIAL PRIMARY KEY,
  exploitation_id UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  lapin_id        INTEGER REFERENCES lapins(id) ON DELETE CASCADE,
  gravite         VARCHAR(20) DEFAULT 'moderee'
                  CHECK (gravite IN ('legere','moderee','grave','critique')),
  date_debut      DATE NOT NULL,
  date_fin        DATE,
  statut          VARCHAR(20) DEFAULT 'active'
                  CHECK (statut IN ('active','en_traitement','guerie','chronique')),
  symptomes       TEXT NOT NULL,
  diagnostic      TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pathologies_exploitation ON pathologies(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_pathologies_lapin        ON pathologies(lapin_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- ACCOUPLEMENTS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS accouplements (
  id                     SERIAL PRIMARY KEY,
  exploitation_id        UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  male_id                INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  femelle_id             INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  date_accouplement      DATE NOT NULL,
  date_mise_bas_prevue   DATE,
  date_mise_bas_reelle   DATE,
  statut                 VARCHAR(20) DEFAULT 'planifie'
                         CHECK (statut IN ('planifie','en_attente','succes','echec')),
  notes                  TEXT,
  created_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_accos_exploitation ON accouplements(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_accos_statut       ON accouplements(statut);

-- ══════════════════════════════════════════════════════════════════════════════
-- PORTÉES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS portees (
  id                    SERIAL PRIMARY KEY,
  exploitation_id       UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  accouplement_id       INTEGER REFERENCES accouplements(id) ON DELETE SET NULL,
  date_naissance        DATE NOT NULL,
  nombre_nes            INTEGER DEFAULT 0,
  nombre_vivants        INTEGER DEFAULT 0,
  nombre_morts          INTEGER DEFAULT 0,
  poids_moyen_naissance NUMERIC(6,3),
  notes                 TEXT,
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portees_exploitation ON portees(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_portees_acco         ON portees(accouplement_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- LAPINS_PORTÉES (chaque lapin d'une portée)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS lapins_portees (
  id               SERIAL PRIMARY KEY,
  exploitation_id  UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  portee_id        INTEGER REFERENCES portees(id) ON DELETE CASCADE,
  lapin_id         INTEGER REFERENCES lapins(id) ON DELETE CASCADE,
  poids_naissance  NUMERIC(6,3),
  statut_naissance VARCHAR(20) DEFAULT 'vivant'
                   CHECK (statut_naissance IN ('vivant','mort_ne','mort_precoce')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lapins_portees_exploitation ON lapins_portees(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_lapins_portees_portee       ON lapins_portees(portee_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- ALIMENTS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS aliments (
  id              SERIAL PRIMARY KEY,
  exploitation_id UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  nom             VARCHAR(100) NOT NULL,
  type            VARCHAR(20) DEFAULT 'autre'
                  CHECK (type IN ('foin','granule','legume','herbe','concentre','supplement','autre')),
  unite_mesure    VARCHAR(10) DEFAULT 'kg'
                  CHECK (unite_mesure IN ('kg','g','L','unite')),
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exploitation_id, nom)
);
CREATE INDEX IF NOT EXISTS idx_aliments_exploitation ON aliments(exploitation_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- STOCKS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stocks (
  id               SERIAL PRIMARY KEY,
  exploitation_id  UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  aliment_id       INTEGER REFERENCES aliments(id) ON DELETE CASCADE,
  quantite         NUMERIC(12,3) DEFAULT 0,
  seuil_alerte     NUMERIC(12,3) DEFAULT 0,
  fournisseur      VARCHAR(200),
  prix_kg          NUMERIC(10,2),
  date_achat       DATE,
  date_peremption  DATE,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exploitation_id, aliment_id)
);
CREATE INDEX IF NOT EXISTS idx_stocks_exploitation ON stocks(exploitation_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- RATIONS (protocoles alimentaires par type de lapin)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rations (
  id              SERIAL PRIMARY KEY,
  exploitation_id UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  aliment_id      INTEGER REFERENCES aliments(id) ON DELETE CASCADE,
  type_lapin      VARCHAR(30) NOT NULL
                  CHECK (type_lapin IN ('adulte','juvenile','femelle_gestante','femelle_allaitante','chaton')),
  quantite_jour   NUMERIC(8,3) NOT NULL,
  composition     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rations_exploitation ON rations(exploitation_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- DISTRIBUTIONS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS distributions (
  id                  SERIAL PRIMARY KEY,
  exploitation_id     UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  aliment_id          INTEGER REFERENCES aliments(id) ON DELETE SET NULL,
  lapin_id            INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  cage_id             INTEGER REFERENCES cages(id) ON DELETE SET NULL,
  ration_id           INTEGER REFERENCES rations(id) ON DELETE SET NULL,
  date_distribution   DATE DEFAULT CURRENT_DATE,
  quantite_distribuee NUMERIC(10,3) NOT NULL,
  reste               NUMERIC(10,3),
  notes               TEXT,
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dist_exploitation ON distributions(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_dist_date         ON distributions(date_distribution);

-- ══════════════════════════════════════════════════════════════════════════════
-- ÉVÉNEMENTS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS evenements (
  id              SERIAL PRIMARY KEY,
  exploitation_id UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  lapin_id        INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  cage_id         INTEGER REFERENCES cages(id) ON DELETE SET NULL,
  type_evenement  VARCHAR(30) NOT NULL
                  CHECK (type_evenement IN ('naissance','sevrage','vente','achat','vaccination',
                         'pesee','transfert','mort','autre')),
  date_evenement  DATE DEFAULT CURRENT_DATE,
  description     TEXT,
  notes           TEXT,
  montant         NUMERIC(12,2),
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_exploitation ON evenements(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_events_lapin        ON evenements(lapin_id);
CREATE INDEX IF NOT EXISTS idx_events_date         ON evenements(date_evenement DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- COÛTS / DÉPENSES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS couts (
  id              SERIAL PRIMARY KEY,
  exploitation_id UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  type_depense    VARCHAR(30) NOT NULL
                  CHECK (type_depense IN ('alimentation','veterinaire','equipement',
                         'transport','personnel','infrastructure','autre')),
  montant         NUMERIC(12,2) NOT NULL,
  date_depense    DATE DEFAULT CURRENT_DATE,
  description     TEXT NOT NULL,
  lapin_id        INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  cage_id         INTEGER REFERENCES cages(id) ON DELETE SET NULL,
  notes           TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_couts_exploitation ON couts(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_couts_date         ON couts(date_depense DESC);
CREATE INDEX IF NOT EXISTS idx_couts_type         ON couts(type_depense);

-- ══════════════════════════════════════════════════════════════════════════════
-- INDICATEURS DE PERFORMANCE (KPIs reproducteurs)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS perf (
  id                      SERIAL PRIMARY KEY,
  exploitation_id         UUID REFERENCES exploitations(id) ON DELETE CASCADE NOT NULL,
  lapin_id                INTEGER REFERENCES lapins(id) ON DELETE CASCADE,
  periode                 DATE NOT NULL,
  taux_fertilite          NUMERIC(5,2),
  taille_portee_moyenne   NUMERIC(5,2),
  poids_sevrage_moyen     NUMERIC(6,3),
  intervalle_mises_bas    INTEGER,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exploitation_id, lapin_id, periode)
);
CREATE INDEX IF NOT EXISTS idx_perf_exploitation ON perf(exploitation_id);
CREATE INDEX IF NOT EXISTS idx_perf_lapin        ON perf(lapin_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- LEGAL CONSENTS (historique complet des acceptations ToS/Privacy)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS legal_consents (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('terms','privacy','both')),
  version         VARCHAR(10) NOT NULL,
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  accepted        BOOLEAN DEFAULT TRUE,
  accepted_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consents_user ON legal_consents(user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS (in-app)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  exploitation_id UUID REFERENCES exploitations(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL,
  titre           VARCHAR(200) NOT NULL,
  message         TEXT,
  lu              BOOLEAN DEFAULT FALSE,
  lu_at           TIMESTAMPTZ,
  data            JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user   ON notifications(user_id, lu);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIGGER : updated_at automatique
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'exploitations','users','lapins','suivis',
    'pathologies','accouplements'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || t || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t
      );
    END IF;
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED : super admin par défaut + first exploitation
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO exploitations (id, nom, description, pays)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Orycto Platform',
  'Exploitation système — super administration',
  'Madagascar'
) ON CONFLICT DO NOTHING;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('⏳ Running migrations v2...');
    await client.query(SQL);
    console.log('✅ Migrations v2 complete\n');
    console.log('📋 Tables créées :');
    const res = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
    );
    res.rows.forEach(r => console.log('   •', r.tablename));
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
