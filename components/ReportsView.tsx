'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Users,
  Award,
} from 'lucide-react';
import { Booking, Agent } from '@/types/crm';
import { formatCount, formatCurrency } from '@/lib/utils';

interface ReportsViewProps {
  bookings: Booking[];
  agents: Agent[];
  currentUser: Agent;
}

type TimeFilter = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

export default function ReportsView({
  bookings = [],
  agents = [],
  currentUser,
}: ReportsViewProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Date boundary calculation
  const now = new Date();
  const getFilterDates = (): { start: string; end: string } => {
    const endStr = now.toISOString().split('T')[0];
    if (timeFilter === 'today') {
      return { start: endStr, end: endStr };
    }
    if (timeFilter === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      return { start: monday.toISOString().split('T')[0], end: endStr };
    }
    if (timeFilter === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return { start: `${year}-${month}-01`, end: endStr };
    }
    if (timeFilter === 'this_year') {
      return { start: `${now.getFullYear()}-01-01`, end: endStr };
    }
    return { start: customStart || '2026-01-01', end: customEnd || endStr };
  };

  const { start, end } = getFilterDates();

  // Filter bookings by date
  const filteredBookings = bookings.filter((b) => {
    const d = b.createdAt ? b.createdAt.split('T')[0] : b.departureDate;
    if (!d) return true;
    if (timeFilter === 'today') return d === start;
    return d >= start && d <= end;
  });

  // Calculate per-agent performance metrics
  const activeAgents = agents.filter((a) => a.role !== 'super_admin');
  const performanceData = activeAgents
    .map((agent) => {
      const agtBookings = filteredBookings.filter((b) => b.agentId === agent.id);
      const bookingsCount = agtBookings.length;
      const totalSales = agtBookings.reduce((sum, b) => sum + (b.costing?.totalAmount || 0), 0);
      const paid = agtBookings.reduce((sum, b) => sum + (b.costing?.paidAmount || 0), 0);
      const outstanding = agtBookings.reduce((sum, b) => sum + (b.costing?.remainingAmount || 0), 0);
      const profit = agtBookings.reduce((sum, b) => sum + (b.costing?.profitMargin || 0), 0);
      const avgBookingValue = bookingsCount > 0 ? Math.round(totalSales / bookingsCount) : 0;

      return {
        agent,
        bookingsCount,
        totalSales,
        paid,
        outstanding,
        profit,
        avgBookingValue,
      };
    })
    .sort((a, b) => b.totalSales - a.totalSales);

  const totalSalesAll = performanceData.reduce((s, p) => s + p.totalSales, 0);
  const totalPaidAll = performanceData.reduce((s, p) => s + p.paid, 0);
  const totalOutstandingAll = performanceData.reduce((s, p) => s + p.outstanding, 0);
  const totalBookingsAll = performanceData.reduce((s, p) => s + p.bookingsCount, 0);

  const handleExportCSV = () => {
    const headers = ['Agent Name', 'Username', 'Role', 'Bookings', 'Total Sales (£)', 'Paid (£)', 'Outstanding (£)', 'Profit (£)'];
    const rows = performanceData.map((p) => [
      `"${p.agent.name}"`,
      p.agent.username,
      p.agent.role,
      p.bookingsCount,
      p.totalSales,
      p.paid,
      p.outstanding,
      p.profit,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `devntom_agent_performance_${timeFilter}_${start}_${end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Reports & Agent Performance Analytics</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Per agent financial breakdown: Bookings count, gross sales, payments received, and profit margins.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 px-3.5 py-2 rounded-lg text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Time Filter Segmented Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-neutral-200/80 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'this_year', label: 'This Year' },
            { id: 'custom', label: 'Custom Dates' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeFilter(t.id as TimeFilter)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                timeFilter === t.id
                  ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {timeFilter === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-900"
            />
            <span className="text-neutral-400 text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-900"
            />
          </div>
        )}

        <div className="text-xs text-neutral-500 font-mono">
          Period: <span className="text-emerald-700 font-bold">{start}</span> → <span className="text-emerald-700 font-bold">{end}</span>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Total Sales (Period)
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatCurrency(totalSalesAll)}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">Gross booking volume</div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Paid & Cleared
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
            {formatCurrency(totalPaidAll)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {totalSalesAll > 0 ? Math.round((totalPaidAll / totalSalesAll) * 100) : 0}% settled
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Outstanding Due
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1 tabular-nums">
            {formatCurrency(totalOutstandingAll)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Unpaid receivables</div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Total Bookings
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatCount(totalBookingsAll)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Created in timeframe</div>
        </div>
      </div>

      {/* Main Agent Performance Table */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Agent Performance Ledger</span>
          </h3>
          <span className="text-[11px] text-neutral-500 font-mono">
            {performanceData.length} Agents reporting
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/40 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Rank / Agent</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Bookings</th>
                <th className="py-3 px-4 text-right">Avg Booking Value</th>
                <th className="py-3 px-4 text-right">Total Sales</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-right">Profit Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
              {performanceData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No agent records found.
                  </td>
                </tr>
              ) : (
                performanceData.map((item, idx) => (
                  <tr key={item.agent.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-neutral-400 font-bold text-xs w-4">
                          #{idx + 1}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-neutral-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.agent.avatar || item.agent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-neutral-900">{item.agent.name}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">@{item.agent.username}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-600">
                      {item.agent.role === 'senior_agent' ? 'Senior Manager' : 'Agent'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-900 font-semibold">
                      {item.bookingsCount}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-700">
                      £{item.avgBookingValue.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                      £{item.totalSales.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-600">
                      £{item.paid.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-rose-600">
                      {item.outstanding > 0 ? (
                        `£${item.outstanding.toLocaleString()}`
                      ) : (
                        <span className="text-neutral-400 font-mono">£0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-amber-700">
                      £{item.profit.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
