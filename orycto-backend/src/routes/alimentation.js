import { Router } from 'express';
import { requireAuth, requireExploitation } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);
router.use(requireExploitation);

const eid = req => req.user.exploitation_id;

// ── Aliments ──────────────────────────────────────────────────────────────────

router.get('/aliments', async (req, res) => {
  try {
    const r = await query('SELECT * FROM aliments WHERE exploitation_id = $1 ORDER BY nom', [eid(req)]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/aliments', async (req, res) => {
  try {
    const { nom, type, unite_mesure, description } = req.body;
    if (!nom) return res.status(400).json({ error: 'nom est requis' });
    const r = await query(
      'INSERT INTO aliments (exploitation_id,nom,type,unite_mesure,description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [eid(req), nom, type||'autre', unite_mesure||'kg', description||null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Aliment déjà existant' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/aliments/:id', async (req, res) => {
  try {
    const { nom, type, unite_mesure, description } = req.body;
    const r = await query(
      `UPDATE aliments SET nom=COALESCE($1,nom),type=COALESCE($2,type),
       unite_mesure=COALESCE($3,unite_mesure),description=COALESCE($4,description)
       WHERE id=$5 AND exploitation_id=$6 RETURNING *`,
      [nom||null,type||null,unite_mesure||null,description||null,req.params.id,eid(req)]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Aliment introuvable' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/aliments/:id', async (req, res) => {
  try {
    const r = await query('DELETE FROM aliments WHERE id=$1 AND exploitation_id=$2 RETURNING id', [req.params.id,eid(req)]);
    if (!r.rows.length) return res.status(404).json({ error: 'Aliment introuvable' });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Stocks ────────────────────────────────────────────────────────────────────

router.get('/stocks', async (req, res) => {
  try {
    const r = await query(
      `SELECT s.*,a.nom,a.unite_mesure,a.type FROM stocks s
       JOIN aliments a ON a.id=s.aliment_id
       WHERE s.exploitation_id=$1 ORDER BY a.nom`,
      [eid(req)]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/stocks', async (req, res) => {
  try {
    const { aliment_id, quantite, seuil_alerte, fournisseur, prix_kg, date_achat, date_peremption } = req.body;
    if (!aliment_id) return res.status(400).json({ error: 'aliment_id est requis' });
    const r = await query(
      `INSERT INTO stocks (exploitation_id,aliment_id,quantite,seuil_alerte,fournisseur,prix_kg,date_achat,date_peremption)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (exploitation_id,aliment_id) DO UPDATE SET
         quantite=stocks.quantite+EXCLUDED.quantite,
         seuil_alerte=COALESCE(EXCLUDED.seuil_alerte,stocks.seuil_alerte),
         fournisseur=COALESCE(EXCLUDED.fournisseur,stocks.fournisseur),
         prix_kg=COALESCE(EXCLUDED.prix_kg,stocks.prix_kg),
         date_peremption=COALESCE(EXCLUDED.date_peremption,stocks.date_peremption),
         updated_at=NOW()
       RETURNING *`,
      [eid(req),aliment_id,quantite||0,seuil_alerte||0,fournisseur||null,prix_kg||null,date_achat||null,date_peremption||null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Réapprovisionner (compat. frontend legacy)
router.post('/stocks/restock', async (req, res) => {
  try {
    const { aliment_id, quantite, date_peremption } = req.body;
    if (!aliment_id || !quantite) return res.status(400).json({ error: 'aliment_id et quantite requis' });
    const r = await query(
      `INSERT INTO stocks (exploitation_id,aliment_id,quantite,seuil_alerte,date_peremption)
       VALUES ($1,$2,$3,0,$4)
       ON CONFLICT (exploitation_id,aliment_id) DO UPDATE SET
         quantite=stocks.quantite+$3,
         date_peremption=COALESCE($4,stocks.date_peremption),
         updated_at=NOW()
       RETURNING *`,
      [eid(req),aliment_id,quantite,date_peremption||null]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/stocks/:id', async (req, res) => {
  try {
    const { quantite, seuil_alerte, fournisseur, prix_kg, date_peremption } = req.body;
    const r = await query(
      `UPDATE stocks SET quantite=COALESCE($1,quantite),seuil_alerte=COALESCE($2,seuil_alerte),
       fournisseur=COALESCE($3,fournisseur),prix_kg=COALESCE($4,prix_kg),
       date_peremption=COALESCE($5,date_peremption),updated_at=NOW()
       WHERE id=$6 AND exploitation_id=$7 RETURNING *`,
      [quantite??null,seuil_alerte??null,fournisseur||null,prix_kg||null,date_peremption||null,req.params.id,eid(req)]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Stock introuvable' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/stocks/:id', async (req, res) => {
  try {
    const r = await query('DELETE FROM stocks WHERE id=$1 AND exploitation_id=$2 RETURNING id', [req.params.id,eid(req)]);
    if (!r.rows.length) return res.status(404).json({ error: 'Stock introuvable' });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Rations ───────────────────────────────────────────────────────────────────

router.get('/rations', async (req, res) => {
  try {
    const r = await query(
      `SELECT r.*,a.nom AS nom_aliment,a.unite_mesure FROM rations r
       JOIN aliments a ON a.id=r.aliment_id
       WHERE r.exploitation_id=$1 ORDER BY r.type_lapin,a.nom`,
      [eid(req)]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/rations', async (req, res) => {
  try {
    const { aliment_id, type_lapin, quantite_jour, composition } = req.body;
    if (!aliment_id||!type_lapin||!quantite_jour)
      return res.status(400).json({ error: 'aliment_id, type_lapin et quantite_jour requis' });
    const r = await query(
      'INSERT INTO rations (exploitation_id,aliment_id,type_lapin,quantite_jour,composition) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [eid(req),aliment_id,type_lapin,quantite_jour,composition||null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/rations/:id', async (req, res) => {
  try {
    await query('DELETE FROM rations WHERE id=$1 AND exploitation_id=$2', [req.params.id,eid(req)]);
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Distributions ─────────────────────────────────────────────────────────────

router.get('/distributions', async (req, res) => {
  try {
    const r = await query(
      `SELECT d.*,a.nom AS nom_aliment_ref,a.unite_mesure,
              l.identifiant_unique AS tag_lapin_ref,c.code AS cage_code
       FROM distributions d
       LEFT JOIN aliments a ON a.id=d.aliment_id
       LEFT JOIN lapins   l ON l.id=d.lapin_id
       LEFT JOIN cages    c ON c.id=d.cage_id
       WHERE d.exploitation_id=$1
       ORDER BY d.date_distribution DESC,d.created_at DESC`,
      [eid(req)]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/distributions', async (req, res) => {
  try {
    const { aliment_id, lapin_id, cage_id, ration_id,
            quantite_distribuee, quantite, reste,
            date_distribution, notes } = req.body;
    const qte = quantite_distribuee || quantite;
    if (!aliment_id || !qte) return res.status(400).json({ error: 'aliment_id et quantite_distribuee requis' });

    const r = await query(
      `INSERT INTO distributions
         (exploitation_id,aliment_id,lapin_id,cage_id,ration_id,
          date_distribution,quantite_distribuee,reste,notes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [eid(req),aliment_id,lapin_id||null,cage_id||null,ration_id||null,
       date_distribution||new Date().toISOString().slice(0,10),
       qte,reste||null,notes||null,req.user.id]
    );

    // Décrémenter le stock
    await query(
      `UPDATE stocks SET quantite=GREATEST(0,quantite-$1),updated_at=NOW()
       WHERE aliment_id=$2 AND exploitation_id=$3`,
      [qte,aliment_id,eid(req)]
    );

    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/distributions/:id', async (req, res) => {
  try {
    const r = await query(
      'DELETE FROM distributions WHERE id=$1 AND exploitation_id=$2 RETURNING id',
      [req.params.id,eid(req)]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Distribution introuvable' });
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
