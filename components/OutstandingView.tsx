'use client';

import React, { useState } from 'react';
import { AlertCircle, CreditCard, Search, MessageSquare, Phone, ArrowUpRight } from 'lucide-react';
import { Booking, Agent } from '@/types/crm';
import { formatCurrency } from '@/lib/utils';

interface OutstandingViewProps {
  bookings: Booking[];
  currentUser: Agent;
  onOpenRecordPayment: (b: Booking) => void;
  onOpenBooking: (b: Booking) => void;
  onOpenInvoice: (b: Booking) => void;
}

export default function OutstandingView({
  bookings = [],
  currentUser,
  onOpenRecordPayment,
  onOpenBooking,
  onOpenInvoice,
}: OutstandingViewProps) {
  const [search, setSearch] = useState('');

  const outstandingBookings = bookings.filter((b) => (b.costing?.remainingAmount || 0) > 0);
  const totalOutstanding = outstandingBookings.reduce((s, b) => s + (b.costing?.remainingAmount || 0), 0);

  const searchLower = search.toLowerCase();
  const filtered = outstandingBookings.filter(
    (b) =>
      (b.bookingRef || '').toLowerCase().includes(searchLower) ||
      (b.customerName || '').toLowerCase().includes(searchLower) ||
      (b.contactNumber || '').includes(search) ||
      (b.destination || '').toLowerCase().includes(searchLower)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Outstanding Client Receivables</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Pending booking balances requiring agent follow-up and settlement.
          </p>
        </div>
        <div className="bg-white border border-neutral-200/90 rounded-2xl px-5 py-2.5 text-right shadow-xs">
          <div className="text-[10px] uppercase font-bold text-neutral-400">Total Unpaid Balance</div>
          <div className="text-2xl font-bold font-mono text-rose-600 tabular-nums">
            {formatCurrency(totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search outstanding client records by name, ref, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Outstanding Table */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Travel Dates</th>
                <th className="py-3 px-4 text-right">Package Total</th>
                <th className="py-3 px-4 text-right">Paid So Far</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-emerald-700 font-bold">
                    ✓ Clean ledger! No outstanding payments pending on your assigned files.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700">{b.bookingRef}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900">{b.customerName}</div>
                      <div className="text-[10px] text-neutral-400">{b.destination}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-neutral-800">{b.contactNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                      {b.departureDate} → {b.returnDate}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-800 font-semibold">
                      £{(b.costing?.totalAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-600 font-bold">
                      £{(b.costing?.paidAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-rose-600 text-sm">
                      £{(b.costing?.remainingAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.whatsapp && (
                          <a
                            href={`https://wa.me/${b.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Remind via WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => onOpenInvoice(b)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                        >
                          Invoice
                        </button>
                        <button
                          onClick={() => onOpenRecordPayment(b)}
                          className="px-3 py-1 text-[11px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-neutral-950 shadow-sm transition-colors cursor-pointer"
                        >
                          Collect
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
    </div>
  );
}
