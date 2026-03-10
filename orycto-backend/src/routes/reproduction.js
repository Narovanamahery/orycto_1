import { Router } from 'express';
import { requireAuth, requireExploitation } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);
router.use(requireExploitation);

const eid = req => req.user.exploitation_id;

// ── IMPORTANT: routes statiques AVANT routes paramétrées (:id) ───────────────

// ── Portées (statique → doit être AVANT /:id) ────────────────────────────────

// GET /api/reproduction/portees
router.get('/portees', async (req, res) => {
  try {
    const r = await query(
      `SELECT p.*,
              m.identifiant_unique AS tag_male,
              f.identifiant_unique AS tag_female
       FROM portees p
       LEFT JOIN accouplements a ON a.id=p.accouplement_id
       LEFT JOIN lapins m ON m.id=a.male_id
       LEFT JOIN lapins f ON f.id=a.femelle_id
       WHERE p.exploitation_id=$1
       ORDER BY p.date_naissance DESC`,
      [eid(req)]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/reproduction/portees
router.post('/portees', async (req, res) => {
  try {
    const { accouplement_id, date_naissance, nombre_nes,
            nombre_vivants, nombre_morts, poids_moyen_naissance } = req.body;
    if (!date_naissance) return res.status(400).json({ error: 'date_naissance requis' });

    const r = await query(
      `INSERT INTO portees
         (exploitation_id,accouplement_id,date_naissance,nombre_nes,
          nombre_vivants,nombre_morts,poids_moyen_naissance,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [eid(req), accouplement_id||null, date_naissance,
       nombre_nes||0,
       nombre_vivants!=null ? nombre_vivants : nombre_nes||0,
       nombre_morts||0,
       poids_moyen_naissance||null,
       req.user.id]
    );

    if (accouplement_id) {
      await query(
        `UPDATE accouplements SET statut='succes' WHERE id=$1 AND exploitation_id=$2`,
        [accouplement_id, eid(req)]
      );
    }

    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/reproduction/portees/:id
router.delete('/portees/:id', async (req, res) => {
  try {
    const r = await query(
      'DELETE FROM portees WHERE id=$1 AND exploitation_id=$2 RETURNING id',
      [req.params.id, eid(req)]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Portée introuvable' });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Accouplements ─────────────────────────────────────────────────────────────

// GET /api/reproduction
router.get('/', async (req, res) => {
  try {
    const r = await query(
      `SELECT a.*,
              m.identifiant_unique AS tag_male,
              f.identifiant_unique AS tag_female,
              m.nom AS nom_male, f.nom AS nom_female
       FROM accouplements a
       LEFT JOIN lapins m ON m.id=a.male_id
       LEFT JOIN lapins f ON f.id=a.femelle_id
       WHERE a.exploitation_id=$1
       ORDER BY a.date_accouplement DESC`,
      [eid(req)]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/reproduction
// Accepte: male_id+femelle_id (préféré) OU tag_male+tag_female (résolution auto)
// Accepte: date_mise_bas_prevue OU date_naissance_prevue (compat. frontend)
router.post('/', async (req, res) => {
  try {
    let { male_id, femelle_id, tag_male, tag_female,
          date_accouplement, date_mise_bas_prevue, date_naissance_prevue,
          statut, notes } = req.body;

    if (!date_accouplement)
      return res.status(400).json({ error: 'date_accouplement est requis' });

    // Résoudre tag → id si les ids ne sont pas fournis
    if (!male_id && tag_male) {
      const r = await query(
        'SELECT id FROM lapins WHERE identifiant_unique=$1 AND exploitation_id=$2',
        [tag_male, eid(req)]
      );
      if (!r.rows.length) return res.status(404).json({ error: `Mâle introuvable: ${tag_male}` });
      male_id = r.rows[0].id;
    }
    if (!femelle_id && tag_female) {
      const r = await query(
        'SELECT id FROM lapins WHERE identifiant_unique=$1 AND exploitation_id=$2',
        [tag_female, eid(req)]
      );
      if (!r.rows.length) return res.status(404).json({ error: `Femelle introuvable: ${tag_female}` });
      femelle_id = r.rows[0].id;
    }

    if (!male_id || !femelle_id)
      return res.status(400).json({ error: 'male_id/tag_male et femelle_id/tag_female requis' });

    const datePrevue = date_mise_bas_prevue || date_naissance_prevue || null;

    const r = await query(
      `INSERT INTO accouplements
         (exploitation_id,male_id,femelle_id,date_accouplement,
          date_mise_bas_prevue,statut,notes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [eid(req), male_id, femelle_id, date_accouplement,
       datePrevue, statut||'planifie', notes||null, req.user.id]
    );

    // Enrichir la réponse avec les tags
    const row = r.rows[0];
    res.status(201).json({
      ...row,
      tag_male:   tag_male   || null,
      tag_female: tag_female || null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/reproduction/:id
router.put('/:id', async (req, res) => {
  try {
    const { statut, date_mise_bas_reelle, date_naissance_reelle, notes } = req.body;
    const dateMiseBas = date_mise_bas_reelle || date_naissance_reelle || null;
    const r = await query(
      `UPDATE accouplements SET
         statut               =COALESCE($1,statut),
         date_mise_bas_reelle =COALESCE($2,date_mise_bas_reelle),
         notes                =COALESCE($3,notes)
       WHERE id=$4 AND exploitation_id=$5 RETURNING *`,
      [statut||null, dateMiseBas, notes||null, req.params.id, eid(req)]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Accouplement introuvable' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/reproduction/:id
router.delete('/:id', async (req, res) => {
  try {
    const r = await query(
      'DELETE FROM accouplements WHERE id=$1 AND exploitation_id=$2 RETURNING id',
      [req.params.id, eid(req)]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Accouplement introuvable' });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/reproduction/:id/naissance
router.post('/:id/naissance', async (req, res) => {
  try {
    const { date_naissance, nombre_nes, nombre_vivants, nombre_morts, poids_moyen_naissance } = req.body;
    if (!date_naissance) return res.status(400).json({ error: 'date_naissance requis' });

    const acco = await query(
      'SELECT * FROM accouplements WHERE id=$1 AND exploitation_id=$2',
      [req.params.id, eid(req)]
    );
    if (!acco.rows.length) return res.status(404).json({ error: 'Accouplement introuvable' });

    const [updated, portee] = await Promise.all([
      query(
        `UPDATE accouplements SET statut='succes',date_mise_bas_reelle=$1 WHERE id=$2 RETURNING *`,
        [date_naissance, req.params.id]
      ),
      query(
        `INSERT INTO portees
           (exploitation_id,accouplement_id,date_naissance,nombre_nes,
            nombre_vivants,nombre_morts,poids_moyen_naissance,created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [eid(req), req.params.id, date_naissance,
         nombre_nes||0,
         nombre_vivants!=null ? nombre_vivants : nombre_nes||0,
         nombre_morts||0,
         poids_moyen_naissance||null,
         req.user.id]
      ),
    ]);

    res.status(201).json({ accouplement: updated.rows[0], portee: portee.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
