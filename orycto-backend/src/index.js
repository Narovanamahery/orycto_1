import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db/pool.js';

import authRouter          from './routes/auth.js';
import lapinsRouter        from './routes/lapins.js';
import santeRouter         from './routes/sante.js';
import reproductionRouter  from './routes/reproduction.js';
import alimentationRouter  from './routes/alimentation.js';
import dashboardRouter     from './routes/dashboard.js';
import miscRouter          from './routes/misc.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Sessions (PostgreSQL store) ───────────────────────────────────────────────
const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: false,
  }),
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

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRouter);
app.use('/api/lapins',        lapinsRouter);
app.use('/api/sante',         santeRouter);
app.use('/api/reproduction',  reproductionRouter);
app.use('/api/alimentation',  alimentationRouter);
app.use('/api/dashboard',     dashboardRouter);
app.use('/api',               miscRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🐇 Orycto API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database    : ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`   Client      : ${process.env.CLIENT_ORIGIN}\n`);
});

export default app;
