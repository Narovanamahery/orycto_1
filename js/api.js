import { db } from './db.js';

export const api = {
  lapins: {
    getAll: async (filters = {}) => {
      let rows = await db.getAll('lapins');
      if (filters.search) {
        const s = filters.search.toLowerCase();
        rows = rows.filter(r =>
          r.tag?.toLowerCase().includes(s) ||
          r.nom?.toLowerCase().includes(s)
        );
      }
      if (filters.statut) rows = rows.filter(r => r.statut === filters.statut);
      if (filters.sexe)   rows = rows.filter(r => r.sexe   === filters.sexe);
      return rows;
    },
    getOne:  (id)       => db.getOne('lapins', id),
    create:  (data)     => db.create('lapins', data),
    update:  (id, data) => db.update('lapins', id, data),
    delete:  (id)       => db.delete('lapins', id),
  },

  races: {
    getAll:  ()         => db.getAll('races'),
    create:  (data)     => db.create('races', data),
    update:  (id, data) => db.update('races', id, data),
    delete:  (id)       => db.delete('races', id),
  },

  cages: {
    getAll:  ()         => db.getAll('cages'),
    create:  (data)     => db.create('cages', data),
    update:  (id, data) => db.update('cages', id, data),
    delete:  (id)       => db.delete('cages', id),
  },

  sante: {
    getAll: async (filters = {}) => {
      let rows = await db.getAll('sante');
      if (filters.statut) rows = rows.filter(r => r.statut === filters.statut);
      return rows;
    },
    create:      (data)     => db.create('sante', data),
    update:      (id, data) => db.update('sante', id, data),
    delete:      (id)       => db.delete('sante', id),
    pathologies: ()         => db.getAll('pathologies'),
    createPathologie: (data)     => db.create('pathologies', data),
    deletePathologie: (id)       => db.delete('pathologies', id),
  },

  reproduction: {
    getAll:  ()         => db.getAll('accouplements'),
    create:  (data)     => db.create('accouplements', data),
    update:  (id, data) => db.update('accouplements', id, data),
    delete:  (id)       => db.delete('accouplements', id),
    portees: ()         => db.getAll('portees'),
    createPortee: (data)     => db.create('portees', data),
    deletePortee: (id)       => db.delete('portees', id),
    naissance: async (id, data) => {
      const updated = await db.update('accouplements', id, {
        statut: 'succes',
        date_naissance_reelle: data.date_naissance,
      });
      const portee = await db.create('portees', {
        accouplement_id: id,
        ...data,
      });
      return { accouplement: updated, portee };
    },
  },

  alimentation: {
    aliments:      ()     => db.getAll('aliments'),
    createAliment: (data) => db.create('aliments', data),
    deleteAliment: (id)   => db.delete('aliments', id),

    stocks:        ()     => db.getAll('stocks'),
    createStock:   (data) => db.create('stocks', data),
    updateStock:   (id, data) => db.update('stocks', id, data),
    deleteStock:   (id)   => db.delete('stocks', id),
    restock: async (data) => {
      const stocks = await db.getAll('stocks');
      const existing = stocks.find(s => s.aliment_id === data.aliment_id);
      if (existing) {
        return db.update('stocks', existing.id, {
          quantite: parseFloat(existing.quantite) + parseFloat(data.quantite),
          date_expiration: data.date_expiration || existing.date_expiration,
        });
      }
      return db.create('stocks', data);
    },

    distributions:  ()     => db.getAll('distributions'),
    addDist:        (data) => db.create('distributions', data),
    deleteDist:     (id)   => db.delete('distributions', id),

    rations:        ()     => db.getAll('rations'),
    createRation:   (data) => db.create('rations', data),
    deleteRation:   (id)   => db.delete('rations', id),
  },

  evenements: {
    getAll:  ()         => db.getAll('evenements'),
    create:  (data)     => db.create('evenements', data),
    update:  (id, data) => db.update('evenements', id, data),
    delete:  (id)       => db.delete('evenements', id),
  },

  couts: {
    getAll:  ()         => db.getAll('couts'),
    create:  (data)     => db.create('couts', data),
    update:  (id, data) => db.update('couts', id, data),
    delete:  (id)       => db.delete('couts', id),
  },

  dashboard: {
    get: async () => {
      const [lapins, sante, accouplements, portees, stocks, aliments, evenements, couts] =
        await Promise.all([
          db.getAll('lapins'),
          db.getAll('sante'),
          db.getAll('accouplements'),
          db.getAll('portees'),
          db.getAll('stocks'),
          db.getAll('aliments'),
          db.getAll('evenements'),
          db.getAll('couts'),
        ]);

      const actifs     = lapins.filter(l => !['vendu','mort'].includes(l.statut));
      const gestantes  = lapins.filter(l => l.statut === 'gestante');
      const femelles   = lapins.filter(l => l.sexe === 'F' && !['vendu','mort'].includes(l.statut));
      const malades    = lapins.filter(l => l.statut === 'malade');
      const retards    = sante.filter(s => s.statut === 'en_retard');
      const accoPending = accouplements.filter(a => a.statut === 'en_attente');
      const stocksAlerte = stocks.filter(s => parseFloat(s.quantite) <= parseFloat(s.seuil_alerte || 0));
      const totalNes   = portees.reduce((n, p) => n + parseInt(p.nombre_nes || 0), 0);
      const porteeAvg  = portees.length ? (totalNes / portees.length).toFixed(1) : '0';

      const kpis = {
        total_actifs:         actifs.length,
        total_lapins:         lapins.length,
        nb_gestantes:         gestantes.length,
        nb_femelles:          femelles.length,
        nb_malades:           malades.length,
        vaccins_en_retard:    retards.length,
        naissances_attendues: accoPending.length,
        taille_portee_moy:    porteeAvg,
      };

      const alertes = [
        ...retards.map(s => ({ type: 'vaccin_retard',     nom: s.nom_traitement, detail: s.nom_traitement })),
        ...stocksAlerte.map(s => {
          const a = aliments.find(al => al.id === s.aliment_id);
          return { type: 'stock_critique', nom: a?.nom || 'Stock', detail: `${a?.nom || 'Stock'} low` };
        }),
        ...accoPending.filter(a => {
          if (!a.date_naissance_prevue) return false;
          const d = Math.round((new Date(a.date_naissance_prevue) - new Date()) / 86400000);
          return d >= 0 && d <= 5;
        }).map(a => ({ type: 'naissance_proche', nom: `Birth in ${Math.round((new Date(a.date_naissance_prevue) - new Date()) / 86400000)}d`, detail: '' })),
      ];

      const activites = [...evenements]
        .sort((a, b) => new Date(b.date_evenement) - new Date(a.date_evenement))
        .slice(0, 8)
        .map(e => {
          const l = lapins.find(r => r.id === e.lapin_id);
          return { ...e, nom_lapin: l?.nom || '—', tag: l?.tag || '—', montant: null };
        });

      const stocksInfo = stocks.map(s => {
        const a = aliments.find(al => al.id === s.aliment_id);
        const statut = parseFloat(s.quantite) <= 0 ? 'critique'
          : parseFloat(s.quantite) <= parseFloat(s.seuil_alerte || 0) ? 'bas' : 'ok';
        return {
          nom: a?.nom || '—', quantite: s.quantite,
          unite: a?.unite_mesure || '', seuil_alerte: s.seuil_alerte, statut_stock: statut,
        };
      });

      return { kpis, alertes, activites, stocks: stocksInfo };
    },

    statistiques: async () => {
      const [lapins, races, couts, portees] = await Promise.all([
        db.getAll('lapins'),
        db.getAll('races'),
        db.getAll('couts'),
        db.getAll('portees'),
      ]);

      const total = lapins.filter(l => !['vendu','mort'].includes(l.statut)).length;
      const raceStats = races.map(r => {
        const nb = lapins.filter(l => l.race_id === r.id && !['vendu','mort'].includes(l.statut)).length;
        return { race: r.nom, nb, pct: total > 0 ? Math.round((nb / total) * 100) : 0 };
      }).filter(r => r.nb > 0).sort((a, b) => b.nb - a.nb);

      const coutsParCat = {};
      couts.forEach(c => {
        coutsParCat[c.type_depense] = (coutsParCat[c.type_depense] || 0) + parseFloat(c.montant || 0);
      });
      const coutsStats = Object.entries(coutsParCat)
        .map(([categorie, montant]) => ({ categorie, montant }))
        .sort((a, b) => b.montant - a.montant);

      const now = new Date();
      const mensuel = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const label = d.toLocaleDateString('en-GB', { month: 'short' });
        const nés = portees.filter(p => {
          const pd = new Date(p.date_naissance);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        }).reduce((s, p) => s + parseInt(p.nombre_nes || 0), 0);
        return { mois: label, nes: nés };
      });

      return { races: raceStats, couts: coutsStats, mensuel };
    },
  },
};
