import { Router } from 'express';
import { requireAuth, requireExploitation } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);
router.use(requireExploitation);

const eid = req => req.user.exploitation_id;

// Helper: résoudre tag_lapin → lapin_id
async function resolveRabbit(tag, exploitationId) {
  if (!tag) return null;
  const r = await query(
    'SELECT id FROM lapins WHERE identifiant_unique=$1 AND exploitation_id=$2',
    [tag, exploitationId]
  );
  return r.rows[0]?.id || null;
}

// ── IMPORTANT: routes statiques AVANT /:id ────────────────────────────────────

// GET /api/sante/pathologies
router.get('/pathologies', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, l.identifiant_unique AS tag_lapin, l.nom AS nom_lapin
       FROM pathologies p
       LEFT JOIN lapins l ON l.id = p.lapin_id
       WHERE p.exploitation_id = $1
       ORDER BY p.created_at DESC`,
      [eid(req)]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/sante/pathologies
// Accepte: lapin_id OU tag_lapin (résolution auto)
// Accepte: symptomes OU description (compat. frontend)
router.post('/pathologies', async (req, res) => {
  try {
    const { lapin_id, tag_lapin, symptomes, description,
            gravite, severite, statut, date_debut, diagnostic, notes } = req.body;

    const symptomesVal = symptomes || description;
    if (!symptomesVal) return res.status(400).json({ error: 'symptomes est requis' });

    const lid = lapin_id || await resolveRabbit(tag_lapin, eid(req));

    const result = await query(
      `INSERT INTO pathologies
         (exploitation_id, lapin_id, symptomes, diagnostic,
          gravite, statut, date_debut, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        eid(req),
        lid,
        symptomesVal,
        diagnostic || null,
        gravite || severite || 'moderee',
        statut || 'active',
        date_debut || new Date().toISOString().slice(0,10),
        notes || null,
        req.user.id,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/sante/pathologies/:id
router.put('/pathologies/:id', async (req, res) => {
  try {
    const { statut, date_fin, diagnostic, notes } = req.body;
    const result = await query(
      `UPDATE pathologies SET
         statut     = COALESCE($1, statut),
         date_fin   = COALESCE($2, date_fin),
         diagnostic = COALESCE($3, diagnostic),
         notes      = COALESCE($4, notes)
       WHERE id = $5 AND exploitation_id = $6
       RETURNING *`,
      [statut||null, date_fin||null, diagnostic||null,
       notes||null, req.params.id, eid(req)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Pathologie introuvable' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/sante/pathologies/:id
router.delete('/pathologies/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM pathologies WHERE id = $1 AND exploitation_id = $2 RETURNING id',
      [req.params.id, eid(req)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Pathologie introuvable' });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/sante/traitements
router.get('/traitements', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM traitements WHERE exploitation_id = $1 ORDER BY nom',
      [eid(req)]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/sante/traitements
router.post('/traitements', async (req, res) => {
  try {
    const { nom, type, description, frequence_jours, delai_attente_jours, dose_standard } = req.body;
    if (!nom) return res.status(400).json({ error: 'nom est requis' });
    const result = await query(
      `INSERT INTO traitements
         (exploitation_id, nom, type, description,
          frequence_jours, delai_attente_jours, dose_standard)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [eid(req), nom, type||'autre', description||null,
       frequence_jours||null, delai_attente_jours||null, dose_standard||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/sante/traitements/:id
router.delete('/traitements/:id', async (req, res) => {
  try {
    await query(
      'DELETE FROM traitements WHERE id = $1 AND exploitation_id = $2',
      [req.params.id, eid(req)]
    );
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Suivis ────────────────────────────────────────────────────────────────────

// GET /api/sante
router.get('/', async (req, res) => {
  try {
    const { statut } = req.query;
    let sql = `
      SELECT s.*, l.identifiant_unique AS tag_lapin, l.nom AS nom_lapin,
             t.nom AS nom_traitement_ref
      FROM suivis s
      LEFT JOIN lapins l      ON l.id = s.lapin_id
      LEFT JOIN traitements t ON t.id = s.traitement_id
      WHERE s.exploitation_id = $1
    `;
    const params = [eid(req)];
    if (statut) { sql += ' AND s.statut = $2'; params.push(statut); }
    sql += ' ORDER BY s.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows.map(r => ({
      ...r,
      nom_traitement: r.nom_traitement || r.nom_traitement_ref,
      code: `S-${String(r.id).padStart(4,'0')}`,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/sante
// Accepte: lapin_id OU tag_lapin (résolution auto)
// Accepte: date_administration OU date_debut (compat. frontend)
router.post('/', async (req, res) => {
  try {
    const {
      lapin_id, tag_lapin, traitement_id, nom_traitement, type_soin,
      date_debut, date_administration, date_fin,
      prochain_rappel, dose_administree, veterinaire,
      statut, notes,
    } = req.body;

    const dateAdmin = date_administration || date_debut;
    if (!dateAdmin) return res.status(400).json({ error: 'date_administration est requise' });

    const lid = lapin_id || await resolveRabbit(tag_lapin, eid(req));

    const result = await query(
      `INSERT INTO suivis
         (exploitation_id, lapin_id, traitement_id, nom_traitement, type_soin,
          date_administration, date_fin, prochain_rappel,
          dose_administree, veterinaire, statut, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        eid(req),
        lid,
        traitement_id||null,
        nom_traitement||null,
        type_soin||'autre',
        dateAdmin,
        date_fin||null,
        prochain_rappel||null,
        dose_administree||null,
        veterinaire||null,
        statut||'planifie',
        notes||null,
        req.user.id,
      ]
    );
    res.status(201).json({
      ...result.rows[0],
      code: `S-${String(result.rows[0].id).padStart(4,'0')}`,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/sante/:id
router.put('/:id', async (req, res) => {
  try {
    const { statut, date_fin, prochain_rappel, notes } = req.body;
    const result = await query(
      `UPDATE suivis SET
         statut          = COALESCE($1, statut),
         date_fin        = COALESCE($2, date_fin),
         prochain_rappel = COALESCE($3, prochain_rappel),
         notes           = COALESCE($4, notes)
       WHERE id = $5 AND exploitation_id = $6
       RETURNING *`,
      [statut||null, date_fin||null, prochain_rappel||null,
       notes||null, req.params.id, eid(req)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Enregistrement introuvable' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/sante/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM suivis WHERE id = $1 AND exploitation_id = $2 RETURNING id',
      [req.params.id, eid(req)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Enregistrement introuvable' });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
