'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building,
  Users,
  CalendarCheck,
  DollarSign,
  Search,
  RefreshCw,
  LogOut,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Company, Agent } from '@/types/crm';
import { formatCurrency, formatCount } from '@/lib/utils';

interface EnrichedCompany extends Company {
  totalAgents?: number;
  totalBookings?: number;
  totalSales?: number;
  superAdminStatus?: string;
}

export default function OwnerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [companies, setCompanies] = useState<EnrichedCompany[]>([]);
  const [platformStats, setPlatformStats] = useState<{
    totalCompanies: number;
    pendingApprovals: number;
    activeCompanies: number;
    totalUsers: number;
    totalBookings: number;
    totalVolume: number;
  } | null>(null);

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'suspended'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check saved session
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('devntom_owner_token') : null;
    if (savedToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchOwnerData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [compRes, statsRes] = await Promise.all([
        fetch('/api/owner/companies'),
        fetch('/api/owner/stats'),
      ]);

      if (compRes.ok) {
        const data = await compRes.json();
        setCompanies(data);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setPlatformStats(data);
      }
    } catch (err) {
      console.error('Error fetching owner data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOwnerData();
    }
  }, [isAuthenticated, fetchOwnerData]);

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/owner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Invalid platform owner access credentials.');
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('devntom_owner_token', data.token);
      }
      setIsAuthenticated(true);
    } catch (err: any) {
      setLoginError('Connection error while logging in.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOwnerLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('devntom_owner_token');
    }
    setIsAuthenticated(false);
    setPasscode('');
  };

  const handleCompanyAction = async (companyId: string, action: string, notes?: string) => {
    setActionMessage(null);
    try {
      const res = await fetch('/api/owner/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, action, notes }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: 'success',
          text: `Action "${action}" processed successfully.`,
        });
        await fetchOwnerData();
      } else {
        setActionMessage({
          type: 'error',
          text: data.error || 'Failed to update company.',
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Error communicating with server.',
      });
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.superAdminName.toLowerCase().includes(search.toLowerCase()) ||
      c.superAdminEmail.toLowerCase().includes(search.toLowerCase()) ||
      c.superAdminUsername.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return c.status === 'pending_approval';
    if (statusFilter === 'approved') return c.status === 'approved';
    if (statusFilter === 'suspended') return c.status === 'suspended' || c.status === 'rejected';
    return true;
  });

  const pendingCount = companies.filter((c) => c.status === 'pending_approval').length;

  // -------------------------------------------------------------
  // LOGIN VIEW FOR OWNER
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between p-4 sm:p-8 select-none">
        <div className="max-w-md mx-auto w-full pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 font-medium transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Main CRM</span>
          </Link>

          <div className="bg-white border border-neutral-200/90 rounded-2xl p-7 shadow-xl shadow-slate-200/70">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 mb-3 shadow-xs">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                CRM Owner Portal
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Platform administration & Super Admin account approval dashboard.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleOwnerLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  CRM Owner Passcode
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    required
                    placeholder="Enter owner passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg pl-9 pr-9 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all text-xs tracking-wide disabled:opacity-50 mt-3 cursor-pointer"
              >
                {isLoggingIn ? 'Verifying...' : 'Access Owner Control Plane'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-neutral-100 text-center text-[11px] text-neutral-500">
              Authorized CRM platform owner credentials required.
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-400 font-medium py-4">
          Developed by Devntom Solutions
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // OWNER DASHBOARD & APPROVAL WORKSPACE
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-neutral-900">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-neutral-200/90 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-950 flex items-center justify-center font-bold text-sm tracking-wider shadow-sm border border-neutral-800">
            <span className="text-amber-400">DS</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900 text-sm tracking-tight">
                CRM Owner Dashboard
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300/80">
                GOVERNANCE PLANE
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 font-medium">
              Multi-Company Management & Super Admin Approvals
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-amber-700" />
            <span>Open Main CRM</span>
          </Link>

          <button
            onClick={fetchOwnerData}
            title="Refresh Data"
            disabled={isLoading}
            className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOwnerLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Owner Mode</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Banner Alert for Action Results */}
        {actionMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-neutral-400 hover:text-neutral-700 font-bold ml-4 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Platform KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Total Companies
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
              {formatCount(platformStats?.totalCompanies ?? companies.length)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Tenant workspaces</div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
              Pending Approvals
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 mt-1 flex items-center gap-1.5">
              <span>{formatCount(pendingCount)}</span>
              {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">Requires Owner action</div>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Active Companies
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {formatCount(companies.filter((c) => c.status === 'approved').length)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Fully authorized</div>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Total Agents / Roles
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
              {formatCount(platformStats?.totalUsers ?? 0)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Across all companies</div>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Total Bookings
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
              {formatCount(platformStats?.totalBookings ?? 0)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Platform volume</div>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Total Sales Volume
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
              {formatCurrency(platformStats?.totalVolume ?? 0)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Gross revenue</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-neutral-200/90 shadow-2xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              All Workspaces ({companies.length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-neutral-950 shadow-2xs'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span>Pending Approvals</span>
              <span className="font-mono px-1.5 py-0.2 rounded-full bg-white/70 text-[10px]">
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Approved ({companies.filter((c) => c.status === 'approved').length})
            </button>

            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'suspended'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Suspended / Rejected ({companies.filter((c) => c.status === 'suspended' || c.status === 'rejected').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search company or super admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Company Registrations Table */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-6 py-4 border-b border-neutral-200/80 bg-neutral-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Enterprise Companies & Super Admin Accounts</h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Each company operates an isolated CRM. Super admins cannot sign in until authorized here.
              </p>
            </div>
            <div className="text-xs text-neutral-500 font-medium">
              Showing {filteredCompanies.length} of {companies.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Company Workspace</th>
                  <th className="py-3 px-5">Super Admin Contact</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-center">Team / Bookings</th>
                  <th className="py-3 px-5 text-right">Volume</th>
                  <th className="py-3 px-5 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400 text-xs">
                      No company registrations found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((c) => {
                    const isPending = c.status === 'pending_approval';
                    const isApproved = c.status === 'approved';
                    const isSuspended = c.status === 'suspended';
                    const isRejected = c.status === 'rejected';

                    return (
                      <tr key={c.id} className="hover:bg-neutral-50/60 transition-colors">
                        {/* Company Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-neutral-800">
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900 text-xs">{c.name}</div>
                              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                ID: {c.id}
                              </div>
                              <div className="text-[10px] text-neutral-400">
                                Applied: {new Date(c.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Super Admin */}
                        <td className="py-4 px-5">
                          <div className="font-semibold text-neutral-900">{c.superAdminName}</div>
                          <div className="text-[10px] text-amber-700 font-mono">@{c.superAdminUsername}</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">{c.superAdminEmail}</div>
                          {c.superAdminPhone && (
                            <div className="text-[10px] text-neutral-400 font-mono">{c.superAdminPhone}</div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending Approval
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Approved & Active
                            </span>
                          )}
                          {isSuspended && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">
                              Suspended
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* Stats */}
                        <td className="py-4 px-5 text-center">
                          <div className="font-bold text-neutral-900 font-mono text-xs">
                            {formatCount(c.totalAgents ?? 1)} Agents
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {formatCount(c.totalBookings ?? 0)} Bookings
                          </div>
                        </td>

                        {/* Volume */}
                        <td className="py-4 px-5 text-right font-mono tabular-nums">
                          <div className="font-bold text-neutral-900 text-xs">
                            {formatCurrency(c.totalSales ?? 0)}
                          </div>
                          <div className="text-[10px] text-neutral-400">Total Booked</div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleCompanyAction(c.id, 'approve')}
                                  title="Approve Super Admin & Company Workspace"
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Approve</span>
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirm(`Reject registration for ${c.name}?`)) {
                                      handleCompanyAction(c.id, 'reject');
                                    }
                                  }}
                                  title="Reject Application"
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <button
                                onClick={() => {
                                  if (confirm(`Suspend workspace for ${c.name}? Users of this company won't be able to log in.`)) {
                                    handleCompanyAction(c.id, 'suspend');
                                  }
                                }}
                                title="Suspend Workspace"
                                className="px-2.5 py-1 text-[11px] rounded-lg text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 font-medium transition-colors cursor-pointer"
                              >
                                Suspend
                              </button>
                            )}

                            {isSuspended && (
                              <button
                                onClick={() => handleCompanyAction(c.id, 'reactivate')}
                                title="Reactivate Workspace"
                                className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-semibold transition-colors cursor-pointer"
                              >
                                Reactivate
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to permanently delete company "${c.name}" and ALL its data (bookings, agents, invoices)? This cannot be undone.`
                                  )
                                ) {
                                  handleCompanyAction(c.id, 'delete');
                                }
                              }}
                              title="Delete Company & Data"
                              className="p-1.5 text-neutral-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-6 text-center text-xs text-neutral-400 border-t border-neutral-200/60 bg-white/50">
        Developed by Devntom Solutions
      </footer>
    </div>
  );
}
