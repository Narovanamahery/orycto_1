import { Router } from 'express';
import { requireAuth, requireExploitation } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);
router.use(requireExploitation);

const eid = req => req.user.exploitation_id;

// ── Événements ────────────────────────────────────────────────────────────────

router.get('/evenements', async (req, res) => {
  try {
    const r = await query(
      `SELECT ev.*,l.identifiant_unique AS tag_lapin,l.nom AS nom_lapin
       FROM evenements ev
       LEFT JOIN lapins l ON l.id=ev.lapin_id
       WHERE ev.exploitation_id=$1
       ORDER BY ev.date_evenement DESC`,
      [eid(req)]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/evenements', async (req, res) => {
  try {
    const { lapin_id, cage_id, type_evenement, date_evenement, description, notes, montant } = req.body;
    if (!type_evenement) return res.status(400).json({ error: 'type_evenement requis' });
    const r = await query(
      `INSERT INTO evenements
         (exploitation_id,lapin_id,cage_id,type_evenement,
          date_evenement,description,notes,montant,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [eid(req),lapin_id||null,cage_id||null,type_evenement,
       date_evenement||new Date().toISOString().slice(0,10),
       description||null,notes||null,montant||null,req.user.id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/evenements/:id', async (req, res) => {
  try {
    const { type_evenement, date_evenement, description, notes, montant } = req.body;
    const r = await query(
      `UPDATE evenements SET
         type_evenement =COALESCE($1,type_evenement),
         date_evenement =COALESCE($2,date_evenement),
         description    =COALESCE($3,description),
         notes          =COALESCE($4,notes),
         montant        =COALESCE($5,montant)
       WHERE id=$6 AND exploitation_id=$7 RETURNING *`,
      [type_evenement||null,date_evenement||null,description||null,
       notes||null,montant||null,req.params.id,eid(req)]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Événement introuvable' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/evenements/:id', async (req, res) => {
  try {
    const r = await query(
      'DELETE FROM evenements WHERE id=$1 AND exploitation_id=$2 RETURNING id',
      [req.params.id,eid(req)]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Événement introuvable' });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Coûts ─────────────────────────────────────────────────────────────────────

router.get('/couts', async (req, res) => {
  try {
    const r = await query(
      'SELECT * FROM couts WHERE exploitation_id=$1 ORDER BY date_depense DESC',
      [eid(req)]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/couts', async (req, res) => {
  try {
    const { type_depense, montant, date_depense, description, lapin_id, cage_id, notes } = req.body;
    if (!type_depense||!montant||!description)
      return res.status(400).json({ error: 'type_depense, montant et description requis' });
    const r = await query(
      `INSERT INTO couts
         (exploitation_id,type_depense,montant,date_depense,
          description,lapin_id,cage_id,notes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [eid(req),type_depense,montant,
       date_depense||new Date().toISOString().slice(0,10),
       description,lapin_id||null,cage_id||null,notes||null,req.user.id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/couts/:id', async (req, res) => {
  try {
    const r = await query(
      'DELETE FROM couts WHERE id=$1 AND exploitation_id=$2 RETURNING id',
      [req.params.id,eid(req)]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Dépense introuvable' });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Races ─────────────────────────────────────────────────────────────────────

router.get('/races', async (req, res) => {
  try {
    const r = await query('SELECT * FROM races WHERE exploitation_id=$1 ORDER BY nom', [eid(req)]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/races', async (req, res) => {
  try {
    const { nom, description, poids_adulte_moyen, duree_gestation } = req.body;
    if (!nom) return res.status(400).json({ error: 'nom requis' });
    const r = await query(
      `INSERT INTO races (exploitation_id,nom,description,poids_adulte_moyen,duree_gestation)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [eid(req),nom,description||null,poids_adulte_moyen||null,duree_gestation||null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/races/:id', async (req, res) => {
  try {
    await query('DELETE FROM races WHERE id=$1 AND exploitation_id=$2', [req.params.id,eid(req)]);
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Cages ─────────────────────────────────────────────────────────────────────

router.get('/cages', async (req, res) => {
  try {
    const r = await query('SELECT * FROM cages WHERE exploitation_id=$1 ORDER BY code', [eid(req)]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/cages', async (req, res) => {
  try {
    const { code, type, capacite_max, localisation, statut, notes } = req.body;
    if (!code) return res.status(400).json({ error: 'code requis' });
    const r = await query(
      `INSERT INTO cages (exploitation_id,code,type,capacite_max,localisation,statut,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [eid(req),code,type||'individuelle',capacite_max||1,localisation||null,statut||'disponible',notes||null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code==='23505') return res.status(409).json({ error: 'Code cage déjà utilisé' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/cages/:id', async (req, res) => {
  try {
    const { code, type, capacite_max, localisation, statut, notes } = req.body;
    const r = await query(
      `UPDATE cages SET
         code=COALESCE($1,code),type=COALESCE($2,type),
         capacite_max=COALESCE($3,capacite_max),localisation=COALESCE($4,localisation),
         statut=COALESCE($5,statut),notes=COALESCE($6,notes)
       WHERE id=$7 AND exploitation_id=$8 RETURNING *`,
      [code||null,type||null,capacite_max||null,localisation||null,statut||null,notes||null,req.params.id,eid(req)]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Cage introuvable' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/cages/:id', async (req, res) => {
  try {
    await query('DELETE FROM cages WHERE id=$1 AND exploitation_id=$2', [req.params.id,eid(req)]);
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Perf (KPIs reproducteurs) ─────────────────────────────────────────────────

router.get('/perf', async (req, res) => {
  try {
    const r = await query(
      `SELECT p.*,l.identifiant_unique AS tag_lapin,l.nom AS nom_lapin
       FROM perf p LEFT JOIN lapins l ON l.id=p.lapin_id
       WHERE p.exploitation_id=$1 ORDER BY p.periode DESC`,
      [eid(req)]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/perf', async (req, res) => {
  try {
    const { lapin_id, periode, taux_fertilite, taille_portee_moyenne,
            poids_sevrage_moyen, intervalle_mises_bas, notes } = req.body;
    if (!lapin_id||!periode) return res.status(400).json({ error: 'lapin_id et periode requis' });
    const r = await query(
      `INSERT INTO perf
         (exploitation_id,lapin_id,periode,taux_fertilite,taille_portee_moyenne,
          poids_sevrage_moyen,intervalle_mises_bas,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (exploitation_id,lapin_id,periode) DO UPDATE SET
         taux_fertilite=EXCLUDED.taux_fertilite,
         taille_portee_moyenne=EXCLUDED.taille_portee_moyenne,
         poids_sevrage_moyen=EXCLUDED.poids_sevrage_moyen,
         intervalle_mises_bas=EXCLUDED.intervalle_mises_bas,
         notes=EXCLUDED.notes
       RETURNING *`,
      [eid(req),lapin_id,periode,taux_fertilite||null,taille_portee_moyenne||null,
       poids_sevrage_moyen||null,intervalle_mises_bas||null,notes||null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/perf/:id', async (req, res) => {
  try {
    await query('DELETE FROM perf WHERE id=$1 AND exploitation_id=$2', [req.params.id,eid(req)]);
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
