import { Router } from 'express';
import { requireAuth, requireExploitation } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);
router.use(requireExploitation);

// GET /api/lapins
router.get('/', async (req, res) => {
  try {
    const { search, statut, sexe } = req.query;
    let sql = 'SELECT * FROM lapins WHERE exploitation_id = $1';
    const params = [req.user.exploitation_id];
    let i = 2;

    if (search) {
      sql += ` AND (identifiant_unique ILIKE $${i} OR nom ILIKE $${i})`;
      params.push(`%${search}%`); i++;
    }
    if (statut) { sql += ` AND statut = $${i}`; params.push(statut); i++; }
    if (sexe)   { sql += ` AND sexe   = $${i}`; params.push(sexe);   i++; }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    const rows = result.rows.map(r => ({
      ...r,
      tag:  r.identifiant_unique,
      race: r.race_libre || r.race_id,
    }));
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
      'SELECT * FROM lapins WHERE id = $1 AND exploitation_id = $2',
      [req.params.id, req.user.exploitation_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rabbit not found' });
    const r = result.rows[0];
    res.json({ ...r, tag: r.identifiant_unique, race: r.race_libre || r.race_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lapins
router.post('/', async (req, res) => {
  try {
    const {
      tag, identifiant_unique, nom, sexe,
      date_naissance, race, race_id, poids_actuel,
      cage, cage_id, statut,
      tag_mere, tag_pere, mere_id, pere_id, notes,
    } = req.body;

    const uid  = tag || identifiant_unique;
    const cid  = cage_id || null;
    const mid  = mere_id  || null;
    const pid  = pere_id  || null;
    const rid  = race_id  || null;

    if (!uid || !sexe) {
      return res.status(400).json({ error: 'identifiant_unique et sexe sont requis' });
    }

    const result = await query(
      `INSERT INTO lapins
         (exploitation_id, identifiant_unique, nom, sexe, date_naissance,
          race_id, race_libre, poids_actuel, cage_id, statut,
          mere_id, pere_id, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        req.user.exploitation_id,
        uid, nom || uid, sexe,
        date_naissance || null,
        rid, race || null,
        poids_actuel || null,
        cid, statut || 'actif',
        mid, pid,
        notes || null,
        req.user.id,
      ]
    );
    const r = result.rows[0];
    res.status(201).json({ ...r, tag: r.identifiant_unique, race: r.race_libre || r.race_id });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Identifiant déjà utilisé' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/lapins/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      tag, identifiant_unique, nom, sexe,
      date_naissance, race, race_id, poids_actuel,
      cage, cage_id, statut,
      mere_id, pere_id, notes,
    } = req.body;

    const uid = tag || identifiant_unique || null;

    const result = await query(
      `UPDATE lapins SET
         identifiant_unique = COALESCE($1,  identifiant_unique),
         nom                = COALESCE($2,  nom),
         sexe               = COALESCE($3,  sexe),
         date_naissance     = COALESCE($4,  date_naissance),
         race_id            = COALESCE($5,  race_id),
         race_libre         = COALESCE($6,  race_libre),
         poids_actuel       = COALESCE($7,  poids_actuel),
         cage_id            = COALESCE($8,  cage_id),
         statut             = COALESCE($9,  statut),
         mere_id            = COALESCE($10, mere_id),
         pere_id            = COALESCE($11, pere_id),
         notes              = COALESCE($12, notes),
         updated_by         = $13
       WHERE id = $14 AND exploitation_id = $15
       RETURNING *`,
      [
        uid, nom || null, sexe || null,
        date_naissance || null,
        race_id || null, race || null,
        poids_actuel || null,
        cage_id || null,
        statut || null,
        mere_id || null, pere_id || null,
        notes || null,
        req.user.id,
        req.params.id, req.user.exploitation_id,
      ]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Lapin introuvable' });
    const r = result.rows[0];
    res.json({ ...r, tag: r.identifiant_unique, race: r.race_libre || r.race_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lapins/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM lapins WHERE id = $1 AND exploitation_id = $2 RETURNING id',
      [req.params.id, req.user.exploitation_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Lapin introuvable' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
