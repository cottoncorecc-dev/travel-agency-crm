'use client';

import React from 'react';
import {
  CalendarCheck,
  CreditCard,
  AlertCircle,
  PlaneTakeoff,
  TrendingUp,
  Plus,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Booking, Agent } from '@/types/crm';
import { formatCount, formatCurrency } from '@/lib/utils';

interface AgentDashboardProps {
  currentUser: Agent;
  bookings: Booking[];
  onOpenCreateBooking: () => void;
  onOpenBooking: (booking: Booking) => void;
  onNavigateTab: (tab: string) => void;
  onOpenInvoice: (booking: Booking) => void;
}

export default function AgentDashboard({
  currentUser,
  bookings = [],
  onOpenCreateBooking,
  onOpenBooking,
  onNavigateTab,
  onOpenInvoice,
}: AgentDashboardProps) {
  const isManager = currentUser.role === 'senior_agent';

  // Metrics calculated strictly from this agent's scoped bookings
  const totalSales = bookings.reduce((sum, b) => sum + (b.costing?.totalAmount || 0), 0);
  const paid = bookings.reduce((sum, b) => sum + (b.costing?.paidAmount || 0), 0);
  const outstanding = bookings.reduce((sum, b) => sum + (b.costing?.remainingAmount || 0), 0);
  const totalProfit = bookings.reduce((sum, b) => sum + (b.costing?.profitMargin || 0), 0);

  const nowStr = new Date().toISOString().split('T')[0];
  const upcomingTrips = bookings
    .filter((b) => (b.departureDate || '') >= nowStr && b.bookingStatus !== 'Cancelled')
    .sort((a, b) => (a.departureDate || '').localeCompare(b.departureDate || ''));

  const pendingVisas = bookings.filter((b) => b.visa?.status === 'Pending' || b.visa?.status === 'Under Review');

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>{isManager ? 'Team Manager Overview' : 'Agent Workspace'}</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Welcome back, {currentUser.name}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {isManager
              ? `Managing your assigned team and multi-agent bookings for ${currentUser.companyName || 'your company'}.`
              : 'Here is your current client portfolio, payment status, and upcoming travel departures.'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('my-bookings')}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            My Bookings
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

      {/* Agent KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Sales (Golden accent) */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">My Total Sales</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
            {formatCurrency(totalSales)}
          </div>
          {currentUser.permissions.canViewCosting ? (
            <div className="text-[11px] text-amber-700 font-semibold mt-1">
              {formatCurrency(totalProfit)} profit margin
            </div>
          ) : (
            <div className="text-[11px] text-neutral-400 mt-1">Gross portfolio sales</div>
          )}
        </div>

        {/* Payments Collected (Bright Green accent) */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Payments Collected</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {formatCurrency(paid)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {totalSales > 0 ? Math.round((paid / totalSales) * 100) : 0}% settled
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Outstanding Balance</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
            {formatCurrency(outstanding)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Pending client receipts
          </div>
        </div>

        {/* My Bookings */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Assigned Bookings</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
            {formatCount(bookings.length)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {formatCount(upcomingTrips.length)} upcoming departures
          </div>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Bookings Table */}
        <div className="lg:col-span-8 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Recent Assigned Bookings</h3>
              <p className="text-[11px] text-neutral-500">Manage client itineraries, payments, and invoices</p>
            </div>
            <button
              onClick={() => onNavigateTab('my-bookings')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="pb-2.5 pl-1">Ref</th>
                  <th className="pb-2.5">Lead Passenger</th>
                  <th className="pb-2.5">Destination</th>
                  <th className="pb-2.5 text-right">Amount</th>
                  <th className="pb-2.5 text-right">Status</th>
                  <th className="pb-2.5 text-right pr-1">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      No bookings created yet. Click &quot;New Booking&quot; to add your first client file!
                    </td>
                  </tr>
                ) : (
                  bookings.slice(0, 5).map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 pl-1 font-mono text-amber-700 font-bold">{b.bookingRef}</td>
                      <td className="py-3">
                        <div className="font-bold text-neutral-900">{b.customerName}</div>
                        <div className="text-[10px] text-neutral-400">{b.paxCount} Passengers</div>
                      </td>
                      <td className="py-3 text-neutral-600 truncate max-w-[200px]">{b.destination}</td>
                      <td className="py-3 text-right font-mono tabular-nums text-neutral-900 font-bold">
                        £{(b.costing?.totalAmount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.bookingStatus === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : b.bookingStatus === 'Completed'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : b.bookingStatus === 'Cancelled'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-1">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenInvoice(b)}
                            title="Generate or View Invoice"
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 transition-colors cursor-pointer"
                          >
                            Invoice
                          </button>
                          <button
                            onClick={() => onOpenBooking(b)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Upcoming Trips & Pending Visas */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Trips Card */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <PlaneTakeoff className="w-4 h-4 text-emerald-600" />
                <span>Upcoming Departures</span>
              </h3>
              <button
                onClick={() => onNavigateTab('upcoming-trips')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
              >
                All
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingTrips.length === 0 ? (
                <div className="text-xs text-neutral-400 py-6 text-center bg-slate-50 rounded-xl border border-dashed border-neutral-200">
                  No upcoming trips scheduled.
                </div>
              ) : (
                upcomingTrips.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenBooking(t)}
                    className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-emerald-300 cursor-pointer transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-neutral-900">{t.customerName}</span>
                      <span className="font-mono text-amber-700 font-bold">{t.departureDate}</span>
                    </div>
                    <div className="text-[11px] text-neutral-600 truncate">{t.destination}</div>
                    <div className="mt-1 text-[10px] text-neutral-400 flex items-center justify-between">
                      <span>{t.flight?.airline || 'Flight'} · {t.paxCount} Pax</span>
                      <span className="text-emerald-600 font-bold">{t.paymentStatus}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Visas Watchlist */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center justify-between">
              <span>Visa Processing Queue</span>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {pendingVisas.length} Pending
              </span>
            </h3>
            {pendingVisas.length === 0 ? (
              <div className="text-xs text-neutral-400 py-3 text-center">
                All client visas are up to date.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingVisas.map((pv) => (
                  <div key={pv.id} className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-neutral-900">
                      <span>{pv.customerName}</span>
                      <span className="text-amber-700 font-mono">{pv.visa?.count || 1} Visas</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">{pv.visa?.visaType || 'Umrah eVisa'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
