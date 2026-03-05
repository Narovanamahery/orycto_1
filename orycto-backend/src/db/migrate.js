import { pool } from './pool.js';
import 'dotenv/config';

const SQL = `

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  role          VARCHAR(100) DEFAULT 'Farm Owner',
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Sessions (connect-pg-simple) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session (
  sid    VARCHAR      NOT NULL PRIMARY KEY,
  sess   JSON         NOT NULL,
  expire TIMESTAMPTZ  NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- ─── Races ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS races (
  id          SERIAL PRIMARY KEY,
  nom         VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Cages ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cages (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(20) UNIQUE NOT NULL,
  type        VARCHAR(50),
  capacite    INTEGER DEFAULT 1,
  localisation VARCHAR(100),
  statut      VARCHAR(20) DEFAULT 'libre' CHECK (statut IN ('libre','occupee','maintenance')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Lapins ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lapins (
  id                 SERIAL PRIMARY KEY,
  identifiant_unique VARCHAR(50) UNIQUE NOT NULL,
  nom                VARCHAR(100),
  sexe               CHAR(1) NOT NULL CHECK (sexe IN ('M','F')),
  date_naissance     DATE,
  race               VARCHAR(100),
  poids_actuel       NUMERIC(6,3),
  cage               VARCHAR(20),
  statut             VARCHAR(20) DEFAULT 'actif'
                     CHECK (statut IN ('actif','gestante','allaitante','malade','vendu','mort')),
  tag_mere           VARCHAR(50),
  tag_pere           VARCHAR(50),
  notes              TEXT,
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lapins_user   ON lapins(user_id);
CREATE INDEX IF NOT EXISTS idx_lapins_statut ON lapins(statut);

-- ─── Soins / Traitements ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS soins (
  id              SERIAL PRIMARY KEY,
  lapin_id        INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  tag_lapin       VARCHAR(50),
  nom_lapin       VARCHAR(100),
  type_soin       VARCHAR(50) DEFAULT 'autre'
                  CHECK (type_soin IN ('vaccin','medicament','antiparasitaire','vitamine','autre')),
  nom_traitement  VARCHAR(200) NOT NULL,
  date_debut      DATE,
  date_fin        DATE,
  statut          VARCHAR(20) DEFAULT 'planifie'
                  CHECK (statut IN ('planifie','en_cours','termine','en_retard')),
  notes           TEXT,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_soins_user   ON soins(user_id);
CREATE INDEX IF NOT EXISTS idx_soins_statut ON soins(statut);

-- ─── Pathologies ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pathologies (
  id              SERIAL PRIMARY KEY,
  lapin_id        INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  tag_lapin       VARCHAR(50),
  description     TEXT NOT NULL,
  severite        VARCHAR(20) DEFAULT 'modere'
                  CHECK (severite IN ('leger','modere','severe')),
  statut          VARCHAR(20) DEFAULT 'en_cours'
                  CHECK (statut IN ('en_cours','stable','gueri')),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Accouplements ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accouplements (
  id                     SERIAL PRIMARY KEY,
  tag_male               VARCHAR(50),
  tag_female             VARCHAR(50),
  lapin_male_id          INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  lapin_female_id        INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  date_accouplement      DATE NOT NULL,
  date_naissance_prevue  DATE,
  date_naissance_reelle  DATE,
  statut                 VARCHAR(20) DEFAULT 'planifie'
                         CHECK (statut IN ('planifie','en_attente','succes','echec')),
  notes                  TEXT,
  user_id                UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_acco_user ON accouplements(user_id);

-- ─── Portées ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portees (
  id                      SERIAL PRIMARY KEY,
  accouplement_id         INTEGER REFERENCES accouplements(id) ON DELETE SET NULL,
  tag_male                VARCHAR(50),
  date_naissance          DATE NOT NULL,
  nombre_nes              INTEGER DEFAULT 0,
  nombre_vivants          INTEGER DEFAULT 0,
  poids_moyen_naissance   NUMERIC(6,1),
  notes                   TEXT,
  user_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Aliments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aliments (
  id            SERIAL PRIMARY KEY,
  nom           VARCHAR(100) NOT NULL,
  unite_mesure  VARCHAR(10) DEFAULT 'kg',
  description   TEXT,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Stocks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stocks (
  id               SERIAL PRIMARY KEY,
  aliment_id       INTEGER REFERENCES aliments(id) ON DELETE CASCADE,
  quantite         NUMERIC(10,3) DEFAULT 0,
  seuil_alerte     NUMERIC(10,3) DEFAULT 0,
  date_expiration  DATE,
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stocks_aliment_user ON stocks(aliment_id, user_id);

-- ─── Distributions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS distributions (
  id          SERIAL PRIMARY KEY,
  aliment_id  INTEGER REFERENCES aliments(id) ON DELETE SET NULL,
  nom_aliment VARCHAR(100),
  lapin_id    INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  tag_lapin   VARCHAR(50),
  quantite    NUMERIC(8,3) NOT NULL,
  date_dist   DATE DEFAULT CURRENT_DATE,
  notes       TEXT,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dist_user ON distributions(user_id);

-- ─── Événements ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evenements (
  id              SERIAL PRIMARY KEY,
  lapin_id        INTEGER REFERENCES lapins(id) ON DELETE SET NULL,
  nom_lapin       VARCHAR(100),
  tag_lapin       VARCHAR(50),
  type_evenement  VARCHAR(50),
  titre           VARCHAR(200),
  description     TEXT,
  date_evenement  DATE DEFAULT CURRENT_DATE,
  montant         NUMERIC(12,2),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Coûts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couts (
  id            SERIAL PRIMARY KEY,
  type_depense  VARCHAR(100) NOT NULL,
  montant       NUMERIC(12,2) NOT NULL,
  date_cout     DATE DEFAULT CURRENT_DATE,
  description   TEXT,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── updated_at auto-trigger ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','lapins','soins','pathologies','accouplements'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || t || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t
      );
    END IF;
  END LOOP;
END $$;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('⏳ Running migrations...');
    await client.query(SQL);
    console.log('✅ Migrations complete');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
