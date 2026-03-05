import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);

// GET /api/lapins
router.get('/', async (req, res) => {
  try {
    const { search, statut, sexe } = req.query;
    let sql    = 'SELECT * FROM lapins WHERE user_id = $1';
    const params = [req.user.id];
    let i = 2;

    if (search) {
      sql += ` AND (identifiant_unique ILIKE $${i} OR nom ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }
    if (statut) { sql += ` AND statut = $${i}`; params.push(statut); i++; }
    if (sexe)   { sql += ` AND sexe   = $${i}`; params.push(sexe);   i++; }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);

    // Map identifiant_unique → tag for frontend compatibility
    const rows = result.rows.map(r => ({ ...r, tag: r.identifiant_unique }));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lapins/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM lapins WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rabbit not found' });
    const r = result.rows[0];
    res.json({ ...r, tag: r.identifiant_unique });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lapins
router.post('/', async (req, res) => {
  try {
    const {
      tag, identifiant_unique, nom, sexe,
      date_naissance, race, poids_actuel,
      cage, statut, tag_mere, tag_pere, notes,
    } = req.body;

    const uid = tag || identifiant_unique;
    if (!uid || !sexe) {
      return res.status(400).json({ error: 'identifiant_unique and sexe are required' });
    }

    const result = await query(
      `INSERT INTO lapins
         (identifiant_unique, nom, sexe, date_naissance, race,
          poids_actuel, cage, statut, tag_mere, tag_pere, notes, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [uid, nom || uid, sexe, date_naissance || null, race || null,
       poids_actuel || null, cage || null, statut || 'actif',
       tag_mere || null, tag_pere || null, notes || null, req.user.id]
    );
    const r = result.rows[0];
    res.status(201).json({ ...r, tag: r.identifiant_unique });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Tag ID already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/lapins/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      tag, identifiant_unique, nom, sexe,
      date_naissance, race, poids_actuel,
      cage, statut, tag_mere, tag_pere, notes,
    } = req.body;

    const uid = tag || identifiant_unique;

    const result = await query(
      `UPDATE lapins SET
         identifiant_unique = COALESCE($1, identifiant_unique),
         nom                = COALESCE($2, nom),
         sexe               = COALESCE($3, sexe),
         date_naissance     = $4,
         race               = $5,
         poids_actuel       = $6,
         cage               = $7,
         statut             = COALESCE($8, statut),
         tag_mere           = $9,
         tag_pere           = $10,
         notes              = $11
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [uid || null, nom || null, sexe || null,
       date_naissance || null, race || null,
       poids_actuel || null, cage || null,
       statut || null, tag_mere || null,
       tag_pere || null, notes || null,
       req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rabbit not found' });
    const r = result.rows[0];
    res.json({ ...r, tag: r.identifiant_unique });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lapins/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM lapins WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rabbit not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
