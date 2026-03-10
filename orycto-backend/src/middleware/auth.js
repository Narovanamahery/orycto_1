import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';

// ── Authenticate (JWT ou session) ─────────────────────────────────────────────
export async function requireAuth(req, res, next) {
  let userId = req.session?.userId;

  if (!userId) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
        userId = payload.id;
      } catch {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
      }
    }
  }

  if (!userId) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, system_role,
              status, exploitation_id, exploitation_role, active
       FROM users WHERE id = $1`,
      [userId]
    );
    if (!result.rows.length || !result.rows[0].active) {
      return res.status(401).json({ error: 'Compte introuvable ou désactivé' });
    }
    const user = result.rows[0];
    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Votre compte est en attente d\'approbation', code: 'PENDING' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Votre compte est suspendu', code: 'SUSPENDED' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Votre demande d\'accès a été refusée', code: 'REJECTED' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ── Super Admin uniquement ────────────────────────────────────────────────────
export function requireSuperAdmin(req, res, next) {
  if (req.user?.system_role !== 'super_admin') {
    return res.status(403).json({ error: 'Accès super-administrateur requis' });
  }
  next();
}

// ── Admin exploitation ou super admin ─────────────────────────────────────────
export function requireAdmin(req, res, next) {
  if (
    req.user?.system_role === 'super_admin' ||
    req.user?.exploitation_role === 'admin'
  ) return next();
  return res.status(403).json({ error: 'Accès administrateur requis' });
}

// ── Rôle minimum dans l'exploitation ─────────────────────────────────────────
const ROLE_LEVELS = { viewer: 0, ouvrier: 1, eleveur: 2, veterinaire: 3, admin: 4, super_admin: 99 };

export function requireRole(...roles) {
  return (req, res, next) => {
    if (req.user?.system_role === 'super_admin') return next();
    const userLevel = ROLE_LEVELS[req.user?.exploitation_role] ?? -1;
    const minLevel  = Math.min(...roles.map(r => ROLE_LEVELS[r] ?? 99));
    if (userLevel >= minLevel) return next();
    return res.status(403).json({ error: `Rôle requis : ${roles.join(' ou ')}` });
  };
}

// ── Vérifie que l'user appartient à l'exploitation ───────────────────────────
export function requireExploitation(req, res, next) {
  if (req.user?.system_role === 'super_admin') return next();
  if (!req.user?.exploitation_id) {
    return res.status(403).json({ error: 'Aucune exploitation associée' });
  }
  next();
}

// ── Helper audit ──────────────────────────────────────────────────────────────
export async function auditLog(req, action, resource, resourceId, oldValues, newValues) {
  try {
    await query(
      `INSERT INTO audit_logs
         (user_id, user_email, exploitation_id, action, resource, resource_id,
          old_values, new_values, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        req.user?.id   || null,
        req.user?.email || null,
        req.user?.exploitation_id || null,
        action,
        resource,
        resourceId ? String(resourceId) : null,
        oldValues  ? JSON.stringify(oldValues)  : null,
        newValues  ? JSON.stringify(newValues)  : null,
        req.ip    || null,
        req.headers['user-agent'] || null,
      ]
    );
  } catch { /* non-bloquant */ }
}
