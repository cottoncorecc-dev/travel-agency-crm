'use client';

import React from 'react';
import {
  CalendarCheck,
  Users,
  UserCheck,
  Receipt,
  TrendingUp,
  CreditCard,
  AlertCircle,
  PlaneTakeoff,
  FileCheck2,
  XCircle,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Building,
  Plus,
} from 'lucide-react';
import { SystemStats, Booking, Agent, AgentActivity } from '@/types/crm';
import { formatCount, formatCurrency } from '@/lib/utils';

interface AdminDashboardProps {
  stats: SystemStats;
  bookings: Booking[];
  agents: Agent[];
  activities: AgentActivity[];
  currentUser?: Agent | null;
  onNavigateTab: (tab: string) => void;
  onOpenBooking: (booking: Booking) => void;
  onOpenCreateBooking: () => void;
}

export default function AdminDashboard({
  stats,
  bookings = [],
  agents = [],
  activities = [],
  currentUser,
  onNavigateTab,
  onOpenBooking,
  onOpenCreateBooking,
}: AdminDashboardProps) {
  // Compute agent performance leaderboard
  const agentPerformance = agents
    .filter((a) => a.role !== 'super_admin')
    .map((agent) => {
      const agentBookings = bookings.filter((b) => b.agentId === agent.id);
      const totalSales = agentBookings.reduce((sum, b) => sum + (b.costing?.totalAmount || 0), 0);
      const paid = agentBookings.reduce((sum, b) => sum + (b.costing?.paidAmount || 0), 0);
      const outstanding = agentBookings.reduce((sum, b) => sum + (b.costing?.remainingAmount || 0), 0);
      const totalProfit = agentBookings.reduce((sum, b) => sum + (b.costing?.profitMargin || 0), 0);

      return {
        agent,
        bookingsCount: agentBookings.length,
        totalSales,
        paid,
        outstanding,
        totalProfit,
      };
    })
    .sort((a, b) => b.totalSales - a.totalSales);

  const nowStr = new Date().toISOString().split('T')[0];
  const upcomingDepartures = bookings
    .filter((b) => (b.departureDate || '') >= nowStr && b.bookingStatus !== 'Cancelled')
    .sort((a, b) => (a.departureDate || '').localeCompare(b.departureDate || ''))
    .slice(0, 5);

  const totalSales = stats?.totalSales ?? 0;
  const paymentsReceived = stats?.paymentsReceived ?? 0;
  const outstandingBalances = stats?.outstandingBalances ?? 0;
  const totalProfit = stats?.totalProfit ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Super Admin Portal · Executive Operations</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            {currentUser?.companyName || 'Enterprise CRM'} Management Console
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time financial status, agent activities, package costing, and departures overview.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('reports')}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            Financial Reports
          </button>
          <button
            onClick={onOpenCreateBooking}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-950 bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (All Required Metrics) */}
      <div>
        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3 px-1">
          Financial & Operational Core Metrics
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
          {/* 1. Total Sales (Golden accent) */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Sales</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-neutral-900 font-mono tabular-nums">
              {formatCurrency(totalSales)}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">
              {formatCurrency(totalProfit)} profit
            </div>
          </div>

          {/* 2. Payments Received (Bright Green accent) */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Payments Received</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
              {formatCurrency(paymentsReceived)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {totalSales > 0 ? Math.round((paymentsReceived / totalSales) * 100) : 0}% collected
            </div>
          </div>

          {/* 3. Outstanding Balances */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Outstanding</span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-rose-600 font-mono tabular-nums">
              {formatCurrency(outstandingBalances)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Pending client receipts
            </div>
          </div>

          {/* 4. Total Bookings */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Bookings</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-neutral-900 font-mono tabular-nums">
              {formatCount(stats?.totalBookings)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Database records
            </div>
          </div>

          {/* 5. Total Agents */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Agents</span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-neutral-900 font-mono tabular-nums">
              {formatCount(stats?.totalAgents ?? agents.filter((a) => a.status === 'active').length)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {formatCount(agents.length)} registered
            </div>
          </div>

          {/* 6. Total Clients */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Clients</span>
              <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-neutral-900 font-mono tabular-nums">
              {formatCount(stats?.totalClients)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Client portfolio
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Operational Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-neutral-200/80 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <PlaneTakeoff className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
              {formatCount(stats?.upcomingDepartures)}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium">Upcoming Departures</div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
              {formatCount(stats?.pendingVisas)}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium">Pending Visas</div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
              {formatCount(stats?.totalInvoices)}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium">Total Invoices</div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
              {formatCount(stats?.cancelledBookings)}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium">Cancelled Files</div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Agent Performance Leaderboard + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Agent Performance Table */}
        <div className="lg:col-span-7 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                Agent Performance Leaderboard
              </h3>
              <p className="text-[11px] text-neutral-500">
                Sales, payments collected and pending balances by travel agent
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="pb-2.5 pl-1">Agent</th>
                  <th className="pb-2.5">Role</th>
                  <th className="pb-2.5 text-right">Bookings</th>
                  <th className="pb-2.5 text-right">Total Sales</th>
                  <th className="pb-2.5 text-right">Paid</th>
                  <th className="pb-2.5 text-right pr-1">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                {agentPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      No agent records found.
                    </td>
                  </tr>
                ) : (
                  agentPerformance.map((item) => (
                    <tr key={item.agent.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 pl-1">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-neutral-900 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {item.agent.avatar || item.agent.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900">{item.agent.name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">@{item.agent.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-[11px] text-neutral-500 font-medium">
                          {item.agent.role === 'senior_agent' ? 'Senior Manager' : 'Agent'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-neutral-800">
                        {item.bookingsCount}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums font-bold text-neutral-900">
                        £{item.totalSales.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums font-bold text-emerald-600">
                        £{item.paid.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums pr-1 text-rose-600 font-bold">
                        £{item.outstanding.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity & Upcoming Departures */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Departures Panel */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <PlaneTakeoff className="w-4 h-4 text-emerald-600" />
                <span>Next Upcoming Departures</span>
              </h3>
              <button
                onClick={() => onNavigateTab('upcoming-trips')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingDepartures.length === 0 ? (
                <div className="text-xs text-neutral-400 py-6 text-center bg-slate-50 rounded-xl border border-dashed border-neutral-200">
                  No upcoming departures scheduled yet.
                </div>
              ) : (
                upcomingDepartures.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onOpenBooking(b)}
                    className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-emerald-300 cursor-pointer transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-neutral-900">{b.customerName}</span>
                      <span className="font-mono text-[11px] text-amber-700 font-bold">{b.departureDate}</span>
                    </div>
                    <div className="text-[11px] text-neutral-600 truncate">{b.destination}</div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{b.flight?.airline || 'Scheduled Flight'} · {b.paxCount} Pax</span>
                      <span className="font-medium text-neutral-600">Agent: {b.agentName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Agent Activity Stream */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-3.5">Recent Agent Actions</h3>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-xs text-neutral-400 py-4 text-center">
                  All activity logs will appear here live as agents work.
                </div>
              ) : (
                activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-neutral-800">
                        <span className="font-bold text-neutral-900">{act.agentName}</span>{' '}
                        <span className="text-neutral-600">{act.details}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {act.action}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
