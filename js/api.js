const BASE_URL = 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('orycto_token');
}

async function request(method, endpoint, body = null) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('orycto_token');
    window.location.hash = '';
    location.reload();
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Erreur ${res.status}`);
  }

  return res.json();
}

const get    = (ep)        => request('GET',    ep);
const post   = (ep, body)  => request('POST',   ep, body);
const put    = (ep, body)  => request('PUT',    ep, body);
const del    = (ep)        => request('DELETE', ep);

export const api = {
  dashboard: {
    get:          () => get('/dashboard'),
    statistiques: () => get('/dashboard/statistiques'),
  },

  lapins: {
    getAll: (filters = {}) => {
      const q = new URLSearchParams(filters).toString();
      return get(`/lapins${q ? '?' + q : ''}`);
    },
    getOne: (id)       => get(`/lapins/${id}`),
    create: (data)     => post('/lapins', data),
    update: (id, data) => put(`/lapins/${id}`, data),
    delete: (id)       => del(`/lapins/${id}`),
  },

  races: {
    getAll: () => get('/races'),
    create: (data)     => post('/races', data),
    delete: (id)       => del(`/races/${id}`),
  },

  cages: {
    getAll: () => get('/cages'),
    create: (data)     => post('/cages', data),
    update: (id, data) => put(`/cages/${id}`, data),
    delete: (id)       => del(`/cages/${id}`),
  },

  sante: {
    getAll: (filters = {}) => {
      const q = new URLSearchParams(filters).toString();
      return get(`/sante${q ? '?' + q : ''}`);
    },
    create:           (data)     => post('/sante', data),
    update:           (id, data) => put(`/sante/${id}`, data),
    delete:           (id)       => del(`/sante/${id}`),
    pathologies:      ()         => get('/sante/pathologies'),
    createPathologie: (data)     => post('/sante/pathologies', data),
    updatePathologie: (id, data) => put(`/sante/pathologies/${id}`, data),
    deletePathologie: (id)       => del(`/sante/pathologies/${id}`),
    traitements:      ()         => get('/sante/traitements'),
    createTraitement: (data)     => post('/sante/traitements', data),
    deleteTraitement: (id)       => del(`/sante/traitements/${id}`),
  },

  reproduction: {
    getAll:       ()         => get('/reproduction'),
    create:       (data)     => post('/reproduction', data),
    update:       (id, data) => put(`/reproduction/${id}`, data),
    delete:       (id)       => del(`/reproduction/${id}`),
    portees:      ()         => get('/reproduction/portees'),
    createPortee: (data)     => post('/reproduction/portees', data),
    deletePortee: (id)       => del(`/reproduction/portees/${id}`),
    naissance:    (id, data) => post(`/reproduction/${id}/naissance`, data),
  },

  alimentation: {
    aliments:      ()         => get('/alimentation/aliments'),
    createAliment: (data)     => post('/alimentation/aliments', data),
    updateAliment: (id, data) => put(`/alimentation/aliments/${id}`, data),
    deleteAliment: (id)       => del(`/alimentation/aliments/${id}`),

    stocks:      ()         => get('/alimentation/stocks'),
    createStock: (data)     => post('/alimentation/stocks', data),
    updateStock: (id, data) => put(`/alimentation/stocks/${id}`, data),
    deleteStock: (id)       => del(`/alimentation/stocks/${id}`),
    restock:     (data)     => post('/alimentation/stocks/restock', data),

    rations:      ()         => get('/alimentation/rations'),
    createRation: (data)     => post('/alimentation/rations', data),
    deleteRation: (id)       => del(`/alimentation/rations/${id}`),

    distributions: ()     => get('/alimentation/distributions'),
    addDist:       (data) => post('/alimentation/distributions', data),
    deleteDist:    (id)   => del(`/alimentation/distributions/${id}`),
  },

  evenements: {
    getAll: ()         => get('/evenements'),
    create: (data)     => post('/evenements', data),
    update: (id, data) => put(`/evenements/${id}`, data),
    delete: (id)       => del(`/evenements/${id}`),
  },

  couts: {
    getAll: ()         => get('/couts'),
    create: (data)     => post('/couts', data),
    delete: (id)       => del(`/couts/${id}`),
  },

  perf: {
    getAll: ()         => get('/perf'),
    create: (data)     => post('/perf', data),
    delete: (id)       => del(`/perf/${id}`),
  },
};
