import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { requireAuth, auditLog } from '../middleware/auth.js';

const router = Router();

const TERMS_VERSION   = '1.0';
const PRIVACY_VERSION = '1.0';

const SYSTEM_EXPLOIT_ID = '00000000-0000-0000-0000-000000000001';

function signToken(user) {
  return jwt.sign(
    {
      id:              user.id,
      email:           user.email,
      firstName:       user.first_name,
      systemRole:      user.system_role,
      exploitationId:  user.exploitation_id,
      exploitRole:     user.exploitation_role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUser(u) {
  return {
    id:               u.id,
    email:            u.email,
    firstName:        u.first_name,
    lastName:         u.last_name,
    phone:            u.phone,
    systemRole:       u.system_role,
    status:           u.status,
    exploitationId:   u.exploitation_id,
    exploitationRole: u.exploitation_role,
    termsAccepted:    u.terms_accepted,
    privacyAccepted:  u.privacy_accepted,
    createdAt:        u.created_at,
  };
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, phone,
      termsAccepted, privacyAccepted,
      invitationToken,
    } = req.body;

    // Validation
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Prénom, email et mot de passe requis' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Mot de passe : minimum 8 caractères' });
    }
    if (!termsAccepted || !privacyAccepted) {
      return res.status(400).json({
        error: 'Vous devez accepter les Conditions d\'utilisation et la Politique de confidentialité',
        code: 'CONSENT_REQUIRED',
      });
    }

    // Email déjà utilisé ?
    const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const hash = await bcrypt.hash(password, 12);
    const now  = new Date().toISOString();

    // Invitation ?
    let exploitationId  = null;
    let exploitRole     = 'eleveur';
    let userStatus      = 'pending';
    let invitation      = null;

    if (invitationToken) {
      const inv = await query(
        `SELECT * FROM invitations
         WHERE token = $1 AND accepted = FALSE AND expires_at > NOW()`,
        [invitationToken]
      );
      if (!inv.rows.length) {
        return res.status(400).json({ error: 'Invitation invalide ou expirée', code: 'INVALID_INVITATION' });
      }
      invitation      = inv.rows[0];
      exploitationId  = invitation.exploitation_id;
      exploitRole     = invitation.role;
      userStatus      = 'active';
    }

    // Créer l'user
    const result = await query(
      `INSERT INTO users
         (email, password_hash, first_name, last_name, phone,
          status, exploitation_id, exploitation_role,
          terms_accepted, terms_accepted_at, terms_version,
          privacy_accepted, privacy_accepted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        email.toLowerCase(), hash,
        firstName, lastName || null, phone || null,
        userStatus, exploitationId, exploitRole,
        true, now, TERMS_VERSION,
        true, now,
      ]
    );

    const user = result.rows[0];

    // Tracer le consentement
    await query(
      `INSERT INTO legal_consents (user_id, type, version, ip_address, user_agent)
       VALUES ($1,'both',$2,$3,$4)`,
      [user.id, TERMS_VERSION, req.ip || null, req.headers['user-agent'] || null]
    );

    // Marquer l'invitation acceptée
    if (invitation) {
      await query(
        `UPDATE invitations SET accepted = TRUE, accepted_at = NOW() WHERE id = $1`,
        [invitation.id]
      );
    }

    // Notifier les admins si pending
    if (userStatus === 'pending') {
      // En production : envoyer un email aux admins
      // Pour l'instant : créer une notification
      const admins = await query(
        `SELECT id FROM users WHERE system_role = 'super_admin' OR
         (exploitation_role = 'admin' AND exploitation_id = $1)`,
        [exploitationId || SYSTEM_EXPLOIT_ID]
      );
      for (const admin of admins.rows) {
        await query(
          `INSERT INTO notifications (user_id, exploitation_id, type, titre, message)
           VALUES ($1,$2,'new_user_pending',$3,$4)`,
          [
            admin.id, exploitationId || SYSTEM_EXPLOIT_ID,
            'Nouvelle demande d\'accès',
            `${firstName} ${lastName || ''} (${email}) a demandé l\'accès à l\'application.`,
          ]
        );
      }
    }

    await auditLog(
      { user: { id: user.id, email: user.email, exploitation_id: exploitationId }, ip: req.ip, headers: req.headers },
      'REGISTER', 'users', user.id, null, { email, status: userStatus }
    );

    if (userStatus === 'pending') {
      return res.status(201).json({
        message: 'Compte créé. En attente d\'approbation par un administrateur.',
        status: 'pending',
      });
    }

    const token = signToken(user);
    req.session.userId    = user.id;
    req.session.userEmail = user.email;

    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user   = result.rows[0];

    // Compte verrouillé ?
    if (user?.locked_until && new Date(user.locked_until) > new Date()) {
      const minutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(429).json({ error: `Compte verrouillé — réessayez dans ${minutes} min` });
    }

    const valid = user && await bcrypt.compare(password, user.password_hash);

    if (!valid || !user.active) {
      if (user) {
        const fails = (user.failed_login_count || 0) + 1;
        const lockUntil = fails >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null;
        await query(
          `UPDATE users SET failed_login_count = $1, locked_until = $2 WHERE id = $3`,
          [fails, lockUntil, user.id]
        );
      }
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (user.status === 'pending')   return res.status(403).json({ error: 'Compte en attente d\'approbation', code: 'PENDING' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Compte suspendu', code: 'SUSPENDED' });
    if (user.status === 'rejected')  return res.status(403).json({ error: 'Accès refusé', code: 'REJECTED' });

    // Reset échecs + màj last_login
    await query(
      `UPDATE users SET
         failed_login_count = 0,
         locked_until       = NULL,
         last_login_at      = NOW(),
         last_login_ip      = $1,
         login_count        = login_count + 1
       WHERE id = $2`,
      [req.ip || null, user.id]
    );

    await auditLog(
      { user, ip: req.ip, headers: req.headers },
      'LOGIN', 'users', user.id, null, null
    );

    const token = signToken(user);
    req.session.userId    = user.id;
    req.session.userEmail = user.email;

    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Déconnecté' });
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, e.nom AS exploitation_nom
       FROM users u
       LEFT JOIN exploitations e ON e.id = u.exploitation_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const u = result.rows[0];
    res.json({ user: { ...safeUser(u), exploitationNom: u.exploitation_nom } });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/auth/init-super-admin ──────────────────────────────────────────
// Route one-shot pour créer le premier super admin si aucun n'existe
router.post('/init-super-admin', async (req, res) => {
  try {
    const existing = await query(
      `SELECT id FROM users WHERE system_role = 'super_admin' LIMIT 1`
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Un super-administrateur existe déjà' });
    }

    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Prénom, email et mot de passe requis' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users
         (email, password_hash, first_name, last_name,
          system_role, status, exploitation_id,
          terms_accepted, terms_accepted_at, terms_version,
          privacy_accepted, privacy_accepted_at)
       VALUES ($1,$2,$3,$4,'super_admin','active',$5,TRUE,NOW(),$6,TRUE,NOW())
       RETURNING *`,
      [email.toLowerCase(), hash, firstName, lastName || null,
       SYSTEM_EXPLOIT_ID, TERMS_VERSION]
    );

    const user  = result.rows[0];
    const token = signToken(user);

    req.session.userId    = user.id;
    req.session.userEmail = user.email;

    res.status(201).json({
      message: 'Super-administrateur créé avec succès',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
