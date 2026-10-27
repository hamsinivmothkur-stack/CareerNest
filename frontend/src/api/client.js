const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    if (window.location.origin.includes('careernest-3.onrender.com')) {
      return '/api';
    }
  }
  return 'https://careernest-3.onrender.com/api';
};

export const API_BASE = getApiBase();

const getAuthHeaders = () => {
  const token = localStorage.getItem('careernest_token') || localStorage.getItem('applytrack_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Clear token if expired or unauthorized
      localStorage.removeItem('careernest_token');
      localStorage.removeItem('careernest_user');
      localStorage.removeItem('applytrack_token');
      localStorage.removeItem('applytrack_user');
      window.dispatchEvent(new Event('auth-change'));
    }

    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth endpoints
  auth: {
    async register(name, email, password) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      return handleResponse(res);
    },

    async login(email, password) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },

    async getMe() {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Applications endpoints
  applications: {
    async getAll(params = {}) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append('search', params.search);
      if (params.status && params.status !== 'All') searchParams.append('status', params.status);
      if (params.sort) searchParams.append('sort', params.sort);

      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const res = await fetch(`${API_BASE}/applications${qs}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    async getById(id) {
      const res = await fetch(`${API_BASE}/applications/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    async create(applicationData) {
      const res = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(applicationData),
      });
      return handleResponse(res);
    },

    async update(id, applicationData) {
      const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(applicationData),
      });
      return handleResponse(res);
    },

    async updateStatus(id, status) {
      const res = await fetch(`${API_BASE}/applications/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },

    async delete(id) {
      const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    async getStats() {
      const res = await fetch(`${API_BASE}/applications/stats/dashboard`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Health check
  health: {
    async check() {
      const res = await fetch(`${API_BASE}/health`);
      return handleResponse(res);
    },
  },
};
