import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const uid = req.user.id;

    const [lapins, soins, accos, portees, stocks, aliments, events] = await Promise.all([
      query('SELECT * FROM lapins WHERE user_id = $1', [uid]),
      query('SELECT * FROM soins  WHERE user_id = $1', [uid]),
      query('SELECT * FROM accouplements WHERE user_id = $1', [uid]),
      query('SELECT * FROM portees WHERE user_id = $1', [uid]),
      query('SELECT s.*, a.nom, a.unite_mesure FROM stocks s JOIN aliments a ON a.id = s.aliment_id WHERE s.user_id = $1', [uid]),
      query('SELECT * FROM aliments WHERE user_id = $1', [uid]),
      query('SELECT * FROM evenements WHERE user_id = $1 ORDER BY date_evenement DESC LIMIT 10', [uid]),
    ]);

    const l = lapins.rows;
    const s = soins.rows;
    const a = accos.rows;
    const p = portees.rows;
    const st = stocks.rows;

    const today  = new Date();
    const actifs = l.filter(x => !['vendu','mort'].includes(x.statut));
    const totalNes = p.reduce((n, x) => n + (parseInt(x.nombre_nes) || 0), 0);

    const kpis = {
      total_lapins:         l.length,
      total_actifs:         actifs.length,
      nb_gestantes:         l.filter(x => x.statut === 'gestante').length,
      nb_femelles:          l.filter(x => x.sexe === 'F' && !['vendu','mort'].includes(x.statut)).length,
      nb_malades:           l.filter(x => x.statut === 'malade').length,
      vaccins_en_retard:    s.filter(x => x.date_fin && new Date(x.date_fin) < today && x.statut !== 'termine').length,
      naissances_attendues: a.filter(x => x.statut === 'en_attente').length,
      taille_portee_moy:    p.length ? (totalNes / p.length).toFixed(1) : '0',
    };

    const alertes = [
      ...s.filter(x => x.date_fin && new Date(x.date_fin) < today && x.statut !== 'termine')
         .map(x => ({ type: 'vaccin_retard', nom: x.nom_traitement, detail: x.nom_lapin || '' })),
      ...st.filter(x => parseFloat(x.quantite) <= parseFloat(x.seuil_alerte || 0))
          .map(x => ({ type: 'stock_critique', nom: x.nom, detail: `${x.quantite} ${x.unite_mesure} remaining` })),
      ...a.filter(x => {
            if (!x.date_naissance_prevue || x.statut !== 'en_attente') return false;
            const diff = Math.round((new Date(x.date_naissance_prevue) - today) / 86400000);
            return diff >= 0 && diff <= 5;
          }).map(x => {
            const diff = Math.round((new Date(x.date_naissance_prevue) - today) / 86400000);
            return { type: 'naissance_proche', nom: `Birth in ${diff}d — ♀ ${x.tag_female}`, detail: '' };
          }),
    ];

    const activites = events.rows.map(e => ({ ...e }));

    const stocksInfo = st.map(x => ({
      nom:          x.nom,
      quantite:     parseFloat(x.quantite),
      unite:        x.unite_mesure,
      seuil_alerte: parseFloat(x.seuil_alerte || 0),
      statut_stock: parseFloat(x.quantite) <= 0 ? 'critique'
                  : parseFloat(x.quantite) <= parseFloat(x.seuil_alerte || 0) ? 'bas' : 'ok',
    }));

    res.json({ kpis, alertes, activites, stocks: stocksInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/statistiques
router.get('/statistiques', async (req, res) => {
  try {
    const uid = req.user.id;

    const [lapins, portees, couts] = await Promise.all([
      query(`SELECT race, statut FROM lapins WHERE user_id = $1 AND statut NOT IN ('vendu','mort')`, [uid]),
      query(`SELECT date_naissance, nombre_nes FROM portees WHERE user_id = $1`, [uid]),
      query(`SELECT type_depense, SUM(montant) as montant FROM couts WHERE user_id = $1 GROUP BY type_depense ORDER BY montant DESC`, [uid]),
    ]);

    // Races
    const raceCounts = {};
    const total = lapins.rows.length;
    lapins.rows.forEach(r => {
      const race = r.race || 'Unknown';
      raceCounts[race] = (raceCounts[race] || 0) + 1;
    });
    const races = Object.entries(raceCounts)
      .map(([race, nb]) => ({ race, nb, pct: total > 0 ? Math.round((nb / total) * 100) : 0 }))
      .sort((a, b) => b.nb - a.nb);

    // Monthly births (last 6 months)
    const now = new Date();
    const mensuel = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleDateString('en-GB', { month: 'short' });
      const nes = portees.rows
        .filter(p => {
          const pd = new Date(p.date_naissance);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        })
        .reduce((s, p) => s + (parseInt(p.nombre_nes) || 0), 0);
      return { mois: label, nes };
    });

    res.json({
      races,
      mensuel,
      couts: couts.rows.map(r => ({ categorie: r.type_depense, montant: parseFloat(r.montant) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
