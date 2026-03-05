import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);

// ── Événements ────────────────────────────────────────────────────────────────

// GET /api/evenements
router.get('/evenements', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM evenements WHERE user_id = $1 ORDER BY date_evenement DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/evenements
router.post('/evenements', async (req, res) => {
  try {
    const {
      lapin_id, nom_lapin, tag_lapin,
      type_evenement, titre, description,
      date_evenement, montant,
    } = req.body;

    if (!titre) return res.status(400).json({ error: 'titre is required' });

    const result = await query(
      `INSERT INTO evenements
         (lapin_id, nom_lapin, tag_lapin, type_evenement, titre,
          description, date_evenement, montant, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [lapin_id || null, nom_lapin || null, tag_lapin || null,
       type_evenement || null, titre, description || null,
       date_evenement || new Date().toISOString().slice(0, 10),
       montant || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/evenements/:id
router.put('/evenements/:id', async (req, res) => {
  try {
    const { titre, description, date_evenement, montant } = req.body;
    const result = await query(
      `UPDATE evenements SET
         titre          = COALESCE($1, titre),
         description    = COALESCE($2, description),
         date_evenement = COALESCE($3, date_evenement),
         montant        = COALESCE($4, montant)
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [titre || null, description || null,
       date_evenement || null, montant || null,
       req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/evenements/:id
router.delete('/evenements/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM evenements WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Coûts ─────────────────────────────────────────────────────────────────────

// GET /api/couts
router.get('/couts', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM couts WHERE user_id = $1 ORDER BY date_cout DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/couts
router.post('/couts', async (req, res) => {
  try {
    const { type_depense, montant, date_cout, description } = req.body;
    if (!type_depense || !montant) {
      return res.status(400).json({ error: 'type_depense and montant are required' });
    }
    const result = await query(
      `INSERT INTO couts (type_depense, montant, date_cout, description, user_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [type_depense, montant,
       date_cout || new Date().toISOString().slice(0, 10),
       description || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/couts/:id
router.delete('/couts/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM couts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Cost not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
