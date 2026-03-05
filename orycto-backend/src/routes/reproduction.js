import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);

// ── Accouplements ─────────────────────────────────────────────────────────────

// GET /api/reproduction
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM accouplements WHERE user_id = $1 ORDER BY date_accouplement DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reproduction
router.post('/', async (req, res) => {
  try {
    const {
      tag_male, tag_female,
      lapin_male_id, lapin_female_id,
      date_accouplement, date_naissance_prevue, statut, notes,
    } = req.body;

    if (!tag_male || !tag_female || !date_accouplement) {
      return res.status(400).json({ error: 'tag_male, tag_female and date_accouplement are required' });
    }

    const result = await query(
      `INSERT INTO accouplements
         (tag_male, tag_female, lapin_male_id, lapin_female_id,
          date_accouplement, date_naissance_prevue, statut, notes, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [tag_male, tag_female,
       lapin_male_id   || null,
       lapin_female_id || null,
       date_accouplement,
       date_naissance_prevue || null,
       statut || 'planifie',
       notes  || null,
       req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/reproduction/:id
router.put('/:id', async (req, res) => {
  try {
    const { statut, date_naissance_reelle, notes } = req.body;
    const result = await query(
      `UPDATE accouplements SET
         statut                 = COALESCE($1, statut),
         date_naissance_reelle  = COALESCE($2, date_naissance_reelle),
         notes                  = COALESCE($3, notes)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [statut || null, date_naissance_reelle || null, notes || null,
       req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reproduction/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM accouplements WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Record not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reproduction/:id/naissance — enregistre la naissance + marque succès
router.post('/:id/naissance', async (req, res) => {
  try {
    const { date_naissance, nombre_nes, nombre_vivants, poids_moyen_naissance } = req.body;

    const acco = await query(
      'SELECT * FROM accouplements WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!acco.rows.length) return res.status(404).json({ error: 'Mating not found' });

    const updated = await query(
      `UPDATE accouplements SET
         statut = 'succes',
         date_naissance_reelle = $1
       WHERE id = $2 RETURNING *`,
      [date_naissance, req.params.id]
    );

    const portee = await query(
      `INSERT INTO portees
         (accouplement_id, tag_male, date_naissance, nombre_nes,
          nombre_vivants, poids_moyen_naissance, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id,
       acco.rows[0].tag_male,
       date_naissance,
       nombre_nes        || 0,
       nombre_vivants    || nombre_nes || 0,
       poids_moyen_naissance || null,
       req.user.id]
    );

    res.status(201).json({ accouplement: updated.rows[0], portee: portee.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Portées ───────────────────────────────────────────────────────────────────

// GET /api/reproduction/portees
router.get('/portees', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM portees WHERE user_id = $1 ORDER BY date_naissance DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reproduction/portees
router.post('/portees', async (req, res) => {
  try {
    const {
      accouplement_id, tag_male, date_naissance,
      nombre_nes, nombre_vivants, poids_moyen_naissance,
    } = req.body;

    if (!date_naissance) return res.status(400).json({ error: 'date_naissance is required' });

    const result = await query(
      `INSERT INTO portees
         (accouplement_id, tag_male, date_naissance, nombre_nes,
          nombre_vivants, poids_moyen_naissance, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [accouplement_id || null, tag_male || null, date_naissance,
       nombre_nes || 0, nombre_vivants || nombre_nes || 0,
       poids_moyen_naissance || null, req.user.id]
    );

    if (accouplement_id) {
      await query(
        `UPDATE accouplements SET statut = 'succes' WHERE id = $1 AND user_id = $2`,
        [accouplement_id, req.user.id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reproduction/portees/:id
router.delete('/portees/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM portees WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Record not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
