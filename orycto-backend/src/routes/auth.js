import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, firstName: user.first_name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUser(u) {
  return {
    id:        u.id,
    email:     u.email,
    firstName: u.first_name,
    lastName:  u.last_name,
    role:      u.role,
    createdAt: u.created_at,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email.toLowerCase(), hash, firstName || null, lastName || null, role || 'Farm Owner']
    );

    const user = result.rows[0];
    const token = signToken(user);

    req.session.userId    = user.id;
    req.session.userEmail = user.email;

    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user   = result.rows[0];

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const token = signToken(user);

    req.session.userId    = user.id;
    req.session.userEmail = user.email;

    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const userId = req.session?.userId;
  const authHeader = req.headers.authorization;

  let id = userId;
  if (!id && authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      id = payload.id;
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  if (!id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: safeUser(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
