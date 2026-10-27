const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (_) {}
}

let memoryState = {
  users: [],
  applications: [],
};

// Load initial data from disk if present
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    memoryState = JSON.parse(raw);
    if (!Array.isArray(memoryState.users)) memoryState.users = [];
    if (!Array.isArray(memoryState.applications)) memoryState.applications = [];
  }
} catch (_) {}

const persist = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryState, null, 2), 'utf8');
  } catch (_) {}
};

const generateId = () => {
  return Math.random().toString(16).substring(2, 10) +
         Math.random().toString(16).substring(2, 10) +
         Math.random().toString(16).substring(2, 10);
};

const FallbackStore = {
  // Users
  async findUserByEmail(email) {
    const normalized = (email || '').toLowerCase().trim();
    return memoryState.users.find((u) => u.email === normalized) || null;
  },

  async findUserById(id) {
    const strId = String(id);
    return memoryState.users.find((u) => String(u._id) === strId) || null;
  },

  async createUser({ name, email, password }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      _id: generateId(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      async comparePassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
      },
    };
    memoryState.users.push(newUser);
    persist();
    return newUser;
  },

  // Applications
  async getApplications(userId, { status, search, sort }) {
    const strUserId = String(userId);
    let list = memoryState.applications.filter((a) => String(a.user) === strUserId);

    if (status && status !== 'All') {
      list = list.filter((a) => a.status === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) => (a.company || '').toLowerCase().includes(q) || (a.role || '').toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sort === 'deadline_asc') return new Date(a.deadline || 8640000000000000) - new Date(b.deadline || 8640000000000000);
      if (sort === 'deadline_desc') return new Date(b.deadline || -8640000000000000) - new Date(a.deadline || -8640000000000000);
      if (sort === 'applied_asc') return new Date(a.dateApplied || 0) - new Date(b.dateApplied || 0);
      if (sort === 'applied_desc') return new Date(b.dateApplied || 0) - new Date(a.dateApplied || 0);
      if (sort === 'company_asc') return (a.company || '').localeCompare(b.company || '');
      if (sort === 'company_desc') return (b.company || '').localeCompare(a.company || '');
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return list;
  },

  async getApplicationById(id, userId) {
    const strId = String(id);
    const strUserId = String(userId);
    return memoryState.applications.find((a) => String(a._id) === strId && String(a.user) === strUserId) || null;
  },

  async createApplication(userId, data) {
    const newApp = {
      _id: generateId(),
      user: String(userId),
      company: data.company,
      role: data.role,
      applicationUrl: data.applicationUrl || '',
      location: data.location || 'Remote',
      salary: data.salary || '',
      dateApplied: data.dateApplied ? new Date(data.dateApplied).toISOString() : new Date().toISOString(),
      deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
      status: data.status || 'Applied',
      notes: data.notes || '',
      interviewDate: data.interviewDate ? new Date(data.interviewDate).toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryState.applications.unshift(newApp);
    persist();
    return newApp;
  },

  async updateApplication(id, userId, updates) {
    const app = await this.getApplicationById(id, userId);
    if (!app) return null;

    Object.assign(app, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    persist();
    return app;
  },

  async deleteApplication(id, userId) {
    const strId = String(id);
    const strUserId = String(userId);
    const idx = memoryState.applications.findIndex(
      (a) => String(a._id) === strId && String(a.user) === strUserId
    );
    if (idx === -1) return false;
    memoryState.applications.splice(idx, 1);
    persist();
    return true;
  },

  async getStats(userId) {
    const list = await this.getApplications(userId, {});
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const total = list.length;
    const applied = list.filter((a) => a.status === 'Applied').length;
    const assessment = list.filter((a) => a.status === 'Assessment').length;
    const interview = list.filter((a) => a.status === 'Interview').length;
    const offer = list.filter((a) => a.status === 'Offer').length;
    const rejected = list.filter((a) => a.status === 'Rejected').length;

    const inProgress = applied + assessment + interview;
    const responseRate = total > 0 ? Math.round(((interview + offer + rejected) / total) * 100) : 0;
    const appliedThisWeek = list.filter((a) => new Date(a.dateApplied) >= startOfWeek).length;
    const upcomingDeadlines = list.filter(
      (a) => a.deadline && new Date(a.deadline) >= now && new Date(a.deadline) <= sevenDaysFromNow && a.status !== 'Rejected' && a.status !== 'Offer'
    ).length;

    // Monthly trend
    const months = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }
    list.forEach((a) => {
      const d = new Date(a.dateApplied || a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key] !== undefined) {
        months[key]++;
      }
    });

    const monthlyTrend = Object.keys(months).map((month) => ({
      month,
      count: months[month],
    }));

    return {
      total,
      inProgress,
      interview,
      offer,
      rejected,
      appliedThisWeek,
      upcomingDeadlines,
      responseRate,
      byStatus: {
        Applied: applied,
        Assessment: assessment,
        Interview: interview,
        Offer: offer,
        Rejected: rejected,
      },
      monthlyTrend,
    };
  },
};

module.exports = FallbackStore;
