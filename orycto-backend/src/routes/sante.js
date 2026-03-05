import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);

// ── Soins ─────────────────────────────────────────────────────────────────────

// GET /api/sante
router.get('/', async (req, res) => {
  try {
    const { statut } = req.query;
    let sql    = 'SELECT * FROM soins WHERE user_id = $1';
    const params = [req.user.id];

    if (statut) { sql += ' AND statut = $2'; params.push(statut); }
    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sante
router.post('/', async (req, res) => {
  try {
    const {
      lapin_id, tag_lapin, nom_lapin, type_soin,
      nom_traitement, date_debut, date_fin, statut, notes,
    } = req.body;

    if (!nom_traitement) {
      return res.status(400).json({ error: 'nom_traitement is required' });
    }

    const result = await query(
      `INSERT INTO soins
         (lapin_id, tag_lapin, nom_lapin, type_soin, nom_traitement,
          date_debut, date_fin, statut, notes, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [lapin_id || null, tag_lapin || null, nom_lapin || null,
       type_soin || 'autre', nom_traitement,
       date_debut || null, date_fin || null,
       statut || 'planifie', notes || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sante/:id
router.put('/:id', async (req, res) => {
  try {
    const { statut, date_fin, notes } = req.body;
    const result = await query(
      `UPDATE soins SET
         statut   = COALESCE($1, statut),
         date_fin = COALESCE($2, date_fin),
         notes    = COALESCE($3, notes)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [statut || null, date_fin || null, notes || null, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sante/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM soins WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Record not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Pathologies ───────────────────────────────────────────────────────────────

// GET /api/sante/pathologies
router.get('/pathologies', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM pathologies WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sante/pathologies
router.post('/pathologies', async (req, res) => {
  try {
    const { lapin_id, tag_lapin, description, severite, statut } = req.body;
    if (!description) return res.status(400).json({ error: 'description is required' });

    const result = await query(
      `INSERT INTO pathologies (lapin_id, tag_lapin, description, severite, statut, user_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [lapin_id || null, tag_lapin || null, description,
       severite || 'modere', statut || 'en_cours', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sante/pathologies/:id
router.delete('/pathologies/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM pathologies WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Record not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
