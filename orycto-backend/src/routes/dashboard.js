import { Router } from 'express';
import { requireAuth, requireExploitation } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(requireAuth);
router.use(requireExploitation);

const eid = req => req.user.exploitation_id;

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const e = eid(req);

    const [lapins, suivis, accos, portees, stocks, evenements] = await Promise.all([
      query('SELECT * FROM lapins WHERE exploitation_id=$1', [e]),
      query('SELECT * FROM suivis WHERE exploitation_id=$1', [e]),
      query('SELECT * FROM accouplements WHERE exploitation_id=$1', [e]),
      query('SELECT * FROM portees WHERE exploitation_id=$1', [e]),
      query(
        `SELECT s.*,a.nom,a.unite_mesure FROM stocks s
         JOIN aliments a ON a.id=s.aliment_id
         WHERE s.exploitation_id=$1`, [e]
      ),
      query(
        `SELECT ev.*,l.identifiant_unique AS tag_lapin,l.nom AS nom_lapin
         FROM evenements ev
         LEFT JOIN lapins l ON l.id=ev.lapin_id
         WHERE ev.exploitation_id=$1
         ORDER BY ev.date_evenement DESC LIMIT 10`, [e]
      ),
    ]);

    const l  = lapins.rows;
    const s  = suivis.rows;
    const a  = accos.rows;
    const p  = portees.rows;
    const st = stocks.rows;
    const today = new Date();

    const actifs    = l.filter(x => !['vendu','mort'].includes(x.statut));
    const totalNes  = p.reduce((n,x) => n + (parseInt(x.nombre_nes)||0), 0);

    const kpis = {
      total_lapins:         l.length,
      total_actifs:         actifs.length,
      nb_gestantes:         l.filter(x => x.statut==='gestante').length,
      nb_femelles:          l.filter(x => x.sexe==='femelle' && !['vendu','mort'].includes(x.statut)).length,
      nb_malades:           l.filter(x => x.statut==='malade').length,
      vaccins_en_retard:    s.filter(x => x.prochain_rappel && new Date(x.prochain_rappel)<today && x.statut!=='termine').length,
      naissances_attendues: a.filter(x => x.statut==='en_attente').length,
      taille_portee_moy:    p.length ? (totalNes/p.length).toFixed(1) : '0',
    };

    const alertes = [
      ...s.filter(x => x.prochain_rappel && new Date(x.prochain_rappel)<today && x.statut!=='termine')
         .map(x => ({ type:'vaccin_retard', nom: x.nom_traitement||'Traitement', detail:'' })),
      ...st.filter(x => parseFloat(x.quantite)<=parseFloat(x.seuil_alerte||0))
          .map(x => ({ type:'stock_critique', nom:x.nom, detail:`${x.quantite} ${x.unite_mesure}` })),
      ...a.filter(x => {
            if (!x.date_mise_bas_prevue || x.statut!=='en_attente') return false;
            const diff = Math.round((new Date(x.date_mise_bas_prevue)-today)/86400000);
            return diff>=0 && diff<=5;
          }).map(x => {
            const diff = Math.round((new Date(x.date_mise_bas_prevue)-today)/86400000);
            return { type:'naissance_proche', nom:`Naissance dans ${diff}j`, detail:'' };
          }),
    ];

    const stocksInfo = st.map(x => ({
      nom:          x.nom,
      quantite:     parseFloat(x.quantite),
      unite:        x.unite_mesure,
      seuil_alerte: parseFloat(x.seuil_alerte||0),
      statut_stock: parseFloat(x.quantite)<=0 ? 'critique'
                  : parseFloat(x.quantite)<=parseFloat(x.seuil_alerte||0) ? 'bas' : 'ok',
    }));

    res.json({ kpis, alertes, activites: evenements.rows, stocks: stocksInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/statistiques
router.get('/statistiques', async (req, res) => {
  try {
    const e = eid(req);

    const [lapins, races, couts, portees] = await Promise.all([
      query(`SELECT race_id,race_libre,statut FROM lapins WHERE exploitation_id=$1 AND statut NOT IN ('vendu','mort')`, [e]),
      query('SELECT * FROM races WHERE exploitation_id=$1', [e]),
      query(`SELECT type_depense,SUM(montant) AS montant FROM couts WHERE exploitation_id=$1 GROUP BY type_depense ORDER BY montant DESC`, [e]),
      query('SELECT date_naissance,nombre_nes FROM portees WHERE exploitation_id=$1', [e]),
    ]);

    // Statistiques races
    const total = lapins.rows.length;
    const raceCounts = {};
    lapins.rows.forEach(l => {
      const nom = l.race_libre || (races.rows.find(r => r.id===l.race_id)?.nom) || 'Inconnue';
      raceCounts[nom] = (raceCounts[nom]||0) + 1;
    });
    const racesStats = Object.entries(raceCounts)
      .map(([race,nb]) => ({ race, nb, pct: total>0 ? Math.round((nb/total)*100) : 0 }))
      .sort((a,b) => b.nb-a.nb);

    // Naissances mensuelles (6 derniers mois)
    const now = new Date();
    const mensuel = Array.from({ length:6 }, (_,i) => {
      const d = new Date(now.getFullYear(), now.getMonth()-(5-i), 1);
      const label = d.toLocaleDateString('fr-FR', { month:'short' });
      const nes = portees.rows
        .filter(p => {
          const pd = new Date(p.date_naissance);
          return pd.getMonth()===d.getMonth() && pd.getFullYear()===d.getFullYear();
        })
        .reduce((s,p) => s+(parseInt(p.nombre_nes)||0), 0);
      return { mois:label, nes };
    });

    res.json({
      races:   racesStats,
      mensuel,
      couts:   couts.rows.map(r => ({ categorie:r.type_depense, montant:parseFloat(r.montant) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
