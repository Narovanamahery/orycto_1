import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);

// ── Aliments ──────────────────────────────────────────────────────────────────

// GET /api/alimentation/aliments
router.get('/aliments', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aliments WHERE user_id = $1 ORDER BY nom',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alimentation/aliments
router.post('/aliments', async (req, res) => {
  try {
    const { nom, unite_mesure, description } = req.body;
    if (!nom) return res.status(400).json({ error: 'nom is required' });

    const result = await query(
      `INSERT INTO aliments (nom, unite_mesure, description, user_id)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [nom, unite_mesure || 'kg', description || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/alimentation/aliments/:id
router.delete('/aliments/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM aliments WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Feed not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stocks ────────────────────────────────────────────────────────────────────

// GET /api/alimentation/stocks
router.get('/stocks', async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, a.nom, a.unite_mesure
       FROM stocks s
       JOIN aliments a ON a.id = s.aliment_id
       WHERE s.user_id = $1
       ORDER BY a.nom`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alimentation/stocks
router.post('/stocks', async (req, res) => {
  try {
    const { aliment_id, quantite, seuil_alerte, date_expiration } = req.body;
    if (!aliment_id) return res.status(400).json({ error: 'aliment_id is required' });

    const result = await query(
      `INSERT INTO stocks (aliment_id, quantite, seuil_alerte, date_expiration, user_id)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (aliment_id, user_id)
       DO UPDATE SET
         quantite        = stocks.quantite + EXCLUDED.quantite,
         seuil_alerte    = COALESCE(EXCLUDED.seuil_alerte, stocks.seuil_alerte),
         date_expiration = COALESCE(EXCLUDED.date_expiration, stocks.date_expiration),
         updated_at      = NOW()
       RETURNING *`,
      [aliment_id, quantite || 0, seuil_alerte || 0, date_expiration || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/alimentation/stocks/:id
router.put('/stocks/:id', async (req, res) => {
  try {
    const { quantite, seuil_alerte, date_expiration } = req.body;
    const result = await query(
      `UPDATE stocks SET
         quantite        = COALESCE($1, quantite),
         seuil_alerte    = COALESCE($2, seuil_alerte),
         date_expiration = COALESCE($3, date_expiration),
         updated_at      = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [quantite ?? null, seuil_alerte ?? null, date_expiration || null,
       req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Stock not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alimentation/stocks/restock  (legacy endpoint)
router.post('/stocks/restock', async (req, res) => {
  try {
    const { aliment_id, quantite, date_expiration } = req.body;
    if (!aliment_id || !quantite) {
      return res.status(400).json({ error: 'aliment_id and quantite are required' });
    }

    const result = await query(
      `INSERT INTO stocks (aliment_id, quantite, seuil_alerte, date_expiration, user_id)
       VALUES ($1,$2,0,$3,$4)
       ON CONFLICT (aliment_id, user_id)
       DO UPDATE SET
         quantite        = stocks.quantite + $2,
         date_expiration = COALESCE($3, stocks.date_expiration),
         updated_at      = NOW()
       RETURNING *`,
      [aliment_id, quantite, date_expiration || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/alimentation/stocks/:id
router.delete('/stocks/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM stocks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Stock not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Distributions ─────────────────────────────────────────────────────────────

// GET /api/alimentation/distributions
router.get('/distributions', async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, a.nom AS nom_aliment_ref, a.unite_mesure
       FROM distributions d
       LEFT JOIN aliments a ON a.id = d.aliment_id
       WHERE d.user_id = $1
       ORDER BY d.date_dist DESC, d.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alimentation/distributions
router.post('/distributions', async (req, res) => {
  try {
    const {
      aliment_id, nom_aliment, lapin_id,
      tag_lapin, quantite, date_dist, notes,
    } = req.body;

    if (!aliment_id || !quantite) {
      return res.status(400).json({ error: 'aliment_id and quantite are required' });
    }

    const result = await query(
      `INSERT INTO distributions
         (aliment_id, nom_aliment, lapin_id, tag_lapin, quantite, date_dist, notes, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [aliment_id, nom_aliment || null, lapin_id || null,
       tag_lapin || null, quantite,
       date_dist || new Date().toISOString().slice(0, 10),
       notes || null, req.user.id]
    );

    // Decrement stock automatically
    await query(
      `UPDATE stocks SET
         quantite   = GREATEST(0, quantite - $1),
         updated_at = NOW()
       WHERE aliment_id = $2 AND user_id = $3`,
      [quantite, aliment_id, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/alimentation/distributions/:id
router.delete('/distributions/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM distributions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Record not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
