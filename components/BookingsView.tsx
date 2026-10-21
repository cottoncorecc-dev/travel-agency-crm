'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Receipt,
  Eye,
  ChevronDown,
  User,
  CreditCard,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Booking, Agent, BookingStatus, PaymentStatus } from '@/types/crm';
import { formatCount, formatCurrency } from '@/lib/utils';

interface BookingsViewProps {
  bookings: Booking[];
  agents: Agent[];
  currentUser: Agent;
  onOpenCreateBooking: () => void;
  onOpenBooking: (booking: Booking) => void;
  onDeleteBooking: (id: string) => Promise<void>;
  onOpenInvoice: (booking: Booking) => void;
  onOpenRecordPayment: (booking: Booking) => void;
  title?: string;
  isAgentScoped?: boolean;
}

export default function BookingsView({
  bookings = [],
  agents = [],
  currentUser,
  onOpenCreateBooking,
  onOpenBooking,
  onDeleteBooking,
  onOpenInvoice,
  onOpenRecordPayment,
  title = 'Master Bookings Register',
  isAgentScoped = false,
}: BookingsViewProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManager = currentUser.role === 'senior_agent';

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedDestination, setSelectedDestination] = useState('all');
  const [selectedBookingStatus, setSelectedBookingStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Extract distinct destinations
  const destinations = Array.from(new Set(bookings.map((b) => b.destination).filter(Boolean)));

  // Filtered Bookings
  const filtered = bookings.filter((b) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (b.bookingRef || '').toLowerCase().includes(q) ||
      (b.customerName || '').toLowerCase().includes(q) ||
      (b.destination || '').toLowerCase().includes(q) ||
      (b.contactNumber || '').includes(q) ||
      (b.amtNo || '').toLowerCase().includes(q) ||
      (b.profileNumber || '').toLowerCase().includes(q);

    const matchesAgent = selectedAgent === 'all' || b.agentId === selectedAgent;
    const matchesDestination = selectedDestination === 'all' || b.destination === selectedDestination;
    const matchesBookingStatus = selectedBookingStatus === 'all' || b.bookingStatus === selectedBookingStatus;
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || b.paymentStatus === selectedPaymentStatus;
    const matchesDate = !dateFilter || b.departureDate === dateFilter || (b.createdAt || '').startsWith(dateFilter);

    return (
      matchesSearch &&
      matchesAgent &&
      matchesDestination &&
      matchesBookingStatus &&
      matchesPaymentStatus &&
      matchesDate
    );
  });

  const totalAmountSum = filtered.reduce((s, b) => s + (b.costing?.totalAmount || 0), 0);
  const paidAmountSum = filtered.reduce((s, b) => s + (b.costing?.paidAmount || 0), 0);
  const remainingAmountSum = filtered.reduce((s, b) => s + (b.costing?.remainingAmount || 0), 0);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            <span>{title}</span>
          </h2>
          <p className="text-xs text-neutral-500">
            {isAgentScoped
              ? 'Comprehensive view of all your client reservations, itineraries, and costings.'
              : 'Enterprise registry of all bookings created across all agents and branches.'}
          </p>
        </div>
        <button
          onClick={onOpenCreateBooking}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs tracking-wide shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Booking</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
        {/* Row 1: Search & Date */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ref (BK-2026-101), client, profile #, AMT #, destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[10px] text-neutral-600 hover:text-neutral-900 px-2 py-1 bg-neutral-100 rounded border border-neutral-200 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Select Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-neutral-100">
          {/* Agent Filter (Admin / Manager) */}
          {(!isAgentScoped || isSuperAdmin || isManager) && (
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Filter by Agent
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
              >
                <option value="all">All Agents</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.username})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Destination Filter */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Destination
            </label>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            >
              <option value="all">All Destinations</option>
              {destinations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Booking Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Booking Status
            </label>
            <select
              value={selectedBookingStatus}
              onChange={(e) => setSelectedBookingStatus(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            >
              <option value="all">All Booking Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Departed">Departed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Payment Status
            </label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Summary Pill Bar */}
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 font-medium border-t border-neutral-100">
          <div>
            Showing <span className="text-neutral-900 font-bold">{formatCount(filtered.length)}</span> of {formatCount(bookings.length)} records
          </div>
          <div className="flex items-center gap-4 font-mono tabular-nums text-[11px]">
            <span>Total: <strong className="text-neutral-900">{formatCurrency(totalAmountSum)}</strong></span>
            <span>Paid: <strong className="text-emerald-600">{formatCurrency(paidAmountSum)}</strong></span>
            <span>Due: <strong className="text-rose-600">{formatCurrency(remainingAmountSum)}</strong></span>
          </div>
        </div>
      </div>

      {/* Bookings Data Table */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Client</th>
                {(!isAgentScoped || isSuperAdmin || isManager) && <th className="py-3 px-4">Agent</th>}
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Booking Status</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No bookings found in database. Click &quot;New Booking&quot; to create the first record!
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Booking Ref */}
                    <td className="py-3.5 px-4 font-mono">
                      <div
                        className="font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                        onClick={() => onOpenBooking(booking)}
                      >
                        {booking.bookingRef}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {booking.profileNumber} · {booking.amtNo}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900">{booking.customerName}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {booking.contactNumber} · {booking.paxCount} Pax
                      </div>
                    </td>

                    {/* Agent */}
                    {(!isAgentScoped || isSuperAdmin || isManager) && (
                      <td className="py-3.5 px-4">
                        <div className="text-neutral-900 font-medium">{booking.agentName}</div>
                        <div className="text-[10px] text-neutral-400">Assigned Agent</div>
                      </td>
                    )}

                    {/* Destination */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="truncate text-neutral-900 font-medium">{booking.destination}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {booking.departureDate} → {booking.returnDate}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <div className="font-bold text-neutral-900">
                        £{(booking.costing?.totalAmount ?? 0).toLocaleString()}
                      </div>
                      {(booking.costing?.remainingAmount ?? 0) > 0 && (
                        <div className="text-[10px] text-rose-600 font-bold">
                          Due: £{booking.costing.remainingAmount.toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Booking Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          booking.bookingStatus === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : booking.bookingStatus === 'Completed'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : booking.bookingStatus === 'Cancelled'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          booking.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : booking.paymentStatus === 'Partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {booking.paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View/Edit Details */}
                        <button
                          onClick={() => onOpenBooking(booking)}
                          title="View / Edit Booking Record"
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>

                        {/* Invoice */}
                        <button
                          onClick={() => onOpenInvoice(booking)}
                          title="View / Print Client Invoice"
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-amber-800 hover:bg-amber-50 border border-neutral-200 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        {/* Record Payment */}
                        {(booking.costing?.remainingAmount ?? 0) > 0 && (
                          <button
                            onClick={() => onOpenRecordPayment(booking)}
                            title="Record Payment"
                            className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Admin Delete */}
                        {(isSuperAdmin || currentUser.permissions.canDeleteBookings) && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently delete booking ${booking.bookingRef}?`)) {
                                onDeleteBooking(booking.id);
                              }
                            }}
                            title="Delete Booking (Admin Only)"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-700 hover:bg-rose-50 border border-neutral-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
