import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db/pool.js';

import authRouter         from './routes/auth.js';
import adminRouter        from './routes/admin.js';
import legalRouter        from './routes/legal.js';
import lapinsRouter       from './routes/lapins.js';
import santeRouter        from './routes/sante.js';
import reproductionRouter from './routes/reproduction.js';
import alimentationRouter from './routes/alimentation.js';
import dashboardRouter    from './routes/dashboard.js';
import miscRouter         from './routes/misc.js';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({ pool, tableName: 'session', createTableIfMissing: false }),
  secret:            process.env.SESSION_SECRET || 'orycto_dev_secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   parseInt(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
}));

// ── Routes publiques ──────────────────────────────────────────────────────────
app.use('/api/auth',  authRouter);
app.use('/api/legal', legalRouter);

// ── Super Admin (AVANT /api générique pour éviter conflits) ───────────────────
app.use('/api/admin', adminRouter);

// ── Routes exploitation (auth + exploitation requis) ──────────────────────────
app.use('/api/lapins',       lapinsRouter);
app.use('/api/sante',        santeRouter);
app.use('/api/reproduction', reproductionRouter);
app.use('/api/alimentation', alimentationRouter);
app.use('/api/dashboard',    dashboardRouter);

// misc = evenements, couts, races, cages, perf
app.use('/api', miscRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Route introuvable' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

app.listen(PORT, () => {
  console.log(`\n🐇 Orycto API v2 — http://localhost:${PORT}`);
  console.log(`   NODE_ENV : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DB       : ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`   Client   : ${process.env.CLIENT_ORIGIN}`);
  console.log(`\n   1er démarrage → POST /api/auth/init-super-admin\n`);
});

export default app;
