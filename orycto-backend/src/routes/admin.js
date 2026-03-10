import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { requireAuth, requireSuperAdmin, requireAdmin, auditLog } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ══════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN — gestion globale
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/users — tous les users (super admin)
router.get('/users', requireSuperAdmin, async (req, res) => {
  try {
    const { status, search, exploitation_id } = req.query;
    let sql    = `
      SELECT u.*,
             e.nom AS exploitation_nom,
             approver.email AS approved_by_email
      FROM users u
      LEFT JOIN exploitations e ON e.id = u.exploitation_id
      LEFT JOIN users approver ON approver.id = u.approved_by
    `;
    const params = [];
    const conditions = [];
    let i = 1;

    if (status)         { conditions.push(`u.status = $${i++}`);         params.push(status); }
    if (exploitation_id){ conditions.push(`u.exploitation_id = $${i++}`); params.push(exploitation_id); }
    if (search) {
      conditions.push(`(u.email ILIKE $${i} OR u.first_name ILIKE $${i} OR u.last_name ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY u.created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows.map(u => ({
      id:               u.id,
      email:            u.email,
      firstName:        u.first_name,
      lastName:         u.last_name,
      phone:            u.phone,
      systemRole:       u.system_role,
      status:           u.status,
      exploitationId:   u.exploitation_id,
      exploitationNom:  u.exploitation_nom,
      exploitationRole: u.exploitation_role,
      lastLoginAt:      u.last_login_at,
      loginCount:       u.login_count,
      termsAccepted:    u.terms_accepted,
      approvedByEmail:  u.approved_by_email,
      approvedAt:       u.approved_at,
      rejectedReason:   u.rejected_reason,
      createdAt:        u.created_at,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/pending — comptes en attente d'approbation
router.get('/users/pending', requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, e.nom AS exploitation_nom
       FROM users u
       LEFT JOIN exploitations e ON e.id = u.exploitation_id
       WHERE u.status = 'pending'
       ORDER BY u.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:id — détail user
router.get('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, e.nom AS exploitation_nom
       FROM users u
       LEFT JOIN exploitations e ON e.id = u.exploitation_id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/:id/approve — approuver un compte
router.post('/users/:id/approve', requireSuperAdmin, async (req, res) => {
  try {
    const { exploitation_id, exploitation_role } = req.body;

    const result = await query(
      `UPDATE users SET
         status            = 'active',
         approved_by       = $1,
         approved_at       = NOW(),
         exploitation_id   = COALESCE($2, exploitation_id),
         exploitation_role = COALESCE($3, exploitation_role)
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [req.user.id, exploitation_id || null, exploitation_role || null, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable ou déjà traité' });
    }

    const user = result.rows[0];

    // Notification à l'user
    await query(
      `INSERT INTO notifications (user_id, exploitation_id, type, titre, message)
       VALUES ($1,$2,'account_approved','Compte approuvé',
               'Votre compte Orycto a été approuvé. Vous pouvez maintenant vous connecter.')`,
      [user.id, user.exploitation_id]
    );

    await auditLog(req, 'APPROVE_USER', 'users', user.id, { status: 'pending' }, { status: 'active' });
    res.json({ message: 'Compte approuvé', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/:id/reject — refuser un compte
router.post('/users/:id/reject', requireSuperAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const result = await query(
      `UPDATE users SET
         status          = 'rejected',
         rejected_reason = $1,
         approved_by     = $2,
         approved_at     = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [reason || null, req.user.id, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable ou déjà traité' });
    }

    const user = result.rows[0];

    await query(
      `INSERT INTO notifications (user_id, exploitation_id, type, titre, message)
       VALUES ($1,$2,'account_rejected','Demande d\'accès refusée',
               $3)`,
      [
        user.id,
        user.exploitation_id,
        reason
          ? `Votre demande d\'accès a été refusée. Motif : ${reason}`
          : 'Votre demande d\'accès a été refusée par un administrateur.',
      ]
    );

    await auditLog(req, 'REJECT_USER', 'users', user.id, { status: 'pending' }, { status: 'rejected', reason });
    res.json({ message: 'Compte refusé', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id — modifier un user (rôle, statut, exploitation)
router.put('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { status, system_role, exploitation_id, exploitation_role, active } = req.body;

    const before = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!before.rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const result = await query(
      `UPDATE users SET
         status            = COALESCE($1, status),
         system_role       = COALESCE($2, system_role),
         exploitation_id   = COALESCE($3, exploitation_id),
         exploitation_role = COALESCE($4, exploitation_role),
         active            = COALESCE($5, active)
       WHERE id = $6
       RETURNING *`,
      [status, system_role, exploitation_id, exploitation_role,
       active !== undefined ? active : null, req.params.id]
    );

    await auditLog(req, 'UPDATE_USER', 'users', req.params.id, before.rows[0], result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/:id/suspend — suspendre
router.post('/users/:id/suspend', requireSuperAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await query(
      `UPDATE users SET status = 'suspended' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    await auditLog(req, 'SUSPEND_USER', 'users', req.params.id, null, { reason });
    res.json({ message: 'Compte suspendu', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/:id/reactivate — réactiver
router.post('/users/:id/reactivate', requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      `UPDATE users SET status = 'active', failed_login_count = 0, locked_until = NULL
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    await auditLog(req, 'REACTIVATE_USER', 'users', req.params.id, null, null);
    res.json({ message: 'Compte réactivé', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id — supprimer (soft delete)
router.delete('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    }
    await query(
      `UPDATE users SET active = FALSE, status = 'suspended', email = email || '_deleted_' || NOW()
       WHERE id = $1`,
      [req.params.id]
    );
    await auditLog(req, 'DELETE_USER', 'users', req.params.id, null, null);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/:id/reset-password — réinitialiser le mdp
router.post('/users/:id/reset-password', requireSuperAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Mot de passe minimum 8 caractères' });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, req.params.id]);
    await auditLog(req, 'RESET_PASSWORD', 'users', req.params.id, null, null);
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── EXPLOITATIONS ─────────────────────────────────────────────────────────────

// GET /api/admin/exploitations
router.get('/exploitations', requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*,
             COUNT(DISTINCT u.id) FILTER (WHERE u.active) AS nb_users,
             COUNT(DISTINCT l.id) AS nb_lapins
      FROM exploitations e
      LEFT JOIN users  u ON u.exploitation_id = e.id
      LEFT JOIN lapins l ON l.exploitation_id = e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/exploitations
router.post('/exploitations', requireSuperAdmin, async (req, res) => {
  try {
    const { nom, description, adresse, ville, pays, telephone, email, plan } = req.body;
    if (!nom) return res.status(400).json({ error: 'Le nom est requis' });

    const result = await query(
      `INSERT INTO exploitations (nom, description, adresse, ville, pays, telephone, email, plan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nom, description || null, adresse || null, ville || null,
       pays || 'Madagascar', telephone || null, email || null, plan || 'free']
    );
    await auditLog(req, 'CREATE_EXPLOITATION', 'exploitations', result.rows[0].id, null, req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/exploitations/:id
router.put('/exploitations/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { nom, description, adresse, ville, pays, telephone, email, plan, actif } = req.body;
    const result = await query(
      `UPDATE exploitations SET
         nom         = COALESCE($1, nom),
         description = COALESCE($2, description),
         adresse     = COALESCE($3, adresse),
         ville       = COALESCE($4, ville),
         pays        = COALESCE($5, pays),
         telephone   = COALESCE($6, telephone),
         email       = COALESCE($7, email),
         plan        = COALESCE($8, plan),
         actif       = COALESCE($9, actif)
       WHERE id = $10 RETURNING *`,
      [nom, description, adresse, ville, pays, telephone, email, plan,
       actif !== undefined ? actif : null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Exploitation introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── INVITATIONS ───────────────────────────────────────────────────────────────

// POST /api/admin/invitations — créer une invitation
router.post('/invitations', requireAdmin, async (req, res) => {
  try {
    const { email, exploitation_id, role } = req.body;
    if (!email || !exploitation_id) {
      return res.status(400).json({ error: 'Email et exploitation requis' });
    }
    const eid = req.user.system_role === 'super_admin'
      ? exploitation_id
      : req.user.exploitation_id;

    const result = await query(
      `INSERT INTO invitations (email, exploitation_id, role, invited_by)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [email.toLowerCase(), eid, role || 'eleveur', req.user.id]
    );
    // En prod → envoyer email avec le token
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/invitations
router.get('/invitations', requireAdmin, async (req, res) => {
  try {
    const eid = req.user.system_role === 'super_admin' ? null : req.user.exploitation_id;
    let sql = `
      SELECT i.*, u.email AS invited_by_email, e.nom AS exploitation_nom
      FROM invitations i
      LEFT JOIN users u ON u.id = i.invited_by
      LEFT JOIN exploitations e ON e.id = i.exploitation_id
    `;
    const params = [];
    if (eid) { sql += ' WHERE i.exploitation_id = $1'; params.push(eid); }
    sql += ' ORDER BY i.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/invitations/:id
router.delete('/invitations/:id', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM invitations WHERE id = $1', [req.params.id]);
    res.json({ message: 'Invitation supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── AUDIT LOG ─────────────────────────────────────────────────────────────────

// GET /api/admin/audit — journal d'audit
router.get('/audit', requireSuperAdmin, async (req, res) => {
  try {
    const { user_id, action, resource, limit = 100, offset = 0 } = req.query;
    let sql = `
      SELECT a.*, u.first_name, u.last_name
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
    `;
    const params = [];
    const conditions = [];
    let i = 1;
    if (user_id)  { conditions.push(`a.user_id  = $${i++}`); params.push(user_id); }
    if (action)   { conditions.push(`a.action   = $${i++}`); params.push(action); }
    if (resource) { conditions.push(`a.resource = $${i++}`); params.push(resource); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ` ORDER BY a.created_at DESC LIMIT $${i++} OFFSET $${i++}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── STATS PLATEFORME ──────────────────────────────────────────────────────────
router.get('/stats', requireSuperAdmin, async (req, res) => {
  try {
    const [users, exploits, lapins, logins] = await Promise.all([
      query(`SELECT status, COUNT(*) FROM users GROUP BY status`),
      query(`SELECT plan, COUNT(*) FROM exploitations WHERE actif GROUP BY plan`),
      query(`SELECT COUNT(*) FROM lapins WHERE statut != 'mort'`),
      query(`SELECT COUNT(*) FROM users WHERE last_login_at > NOW() - INTERVAL '30 days'`),
    ]);
    res.json({
      users:         Object.fromEntries(users.rows.map(r => [r.status, parseInt(r.count)])),
      exploitations: Object.fromEntries(exploits.rows.map(r => [r.plan, parseInt(r.count)])),
      totalLapins:   parseInt(lapins.rows[0].count),
      activeUsers30d: parseInt(logins.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
