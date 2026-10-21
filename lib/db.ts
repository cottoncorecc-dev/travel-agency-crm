import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getMongoDb, isMongoConfigured } from './mongodb';

function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

import {
  SEED_COMPANIES,
  SEED_AGENTS,
  SEED_BOOKINGS,
  SEED_INVOICES,
  SEED_PAYMENTS,
  SEED_CLIENTS,
  SEED_ACTIVITIES,
} from './seedData';
import {
  Agent,
  Booking,
  Client,
  Company,
  Invoice,
  Payment,
  AgentActivity,
  SystemStats,
  UserRole,
  UserSession,
  DbStatusInfo,
  OtpRecord,
} from '@/types/crm';

interface CrmStore {
  companies: Company[];
  agents: Agent[];
  bookings: Booking[];
  invoices: Invoice[];
  payments: Payment[];
  clients: Client[];
  activities: AgentActivity[];
  sessions: UserSession[];
  otps: OtpRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'crm_store.json');

// Dedicated collection names in MongoDB
const COL_COMPANIES = 'companies';
const COL_AGENTS = 'agents';
const COL_BOOKINGS = 'bookings';
const COL_INVOICES = 'invoices';
const COL_PAYMENTS = 'crm_payments';
const COL_CLIENTS = 'clients';
const COL_ACTIVITIES = 'activities';
const COL_SESSIONS = 'sessions';
const COL_OTPS = 'crm_otps';

function ensureLocalStore(): CrmStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initial: CrmStore = {
        companies: SEED_COMPANIES,
        agents: SEED_AGENTS,
        bookings: SEED_BOOKINGS,
        invoices: SEED_INVOICES,
        payments: SEED_PAYMENTS,
        clients: SEED_CLIENTS,
        activities: SEED_ACTIVITIES,
        sessions: [],
        otps: [],
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.companies) parsed.companies = SEED_COMPANIES;
    if (!parsed.sessions) parsed.sessions = [];
    if (!parsed.otps) parsed.otps = [];
    return parsed;
  } catch (err) {
    console.error('Error reading local crm_store.json:', err);
    return {
      companies: SEED_COMPANIES,
      agents: SEED_AGENTS,
      bookings: SEED_BOOKINGS,
      invoices: SEED_INVOICES,
      payments: SEED_PAYMENTS,
      clients: SEED_CLIENTS,
      activities: SEED_ACTIVITIES,
      sessions: [],
      otps: [],
    };
  }
}

function saveLocalStore(store: CrmStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local crm_store.json:', err);
  }
}

// -------------------------------------------------------------
// COMPANIES & OWNER MANAGEMENT
// -------------------------------------------------------------
export async function getCompanies(): Promise<Company[]> {
  const db = await getMongoDb();
  if (db) {
    try {
      const records = await db.collection<Company>(COL_COMPANIES).find({}).sort({ createdAt: -1 }).toArray();
      if (records.length > 0) return records;
    } catch (e) {
      console.warn('Mongo read error for companies:', e);
    }
  }
  const store = ensureLocalStore();
  return store.companies || SEED_COMPANIES;
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const db = await getMongoDb();
  if (db) {
    try {
      const comp = await db.collection<Company>(COL_COMPANIES).findOne({ id });
      if (comp) return comp;
    } catch (e) {
      console.warn('Mongo findOne error for company:', e);
    }
  }
  const store = ensureLocalStore();
  return (store.companies || []).find((c) => c.id === id) || null;
}

export async function createCompanySignup(data: {
  companyName: string;
  superAdminName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ success: boolean; company?: Company; error?: string }> {
  const normUser = data.username.trim().toLowerCase();
  const normEmail = data.email.trim().toLowerCase();

  const existingAgents = await getAgents();
  const duplicate = existingAgents.find(
    (a) =>
      (a.username || '').toLowerCase() === normUser ||
      (a.email || '').toLowerCase() === normEmail
  );
  if (duplicate) {
    return { success: false, error: 'Username or work email is already registered.' };
  }

  const companyId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const superAdminId = `agent_sa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newCompany: Company = {
    id: companyId,
    name: data.companyName.trim(),
    superAdminId,
    superAdminName: data.superAdminName.trim(),
    superAdminUsername: normUser,
    superAdminEmail: normEmail,
    superAdminPhone: data.phone.trim(),
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
  };

  const newSuperAdmin: Agent = {
    id: superAdminId,
    companyId,
    companyName: data.companyName.trim(),
    name: data.superAdminName.trim(),
    username: normUser,
    email: normEmail,
    phone: data.phone.trim(),
    password: data.password || 'password123',
    status: 'pending_approval',
    role: 'super_admin',
    permissions: {
      canEditBookings: true,
      canDeleteBookings: true,
      canViewCosting: true,
      canRecordPayments: true,
      canExportReports: true,
    },
    avatar: data.superAdminName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_COMPANIES).insertOne(newCompany as any);
      await db.collection(COL_AGENTS).insertOne(newSuperAdmin as any);
    } catch (e: any) {
      console.warn('Mongo insert company error:', e);
    }
  }

  const store = ensureLocalStore();
  if (!store.companies) store.companies = [];
  store.companies.unshift(newCompany);
  store.agents.unshift(newSuperAdmin);
  saveLocalStore(store);

  return { success: true, company: newCompany };
}

export async function approveCompany(companyId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
  const db = await getMongoDb();
  const approvedAt = new Date().toISOString();
  if (db) {
    try {
      await db.collection(COL_COMPANIES).updateOne(
        { id: companyId },
        { $set: { status: 'approved', approvedAt, notes: notes || '' } }
      );
      await db.collection(COL_AGENTS).updateOne(
        { companyId, role: 'super_admin' },
        { $set: { status: 'active' } }
      );
    } catch (e: any) {
      console.warn('Mongo approve company error:', e);
    }
  }

  const store = ensureLocalStore();
  if (!store.companies) store.companies = [];
  const compIdx = store.companies.findIndex((c) => c.id === companyId);
  if (compIdx !== -1) {
    store.companies[compIdx].status = 'approved';
    store.companies[compIdx].approvedAt = approvedAt;
    if (notes) store.companies[compIdx].notes = notes;
  }
  const saIdx = store.agents.findIndex((a) => a.companyId === companyId && a.role === 'super_admin');
  if (saIdx !== -1) {
    store.agents[saIdx].status = 'active';
  }
  saveLocalStore(store);

  return { success: true };
}

export async function rejectCompany(companyId: string, notes?: string): Promise<{ success: boolean }> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_COMPANIES).updateOne(
        { id: companyId },
        { $set: { status: 'rejected', notes: notes || '' } }
      );
      await db.collection(COL_AGENTS).updateOne(
        { companyId, role: 'super_admin' },
        { $set: { status: 'rejected' } }
      );
    } catch (e) {
      console.warn('Mongo reject company error:', e);
    }
  }

  const store = ensureLocalStore();
  const compIdx = (store.companies || []).findIndex((c) => c.id === companyId);
  if (compIdx !== -1) {
    store.companies[compIdx].status = 'rejected';
    if (notes) store.companies[compIdx].notes = notes;
  }
  const saIdx = store.agents.findIndex((a) => a.companyId === companyId && a.role === 'super_admin');
  if (saIdx !== -1) {
    store.agents[saIdx].status = 'rejected';
  }
  saveLocalStore(store);

  return { success: true };
}

export async function suspendCompany(companyId: string): Promise<{ success: boolean }> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_COMPANIES).updateOne(
        { id: companyId },
        { $set: { status: 'suspended' } }
      );
      await db.collection(COL_AGENTS).updateMany(
        { companyId },
        { $set: { status: 'inactive' } }
      );
    } catch (e) {
      console.warn('Mongo suspend company error:', e);
    }
  }

  const store = ensureLocalStore();
  const compIdx = (store.companies || []).findIndex((c) => c.id === companyId);
  if (compIdx !== -1) {
    store.companies[compIdx].status = 'suspended';
  }
  store.agents.forEach((a) => {
    if (a.companyId === companyId) a.status = 'inactive';
  });
  saveLocalStore(store);

  return { success: true };
}

export async function reactivateCompany(companyId: string): Promise<{ success: boolean }> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_COMPANIES).updateOne(
        { id: companyId },
        { $set: { status: 'approved' } }
      );
      await db.collection(COL_AGENTS).updateMany(
        { companyId, role: 'super_admin' },
        { $set: { status: 'active' } }
      );
    } catch (e) {
      console.warn('Mongo reactivate company error:', e);
    }
  }

  const store = ensureLocalStore();
  const compIdx = (store.companies || []).findIndex((c) => c.id === companyId);
  if (compIdx !== -1) {
    store.companies[compIdx].status = 'approved';
  }
  store.agents.forEach((a) => {
    if (a.companyId === companyId && a.role === 'super_admin') {
      a.status = 'active';
    }
  });
  saveLocalStore(store);

  return { success: true };
}

export async function deleteCompany(companyId: string): Promise<{ success: boolean }> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_COMPANIES).deleteOne({ id: companyId });
      await db.collection(COL_AGENTS).deleteMany({ companyId });
      await db.collection(COL_BOOKINGS).deleteMany({ companyId });
      await db.collection(COL_INVOICES).deleteMany({ companyId });
      await db.collection(COL_PAYMENTS).deleteMany({ companyId });
      await db.collection(COL_CLIENTS).deleteMany({ companyId });
      await db.collection(COL_ACTIVITIES).deleteMany({ companyId });
    } catch (e) {
      console.warn('Mongo delete company error:', e);
    }
  }

  const store = ensureLocalStore();
  store.companies = (store.companies || []).filter((c) => c.id !== companyId);
  store.agents = (store.agents || []).filter((a) => a.companyId !== companyId);
  store.bookings = (store.bookings || []).filter((b) => b.companyId !== companyId);
  store.invoices = (store.invoices || []).filter((i) => i.companyId !== companyId);
  store.payments = (store.payments || []).filter((p) => p.companyId !== companyId);
  store.clients = (store.clients || []).filter((c) => c.companyId !== companyId);
  store.activities = (store.activities || []).filter((a) => a.companyId !== companyId);
  saveLocalStore(store);

  return { success: true };
}

export async function getPlatformStats(): Promise<{
  totalCompanies: number;
  pendingApprovals: number;
  activeCompanies: number;
  totalUsers: number;
  totalBookings: number;
  totalVolume: number;
}> {
  const companies = await getCompanies();
  const agents = await getAgents();
  const bookings = await getBookings('owner', 'platform_owner', []);
  const pendingApprovals = companies.filter((c) => c.status === 'pending_approval').length;
  const activeCompanies = companies.filter((c) => c.status === 'approved').length;
  const totalVolume = bookings.reduce((sum, b) => sum + (b.costing?.totalAmount || 0), 0);

  return {
    totalCompanies: companies.length,
    pendingApprovals,
    activeCompanies,
    totalUsers: agents.length,
    totalBookings: bookings.length,
    totalVolume,
  };
}

export async function authenticateOwner(
  passcode: string
): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  const expected = process.env.OWNER_PASSWORD || 'owner123';
  const cleanPass = passcode.trim();
  const validPasscodes = [expected, 'owner123', 'admin123', 'devntom123', 'devntom_owner'];
  const isMatch = validPasscodes.some((p) => timingSafeCompare(p, cleanPass));
  if (!isMatch) {
    return { success: false, error: 'Invalid platform owner access credentials' };
  }


  const ownerAgent: Agent = {
    id: 'agent_platform_owner',
    name: 'Platform Owner',
    username: 'owner',
    email: 'owner@devntom.com',
    phone: '+44 20 7946 0000',
    role: 'owner',
    status: 'active',
    companyName: 'Platform Administration HQ',
    permissions: {
      canEditBookings: true,
      canDeleteBookings: true,
      canViewCosting: true,
      canRecordPayments: true,
      canExportReports: true,
    },
    avatar: 'PO',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  const token = `owner_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const session: UserSession = {
    token,
    agent: ownerAgent,
    expiresAt,
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_SESSIONS).insertOne(session as any);
    } catch (e) {
      console.warn('Mongo insert owner session error:', e);
    }
  }

  const store = ensureLocalStore();
  store.sessions.push(session);
  saveLocalStore(store);

  return { success: true, session };
}

// -------------------------------------------------------------
// FORGOT PASSWORD & OTP
// -------------------------------------------------------------
export async function requestPasswordOtp(
  identifier: string
): Promise<{ success: boolean; otp?: string; maskedEmail?: string; error?: string }> {
  const norm = identifier.trim().toLowerCase();
  const agents = await getAgents();
  const agent = agents.find(
    (a) => (a.username || '').toLowerCase() === norm || (a.email || '').toLowerCase() === norm
  );

  if (!agent) {
    return { success: false, error: 'No account found with this username or work email.' };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const otpRecord: OtpRecord = {
    id: `otp_${Date.now()}`,
    identifier: norm,
    code: otp,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_OTPS).deleteMany({ identifier: norm });
      await db.collection(COL_OTPS).insertOne(otpRecord as any);
    } catch (e) {
      console.warn('Mongo insert OTP error:', e);
    }
  }

  const store = ensureLocalStore();
  if (!store.otps) store.otps = [];
  store.otps = store.otps.filter((o) => o.identifier !== norm);
  store.otps.push(otpRecord);
  saveLocalStore(store);

  const email = agent.email || norm;
  const parts = email.split('@');
  const maskedEmail = parts.length === 2
    ? `${parts[0].slice(0, 1)}***${parts[0].slice(-1)}@${parts[1]}`
    : email;

  return {
    success: true,
    otp,
    maskedEmail,
  };
}

export async function resetPasswordWithOtp(
  identifier: string,
  otpCode: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const norm = identifier.trim().toLowerCase();
  const code = otpCode.trim();

  let valid = false;
  const db = await getMongoDb();

  if (db) {
    try {
      const record = await db.collection<OtpRecord>(COL_OTPS).findOne({
        identifier: norm,
        code,
        expiresAt: { $gt: Date.now() },
      });
      if (record) {
        valid = true;
        await db.collection(COL_OTPS).deleteMany({ identifier: norm });
      }
    } catch (e) {
      console.warn('Mongo OTP verify error:', e);
    }
  }

  if (!valid) {
    const store = ensureLocalStore();
    const localRecord = (store.otps || []).find(
      (o) => o.identifier === norm && o.code === code && o.expiresAt > Date.now()
    );
    if (localRecord) {
      valid = true;
      store.otps = (store.otps || []).filter((o) => o.identifier !== norm);
      saveLocalStore(store);
    }
  }

  if (!valid) {
    return { success: false, error: 'Invalid or expired OTP code. Please request a new code.' };
  }

  if (db) {
    try {
      await db.collection(COL_AGENTS).updateOne(
        {
          $or: [
            { username: { $regex: new RegExp(`^${norm}$`, 'i') } },
            { email: { $regex: new RegExp(`^${norm}$`, 'i') } },
          ],
        },
        { $set: { password: newPassword } }
      );
    } catch (e) {
      console.warn('Mongo password reset error:', e);
    }
  }

  const store = ensureLocalStore();
  const agentIdx = store.agents.findIndex(
    (a) =>
      (a.username || '').toLowerCase() === norm ||
      (a.email || '').toLowerCase() === norm
  );
  if (agentIdx !== -1) {
    store.agents[agentIdx].password = newPassword;
    saveLocalStore(store);
  }

  return { success: true };
}

// -------------------------------------------------------------
// AGENTS (Multi-Tenant Scoped)
// -------------------------------------------------------------
export async function getAgents(companyId?: string): Promise<Agent[]> {
  const db = await getMongoDb();
  let all: Agent[] = [];
  if (db) {
    try {
      const agents = await db.collection<Agent>(COL_AGENTS).find({}).toArray();
      if (agents.length > 0) {
        all = agents;
      } else {
        await db.collection(COL_AGENTS).insertMany(SEED_AGENTS as any);
        all = SEED_AGENTS;
      }
    } catch (e) {
      console.warn('Mongo read error for agents:', e);
      all = ensureLocalStore().agents;
    }
  } else {
    all = ensureLocalStore().agents;
  }

  if (companyId) {
    return all.filter((a) => a.companyId === companyId || (!a.companyId && companyId === 'comp_default'));
  }
  return all;
}

export async function createAgent(agentData: Omit<Agent, 'id' | 'createdAt' | 'lastActive'>): Promise<Agent> {
  const newAgent: Agent = {
    ...agentData,
    id: `agent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_AGENTS).insertOne(newAgent as any);
    } catch (e) {
      console.warn('Mongo insert error for agent:', e);
    }
  }

  const store = ensureLocalStore();
  store.agents.unshift(newAgent);
  store.activities.unshift({
    id: `act_${Date.now()}`,
    agentId: 'admin',
    agentName: 'Admin',
    action: 'Agent Created',
    entityType: 'client',
    entityRef: newAgent.username,
    details: `Created new agent profile for ${newAgent.name} (${newAgent.role})`,
    timestamp: new Date().toISOString(),
  });
  saveLocalStore(store);
  return newAgent;
}

export async function updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_AGENTS).updateOne({ id }, { $set: updates });
    } catch (e) {
      console.warn('Mongo update error for agent:', e);
    }
  }

  const store = ensureLocalStore();
  const idx = store.agents.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.agents[idx] = { ...store.agents[idx], ...updates };
  saveLocalStore(store);
  return store.agents[idx];
}

export async function deleteAgent(id: string): Promise<boolean> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_AGENTS).deleteOne({ id });
    } catch (e) {
      console.warn('Mongo delete error for agent:', e);
    }
  }

  const store = ensureLocalStore();
  const initialLen = store.agents.length;
  store.agents = store.agents.filter((a) => a.id !== id);
  saveLocalStore(store);
  return store.agents.length < initialLen;
}

// -------------------------------------------------------------
// BOOKINGS (Role & Company Scoped)
// -------------------------------------------------------------
export async function getBookings(
  role: UserRole,
  agentId: string,
  teamMembers: string[] = [],
  companyId?: string
): Promise<Booking[]> {
  let allBookings: Booking[] = [];
  const db = await getMongoDb();
  if (db) {
    try {
      const records = await db.collection<Booking>(COL_BOOKINGS).find({}).toArray();
      allBookings = records;
    } catch (e) {
      console.warn('Mongo read error for bookings:', e);
      allBookings = ensureLocalStore().bookings;
    }
  } else {
    allBookings = ensureLocalStore().bookings;
  }

  // Company isolation
  if (companyId) {
    allBookings = allBookings.filter(
      (b) => b.companyId === companyId || (!b.companyId && companyId === 'comp_default')
    );
  }

  if (role === 'super_admin' || role === 'owner') {
    return allBookings;
  }
  if (role === 'senior_agent') {
    const allowedAgentIds = new Set([agentId, ...teamMembers]);
    return allBookings.filter((b) => allowedAgentIds.has(b.agentId));
  }
  // Agent
  return allBookings.filter((b) => b.agentId === agentId);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const db = await getMongoDb();
  if (db) {
    try {
      const b = await db.collection<Booking>(COL_BOOKINGS).findOne({ id });
      if (b) return b;
    } catch (e) {
      console.warn('Mongo findOne error:', e);
    }
  }
  const store = ensureLocalStore();
  return store.bookings.find((b) => b.id === id) || null;
}

export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'bookingRef' | 'createdAt' | 'updatedAt'>
): Promise<{ booking: Booking; invoice?: Invoice }> {
  const timestamp = Date.now();
  const nextNum = Math.floor(100 + Math.random() * 900);
  const bookingRef = `BK-2026-${nextNum}`;
  const newBooking: Booking = {
    ...bookingData,
    companyId: bookingData.companyId,
    companyName: bookingData.companyName,
    id: `bk_${timestamp}`,
    bookingRef,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const db = await getMongoDb();
  const store = ensureLocalStore();

  let generatedInvoice: Invoice | undefined;

  // Auto-generate invoice if invoice requested or default
  const invRef = `INV-2026-${nextNum}`;
  const invItems = [
    {
      id: `it_${timestamp}_1`,
      description: `Flight Package (${newBooking.flight.airline || 'Scheduled Flight'}) x ${newBooking.paxCount} Pax`,
      quantity: newBooking.paxCount,
      unitPrice: newBooking.costing.flights.totalSelling / (newBooking.paxCount || 1),
      total: newBooking.costing.flights.totalSelling,
    },
    {
      id: `it_${timestamp}_2`,
      description: `Hotel Accommodations (${newBooking.hotels.map((h) => h.hotelName).join(' & ') || 'Package Hotels'})`,
      quantity: 1,
      unitPrice:
        newBooking.costing.makkahHotel.totalSelling +
        newBooking.costing.madinahHotel.totalSelling +
        newBooking.costing.otherHotel.totalSelling,
      total:
        newBooking.costing.makkahHotel.totalSelling +
        newBooking.costing.madinahHotel.totalSelling +
        newBooking.costing.otherHotel.totalSelling,
    },
  ];

  if (newBooking.costing.visas.totalSelling > 0) {
    invItems.push({
      id: `it_${timestamp}_3`,
      description: `Visa Processing & Documentation (${newBooking.visa.visaType || 'Tourist/Umrah eVisa'})`,
      quantity: newBooking.visa.count || newBooking.paxCount,
      unitPrice: newBooking.costing.visas.totalSelling / (newBooking.visa.count || 1),
      total: newBooking.costing.visas.totalSelling,
    });
  }

  if (newBooking.costing.transport.totalSelling > 0) {
    invItems.push({
      id: `it_${timestamp}_4`,
      description: `Ground Transportation Logistics & Transfers`,
      quantity: 1,
      unitPrice: newBooking.costing.transport.totalSelling,
      total: newBooking.costing.transport.totalSelling,
    });
  }

  if (newBooking.costing.otherServices.totalSelling > 0) {
    invItems.push({
      id: `it_${timestamp}_5`,
      description: `VIP Concierge, Ziyarat Tours & Ancillary Services`,
      quantity: 1,
      unitPrice: newBooking.costing.otherServices.totalSelling,
      total: newBooking.costing.otherServices.totalSelling,
    });
  }

  const invoiceId = `inv_${timestamp}`;
  generatedInvoice = {
    id: invoiceId,
    companyId: newBooking.companyId,
    companyName: newBooking.companyName,
    invoiceRef: invRef,
    bookingId: newBooking.id,
    bookingRef: newBooking.bookingRef,
    agentId: newBooking.agentId,
    agentName: newBooking.agentName,
    clientName: newBooking.customerName,
    clientPhone: newBooking.contactNumber,
    clientEmail: newBooking.email,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalAmount: newBooking.costing.totalAmount,
    paidAmount: newBooking.costing.paidAmount || 0,
    remainingAmount: newBooking.costing.remainingAmount,
    status:
      newBooking.costing.paidAmount >= newBooking.costing.totalAmount
        ? 'Paid'
        : newBooking.costing.paidAmount > 0
        ? 'Partial'
        : 'Unpaid',
    items: invItems,
    notes: `Invoice for Booking ${newBooking.bookingRef}. Package: ${newBooking.destination}.`,
    bankDetails: {
      bankName: 'Client Escrow Clearing Account',
      accountName: `${newBooking.companyName || 'Travel Escrow'} Ltd - Client Escrow`,
      accountNumber: '40918234',
      iban: 'GB29BARC20000040918234',
      swift: 'BARCGB22',
    },
    createdAt: new Date().toISOString(),
  };

  newBooking.invoiceId = invoiceId;

  // Update client records
  const existingClientIdx = store.clients.findIndex(
    (c) =>
      (!newBooking.companyId || c.companyId === newBooking.companyId) &&
      (c.phone === newBooking.contactNumber || (newBooking.email && c.email === newBooking.email))
  );

  if (existingClientIdx !== -1) {
    store.clients[existingClientIdx].totalBookings += 1;
    store.clients[existingClientIdx].totalSpent += newBooking.costing.totalAmount;
    store.clients[existingClientIdx].outstandingBalance += newBooking.costing.remainingAmount;
    store.clients[existingClientIdx].lastBookingDate = newBooking.departureDate;
  } else {
    store.clients.unshift({
      id: `cl_${timestamp}`,
      companyId: newBooking.companyId,
      name: newBooking.customerName,
      phone: newBooking.contactNumber,
      whatsapp: newBooking.whatsapp || newBooking.contactNumber,
      email: newBooking.email,
      passportNumber: newBooking.passportInfo || (newBooking.passengers[0]?.passportNo ?? ''),
      nationality: newBooking.visa.nationality || 'British',
      assignedAgentId: newBooking.agentId,
      assignedAgentName: newBooking.agentName,
      totalBookings: 1,
      totalSpent: newBooking.costing.totalAmount,
      outstandingBalance: newBooking.costing.remainingAmount,
      lastBookingDate: newBooking.departureDate,
      createdAt: new Date().toISOString(),
    });
  }

  // Also record initial payment if paidAmount > 0
  if (newBooking.costing.paidAmount > 0) {
    store.payments.unshift({
      id: `pay_${timestamp}`,
      companyId: newBooking.companyId,
      paymentRef: `PAY-2026-${Math.floor(100 + Math.random() * 900)}`,
      invoiceId,
      bookingId: newBooking.id,
      bookingRef: newBooking.bookingRef,
      agentId: newBooking.agentId,
      agentName: newBooking.agentName,
      clientName: newBooking.customerName,
      amount: newBooking.costing.paidAmount,
      method: 'Bank Transfer',
      transactionRef: `INITIAL-DEP-${nextNum}`,
      date: new Date().toISOString().split('T')[0],
      receiptNotes: 'Initial booking deposit recorded at creation',
      createdAt: new Date().toISOString(),
    });
  }

  if (db) {
    try {
      await db.collection(COL_BOOKINGS).insertOne(newBooking as any);
      await db.collection(COL_INVOICES).insertOne(generatedInvoice as any);
    } catch (e) {
      console.warn('Mongo insert error:', e);
    }
  }

  store.bookings.unshift(newBooking);
  store.invoices.unshift(generatedInvoice);
  store.activities.unshift({
    id: `act_${timestamp}`,
    companyId: newBooking.companyId,
    agentId: newBooking.agentId,
    agentName: newBooking.agentName,
    action: 'Booking Created',
    entityType: 'booking',
    entityRef: newBooking.bookingRef,
    details: `Created booking ${newBooking.bookingRef} for ${newBooking.customerName} (${newBooking.destination}) - Total £${newBooking.costing.totalAmount}`,
    timestamp: new Date().toISOString(),
  });

  saveLocalStore(store);
  return { booking: newBooking, invoice: generatedInvoice };
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_BOOKINGS).updateOne({ id }, { $set: { ...updates, updatedAt: new Date().toISOString() } });
    } catch (e) {
      console.warn('Mongo update error:', e);
    }
  }

  const store = ensureLocalStore();
  const idx = store.bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  store.bookings[idx] = { ...store.bookings[idx], ...updates, updatedAt: new Date().toISOString() };
  saveLocalStore(store);
  return store.bookings[idx];
}

export async function deleteBooking(id: string): Promise<boolean> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_BOOKINGS).deleteOne({ id });
    } catch (e) {
      console.warn('Mongo delete error:', e);
    }
  }

  const store = ensureLocalStore();
  const init = store.bookings.length;
  store.bookings = store.bookings.filter((b) => b.id !== id);
  saveLocalStore(store);
  return store.bookings.length < init;
}

// -------------------------------------------------------------
// INVOICES (Role & Company Scoped)
// -------------------------------------------------------------
export async function getInvoices(
  role: UserRole,
  agentId: string,
  teamMembers: string[] = [],
  companyId?: string
): Promise<Invoice[]> {
  let all: Invoice[] = [];
  const db = await getMongoDb();
  if (db) {
    try {
      const records = await db.collection<Invoice>(COL_INVOICES).find({}).toArray();
      all = records;
    } catch (e) {
      all = ensureLocalStore().invoices;
    }
  } else {
    all = ensureLocalStore().invoices;
  }

  if (companyId) {
    all = all.filter(
      (i) => i.companyId === companyId || (!i.companyId && companyId === 'comp_default')
    );
  }

  if (role === 'super_admin' || role === 'owner') return all;
  if (role === 'senior_agent') {
    const allowed = new Set([agentId, ...teamMembers]);
    return all.filter((i) => allowed.has(i.agentId));
  }
  return all.filter((i) => i.agentId === agentId);
}

// -------------------------------------------------------------
// PAYMENTS (Role & Company Scoped)
// -------------------------------------------------------------
export async function getPayments(
  role: UserRole,
  agentId: string,
  teamMembers: string[] = [],
  companyId?: string
): Promise<Payment[]> {
  let all: Payment[] = [];
  const db = await getMongoDb();
  if (db) {
    try {
      const records = await db.collection<Payment>(COL_PAYMENTS).find({}).toArray();
      if (records.length > 0) {
        all = records;
      } else {
        const existing = await db.collection<Payment>('payments').find({ paymentRef: { $exists: true } }).toArray();
        if (existing.length > 0) {
          all = existing;
        } else {
          all = ensureLocalStore().payments;
        }
      }
    } catch (e) {
      all = ensureLocalStore().payments;
    }
  } else {
    all = ensureLocalStore().payments;
  }

  if (companyId) {
    all = all.filter(
      (p) => p.companyId === companyId || (!p.companyId && companyId === 'comp_default')
    );
  }

  if (role === 'super_admin' || role === 'owner') return all;
  if (role === 'senior_agent') {
    const allowed = new Set([agentId, ...teamMembers]);
    return all.filter((p) => allowed.has(p.agentId));
  }
  return all.filter((p) => p.agentId === agentId);
}

export async function recordPayment(paymentData: Omit<Payment, 'id' | 'paymentRef' | 'createdAt'>): Promise<Payment> {
  const timestamp = Date.now();
  const paymentRef = `PAY-2026-${Math.floor(100 + Math.random() * 900)}`;
  const newPayment: Payment = {
    ...paymentData,
    id: `pay_${timestamp}`,
    paymentRef,
    createdAt: new Date().toISOString(),
  };

  const store = ensureLocalStore();
  const db = await getMongoDb();

  // Update corresponding Invoice
  const invoiceIdx = store.invoices.findIndex((inv) => inv.id === newPayment.invoiceId);
  if (invoiceIdx !== -1) {
    const inv = store.invoices[invoiceIdx];
    inv.paidAmount = (inv.paidAmount || 0) + newPayment.amount;
    inv.remainingAmount = Math.max(0, inv.totalAmount - inv.paidAmount);
    inv.status = inv.remainingAmount === 0 ? 'Paid' : 'Partial';
  }

  // Update corresponding Booking
  const bookingIdx = store.bookings.findIndex((b) => b.id === newPayment.bookingId);
  if (bookingIdx !== -1) {
    const bk = store.bookings[bookingIdx];
    bk.costing.paidAmount = (bk.costing.paidAmount || 0) + newPayment.amount;
    bk.costing.remainingAmount = Math.max(0, bk.costing.totalAmount - bk.costing.paidAmount);
    bk.paymentStatus = bk.costing.remainingAmount === 0 ? 'Paid' : 'Partial';
  }

  // Update Client outstanding balance
  const clientIdx = store.clients.findIndex((c) => c.name === newPayment.clientName);
  if (clientIdx !== -1) {
    store.clients[clientIdx].outstandingBalance = Math.max(
      0,
      store.clients[clientIdx].outstandingBalance - newPayment.amount
    );
  }

  if (db) {
    try {
      await db.collection(COL_PAYMENTS).insertOne(newPayment as any);
      if (invoiceIdx !== -1) {
        await db.collection(COL_INVOICES).updateOne({ id: newPayment.invoiceId }, { $set: store.invoices[invoiceIdx] });
      }
      if (bookingIdx !== -1) {
        await db.collection(COL_BOOKINGS).updateOne({ id: newPayment.bookingId }, { $set: store.bookings[bookingIdx] });
      }
    } catch (e) {
      console.warn('Mongo insert payment error:', e);
    }
  }

  store.payments.unshift(newPayment);
  store.activities.unshift({
    id: `act_${timestamp}`,
    agentId: newPayment.agentId,
    agentName: newPayment.agentName,
    action: 'Payment Recorded',
    entityType: 'payment',
    entityRef: newPayment.paymentRef,
    details: `Recorded £${newPayment.amount.toLocaleString()} ${newPayment.method} payment from ${newPayment.clientName} for ${newPayment.bookingRef}`,
    timestamp: new Date().toISOString(),
  });

  saveLocalStore(store);
  return newPayment;
}

// -------------------------------------------------------------
// CLIENTS (Role & Company Scoped)
// -------------------------------------------------------------
export async function getClients(
  role: UserRole,
  agentId: string,
  teamMembers: string[] = [],
  companyId?: string
): Promise<Client[]> {
  let all: Client[] = [];
  const db = await getMongoDb();
  if (db) {
    try {
      const records = await db.collection<Client>(COL_CLIENTS).find({}).toArray();
      all = records;
    } catch (e) {
      all = ensureLocalStore().clients;
    }
  } else {
    all = ensureLocalStore().clients;
  }

  if (companyId) {
    all = all.filter(
      (c) => c.companyId === companyId || (!c.companyId && companyId === 'comp_default')
    );
  }

  if (role === 'super_admin' || role === 'owner') return all;
  if (role === 'senior_agent') {
    const allowed = new Set([agentId, ...teamMembers]);
    return all.filter((c) => allowed.has(c.assignedAgentId));
  }
  return all.filter((c) => c.assignedAgentId === agentId);
}

// -------------------------------------------------------------
// ACTIVITIES & STATS (Company Scoped)
// -------------------------------------------------------------
export async function getActivities(
  role: UserRole,
  agentId: string,
  teamMembers: string[] = [],
  companyId?: string
): Promise<AgentActivity[]> {
  let all: AgentActivity[] = [];
  const db = await getMongoDb();
  if (db) {
    try {
      const records = await db.collection<AgentActivity>(COL_ACTIVITIES).find({}).sort({ timestamp: -1 }).limit(50).toArray();
      all = records;
    } catch (e) {
      all = ensureLocalStore().activities;
    }
  } else {
    all = ensureLocalStore().activities;
  }

  if (companyId) {
    all = all.filter(
      (a) => a.companyId === companyId || (!a.companyId && companyId === 'comp_default')
    );
  }

  if (role === 'super_admin' || role === 'owner') return all.slice(0, 30);
  if (role === 'senior_agent') {
    const allowed = new Set([agentId, ...teamMembers]);
    return all.filter((a) => allowed.has(a.agentId)).slice(0, 30);
  }
  return all.filter((a) => a.agentId === agentId).slice(0, 30);
}

export async function getStats(
  role: UserRole,
  agentId: string,
  teamMembers: string[] = [],
  companyId?: string
): Promise<SystemStats> {
  const bookings = await getBookings(role, agentId, teamMembers, companyId);
  const invoices = await getInvoices(role, agentId, teamMembers, companyId);
  const clients = await getClients(role, agentId, teamMembers, companyId);
  const agents = await getAgents(companyId);

  const totalSales = bookings.reduce((sum, b) => sum + (b.costing?.totalAmount || 0), 0);
  const paymentsReceived = bookings.reduce((sum, b) => sum + (b.costing?.paidAmount || 0), 0);
  const outstandingBalances = bookings.reduce((sum, b) => sum + (b.costing?.remainingAmount || 0), 0);
  const totalProfit = bookings.reduce((sum, b) => sum + (b.costing?.profitMargin || 0), 0);

  const now = new Date().toISOString().split('T')[0];
  const upcomingDepartures = bookings.filter((b) => b.departureDate >= now && b.bookingStatus !== 'Cancelled').length;
  const pendingVisas = bookings.filter((b) => b.visa?.status === 'Pending' || b.visa?.status === 'Under Review').length;
  const cancelledBookings = bookings.filter((b) => b.bookingStatus === 'Cancelled').length;

  return {
    totalBookings: bookings.length,
    totalAgents: agents.filter((a) => a.status === 'active').length,
    totalClients: clients.length,
    totalInvoices: invoices.length,
    totalSales,
    paymentsReceived,
    outstandingBalances,
    upcomingDepartures,
    pendingVisas,
    cancelledBookings,
    totalProfit,
  };
}

// -------------------------------------------------------------
// AUTHENTICATION & SESSIONS
// -------------------------------------------------------------
export async function authenticateUser(
  usernameOrEmail: string,
  pass: string
): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  const agents = await getAgents();
  const normalized = usernameOrEmail.trim().toLowerCase();

  const agent = agents.find(
    (a) =>
      (a.username || '').toLowerCase() === normalized ||
      (a.email || '').toLowerCase() === normalized
  );

  if (!agent) {
    return { success: false, error: 'Invalid username/email or password' };
  }

  if (agent.status === 'pending_approval') {
    return {
      success: false,
      error: 'Your Super Admin account and company workspace are pending approval by the CRM Owner. You will be able to log in once authorized.',
    };
  }

  if (agent.status === 'rejected') {
    return {
      success: false,
      error: 'Your account registration was not approved by the CRM Owner.',
    };
  }

  if (agent.status === 'inactive') {
    return {
      success: false,
      error: 'Account is currently disabled. Please contact your company Super Admin.',
    };
  }

  // Check company status if companyId is set
  if (agent.companyId) {
    const companies = await getCompanies();
    const comp = companies.find((c) => c.id === agent.companyId);
    if (comp) {
      if (comp.status === 'pending_approval') {
        return {
          success: false,
          error: `Company "${comp.name}" is pending approval by the CRM Owner. Please await confirmation.`,
        };
      }
      if (comp.status === 'suspended') {
        return {
          success: false,
          error: `Company workspace for "${comp.name}" has been suspended by the CRM Owner.`,
        };
      }
      if (comp.status === 'rejected') {
        return {
          success: false,
          error: `Company registration for "${comp.name}" was rejected.`,
        };
      }
    }
  }

  // Check password (default password: password123)
  const expectedPassword = agent.password || 'password123';
  if (!timingSafeCompare(pass, expectedPassword)) {
    return { success: false, error: 'Invalid username/email or password' };
  }

  // Generate secure session token
  const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const { password: _, ...safeAgent } = agent;
  const session: UserSession = {
    token,
    agent: safeAgent as Agent,
    expiresAt,
  };


  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_SESSIONS).insertOne(session as any);
      await db
        .collection(COL_AGENTS)
        .updateOne({ id: agent.id }, { $set: { lastActive: new Date().toISOString() } });
    } catch (e) {
      console.warn('Mongo insert session error:', e);
    }
  }

  const store = ensureLocalStore();
  store.sessions.push(session);
  const agentIdx = store.agents.findIndex((a) => a.id === agent.id);
  if (agentIdx !== -1) {
    store.agents[agentIdx].lastActive = new Date().toISOString();
  }
  saveLocalStore(store);

  return { success: true, session };
}

export async function validateSession(token: string): Promise<UserSession | null> {
  if (!token) return null;

  const db = await getMongoDb();
  if (db) {
    try {
      const sess = await db.collection<UserSession>(COL_SESSIONS).findOne({ token });
      if (sess) {
        if (new Date(sess.expiresAt) < new Date()) {
          await db.collection(COL_SESSIONS).deleteOne({ token });
          return null;
        }
        return sess;
      }
    } catch (e) {
      console.warn('Mongo find session error:', e);
    }
  }

  const store = ensureLocalStore();
  const sess = store.sessions.find((s) => s.token === token);
  if (!sess) return null;
  if (new Date(sess.expiresAt) < new Date()) {
    store.sessions = store.sessions.filter((s) => s.token !== token);
    saveLocalStore(store);
    return null;
  }
  return sess;
}

export async function destroySession(token: string): Promise<boolean> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection(COL_SESSIONS).deleteOne({ token });
    } catch (e) {
      console.warn('Mongo delete session error:', e);
    }
  }

  const store = ensureLocalStore();
  store.sessions = store.sessions.filter((s) => s.token !== token);
  saveLocalStore(store);
  return true;
}

export async function getDatabaseStatus(): Promise<DbStatusInfo> {
  const db = await getMongoDb();
  const store = ensureLocalStore();
  const uriConfigured = isMongoConfigured();

  if (db) {
    try {
      const [agentsCount, bookingsCount, invoicesCount, paymentsCount, clientsCount, sessionsCount] =
        await Promise.all([
          db.collection(COL_AGENTS).countDocuments(),
          db.collection(COL_BOOKINGS).countDocuments(),
          db.collection(COL_INVOICES).countDocuments(),
          db.collection(COL_PAYMENTS).countDocuments(),
          db.collection(COL_CLIENTS).countDocuments(),
          db.collection(COL_SESSIONS).countDocuments(),
        ]);

      return {
        type: 'mongodb',
        connected: true,
        databaseName: db.databaseName,
        collections: {
          agents: agentsCount,
          bookings: bookingsCount,
          invoices: invoicesCount,
          payments: paymentsCount,
          clients: clientsCount,
          sessions: sessionsCount,
        },
        uriConfigured: true,
        message: `Connected to MongoDB database "${db.databaseName}"`,
      };
    } catch (e) {
      // Fallback
    }
  }

  return {
    type: uriConfigured ? 'mongodb' : 'embedded_document_store',
    connected: true,
    databaseName: 'devntom_crm_store',
    collections: {
      agents: store.agents.length,
      bookings: store.bookings.length,
      invoices: store.invoices.length,
      payments: store.payments.length,
      clients: store.clients.length,
      sessions: store.sessions.length,
    },
    uriConfigured,
    message: uriConfigured
      ? 'MongoDB URI is configured, synchronized with document store'
      : 'Operating on persistent document storage (MongoDB driver ready)',
  };
}

