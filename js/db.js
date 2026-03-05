const PREFIX = 'orycto_';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function load(table) {
  try {
    const r = await window.storage.get(PREFIX + table);
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}

async function save(table, rows) {
  try {
    await window.storage.set(PREFIX + table, JSON.stringify(rows));
  } catch {}
}

export const db = {
  async getAll(table, filterFn = null) {
    const rows = await load(table);
    return filterFn ? rows.filter(filterFn) : rows;
  },

  async getOne(table, id) {
    const rows = await load(table);
    return rows.find(r => r.id === id) || null;
  },

  async create(table, data) {
    const rows = await load(table);
    const row = { ...data, id: genId(), createdAt: new Date().toISOString() };
    rows.push(row);
    await save(table, rows);
    return row;
  },

  async update(table, id, data) {
    const rows = await load(table);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Record not found');
    rows[idx] = { ...rows[idx], ...data };
    await save(table, rows);
    return rows[idx];
  },

  async delete(table, id) {
    const rows = await load(table);
    const next = rows.filter(r => r.id !== id);
    await save(table, next);
    return { deleted: id };
  },
};
