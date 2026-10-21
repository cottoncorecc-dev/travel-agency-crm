'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Shield,
  KeyRound,
  Ban,
  CheckCircle2,
  Activity,
  CalendarCheck,
  Receipt,
  CreditCard,
  DollarSign,
  Search,
  X,
  Lock,
  Mail,
  Phone,
  User,
  Sliders,
  Trash2,
} from 'lucide-react';
import { Agent, Booking, Invoice, Payment, AgentActivity, UserRole, AgentPermissions } from '@/types/crm';
import { formatCount, formatCurrency } from '@/lib/utils';

interface AgentsManagementProps {
  agents: Agent[];
  bookings: Booking[];
  invoices: Invoice[];
  payments: Payment[];
  activities: AgentActivity[];
  onCreateAgent: (agentData: any) => Promise<void>;
  onUpdateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  onDeleteAgent: (id: string) => Promise<void>;
  onOpenBooking: (b: Booking) => void;
  onOpenInvoice: (b: Booking) => void;
}

export default function AgentsManagement({
  agents,
  bookings,
  invoices,
  payments,
  activities,
  onCreateAgent,
  onUpdateAgent,
  onDeleteAgent,
  onOpenBooking,
  onOpenInvoice,
}: AgentsManagementProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [resetPasswordAgent, setResetPasswordAgent] = useState<Agent | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [permissionsAgent, setPermissionsAgent] = useState<Agent | null>(null);
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);
  const [detailTab, setDetailTab] = useState<'bookings' | 'sales' | 'invoices' | 'payments' | 'activity'>('bookings');

  // Form states for Create Agent
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formRole, setFormRole] = useState<UserRole>('agent');
  const [formTeamMembers, setFormTeamMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetCreateForm = () => {
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormStatus('active');
    setFormRole('agent');
    setFormTeamMembers([]);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUsername || !formEmail) return;

    setIsSubmitting(true);
    try {
      await onCreateAgent({
        name: formName,
        username: formUsername,
        email: formEmail,
        phone: formPhone,
        password: formPassword || 'password123',
        status: formStatus,
        role: formRole,
        teamMembers: formRole === 'senior_agent' ? formTeamMembers : undefined,
        permissions: {
          canEditBookings: formRole !== 'agent',
          canDeleteBookings: formRole === 'super_admin',
          canViewCosting: formRole !== 'agent',
          canRecordPayments: true,
          canExportReports: formRole !== 'agent',
        },
        avatar: formName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      });
      setIsCreateOpen(false);
      resetCreateForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    const nextStatus = agent.status === 'active' ? 'inactive' : 'active';
    await onUpdateAgent(agent.id, { status: nextStatus });
  };

  const handleSavePermissions = async () => {
    if (!permissionsAgent) return;
    await onUpdateAgent(permissionsAgent.id, { permissions: permissionsAgent.permissions });
    setPermissionsAgent(null);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordAgent || !newPassword) return;
    await onUpdateAgent(resetPasswordAgent.id, { password: newPassword });
    setResetPasswordAgent(null);
    setNewPassword('');
  };

  // Filter agents safely
  const filteredAgents = agents.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (a.name || '').toLowerCase().includes(q) ||
      (a.username || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || a.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Agents & Roles Management</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Control user access, assign team hierarchies, manage credentials, and audit agent performance.
          </p>
        </div>
        <button
          onClick={() => {
            resetCreateForm();
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs tracking-wide shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Agent</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search agents by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-slate-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="senior_agent">Manager / Senior Agent</option>
            <option value="agent">Agent</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Disabled</option>
          </select>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Agent Name / ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Bookings</th>
                <th className="py-3 px-4 text-right">Total Sales</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
              {filteredAgents.map((agent) => {
                const agentBookings = bookings.filter((b) => b.agentId === agent.id);
                const totalSales = agentBookings.reduce((sum, b) => sum + (b.costing?.totalAmount || 0), 0);

                return (
                  <tr key={agent.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Name & Username */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {agent.avatar || agent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900">{agent.name}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">@{agent.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          agent.role === 'super_admin'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : agent.role === 'senior_agent'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {agent.role === 'super_admin'
                          ? 'Super Admin'
                          : agent.role === 'senior_agent'
                          ? 'Senior Agent'
                          : 'Agent'}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="text-neutral-800">{agent.email}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{agent.phone || '—'}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          agent.status === 'active'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-neutral-500 bg-neutral-100 border-neutral-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            agent.status === 'active' ? 'bg-emerald-500' : 'bg-neutral-400'
                          }`}
                        />
                        {agent.status === 'active' ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    {/* Bookings Count */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-900">
                      {formatCount(agentBookings.length)}
                    </td>

                    {/* Total Sales */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-neutral-900">
                      {formatCurrency(totalSales)}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Deep View Drawer */}
                        <button
                          onClick={() => {
                            setDetailAgent(agent);
                            setDetailTab('bookings');
                          }}
                          title="View Agent Activity & Records"
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors cursor-pointer"
                        >
                          View Details
                        </button>

                        {/* Edit Agent */}
                        <button
                          onClick={() => setEditingAgent(agent)}
                          title="Edit Agent Info"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 border border-transparent hover:border-neutral-200 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Change Permissions */}
                        <button
                          onClick={() => setPermissionsAgent({ ...agent })}
                          title="Change Permissions"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setResetPasswordAgent(agent);
                            setNewPassword('');
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Enable/Disable Agent */}
                        {agent.role !== 'super_admin' && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(agent)}
                              title={agent.status === 'active' ? 'Disable Agent' : 'Activate Agent'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                agent.status === 'active'
                                  ? 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently delete agent profile for ${agent.name} (@${agent.username})?`)) {
                                  onDeleteAgent(agent.id);
                                }
                              }}
                              title="Delete Agent Profile"
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 1: CREATE AGENT */}
      {/* ---------------------------------------------------------------------- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200/90 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900">Create New Agent Profile</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Qureshi"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Agent ID / Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. agt_maria"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="maria@devntom.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+44 7700 900555"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Default: password123"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Assigned Role *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'agent', label: 'Agent', desc: 'Own data only' },
                    { id: 'senior_agent', label: 'Senior / Manager', desc: 'Team level access' },
                    { id: 'super_admin', label: 'Super Admin', desc: 'Full system control' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFormRole(r.id as UserRole)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        formRole === r.id
                          ? 'border-emerald-500 bg-emerald-50 text-neutral-950 shadow-xs'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-600'
                      }`}
                    >
                      <div className="font-semibold text-xs text-neutral-900">{r.label}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* If Senior Agent, allow choosing team members */}
              {formRole === 'senior_agent' && (
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Manage Team Members (Select Agents)
                  </label>
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5 max-h-32 overflow-y-auto">
                    {agents
                      .filter((a) => a.role === 'agent')
                      .map((agt) => (
                        <label key={agt.id} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formTeamMembers.includes(agt.id)}
                            onChange={(e) => {
                              if (e.target.checked) setFormTeamMembers([...formTeamMembers, agt.id]);
                              else setFormTeamMembers(formTeamMembers.filter((id) => id !== agt.id));
                            }}
                            className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>
                            {agt.name} ({agt.username})
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 2: EDIT AGENT */}
      {/* ---------------------------------------------------------------------- */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200/90 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80">
              <h3 className="text-sm font-bold text-neutral-900">Edit Agent: {editingAgent.name}</h3>
              <button onClick={() => setEditingAgent(null)} className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onUpdateAgent(editingAgent.id, editingAgent);
                setEditingAgent(null);
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Agent ID / Username
                  </label>
                  <input
                    type="text"
                    value={editingAgent.username}
                    onChange={(e) => setEditingAgent({ ...editingAgent, username: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingAgent.email}
                    onChange={(e) => setEditingAgent({ ...editingAgent, email: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editingAgent.phone}
                    onChange={(e) => setEditingAgent({ ...editingAgent, phone: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editingAgent.status}
                    onChange={(e) => setEditingAgent({ ...editingAgent, status: e.target.value as any })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 shadow-2xs"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={editingAgent.role}
                    onChange={(e) => setEditingAgent({ ...editingAgent, role: e.target.value as any })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 shadow-2xs"
                  >
                    <option value="agent">Agent</option>
                    <option value="senior_agent">Manager / Senior Agent</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 3: RESET PASSWORD */}
      {/* ---------------------------------------------------------------------- */}
      {resetPasswordAgent && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200/90 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Reset Password for {resetPasswordAgent.name}
                </h3>
              </div>
              <button onClick={() => setResetPasswordAgent(null)} className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <p className="text-xs text-neutral-500">
                Enter a new password for username <span className="text-neutral-900 font-mono font-bold">@{resetPasswordAgent.username}</span>.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setResetPasswordAgent(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 4: PERMISSIONS EDITOR */}
      {/* ---------------------------------------------------------------------- */}
      {permissionsAgent && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200/90 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Permissions · {permissionsAgent.name}
                </h3>
              </div>
              <button onClick={() => setPermissionsAgent(null)} className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-neutral-500 mb-2">
                Configure operational permissions granted to this agent:
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'canEditBookings',
                    title: 'Edit Existing Bookings',
                    desc: 'Modify flight, hotel, passenger, and costing records',
                  },
                  {
                    key: 'canDeleteBookings',
                    title: 'Delete Bookings',
                    desc: 'Permanently remove booking entries from system',
                  },
                  {
                    key: 'canViewCosting',
                    title: 'View Internal Costing & Margins',
                    desc: 'Expose purchasing costs, markup margins, and net agency profits',
                  },
                  {
                    key: 'canRecordPayments',
                    title: 'Record Client Payments',
                    desc: 'Register incoming bank wires, cards, and cash receipts',
                  },
                  {
                    key: 'canExportReports',
                    title: 'Export Financial & Sales Reports',
                    desc: 'Download CSV audit logs and performance breakdowns',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={(permissionsAgent.permissions as any)[item.key]}
                      onChange={(e) =>
                        setPermissionsAgent({
                          ...permissionsAgent,
                          permissions: {
                            ...permissionsAgent.permissions,
                            [item.key]: e.target.checked,
                          },
                        })
                      }
                      className="mt-1 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-neutral-900">{item.title}</div>
                      <div className="text-[10px] text-neutral-500">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setPermissionsAgent(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 5: AGENT DEEP DIVE (Activity, Bookings, Sales, Invoices, Payments) */}
      {/* ---------------------------------------------------------------------- */}
      {detailAgent && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200/90 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-neutral-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-950 text-amber-400 border border-neutral-800 flex items-center justify-center font-bold text-sm shadow-xs">
                  {detailAgent.avatar || detailAgent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">{detailAgent.name}</h3>
                  <div className="text-xs text-neutral-500">
                    @{detailAgent.username} · {detailAgent.email} ·{' '}
                    <span className="text-amber-700 font-semibold capitalize">{detailAgent.role.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDetailAgent(null)} className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Banner */}
            <div className="px-6 py-3 bg-neutral-50/80 border-b border-neutral-200/80 grid grid-cols-4 gap-4 text-xs shrink-0">
              {(() => {
                const agtBookings = bookings.filter((b) => b.agentId === detailAgent.id);
                const sales = agtBookings.reduce((sum, b) => sum + (b.costing?.totalAmount || 0), 0);
                const paid = agtBookings.reduce((sum, b) => sum + (b.costing?.paidAmount || 0), 0);
                const out = agtBookings.reduce((sum, b) => sum + (b.costing?.remainingAmount || 0), 0);
                return (
                  <>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase font-bold">Bookings</div>
                      <div className="text-sm font-bold font-mono text-neutral-900">{formatCount(agtBookings.length)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase font-bold">Total Sales</div>
                      <div className="text-sm font-bold font-mono text-neutral-900">{formatCurrency(sales)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase font-bold">Paid / Received</div>
                      <div className="text-sm font-bold font-mono text-emerald-600">{formatCurrency(paid)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase font-bold">Outstanding</div>
                      <div className="text-sm font-bold font-mono text-rose-600">{formatCurrency(out)}</div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Tabs Selector */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-neutral-200 bg-white shrink-0">
              {[
                { id: 'bookings', label: 'View Bookings', icon: CalendarCheck },
                { id: 'sales', label: 'View Sales Breakdown', icon: DollarSign },
                { id: 'invoices', label: 'View Invoices', icon: Receipt },
                { id: 'payments', label: 'View Payments', icon: CreditCard },
                { id: 'activity', label: 'View Activity Log', icon: Activity },
              ].map((t) => {
                const Icon = t.icon;
                const active = detailTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                      active
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t'
                        : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-t'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {detailTab === 'bookings' && (
                <div className="space-y-3">
                  {bookings.filter((b) => b.agentId === detailAgent.id).length === 0 ? (
                    <div className="text-xs text-neutral-400 text-center py-8">No bookings created by this agent.</div>
                  ) : (
                    <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      {bookings
                        .filter((b) => b.agentId === detailAgent.id)
                        .map((b) => (
                          <div key={b.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50 transition-colors">
                            <div>
                              <div className="font-semibold text-neutral-900 flex items-center gap-2">
                                <span className="font-mono text-amber-700 font-bold">{b.bookingRef}</span>
                                <span>{b.customerName}</span>
                              </div>
                              <div className="text-[11px] text-neutral-500 mt-0.5">
                                {b.destination} · {b.departureDate} ({formatCount(b.paxCount)} Pax)
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="font-mono font-semibold text-neutral-900">
                                  {formatCurrency(b.costing?.totalAmount)}
                                </div>
                                <div className="text-[10px] text-neutral-500">{b.bookingStatus}</div>
                              </div>
                              <button
                                onClick={() => {
                                  setDetailAgent(null);
                                  onOpenBooking(b);
                                }}
                                className="px-2.5 py-1 text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium rounded-md border border-neutral-200 transition-colors cursor-pointer"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'sales' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white border border-neutral-200 rounded-xl space-y-3 shadow-xs">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      Sales & Profit Performance Summary
                    </h4>
                    {(() => {
                      const bks = bookings.filter((b) => b.agentId === detailAgent.id);
                      const totalSelling = bks.reduce((sum, b) => sum + (b.costing?.totalAmount || 0), 0);
                      const totalCost = bks.reduce((sum, b) => sum + (b.costing?.totalPurchasingCost || 0), 0);
                      const totalMargin = bks.reduce((sum, b) => sum + (b.costing?.profitMargin || 0), 0);
                      const marginPct = totalSelling > 0 ? ((totalMargin / totalSelling) * 100).toFixed(1) : '0';

                      return (
                        <div className="grid grid-cols-4 gap-4 text-xs font-mono">
                          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                            <div className="text-neutral-500 text-[10px] uppercase font-bold">Gross Sales</div>
                            <div className="text-sm font-bold text-neutral-900">{formatCurrency(totalSelling)}</div>
                          </div>
                          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                            <div className="text-neutral-500 text-[10px] uppercase font-bold">Supplier Cost</div>
                            <div className="text-sm font-bold text-neutral-600">{formatCurrency(totalCost)}</div>
                          </div>
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="text-emerald-700 text-[10px] uppercase font-bold">Net Profit</div>
                            <div className="text-sm font-bold text-emerald-700">{formatCurrency(totalMargin)}</div>
                          </div>
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="text-amber-700 text-[10px] uppercase font-bold">Margin %</div>
                            <div className="text-sm font-bold text-amber-700">{marginPct}%</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {detailTab === 'invoices' && (
                <div className="space-y-3">
                  {invoices.filter((i) => i.agentId === detailAgent.id).length === 0 ? (
                    <div className="text-xs text-neutral-400 text-center py-8">No invoices generated by this agent.</div>
                  ) : (
                    <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      {invoices
                        .filter((i) => i.agentId === detailAgent.id)
                        .map((inv) => (
                          <div key={inv.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50 transition-colors">
                            <div>
                              <div className="font-semibold text-neutral-900 flex items-center gap-2">
                                <span className="font-mono text-amber-700 font-bold">{inv.invoiceRef}</span>
                                <span>{inv.clientName}</span>
                              </div>
                              <div className="text-[11px] text-neutral-500 mt-0.5">
                                Issued: {inv.issueDate} · Due: {inv.dueDate}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="font-mono font-semibold text-neutral-900">
                                  {formatCurrency(inv.totalAmount)}
                                </div>
                                <div className="text-[10px] text-neutral-500 font-mono">
                                  Bal: {formatCurrency(inv.remainingAmount)} ({inv.status})
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'payments' && (
                <div className="space-y-3">
                  {payments.filter((p) => p.agentId === detailAgent.id).length === 0 ? (
                    <div className="text-xs text-neutral-400 text-center py-8">No payments recorded by this agent.</div>
                  ) : (
                    <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      {payments
                        .filter((p) => p.agentId === detailAgent.id)
                        .map((p) => (
                          <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50 transition-colors">
                            <div>
                              <div className="font-semibold text-neutral-900 flex items-center gap-2">
                                <span className="font-mono text-emerald-700 font-bold">{p.paymentRef}</span>
                                <span>{p.clientName}</span>
                              </div>
                              <div className="text-[11px] text-neutral-500 mt-0.5">
                                {p.method} · Ref: {p.transactionRef} · {p.date}
                              </div>
                            </div>
                            <div className="font-mono font-bold text-emerald-600 text-sm">
                              +{formatCurrency(p.amount)}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="space-y-3">
                  {activities.filter((a) => a.agentId === detailAgent.id).length === 0 ? (
                    <div className="text-xs text-neutral-400 text-center py-8">No logged activities for this agent.</div>
                  ) : (
                    <div className="space-y-2">
                      {activities
                        .filter((a) => a.agentId === detailAgent.id)
                        .map((act) => (
                          <div key={act.id} className="p-3 rounded-lg border border-neutral-200 bg-white text-xs shadow-2xs">
                            <div className="flex items-center justify-between font-semibold text-neutral-900">
                              <span>{act.action}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                {new Date(act.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-600 mt-1">{act.details}</div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
